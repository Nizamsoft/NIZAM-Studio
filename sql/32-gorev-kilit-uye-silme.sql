-- ============================================================================
-- 32 · Üye silinince görev kilidi yolu kesmesin
-- ============================================================================
-- Sorun: bir üyeye görev atandıysa o üye silinemiyordu.
--
-- Neden: tasks.atanan ve tasks.olusturan sütunları "on delete set null" ile
-- bağlı. Kullanıcı silinince Postgres bu satırları kendisi güncelliyor.
-- O güncelleme de `gorev_kilit` tetikleyicisine takılıyordu: silme işlemi
-- sunucu tarafında (servis anahtarıyla) yapıldığı için auth.uid() boş
-- geliyor, tetikleyici de "Bu görev seninle ilgili değil." diyip her şeyi
-- geri alıyordu.
--
-- Çözüm: oturum yoksa (auth.uid() boş) kural işletilmiyor. Bu bir açık
-- değil — tarayıcıdan gelen her istekte auth.uid() dolu, oturumsuz istekleri
-- zaten RLS kuralları durduruyor.
--
-- Supabase → SQL Editor'da bir kez çalıştır.
-- ============================================================================

create or replace function public.gorev_kilit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.guncellendi := now();

  /* Oturum yok: bu güncelleme sunucudan geliyor (üye silinince yabancı
     anahtarın kendi yaptığı güncelleme gibi). Kural işletilmiyor. */
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
