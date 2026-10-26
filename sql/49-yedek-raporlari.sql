-- ==========================================================================
-- NIZAM | Studio — 49 · Yedek raporları (v0.336.0)
--
-- Gece yedeğinin sonucu artık "Hata bildirimleri"ne düşmüyor; kendi
-- tablosunda duruyor ve Panel'deki "Son Yedekleme" kutusunda görünüyor.
-- Yazan yalnız `yedek` sunucu fonksiyonu (service_role); okuyan yönetici.
--
--   tur    · gece (her gece) · deneme (ayın 2'si geri yükleme denemesi)
--            · elle (Studio'dan "Şimdi yedek al"a basıldı → başlatıldı)
--   durum  · tamam · sorunlu · basladi (elle başlatıldı, sonuç bekleniyor)
--   ayrinti· {"kalemler":[{"kod","ad","durum","ayrinti"}], "drive":"tamam|hata|kurulmadi"}
--
-- Ayrıca: önceden hata bildirimi olarak gelmiş yedek mesajları "yok sayıldı"
-- yapılır (silinmez), hata rozetinden düşer.
-- Tekrar çalıştırmak zararsız.
-- ==========================================================================

create table if not exists public.yedek_raporlari (
  id          uuid primary key default gen_random_uuid(),
  tur         text not null default 'gece' check (tur in ('gece','deneme','elle')),
  durum       text not null default 'tamam' check (durum in ('tamam','sorunlu','basladi')),
  ozet        text not null default '',
  ayrinti     jsonb not null default '{}'::jsonb,
  kim         uuid,
  olusturuldu timestamptz not null default now()
);

create index if not exists yedek_raporlari_zaman_idx on public.yedek_raporlari (olusturuldu desc);

alter table public.yedek_raporlari enable row level security;

drop policy if exists "yedek okuma" on public.yedek_raporlari;
create policy "yedek okuma" on public.yedek_raporlari for select
  using (public.rolum() = 'yonetici');
-- Ekleme / değiştirme / silme kuralı yok: yalnız sunucu (service_role) yazar.

revoke all on public.yedek_raporlari from anon;
grant select on public.yedek_raporlari to authenticated;

-- Canlı yayın: yedek bitince kutu kendiliğinden tazelensin.
do $$
begin
  begin
    alter publication supabase_realtime add table public.yedek_raporlari;
  exception when duplicate_object then null;
  end;
end $$;

-- Eski yedek mesajları hata listesinden çıkar.
update public.hata_bildirimleri
   set durum = 'yoksayildi'
 where surum = 'nizam-yedek' and durum = 'yeni';

notify pgrst, 'reload schema';
