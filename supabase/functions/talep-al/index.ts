// ==========================================================================
// NIZAM | Studio — Talep alma
//
// Web sitesindeki Ön Analiz formu gönderilince sitenin SUNUCUSU talebi
// buraya yollar. Tarayıcı bu adresi hiç bilmez.
//
// İstek, iki tarafta da duran gizli bir anahtarla imzalı gelir:
//   x-talep-zaman : gönderildiği an (milisaniye)
//   x-talep-imza  : HMAC-SHA256( "<zaman>.<gövde>" ) — onaltılık
// Gövde: { talepler: [ { id, firma, yetkili, telefon, eposta, sektor,
//          ozet, iletisim, bolumler, gonderildi } ] }  (en fazla 25)
// İmzası tutmayan ya da 5 dakikadan eski istek geri çevrilir.
//
// Talepler tablosuna tarayıcıdan ekleme yapılamaz; yazan tek yer burası.
//
// Kurulum:
//   1) Supabase → Edge Functions → Deploy a new function → via editor
//      Ad: talep-al · bu dosyayı yapıştır · Deploy
//   2) Fonksiyonun ayarlarında "Enforce JWT verification" KAPALI olmalı
//      (isteği bir kullanıcı değil sitenin sunucusu yapıyor; kimliği
//      aşağıdaki imza doğruluyor).
//   3) Edge Functions → Secrets → TALEP_ANAHTARI = <uzun rastgele metin>
//      Aynı metin sitenin ayarlarına STUDIO_TALEP_ANAHTARI olarak girilir.
// ==========================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const yanit = (govde: unknown, kod = 200) =>
  new Response(JSON.stringify(govde), {
    status: kod,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const hata = (mesaj: string, kod = 400) => yanit({ hata: mesaj }, kod);

const EN_BUYUK = 256_000;          // gövde sınırı (bayt)
const ZAMAN_PAYI = 5 * 60_000;     // imza en fazla 5 dakika geçerli
const SAATLIK_SINIR = 200;         // saatte en fazla bu kadar yeni talep
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

const yazi = (v: unknown, sinir: number) =>
  (typeof v === 'string' ? v : '').trim().slice(0, sinir);

async function imzaDogru(anahtar: string, zaman: string, govde: string, imza: string) {
  if (!/^[a-f0-9]{64}$/.test(imza)) return false;
  const kodla = new TextEncoder();
  const k = await crypto.subtle.importKey(
    'raw', kodla.encode(anahtar), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const bayt = Uint8Array.from(imza.match(/../g)!, h => parseInt(h, 16));
  return crypto.subtle.verify('HMAC', k, bayt, kodla.encode(zaman + '.' + govde));
}

/* Soru-cevap bölümleri: biçimi tutmayan her şey atılır, uzunluklar kırpılır. */
function bolumleriTemizle(v: unknown) {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 12).map(b => ({
    baslik: yazi(b?.baslik, 120),
    sorular: (Array.isArray(b?.sorular) ? b.sorular : []).slice(0, 25).map((s: any) => ({
      soru: yazi(s?.soru, 300),
      cevap: yazi(s?.cevap, 4000),
    })).filter((s: { soru: string }) => s.soru),
  })).filter(b => b.baslik || b.sorular.length);
}

Deno.serve(async (istek) => {
  if (istek.method !== 'POST') return hata('Yalnızca POST.', 405);

  const anahtar = Deno.env.get('TALEP_ANAHTARI') ?? '';
  if (anahtar.length < 32) return hata('Talep anahtarı kurulmamış.', 503);

  // 1) Boyut ve imza ------------------------------------------------------
  const uzunluk = Number(istek.headers.get('content-length') ?? '0');
  if (uzunluk > EN_BUYUK) return hata('İstek çok büyük.', 413);

  const govde = await istek.text();
  if (govde.length > EN_BUYUK) return hata('İstek çok büyük.', 413);

  const zaman = istek.headers.get('x-talep-zaman') ?? '';
  const imza = istek.headers.get('x-talep-imza') ?? '';
  const an = Number(zaman);
  if (!/^\d{13}$/.test(zaman) || Math.abs(Date.now() - an) > ZAMAN_PAYI) {
    return hata('İmza süresi geçmiş.', 401);
  }
  if (!await imzaDogru(anahtar, zaman, govde, imza)) return hata('İmza geçersiz.', 401);

  // 2) İçerik -------------------------------------------------------------
  //    { talepler: [ ... ] } — site en fazla 25'ini birlikte yollar. Aynı
  //    talep tekrar gelebilir (site kaçanları yeniden gönderiyor); zaten
  //    kayıtlı olanlar atlanır.
  let v: Record<string, unknown>;
  try {
    v = JSON.parse(govde);
  } catch {
    return hata('İstek okunamadı.');
  }

  const gelen = Array.isArray(v.talepler) ? v.talepler.slice(0, 25) : [];
  const satirlar = gelen.map((t: Record<string, unknown>) => {
    const gonderildi = Number(t?.gonderildi);
    return {
      id: yazi(t?.id, 36),
      kaynak: 'web',
      firma: yazi(t?.firma, 150),
      yetkili: yazi(t?.yetkili, 100),
      telefon: yazi(t?.telefon, 30),
      eposta: yazi(t?.eposta, 180).toLowerCase(),
      sektor: yazi(t?.sektor, 100),
      ozet: yazi(t?.ozet, 4000),
      iletisim: yazi(t?.iletisim, 30),
      bolumler: bolumleriTemizle(t?.bolumler),
      gonderildi: Number.isFinite(gonderildi) && gonderildi > 0
        ? new Date(gonderildi).toISOString() : new Date().toISOString(),
    };
  }).filter(t => UUID.test(t.id) && (t.firma || t.yetkili));
  if (!satirlar.length) return hata('Geçerli talep yok.');

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // 3) Zaten kayıtlı olanları ayır ------------------------------------------
  const { data: kayitli, error: okumaHata } = await db.from('talepler')
    .select('id').in('id', satirlar.map(t => t.id));
  if (okumaHata) {
    console.error('talepler okunamadı', okumaHata.message);
    return hata('Talep kaydedilemedi.', 500);
  }
  const varOlan = new Set((kayitli ?? []).map(x => x.id));
  const yeniler = satirlar.filter(t => !varOlan.has(t.id));
  if (!yeniler.length) return yanit({ tamam: true, yeni: 0 });

  // 4) Saatlik sınır — anahtar bir gün sızsa bile tabloyu doldurmasın ------
  const birSaatOnce = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await db.from('talepler')
    .select('id', { count: 'exact', head: true })
    .gte('olusturuldu', birSaatOnce);
  if ((count ?? 0) + yeniler.length > SAATLIK_SINIR) return hata('Çok fazla talep geldi.', 429);

  // 5) Yaz ------------------------------------------------------------------
  const { error } = await db.from('talepler')
    .upsert(yeniler, { onConflict: 'id', ignoreDuplicates: true });
  if (error) {
    console.error('talep yazılamadı', error.message);
    return hata('Talep kaydedilemedi.', 500);
  }

  return yanit({ tamam: true, yeni: yeniler.length }, 201);
});
