# Değişiklik Günlüğü

## v0.3.0 — 20 Ağustos 2026
**Adım 2 · Projeler, modüller ve sayfalar**

- Üç yeni tablo: `projects`, `modules`, `pages` — hepsi satır güvenliği (RLS) altında
- Okuma Studio'ya kabul edilen herkese açık, yazma yalnızca yöneticiye
- **Yeni Proje sihirbazı** — 4 adım, tek yazı alanı (firma adı), gerisi tıklama
  - Firma + proje rengi · Platform · Veritabanı durumu · Modüller
- Seçilen modüller şablon sayfalarıyla birlikte tek seferde kurulur
- Her projede otomatik **Proje Geneli** kovası açılır, silinemez
- Projeler ekranı: renk rozeti, durum, ilerleme çubuğu, modül/sayfa/görev sayıları
- Proje detayı: 4 özet kutusu + açılır modül ağacı, altında sayfalar
- Modül ekleme/silme/adlandırma, sayfa ekleme/silme
- Panel gerçek proje sayılarını gösteriyor, yan menüde proje sayacı canlı
- Yükleniyor iskeleti, hata ekranı ve "Tekrar dene" düğmesi
- Mobilde pencereler alttan açılan sayfa olarak geliyor
- İlerleme yüzdesi her yerde hesaplanıyor — görevler Adım 3'te bağlanacak

## v0.2.1 — 20 Ağustos 2026
**Gerçek logo**

- Nizam Soft logosu uygulamaya geçti, geçici SVG çizim kaldırıldı
- Açılış ekranı: tam logo (N + Studio)
- Giriş ve yan menü: sadece N — küçük boyutta net kalsın diye
- Telefon ve masaüstü ikonları özgün kare logodan üretildi
- Logolar repoya gömüldü, çevrimdışı da görünüyor

## v0.2.0 — 20 Ağustos 2026
**Adım 1 · Supabase ve Giriş**

- Supabase bağlandı — kütüphane repoya gömüldü, kurulum ve internet bağımlılığı yok
- Giriş artık gerçek: hatalı şifre uyarı verir, doğru şifre içeri alır
- Oturum kalıcı — sayfayı yenileyince tekrar giriş istemez
- Çıkış gerçekten oturumu kapatır
- Kayıt ekranı yok: kullanıcıları yalnızca yönetici Supabase panelinden ekler
- `profiles` tablosu — ad, rol (yönetici / geliştirici), aktiflik
- Satır güvenliği (RLS) açık: herkes yalnızca kendi profilini okuyabilir
- Profili olmayan veya kapatılmış hesap içeri alınmaz
- Yan menüde gerçek ad, baş harfli avatar ve rol görünüyor
- Ayarlar'a Hesap bölümü eklendi, Supabase durumu "Bağlı" olarak okunuyor
- Hata mesajları Türkçe

## v0.1.0 — 20 Ağustos 2026
**Adım 0 · İskelet**

- Proje kuruldu: vanilla JS SPA, derleme gerektirmez
- Açılış ekranı — logo animasyonlu, ilerleme çizgili
- Giriş ekranı (henüz doğrulama yok, doğrudan girer)
- Uygulama iskeleti: masaüstünde yan menü, mobilde alt sekme çubuğu
- Sayfalar: Panel · Projeler · Bana Atananlar · Standartlar · Ayarlar (boş durumlar)
- Koyu grafit tema, logodan türetilen palet
- PWA: telefona kurulabilir, çevrimdışı kabuk
- Uygulama ikonları logodan üretildi
