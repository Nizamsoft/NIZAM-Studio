-- ============================================================================
-- 54 · Claude iş kaydı kapısı (v0.375.0)
-- ============================================================================
-- Claude Code'da bir iş bitince (kod gönderildi, SQL/belge hazırlandı, hata
-- çözüldü) Claude bu kapıya tek satır yollar: kim · hangi program · ne yaptı.
-- Panel › Son Hareketler › Claude'da görünür. Kural claude.ai hesap
-- tercihlerinde durur (IS-KAYDI-KURALI.md).
--
-- 52'deki Edge Function yerine tek SQL fonksiyonu: Supabase'e ayrıca bir şey
-- kurulmaz. Güvenlik:
--   · Kapı anahtarla açılır; anahtarın yalnız SHA-256 özeti saklanır.
--   · Kapı yalnız YAZAR: okuyamaz, silemez, değiştiremez.
--   · Saatte en çok 200 kayıt; alanlar boyca kırpılır.
--   · Kayıtları yalnız yönetici okur ve siler (52 ile aynı kural).
-- 52 çalıştırılmamış olsa da bu dosya tek başına yeterlidir.
-- Supabase → SQL Editor → yapıştır → Run. İki kez çalıştırmak zararsız.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.is_kayitlari (
  id          uuid primary key default gen_random_uuid(),
  kullanici   text        not null default '',
  program     text        not null default '',
  is_ozet     text        not null default '',
  detay       text        not null default '',
  repo        text        not null default '',
  commit_no   text        not null default '',
  oturum      text        not null default '',
  yapildi     timestamptz not null default now(),
  olusturuldu timestamptz not null default now()
);
alter table public.is_kayitlari add column if not exists uretilen text not null default '';
create index if not exists is_kayitlari_yapildi_idx on public.is_kayitlari (yapildi desc);

alter table public.is_kayitlari enable row level security;
revoke all on public.is_kayitlari from anon;
grant select, delete on public.is_kayitlari to authenticated;
drop policy if exists "is kaydi okuma" on public.is_kayitlari;
drop policy if exists "is kaydi silme" on public.is_kayitlari;
create policy "is kaydi okuma" on public.is_kayitlari for select using (public.rolum() = 'yonetici');
create policy "is kaydi silme" on public.is_kayitlari for delete using (public.rolum() = 'yonetici');

-- Anahtar özeti: REST'ten kimse ulaşamaz.
create table if not exists public.is_kaydi_anahtari (
  id            int primary key default 1 check (id = 1),
  anahtar_ozeti text not null check (anahtar_ozeti ~ '^[0-9a-f]{64}$'),
  guncellendi   timestamptz not null default now()
);
alter table public.is_kaydi_anahtari enable row level security;
revoke all on public.is_kaydi_anahtari from public, anon, authenticated;

create or replace function public.is_kaydi_yaz(
  p_anahtar   text,
  p_kullanici text,
  p_program   text,
  p_is        text,
  p_detay     text default '',
  p_repo      text default '',
  p_commit    text default '',
  p_oturum    text default '',
  p_uretilen  text default ''
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_ozet text;
  v_say  int;
  k text := left(trim(coalesce(p_kullanici, '')), 80);
  g text := left(trim(coalesce(p_program, '')), 120);
  i text := left(trim(coalesce(p_is, '')), 200);
begin
  select anahtar_ozeti into v_ozet from is_kaydi_anahtari where id = 1;
  if v_ozet is null or p_anahtar is null or length(p_anahtar) < 32
     or encode(extensions.digest(p_anahtar, 'sha256'), 'hex') <> v_ozet then
    raise exception 'İş kaydı anahtarı geçersiz' using errcode = '42501';
  end if;
  if k = '' or g = '' or i = '' then
    raise exception 'p_kullanici, p_program ve p_is gerekli' using errcode = '22023';
  end if;
  select count(*) into v_say from is_kayitlari where olusturuldu > now() - interval '1 hour';
  if v_say >= 200 then
    raise exception 'Çok fazla kayıt geldi, biraz sonra dene' using errcode = '54000';
  end if;
  insert into is_kayitlari (kullanici, program, is_ozet, detay, repo, commit_no, oturum, uretilen)
  values (k, g, i,
          left(coalesce(p_detay, ''), 6000), left(coalesce(p_repo, ''), 120),
          left(coalesce(p_commit, ''), 40), left(coalesce(p_oturum, ''), 300),
          left(coalesce(p_uretilen, ''), 500));
  return jsonb_build_object('tamam', true);
end $$;

revoke all on function public.is_kaydi_yaz(text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.is_kaydi_yaz(text, text, text, text, text, text, text, text, text) to anon, authenticated;

-- Yeni kayıt gelince Panel kendiliğinden tazelensin.
do $$
begin
  begin
    alter publication supabase_realtime add table public.is_kayitlari;
  exception when duplicate_object or undefined_object then null;
  end;
end $$;

notify pgrst, 'reload schema';

-- ===================== ANAHTAR (ayrı, tek seferlik) =====================
-- Aşağıdakini ayrıca çalıştır: yeni anahtar üretir, yalnız özetini saklar,
-- anahtarı BİR KEZ gösterir. Çıkan "is_kaydi_anahtari"nı tercih metnindeki
-- <ANAHTAR> yerine yaz. Yeniden çalıştırınca eski anahtar o an geçersiz olur.
--   with k as (select encode(extensions.gen_random_bytes(24), 'hex') as a),
--        y as (insert into public.is_kaydi_anahtari (id, anahtar_ozeti)
--              select 1, encode(extensions.digest(a, 'sha256'), 'hex') from k
--              on conflict (id) do update set anahtar_ozeti = excluded.anahtar_ozeti, guncellendi = now()
--              returning id)
--   select a as is_kaydi_anahtari from k, y;
--
-- Kapatmak: delete from public.is_kaydi_anahtari;
