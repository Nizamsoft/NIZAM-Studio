// ==========================================================================
// NIZAM | Studio — Yedek (v0.336.0)
//
// İki iş yapar:
//   1) RAPOR  · nizam-yedek (GitHub Actions) her gece sonucunu buraya gönderir.
//              Başlık: x-yedek-anahtari = YEDEK_ANAHTARI (gerçek sır; yalnız
//              Supabase'te ve nizam-yedek'in GitHub gizli ayarlarında durur).
//              yedek_raporlari tablosuna yazılır. Sorun varsa yöneticilere
//              telefon bildirimi gider (hata bildirimlerine DÜŞMEZ).
//   2) BAŞLAT · Studio'da yönetici "Şimdi yedek al"a basınca gece yedeği
//              GitHub'da hemen başlatılır (workflow_dispatch).
//              GH_YEDEK_TOKEN: yalnız nizam-yedek reposunda "Actions: Read and
//              write" izinli ince ayarlı GitHub anahtarı.
//
//   3) LİSTE  · nizam-yedek gece başında hangi veritabanlarını yedekleyeceğini
//              buradan okur (yedek_ayarlari · acik). YEDEK_ANAHTARI ile.
//   4) AYARLAR· Studio'nun Son Yedekleme › Ayarlar sekmesi (yalnız yönetici):
//              ayarlar · ayar-kaydet · baglan. "baglan" bağlantı adresini
//              GitHub'ın açık anahtarıyla şifreleyip DB_<KOD> gizli ayarına
//              yazar; adres hiçbir yerde saklanmaz, geri okunmaz.
//              GH_YEDEK_TOKEN'da "Secrets: Read and write" izni de gerekir.
//
// Kurulum (TEK SEFER):
//   1) Supabase → Edge Functions → Deploy a new function → via editor
//      Ad: yedek · bu dosyayı yapıştır · Deploy
//   2) "Enforce JWT verification" KAPALI (raporu bir kullanıcı değil, GitHub
//      gönderiyor; başlatmada oturum burada ayrıca doğrulanıyor).
//   3) Edge Functions → Secrets:
//        YEDEK_ANAHTARI = uzun rastgele metin (nizam-yedek'teki ile aynı)
//        GH_YEDEK_TOKEN = GitHub anahtarı
// ==========================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import sodium from 'https://esm.sh/libsodium-wrappers@0.7.13';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-yedek-anahtari',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const yanit = (govde: unknown, kod = 200) =>
  new Response(JSON.stringify(govde), {
    status: kod,
    headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const hata = (mesaj: string, kod = 400) => yanit({ hata: mesaj }, kod);

const GITHUB_REPO = 'Nizamsoft/nizam-yedek';
const GITHUB_IS = 'gece-yedegi.yml';
const EN_BUYUK = 64_000;

/* Telefon bildirimi (Web Push) — hata-al ile aynı kod (tek dosya kurulduğu için kopya). */
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

const metin = (x: unknown, n: number) => String(x ?? '').slice(0, n);

/* GitHub API · GH_YEDEK_TOKEN ile. */
function gh(yontem: string, yol: string, govde?: unknown) {
  return fetch('https://api.github.com' + yol, {
    method: yontem,
    headers: {
      Authorization: `Bearer ${Deno.env.get('GH_YEDEK_TOKEN') ?? ''}`, Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'nizam-studio',
      ...(govde ? { 'Content-Type': 'application/json' } : {}),
    },
    body: govde ? JSON.stringify(govde) : undefined,
  });
}

Deno.serve(async (istek) => {
  if (istek.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (istek.method !== 'POST') return hata('Yalnızca POST.', 405);

  const ham = await istek.text();
  if (ham.length > EN_BUYUK) return hata('Çok büyük.', 413);
  let govde: Record<string, unknown>;
  try { govde = JSON.parse(ham || '{}'); } catch { return hata('İstek okunamadı.'); }

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // ---- 1) RAPOR · nizam-yedek'ten ---------------------------------------
  if (govde.islem === 'rapor') {
    const anahtar = Deno.env.get('YEDEK_ANAHTARI') ?? '';
    if (!anahtar || (istek.headers.get('x-yedek-anahtari') ?? '') !== anahtar) return hata('Yetkisiz.', 401);

    const tur = ['gece', 'deneme'].includes(String(govde.tur)) ? String(govde.tur) : 'gece';
    const durum = govde.durum === 'sorunlu' ? 'sorunlu' : 'tamam';
    const kalemler = (Array.isArray((govde.ayrinti as any)?.kalemler) ? (govde.ayrinti as any).kalemler : [])
      .slice(0, 80).map((k: any) => ({
        kod: metin(k?.kod, 40), ad: metin(k?.ad, 120), durum: metin(k?.durum, 20), ayrinti: metin(k?.ayrinti, 400),
      }));
    const sayi = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0) ? Math.round(x) : null;
    const satir = {
      tur, durum,
      ozet: metin(govde.ozet, 400),
      ayrinti: {
        kalemler, drive: metin((govde.ayrinti as any)?.drive, 20),
        repolar: (Array.isArray((govde.ayrinti as any)?.repolar) ? (govde.ayrinti as any).repolar : [])
          .map((x: unknown) => metin(x, 100)).filter((x: string) => /^[A-Za-z0-9._-]{1,100}$/.test(x)).slice(0, 500),
        drive_kullanilan: sayi((govde.ayrinti as any)?.drive_kullanilan),
        drive_toplam: sayi((govde.ayrinti as any)?.drive_toplam),
      },
    };
    const { error } = await db.from('yedek_raporlari').insert(satir);
    if (error) { console.error('yedek raporu yazılamadı', error.message); return hata('Kaydedilemedi.', 500); }

    if (durum === 'sorunlu') {
      try { await yoneticilereHaber(db, satir.ozet); }
      catch (h) { console.error('telefon bildirimi gitmedi', (h as Error).message); }
    }
    return yanit({ tamam: true }, 201);
  }

  // ---- LİSTE · nizam-yedek gece başında okur ----------------------------
  if (govde.islem === 'liste') {
    const anahtar = Deno.env.get('YEDEK_ANAHTARI') ?? '';
    if (!anahtar || (istek.headers.get('x-yedek-anahtari') ?? '') !== anahtar) return hata('Yetkisiz.', 401);
    const { data, error } = await db.from('yedek_ayarlari').select('*').order('kod');
    if (error) return hata('Liste okunamadı.', 500);
    return yanit({ liste: (data ?? []).map(r => ({
      kod: r.kod, ad: r.ad, studio_proje: r.proje_id || '', acik: !!r.acik, haric: Array.isArray(r.haric) ? r.haric : [],
    })) });
  }

  // ---- Bundan sonrası Studio'dan, yalnız yönetici ------------------------
  const yetki = istek.headers.get('Authorization') ?? '';
  if (!yetki) return hata('Oturum yok.', 401);
  const kullaniciDb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: yetki } },
  });
  const { data: oturum, error: oHata } = await kullaniciDb.auth.getUser();
  if (oHata || !oturum?.user) return hata('Oturum geçersiz.', 401);
  const { data: profil } = await db.from('profiles').select('rol, aktif').eq('id', oturum.user.id).maybeSingle();
  if (!profil || !profil.aktif || profil.rol !== 'yonetici') return hata('Bu işlem için yönetici olman gerekiyor.', 403);

  // ---- AYARLAR · liste + hangi kodun bağlantısı GitHub'da var -------------
  if (govde.islem === 'ayarlar') {
    const { data: ayarlar, error } = await db.from('yedek_ayarlari').select('*').order('kod');
    if (error) return hata('Ayarlar okunamadı (sql/50 çalıştırıldı mı?).', 500);
    let bagli: string[] = [];
    let ghHata = '';
    const r = await gh('GET', `/repos/${GITHUB_REPO}/actions/secrets?per_page=100`);
    if (r.status === 200) {
      bagli = ((await r.json()).secrets || []).map((s: { name: string }) => s.name)
        .filter((n: string) => n.startsWith('DB_')).map((n: string) => n.slice(3));
    } else ghHata = 'GitHub gizli ayarları okunamadı (' + r.status + '). GitHub anahtarına "Secrets: Read and write" izni verilmeli.';
    return yanit({ ayarlar: ayarlar ?? [], bagli, ghHata });
  }

  // ---- AYAR KAYDET · aç/kapa (listede yoksa ekler) ------------------------
  if (govde.islem === 'ayar-kaydet') {
    const kod = String(govde.kod || '').toUpperCase();
    if (!/^[A-Z0-9_]{2,40}$/.test(kod)) return hata('Geçersiz kod.');
    const satir: Record<string, unknown> = { kod, acik: !!govde.acik, guncellendi: new Date().toISOString() };
    if (govde.ad) satir.ad = metin(govde.ad, 120);
    if (govde.proje_id) satir.proje_id = metin(govde.proje_id, 36);
    if (Array.isArray(govde.haric)) {
      satir.haric = (govde.haric as unknown[]).map(x => metin(x, 100)).filter(x => /^[A-Za-z0-9._-]{1,100}$/.test(x)).slice(0, 500);
    }
    const { error } = await db.from('yedek_ayarlari').upsert(satir, { onConflict: 'kod' });
    if (error) return hata('Kaydedilemedi.', 500);
    return yanit({ tamam: true });
  }

  // ---- BAĞLAN · adres şifrelenip GitHub'a, açık olarak listeye ------------
  if (govde.islem === 'baglan') {
    const kod = String(govde.kod || '').toUpperCase();
    if (!/^[A-Z0-9_]{2,40}$/.test(kod)) return hata('Geçersiz kod.');
    const adres = String(govde.adres || '').trim();
    if (/\[YOUR-PASSWORD\]/i.test(adres)) return hata('Adresteki [YOUR-PASSWORD] yerine veritabanı şifresini yaz.');
    if (/@db\.[a-z0-9]+\.supabase\.co(:|\/)/i.test(adres))
      return hata('Bu "Direct connection" adresi; yedek sunucusu buna ulaşamaz. Supabase › Connect › Method: "Session pooler" adresini yapıştır (…pooler.supabase.com ile biter).');
    if (adres.length > 600 || !/^postgres(ql)?:\/\/[^\s:@\/]+:[^\s@]+@[^\s:\/]+:\d{2,5}\/[A-Za-z0-9_]+(\?\S*)?$/.test(adres))
      return hata('Adres beklenen biçimde değil: postgresql://kullanıcı:şifre@sunucu:5432/postgres');

    const k = await gh('GET', `/repos/${GITHUB_REPO}/actions/secrets/public-key`);
    if (k.status !== 200) return hata('GitHub anahtarı alınamadı (' + k.status + '). GitHub anahtarına "Secrets: Read and write" izni verilmeli.', 502);
    const { key, key_id } = await k.json();
    await sodium.ready;
    const sifreli = sodium.to_base64(
      sodium.crypto_box_seal(sodium.from_string(adres), sodium.from_base64(key, sodium.base64_variants.ORIGINAL)),
      sodium.base64_variants.ORIGINAL);
    const p = await gh('PUT', `/repos/${GITHUB_REPO}/actions/secrets/DB_${kod}`, { encrypted_value: sifreli, key_id });
    if (p.status !== 201 && p.status !== 204) return hata('GitHub gizli ayarı yazılamadı (' + p.status + ').', 502);

    const satir: Record<string, unknown> = { kod, acik: true, guncellendi: new Date().toISOString() };
    if (govde.ad) satir.ad = metin(govde.ad, 120);
    if (govde.proje_id) satir.proje_id = metin(govde.proje_id, 36);
    await db.from('yedek_ayarlari').upsert(satir, { onConflict: 'kod' });
    return yanit({ tamam: true });
  }

  // ---- 2) BAŞLAT · Studio'dan, yalnız yönetici --------------------------
  if (govde.islem === 'baslat') {

    /* Son 10 dakikada başlatıldıysa ikinci kez başlatma. */
    const onDk = new Date(Date.now() - 600_000).toISOString();
    const { data: son } = await db.from('yedek_raporlari').select('id')
      .eq('tur', 'elle').gte('olusturuldu', onDk).limit(1);
    if (son && son.length) return hata('Yedek az önce başlatıldı; birkaç dakika içinde biter.', 409);

    if (!Deno.env.get('GH_YEDEK_TOKEN')) return hata('GitHub anahtarı (GH_YEDEK_TOKEN) kurulmamış.', 500);
    const r = await gh('POST', `/repos/${GITHUB_REPO}/actions/workflows/${GITHUB_IS}/dispatches`, { ref: 'main' });
    if (r.status !== 204) {
      const t = await r.text();
      console.error('GitHub başlatma', r.status, t.slice(0, 300));
      return hata('GitHub yedeği başlatamadı (' + r.status + ').', 502);
    }
    await db.from('yedek_raporlari').insert({
      tur: 'elle', durum: 'basladi', ozet: 'Elle başlatıldı', kim: oturum.user.id,
    });
    return yanit({ tamam: true });
  }

  return hata('Bilinmeyen işlem.');
});

/* Sorunlu yedek → aktif yöneticilerin cihazlarına tek bildirim. "Hata
   bildirimleri"ni kapatan yönetici bunu da almaz (aynı tercih). */
async function yoneticilereHaber(db: ReturnType<typeof createClient>, ozet: string) {
  const { data: yoneticiler } = await db.from('profiles').select('id').eq('rol', 'yonetici').eq('aktif', true);
  const idler = (yoneticiler ?? []).map(y => y.id as string);
  if (!idler.length) return;
  const { data: tercihler } = await db.from('bildirim_tercih').select('kullanici, kapali').in('kullanici', idler);
  const kapatan = new Set((tercihler ?? [])
    .filter(t => Array.isArray(t.kapali) && t.kapali.includes('hata')).map(t => t.kullanici as string));
  const acik = idler.filter(k => !kapatan.has(k));
  if (!acik.length) return;
  const { data: aboneler } = await db.from('push_abonelik').select('endpoint, p256dh, auth, kullanici').in('kullanici', acik);
  if (!aboneler || !aboneler.length) return;
  const { data: vapid } = await db.from('push_anahtar').select('ozel, genel').eq('id', 1).maybeSingle();
  if (!vapid) return;
  const icerik = JSON.stringify({
    tip: 'yedek', baslik: 'Yedek · sorun var',
    metin: ozet.length > 300 ? ozet.slice(0, 300) + '…' : ozet,
    adres: '#/panel', etiket: 'yedek',
  });
  await Promise.all(aboneler.map(async (a) => {
    try {
      const d = await pushGonder(a, icerik, vapid as { ozel: JsonWebKey; genel: string });
      if (d === 404 || d === 410) await db.from('push_abonelik').delete().eq('endpoint', a.endpoint);
    } catch { /* tek cihazın hatası ötekileri durdurmasın */ }
  }));
}
