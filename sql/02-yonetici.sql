-- ==========================================================================
-- NIZAM | Studio — Yöneticiyi belirle
-- Kullanıcıyı panelden ekledikten SONRA çalıştır.
-- E-postayı ve adı kendine göre değiştir.
-- ==========================================================================

update public.profiles
set ad  = 'Nizam',
    rol = 'yonetici'
where id = (select id from auth.users where email = 'nizamsoft@icloud.com');

-- Kontrol: sonuç 1 satır ve rol 'yonetici' olmalı
select p.ad, p.rol, p.aktif, u.email
from public.profiles p
join auth.users u on u.id = p.id;
