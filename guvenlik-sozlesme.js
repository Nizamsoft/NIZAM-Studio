/* ==========================================================================
   NIZAM | Security — Veri Sözleşmesi (tek doğruluk kaynağı)

   Güvenlik testinin bütün sabitleri burada. Hem prompt.js (Claude'a giden
   metin) hem app.js (motor, rapor, ekran) buradan okur; ikisi ayrı yerde
   tanımlanınca zamanla birbirinden kopuyordu.

   Bu dosya index.html'de prompt.js ve app.js'ten ÖNCE yükleniyor.

   FAZ 0: yalnız sabitler bir araya getirildi. Manifest, test matrisi ve
   yeni tablolar sonraki fazların işi — buradaki "sözleşme" sabitleri
   (durumlar, sürüm, final politikası) ileride kullanılmak üzere tanımlı,
   bu fazda davranışa bağlanmadı.
   ========================================================================== */

'use strict';

/* ---------- Kod denetimi kontrol listesi ----------
   Claude bu maddeleri tek tek denetliyor; Studio da aynı listeyle sonucu
   okuyor. Her türlü program için ortak; karşılığı olmayan madde "yok". */
const GUVENLIK_KOD_ALANLARI = [
  { anahtar: 'gizli_anahtar',   ad: 'Gizli anahtar',
    soru: 'Depoda ya da git geçmişinde service_role anahtarı, sbp_ jetonu, veritabanı şifresi ya da başka bir gizli değer var mı?' },
  { anahtar: 'istemci_anahtar', ad: 'Tarayıcıdaki anahtar',
    soru: 'Tarayıcıya giden kodda yalnız publishable/anon anahtar mı var; gizli anahtar istemciye sızıyor mu?' },
  { anahtar: 'satir_guvenligi', ad: 'Satır güvenliği (göçler)',
    soru: 'Göç dosyalarında her public tabloda RLS açık mı; kurallar gerçekten sahibine/rolüne göre mi, "using (true)" gibi herkese açık kural var mı?' },
  { anahtar: 'guclu_fonksiyon', ad: 'Güçlü fonksiyonlar',
    soru: 'security definer fonksiyonlar çağıranın yetkisini kendi içinde denetliyor mu, search_path sabit mi, ziyaretçiye (anon) açık mı?' },
  { anahtar: 'sunucu_fonksiyonu', ad: 'Edge Function\'lar',
    soru: 'Her Edge Function çağıranın kim olduğunu ve yetkisini doğruluyor mu, girdiyi denetliyor mu, CORS gereğinden geniş mi, service_role ile yaptığı işi kime açıyor?' },
  { anahtar: 'yetki_istemcide', ad: 'Yetki kararı',
    soru: 'Yetki kararları yalnız arayüzde mi veriliyor (düğmeyi gizlemek gibi); aynı işlem sunucuda/RLS\'te de engelleniyor mu? Kullanıcı rolünü kendisi değiştirebiliyor mu?' },
  { anahtar: 'giris_akisi',     ad: 'Giriş ve oturum',
    soru: 'Kayıt, giriş, şifre sıfırlama ve çıkış doğru mu; herkes kayıt olabiliyor mu (olmamalıysa); pasif kullanıcı hâlâ girebiliyor mu?' },
  { anahtar: 'xss',             ad: 'Sayfaya kod sızdırma (XSS)',
    soru: 'Web sayfası ya da web görünümü (WebView) varsa: kullanıcıdan ya da veritabanından gelen metin innerHTML, template string gibi yollarla kaçışsız basılıyor mu?' },
  { anahtar: 'depolama',        ad: 'Dosya kovaları',
    soru: 'Storage kovaları gereğinden açık mı (public), kurallar dosyayı sahibine göre mi kısıtlıyor, dosya türü/boyutu denetleniyor mu?' },
  { anahtar: 'hassas_veri',     ad: 'Hassas veri',
    soru: 'Kişisel veri ya da oturum bilgisi konsola, localStorage\'a, URL\'ye ya da loglara yazılıyor mu?' },
  { anahtar: 'yerel_depolama',  ad: 'Cihazda saklanan veri',
    soru: 'Mobil ya da masaüstü programda şifre, anahtar ya da kişisel veri cihazda düz metin olarak mı saklanıyor; yerel veritabanı ya da ayar dosyası şifreli mi?' },
  { anahtar: 'ag_iletisimi',    ad: 'Ağ bağlantıları',
    soru: 'Bütün bağlantılar HTTPS mi; sertifika doğrulamasını kapatan kod var mı; program başka bir sunucuya yönlendirilebiliyor mu?' },
  { anahtar: 'dagitim',         ad: 'Kurulum ve güncelleme',
    soru: 'Program yayında hata ayıklama (debug) modunda mı kalmış; güncellemeler güvenli kanaldan ve doğrulanarak mı iniyor?' },
  { anahtar: 'bagimlilik',      ad: 'Dış kütüphaneler',
    soru: 'Dışarıdan yüklenen kütüphaneler sabit sürümlü ve güvenilir kaynaktan mı; bilinen açığı olan eski sürüm var mı?' },
];

/* ---------- Önem seviyeleri ----------
   Sıra en ağırdan en hafife. Ekranda gösterilen ad ONEM_AD'da. */
const GUVENLIK_ONEM_SIRA = ['kritik', 'yuksek', 'orta', 'dusuk'];
const GUVENLIK_ONEM_AD = { kritik: 'KRİTİK', yuksek: 'YÜKSEK', orta: 'ORTA', dusuk: 'DÜŞÜK' };

/* ---------- Sonuç durumları ----------
   FAZ 0'da eski motor yalnız ilk dördünü üretiyor. Son üçü sözleşmede
   tanımlı ama henüz üretilmiyor — sonraki fazların işi.
     acik demek       : test çalıştı, yetkisiz işlem başarılı — GÜVENLİK AÇIĞI
     kapali demek     : test çalıştı, kapı kapalı — beklenen buydu
     dogrulandi demek : beklenen izin gerçekten var (olumlu teyit)
     bilgi demek      : nötr gözlem, karar gerektirir
     atlandi demek    : bu programda karşılığı yok
     dogrulanamadi    : kanıt yok, ölçülemedi (AÇIK DEĞİL)
     aktif_test_gerekli: yanıt ancak yazma testiyle bulunur, üretimde yapılmadı */
const GUVENLIK_SONUC = {
  ACIK: 'AÇIK', KAPALI: 'KAPALI', DOGRULANDI: 'DOGRULANDI', BILGI: 'BİLGİ',
  ATLANDI: 'ATLANDI', DOGRULANAMADI: 'DOGRULANAMADI', AKTIF_TEST_GEREKLI: 'AKTİF_TEST_GEREKLİ',
};

/* Rapor tablosunda satır sıralaması: küçük değer üste. Eski motorun
   ürettiği durumlar burada; yeni durumlar da tanımlı ki sonraki fazda
   satır eklenince sıralama hazır olsun. SERBEST eski bir eş anlamlı. */
const GUVENLIK_SONUC_ONCELIK = {
  'AÇIK': 0, 'BİLGİ': 1, 'KAPALI': 2, 'SERBEST': 2,
  'DOGRULANDI': 2, 'AKTİF_TEST_GEREKLİ': 3, 'DOGRULANAMADI': 3, 'ATLANDI': 4,
};

/* ---------- Manifest sürümü ----------
   Security Manifest'in şema sürümü. Manifest değişince artacak; denetim
   hangi sürümle yapıldığını saklayacak (sonraki fazlar). */
const GUVENLIK_MANIFEST_SURUMU = '1';

/* ---------- Final kilidi politikası ----------
   Hangi durum Final'i kilitler. FAZ 0'da eski durak hâlâ "sıfır AÇIK"a
   bakıyor; bu politika sonraki fazda motora bağlanacak. Sözleşme olarak
   burada duruyor ki tek yerden okunsun.
     kilitler: bu önemdeki açık Final'i kapatır
     uyarir  : kilitlemez ama uyarı gösterir
     notlar  : yalnız bilgi notu */
const GUVENLIK_FINAL_POLITIKA = {
  acik:    { kritik: 'kilitler', yuksek: 'kilitler', orta: 'uyarir', dusuk: 'notlar' },
  dogrulanamadi:     'uyarir',   // ölçülemeyen alan: kilitlemez, "temiz değil" der
  aktif_test_gerekli:'notlar',   // üretimde yapılamayan test: yalnız not
};

/* Tarayıcıda global; ES module değil (Studio derlemesiz çalışıyor). */
