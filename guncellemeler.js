/* ==========================================================================
   NIZAM | Studio — Güncellemeler (yalnız Studio'nun kendi güncellemeleri)

   Bu liste "Ayarlar → Uygulama ve bakım → Güncellemeler" ekranında gösterilir.
   CHANGELOG.md teknik kayıttır; bu dosya onun GÜNDELİK DİLDE, kullanıcıya dönük
   özetidir.

   HER YENİ SÜRÜMDE buraya en üste bir madde ekle (bkz. CLAUDE.md "Her
   değişiklikte yapılacaklar"). Biçim aynen şöyle:

     { surum: 'v0.286.0', tarih: '2026-10-02',
       ozet: 'Tek cümle başlık',
       maddeler: [
         'Ne değişti — kısa, sade, kullanıcıya göre.',
         'İkinci madde (varsa).',
       ] },

   - En yeni sürüm EN ÜSTTE.
   - `ozet` tek satır; `maddeler` kısa cümleler.
   - Teknik terim yazma; "kullanıcı ne fark edecek" diye yaz.
   ========================================================================== */

const GUNCELLEMELER = [
  { surum: 'v0.294.0', tarih: '2026-10-04',
    ozet: 'Nizam Security: test ortamı kurulumu düzeltildi',
    maddeler: [
      'Değeri kendiliğinden hesaplanan kolonlar (ör. toplam = adet × fiyat) test ortamında artık hata vermiyor.',
      'Tabloların kullandığı Supabase eklentileri test projesinde de açılıyor.',
      'Bir kez Erişim Kuralları → 1. adım → Yenile yapman gerekiyor.',
    ] },

  { surum: 'v0.293.0', tarih: '2026-10-04',
    ozet: 'Nizam Security: uzun satır kuralı artık reddedilmiyor',
    maddeler: [
      'Güvenlik modelindeki satır erişimi açıklaması 200 karaktere kadar kabul ediliyor; Claude\'a da kısa yazması söyleniyor.',
    ] },

  { surum: 'v0.292.0', tarih: '2026-10-04',
    ozet: 'Nizam Security: Test Ortamı',
    maddeler: [
      'Proje sayfasına "Test Ortamı" sekmesi eklendi: gerçek veritabanının yapısı ve güvenlik kuralları ayrı bir Supabase test projesine kopyalanıyor, müşteri verisi taşınmıyor.',
      'Test kullanıcıları (Yönetici, Personel A, Personel B…) tek tuşla açılıyor; sahte test verisini Claude yazıyor.',
      'Test projesi production ile aynıysa Nizam işlemi durduruyor; SQL\'ler de production\'da kendini durduruyor.',
    ] },

  { surum: 'v0.291.0', tarih: '2026-10-04',
    ozet: 'Nizam Security: Erişim Kuralları',
    maddeler: [
      'Yeni "Nizam Security" bölümü: proje seç, gerçek veritabanı yapısını al, Claude ile kimin neyi görüp değiştirebileceğini belirle.',
      'Sonuç her tablo için rol rol Oku / Ekle / Değiştir / Sil ve satır erişimi olarak tabloda görünüyor.',
    ] },

  { surum: 'v0.290.0', tarih: '2026-10-03',
    ozet: 'Projeler sekmeleri telefonda tam görünüyor',
    maddeler: [
      'Telefonda Projeler · Deneme · Template sekmelerinin adları artık kesilmiyor; simge yazının üstünde duruyor.',
    ] },

  { surum: 'v0.289.0', tarih: '2026-10-03',
    ozet: 'Panelde deneme projeleri görünmüyor',
    maddeler: [
      'Paneldeki Aktif Projeler ve sayılar artık deneme projelerini saymıyor; onlar Projeler → Deneme\'de duruyor.',
    ] },

  { surum: 'v0.288.0', tarih: '2026-10-03',
    ozet: 'Template kapağı kendiliğinden, projeler gruplar arası taşınabiliyor',
    maddeler: [
      'Yeni template oluştururken kapak artık sorulmuyor; hazır kapaklardan biri rastgele konuyor.',
      'Projenin üç nokta menüsünden projeyi Deneme ile Gerçek projeler arasında taşıyabilirsin.',
    ] },

  { surum: 'v0.287.0', tarih: '2026-10-03',
    ozet: 'Paneldeki isim beyaz oldu',
    maddeler: [
      'Panelin üstündeki "Merhaba" yazısında adın artık kırmızı değil, beyaz görünüyor.',
    ] },

  { surum: 'v0.286.0', tarih: '2026-10-02',
    ozet: 'Güncellemeler ekranı eklendi',
    maddeler: [
      'Artık Ayarlar → Uygulama ve bakım altında "Güncellemeler" var; Studio\'ya ne eklendiğini buradan görebilirsin.',
      'Yeni sürüm çıkınca kartta "Yeni" rozeti görünür, ekrana girince kaybolur.',
    ] },

  { surum: 'v0.285.0', tarih: '2026-10-02',
    ozet: 'Projeler üç bölüme ayrıldı',
    maddeler: [
      'Projeler ekranı artık üç sekme: Projeler · Deneme · Template.',
      '"Deneme projesi oluştur" geri geldi; deneme projeleri ayrı bölümde durur, kartında "Deneme" rozeti çıkar.',
    ] },

  { surum: 'v0.284.0', tarih: '2026-10-01',
    ozet: 'Programdan standart öner',
    maddeler: [
      'Nizam Standartları ekranına "Programdan standart öner" düğmesi eklendi: Claude bir programı okuyup aday standartları çıkarır.',
    ] },

  { surum: 'v0.282.0', tarih: '2026-10-01',
    ozet: 'Güvenlik testi sütun düzeyine indi',
    maddeler: [
      'Satır okunabilir ama hassas sütun (e-posta gibi) kapalı olabilir — test artık bunu ayrı ölçüyor.',
      'Her sonucun yanında neden öyle karar verildiği (gerekçe) yazıyor.',
    ] },

  { surum: 'v0.281.0', tarih: '2026-10-01',
    ozet: 'Güvenlik sonucu daha dürüst',
    maddeler: [
      'Ölçülemeyen testlerin nedeni ayrı ayrı gösteriliyor (bağlantı, giriş, fonksiyon, karmaşık kural).',
      'Yanlış "açık" alarmları azaldı; ortak tablolar artık açık sayılmıyor.',
    ] },

  { surum: 'v0.277.0', tarih: '2026-10-01',
    ozet: 'Güvenlik akışı sadeleşti',
    maddeler: [
      'Önce bütün bilgileri yapıştırıyorsun, sonra tek "Test Et" düğmesine basıyorsun.',
      'Sonuç ekranı antivirüs gibi: skor + açıklar + tek düzeltme promptu.',
    ] },

  { surum: 'v0.273.0', tarih: '2026-09-30',
    ozet: 'Hata bildirimleri ve içe aktarma',
    maddeler: [
      'Müşteri programları "Hata bildir" ile Studio\'ya hata gönderebiliyor; bildirimler Hata Bildirimleri ekranına düşüyor.',
      'Mevcut bir programı prompt + JSON ile Studio\'ya ekleyebiliyorsun.',
    ] },
];
