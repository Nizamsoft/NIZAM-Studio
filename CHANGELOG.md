# Değişiklik Günlüğü

## v0.9.11 — 21 Ağustos 2026
**Standart içe aktarma**

Artık standart eklemek için Supabase'e girmeye gerek yok. Standartlar
ekranındaki **Hazır blok yapıştır** düğmesi hazır metni okuyup kaydediyor.

Beklenen biçim:

```
Ad: Alt Sekme Çubuğu
Grup: Arayüz
Özet: Mobil · buzlu cam · ekranın dibine yapışık
Tarif: 900 pikselin altındaki ekranlarda...
```

- Birden fazla standart alt alta yapıştırılabilir; her yeni `Ad:` yeni kayıt
- Tarif çok satırlı olabilir — anahtar taşımayan satırlar tarifin devamıdır
- `Grup` yazılmazsa `Arayüz` kabul edilir
- Yazmadan önce önizleme: hangisi yeni, hangisinin üzerine yazılacak
- Adı ya da tarifi olmayan blok atlanır, sebebi yazılır

## v0.9.10 — 21 Ağustos 2026
**Yeni standart: Alt Sekme Çubuğu**

Studio'da yazdığımız alt sekme çubuğu kurala çevrildi — kodundan okunarak,
tahminle değil.

- `Alt Sekme Çubuğu` standardı eklendi (Arayüz grubu)
- `Menü` standardından çakışan cümle çıkarıldı ("en fazla dört sekmeli" —
  artık beş sekme var ve kural kendi standardında duruyor)
- Sıfırdan kurulum dosyaları (`05-standartlar.sql`, `kurulum.sql`) da güncellendi

> Kurulum: `sql/07-alt-sekme.sql` dosyasını Supabase'de bir kez çalıştır.

## v0.9.9 — 21 Ağustos 2026
**Grup adları da alfabetik**

- Gruplar artık sabit sırayla değil, ada göre sıralanıyor
- `config.js`'teki grup listesi yalnızca düzenleme penceresindeki hazır
  öneriler için duruyor; sıralamayı etkilemiyor

## v0.9.8 — 21 Ağustos 2026
**Grup içi alfabetik sıra**

- Bir grubun altındaki standartlar artık ada göre sıralanıyor
- Sıralama Türkçe: ç, ğ, ı, ö, ş, ü kendi yerlerinde

## v0.9.7 — 21 Ağustos 2026
**Standart tarif metni düzeldi**

Tarif metni `pre-wrap` ile yazıldığı için şablondaki girintiler de metne
karışıyordu: ilk satır sağa kayıyor, sonda kocaman bir boşluk kalıyordu.

- Tarif kendi kutusuna alındı; satır sonları korunuyor, girintiler karışmıyor
- Metnin altındaki boşluk gitti
- Grup içindeki kartlarda "kullanılmadı" yazısı mobilde gizlendi — özete yer açıldı

## v0.9.6 — 21 Ağustos 2026
**Standartlar gruplandı**

Sekiz standart düz liste halindeydi; artık başlıklar altında toplanıyor.

| Grup | Standartlar |
|---|---|
| Arayüz | Açılış Ekranı · Login · Menü · Ayarlar |
| Veri & Çıktı | Excel / PDF Çıktı · Tarih Filtresi · Dosya Yükleme |
| Bildirim | Bildirim Merkezi |

- Gruplar başta kapalı gelir; birini açınca diğeri kapanır
- Standart düzenleme penceresine **Grup** alanı eklendi — hazır adlardan
  seçilebilir ya da yeni bir ad yazılabilir
- Görev açarken ve standart seçerken de listeler gruplu görünür
- Boş grup listelenmez; `Yedekleme` ve `Güvenlik` öneri olarak duruyor,
  ilk standart eklenince listede belirir

> Kurulum: `sql/06-gruplar.sql` dosyasını Supabase'de bir kez çalıştır.

## v0.9.5 — 21 Ağustos 2026
**Standartlar alt çubuğa eklendi**

Nizam Standartları sayfası yalnızca masaüstü menüsündeydi; telefonda
ulaşmanın yolu yoktu.

- Alt çubuk 5 sekme oldu: Panel · Projeler · Görevler · Standart · Ayarlar
- 320 piksel genişliğe kadar yazılar taşmadan sığıyor

## v0.9.4 — 21 Ağustos 2026
**Alt çubuk kapandı, ölçüm ekranı kaldırıldı**

Alttaki siyah şerit sorunu çözüldü. Son engel şuydu: Safari'de eski sürüm
açık kaldığı için "Ana Ekrana Ekle" o eski sayfanın ayarlarını kopyalıyordu.
Safari yenilendikten sonra yeniden eklenince düzeldi.

- Ayarlar'daki geçici **Ekran ölçüleri** ekranı kaldırıldı

## v0.9.3 — 21 Ağustos 2026
**Tarayıcıda alt pay kaldırıldı**

Ana ekran çizgisi payı Safari'de de uygulanıyordu; oysa orada Safari'nin
kendi adres çubuğu zaten o alanda duruyor. İki pay üst üste binince
çubuğun altında boş bir bant kalıyordu.

- Alt pay artık yalnızca uygulama kipinde veriliyor
- Tarayıcıda çubuk doğrudan Safari çubuğunun üstüne oturuyor

## v0.9.2 — 21 Ağustos 2026
**Şeridin sebebi bulundu: iOS durum çubuğu ayarı**

v0.9.1'deki `lvh` denemesi çubuğu ekranın altına taşırdı — yani görünen alan
gerçekten 793. Sorun yükseklikte değil, **sayfanın ekranda nereye oturduğunda**.

`apple-mobile-web-app-status-bar-style: black-translucent` sayfayı ekranın
tepesine (0'dan başlayarak) yapıştırıyordu. Sayfa 793 piksel olduğu için
altta 59 piksel işletim sistemine ait boşluk kalıyordu — siyah şerit buydu.

`black` ile sayfa durum çubuğunun altından başlar ve **ekranın gerçek dibine**
kadar iner. Boşluk yukarı, durum çubuğunun olduğu yere taşınır — orası zaten
saat ve pil ile dolu, göze batmaz.

- `apple-mobile-web-app-status-bar-style` → `black`
- v0.9.1'deki `100lvh` denemesi geri alındı, `100dvh`'ye dönüldü
- Alt çubuk artık ekranın fiziksel dibinde; içerik altından en dibe akıyor

> Not: iOS bu ayarı uygulama ana ekrana eklenirken okur.
> **Uygulamayı ana ekrandan silip yeniden eklemek gerekiyor.**

## v0.9.1 — 21 Ağustos 2026
**Siyah şeridin gerçek sebebi: uygulama ekranın tamamını kaplamıyormuş**

Ölçümler baştan beri elimizdeydi ama yanlış okumuşum:

| | |
|---|---|
| `100lvh` (ekranın tamamı) | 852 |
| `100dvh` (kullandığımız) | 793 |
| Fark | **59 piksel** |

Uygulama kipinde `dvh` durum çubuğu payını düşüyor. `body` 793 pikselde
bitiyordu, kalan 59 piksel `html` zeminiydi — o siyah şerit buydu.
Ölçüm ekranı "altta kalan 0" diyordu çünkü `innerHeight` de aynı yanlış
793'ü veriyor; ekranın gerçek boyu 852.

- Uygulama kipinde `body` yüksekliği `100vh`/`100lvh` oldu — ekranın tamamı
- Tarayıcıda `100dvh` kaldı (adres çubuğu açılıp kapanıyor, orada doğrusu o)
- Alt çubuğun zemini artık ekranın gerçek dibine iniyor
- Ana ekran çizgisi payı çubuğun **içine** alındı: zemin dibe uzanıyor,
  yazılar çizgiyle çakışmıyor
- İçerik çubuğun altından ekranın en dibine kadar akıyor

## v0.9.0 — 21 Ağustos 2026
**Alttaki siyah şeridin sebebi bulundu**

Saydam çubuk sayesinde görüldü: en alttaki koyu şerit sayfanın *dışında*.
iOS uygulama kipinde ana ekran çizgisi bölgesini işletim sistemi kendi boyuyor,
oraya CSS ulaşamıyor. Şeridin rengi eski temadan kalma soğuk `#0d0f12` idi;
sıcak grafit zeminin yanında siyah bir bant gibi duruyordu.

- Yeni `--cerceve` (#171614) rengi eklendi — şerit ile çubuğun dibi artık aynı renk
- `manifest.webmanifest` içindeki `background_color` ve `theme_color` güncellendi
- `index.html` içindeki `theme-color` güncellendi
- `html` zemini çerçeve rengine alındı (sayfanın dışında kalan her yer)
- Çubuğun zemini üstte saydam, dipte opak çerçeve rengine bağlanıyor —
  çubuk ekranın dibine kesintisiz uzanıyormuş gibi görünüyor

> Not: iOS manifest'i uygulama ana ekrana eklenirken saklar. Rengin değişmesi
> için uygulamayı ana ekrandan silip yeniden eklemek gerekebilir.

## v0.8.9 — 21 Ağustos 2026
**Alt çubuk iyice saydamlaştı**

Arkasındaki liste artık net biçimde gözüküyor.

- Zemin koyuluğu %62–78'den %10–30'a indi
- Bulanıklık 22 → 14 piksel, arkadaki içerik seçilebiliyor
- Üst çizgi silikleştirildi

## v0.8.8 — 21 Ağustos 2026
**Alt çubuk buzlu cam oldu**

Çubuk artık içeriğin üstünde duruyor ve arkasındakini bulanıklaştırıyor.
Liste çubuğun altından akıp geçiyor.

- Yarı saydam zemin + `blur(22px)` cam etkisi
- Çubuk yerleşimden çıkarıldı, içeriğin üstüne alındı (ekranın dibinde kalmaya devam ediyor)
- Sayfalara çubuk kadar alt pay verildi, son satır çubuğun altında kalmıyor
- Cam desteklenmeyen tarayıcıda düz koyu zemine düşüyor

## v0.8.7 — 21 Ağustos 2026
**Alt çubuk daha da aşağı indi**

Yazıların altında kalan pay silindi — sekme adları artık ekranın dibine oturuyor.

- Çubuk yüksekliği 61 → 47,5 piksel
- Sekme alt payı 8 → 3 piksel, satır kutusunun bıraktığı fazlalık kaldırıldı
- Simge ile yazı arasındaki aralık 4 → 3 piksel

## v0.8.6 — 21 Ağustos 2026
**Alt çubuk: ölçüm sonucu ve görünürlük**

Cihaz ölçümü yerleşimin zaten doğru olduğunu gösterdi: iPhone 15'te ekran 852,
üst durum çubuğu 59, uygulamaya verilen alan 793 ve çubuğun altında **0 piksel**
boşluk var. Görülen "boşluk" çubuğun kendi zemininin sayfa zeminiyle aynı renkte
olmasından kaynaklanıyormuş — çubuğun nerede bittiği anlaşılmıyordu.

- Çubuğun zemini belirgin biçimde açıldı, üst kenarına ışık çizgisi eklendi
- Artık çubuğun ekranın dibine kadar indiği gözle görülüyor

## v0.8.5 — 21 Ağustos 2026

- Ayarlar → Bakım'a **Ekran ölçüleri** eklendi. Cihazın gerçek sayılarını gösteriyor:
  görünüm yükseklikleri, güvenli alan payları, alt çubuğun tam konumu ve altta kalan
  boşluk. Alt çubuk sorununu uzaktan tahminle değil ölçerek çözmek için

## v0.8.4 — 21 Ağustos 2026

- Uygulama kutusu artık dinamik görünüm yüksekliğinde (`dvh`). `inset: 0` küçük görünümü
  veriyordu (çubuk yukarıda kalıyordu), `lvh` büyük görünümü veriyordu (çubuk ekranın
  altına taşıyordu). Doğrusu ikisinin ortasındaki dinamik yükseklikmiş

## v0.8.3 — 21 Ağustos 2026
**Alt çubuk sorununun asıl sebebi bulundu**

- Sorun ekran yüksekliğinde, güvenli alanda ya da telefonda değilmiş. İçerik alanı
  dikey dizilimde kendi içeriğinden küçülemiyordu (`min-height: 0` eksikti); içerik
  uzadıkça alt çubuğu aşağı, ekranın dışına itiyordu
- `min-height: 0` eklendi. Çubuk artık içerik ne kadar uzun olursa olsun ekranın
  dibinde sabit duruyor
- Kutu yüksekliği tekrar `inset: 0`'a alındı — `lvh` bazı cihazlarda taşırıyordu

## v0.8.2 — 20 Ağustos 2026

- Uygulamanın kutusu bazı iOS kurulumlarında fiziksel ekranın tamamını kapsamıyor,
  dipten ~60 piksel kısa kalıyordu. Kutu artık "büyük görünüm" yüksekliğine (`lvh`)
  sabitlendi — tarayıcı çubukları gizliyken ekranın tamamı

## v0.8.1 — 20 Ağustos 2026
**Alt çubuk sıfırdan yazıldı**

- Eski alt çubuk kodunun tamamı silindi, temiz baştan yazıldı
- **Alt boşluk sıfır.** Çubukta hiçbir güvenli alan payı yok; ekranın en dibine yapışıyor.
  Telefonun ne bildirdiğinin bir önemi kalmadı
- Çubuk uygulama sütununun son çocuğu; sabit konum, JS ölçüm, piksel toplama yok
- Aktif sekme markanın kırmızısıyla dolu kutu içinde
- Masaüstünde çubuk gizli, yan menü çalışıyor

## v0.7.7 — 20 Ağustos 2026

- Alt çubuğun güvenli alan payı üstten sınırlandı (en fazla 20px). Bazı kurulumlarda
  iOS, tarayıcı çubuğu kadar pay bildiriyor ve çubuk havada kalıyordu
- Tarayıcı sekmesinde açıldığında pay tamamen kalkıyor — tarayıcının kendi alt çubuğu
  zaten boşluk bırakıyor, ikisi üst üste binmiyor
- Uygulama artık ana ekrandan mı tarayıcıdan mı açıldığını biliyor

## v0.7.6 — 20 Ağustos 2026
**Alt çubuk sorunu kökünden çözüldü**

Üç ayrı hata üst üste binmişti:

- **Yükseklik `window.innerHeight`'tan sürülüyordu.** iOS'ta bu değer alt güvenli alanı
  dışarıda bırakıyor; uygulama fiziksel ekrandan kısa kalıyordu. Kaldırıldı, yükseklik
  artık `inset: 0`'dan geliyor
- **Stil dosyasında daha aşağıda eski bir kural yenisini eziyordu.** Güvenli alan payını
  yarıya indiren satır oradan geliyormuş. Temizlendi, çubuk kuralı tek yerde toplandı
- **Çubuk `position: fixed`'di.** Artık uygulama sütununun son çocuğu; safe-area hesabını
  tarayıcı yapıyor, hiçbir yerde piksel toplanmıyor
- Güvenli alan payı yarım değil tam kullanılıyor — yazılar ana ekran çizgisinin üstünde
  kalıyor, çubuğun zemini fiziksel dibe kadar iniyor
- Çalışma anında boşluk ölçüp düzelten geçici yama kaldırıldı; artık gerekmiyor

## v0.7.5 — 20 Ağustos 2026

- Alt çubuk zaten ekranın dibindeymiş; asıl fark çubuğun kendi iç alt boşluğuydu.
  Güvenli alan payının tamamı yerine yarısına yakını kullanılıyor — yazılar dipten
  45 piksel yukarıdaydı, artık YouTube'daki gibi ~22 piksel

## v0.7.4 — 20 Ağustos 2026

- Alt sekme çubuğu bazı telefonlarda hâlâ dibe oturmuyordu. Artık uygulama açılışta
  ve her ekran değişiminde kalan boşluğu ölçüp çubuğu tam o kadar aşağı kaydırıyor —
  sebebi ne olursa olsun kendini düzeltiyor

## v0.7.3 — 20 Ağustos 2026

- **Alt sekme çubuğu ekranın dibine çivilendi.** Sorun boşluk ayarı değilmiş: çubuk
  uygulamanın kutusunun içindeydi ve o kutu bazı telefonlarda ekranın gerçek dibine
  ulaşmıyordu. Artık çubuk ekranın kendisine sabit — kutu ne olursa olsun en dipte kalıyor
- Tam genişlik, kenar boşluğu yok; içerik alanına çubuk kadar alt pay verildi

## v0.7.2 — 20 Ağustos 2026

- **Alt sekme çubuğu yüzen kart oldu:** kenarlardan boşluklu, yuvarlak köşeli, gölgeli.
  Aktif sekme markanın kırmızısını taşıyan dolu kutu içinde
- Proje kartındaki "…" düğmesinin ikonu tanımlı değildi, boş kırmızı kutu görünüyordu — eklendi
- Dokunmatik cihazlarda :hover parmağı kaldırınca üzerinde kalıyordu; artık yalnızca
  gerçek fare varken çalışıyor

## v0.7.1 — 20 Ağustos 2026

- Alt sekme çubuğu telefonun güvenli alan payı yüzünden gereğinden yukarıda duruyordu.
  Pay yarıya indirildi: sekmeler dibe yaklaştı, ana ekran çizgisiyle çakışma olmuyor

## v0.7.0 — 20 Ağustos 2026
**Aşama 3 · Mimari ve özellikler**

- **Otomatik güncelleme.** Uygulama açılırken sunucudaki sürümü denetliyor; yeni sürüm varsa
  önbelleği ve servis çalışanını temizleyip kendini yeniliyor. "Kapat-aç, bir daha kapat-aç"
  derdi bitti. Ayarlar → Bakım'dan elle de denetlenebiliyor
- **Canlı bağlantı.** Başka biri bir görevi ilerlettiğinde ya da yeni proje kurduğunda
  ekran kendiliğinden tazeleniyor. Peş peşe gelen değişiklikler tek tazelemede toplanıyor
- **Üst üste pencere.** Onay kutusu görev kartının üstünde beliriyor; kapanınca kart
  yerinde duruyor. Önceden alttaki pencere siliniyordu
- **Yedek alma.** Tüm projeler, modüller, sayfalar, görevler ve standartlar tek JSON
  dosyasına iniyor. Seçilen dosya imzasıyla doğrulanıp içindekiler gösteriliyor
- **Menü artık veri.** Yan menü ve mobil sekme çubuğu tek bir listeden üretiliyor;
  yeni bölüm eklemek için tek satır yetiyor
- Link paylaşımı için OG etiketleri eklendi
- Eski sürümlerden kalan yerel anahtarlar açılışta temizleniyor
- Ayarlar ikonu güneşe benziyordu, sürgü simgesiyle değiştirildi

## v0.6.1 — 20 Ağustos 2026
**Aşama 2 · Kabuk, pencereler, hareket**

- **Üst panele hesap kutusu geldi.** Mobilde yan menü olmadığı için kim olarak girdiğin
  hiç görünmüyordu; artık sağ üstte vurgu halkalı avatar duruyor, dokununca Ayarlar açılıyor
- Üst panel yapışkan oldu, altına yumuşak bir gölge kondu
- **Alt sekme çubuğu premium:** degrade zemin, üstte ince kırmızı saç teli, aktif sekmenin
  altında yaylanarak yükselen kabarcık ve ikonda hafif parıltı
- Yan menünün altına sürüm satırı eklendi
- **Pencereler yaylanarak açılıyor**, perde bulanıklaştı, üstlerinde vurgu saç teli var
- **Pencere başlıklarına rozet geldi** — solda ikonlu kutu, sağda başlık ve tek satır açıklama
- **Onay kutusu küçüldü:** başlık çubuğu kalktı, ortada uyarı ikonu ve kısa soru kaldı
- **Toast'lar türlendi:** başarı yeşil, hata kırmızı, uyarı sarı kenarlı
- Dokunmatik cihazlarda tüm dokunma hedefleri 44 piksele çıkarıldı
- Sayfa geçişi 0.24 saniyeye indi

## v0.6.0 — 20 Ağustos 2026
**Aşama 1 · Görsel dil**

- **Sıcak grafit palet.** Zemin ve yüzeyler nötr griden sıcağa kaydırıldı; metalik grafit
  kimliği duruyor ama "soğuk mağara" hissi gitti. Metin kontrastı yükseltildi
- **Tek renk kaynağı.** CSS'e dağılmış 116 sabit renk temizlendi; artık her renk tek bir
  token bloğunda. Bir rengi değiştirmek için tek yer var
- **Yazı tipi repoya gömüldü.** Space Grotesk artık dışarıdan çekilmiyor — çevrimdışında da
  geliyor, açılışta yazılar sıçramıyor. Toplam 24 KB
- Gövde yazısı sistem fontuna geçti: daha hızlı, cihazın kendi yazısı kadar tanıdık
- Küçük büyük-harf etiketler 800 ağırlığa çıktı, başlıklar sıkılaştı
- **Çift katman ikonlar.** Her simgenin altına soluk dolgu kondu. Tek çizgi ikonlar koyu
  zeminde siliniyordu; artık her biri kendi ağırlığını taşıyor. Ok, artı ve tik gibi sade
  işaretler tek katman kaldı — onlar simge değil, yön gösterir

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
