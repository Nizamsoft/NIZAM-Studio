// ==========================================================================
// NIZAM | Studio — Mesaj bildirimi (Web Push)
//
// Studio kapalıyken gelen mesaj telefona bildirim olarak düşsün diye.
// Gönderen mesajı kaydedince uygulaması bu fonksiyonu çağırır; fonksiyon
// mesajın gerçekten ondan olduğunu doğrular ve alıcının cihazlarına
// bildirimi yollar.
//
// Ek paket yok: şifreleme ve imza tarayıcı standardı WebCrypto ile burada
// yapılıyor (RFC 8291 + RFC 8292). Bildirim anahtarı (VAPID) ilk çağrıda
// kendiliğinden üretilip `push_anahtar` tablosunda saklanıyor — elle gizli
// değer girmek gerekmiyor.
//
// Kurulum (TEK SEFER):
//   1) Supabase → SQL Editor → sql/46-bildirimler.sql → Run
//   2) Supabase → Edge Functions → Deploy a new function → via editor
//      Ad: bildirim-gonder · bu dosyayı yapıştır · Deploy
//      ("Enforce JWT verification" AÇIK kalsın.)
// ==========================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const yanit = (govde: unknown, kod = 200) =>
  new Response(JSON.stringify(govde), {
    status: kod,
    headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const hata = (mesaj: string, kod = 400) => yanit({ hata: mesaj }, kod);

/* Apple ve Google, bildirimi gönderenin bir iletişim adresi ister. */
const ILETISIM = Deno.env.get('PUSH_ILETISIM') || 'mailto:nizamsoft@icloud.com';

// --- WEB PUSH BAŞLANGIÇ ---------------------------------------------------

const yazi = new TextEncoder();

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
  const bas = b64u(yazi.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const govde = b64u(yazi.encode(JSON.stringify({
    aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: ILETISIM,
  })));
  const k = await crypto.subtle.importKey('jwk', ozel, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const imza = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, k, yazi.encode(bas + '.' + govde));
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
  const anahtarBilgi = birlestir(yazi.encode('WebPush: info\0'), uaGenel, asGenel, new Uint8Array([1]));
  const ikm = await hmac(prkAnahtar, anahtarBilgi);

  const tuz = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(tuz, ikm);
  const cek = (await hmac(prk, birlestir(yazi.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, birlestir(yazi.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12);

  const aes = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const acik = birlestir(yazi.encode(metin), new Uint8Array([2]));
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

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

Deno.serve(async (istek) => {
  if (istek.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (istek.method !== 'POST') return hata('Yalnızca POST.', 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const servis = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;

  // 1) İsteği yapan kim? -------------------------------------------------
  const yetki = istek.headers.get('Authorization') ?? '';
  if (!yetki) return hata('Oturum yok.', 401);
  const kullaniciDb = createClient(url, anon, { global: { headers: { Authorization: yetki } } });
  const { data: oturum, error: oturumHata } = await kullaniciDb.auth.getUser();
  if (oturumHata || !oturum?.user) return hata('Oturum geçersiz.', 401);
  const ben = oturum.user.id;

  const db = createClient(url, servis);

  let v: Record<string, unknown> = {};
  try { v = await istek.json(); } catch { return hata('İstek okunamadı.'); }

  // 2) Anahtar: yoksa üret, varsa oku ------------------------------------
  const anahtarAl = async () => {
    const { data } = await db.from('push_anahtar').select('ozel, genel').eq('id', 1).maybeSingle();
    if (data) return data as { ozel: JsonWebKey; genel: string };
    const yeni = await vapidUret();
    /* Aynı anda iki istek gelirse ikisi de üretmeye kalkar; tabloya ilk
       yazan kazanır, öbürü kazananı okur. */
    await db.from('push_anahtar').insert({ id: 1, ozel: yeni.ozel, genel: yeni.genel });
    const { data: son } = await db.from('push_anahtar').select('ozel, genel').eq('id', 1).single();
    return son as { ozel: JsonWebKey; genel: string };
  };

  if (v.islem === 'anahtar') {
    const a = await anahtarAl();
    return yanit({ anahtar: a.genel });
  }

  if (v.islem !== 'gonder') return hata('Bilinmeyen işlem.');

  // 3) Mesaj gerçekten bu kişiden mi, yeni mi? ---------------------------
  const id = typeof v.mesaj === 'string' ? v.mesaj : '';
  if (!UUID.test(id)) return hata('Mesaj kimliği geçersiz.');

  /* Tek seferlik: "bildirildi" boşsa doldurup satırı alıyoruz. İkinci
     çağrı satır bulamaz, aynı bildirim iki kez gitmez. */
  const { data: mesaj } = await db.from('messages')
    .update({ bildirildi: new Date().toISOString() })
    .eq('id', id).eq('gonderen', ben).is('bildirildi', null)
    .gt('olusturuldu', new Date(Date.now() - 10 * 60 * 1000).toISOString())
    .select('id, gonderen, alici, metin')
    .maybeSingle();
  if (!mesaj) return yanit({ gonderildi: 0 });

  const [{ data: profil }, { count }, { data: aboneler }] = await Promise.all([
    db.from('profiles').select('ad').eq('id', ben).maybeSingle(),
    db.from('messages').select('id', { count: 'exact', head: true })
      .eq('alici', mesaj.alici).is('okundu', null),
    db.from('push_abonelik').select('endpoint, p256dh, auth').eq('kullanici', mesaj.alici),
  ]);
  if (!aboneler || !aboneler.length) return yanit({ gonderildi: 0 });

  const metin = String(mesaj.metin || '');
  const icerik = JSON.stringify({
    tip: 'mesaj',
    id: mesaj.id,
    kisi: ben,
    baslik: (profil && profil.ad) || 'Yeni mesaj',
    metin: metin.length > 400 ? metin.slice(0, 400) + '…' : metin,
    rozet: count || 0,
  });

  // 4) Gönder; artık geçersiz olan cihazları sil -------------------------
  const vapid = await anahtarAl();
  let gonderildi = 0;
  await Promise.all(aboneler.map(async (a) => {
    try {
      const durum = await pushGonder(a, icerik, vapid);
      if (durum >= 200 && durum < 300) gonderildi++;
      else if (durum === 404 || durum === 410) {
        await db.from('push_abonelik').delete().eq('endpoint', a.endpoint);
      }
    } catch { /* tek cihazın hatası ötekileri durdurmasın */ }
  }));

  return yanit({ gonderildi });
});
