-- ==========================================================================
-- NIZAM | Studio — Görev sistemi v2
--
-- Görev artık "Claude'a verilecek iş" değil, EKİP ÜYESİNE verilen iş:
--   kime · genel mi bir proje hakkında mı · ne yapılacak · ne zamana kadar
--
-- Üç durum var:
--   bekliyor   — görev verildi, alan kişi henüz bitirmedi
--   bitirdi    — alan kişi "bitirdim" dedi, veren onayını bekliyor
--   onaylandi  — veren onayladı, görev kapandı
--
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
-- İki kez çalıştırsan da bozulmaz.
-- ==========================================================================

-- 0) Eski kilidi kaldır ----------------------------------------------------
--    Aşağıdaki UPDATE durumları çeviriyor; eski tetikleyici SQL editöründe
--    "kullanıcı kimliği yok" diye buna izin vermiyordu. Yeni hâli en sonda
--    yeniden kuruluyor.
drop trigger if exists gorev_kilit_tetik on public.tasks;

-- 1) Proje artık zorunlu değil — "Genel" görevler için ---------------------
alter table public.tasks alter column proje_id drop not null;

-- 2) Bitiş tarihi ----------------------------------------------------------
alter table public.tasks add column if not exists bitis date;

-- 3) Durumlar yenilendi ----------------------------------------------------
--    Önce kuralı kaldır, değerleri çevir, sonra yeni kuralı koy.
alter table public.tasks drop constraint if exists tasks_durum_check;

update public.tasks set durum = case durum
  when 'yapilacak'      then 'bekliyor'
  when 'gelistiriliyor' then 'bekliyor'
  when 'kontrolde'      then 'bitirdi'
  when 'tamamlandi'     then 'onaylandi'
  else durum
end
where durum in ('yapilacak','gelistiriliyor','kontrolde','tamamlandi');

alter table public.tasks alter column durum set default 'bekliyor';
alter table public.tasks add constraint tasks_durum_check
  check (durum in ('bekliyor','bitirdi','onaylandi'));

-- 4) Görevi veren de görevi görebilmeli ------------------------------------
--    Eskiden yalnız yönetici ve görevi ALAN görebiliyordu; artık veren de
--    kendi verdiği görevi görüyor (iki yönetici birbirine görev verebilsin).
drop policy if exists "gorev okuma" on public.tasks;
create policy "gorev okuma" on public.tasks for select
  using (public.rolum() = 'yonetici'
         or atanan = auth.uid()
         or olusturan = auth.uid());

drop policy if exists "gorev degisim" on public.tasks;
create policy "gorev degisim" on public.tasks for update
  using (public.rolum() = 'yonetici' or atanan = auth.uid() or olusturan = auth.uid())
  with check (public.rolum() = 'yonetici' or atanan = auth.uid() or olusturan = auth.uid());

drop policy if exists "hareket okuma" on public.task_events;
create policy "hareket okuma" on public.task_events for select
  using (exists (select 1 from public.tasks t
                 where t.id = gorev_id
                   and (public.rolum() = 'yonetici'
                        or t.atanan = auth.uid()
                        or t.olusturan = auth.uid())));

drop policy if exists "hareket ekleme" on public.task_events;
create policy "hareket ekleme" on public.task_events for insert
  with check (exists (select 1 from public.tasks t
                      where t.id = gorev_id
                        and (public.rolum() = 'yonetici'
                             or t.atanan = auth.uid()
                             or t.olusturan = auth.uid())));

-- 5) Geliştirici koruması yenilendi ---------------------------------------
--    Görevi ALAN yalnızca "bitirdim" diyebilir; "onaylandı" demek görevi
--    VERENE ait. Yönetici de kendi almadığı görevi onaylayabilir ama
--    kendi görevini kendi onaylayamaz — iki taraflı kapanış bilerek.
create or replace function public.gorev_kilit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.guncellendi := now();

  /* Oturum yok: güncelleme sunucudan geliyor (örneğin üye silinince yabancı
     anahtarın kendi yaptığı güncelleme). Kural işletilmiyor — bkz. sql/32. */
  if auth.uid() is null then
    return new;
  end if;

  /* Görevi veren her şeyi değiştirebilir. */
  if old.olusturan = auth.uid() then
    return new;
  end if;

  /* Görevi alan: yalnız durumu değiştirebilir, o da "bitirdi"ye. */
  if old.atanan = auth.uid() then
    if new.durum not in ('bekliyor','bitirdi') then
      raise exception 'Görevi ancak veren onaylayabilir.';
    end if;
    new.no        := old.no;
    new.proje_id  := old.proje_id;
    new.modul_id  := old.modul_id;
    new.sayfa_id  := old.sayfa_id;
    new.baslik    := old.baslik;
    new.aciklama  := old.aciklama;
    new.bitis     := old.bitis;
    new.oncelik   := old.oncelik;
    new.atanan    := old.atanan;
    new.olusturan := old.olusturan;
    return new;
  end if;

  if public.rolum() = 'yonetici' then return new; end if;

  raise exception 'Bu görev seninle ilgili değil.';
end;
$$;

drop trigger if exists gorev_kilit_tetik on public.tasks;
create trigger gorev_kilit_tetik
  before update on public.tasks
  for each row execute function public.gorev_kilit();
