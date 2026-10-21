// ==========================================================================
// NIZAM | Studio — Hata bildirimi alma
//
// Müşterinin kullandığı programdaki "Hata bildir" formu gönderilince, programın
// TARAYICISI bu adrese POST atar. Tüm programlar AYNI adresi ve AYNI sabit
// erişim kodunu kullanır (tek kurulum). Her program kendi Studio proje
// UUID'sini (`proje`) gönderir; bildirim o projeyle eşlenir.
//
// GÜVENLİK NOTU: Buradaki "sabit kod" (RAPOR_ANAHTARI) programın içinde
// durduğu için GERÇEK BİR SIR DEĞİLDİR — yalnız rastgele botları eler. Asıl
// koruma: (1) proje UUID'si Studio'da gerçekten varsa kabul edilir, (2) saatlik
// ve boyut sınırı, (3) tabloya yalnız bu fonksiyon yazar (RLS ekleme kapalı).
//
// Kurulum (TEK SEFER):
//   1) Supabase → Edge Functions → Deploy a new function → via editor
//      Ad: hata-al · bu dosyayı yapıştır · Deploy
//   2) Fonksiyon ayarlarında "Enforce JWT verification" KAPALI olmalı
//      (isteği bir kullanıcı değil, programın kendisi yapıyor).
//   3) Edge Functions → Secrets → RAPOR_ANAHTARI = <config.js'teki RAPOR.anahtar
//      ile BİREBİR aynı uzun metin>.
// ==========================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-rapor-anahtari',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const yanit = (govde: unknown, kod = 200) =>
  new Response(JSON.stringify(govde), {
    status: kod,
    headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const hata = (mesaj: string, kod = 400) => yanit({ hata: mesaj }, kod);

const EN_BUYUK = 64_000;           // gövde sınırı (bayt)
const SAATLIK_SINIR = 300;         // saatte en fazla bu kadar yeni bildirim
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

/* Telefon bildirimi (Web Push) — bildirim-gonder fonksiyonuyla aynı kod.
   Editörden tek dosya kurulduğu için paylaşılamıyor, kopyası burada.
   Anahtar ve cihaz kayıtları sql/46-bildirimler.sql tablolarında. */
const ILETISIM = Deno.env.get('PUSH_ILETISIM') || 'mailto:nizamsoft@icloud.com';

// --- WEB PUSH BAŞLANGIÇ ---------------------------------------------------

const kodla = new TextEncoder();

function b64u(veri: ArrayBuffer | Uint8Array): string {
  const b = veri instanceof Uint8Array ? veri : new Uint8Array(veri);
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64uCoz(s: string): Uint8Array {
  const t = s.replace(/-/g, '+').replace(/_/g, '/');
  const ham = atob(t + '==='.slice((t.length + 3) % 4));
  const b = new Uint8Array(ham.length);
  for (let i = 0; i < ham.length; i++) b[i] = ham.charCodeAt(i);
  return b;
}

function birlestir(...parcalar: Uint8Array[]): Uint8Array {
  const n = parcalar.reduce((t, p) => t + p.length, 0);
  const s = new Uint8Array(n);
  let i = 0;
  for (const p of parcalar) { s.set(p, i); i += p.length; }
  return s;
}

async function hmac(anahtar: Uint8Array, veri: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', anahtar, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, veri));
}

/* Yeni VAPID anahtar çifti: özel kısım JWK, genel kısım tarayıcının
   istediği ham 65 baytlık biçimde. */
async function vapidUret(): Promise<{ ozel: JsonWebKey; genel: string }> {
  const cift = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const ozel = await crypto.subtle.exportKey('jwk', cift.privateKey);
  const genel = b64u(await crypto.subtle.exportKey('raw', cift.publicKey));
  return { ozel, genel };
}

/* Bildirim servisine "bu istek bizden" diyen imzalı kimlik (RFC 8292). */
async function vapidBasligi(adres: string, ozel: JsonWebKey, genel: string): Promise<string> {
  const aud = new URL(adres).origin;
  const bas = b64u(kodla.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const govde = b64u(kodla.encode(JSON.stringify({
    aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: ILETISIM,
  })));
  const k = await crypto.subtle.importKey('jwk', ozel, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const imza = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, k, kodla.encode(bas + '.' + govde));
  return `vapid t=${bas}.${govde}.${b64u(imza)}, k=${genel}`;
}

/* İçeriği yalnız alıcının cihazı açabilsin diye şifreleme (RFC 8291,
   aes128gcm). Bildirim servisi (Apple/Google) mesajı okuyamaz. */
async function sifrele(metin: string, p256dh: string, auth: string): Promise<Uint8Array> {
  const uaGenel = b64uCoz(p256dh);
  const gizli = b64uCoz(auth);

  const gecici = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asGenel = new Uint8Array(await crypto.subtle.exportKey('raw', gecici.publicKey));
  const uaAnahtar = await crypto.subtle.importKey('raw', uaGenel, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ortak = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaAnahtar }, gecici.privateKey, 256));

  const prkAnahtar = await hmac(gizli, ortak);
  const anahtarBilgi = birlestir(kodla.encode('WebPush: info\0'), uaGenel, asGenel, new Uint8Array([1]));
  const ikm = await hmac(prkAnahtar, anahtarBilgi);

  const tuz = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(tuz, ikm);
  const cek = (await hmac(prk, birlestir(kodla.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, birlestir(kodla.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12);

  const aes = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const acik = birlestir(kodla.encode(metin), new Uint8Array([2]));
  const kapali = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, acik));

  const rs = new Uint8Array([0, 0, 0x10, 0]); // kayıt boyu 4096
  return birlestir(tuz, rs, new Uint8Array([asGenel.length]), asGenel, kapali);
}

async function pushGonder(
  abone: { endpoint: string; p256dh: string; auth: string },
  icerik: string,
  vapid: { ozel: JsonWebKey; genel: string },
): Promise<number> {
  const govde = await sifrele(icerik, abone.p256dh, abone.auth);
  const cevap = await fetch(abone.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await vapidBasligi(abone.endpoint, vapid.ozel, vapid.genel),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: '86400',
      Urgency: 'high',
    },
    body: govde,
  });
  try { await cevap.body?.cancel(); } catch { /* boş */ }
  return cevap.status;
}

// --- WEB PUSH BİTİŞ -------------------------------------------------------

const yazi = (v: unknown, sinir: number) =>
  (typeof v === 'string' ? v : '').trim().slice(0, sinir);

Deno.serve(async (istek) => {
  if (istek.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (istek.method !== 'POST') return hata('Yalnızca POST.', 405);

  const anahtar = Deno.env.get('RAPOR_ANAHTARI') ?? '';
  if (anahtar.length < 16) return hata('Rapor anahtarı kurulmamış.', 503);
  if ((istek.headers.get('x-rapor-anahtari') ?? '') !== anahtar) {
    return hata('Erişim kodu geçersiz.', 401);
  }

  // 1) Boyut --------------------------------------------------------------
  const uzunluk = Number(istek.headers.get('content-length') ?? '0');
  if (uzunluk > EN_BUYUK) return hata('İstek çok büyük.', 413);
  const govde = await istek.text();
  if (govde.length > EN_BUYUK) return hata('İstek çok büyük.', 413);

  let v: Record<string, unknown>;
  try { v = JSON.parse(govde); } catch { return hata('İstek okunamadı.'); }

  // 2) Tek bildirim ya da { bildirimler: [...] } (çevrimdışı toplu gönderim) --
  const gelen = Array.isArray(v.bildirimler) ? v.bildirimler.slice(0, 25) : [v];
  const ham = gelen.map((b: Record<string, unknown>) => {
    const gonderildi = Number(b?.gonderildi);
    return {
      id: yazi(b?.id, 36),
      proje: yazi(b?.proje, 36),
      mesaj: yazi(b?.mesaj, 4000),
      ekran: yazi(b?.ekran, 200),
      surum: yazi(b?.surum, 40),
      iletisim: yazi(b?.iletisim, 200),
      tarayici: yazi(b?.tarayici, 300),
      gonderildi: Number.isFinite(gonderildi) && gonderildi > 0
        ? new Date(gonderildi).toISOString() : new Date().toISOString(),
    };
  }).filter(b => UUID.test(b.id) && UUID.test(b.proje) && b.mesaj);
  if (!ham.length) return hata('Geçerli bildirim yok (proje UUID ve mesaj gerekli).');

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // 3) Proje UUID'leri gerçekten var mı? Sahte id'lere kapalı. ------------
  const projeIdler = [...new Set(ham.map(b => b.proje))];
  const { data: projeler, error: pHata } = await db.from('projects')
    .select('id, firma').in('id', projeIdler);
  if (pHata) {
    console.error('projeler okunamadı', pHata.message);
    return hata('Bildirim kaydedilemedi.', 500);
  }
  const projeAd = new Map((projeler ?? []).map(p => [p.id as string, (p.firma as string) || '']));

  const satirlar = ham
    .filter(b => projeAd.has(b.proje))
    .map(b => ({
      id: b.id,
      proje_id: b.proje,
      proje_ad: projeAd.get(b.proje) ?? '',
      durum: 'yeni',
      mesaj: b.mesaj,
      ekran: b.ekran,
      surum: b.surum,
      iletisim: b.iletisim,
      tarayici: b.tarayici,
      gonderildi: b.gonderildi,
    }));
  if (!satirlar.length) return hata('Proje bulunamadı.', 404);

  // 4) Zaten kayıtlı olanları ayır ---------------------------------------
  const { data: kayitli, error: okHata } = await db.from('hata_bildirimleri')
    .select('id').in('id', satirlar.map(s => s.id));
  if (okHata) {
    console.error('bildirim okunamadı', okHata.message);
    return hata('Bildirim kaydedilemedi.', 500);
  }
  const varOlan = new Set((kayitli ?? []).map(x => x.id));
  const yeniler = satirlar.filter(s => !varOlan.has(s.id));
  if (!yeniler.length) return yanit({ tamam: true, yeni: 0 });

  // 5) Saatlik sınır — kod sızsa bile tabloyu doldurmasın ----------------
  const birSaatOnce = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await db.from('hata_bildirimleri')
    .select('id', { count: 'exact', head: true })
    .gte('olusturuldu', birSaatOnce);
  if ((count ?? 0) + yeniler.length > SAATLIK_SINIR) return hata('Çok fazla bildirim geldi.', 429);

  // 6) Yaz ----------------------------------------------------------------
  const { error } = await db.from('hata_bildirimleri')
    .upsert(yeniler, { onConflict: 'id', ignoreDuplicates: true });
  if (error) {
    console.error('bildirim yazılamadı', error.message);
    return hata('Bildirim kaydedilemedi.', 500);
  }

  // 7) Yöneticilere telefon bildirimi -----------------------------------
  //    Bildirim gitmese de kayıt tamam; hata burada yutuluyor.
  try { await yoneticilereHaber(db, yeniler); }
  catch (h) { console.error('telefon bildirimi gitmedi', (h as Error).message); }

  return yanit({ tamam: true, yeni: yeniler.length }, 201);
});

/* Hata bildirimi telefona: aktif yöneticilerden "Hata bildirimleri"ni
   kapatmamış olanların cihazlarına. Birden çok hata aynı anda geldiyse
   tek özet bildirim gider. Tablolar yoksa (SQL çalıştırılmadıysa) sessizce
   geçer. */
async function yoneticilereHaber(
  db: ReturnType<typeof createClient>,
  yeniler: { id: string; proje_ad: string; mesaj: string }[],
) {
  const { data: yoneticiler } = await db.from('profiles')
    .select('id').eq('rol', 'yonetici').eq('aktif', true);
  const idler = (yoneticiler ?? []).map(y => y.id as string);
  if (!idler.length) return;

  const { data: tercihler } = await db.from('bildirim_tercih')
    .select('kullanici, kapali').in('kullanici', idler);
  const kapatan = new Set((tercihler ?? [])
    .filter(t => Array.isArray(t.kapali) && t.kapali.includes('hata'))
    .map(t => t.kullanici as string));
  const acik = idler.filter(k => !kapatan.has(k));
  if (!acik.length) return;

  const { data: aboneler } = await db.from('push_abonelik')
    .select('endpoint, p256dh, auth, kullanici').in('kullanici', acik);
  if (!aboneler || !aboneler.length) return;

  const { data: vapid } = await db.from('push_anahtar').select('ozel, genel').eq('id', 1).maybeSingle();
  if (!vapid) return;   // anahtar, ilk "Bildirimleri aç"ta bildirim-gonder tarafından üretilir

  const tek = yeniler.length === 1 ? yeniler[0] : null;
  const ilk = yeniler[0];
  const metin = String(ilk.mesaj || '');
  const icerik = (tek
    ? {
        tip: 'hata', id: tek.id,
        baslik: 'Hata · ' + (tek.proje_ad || 'Proje'),
        metin: metin.length > 300 ? metin.slice(0, 300) + '…' : metin,
        adres: '#/hatalar/' + tek.id, etiket: 'hata-' + tek.id,
      }
    : {
        tip: 'hata',
        baslik: yeniler.length + ' yeni hata bildirimi',
        metin: (ilk.proje_ad ? ilk.proje_ad + ': ' : '') + (metin.length > 200 ? metin.slice(0, 200) + '…' : metin),
        adres: '#/hatalar', etiket: 'hata',
      }) as Record<string, unknown>;

  /* Her yöneticinin simgesindeki sayı ayrı (sql/48 yoksa sayı gitmez). */
  const metinler = new Map<string, string>();
  for (const k of acik) {
    const { data: rozet, error: rHata } = await db.rpc('rozet_sayisi', { p_kisi: k });
    metinler.set(k, JSON.stringify(!rHata && typeof rozet === 'number' ? { ...icerik, rozet } : icerik));
  }

  await Promise.all(aboneler.map(async (a) => {
    try {
      const d = await pushGonder(a, metinler.get(a.kullanici as string)!, vapid as { ozel: JsonWebKey; genel: string });
      if (d === 404 || d === 410) await db.from('push_abonelik').delete().eq('endpoint', a.endpoint);
    } catch { /* tek cihazın hatası ötekileri durdurmasın */ }
  }));
}
