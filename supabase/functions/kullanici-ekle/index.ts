// ==========================================================================
// NIZAM | Studio — Kullanıcı ekleme
//
// Kullanıcı açmak "service role" anahtarı ister; o anahtar tüm güvenlik
// kurallarını atlar ve tarayıcıya konamaz. Bu yüzden iş sunucuda, burada
// yapılır. Fonksiyon önce isteği yapanın gerçekten yönetici olduğunu
// doğrular, sonra kullanıcıyı açar.
//
// Kurulum: Supabase → Edge Functions → Deploy a new function → via editor
//          Ad: kullanici-ekle · bu dosyayı yapıştır · Deploy
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
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

const hata = (mesaj: string, kod = 400) => yanit({ hata: mesaj }, kod);

Deno.serve(async (istek) => {
  if (istek.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (istek.method !== 'POST') return hata('Yalnızca POST.', 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const servis = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;

  // 1) İsteği yapan kim? -----------------------------------------------
  const yetki = istek.headers.get('Authorization') ?? '';
  if (!yetki) return hata('Oturum yok.', 401);

  const kullaniciDb = createClient(url, anon, {
    global: { headers: { Authorization: yetki } },
  });

  const { data: oturum, error: oturumHata } = await kullaniciDb.auth.getUser();
  if (oturumHata || !oturum?.user) return hata('Oturum geçersiz.', 401);

  // 2) Yönetici mi? -----------------------------------------------------
  const yonetimDb = createClient(url, servis);

  const { data: profil } = await yonetimDb
    .from('profiles')
    .select('rol, aktif')
    .eq('id', oturum.user.id)
    .maybeSingle();

  if (!profil || !profil.aktif || profil.rol !== 'yonetici') {
    return hata('Bu işlem için yönetici olman gerekiyor.', 403);
  }

  // 3) Gelen bilgiyi denetle --------------------------------------------
  let govde: Record<string, string>;
  try {
    govde = await istek.json();
  } catch {
    return hata('İstek okunamadı.');
  }

  const mail = String(govde.mail ?? '').trim().toLowerCase();
  const ad = String(govde.ad ?? '').trim();
  const rol = String(govde.rol ?? 'gelistirici').trim();
  const sifre = String(govde.sifre ?? '');

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return hata('Geçerli bir e-posta yaz.');
  if (ad.length < 2) return hata('Ad soyad yaz.');
  if (sifre.length < 8) return hata('Şifre en az 8 karakter olmalı.');
  if (rol !== 'yonetici' && rol !== 'gelistirici') return hata('Rol yönetici ya da geliştirici olmalı.');

  // 4) Kullanıcıyı aç ----------------------------------------------------
  const { data: yeni, error: acmaHata } = await yonetimDb.auth.admin.createUser({
    email: mail,
    password: sifre,
    email_confirm: true,
    user_metadata: { ad, rol },
  });

  if (acmaHata || !yeni?.user) {
    const m = acmaHata?.message ?? '';
    if (/already been registered|already exists/i.test(m)) {
      return hata('Bu e-posta zaten kayıtlı.', 409);
    }
    return hata(m || 'Kullanıcı açılamadı.', 500);
  }

  // 5) Profili tamamla ---------------------------------------------------
  //    Tetikleyici satırı zaten oluşturdu; adı ve rolü burada kesinleştiriyoruz.
  const { error: profilHata } = await yonetimDb
    .from('profiles')
    .upsert({ id: yeni.user.id, ad, rol, aktif: true }, { onConflict: 'id' });

  if (profilHata) return hata('Kullanıcı açıldı ama profili yazılamadı: ' + profilHata.message, 500);

  return yanit({ ok: true, id: yeni.user.id });
});
