-- ============================================================================
-- 52 · İş Kayıtları — Claude'la yapılan her işin tek satırlık kaydı (v0.351.0)
-- ============================================================================
-- Amaç: yönetici ekibin ne yaptığını Panel › Son Hareketler'de görsün.
-- Claude bir oturumda bir şeyi değiştirip GitHub'a gönderince "is-kaydi"
-- Edge Function'ına tek satır yollar: kim, hangi program, ne yaptı.
-- Fonksiyon service_role ile buraya yazar.
--
-- Kural claude.ai'deki hesap tercihlerinde durur (bkz. IS-KAYDI-KURALI.md);
-- hangi depoda çalışılırsa çalışılsın geçerli olur.
--
-- Tarayıcıdan EKLEME yok (kural bilerek yok). Okuma ve silme yalnız yönetici.
-- Supabase → SQL Editor → yapıştır → Run. İki kez çalıştırmak zarar vermez.
-- ============================================================================

create table if not exists public.is_kayitlari (
  id          uuid primary key default gen_random_uuid(),
  kullanici   text        not null default '',   -- "Kerem Güllü"
  program     text        not null default '',   -- "Studio", "Güllüoğlu Kübban"
  is_ozet     text        not null default '',   -- tek cümle: "Alt menüyü yüzen hap yaptı"
  detay       text        not null default '',   -- madde madde ne değişti
  repo        text        not null default '',   -- "nizamsoft/nizam-studio"
  commit_no   text        not null default '',   -- son commit kısa kimliği
  oturum      text        not null default '',   -- Claude oturum adresi (varsa)
  yapildi     timestamptz not null default now(),
  olusturuldu timestamptz not null default now()
);

create index if not exists is_kayitlari_yapildi_idx on public.is_kayitlari (yapildi desc);

alter table public.is_kayitlari enable row level security;

drop policy if exists "is kaydi okuma" on public.is_kayitlari;
drop policy if exists "is kaydi silme" on public.is_kayitlari;

create policy "is kaydi okuma" on public.is_kayitlari for select
  using (public.rolum() = 'yonetici');

create policy "is kaydi silme" on public.is_kayitlari for delete
  using (public.rolum() = 'yonetici');

-- Yeni kayıt gelince Panel kendiliğinden tazelensin.
do $$
begin
  begin
    alter publication supabase_realtime add table public.is_kayitlari;
  exception when duplicate_object then null;
  end;
end $$;
