-- ==========================================================================
-- NIZAM | Studio — 57 · Eşitleme ve Güvenlik kontrolü (v0.381.0)
--
-- Atölye › Eşitleme ve proje › Güvenlik kontrolü (eski Nizam Security
-- denetim ekranlarının yerine) için üç küçük tablo:
--
--   esitleme_korunacaklar · firmaya özel, eşitlemede kaybolmaması gereken
--                           özellikler. "iz" kodda geçen bir metin; eşitleme
--                           kontrolü (araclar/esitleme-kontrol.py) onu arar.
--   guvenlik_taramalari   · "Şimdi tara" sonuçları (programın ns_studio_guvenlik
--                           fonksiyonundan · ana 498). Yalnız bulgular, veri yok.
--   guvenlik_kabuller     · "Bilerek açık" denen bulgular (ör. sipariş linkinin
--                           girişsiz fonksiyonları); bir daha sorun sayılmaz.
--
-- Okuyan ve yazan yalnız yönetici. Tekrar çalıştırmak zararsız.
-- ==========================================================================

create table if not exists public.esitleme_korunacaklar (
  id          uuid primary key default gen_random_uuid(),
  firma_kod   text not null check (firma_kod ~ '^[A-Z0-9]{1,12}$'),
  yazi        text not null check (length(yazi) between 2 and 200),
  iz          text check (iz is null or length(iz) between 3 and 200),
  olusturuldu timestamptz not null default now()
);

create table if not exists public.guvenlik_taramalari (
  id        uuid primary key default gen_random_uuid(),
  proje_id  uuid not null references public.projects (id) on delete cascade,
  zaman     timestamptz not null default now(),
  durum     text not null check (durum in ('temiz', 'bak', 'sorun')),
  ozet      text not null default '',
  bulgular  jsonb not null default '[]'::jsonb
);
create index if not exists guvenlik_taramalari_proje on public.guvenlik_taramalari (proje_id, zaman desc);

create table if not exists public.guvenlik_kabuller (
  proje_id    uuid not null references public.projects (id) on delete cascade,
  anahtar     text not null check (length(anahtar) between 3 and 300),
  olusturuldu timestamptz not null default now(),
  primary key (proje_id, anahtar)
);

do $$
declare t text;
begin
  foreach t in array array['esitleme_korunacaklar', 'guvenlik_taramalari', 'guvenlik_kabuller'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "yonetici" on public.%I', t);
    execute format('create policy "yonetici" on public.%I for all using (public.rolum() = ''yonetici'') with check (public.rolum() = ''yonetici'')', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- Bilinen korunacaklar (tekrar çalıştırınca çoğalmaz)
insert into public.esitleme_korunacaklar (firma_kod, yazi, iz)
select * from (values
  ('ME', 'Gün sonu · elle kayıt kâğıtta (Samba Excel''i inmeyince)', 'sambaElleUygula'),
  ('ME', 'Samba gün sonu okuyucu', 'sambaGunSonuCoz'),
  ('GK', 'Pirimler ekranı', 'pirim')
) v(firma_kod, yazi, iz)
where not exists (select 1 from public.esitleme_korunacaklar k where k.firma_kod = v.firma_kod and k.iz = v.iz);

notify pgrst, 'reload schema';
