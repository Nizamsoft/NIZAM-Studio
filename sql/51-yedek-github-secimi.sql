-- ==========================================================================
-- NIZAM | Studio — 51 · GitHub repo seçimi (v0.338.0)
--
-- Son Yedekleme › Ayarlar'da GitHub repoları da seçilebiliyor. Kayıt
-- yedek_ayarlari'ndaki GITHUB satırı:
--   acik  · GitHub yedeği tümden açık mı
--   haric · yedeklenMEYECEK repoların adları. Liste "hariç" tutulur ki yeni
--           açılan repolar kendiliğinden yedeğe girsin.
-- 50'den sonra. Tekrar çalıştırmak zararsız.
-- ==========================================================================

alter table public.yedek_ayarlari add column if not exists haric text[] not null default '{}';

insert into public.yedek_ayarlari (kod, ad, acik)
values ('GITHUB', 'GitHub repoları', true)
on conflict (kod) do nothing;

notify pgrst, 'reload schema';
