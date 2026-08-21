-- ==========================================================================
-- NIZAM | Studio — Modül şablonları
-- Modüller koddan veritabanına taşındı; artık Ayarlar'dan düzenlenebiliyor.
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
-- İki kez çalıştırsan da bozulmaz.
-- ==========================================================================

create table if not exists public.module_templates (
  id          uuid primary key default gen_random_uuid(),
  ad          text        not null unique,
  sayfalar    text[]      not null default '{}',
  sira        int         not null default 0,
  aktif       boolean     not null default true,
  olusturuldu timestamptz not null default now()
);

alter table public.module_templates enable row level security;

drop policy if exists "sablon okuma" on public.module_templates;
drop policy if exists "sablon yazma" on public.module_templates;

create policy "sablon okuma" on public.module_templates for select
  using (public.rolum() is not null);

create policy "sablon yazma" on public.module_templates for all
  using (public.rolum() = 'yonetici')
  with check (public.rolum() = 'yonetici');

-- Hazır yedi modül. Zaten varsa dokunulmaz — kendi düzenlemen korunur.
insert into public.module_templates (ad, sayfalar, sira) values
('Stok', array['Ürün Listesi', 'Ürün Kartı', 'Stok Hareketleri', 'Depo Transferi', 'Sayım'], 1),
('Cari', array['Cari Listesi', 'Cari Kartı', 'Cari Hareketler', 'Bakiye Raporu'], 2),
('Fatura', array['Fatura Listesi', 'Fatura Oluştur', 'Fatura Detayı', 'İade', 'Tahsilat'], 3),
('Personel', array['Personel Listesi', 'Personel Kartı', 'İzin Takibi', 'Puantaj'], 4),
('Rapor', array['Genel Bakış', 'Satış Raporu', 'Stok Raporu', 'Dışa Aktarım'], 5),
('Sipariş', array['Sipariş Listesi', 'Sipariş Oluştur', 'Sipariş Detayı', 'Sevkiyat'], 6),
('Üretim', array['İş Emri Listesi', 'İş Emri Kartı', 'Reçete', 'Üretim Raporu'], 7)
on conflict (ad) do nothing;
