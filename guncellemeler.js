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
  { surum: 'v0.321.0', tarih: '2026-10-06',
    ozet: 'Nizam Security yeni görünüm',
    maddeler: [
      'Proje açılınca özet sayfası geliyor: durum, sayılar, büyük tarama düğmesi ve adım kartları.',
      'Bir test sonucuna dokununca ayrıntısı açılıyor: ne denendi, ne oldu, ne yapmalı.',
      'Test ortamı adımında gerçek → kopya → test akışı şema olarak görünüyor.',
    ] },
  { surum: 'v0.320.0', tarih: '2026-10-05',
    ozet: 'Nizam Security artık adım adım kurulum sihirbazı',
    maddeler: [
      'Sekmeler kalktı; 9 adım tek sırada, altta Geri / İleri düğmeleri var.',
      'Proje açılınca kaldığın (ilk eksik) adım geliyor; telefonda "Tüm adımlar" listesinden istediğine gidebilirsin.',
      'Şimdilik kilit yok, tüm adımları gezebilirsin.',
    ] },
  { surum: 'v0.319.0', tarih: '2026-10-05',
    ozet: 'Nizam Security sadeleşti',
    maddeler: [
      'Erişim kuralları artık kapalı bir tablo listesi; tabloya dokununca açılıyor, rol seçip kolonları görüyorsun.',
      'Telefonda yana kayan büyük tablo kalktı.',
      'Test Ortamı adımları tek satıra indi; az kullanılan elle kontroller "yedek" başlığının altına katlandı.',
    ] },
  { surum: 'v0.318.0', tarih: '2026-10-05',
    ozet: 'Nizam Security: yeni görünüm',
    maddeler: [
      'Güvenlik Testleri sayfasının üstünde durum kartı, sayı kutuları, büyük tarama düğmesi ve adım listesi var.',
      'Tarama sürerken yüzde halkası ve hangi bölümde olduğu görünüyor.',
      'Sonuç kartları daha okunaklı: kim, ne bekleniyordu, ne oldu.',
    ] },
  { surum: 'v0.317.0', tarih: '2026-10-05',
    ozet: 'Nizam Security: teslim öncesi kontrol listesi',
    maddeler: [
      'Tarama sonucunun altında, taramanın göremediği 5 şey için işaretlenebilir bir liste var.',
      'Kuralları atlayan veritabanı fonksiyonları Studio tarafından kendiliğinden bulunup listeleniyor.',
      'Tek düğmeyle Claude\'a gizli anahtar, dosya ve fonksiyon kontrolü yaptıran prompt kopyalanıyor.',
    ] },
  { surum: 'v0.316.0', tarih: '2026-10-05',
    ozet: 'Nizam Security: fark uyarısı ve Kusursuz rozeti',
    maddeler: [
      'Gerçek veritabanı ile test veritabanı farklıysa tarama başlamadan sorar: devam mı, önce eşitleme mi.',
      'Farklar için hazır prompt: Claude hangi göç dosyalarının gerçek tarafa uygulanmadığını söyler.',
      '"Gerçek yapıyı yenile" ile damga yeniden taramaya gerek kalmadan güncellenir.',
      'Her şey geçti ve iki taraf aynıysa sonuçta "Kusursuz — açık yok" rozeti çıkar.',
    ] },
  { surum: 'v0.315.0', tarih: '2026-10-05',
    ozet: 'Nizam Security: tek düğmeyle, kopyala-yapıştırsız tarama',
    maddeler: [
      '"Taramayı başlat" artık haritayı, durum kontrolünü ve test veritabanının yapısını kendisi alıyor.',
      'Sonucun üstünde damga: "Production ile aynı yapıda test edildi" ya da kaç fark olduğu.',
      'Bir kez Test Ortamı\'nda kurulum SQL\'ini ve veri SQL\'ini yeniden çalıştırman gerekiyor.',
    ] },
  { surum: 'v0.314.0', tarih: '2026-10-05',
    ozet: 'Güvenlik testleri zayıf internette daha dayanıklı',
    maddeler: [
      'Bağlantı bir an koparsa test isteği kendiliğinden yeniden deneniyor.',
      'Yine de ulaşılamazsa sonuçların üstünde "bağlantı hatası" uyarısı çıkıyor; bunlar güvenlik sonucu sayılmıyor.',
    ] },
  { surum: 'v0.313.0', tarih: '2026-10-05',
    ozet: 'Yazma testleri: temizlik neden başarısız oldu, artık yazıyor',
    maddeler: [
      'Test bittikten sonra deneme kaydı silinemezse kart sebebini de gösteriyor.',
    ] },
  { surum: 'v0.312.0', tarih: '2026-10-05',
    ozet: 'Nizam Security: daha az adım, tek düğmeyle tam tarama',
    maddeler: [
      'Yazma testinin yardımcısı artık test ortamı kurulumuyla birlikte kuruluyor; ayrı bir SQL çalıştırmaya gerek yok.',
      'Güvenlik Testleri\'nde "Taramayı başlat": okuma, yazma ve giriş yapmamış ziyaretçi testleri tek seferde.',
      'Test ortamını bir kez yeniden kurman ve test verisini tekrar yüklemen gerekiyor.',
    ] },
  { surum: 'v0.311.0', tarih: '2026-10-05',
    ozet: 'Nizam Security: tek bir sabit test veritabanı',
    maddeler: [
      'Bütün projeler aynı test veritabanını sırayla kullanabiliyor; kurulum önceki projeyi ve onun test kullanıcılarını silip yeni projeyi kuruyor.',
      'Test veritabanına geçen projenin önceki durum bilgisi Studio\'da sıfırlanıyor; adımlar yeniden yapılıyor.',
    ] },
  { surum: 'v0.310.0', tarih: '2026-10-05',
    ozet: 'Nizam Security: gerçek veritabanı ile test veritabanı karşılaştırılıyor',
    maddeler: [
      'Test Ortamı\'nda yeni "Yapı karşılaştırması": aynı yapı SQL\'ini test projesinde çalıştırıp yapıştırınca iki tarafın RLS kuralları, yetkileri ve fonksiyonları karşılaştırılıyor.',
      'Test\'te gerçek veritabanına geçmemiş bir düzeltme varsa, test ortamını yeniden kurarken uyarı çıkıyor; yanlışlıkla silinmiyor.',
    ] },
  { surum: 'v0.309.0', tarih: '2026-10-05',
    ozet: 'Güvenlik düzeltmeleri artık repoda dosya olarak saklanıyor',
    maddeler: [
      '"Hataları bildir" raporu, Claude\'dan her düzeltmeyi repoya numaralı bir dosya olarak eklemesini ve production\'a uygulanacakların listesini vermesini istiyor.',
    ] },
  { surum: 'v0.308.0', tarih: '2026-10-05',
    ozet: 'Güvenlik testleri: programın kendi kuralları artık sarı çıkmıyor',
    maddeler: [
      'Bir işlemi programın kendi kuralı durdurduysa (ör. "irsaliye en az bir satır içermeli") test bunu geçti sayıyor ve sebebini kartta yazıyor.',
      'Sarı yalnız gerçekten bakılması gereken durumlarda çıkıyor: eksik veri, giriş sorunu, beklenmedik hata.',
    ] },
  { surum: 'v0.307.0', tarih: '2026-10-05',
    ozet: 'Yazma testleri: otomatik tarih kolonları artık sarı çıkmıyor',
    maddeler: [
      'Değerini veritabanının kendisi yazdığı kolonlar (ör. güncellenme tarihi) "fazla kısıtlı" sayılmıyor; her projede kendiliğinden tanınıyor.',
    ] },
  { surum: 'v0.306.0', tarih: '2026-10-05',
    ozet: 'Yazma testleri: katman silme yanlış alarmı giderildi',
    maddeler: [
      'Silme testi için açılan deneme kaydı artık en üst seviyeyi almıyor; Admin\'in yetkisi testte yanlışlıkla düşmüyor.',
    ] },
  { surum: 'v0.305.0', tarih: '2026-10-04',
    ozet: 'Yazma testleri: iki yanlış sonuç düzeltildi',
    maddeler: [
      'Veritabanının kendisi güncellediği alanlar (ör. "güncellendi" tarihi) artık yanlışlıkla güvenlik açığı sayılmıyor; yalnız gönderilen değer gerçekten yazıldıysa açık sayılıyor.',
      'İki parçalı kimliği olan tablolarda (ör. hesap kısayolları) deneme kaydı artık çakışmıyor.',
    ] },
  { surum: 'v0.304.0', tarih: '2026-10-04',
    ozet: 'Nizam Security: yazma testleri ve Erişim Kuralları birlikte daha akıllı',
    maddeler: [
      'Deneme değerleri artık veritabanının kurallarına uyuyor: boş olmayan metin, izinli aralıkta sayı (ör. 1–31), izinli listeden değer, tarihe tarih.',
      'Aynı fişin bacakları gibi tek başına kaydedilemeyen kayıtlar birlikte deneniyor; irsaliye gibi alt satır isteyenlerin silme kopyası alt satırlarıyla açılıyor.',
      '"Yetki ister" diye reddeden kurallar artık yetki sonucu sayılıyor, "test edilemedi" değil.',
      'Erişim Kuralları görüşmesi veritabanının mevcut güvenlik tasarımını da görüyor; çatışma olursa "modeli mi, veritabanını mı değiştirelim?" diye soruyor.',
      'Bir rol bir tabloya ekrandaki sunucu işlemiyle yazıyorsa modelde "fonksiyonla yazar" denebiliyor; o zaman doğrudan yazması beklenmiyor.',
      'Yardımcı SQL güncellendi: test projesinde bir kez yeniden çalıştır.',
    ] },
  { surum: 'v0.303.0', tarih: '2026-10-04',
    ozet: 'Güvenlik Testleri: "Hataları bildir" düğmesi ve yükleme yüzdesi',
    maddeler: [
      '"Hataları bildir" düğmesi 🔴 ve 🟡 sonuçları projenin Claude sohbetine yapıştırılacak hazır bir mesaj olarak kopyalıyor. Claude önce sebebi ve planı anlatıyor, onaysız değişiklik yapmıyor.',
      'Test çalışırken yüzde ve ince bir çubuk görünüyor.',
    ] },
  { surum: 'v0.302.0', tarih: '2026-10-04',
    ozet: 'Yazma testleri: deneme kayıtları daha akıllı',
    maddeler: [
      'Yalnız belli değerleri kabul eden alanlarda (ör. tür: tatil / bloke) artık o değerlerden biri deneniyor.',
      'Tarih ve JSON (yapılandırılmış veri) alanları da değiştirilerek deneniyor.',
      'Deneme kaydı açarken çakışmayı önlemek için yalnız bir alan değiştiriliyor; kayıt kime aitse onun kalıyor.',
      'Uygulamanın kendi kuralı bir değeri reddederse başka bir değerle yeniden deneniyor.',
    ] },
  { surum: 'v0.301.0', tarih: '2026-10-04',
    ozet: 'Yazma testleri: çok daha az "test edilemedi"',
    maddeler: [
      'Deneme kaydı açılırken kimlik ve benzersiz alanlar artık doğru dolduruluyor; başka tabloya bağlı alanlar o tablodaki gerçek değerlerden seçiliyor.',
      'Bir deneme veri hatası ya da uygulamanın kendi kuralı yüzünden başarısız olursa artık "geçti" değil "test edilemedi" sayılıyor.',
      'Yardımcı SQL güncellendi: test projesinde bir kez yeniden çalıştır.',
    ] },
  { surum: 'v0.300.0', tarih: '2026-10-04',
    ozet: 'Nizam Security: yazma testleri (ekleme, değiştirme, silme)',
    maddeler: [
      'Güvenlik Testleri artık okumanın yanında kayıt eklemeyi, değiştirmeyi ve silmeyi de deniyor — 6 test kullanıcısı ve giriş yapmamış ziyaretçi için.',
      'Sonuç verinin gerçekten değişip değişmediğine bakılarak veriliyor; denenen kayıt silinir, değişen değer geri yüklenir.',
      'Sonuç listesinde Okuma / Ekleme / Değiştirme / Silme diye süzebiliyorsun.',
    ] },
  { surum: 'v0.299.0', tarih: '2026-10-04',
    ozet: 'Nizam Security: giriş yapmamış kişinin erişimi de modelde',
    maddeler: [
      'Erişim kuralları görüşmesi artık "giriş yapmamış biri bir şey görebilsin mi?" diye de soruyor. Cevap hiçbir şeyse her şey kapalı kalıyor.',
      'Herkese açık bir şey varsa (ör. ürün listesi) "Ziyaretçi" rolü olarak yazılıyor ve test bunu da deniyor.',
    ] },
  { surum: 'v0.298.0', tarih: '2026-10-04',
    ozet: 'Güvenlik Testleri: giriş yapmamış ziyaretçi de deneniyor',
    maddeler: [
      'Test artık giriş yapmamış biri gibi de veri okumayı deniyor; dışarıdan bir kayıt bile görülürse güvenlik açığı olarak gösteriliyor.',
    ] },
  { surum: 'v0.297.0', tarih: '2026-10-04',
    ozet: 'Nizam Security: şartlı erişim kuralları test ediliyor',
    maddeler: [
      '"Kullanıcı kayıtları hariç tümü" gibi bir kolona bağlı kurallar artık şart olarak yazılabiliyor ve otomatik test ediliyor.',
      'Testte şarta uyan ve uymayan kayıtlar ayrı ayrı gösteriliyor.',
      'Veri haritasını bir kez yeniden kopyalayıp test projesinde çalıştırman gerekiyor.',
    ] },
  { surum: 'v0.296.0', tarih: '2026-10-04',
    ozet: 'Güvenlik Testleri: daha az "test edilemedi"',
    maddeler: [
      'Şubeden bağımsız roller (ör. Admin) için artık gereksiz şube uyarısı çıkmıyor.',
      'Kimliği birden fazla kolondan oluşan tablolar da test ediliyor.',
      'Veri haritasını bir kez yeniden kopyalayıp test projesinde çalıştırman gerekiyor.',
    ] },
  { surum: 'v0.295.0', tarih: '2026-10-04',
    ozet: 'Nizam Security: Güvenlik Testleri (okuma) eklendi',
    maddeler: [
      'Projede yeni "Güvenlik Testleri" sekmesi: test kullanıcıları test projesine gerçekten giriş yapıp verileri okumayı dener.',
      'Görmemesi gereken bir kaydı ya da kolonu (ör. maaş) görürse 🔴 güvenlik açığı olarak gösterilir.',
      'Yalnız test projesinde çalışır; production\'a hiç istek gitmez. Sonuçlar şimdilik kaydedilmiyor.',
    ] },
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
