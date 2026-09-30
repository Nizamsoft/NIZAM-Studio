-- ============================================================================
-- 37 · NIZAM Security — denetim numarası yarış-güvenliği (Faz 5)
-- ============================================================================
-- guvenlik_denetimleri.no hedef içinde 1,2,3… artar. İki denetim aynı anda
-- başlarsa aynı numara oluşmasın diye:
--   1) (hedef_id, no) benzersiz  → çakışma DB'de yakalanır
--   2) guvenlik_denetim_kaydet() → hedef başına advisory lock ile seri yazar
--
-- Fonksiyon security definer ama içeride yönetici kontrolü yapar; kayıt yine
-- yalnız yöneticiye açık. Immutable tablodur — bu fonksiyon yalnız EKLER.
--
-- Supabase → SQL Editor → yapıştır → Run. İki kez çalıştırmak zarar vermez.
-- ============================================================================

-- 1) Benzersizlik (varsa dokunmaz)
create unique index if not exists guvenlik_denetimleri_hedef_no_key
  on public.guvenlik_denetimleri (hedef_id, no);

-- 2) Atomik ekleme
create or replace function public.guvenlik_denetim_kaydet(
  p_hedef uuid, p_manifest uuid, p_matris jsonb, p_sonuclar jsonb, p_ozet jsonb)
returns public.guvenlik_denetimleri
language plpgsql
security definer
set search_path = public
as $$
declare
  v_no int;
  v_satir public.guvenlik_denetimleri;
begin
  if public.rolum() <> 'yonetici' then
    raise exception 'Bu işlem için yönetici olman gerekiyor.';
  end if;
  -- Hedef başına seri: aynı anda iki denetim aynı numarayı almaz.
  perform pg_advisory_xact_lock(hashtext('guvenlik_denetim_' || p_hedef::text));
  select coalesce(max(no), 0) + 1 into v_no
    from public.guvenlik_denetimleri where hedef_id = p_hedef;
  insert into public.guvenlik_denetimleri
    (hedef_id, manifest_id, no, matris, sonuclar, ozet, olusturan)
  values (p_hedef, p_manifest, v_no,
          coalesce(p_matris, '[]'::jsonb), coalesce(p_sonuclar, '[]'::jsonb),
          coalesce(p_ozet, '{}'::jsonb), auth.uid())
  returning * into v_satir;
  return v_satir;
end;
$$;
