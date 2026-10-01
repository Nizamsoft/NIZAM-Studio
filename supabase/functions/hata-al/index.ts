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

  return yanit({ tamam: true, yeni: yeniler.length }, 201);
});
