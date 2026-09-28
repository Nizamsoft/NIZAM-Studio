-- ============================================================================
-- 34 · Görevde plan onayı ve el ile sıralama
-- ============================================================================
-- İki şey ekliyor:
--   1) plan / plan_onay — görevi alan ne yapacağını yazıyor, veren onaylıyor,
--      ancak ondan sonra iş başlıyor.
--   2) sira — bir kişinin görevleri el ile sıralanabiliyor. Yeni görev
--      otomatik sona gidiyor.
--
-- Supabase → SQL Editor'da bir kez çalıştır.
-- ============================================================================

alter table public.tasks add column if not exists plan       text    not null default '';
alter table public.tasks add column if not exists plan_onay  boolean not null default false;
alter table public.tasks add column if not exists sira       integer not null default 0;

create index if not exists tasks_sira_idx on public.tasks (atanan, sira);

-- Var olan görevler oluşturulma sırasına göre numaralansın.
with n as (
  select id, row_number() over (partition by atanan order by olusturuldu) as s
  from public.tasks
)
update public.tasks t set sira = n.s from n where n.id = t.id and t.sira = 0;

-- Görevi ALAN yalnız durumu ve planı değiştirebilsin; onayı ve sırayı değil.
create or replace function public.gorev_kilit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.guncellendi := now();

  /* Oturum yok: güncelleme sunucudan geliyor (üye silinince yabancı
     anahtarın kendi yaptığı güncelleme). Kural işletilmiyor — bkz. sql/32. */
  if auth.uid() is null then
    return new;
  end if;

  /* Görevi veren her şeyi değiştirebilir. */
  if old.olusturan = auth.uid() then
    return new;
  end if;

  /* Görevi alan: durumu (o da "bitirdi"ye) ve kendi planını. */
  if old.atanan = auth.uid() then
    if new.durum not in ('bekliyor','bitirdi') then
      raise exception 'Görevi ancak veren onaylayabilir.';
    end if;
    /* Plan değiştiyse onay düşer — veren yeniden bakar. */
    if new.plan is distinct from old.plan then
      new.plan_onay := false;
    else
      new.plan_onay := old.plan_onay;
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
    new.sira      := old.sira;
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
