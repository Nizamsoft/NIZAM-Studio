# Değişiklik Günlüğü

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
