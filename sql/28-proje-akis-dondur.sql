-- ==========================================================================
-- NIZAM | Studio — Kurulmuş projelerin yol haritasını dondur
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
-- İki kez çalıştırsan da bozulmaz (yalnız `akis` yazılmamış satırlara dokunur).
--
-- Bu sürümden itibaren her yeni proje yol haritasını kurulduğu anda
-- paletine yazıyor. Daha önce kurulmuş projeler bunu taşımıyor ve paketten
-- türetiliyorlar — yani paketin "varsayılan" işareti değişirse adımları da
-- değişir. Bu sorgu onların bugünkü hâlini kalıcı hâle getiriyor.
-- ==========================================================================

update public.projects
   set palet = coalesce(palet, '{}'::jsonb) || jsonb_build_object('akis',
         case
           -- Eski şablon kopyaları
           when palet ? 'sablon' then 'muhasebe'
           -- Paketi varsayılan olmayan projeler template'ten gelmiştir
           when palet ? 'paket'
                and palet->>'paket' <> coalesce(
                      (select anahtar from public.packages where varsayilan limit 1),
                      'ozel')
             then 'muhasebe'
           else 'ozel'
         end)
 where not (coalesce(palet, '{}'::jsonb) ? 'akis');
