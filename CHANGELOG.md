# Değişiklik Günlüğü

## v0.5.3 — 20 Ağustos 2026
**Alt boşluk kesin çözüldü**

- Ekran yüksekliği artık tahmin edilmiyor, gerçekten ölçülüyor. Adres çubuğu açılıp
  kapansa, klavye çıksa, telefon yan çevrilse bile uygulama ekrana tam oturuyor
- Alt menü ekranın en dibine yaslandı — altında hiç boşluk kalmıyor
- Alt menünün güvenli alan payı gereğinden fazlaydı, kısaltıldı

## v0.5.2 — 20 Ağustos 2026
**Alttaki beyaz boşluk kapandı**

- Uygulama artık ekrana çivili: sayfanın kendisi hiç kaymıyor, kaydırma yalnızca
  içerik alanının içinde oluyor. Altta beyaz alan kalmıyor
- Sayfanın en arkası da koyu renge boyandı — hiçbir açık kalırsa bile beyaz görünmez
- Tarayıcı çubuğu ve telefon durum çubuğu rengi yeni zemine göre güncellendi

## v0.5.1 — 20 Ağustos 2026
**Tema yenilendi · Derin Metal + Renkli Kimlik**

- Kartlar artık metal levha gibi: üstten ince ışık çizgisi, dikey gradyan, gerçek gölge
- **Her proje kendi rengini taşıyor** — kart üst kenarı, iç ton, ilerleme çubuğu ve rozet.
  Proje detayına girince üst çubuk da o renge boyanıyor, modül ikonları o rengi alıyor
- Zemin ve yazı kontrastı artırıldı; "karanlık mağara" hissi kalktı
- **3B eğilme:** fareyle kartın üzerine gelince hafifçe eğiliyor ve ışık imleci izliyor.
  Yalnızca gerçek fare varken çalışır, dokunmatikte hiç devreye girmez
- Ekran değişince kartlar sırayla süzülerek geliyor, ilerleme çubukları doluyor,
  sayılar sıfırdan sayarak yerine oturuyor
- Aynı ekranda bir şey açıp kapatınca hareket tekrarlanmıyor — sadece ekran değişiminde
- Tüm hareket yalnızca `transform` ve `opacity` ile yapıldı; ölçü ve gölge animasyonu yok
- `prefers-reduced-motion` seçili cihazlarda tüm hareket kapanıyor

**Düzeltmeler**

- Mobilde parmakla yakınlaştırma kapatıldı, ekran tam oturuyor
- Yükseklik `100dvh`'ye çevrildi — altta boşluk kalmıyor
- **Proje silinebiliyor:** kartta "…" → Adı değiştir · Rengi değiştir · Depo adresi · Arşive kaldır
- **Modül silinebiliyor:** modül satırında "…" → Adı değiştir · Modülü sil
- Mobilde uzun modül adları taşmıyor
- Eskimiş adım notları güncellendi

## v0.5.0 — 20 Ağustos 2026
**Adım 4 · Prompt motoru ve kimlik dosyası**

- **"Prompt Kopyala" çalışıyor.** Görev kartından tek tıkla hazır metin panoya gider;
  geliştirici Claude'a yapıştırır, tek kelime yazmaz
- Promptun içinde: proje bilgisi, depo adresi, görevin ağaçtaki yeri, ne yapılacağı,
  bağlı standartların tam tarifi ve kurallar
- Kurallar promptta açıkça yazıyor: commit mesajına `[NS-142]` yaz, `NIZAM.md` dosyasını
  güncelle, tasarım dilini bozma, yalnızca bu görevi yap
- **`NIZAM.md` üreticisi** — proje detayından "Kimlik Dosyası". Modüller, sayfalar,
  kullanılan standartlar, devam eden işler ve son güncelleme tek dosyada.
  Kopyalanır ya da indirilir, müşteri deposunun köküne konur
- **Standartlar ekranı gerçek oldu.** Sekiz hazır tarif kuruluyor; açılır, düzenlenir,
  yenisi eklenir, kaldırılır
- Görev oluştururken standartlar tikleniyor — tiklenenin tarifi prompta kendiliğinden giriyor
- Görev kartında bağlı standartlar etiket olarak görünüyor, sonradan değiştirilebiliyor
- Projeye **depo adresi** alanı eklendi; prompt hangi depoda çalışılacağını söylüyor
- Eskimiş "Adım 3'te gelecek" notları temizlendi

## v0.4.0 — 20 Ağustos 2026
**Adım 3 · Görevler, durumlar ve atama**

- `tasks` ve `task_events` tabloları — görev numarası `NS-101`'den başlayıp otomatik artıyor
- Dört durum: Yapılacak → Geliştiriliyor → Kontrolde → Tamamlandı
- **Revize ayrı durum değil:** Kontrolde'den not yazarak Geliştiriliyor'a geri düşürülüyor
- Görev kartı: durum şeridi, atanan, öncelik, açıklama ve tüm hareket geçmişi
- Revize notları kartta kırmızı kutuda duruyor — ne istendiği unutulmuyor
- Görev sayfaya bağlanır; olmazsa modüle, o da olmazsa Proje Geneli kovasına
- Ağaçta sayfaya tıklayınca görevleri açılıyor, oradan yeni görev eklenebiliyor
- "Bana Atananlar" gerçek listeye döndü — durum filtreleri ve sayaçlarla
- Panel ve yan menü sayaçları görevlerden besleniyor
- **İlerleme yüzdeleri canlandı:** sayfa → modül → proje, hepsi bitmiş görev oranından
- Geliştirici yalnızca kendine atanan görevleri ve o projeleri görüyor
- Veritabanı tetikleyicisi geliştiriciyi koruyor: kendi görevini "Tamamlandı" yapamaz,
  başkasının görevine dokunamaz, önceliği veya atamayı değiştiremez

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
