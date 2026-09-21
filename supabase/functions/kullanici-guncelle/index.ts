// ==========================================================================
// NIZAM | Studio — Ekip üyesi güncelleme
//
// Ad, rol ve erişim doğrudan tarayıcıdan da yazılabiliyor; ama e-posta ve
// şifre Supabase'in kullanıcı tablosunda duruyor ve oraya ancak "service
// role" anahtarıyla dokunulabiliyor. O anahtar tarayıcıya konamaz, iş
// burada yapılıyor. Fonksiyon önce isteği yapanın yönetici olduğunu
// doğruluyor.
//
// Kurulum: Supabase → Edge Functions → Deploy a new function → via editor
//          Ad: kullanici-guncelle · bu dosyayı yapıştır · Deploy
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

  // 1) İsteği yapan kim? -------------------------------------------------
  const yetki = istek.headers.get('Authorization') ?? '';
  if (!yetki) return hata('Oturum yok.', 401);

  const kullaniciDb = createClient(url, anon, {
    global: { headers: { Authorization: yetki } },
  });

  const { data: oturum, error: oturumHata } = await kullaniciDb.auth.getUser();
  if (oturumHata || !oturum?.user) return hata('Oturum geçersiz.', 401);

  // 2) Yönetici mi? ------------------------------------------------------
  const yonetimDb = createClient(url, servis);

  const { data: profil } = await yonetimDb
    .from('profiles')
    .select('rol, aktif')
    .eq('id', oturum.user.id)
    .maybeSingle();

  if (!profil || !profil.aktif || profil.rol !== 'yonetici') {
    return hata('Bu işlem için yönetici olman gerekiyor.', 403);
  }

  // 3) Gelen bilgiyi denetle ---------------------------------------------
  let govde: Record<string, unknown>;
  try {
    govde = await istek.json();
  } catch {
    return hata('İstek okunamadı.');
  }

  const id = String(govde.id ?? '').trim();
  const islem = String(govde.islem ?? '').trim();

  // 3a) Silme isteği --------------------------------------------------
  //     Kullanıcıyı Supabase'den siler; profil satırı ona bağlı olduğu için
  //     kendiliğinden gider. Görevler silinmez, yalnız "atanmamış" olur.
  if (islem === 'sil') {
    if (!id) return hata('Kişi belirtilmedi.');
    if (id === oturum.user.id) return hata('Kendi hesabını silemezsin.');

    const { error: silmeHata } = await yonetimDb.auth.admin.deleteUser(id);
    if (silmeHata) return hata(silmeHata.message || 'Kullanıcı silinemedi.', 500);

    // Profil satırı tetikleyiciyle gitmediyse elle siliyoruz.
    await yonetimDb.from('profiles').delete().eq('id', id);
    return yanit({ ok: true });
  }

  const ad = String(govde.ad ?? '').trim();
  const rol = String(govde.rol ?? '').trim();
  const eposta = String(govde.eposta ?? '').trim().toLowerCase();
  const telefon = String(govde.telefon ?? '').trim();
  const sifre = String(govde.sifre ?? '');
  const aktif = govde.aktif === undefined ? null : !!govde.aktif;

  if (!id) return hata('Kişi belirtilmedi.');
  if (ad.length < 2) return hata('Ad soyad yaz.');
  if (rol && rol !== 'yonetici' && rol !== 'gelistirici') return hata('Rol yönetici ya da geliştirici olmalı.');
  if (eposta && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eposta)) return hata('Geçerli bir e-posta yaz.');
  if (sifre && sifre.length < 8) return hata('Şifre en az 8 karakter olmalı.');

  // Kendi rolünü ve erişimini kimse değiştiremesin: tek yöneticinin kendini
  // kilitlemesi programı sahipsiz bırakır.
  const kendisi = id === oturum.user.id;

  // 4) Supabase kullanıcısını güncelle -----------------------------------
  const authYama: Record<string, string> = {};
  if (eposta) authYama.email = eposta;
  if (sifre) authYama.password = sifre;

  if (Object.keys(authYama).length) {
    const { error: authHata } = await yonetimDb.auth.admin.updateUserById(id, authYama);
    if (authHata) {
      const m = authHata.message ?? '';
      if (/already been registered|already exists/i.test(m)) return hata('Bu e-posta başka bir kullanıcıda kayıtlı.', 409);
      return hata(m || 'Kullanıcı güncellenemedi.', 500);
    }
  }

  // 5) Profili güncelle ---------------------------------------------------
  const yama: Record<string, unknown> = { ad };
  if (rol && !kendisi) yama.rol = rol;
  if (aktif !== null && !kendisi) yama.aktif = aktif;
  if (eposta) yama.eposta = eposta;
  yama.telefon = telefon;

  const { error: profilHata } = await yonetimDb.from('profiles').update(yama).eq('id', id);

  if (profilHata) {
    // eposta/telefon sütunu yoksa (SQL çalıştırılmamış) onlarsız yeniden dene.
    delete yama.eposta;
    delete yama.telefon;
    const { error: ikinci } = await yonetimDb.from('profiles').update(yama).eq('id', id);
    if (ikinci) return hata('Profil yazılamadı: ' + ikinci.message, 500);
    return yanit({ ok: true, uyari: 'E-posta ve telefon yazılamadı — sql/21-ekip-iletisim.sql çalıştırılmamış.' });
  }

  return yanit({ ok: true });
});
