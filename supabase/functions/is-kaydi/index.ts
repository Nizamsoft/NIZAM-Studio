// ==========================================================================
// NIZAM | Studio — İş kaydı alma (v0.351.0)
//
// Claude bir oturumda bir şeyi değiştirip GitHub'a gönderince buraya tek
// satır yollar: kim, hangi program, ne yaptı. Panel › Son Hareketler'de
// görünür. Kural claude.ai hesap tercihlerinde (bkz. IS-KAYDI-KURALI.md).
//
// Erişim kodu hata-al ile AYNI: RAPOR_ANAHTARI (x-rapor-anahtari başlığı).
// Gerçek bir sır değil; asıl koruma boyut ve saatlik sınır, tabloya yalnız
// bu fonksiyonun yazabilmesi.
//
// Kurulum (TEK SEFER):
//   1) Supabase → Edge Functions → Deploy a new function → via editor
//      Ad: is-kaydi · bu dosyayı yapıştır · Deploy
//   2) Fonksiyon ayarlarında "Enforce JWT verification" KAPALI olmalı.
//   3) RAPOR_ANAHTARI zaten var (hata-al kurulumunda eklendi).
//   4) sql/52-is-kayitlari.sql çalıştırılmış olmalı.
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

const EN_BUYUK = 32_000;
const SAATLIK_SINIR = 200;

const yazi = (v: unknown, sinir: number) =>
  (typeof v === 'string' ? v : '').trim().slice(0, sinir);

Deno.serve(async (istek) => {
  if (istek.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (istek.method !== 'POST') return hata('Yalnızca POST.', 405);

  const anahtar = Deno.env.get('RAPOR_ANAHTARI') ?? '';
  if (anahtar.length < 16) return hata('Rapor anahtarı kurulmamış.', 503);
  if ((istek.headers.get('x-rapor-anahtari') ?? '') !== anahtar) return hata('Erişim kodu geçersiz.', 401);

  const govde = await istek.text();
  if (govde.length > EN_BUYUK) return hata('İstek çok büyük.', 413);
  let v: Record<string, unknown>;
  try { v = JSON.parse(govde); } catch { return hata('İstek okunamadı.'); }

  const satir = {
    kullanici: yazi(v.kullanici, 80),
    program:   yazi(v.program, 120),
    is_ozet:   yazi(v.is, 200),
    detay:     yazi(v.detay, 6000),
    repo:      yazi(v.repo, 120),
    commit_no: yazi(v.commit, 40),
    oturum:    yazi(v.oturum, 300),
  };
  if (!satir.kullanici || !satir.program || !satir.is_ozet) {
    return hata('kullanici, program ve is gerekli.');
  }

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const birSaatOnce = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await db.from('is_kayitlari')
    .select('id', { count: 'exact', head: true }).gte('olusturuldu', birSaatOnce);
  if ((count ?? 0) >= SAATLIK_SINIR) return hata('Çok fazla kayıt geldi.', 429);

  const { error } = await db.from('is_kayitlari').insert(satir);
  if (error) {
    console.error('iş kaydı yazılamadı', error.message);
    return hata('Kayıt yazılamadı.', 500);
  }
  return yanit({ tamam: true }, 201);
});
