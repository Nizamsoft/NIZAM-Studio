-- ============================================================================
-- 36 · NIZAM Security — kalıcı güvenlik denetimi tabloları (Faz 1)
-- ============================================================================
-- Güvenlik hedefleri, manifestleri, denetimleri, bulguları ve kararları
-- Studio'nun KENDİ Supabase'inde tutulur. Müşteri Supabase'ine hiçbir şey
-- eklenmez. Bu tablolara anon key, şifre, service_role ya da başka bir
-- müşteri kimlik bilgisi YAZILMAZ (uygulama katmanı da yazmıyor).
--
-- Hepsini yalnız yönetici okur/yazar (public.rolum() = 'yonetici').
-- Manifest ve denetim tabloları IMMUTABLE: update/delete politikası hiç
-- tanımlı değil, RLS varsayılanı bu işlemleri reddeder — kayıt bir kez
-- yazılır, sonra değişmez.
--
-- Supabase → SQL Editor → yapıştır → Run. İki kez çalıştırmak zarar vermez.
-- Mevcut tablolara ve mevcut RLS politikalarına dokunmaz.
-- ============================================================================

-- 1) Hedefler --------------------------------------------------------------
--    Bir hedef bir müşteri programını temsil eder; bir NIZAM projesine
--    bağlı. supabase_url yalnız adres (gizli değil); anahtar tutulmaz.
create table if not exists public.guvenlik_hedefleri (
  id            uuid primary key default gen_random_uuid(),
  ad            text        not null default '',
  proje_id      uuid        references public.projects (id) on delete set null,
  supabase_url  text        not null default '',
  uygulama_tipi text        not null default '',
  son_manifest_id uuid,
  son_denetim_id  uuid,
  durum         text        not null default 'yeni',
  olusturuldu   timestamptz not null default now(),
  guncellendi   timestamptz not null default now()
);
create index if not exists guvenlik_hedefleri_proje_idx
  on public.guvenlik_hedefleri (proje_id);

-- 2) Manifestler (IMMUTABLE) -----------------------------------------------
--    Claude'un ürettiği Security Manifest'in snapshot'ı. Bir kez yazılır.
create table if not exists public.guvenlik_manifestleri (
  id            uuid primary key default gen_random_uuid(),
  hedef_id      uuid        not null references public.guvenlik_hedefleri (id) on delete cascade,
  commit        text        not null default '',
  manifest_surumu text      not null default '',
  govde         jsonb       not null default '{}'::jsonb,
  olusturuldu   timestamptz not null default now()
);
create index if not exists guvenlik_manifestleri_hedef_idx
  on public.guvenlik_manifestleri (hedef_id, olusturuldu desc);

-- 3) Denetimler (IMMUTABLE) ------------------------------------------------
--    Bir tarama turunun snapshot'ı: kullanılan manifest, test matrisi,
--    sonuç satırları ve özet. Bir kez yazılır. manifest_id RESTRICT:
--    kullanılan manifest silinemez.
create table if not exists public.guvenlik_denetimleri (
  id            uuid primary key default gen_random_uuid(),
  hedef_id      uuid        not null references public.guvenlik_hedefleri (id) on delete cascade,
  manifest_id   uuid        references public.guvenlik_manifestleri (id) on delete restrict,
  no            int         not null default 1,
  matris        jsonb       not null default '[]'::jsonb,
  sonuclar      jsonb       not null default '[]'::jsonb,
  ozet          jsonb       not null default '{}'::jsonb,
  olusturan     uuid        references auth.users (id) on delete set null,
  olusturuldu   timestamptz not null default now()
);
create index if not exists guvenlik_denetimleri_hedef_idx
  on public.guvenlik_denetimleri (hedef_id, no desc);

-- 4) Bulgular (izlenir, güncellenebilir) -----------------------------------
--    Aynı açık her taramada çoğalmasın diye (hedef_id, imza) benzersiz.
--    Durum ve düzeltme bilgisi denetimden denetime güncellenir.
create table if not exists public.guvenlik_bulgulari (
  id             uuid        primary key default gen_random_uuid(),
  hedef_id       uuid        not null references public.guvenlik_hedefleri (id) on delete cascade,
  imza           text        not null,
  kategori       text        not null default '',
  onem           text        not null default '',
  baslik         text        not null default '',
  ilk_denetim_id uuid,
  son_denetim_id uuid,
  son_durum      text        not null default '',
  duzeltme_durumu text       not null default 'acik',
  claude_gorevi  text,
  ilk_gorulme    timestamptz not null default now(),
  son_gorulme    timestamptz not null default now(),
  unique (hedef_id, imza)
);
create index if not exists guvenlik_bulgulari_hedef_idx
  on public.guvenlik_bulgulari (hedef_id);

-- 5) Kararlar ("bilerek böyle" / "risk kabul") -----------------------------
create table if not exists public.guvenlik_kararlari (
  id            uuid        primary key default gen_random_uuid(),
  hedef_id      uuid        not null references public.guvenlik_hedefleri (id) on delete cascade,
  bulgu_imzasi  text        not null,
  karar         text        not null default 'bilerek',
  gerekce       text        not null default '',
  veren         uuid        references auth.users (id) on delete set null,
  verildi       timestamptz not null default now(),
  gecerli_commit text       not null default ''
);
create index if not exists guvenlik_kararlari_hedef_idx
  on public.guvenlik_kararlari (hedef_id, bulgu_imzasi);

-- ============================================================================
-- Satır güvenliği — hepsi yalnız yöneticiye
-- ============================================================================
alter table public.guvenlik_hedefleri    enable row level security;
alter table public.guvenlik_manifestleri enable row level security;
alter table public.guvenlik_denetimleri  enable row level security;
alter table public.guvenlik_bulgulari    enable row level security;
alter table public.guvenlik_kararlari    enable row level security;

-- Hedefler: tam yetki (yönetici)
drop policy if exists "guvenlik hedef okuma"   on public.guvenlik_hedefleri;
drop policy if exists "guvenlik hedef yazma"   on public.guvenlik_hedefleri;
create policy "guvenlik hedef okuma" on public.guvenlik_hedefleri for select
  using (public.rolum() = 'yonetici');
create policy "guvenlik hedef yazma" on public.guvenlik_hedefleri for all
  using (public.rolum() = 'yonetici')
  with check (public.rolum() = 'yonetici');

-- Manifestler: IMMUTABLE — yalnız okuma ve ekleme; update/delete YOK.
drop policy if exists "guvenlik manifest okuma"  on public.guvenlik_manifestleri;
drop policy if exists "guvenlik manifest ekleme" on public.guvenlik_manifestleri;
create policy "guvenlik manifest okuma" on public.guvenlik_manifestleri for select
  using (public.rolum() = 'yonetici');
create policy "guvenlik manifest ekleme" on public.guvenlik_manifestleri for insert
  with check (public.rolum() = 'yonetici');

-- Denetimler: IMMUTABLE — yalnız okuma ve ekleme; update/delete YOK.
drop policy if exists "guvenlik denetim okuma"  on public.guvenlik_denetimleri;
drop policy if exists "guvenlik denetim ekleme" on public.guvenlik_denetimleri;
create policy "guvenlik denetim okuma" on public.guvenlik_denetimleri for select
  using (public.rolum() = 'yonetici');
create policy "guvenlik denetim ekleme" on public.guvenlik_denetimleri for insert
  with check (public.rolum() = 'yonetici');

-- Bulgular: tam yetki (denetimden denetime güncellenir)
drop policy if exists "guvenlik bulgu okuma" on public.guvenlik_bulgulari;
drop policy if exists "guvenlik bulgu yazma" on public.guvenlik_bulgulari;
create policy "guvenlik bulgu okuma" on public.guvenlik_bulgulari for select
  using (public.rolum() = 'yonetici');
create policy "guvenlik bulgu yazma" on public.guvenlik_bulgulari for all
  using (public.rolum() = 'yonetici')
  with check (public.rolum() = 'yonetici');

-- Kararlar: okuma ve ekleme; karar kaydı da silinmesin (immutable- benzeri).
drop policy if exists "guvenlik karar okuma"  on public.guvenlik_kararlari;
drop policy if exists "guvenlik karar ekleme" on public.guvenlik_kararlari;
create policy "guvenlik karar okuma" on public.guvenlik_kararlari for select
  using (public.rolum() = 'yonetici');
create policy "guvenlik karar ekleme" on public.guvenlik_kararlari for insert
  with check (public.rolum() = 'yonetici');

-- ============================================================================
-- BİTTİ. Doğrulama için (isteğe bağlı, SQL Editor'de çalıştırılabilir):
--   select tablename, rowsecurity from pg_tables where tablename like 'guvenlik_%';
--   select tablename, policyname, cmd from pg_policies where tablename like 'guvenlik_%';
-- ============================================================================
