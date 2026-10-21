// ==========================================================================
// NIZAM | Studio — Mesaj bildirimi (Web Push)
//
// Studio kapalıyken telefona bildirim düşsün diye. Üç konu var:
//   • mesaj — yeni mesaj alıcıya
//   • gorev — görev verildi / onaya gönderildi / onaylandı / geri gönderildi
//   • hata  — müşteri programından gelen hata (o kısım hata-al fonksiyonunda)
// Uygulama kaydı yaptıktan sonra bu fonksiyonu çağırır; fonksiyon kaydın
// gerçekten çağırandan geldiğini doğrular, alıcıları bulur, kişinin
// Ayarlar'da kapattığı konulara hiç göndermez.
//
// Ek paket yok: şifreleme ve imza tarayıcı standardı WebCrypto ile burada
// yapılıyor (RFC 8291 + RFC 8292). Bildirim anahtarı (VAPID) ilk çağrıda
// kendiliğinden üretilip `push_anahtar` tablosunda saklanıyor — elle gizli
// değer girmek gerekmiyor.
//
// Kurulum (TEK SEFER):
//   1) Supabase → SQL Editor → sql/46-bildirimler.sql ve sql/47-bildirim-konulari.sql → Run
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

/* Görev hareketlerinin bildirimdeki karşılığı — Studio'daki zil listesiyle aynı. */
const GOREV_BASLIK: Record<string, string> = {
  olusturuldu: 'yeni bir görev verdi',
  atandi:      'görevi sana aktardı',
  bitirdi:     'görevi onaya gönderdi',
  onaylandi:   'görevi onayladı',
  geri:        'görevi geri gönderdi',
  baslandi:    'görevi yeniden açtı',
};

const ON_DAKIKA = () => new Date(Date.now() - 10 * 60 * 1000).toISOString();
const kisalt = (m: string, n = 400) => (m.length > n ? m.slice(0, n) + '…' : m);

type Vapid = { ozel: JsonWebKey; genel: string };
type Icerik = {
  tip: string; baslik: string; metin: string;
  adres?: string; etiket?: string; kisi?: string; rozet?: number; id?: string;
};

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
  const anahtarAl = async (): Promise<Vapid> => {
    const { data } = await db.from('push_anahtar').select('ozel, genel').eq('id', 1).maybeSingle();
    if (data) return data as Vapid;
    const yeni = await vapidUret();
    /* Aynı anda iki istek gelirse ikisi de üretmeye kalkar; tabloya ilk
       yazan kazanır, öbürü kazananı okur. */
    await db.from('push_anahtar').insert({ id: 1, ozel: yeni.ozel, genel: yeni.genel });
    const { data: son } = await db.from('push_anahtar').select('ozel, genel').eq('id', 1).single();
    return son as Vapid;
  };

  /* Kişilere gönder: konuyu kapatmış olanları ayıkla, cihazlarına yolla,
     geçersiz cihazları sil. Kaç cihaza ulaştığını döndürür. */
  const kisilereGonder = async (kisiler: string[], konu: string, icerik: (kisi: string) => Promise<Icerik> | Icerik) => {
    const hedef = [...new Set(kisiler.filter(Boolean))];
    if (!hedef.length) return 0;

    const { data: tercihler } = await db.from('bildirim_tercih')
      .select('kullanici, kapali').in('kullanici', hedef);
    const kapatan = new Set((tercihler ?? [])
      .filter(t => Array.isArray(t.kapali) && t.kapali.includes(konu))
      .map(t => t.kullanici as string));
    const acik = hedef.filter(k => !kapatan.has(k));
    if (!acik.length) return 0;

    const { data: aboneler } = await db.from('push_abonelik')
      .select('endpoint, p256dh, auth, kullanici').in('kullanici', acik);
    if (!aboneler || !aboneler.length) return 0;

    const vapid = await anahtarAl();
    const metinler = new Map<string, string>();
    for (const k of acik) metinler.set(k, JSON.stringify(await icerik(k)));

    let ulasan = 0;
    await Promise.all(aboneler.map(async (a) => {
      try {
        const durum = await pushGonder(a, metinler.get(a.kullanici as string)!, vapid);
        if (durum >= 200 && durum < 300) ulasan++;
        else if (durum === 404 || durum === 410) {
          await db.from('push_abonelik').delete().eq('endpoint', a.endpoint);
        }
      } catch { /* tek cihazın hatası ötekileri durdurmasın */ }
    }));
    return ulasan;
  };

  const adOku = async (id: string) => {
    const { data } = await db.from('profiles').select('ad').eq('id', id).maybeSingle();
    return (data && data.ad) || '';
  };

  // 3) İşlemler ----------------------------------------------------------
  if (v.islem === 'anahtar') {
    const a = await anahtarAl();
    return yanit({ anahtar: a.genel });
  }

  /* Ayarlar'daki "Deneme bildirimi gönder": kendi cihazlarına. Konu
     tercihlerine bakılmaz — zinciri uçtan uca denemek için. */
  if (v.islem === 'deneme') {
    const { data: aboneler } = await db.from('push_abonelik')
      .select('endpoint, p256dh, auth').eq('kullanici', ben);
    if (!aboneler || !aboneler.length) return yanit({ gonderildi: 0, cihaz: 0 });
    const vapid = await anahtarAl();
    const icerik = JSON.stringify({
      tip: 'deneme', baslik: 'NIZAM Studio', etiket: 'deneme', adres: '#/ayarlar/bildirimler',
      metin: 'Deneme bildirimi — her şey yolunda 👍',
    });
    let gonderildi = 0;
    await Promise.all(aboneler.map(async (a) => {
      try {
        const d = await pushGonder(a, icerik, vapid);
        if (d >= 200 && d < 300) gonderildi++;
        else if (d === 404 || d === 410) await db.from('push_abonelik').delete().eq('endpoint', a.endpoint);
      } catch { /* geç */ }
    }));
    return yanit({ gonderildi, cihaz: aboneler.length });
  }

  if (v.islem === 'gonder' || v.islem === 'mesaj') {
    const id = typeof v.mesaj === 'string' ? v.mesaj : '';
    if (!UUID.test(id)) return hata('Mesaj kimliği geçersiz.');

    /* Tek seferlik: "bildirildi" boşsa doldurup satırı alıyoruz. İkinci
       çağrı satır bulamaz, aynı bildirim iki kez gitmez. */
    const { data: mesaj } = await db.from('messages')
      .update({ bildirildi: new Date().toISOString() })
      .eq('id', id).eq('gonderen', ben).is('bildirildi', null)
      .gt('olusturuldu', ON_DAKIKA())
      .select('id, gonderen, alici, metin')
      .maybeSingle();
    if (!mesaj) return yanit({ gonderildi: 0 });

    const ad = (await adOku(ben)) || 'Yeni mesaj';
    const gonderildi = await kisilereGonder([mesaj.alici], 'mesaj', async (kisi) => {
      const { count } = await db.from('messages').select('id', { count: 'exact', head: true })
        .eq('alici', kisi).is('okundu', null);
      return {
        tip: 'mesaj', id: mesaj.id, kisi: ben, baslik: ad,
        metin: kisalt(String(mesaj.metin || '')),
        adres: '#/sohbet/' + ben, etiket: 'mesaj-' + ben, rozet: count || 0,
      };
    });
    return yanit({ gonderildi });
  }

  if (v.islem === 'gorev') {
    const id = typeof v.hareket === 'string' ? v.hareket : '';
    if (!UUID.test(id)) return hata('Hareket kimliği geçersiz.');

    const { data: h } = await db.from('task_events')
      .update({ bildirildi: new Date().toISOString() })
      .eq('id', id).eq('kim', ben).is('bildirildi', null)
      .gt('olusturuldu', ON_DAKIKA())
      .select('id, gorev_id, tip')
      .maybeSingle();
    if (!h || !GOREV_BASLIK[h.tip]) return yanit({ gonderildi: 0 });

    const { data: g } = await db.from('tasks')
      .select('id, no, baslik, atanan, olusturan').eq('id', h.gorev_id).maybeSingle();
    if (!g) return yanit({ gonderildi: 0 });

    /* Görev verildi haberi yalnız görevi alana; ötekiler alana ve verene.
       Hareketi yapan kendine bildirim almaz. */
    const alicilar = (h.tip === 'olusturuldu' || h.tip === 'atandi')
      ? [g.atanan] : [g.atanan, g.olusturan];
    const ad = (await adOku(ben)) || 'Biri';
    const gonderildi = await kisilereGonder(
      alicilar.filter(k => k && k !== ben) as string[], 'gorev', () => ({
        tip: 'gorev', id: g.id,
        baslik: ad + ' ' + GOREV_BASLIK[h.tip],
        metin: kisalt((g.no ? 'NS-' + g.no + ' · ' : '') + String(g.baslik || ''), 200),
        adres: '#/gorevler/' + g.id, etiket: 'gorev-' + g.id,
      }));
    return yanit({ gonderildi });
  }

  return hata('Bilinmeyen işlem.');
});
