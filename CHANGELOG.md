# Değişiklik Günlüğü

## v0.134.10
- **Marka kimliği kaydedilince aynı sayfada kalıyordu.** Bu sayfada tek kart var; kaydettikten sonra orada kalmanın anlamı yoktu, bir sonraki durağın kilidi açılmış olabiliyordu. Kaydet artık ana harita (duraklar) ekranına dönüyor.

## v0.134.9
- **"Nereye kuralım?" iki ayrı pencere oldu.** Tek pencerede hem bilgi yazma hem dış bağlantılara (GitHub, Namecheap) tıklama karışıyordu. Artık önce "Yer" (paket adı, veri katmanı) dolduruluyor, Devam et'e basınca "Kurulum" (depo, sohbet, adres, yayın) ayrı pencerede açılıyor. Yer zaten doluysa doğrudan Kuruluma geçiliyor.
- **İnternet adresi iki yerden ayrı ayrı yazılıyordu.** "Yer" penceresindeki serbest metin kutusu ile "Adres" karesindeki Namecheap rehberli akışı aynı alanı (alanAdi) dolduruyordu. Serbest kutu kaldırıldı — adres artık yalnızca rehberli "Adres" karesinden giriliyor.

## v0.134.8
- **Yeni proje kurulunca "geri" doğrudan Projeler listesine atlıyordu.** Sihirbaz projeyi kurar kurmaz Marka kimliği sayfasına atlıyor, projenin kendi ana ekranı (yedi duraklı harita) geçmişte hiç yer almıyordu. Artık o ekran da geçmişe ekleniyor, "geri" önce oraya dönüyor.
- **Marka kimliği penceresinde logo ve işletme görseli yüklenemiyordu.** Bilgileri kaydedip pencereden çıkmak, sonra ayrı bir düğme aramak gerekiyordu. Logo ve görsel yükleme artık aynı pencerede — pencereyi kapatmadan ekleniyor.

## v0.134.7
- **"Kim kullanacak?" adımı hiç sorulmadan tamamlanmış görünüyordu.** Sihirbaz artık bu soruyu sormuyor ama arka planda hâlâ sabit bir varsayılan (Personel, Yönetici) yazıp kaydediyordu — dil ve para biriminde daha önce düzeltilen hata, roller alanında unutulmuştu. Yeni projeler artık roller boş kuruluyor, adım gerçekten cevaplanana kadar bitmiş sayılmıyor.

## v0.134.6
- **"Sohbet" karesine basınca yalnızca kısa bir bildirim çıkıyordu.** Prompt kopyalanınca kullanıcı sırada ne olduğunu bilmiyordu. Artık kopyalandıktan sonra üç adımı gösteren bir pencere açılıyor: Claude Code'u aç, yapıştır ve gönder, Studio'ya dönüp aynı kareye tekrar bas.

## v0.134.5
- **"Nereye kuralım?" penceresinde Kaydet, "Yayında" işaretini siliyordu.** Pencere açıkken "Yayın" karesi arka planda kendi kaydını yapıyor (GitHub'dan dönüşte); ama ana Kaydet düğmesi pencerenin açılış anındaki eski bilgiyle yazıyordu, bu da az önceki "yayında" kaydının üzerine yazıp siliyordu. Kaydet artık projenin o anki güncel halini alıp onun üzerine yazıyor.

## v0.134.4
- **Kurulum şeridi açık pencerede yenilenmiyordu.** GitHub'da depo açıp geri dönünce adres yazılıyor ama pencere eski hâlinde kalıyordu; kullanıcı "Vazgeç" deyip yeniden açmak zorundaydı. `render()` yalnız `#view` çiziyor, pencere ayrı katmanda duruyor. Şerit artık yerinde yenileniyor.
- **Sohbet adımı hiç bitmiyordu.** Kare her basışta promptu kopyalıyordu; sohbet adını soran akış vardı ama o kareye bağlanmamıştı, yani adı girmenin yolu yoktu. Prompt kopyalandıktan sonra kare adı soruyor.
- Zincir baştan sona denendi: depo yazılınca kare yeşile dönüyor, prompt kopyalanınca "Sohbet adı" oluyor, ad girilince bitiyor ve Adres sıraya geçiyor.

## v0.134.3
- **SQL dosyası düz metin olarak açılıyor.** GitHub'ın mobil görünümünde "raw kopyala" düğmesi yok; dosya görünümünden metni almak mümkün değildi. Bağlantı `/blob/` yerine `/raw/` adresine gidiyor — düz metinde uzun basıp "Tümünü Seç" çalışıyor. Adım metni de bunu söylüyor.
- Uzun dosyada bilgisayardan yapmanın daha kolay olduğu not olarak eklendi; aynı iki adres orada da geçerli.

## v0.134.2
- **SQL dosyasını Studio açıyor artık.** "Depodaki `sql/01-tablolar.sql` dosyasını bul" demek yetmiyordu — kullanıcı GitHub'da klasör klasör arıyordu. Veritabanı penceresinde iki numaralı düğme: **1 · SQL dosyasını aç** (deponun o dosyasına doğrudan gider, sağ üstteki kopyala simgesiyle tamamı panoya alınır) ve **2 · SQL editörünü aç**.
- Studio dosyanın içeriğini okuyamıyor — depo özel ve GitHub anahtarı yok — ama adresini biliyor. Aramak yerine götürüyor.
- Dosya yolu tek sabitte (`SQL_DOSYA`): 3. blok neyi söylüyorsa Studio da onu gösteriyor.

## v0.134.1
- **Uygulama açılmıyordu: tasarım durağı dışında her sayfa boş geliyordu.** `render()` içinde artık var olmayan bir sabit temizleniyordu (`GORSEL_EKRAN` — görsel dünyanın alt ekranları v0.130.0'da kalkmıştı, temizlik satırı kalmıştı). Hata çizimden önce patladığı için ekran boş kalıyor, alt çubuk ölüyor ve artı düğmesi kayboluyordu. Satır silindi.
- **Boş ekran bir daha sessiz kalmayacak.** Çizim patlarsa artık hatanın kendisi ekrana yazılıyor: hangi sayfa, hangi mesaj, yığın izinin ilk satırları ve "Hatayı kopyala" düğmesi. Telefonda konsol yok; boş ekrana bakmakla hata mesajını okumak arasında dağlar var.
- Hata olsa bile alt çubuk ve gezinme çalışmaya devam ediyor — çizim `try` içine alındı, `render()` sonuna kadar yürüyor.

## v0.134.0
- **Beta durağı kart diline geçti.** Uzun açıklama blokları ve alt alta büyük düğmeler gitti; yerine dört kare kart geldi: `01 3. blok` · `02 Veritabanı` · `03 Beş aşama` · `04 Beta çıktı`. Diğer aşamalarla aynı ızgara, aynı ölçü, aynı durum dili.
- Aşamanın kendi rengi ve simgesi oldu: turuncu `#c9753c` ve şimşek — ilk çalışan sürüm.
- **Açıklamalar karta basınca açılan pencereye taşındı.** 3. blok penceresi hangi dosyaların yazılacağını dört madde hâlinde sayıyor, veritabanı penceresi SQL'i çalıştırmanın dört adımını, beta penceresi neyi deneyeceğini. Sayfada yalnız kareler ve tek satırlık yayın adresi kalıyor.
- **Beş aşama kendi ekranına taşındı** — karta basınca açılıyor, kilitli zincir orada. Geri oku bir kat yukarı çıkarıyor.
- 3. blok için "bloğu verdim, dosyalar yazıldı" işareti eklendi: Studio deponun içini göremiyor, adımın bittiğini kullanıcı söylüyor.
- Beta çıktı penceresine "Uygulamayı aç" düğmesi eklendi — yayın adresine doğrudan gidiyor.

## v0.133.1
- **anon key ipucu eski biçimi gösteriyordu.** Supabase yeni anahtar biçimine geçti: `sb_publishable_…`. Kutudaki örnek metin ikisini de gösteriyor.
- 1. blok, anahtar yeni biçimdeyse `supabase-js` sürümünün bunu desteklediğinden emin olmasını söylüyor — eski istemci sürümü yeni anahtarı tanımıyor ve bağlantı sessizce düşüyor.

## v0.133.0
- **Supabase bağlantısı artık en başta soruluyor.** Bağlantı sonradan verilince kod önce cihaz-içi bir deneme hesabıyla yazılıyor, sonra sökülüp Supabase'e bağlanıyordu — iki kez iş, iki kez hata riski. `Kurulum ve yapı → Nereye kuralım?` adımına **Veritabanı** bölümü eklendi: "Supabase'de proje aç" düğmesi, proje adresi ve anon key. Veri katmanı yerel seçiliyse bölüm hiç görünmüyor.
- `service_role` anahtarı istenmiyor ve uyarısı yazılı: anon key tarayıcıya zaten iniyor, veriyi satır güvenliği koruyor — depoda durması normal.
- Bağlantı **1. bloktan itibaren** her prompta giriyor: `js/yapilandirma.js` içine yazılacak, başka dosyaya kopyalanmayacak. Bilgi girilmemişse blok "deneme hesabı uydurma, dur ve sor" diyor.
- **3. blok artık SQL şemasını da üretiyor** — `sql/01-tablolar.sql`: künyedeki alanlardan tablolar, foreign key'ler, indeksler ve her tabloda RLS. Baştan sona yeniden çalıştırılabilir yazılıyor, çünkü çalıştıran Claude değil kullanıcı.
- **Beta durağına `Veritabanını kur` kartı geldi**, 3. blok ile beş aşamanın arasına. SQL editörünü açan düğme (proje adresinden doğrudan o projenin editörüne gidiyor), dört adımlık "nasıl yapılır" penceresi ve "Tabloları kurdum" işareti. **Tablolar kurulmadan beş aşama kilitli** — ikinci aşamada bağlanacak veri, üçüncüde yazılacak tablo yok.
- Aşama promptlarına bir kural daha: **deneme hesabı ya da sahte veri uydurma** — bağlantı yapılandırmada, tablolar Supabase'de.
- **Bir hata yakalandı:** veri katmanı seçeneğinin metni `Supabase (bulut)`, kod ise üç yerde `=== 'Supabase'` diye bakıyordu — hiçbiri tutmazdı. Ölçüt tek yere alındı: yerel değilse sunuculu.

## v0.132.1
- **Logo hiçbir bloğa girmiyordu.** Sihirbazda alınıyor, Studio'da duruyor, ama promptlarda geçmediği için kodu yazan onu göremiyordu — açılışta, giriş kartında ve üst çubukta amblemin yeri boş bırakılıyordu. Artık 2. blokta ilk sırada, indirilecek imzalı adresiyle.
- Nereye konacağı da yazılı: açılış ekranı, giriş kartı, üst çubuk amblemi, favicon ve PWA simgesi. "Yeniden çizme, sadeleştirme, rengini değiştirme — gereken boyutlarda kendi kopyalarını üret ama çizimi bozma."
- `NIZAM.md` kimlik dosyasının görsel listesine de `logo.png` satırı eklendi.
- Görsel yuvası olmayan projede 2. blok artık "indirilecek dosya yok" derken logoyu unutmuyor; metinler `nizam/tasarim.md` bölünmesine göre düzeltildi.

## v0.132.0
- **Kimlik dosyası bölündü.** Yirmi iki sayfalık bir modülde `NIZAM.md` iki bin satıra çıkıyor ve her Claude Code oturumu onu baştan okumak zorunda kalıyordu. Artık beş dosya: `CLAUDE.md` (20 satırlık indeks, Claude Code her oturumda kendiliğinden okuyor), `NIZAM.md` (proje kimliği ve teknik standart), `nizam/tasarim.md`, `nizam/sayfalar.md`, `nizam/kararlar.md`, `nizam/durum.md`. Bir görevde yalnız gereken dosya açılıyor.
- Üç blok da kendi dosyasını dolduruyor: 1. blok iskeleti kurar, 2. blok `tasarim.md`, 3. blok `sayfalar.md` + `kararlar.md` + `durum.md`.
- **Kod artık 3. blokta başlamıyor.** Beş aşama o bloğun içinden çıktı; her aşama kendi kısa promptuyla **ayrı bir Claude Code oturumunda** yazılıyor. Tek oturumda beşini yapmak konuşmayı binlerce satıra çıkarıyor ve her yeni mesajda tamamı yeniden gönderiliyordu.
- **Beta durağına beş aşama ızgarası geldi** — kilitli zincir, kurulum sayfasındaki kart diliyle. Karta basınca o aşamanın kısa komutu ve ne yapılacağı çıkıyor; "yeni oturum aç" düğmesi yeni bir Claude Code oturumu açıyor. Studio deponun içini göremediği için biten aşamayı kullanıcı işaretliyor.
- Aşama promptu bilgi taşımıyor, **nereden okunacağını söylüyor**: `durum.md` nerede kaldığımızı, `tasarim.md` ölçüleri, `sayfalar.md` o aşamada dokunulacak sayfaların künyesini. "Sayfalar dosyasının tamamını okuma" uyarısı da içinde.
- Her aşama bitince Claude `durum.md`'yi güncelliyor — sonraki oturum nereden devam edeceğini oradan öğreniyor.

## v0.131.1
- **Tasarım sistemi promptu Nizam standartlarını taşımıyordu.** ChatGPT üst çubuğu, alt menüyü ve gezinmeyi kendi kafasına göre tarif edip standardın karşısına geçiyordu — bir denetimde çıkan sekiz çakışmanın hepsi bu eksiklikten. Artık standardın tasarımla ilgili satırları (Tasarım · Animasyon · Erişilebilirlik · Biçim · Optimizasyon) prompta giriyor: "bunlara uy, çelişiyorsan bloğu verme, önce sor".
- **Künyedeki gerçek ekran türleri prompta girdi.** Sayfa türleri ve her türden kaç sayfa olduğu yazılıyor; iskeletler bu listeden kuruluyor. Eskiden künyede olmayan bir tür (Rapor) uydurulabiliyordu.
- Yedi ya da daha çok sütunlu sayfa varsa prompt bunu sayıyla söylüyor ve **tablonun dar ekranda ne olacağını** açıkça istiyor.
- **Blok şeması genişledi:** ara renkler (bileşen tarifinde geçip listede olmayan renk kodda tek başına sabit kalıyordu), durum rozetlerinin üstündeki yazı tonu, **kontrast beyanı** (hangi renk metin olur, hangisi yalnız çizgi), grafik paleti, dokunun nasıl uygulanacağı, boş durum görselinin kaynağı, yazı tiplerinin çevrimdışı yedeği, tablo içi giriş satırı ve dar ekran davranışı.
- Yeni kurallar: **kullandığın her rengi listeye koy** · **kontrastı sen ölç** · **bileşen tarifleri birbiriyle çelişmesin** · **dosya üretme** — doku, illüstrasyon ve simge kodda çizilecek.
- İhtiyaç promptu simge listesinde sıkılaştı: her simgenin hangi sayfada geçtiği yazılacak, gösterilemiyorsa o simge gerekmiyor. Arayüzün kendi simgeleri (geri oku, arama, kapatma, ekle) da isteniyor.

## v0.131.0
- **Claude artık tahmin edip geçmiyor, soruyor.** İhtiyaç çözümlemesi bloğuna `sorular` bölümü eklendi: künyede yazmayan ama kod yazılırken karar gerektiren her şey — "Fatura numarasını sistem mi versin?", "Kapanan hesap silinebilsin mi, pasife mi alınsın?". Nedenini de yazıyor: künyede neyi görüp o soruyu sorduğunu.
- **İhtiyaç adasına beşinci kart: `Claude'un soruları`.** Sihirbaz gibi işliyor — bir soruyu cevaplayınca sıradaki cevapsız soru kendiliğinden açılıyor. Claude seçenek verdiyse çipe dokunuyorsun, vermediyse kendi cümleni yazıyorsun; seçenekler yetmiyorsa yine yazabiliyorsun.
- **Cevaplar bir kez veriliyor, her yere gidiyor.** 2/3 ve 3/3 bloklarına, `NIZAM.md` kimlik dosyasına — "Sorduklarının Cevabı · Karar verilmiştir, yeniden sorma" başlığıyla. Cevaplanmamış soru varsa blok bunu da söylüyor: "onlara denk gelirsen uydurma, dur ve sor".
- Bütün sorular cevaplanmadan ada bitmiyor. Yanlış tahmin sonradan söküp yeniden yazmak demek; bir kere sorup bir kere cevaplamak ucuz.
- 2/3 ve 3/3 bloklarının "şunları yapma" listesine bir madde daha: **emin olmadığını uydurma, dur ve sor.**
- **Regresyon düzeltildi:** ihtiyaç adasının kart eylemleri (prompt, yapıştır, kararlar, sayfa tasarımları, geri) bir önceki temizlikte silinmişti — kartlara basınca hiçbir şey olmuyordu. Hepsi geri kondu.

## v0.130.2
- **2. blok eski akıştan kalma cümleler taşıyordu.** "Bu blokta iki iş var: görselleri depoya indirmek…" diyordu ama indirilecek görsel kalmadı; başlığı da hâlâ "Görsel dil" idi. Blok artık taşıdığı şeye göre konuşuyor: tasarım sistemi — renk, tipografi, ölçüler, bileşenler, simge dili ve sayfa iskeletleri.
- Claude'a ne yazacağı açıkça sayıldı: renk kodları, yazı ölçekleri, köşe ve boşluk değerleri, on üç bileşen tarifi, simge listesi, sayfa iskeletleri. **Sayılar olduğu gibi aktarılacak** — yuvarlanmayacak.
- Yeni bir madde: renk ve ölçüler `NIZAM.md`de **tek bir değişken listesi** olarak yazılacak; her ekranda yeniden tanımlanmayacak.
- "Simge çizme — şimdi değil" uyarısı eklendi: simgeler kodu yazarken SVG olarak çizilecek, bu blokta yalnız tarifleri saklanıyor.
- Görsel indirme uyarıları yalnız indirilecek görsel varsa yazılıyor.

## v0.130.1
- **"Adayı bitir" dendiğinde 3. adanın kilidi açılmıyordu.** Görsel dünyanın bittiğini ölçen satır hâlâ eski akışa bakıyordu: serbest metin tarif ve dolu görsel yuvaları arıyordu. İkisi de bir önceki sürümde kalkmıştı, o yüzden ada hiçbir zaman bitmiş sayılmıyor ve sonraki ada kilitli kalıyordu. Ölçüt tek yere alındı — adanın kendi durumu.
- Proje sayfasındaki "Tasarımı belirleme" özeti de aynı eski ölçütten okuyordu; artık bulunduğun adıma göre konuşuyor: çözümleme yoksa Claude'a git, sistem yoksa ChatGPT'ye git, sistem geldiyse kalan kararlar.

## v0.130.0
- **Tasarımı belirleme beş adadan üçe indi:** `01 İhtiyaç çözümlemesi` · `02 Görsel dünya` · `03 Kararlar`. Ekran ekran çizdirme ve görsel yükleme tamamen kalktı. Bu aşamanın işi çalışan bir betaya yetecek kadar tasarım; profesyonel cila betadan sonra.
- **ChatGPT artık ekran değil sistem veriyor.** Tek prompt, tek levha: palet, düğmeler, kart, tablo satırı, çipler, boş durum ve simgeler yan yana. Dönen blok on üç bileşen tarifi, simge dili ve **beş sayfa iskeleti** (Panel · Liste · Form · Rapor · Ayarlar) taşıyor. 22 sayfa için 22 tasarım değil, bir sistem ve beş iskelet.
- Prompta açıkça yazıldı: **navigasyon düzenine ChatGPT karar vermiyor** — sayfaların yan menüde mi üst sekmede mi duracağı Studio'nun kararı. ChatGPT üst çubuğun ve alt menünün nasıl *göründüğünü* söylüyor. İki taraf çakışmıyor.
- **Görsel yükleme kalktı.** Claude hangi simgelerin gerektiğini söylüyor, ChatGPT simge dilini tarif ediyor, kodu yazan onları **SVG olarak çiziyor**. Dosya taşımıyoruz. Logo ve işletme görseli duruyor — onlar ChatGPT'ye giden girdi.
- **On üç karardan sekizi Nizam standardına taşındı.** Yol izi, kullanıcı menüsü, bildirim, işlem sonucu, hata ekranı, hareket miktarı ve güncelleme artık her projede aynı; destek başlığı ise `Geliştirme istekleri` standardıyla aynı işi yapıyordu, silindi. Kalan beşi — genişlik, sayfa listesi, onay & silme, içe aktarma, yedek ekranı — projeden projeye gerçekten değişiyor.
- Kabuk · Davranış · Sistem üç ayrı ada olmaktan çıkıp tek **Kararlar** adasında toplandı. Claude'un elediklerinden sonra tipik olarak dört-altı kart kalıyor: iki dakika.
- `Yedek` başlığından "değişiklik kaydı" seçeneği çıktı — `Değişiklik kaydı · Her zaman tutulur` teknik standartta zaten duruyordu, iki yerde sormak çelişki üretiyordu.
- İhtiyaç çözümlemesi artık **gereken simgelerin listesini** de veriyor: künyeden çıkarılan, bu işe ait nesneler (hesap · defter · fatura · kasa). Liste ChatGPT promptuna giriyor.
- Görev promptu ve `NIZAM.md` bileşen tariflerini, simge listesini ve sayfa iskeletlerini olduğu gibi taşıyor — AI ekranı tahmin etmiyor.

## v0.129.1
- **Tasarlanacak ekranlar artık altı genel rol değil, modülün gerçek sayfaları.** Roller sayfalarla "o türden en çok alanı olan" diye eşleştiriliyordu ve saçmalıyordu: Panel rolüne gerçek panel yerine "Nakit Akış", Ayarlar rolüne uygulamanın ayar ekranı yerine "Ödeme Yöntemleri" bir tanım sayfası düşüyordu. En çok alan en önemli ekran demek değil.
- **Hangi sayfaların kendi tasarımını hak ettiğini Claude seçiyor.** İhtiyaç çözümlemesi bloğuna `ekranlar` bölümü eklendi: dört ile yedi arası, en önemliden başlayarak, her biri gerekçesiyle. Kalan sayfalar bu ekranların diliyle kurulacak.
- Ekran listesi artık şöyle okunuyor: `Dashboard · Hesaplar · Hesap Defteri · Nakit Akış Raporu · Giriş · Ayarlar`. Giriş ve Ayarlar künyede yok ama her uygulamada var — listeye Studio ekliyor.
- **"Ekranları düzenle" eklendi.** Modülün bütün sayfaları işaretlemeli bir listede; Claude'un seçimi başlangıç, son söz kullanıcının. Modülü bilen kişi, bir kural değil.
- Her ekranın promptu artık o sayfanın kendi künyesini taşıyor: türü, beklenen kayıt, alanları, yapısı ve Claude'un yerleşim notu. "Liste ekranı çiz" değil, "Hesap Defteri ekranını çiz: tarih, açıklama, borç, alacak, bakiye".
- Izgara sabit 3+3 olmaktan çıktı; ekran sayısı kaç olursa olsun üçerli satırlara sarıyor.
- Görsel dünyayı sıfırlama ve yeni bir çözümleme aktarmak elle yapılmış ekran seçimini de temizliyor — eski seçim yeni listeye yapışıp kalmasın.

## v0.129.0
- **Görsel dünya adım adıma bölündü.** ChatGPT'ye altı ekranı tek promptta çizdirmek dağıtıyordu: birini yapıp ötekini unutuyor ya da hepsini yüzeysel bırakıyordu. Ada artık dört kare kart, her biri tek iş: `01 Malzeme` · `02 Görsel dil` · `03 Ekranlar` · `04 Görseller`.
- **02 Görsel dil ekran çizmiyor** — yalnız renk, yazı, doku, simge, köşe, boşluk istiyor. Dil oturmadan ekran çizdirmek boşa işti; ChatGPT'nin dağıldığı yer de tam orasıydı.
- **03 Ekranlar altı rol, kilitli zincir.** Roller projenin gerçek sayfalarıyla dolduruluyor: "Liste" değil **Liste · Giderler**, "Form" değil **Kayıt girişi · Gider ekle**. Her rolün kendi promptu ve kendi bloğu var; promptun içinde o sayfanın alanları ve Claude'un yerleşim notu duruyor.
- **Her adım bir JSON bloğuyla bitiyor, Studio bloğu geri çiziyor.** ChatGPT önce resmi çizip sonra JSON'a döktüğü için ikisi ayrışabiliyor; kod bloktan yazılacağı için bu fark önemli. Ekran sayfasında ChatGPT'nin resmi ile Studio'nun bloktan çizdiği tel çizim yan yana duruyor — uyuşmuyorsa blok yanlış demektir, onaylamadan geri gönderiyorsun.
- **Görsel yuvaları artık Claude'un sayfa notlarından açılıyor.** ChatGPT'nin YERLEŞİM satırlarını ayrıştıran kırılgan adım kalktı: "Giderler boş durumunda fiş çizimi" bilgisi zaten ihtiyaç çözümlemesinde vardı. Numara bir kez veriliyor ve değişmiyor — yüklenen dosya yanlış yuvaya bağlanmasın.
- **Koda giden prompt değer taşıyor.** "Sıcak kırmızı, yumuşak köşe" yerine `#8F2D22`, `köşe 18px`, `boşluk 8px`. Altı ekranın blok yerleşimi de aynı bloktan `NIZAM.md`ye ve görev promptuna giriyor.
- Yükleme yalnız `04 Görseller`de kaldı: onlar uygulamanın içinde duracak gerçek çizimler, JSON yerlerine geçmiyor.
- Görsel dünyayı sıfırlama artık dili ve ekran bloklarını da temizliyor; yuvalar çözümlemeden yeniden açılıyor.
- Eski projeler bozulmuyor: `dil` bloğu olmayan ama serbest metin tarifi olan proje dili var sayılıyor ve tarif prompta aynen giriyor.

## v0.128.2
- **İhtiyaç promptu sadeleşti: sadece tasarım soruyor.** Künyenin tamamını yeniden basıyordu — aynı sohbete modül çözümlemesi zaten yapıştırılmıştı ve `NIZAM.md` depoda duruyor. Tekrar yazmak promptun üçte ikisini kaplıyor ve tasarım sorusunu veri tablosunun altında bırakıyordu.
- Yerine tek satırlık ekran listesi geldi: `sayfa · öbek · tür · beklenen kayıt · alan sayısı`. Tasarım kararı için gereken yoğunluk bu — "tablo gerekir mi" sorusunun cevabı bu üç sayıda.
- Gerekçe isteği de buna göre değişti: "künyeden gerekçe göster" yerine "ekran listesinden gerekçe göster".

## v0.128.1
- **Proje sayfasında "Tasarımı belirleme" bitmediği hâlde yeşil duruyordu.** Aşamanın bittiğini tarife bakarak ölçüyordu; aşamada artık beş ada var ve ihtiyaç çözümlemesi de kararlar da bitmemişti. Ölçüt haritayla aynı yerden okunuyor: beş ada da bitmeden aşama bitmiş sayılmıyor.
- **Tasarım haritasında adalar kilitli zincire girdi.** Sırası gelmeyen ada kesik çerçeveli ve basılamaz — ihtiyaç çözümlemesi kalan kararların kapsamını belirlediği için sıra artık zorunlu. Biten adaya geri dönülebiliyor.
- **Görsel dünyayı sıfırlama düğmesi eklendi.** Tarif ve ChatGPT'nin ürettiği yuvalar siliniyor, sıfırdan başlanabiliyor. Logo ve işletme görseli duruyor — onlar kullanıcının kendi yüklediği malzeme, yeniden istemek gereksiz sürtünme.

## v0.128.0
- **Tasarım aşamasına yeni bir 01 adası geldi: İhtiyaç çözümlemesi.** Her projede aynı on dört kararı sormak yanlıştı — 22 sayfalık bir muhasebe modülünde tam genişlik ve sıkı tablo şart, tek ekranlık bir randevu uygulamasında o soru boşuna soruluyordu. Artık künye Claude'a gidiyor, hangi kararın bu projede gerektiğini o söylüyor.
- Claude üç şey döndürüyor: **hangi karar gerekli** (gereksiz görülen akıştan düşüyor ve prompta hiç yazılmıyor), **her karara öneri ve künyeden gerekçe**, ve **eksik gördüğü başlığı kendi açıyor** — "Tablo yoğunluğu", "Yazdırma" gibi, seçenekleriyle birlikte.
- **Dördüncüsü sayfa sayfa tasarım notu:** her sayfa için neyin nerede duracağı, hangi bileşenlerin gerektiği ve o sayfada bir görsel gerekiyorsa nerede ve ne olduğu. Bu notlar sayfa künyesinin yanına, aynı bölüme yazılıyor — AI ekranı tahmin etmiyor. Görsel listesi ChatGPT'ye giden görsel dünya promptunu da besliyor: altı genel ekran yerine bu programın gerçek görselleri isteniyor.
- **Öneri seçim yerine geçmiyor.** Kartta mavi "öneri" rozeti çıkıyor, gerekçe altta bir satır duruyor, ilerlemek için kullanıcı dokunuyor. Claude yanılırsa akış onun kararıyla sürmüyor.
- **Adaların içi de kare karta döndü.** Görsel dünya ve ihtiyaç adasındaki adımlar satır olmaktan çıktı: kurulum sayfasındaki ızgaranın aynısı, sırası gelmeyen kilitli — kesik çerçeve, basılamaz. Biten adıma geri dönülebiliyor.
- Adım listesi artık sabit değil: `tasarimAdimlari(p)` projeye göre kuruluyor. Haritadaki sayaçlar, özet, çelişki denetimi ve prompt bloğu hepsi aynı listeden okuyor.
- Yapıştırılan JSON bloğunun onarımı (kıvrık tırnak, düşen dış parantez, eksik kapanış) tek yere alındı; modül çözümlemesi ve ihtiyaç çözümlemesi aynı okuyucuyu kullanıyor — birinde düzelen ötekinde de düzeliyor.
- **Çözümleme yapılmayan projede hiçbir şey değişmiyor:** on dört karar aynen soruluyor, öneri gelmiyor, hiçbir başlık elenmiyor.

## v0.127.1
- **Tasarım aşamasında geri oku aşamadan dışarı atıyordu.** Kabuk'ta bir karardayken geri basınca harita yerine gelinen sayfaya (çoğunlukla Modüller) düşülüyordu: harita ile karar ekranı aynı adresi paylaşıyor, geçmişte iki ayrı giriş yok, ok da doğrudan tarayıcı geçmişine gidiyordu. Artık önce bir kat yukarı çıkıyor — karardan haritaya, haritadan aşamanın dışına. Yapı ağacında zaten böyleydi.

## v0.127.0
- **3. aşama "Tasarımı belirleme" yeni kart diline geçti — hem sayfası hem içi.** Aşamaya girince artık kurulum sayfasıyla birebir aynı ızgara açılıyor: üstte aşama kartı, altında dört kare (Görsel dünya · Kabuk · Davranış · Sistem), en altta "Bütün kararları gör" satırı. Biten yeşil, sıradaki kırmızı, kalanlar sakin — kurulumdaki durum dilinin aynısı.
- Aşamanın kendi rengi ve simgesi oldu: mavi `#5f86c4` ve palet simgesi. 1. aşama altın, 2. aşama yeşildi; üçü artık ilk bakışta ayrılıyor.
- **Karar ekranının tepesindeki ince şerit gitti, yerine aşama kartı geldi** — ama alçak kipte (56 piksel), çünkü o ekran kaydırılmıyor ve 84 piksel önizlemeyle seçim rafını sıkıştırıyordu. Kartın karosu aynı zamanda haritaya dönüş düğmesi.
- Noktalar artık bütün akışı değil yalnız bulunduğun adayı sayıyor; tek adımlık adada hiç çıkmıyor. Nerede olduğunu harita söylüyor, burada kaç karar kaldığı önemli.
- **Seçenek rafı ızgaraya döndü.** Yatay kaydırmada üçüncü seçenekten sonrası sağa taşıyor ve kaydırılabildiği görünmüyordu. Kartlar sayfanın geri kalanıyla aynı malzemeye geçti: aynı degrade, aynı gölge, seçilen yeşil çerçeve ve köşede tik. Aynı raf modül künyesindeki ekran türü ve kalıp seçiminde de kullanılıyor, orası da düzeldi.
- İleri düğmesi bu ekranın ana düğmesi olarak kırmızıya geçti; "Adayı bitir" bitmeden sönük, bitince yeşil kalmaya devam ediyor.
- **`style.css` içinde `.ya-` ızgara bloğu iki kez yazılıydı** — 90 satır birebir kopya, ikincisi birinciyi eziyordu. Kopya silindi. Eski ada haritasından kalan 25 ölü kural da temizlendi.

## v0.126.3
- **Kurulumdan sonra modülün "0 sayfa" görünmesi giderildi.** Yapı taslağı doğarken modülün yalnız adı konuyor, sayfaları yüklenmiyordu; ekran modülü açık ama boş gösteriyor, geri çıkıp tekrar girince düzeliyordu. Artık ad konurken sayfalar ve künyeler de yükleniyor.
- Veri henüz gelmemişse modül açılmıyor: yanlış bir "boş modül" göstermek yerine veri gelince açılıyor.

## v0.126.2
- **Eksik parantez onarımı gerçek blokla sınanınca iki açık verdi, ikisi de kapatıldı.** Kapanış parantezi kimi zaman seçime giriyor kimi zaman girmiyor; kendimiz eklediğimizde zaten varsa iki kapanış çıkıyor ve okuma yine patlıyordu — artık iki biçim de deneniyor.
- İkincisi daha sinsiydi: dış parantez düşünce **ilk sayfa nesnesi tek başına geçerli JSON oluyor** ve ayrıştırma "başarılı" görünüyordu, onarım hiç çalışmıyordu. Artık okunan nesnede `sayfalar` yoksa yanlış parçayı okuduğumuzu anlayıp onarım deneniyor.
- Yedi giriş biçimiyle sınandı: 22 sayfalık gerçek blok, kapanışsız gövde, kıvrık tırnak, düz blok, kod çitli blok okunuyor; çöp metin ve boş sayfa listesi reddediliyor.

## v0.126.1
- **Telefondan yapıştırılan blok artık okunuyor.** iOS düz tırnakları kıvrık tırnağa çeviriyor (`"` → `“`) ve `JSON.parse` patlıyordu; seçim sırasında baştaki `{` ile ilk anahtarın açılış tırnağı da düşebiliyordu. Üçü de okunurken toparlanıyor — kullanıcıya "tırnaklarını düzelt" demek çözüm değil.
- Bölünmez boşluk ve uzun tire de normale çevriliyor.
- **Dış parantezin düştüğü metinde artık `{` aranmıyor**, ayrıştırmanın başarısına bakılıyor: sayfa nesnelerinin kendi `{` işaretleri onarımı engelliyordu. Blok normal okunursa hiçbir şey değişmiyor, ancak okunamazsa onarım deneniyor.
- Altı giriş biçimiyle sınandı: kıvrık tırnak, eksik parantez, kod çitli blok, düz blok, çöp metin ve boş sayfa listesi — dördü okunuyor, ikisi doğru şekilde reddediliyor.

## v0.126.0
- **Sayfa öbeklerini artık Claude belirliyor.** Künye bloğuna `grup` alanı eklendi; prompt işe göre öbek istiyor — "Kayıtlar", "Raporlar", "Panolar", "Tanımlar", "Ayarlar" gibi. Sayfa türüne (Liste/Form) göre öbeklemek teknik bir ayrımdı, kullanıcının aradığı ayrım bu değil.
- **Öbek sırası Claude'un verdiği sıra:** menüde görüneceği düzeni o kuruyor — önce günlük kullanılanlar, en sona ayarlar. Alfabeye çevirip bu kararı bozmuyoruz. Öbeği olmayan sayfalar **"Diğer"** başlığıyla en altta.
- **Öbeğin içi alfabetik.** Yirmi sayfa arasında gözle aramak ancak öyle mümkün.
- **Öbek başlığı yeniden tasarlandı:** eski küçük gri etiket sayfa yığınının içinde kayboluyordu. Ad 13,5 puntoya çıktı, sayı rozete girdi, sağa ince bir çizgi çekildi — öbeğin nerede başladığı bir bakışta belli.
- Temizlik: modül kurallarındaki ölü rol/yetki yazımı kaldırıldı. Yetki v0.124.0'da uygulamanın Yetkiler ekranına taşınmıştı ama çözümleme hâlâ kimsenin okumadığı rol listeleri üretiyordu.

## v0.125.0
- **Modülün sayfaları türlerine göre öbeklendi:** Listeler · Formlar · Detaylar · Panolar · Takvimler · Ayarlar. Yirmi iki sayfa düz bir ızgarada aranmıyordu; her öbeğin başlığında kaç sayfa olduğu da yazıyor.
- **Türü seçilmemiş sayfalar en altta** kendi öbeğinde toplanıyor — hangilerinin eksik olduğu tek bakışta görünüyor.
- Numaralar öbeğe göre değil **baştan sona** devam ediyor: "22 sayfa" sayısı bozulmuyor, bir sayfayı numarasıyla aramak da mümkün kalıyor.
- "Sayfa ekle" karesi kendi **Ekle** başlığının altına geçti; öbeklerin arasında kaybolmuyor.

## v0.124.1
- **04. adımın adı "Hangi ekranlar olacak?" yerine "Modüller" oldu.** Ekranın kendisi zaten modül kuruyor; "ekran" demek sayfalarla karışıyordu. Özeti de "Hangi bölümler olacak", sayacı "1 modül · 24 sayfa".

## v0.124.0
- **Yetkilendirme tasarım anından uygulamanın içine taşındı.** "Kimler görür" ve "kim ne yapabilir" soruları modül kurallarından kalktı. Sebebi: müşterinin ekibi zamanla değişiyor; her işe alımda Studio'ya dönüp yeniden kod yazdırmak anlamsız.
- **Prompta "Yetkiler ekranı" şartı eklendi.** Teslim edilen uygulamada admin: kullanıcı ekler/siler, her kullanıcıya rol katmanı atar, hangi katmanın hangi sayfayı görüp hangi işi yapabileceğini açıp kapatır. Ekranı yalnız en üst katman görür; kendi katmanını düşüremez, son admini silemez. Varsayılan: en üst katman her şeyi yapar, altındakiler yalnız görür.
- **İzinler veritabanında tutuluyor ve RLS bu tabloyu okuyor** — arayüzde düğmeyi gizlemek yetmiyor, sunucu tarafında da engelleniyor. Veri yerel tarayıcıdaysa sunucu olmadığı için Yetkiler ekranı yalnız arayüzü biçimlendiriyor.
- **Modül kuralları "Ortak kural"a indi:** geriye yalnız bütün modülde geçerli iş kuralı kaldı, o da isteğe bağlı. "Kur" düğmesi artık ona bağlı değil — kuralı olmayan modül de kurulabiliyor.
- Rol merdiveni (02. adım) duruyor: uygulamanın hangi katmanlara sahip olacağını Studio söylüyor, kimin hangi katmanda olacağını uygulamadaki admin belirliyor.

## v0.123.0
- **Sayfa önizlemesi geldi.** Künye ekranındaki **"Önizlemeyi aç"** satırı, o sayfanın müşterinin ekranında nasıl görüneceğini gösteren tam ekranı açıyor. Girdiğin alanlar gerçekten sütun oluyor, seçtiğin ekran türü yerleşimi belirliyor, projenin renk paleti uygulanıyor.
- **Küçük kutu değil, kendi ekranı:** künye satırlarının altına sıkıştırılmış bir kutuda hiçbir şey okunmuyordu. Müşteriye gösterirken telefonu uzatabilmek gerekiyor.
- **Bilgisayar / Telefon** anahtarı: aynı sayfanın iki cihazdaki hâli. Seçili olan metal — kırmızı ana eyleme ait.
- Ekran türü ya da alan girilmemişse önizleme uydurma veri çizmiyor, ne eksik olduğunu söylüyor.

## v0.122.0
- **Modül ağacı üç kademeye ayrıldı:** modüller → bir modülün sayfaları → bir sayfanın künyesi. Eskiden hepsi tek ekranda iç içe açılıyordu; dikey çizgiler ve girintiler derinlik arttıkça okunmaz oluyordu. Artık her kademe kendi ekranı ve tepesinde nereden geldiğini söyleyen kart duruyor — sayfanın geri kalanıyla aynı dil.
- **Modüller ve sayfalar kare kartta:** yol haritasıyla aynı ölçü, aynı durum dili. **Kırmızı yalnız sıradaki kartta** — hepsi kırmızı olunca ekran uyarı tablosuna dönüyor ve "önce hangisi" kayboluyor; kalan eksikler sarı alt yazıyla duruyor.
- **Modül kuralları ve künye dalları satır kart.** İki kelimelik başlık ve bir satır özet için kare israftı.
- **Roller kartı ağaçtan kalktı** — 02. adımda zaten soruluyor; iki yerde durması hangisinin geçerli olduğunu belirsiz bırakıyordu.
- Logo halkası ve dikey bağlantı çizgileri kaldırıldı; hiyerarşiyi kırıntı yolu ve tepedeki kart anlatıyor.

## v0.121.1
- **Aşama başlığı ile proje künyesi artık birebir aynı ölçüde** — ikisi de 84 piksel yüksekliğinde, 54 piksellik karo, iki satır yazı ve sağda değer + etiketi. Aşama kartında üçüncü bir satır vardı, kartı künyeden uzun yapıyordu; ilerleme noktaları firma adının yanına alındı ve satır kalktı.
- Sağ sütun künyedeki yüzdeyle aynı yerde: **4/4 · adım**.
- Temizlik: eski aşama başlığı kuralları dosyada ikinci bir kopya olarak duruyor ve yenisini eziyordu — kaldırıldı.

## v0.121.0
- **Proje sayfası ile aşama sayfaları aynı düzene girdi.** İkisinin tek farkı tepedeki kartın içeriği: proje sayfasında künye (logo, firma adı, künye satırı, yüzde), aşama sayfasında o aşamanın kendi kartı — aynı renk, aynı simge, aynı ad. Bir aşamaya basınca kart kaybolmuyor, tepede kalıyor.
- **Teslim takvimi iki sayfada da aynı yerde:** başlığın hemen altında. Hangi sayfada olursan ol teslim tarihi aynı noktada.
- **Izgara üç sütun ve kareler aynı ölçüde** (121 × 121). Yol haritası 3 + 3 + 1, kurulum aşaması 3 + 1 diziliyor; son satır soldan başlıyor, yol soldan sağa akmaya devam ediyor.
- **Güncellemeler artık yatay bant değil**, ötekilerle aynı kare — "birebir aynı ölçü" kuralı bozulmasın diye. Satırlar arasındaki dirsek ikinci satırdan üçüncüye de iniyor.

## v0.120.0
- **"Nereye kuralım?" ile "Kurulum" tek adımda birleşti.** İkisi aynı sorunun iki yarısıydı: biri yeri söylüyor, öteki kuruyor. Adres girilir girilmez kurulum düğmeleri hemen altında duruyor — iki pencere arasında gidip gelmek bitti.
- **Kurulum aşaması beş adımdan dörde indi ve ızgara 2 × 2 oldu.** Beş adımın tek sayı olmasından doğan boş yuva kapandı: 01 Ne yapıyoruz · 02 Kim kullanacak · 03 Nereye kuralım · 04 Hangi ekranlar.
- **Dört kurulum kartı tek satırda.** Eskiden 2 + 2 iki ayrı şeritti (kurulum ve yayın); ikisi de aynı zincirin halkası olduğu için tek şeride indi. Kartlar küçüldü — karo 36'dan 28 piksele, başlık tek kelimeye: **Depo · Sohbet · Adres · Yayın**. Dördü 412 piksellik ekranda 76'şar piksele sığıyor.
- Durum dili aynı kaldı: yeşil tik bitti, kırmızı karo sırada, soluk olan bekliyor. Kod deposu ve proje kimliği satırları şeridin altında.

## v0.119.1
- **Düzeltme: Kurulum ve yapı aşamasına girince kurulum ızgarası yerine modül ağacı açılıyordu.** Sebep, ağacın açık olup olmadığının ayrı tutulmamasıydı: bir kez "Ekranları kur" diyen kullanıcının taslağı bellekte kalıyor ve aşamaya her girişinde ağacı geri getiriyordu.
- **Görünüm durumu veriden ayrıldı.** Taslak yarım kalan işi saklamaya devam ediyor; ağacın açık olması artık ayrı bir bayrak. Aşamadan çıkınca bayrak siliniyor, taslak duruyor — geri gelindiğinde kurulum ızgarası açılıyor ama yaptığın iş kaybolmuyor. Tasarım durağında zaten aynı kural işliyordu.

## v0.119.0
- **1. ve 2. aşamanın tepesindeki işletme görseli kalktı.** O görsel marka kartının içinde zaten duruyordu; tepede ikinci kez göstermek ekranın en değerli yerini tekrara harcıyordu.
- **Yerine adımın kendi başlığı geldi.** Büyük renkli simge, aşama adı, firma adı ve ilerleme noktaları. Kart bilerek ötekilerden iri: **56 piksellik karo** (ötekiler 28), **19 puntoluk başlık** (ötekiler 12,5) ve zeminde adımın rengiyle yayılan hafif ışık. Sayfanın neyle ilgili olduğu ilk bakışta okunuyor.
- **Her aşamanın kendi simgesi ve rengi var:** 01 marka etiketi (altın), 02 katman simgesi (zeytin). Simgeler `DURAKLAR` tanımına girdi, sonraki aşamalara da eklenebilir.
- Eski kahraman ve aşama şeridi kuralları tamamen kaldırıldı — görsel yükleme zaten marka kartındaki işletme görseli düğmesinden yapılıyor.

## v0.118.2
- **Yenileme damgası artık geçmişte birikmiyor.** Güncelleme sonrası adres `?y=<zaman>` içeriyordu; damga yalnızca önbelleği atlatmak için gerekli ve sayfa yüklendiği anda işi bitiyor. Sayfa açılır açılmaz `replaceState` ile adres sade `/#/...` hâline getiriliyor — belge zaten yüklü olduğu için yeniden istek yapılmıyor.
- **Geri tuşu sorununun son parçası buydu.** Her damgalı adres geçmişte ayrı bir girdi oluyordu; o girdiye dönüldüğünde tarayıcı HTML'i kendi önbelleğinden veriyor, yani o günkü eski sürüm ekrana geliyordu. Adres sadeleşince proje sayfasından projeler sayfasına dönüş **aynı belgede** kalıyor — hiç yeniden yükleme olmuyor, sürüm de değişmiyor.
- 0.116.1 ile 0.118.1 arasında gerçek bir sürüm geçişi kurulup ölçüldü: güncelleme sonrası adres `/#/projeler/abc`, ardından üç geri hareketi de aynı sürümde kalıyor.
- Not: bu düzeltmeden önce oluşmuş damgalı geçmiş girdileri eski kodu taşıdığı için kendiliğinden düzelmiyor. Uygulamayı bir kez tamamen kapatıp açmak o girdileri temizliyor.

## v0.118.1
- **Geri tuşunda eski sürüme düşme gerçekten düzeltildi.** v0.116.1'deki denemem yanlış teşhise dayanıyordu: sorunun bfcache olduğunu sanmıştım, oysa geri dönülen sayfa `persisted=false` ile, yani **HTTP önbelleğinden normal yükleme** olarak geliyor. O düzeltme hiç çalışmıyordu.
- **Asıl sebep sürüm denetiminin kendi korumasıydı.** Güncelleme sonrası adres `?y=…` içeriyor ve denetim "adreste `?y=` varsa hiç bakma" diyordu — sonsuz döngüyü engellemek için. Ama geçmişte kalan bir `?y=` girdisine geri dönüldüğünde de denetim çalışmıyor, kullanıcı eski sürümde kalıyordu.
- **Koruma sürüm geçişine bağlandı.** Artık her açılışta denetim yapılıyor; döngü, "aynı sürümden aynı hedefe ikinci kez yenileme" engellenerek önleniyor. Böylece geçmişteki her eski belge kendini yenileyebiliyor, ısrarcı bir sunucu da sayfayı döngüye sokamıyor.
- Üç sürümlü bir deneme sunucusuyla doğrulandı: art arda iki güncellemeden sonra geri tuşuyla dönülen her eski sayfa en yeni sürüme çıkıyor. Sürekli "yeni var" diyen ama eski dosya veren bir sunucuda ise sayfa **iki yüklemede duruyor**, döngüye girmiyor.

## v0.118.0
- **Yol haritası zigzag merdivenden kare ızgaraya geçti.** Üstte üç kart, ortada dirsek, altta üç kart, en altta yatay **Güncellemeler** bandı. Merdivende kartlar ilerledikçe yer değiştiriyordu; artık yedi aşama hep aynı yerde duruyor, göz aradığını aynı köşede buluyor.
- **Aradaki dirsek sabit.** Izgara sabit olduğu için okun da ölçülmesi gerekmiyor: kartların yerini `getBoundingClientRect` ile ölçen ve her ekran değişiminde yeniden çizen mekanizma tamamen kalktı. Üçüncü aşama bitince ok yeşile dönüyor.
- **Kurulum aşaması da aynı ızgaraya geçti.** Beş adım kare kart; basınca o adımın penceresi açılıyor. Uzun ayrıntı kartları kalktı, sayfa bir ekrana sığıyor. Biten adımın alt satırında özeti yazıyor: "Web · Mobil · Türkçe", "4 katman yetki", "Yayında".
- **04 · Kurulum'un kendi penceresi açıldı** — dört düğme (depo, sohbet, adres, yayın) ve kod deposu ile proje kimliği satırları orada.
- Durum üç renkte: **yeşil tik** bitti · **kırmızı göz** şimdi burada · **kesik çerçeve + kilit** sırası gelmedi. Kilitli aşama bağlantı bile değil.
- Sınıf adları `.ya-` önekine alındı: `.ak-` karar bileşenlerinin, `.yol` da görsel ada haritasınındı — ikisi de çakışıyordu.

## v0.117.0
- **Kurulum aşaması beş numaralı adıma bölündü, kurulum sırasına dizildi:** 01 Ne yapıyoruz? · 02 Kim kullanacak? · 03 Nereye kuralım? · 04 Kurulum · 05 Hangi ekranlar olacak?
- **Boş adım küçük kart, dolan adım ayrıntı kartı.** Boş adımlar altta "Sırada" şeridinde ikişerli duruyor; doldurulan adım şeritten çıkıp yukarıya, bilgileri anlatan tam genişlikte karta dönüşüyor. Üst taraf yapılanlar, alt taraf yapılacaklar.
- **Atlamalı doldurma kapandı.** Sırası gelmemiş adım soluk ve basılamıyor — "nereye kuralım" sorusunun cevabı, ne yaptığını bilmeden verilemiyor.
- **Terimler gündelik dile çevrildi.** Platform → *nerede çalışacak* · Veritabanı → *veriler* · Arayüz dili → *uygulama dili* · Veri katmanı → *veriler nerede duracak* · Alan adı → *internet adresi* · Modül adı → *bu paketin adı* · Depo → *kod deposu* · Kimlik dosyası → *proje kimliği*. Başlıklar da soru oldu.
- **Tek büyük düzenleme penceresi dörde bölündü.** Her adım kartı yalnız kendi sorularını açıyor: Ürün, Roller, Yer ve Takvim. Uzun formu taramak yerine tek soruya odaklanılıyor.
- **Takvim şeridi dokunulabilir** — üstündeki şeride basınca tarih penceresi açılıyor.
- Aşama şeridinde adım sayacı: **3/5**.
- Düzeltme: eski projelerde "Ürün 0/4" görünüyordu. Platform ve veritabanı sütunda `not null` olduğu için kartın "görüldü" işaretini ayrıca tutuyorduk, ama o işaret eski projelerde yok. Artık uygulama dili ve para birimi girilmişse adım dolu sayılıyor — eski projeler kendiliğinden düzeliyor.

## v0.116.1
- **Düzeltme: güncelledikten sonra geri basınca eski sürüm geliyordu.** Geri tuşuyla dönülen sayfa tarayıcının bfcache'inden geliyor — betikler baştan çalışmıyor, dolayısıyla açılıştaki sürüm denetimi de çalışmıyor. Eski belge `app.js?v=<eski>` yüklediği için ekrana gerçekten eski sürüm geliyordu. Artık `pageshow` olayı bfcache dönüşünü yakalayıp denetimi tekrarlıyor; eski sürüm bulunursa sayfa kendini yeniliyor. `?y=` adresindeki sayfada denetim yine yapılmıyor — sonsuz döngü olmasın.

## v0.116.0
- **Aşamalar konuşulan yere göre bölündü.** 1. aşama **"Marka kimliği"** oldu — müşteriyle konuşarak doldurduğun taraf. 2. aşama **"Kurulum ve yapı"** — klavye başında doldurduğun taraf. İkisi karışıkken hangi kafayla oturulacağı belli olmuyordu.
- **1 · Marka kimliği:** tek kart. Firma adı, telefon, e-posta, sektör; ayracın altında logo, proje rengi ve **işletme görseli**. Tasarım görselleri (G1, G2…) 3. aşamada kaldı — onlar ChatGPT'ye tarif için gidiyor, markanın parçası değil.
- **2 · Kurulum ve yapı:** dört kart. **Ürün** (platform, veritabanı, arayüz dili, para birimi) · **Roller** · **Yer** (veri katmanı, alan adı, modül adı, depo, kimlik dosyası, sohbet adı + kurulum ve yayın şeritleri) · **Modüller**. Takvim şeridi de buraya taşındı: teslim planı kurulumun parçası.
- **Modül kurma akışı artık kartın altında.** 2. aşamaya girince doğrudan ağaç açılmıyor; önce kurulum kartları geliyor, "Modül kur" ile akış açılıyor, "Kapat" ile geri dönülüyor.
- **Düzenleme penceresi ikiye ayrıldı:** **Marka** (firma, iletişim, sektör) ve **Kurulum** (ürün, roller, yer, takvim). Her pencere kendi aşamasının kartlarını taşıyor.
- **Platform ve veritabanı ilk kez düzenlenebilir oldu.** Sihirbaz artık sormuyordu, düzenleme penceresinde de yoktu — sütun varsayılanına mahkûmdular.
- Sihirbaz dil ve para birimini varsayılanla yazmayı bıraktı; platform ve veritabanı sütunda `not null` olduğu için Ürün kartı "doldurdum" işaretini paletten okuyor. İkisi de aynı amaca hizmet ediyor: kart dolu görünüp kullanıcı hiç bakmasın diye değil, sorulsun diye.
- Bitiş çizgileri yenilendi: 1. aşama **ad + telefon + e-posta + sektör** ile bitiyor (logo isteğe bağlı), 2. aşama **depo + sohbet + modül + sayfa** ile.

## v0.115.0
- **Sihirbaz beş adımdan tek ekrana indi.** Artık yalnız **firma adı** soruluyor. Uzun form kullanıcıyı yoruyordu ve geçiştirme cevapları geliyordu — sektör boş, takvim boş, roller varsayılan. "Projeyi kur"a basıldığı anda proje açılıyor ve doğrudan **Firma ve kurulum** sayfası geliyor.
- **Sorular kartlara taşındı.** Sektör, platform, veritabanı, dil, para → **İş**. Yetkili, iletişim, roller → **Kişiler**. Veri katmanı, alan adı, modül adı, depo → **Yer**. Takvim kendi şeridinde. Modüller 2. aşamaya (Yapıyı kurma) bırakıldı — zaten orada kuruluyor.
- **Boş kartın davet hâli geldi:** kesik çerçeve, tek satır **gerekçe** ve kırmızı **Doldur** düğmesi. Gerekçe kasıtlı — "sektör" diye sorunca geçiştiriliyor, *"promptun ilk satırları bundan çıkıyor"* deyince dolduruluyor.
- **Sırası gelmemiş kart soluk ama kilitli değil.** Sıra önerisi bu; isteyen atlayıp doğrudan doldurabiliyor. Ekranda tek kırmızı eylem kalsın diye bekleyen kartın düğmesi metal.
- **Kart başlıklarında sayaç:** 0/5 → 5/5. Kart dolunca bugünkü künye hâline dönüşüyor.
- **Marka satırı açıldı.** Logo ve renk sihirbazdan kalktı, **İş** kartında tek satırda toplandı: dokununca logo yükleme ya da renk seçme çıkıyor.
- Düzeltme: `ICON.boya` tanımlı değildi — proje menüsündeki "Rengi değiştir" satırının karosu boş çiziliyordu. Simge eklendi.

## v0.114.0
- **Alan adı ve yayın kurulumu Yer grubuna geldi.** Kurulum şeridi ikiden dörde çıktı, iki sıra hâlinde: **Kurulum** (depo → sohbet) ve **Yayın** (alan adı → GitHub Pages).
- **3 · Alan adı kaydı.** Basınca açılan pencerede Namecheap'e yazılacak dört değer hazır duruyor — Type, Host, Value, TTL — her birinin kendi kopyala düğmesiyle. Alttaki düğme doğrudan **o alan adının Advanced DNS sayfasını** açıyor. Dönünce "Alan adını yaz" ile künye satırına geçiyor.
- **4 · GitHub Pages.** Alan adını panoya alıp deponun `Settings → Pages` sayfasını açıyor. Dönüşte durak "yayında" işaretleniyor ve kart siteye giden bağlantıya dönüyor.
- **Kök alan adı Ayarlar'a bir kere yazılıyor** (Yayın bölümü). Studio her projeye firma adının ilk iki kelimesinden alt alan türetiyor: "Merkez Efendi Köftecisi" → `merkezefendi`. Yazılmamışsa 3. kart Ayarlar'a yolluyor.
- **Sıralama koda bağlı:** 4. kart, 2. kart bitmeden açılmıyor. GitHub boş depoda Pages açtırmıyor; ilk commit tanışma promptuyla geliyor.
- **Beta'daki kurulum kontrolleri kalktı.** Alan adı ve Pages orada duruyordu, ama DNS'in yayılması ve sertifikanın çıkması zaman alıyor — erken kurulması gerekiyor. Beta'da artık tek satır var: yayın adresi ve siteye giden bağlantı.
- Tam otomatik değil, bilerek: Namecheap API'si sunucu ve gizli anahtar istiyor, Studio ise tarayıcıda çalışıyor. Değerleri hazırlayıp doğru sayfayı açmak elle yazılacak her şeyi ortadan kaldırıyor.

## v0.113.2
- **NIZAM.md künye satırına geçti.** Kartların altındaki ayrı rozet kalktı; kimlik dosyası artık Alan adı ve Modül adı ile aynı ızgarada, aynı biçimde duruyor. Dokununca içeriği yine açılıyor. Yer kartında artık tek bir liste var: veri katmanı, alan adı, modül adı, depo, kimlik dosyası, sohbet adı.

## v0.113.1
- Firma sayfasının altındaki **"Bilgileri düzenle" düğmesi kalktı** — her kartın kendi kalemi zaten aynı pencereyi açıyor.
- Yer kartının dibindeki **yığın/barındırma standardı açıklaması kalktı**: her açılışta okunacak bir şey değil, sayfayı uzatıyordu.

## v0.113.0
- **Depo adresi künye satırına çıktı.** Kartların altındaki ayrı adres kutusu kalktı; depo artık Modül adı ve Alan adı ile aynı ızgarada, aynı biçimde duruyor. Dokununca adres soruluyor.
- **Yeni künye satırı: Sohbet adı.** Claude Code oturumunu hangi adla açtığın buraya yazılıyor — sonra hangi sohbete döneceğini aramadan buluyorsun.
- **Sohbet adı satırı prompt kopyalanana kadar pasif:** soluk duruyor ve "promptu kopyalayınca" yazıyor. Ortada adı verilecek bir sohbet yokken sormak anlamsız.
- **2. kartın üç hâli oldu:** "Claude Code promptu" → basınca "Prompt panoda · Sohbet adını yaz" → isim girilince **"Sohbet hazır"** ve altında sohbetin adı.
- **Aşamanın bitiş çizgisi artık sohbet adı.** Depo adresi + sohbet adı yazıldığında 1. aşama tamamlanıyor; "prompt panoda" yarı yol.
- Düzeltme: tek simgeli araç kartlarında karo boş görünüyordu. Kural iki simgeli standartlar kartı için yazılmıştı, `:last-child` tek simgeye denk gelip onu gizliyordu.

## v0.112.1
- **"Oturumu açtım" onay kutusu kalktı.** Claude Code promptuna basmak zaten oturumu açmak demek: prompt panoya alınıyor, kart yeşile dönüyor ve aşama aynı anda tamamlanıyor. Kullanıcıya aynı şeyi iki kere söyletmeye gerek yok — kopyalayıp Claude Code'a gitmekten başka yapacak bir şey yok.

## v0.112.0
- **2. aşama 1'e katıldı: aşama sayısı 8'den 7'ye indi.** "Depo ve sohbet" ayrı bir durak olmaktan çıktı, 1. aşamanın adı **"Firma ve kurulum"** oldu.
- **Asıl kazanç sayı değil:** 1. aşama kodda `bitti: true` sabitti — hep yeşil görünüyor, kimsenin bitirdiği bir iş olmuyordu. Artık gerçek bir bitiş çizgisi var: **depo adresi kayıtlı + "Oturumu açtım" işaretli.**
- **Kurulum adımları Yer kartının içinde**, standartlar sayfasının araç kartlarıyla aynı dilde: yan yana iki kart, aralarında bağlantı çizgisi, sıra ilerledikçe kırmızı karo yeşile dönüyor.
- **1. kart — GitHub deposu.** Basınca doğrudan `github.com/new` açılıyor; depo adı ve açıklaması dolu, gizli seçili. Adres kaydedilince kart yeşile dönüp "Depo hazır · Depoyu aç" oluyor.
- **2. kart — Claude Code promptu.** Basınca tanıtım promptu **yalnızca panoya alınıyor; Claude açılmıyor.** Kart yeşile dönüp "Prompt panoda · Claude Code'da yapıştır" yazıyor. Standartlardaki prompt kartıyla birebir aynı davranış — Claude'u sen açıyorsun.
- Depo adresi yokken 2. kart soluk ve basılamaz: adres olmadan Claude Code en son kullanılan depoyu açıyor, yanlış depoda çalışmaya başlanıyor.
- **Modül adı** Yer kartına dokunulabilir bir künye satırı olarak girdi — depo adı ondan türetiliyor.
- Sihirbaz proje kurunca artık `/firma` adresine atıyor; `/kurulum` adresi kalktı. Durak simgeleri ve kilit zinciri bir kaydı. Kayıtlı veri etkilenmedi.

## v0.111.0
- **Firma bilgileri kartları soruya göre gruplandı.** Künye/Yetkili/Teknik yerine **İş** (ne yapıyoruz), **Kişiler** (kim), **Yer** (nerede duruyor). Sayfaya bakan bu üç soruyu sırayla okuyor.
- **Takvim künyeden çıkıp kendi ince şeridine geçti.** "Ne zaman" ayrı bir soru; künyenin dibindeki alt satırda saklı kalıyordu. Şerit aşama şeridinin hemen altında: ray, iki tarih ve büyük punto kalan gün. Gecikince gün sayısı kırmızıya dönüyor.
- **Durum satırı silindi.** Kahramandaki "%34 tamam" ile aynı şeyi söylüyordu.
- **Kişiler kartı iki tarafı birleştiriyor:** üstte müşteri tarafındaki yetkili ve ona ulaşma yolları, ayracın altında uygulama tarafındaki rol katmanları. İkisi de "kim" sorusunun cevabı.
- **Yer kartı** veri katmanı ve alan adını taşıyor; depo ile NIZAM.md ayracın altında, çünkü onlar düzenlenen değil gidilen şeyler.
- **İki düzenleme penceresi tek pencerede birleşti.** Gruplar ikisinin ortasından geçtiği için (roller "kim", alan adı "nerede") ayrı Firma ve Teknik pencereleri anlamını yitirdi. Tek pencerede sayfayla birebir aynı kartlar var: İş · Kişiler · Yer · Takvim. Kaydederken hem projenin alanlarına hem palete yazıyor.
- Alan adı gibi uzun değerler iki sütuna sığmadığı için Yer kartı tek sütun; takvim şeridindeki tarihlerden "başladı/teslim" ekleri kalktı — 412 piksellik ekranda kesiliyorlardı.

## v0.110.0
- **Teknik bilgiler penceresi de kart diline geçti.** Üç ayrı blok yerine iki kart: **Altyapı** (veri katmanı ve alan adı — ikisi de "nerede duracak" sorusu) ve **Roller**.
- **Rol merdiveni ikonlandı.** En geniş yetki kalkan, en dar kilit, aradakiler kişi — sayfadaki rol rozetleriyle aynı simgeler. Gri kutular kalktı; satırlar çizgiyle ayrılıyor, odaklanınca simge ve çizgi o katmanın rengine dönüyor.
- **Katman sayısı düğmeleri kırmızıdan metale döndü.** Kırmızı yalnız logo, ana buton, aktif menü ve "Acil" için; burada seçim işaretiydi.
- Merdiven üç yerde kullanılıyor (teknik penceresi, yapı ağacındaki Roller ekranı, yeni proje sihirbazı) — üçü de aynı anda yeni görünüşe geçti, iki ayrı merdiven kalmasın diye.
- **Uzun açıklamalar kart dibindeki not kutusuna indi.** Alan adının ve veri katmanının ne işe yaradığı artık etiketin yanını şişirmiyor.
- Kart başlıklarında canlı sayaç: Altyapı'da kaç alan dolu, Roller'de kaç katman var.

## v0.109.0
- **Depo ve kimlik dosyası Teknik kartına taşındı.** İkisi de kodun nereye gittiğiyle ilgili, yetkili kişiyle değil. Yetkili kartında artık yalnız kişi ve ona ulaşma yolları var; başlığı da "Yetkili kişi" oldu.
- **Firma bilgileri düzenleme penceresi sayfayla aynı dile geçti.** Sekiz alanı alt alta dizen düz liste yerine sayfadaki üç kartın aynısı: Künye, Yetkili kişi, Takvim.
- **Gri kutular kalktı.** 44 piksellik giriş kutuları yerine renkli simge + etiket + alt çizgi; yazı doğrudan çizginin üstünde. Odaklanınca hem simge hem çizgi o alanın rengine dönüyor — nerede yazdığın belli.
- **Sektör, arayüz dili ve para birimi rozet oldu.** Seçili rozet metal, kırmızı değil: kırmızı yalnız Kaydet düğmesinde kalıyor.
- Kart başlıklarının sağında **kaç alan dolu** yazıyor (2/3 gibi) ve yazdıkça anında güncelleniyor.
- Ölçüldü: pencerenin boyu kısalmıyor (779 → 818 piksel) — kart çerçeveleri alanlardan kazanılanı geri alıyor. Kazanç yerde değil, hangi bilginin nereye gittiğinin görünmesinde.

## v0.108.0
- **1. adım "Firma bilgileri" dashboard'a döndü.** Tepede firma kartına yüklenen işletme görseli tam genişlikte, üstünde proje adı ve rozetler; kartlar görselin 30 piksel üstüne biniyor ki arada boş bant kalmasın. Görsel yoksa kahraman kısalıp projenin kendi rengine düşüyor — boş bir görsel yeri açılmıyor.
- **Yedi kutu üç karta indi.** Sektör, platform, veritabanı, durum, arayüz dili ve para birimi tek **Künye** kartında iki sütunlu ızgarada; teslim rayı da ayrı kart açmaya değmediği için onun altında.
- **Bağlantılar ayrı bölüm değil.** Telefon, e-posta, kopyala, depo ve NIZAM.md, yetkili kartının altındaki rozet sırasında.
- **Roller küçüldü ve ikonlandı.** En geniş yetki kalkan, en dar kilit, aradakiler kişi simgesiyle; veri katmanı ve alan adı da aynı sıradan rozet. Her künye satırının kendi renkli simgesi var — sayfa yazı listesi değil, simge tablosu gibi okunuyor.
- **Hangi aşamada olduğun artık başlık boyutunda.** Görselle kartların arasında kendi şeridi var: metal `01` plakası, "8 aşamanın 1.'si" ve sağda sekiz noktalı ilerleme — biten yeşil, şimdiki uzun metal. Küçük köşe rozeti okunmuyordu.
- Girilmemiş her değer **sarı "girilmedi"** yazıyor; satır kaybolmuyor, eksik göze çarpıyor.
- Görselin sağ üstündeki **i** düğmesi burada da var: işletme görselini proje kartına gitmeden değiştiriyor.
- Kahraman yazılarının kontrastı ölçüldü: firma adı 8,0, rozetler 14'ün üstünde. Marka rozetinin altın saydamlığı görselin parlak yerinde 4,98'de kalıyordu — altına koyu taban kondu.

## v0.107.1
- Sayfa geçişinde yeni ekranın aşağıdan gelme payı **7 pikselden 9 piksele** çıktı. Süre ve eğri aynı; hareket biraz daha atak. Ölçüldüğünde iki ayarın ortası arasındaki fark 0,1 piksel — gözle ayırt edilmiyor, karar hissi seviyeydi.

## v0.107.0
- **Proje adımları zigzag akışına geçti.** Tamamlanan adımlar dönüşümlü sola ve sağa yaslanan bir merdiven, aralarında dirsekli yeşil oklar. Kart genişliği %76 — kalan boşluk okun dönmesi için.
- **Şimdiki adım merdivenin dışına çıkıp tam genişliğe yayılıyor** ve kırmızı: bir satırlık özeti de sığıyor, göz doğrudan oraya gidiyor.
- **Sırası gelmemiş adımlar altta küçük ve kesik çerçeveli bir ızgarada.** Sekiz adımı büyük kartla göstermek ekranı gereksiz uzatıyordu. Kilit sıkı — bunlar bağlantı bile değil, adresle de açılmıyorlar.
- Şimdiki adımdan kilitlilere **kesikli gri oklar** iniyor: yol oraya varmadı.
- Oklar kartların **gerçek yerinden** çiziliyor; elle çizilmiş sabit bir şekil değil, ekran döndüğünde ya da genişlik değiştiğinde dirsekler de değişiyor. Yeniden çizim kare isteğiyle kısılıyor.
- Altta **adım ilerlemesi**: "4 / 8 tamamlandı". Üstteki künye çubuğu görevlerin yüzdesini gösteriyor, bu adımlarınkini — iki ayrı sayı olduğu için başlığı "Adımlar".
- İlerleme çubuğu **metal gradyan**, kırmızı değil: dolu kırmızı bir çubuk "tehlike" diye okunuyor, oysa anlatmak istediği şey ilerleme.

## v0.106.0
- **Projenin sekiz adımı kart oldu.** Soldan kesikli çizgili liste yerine iki sütunlu kartlar; aralarında Standartlar sayfasındaki bağ şeridi — ince çizgi, ortasında ok.
- **Geçilen her bağ yeşile dönüyor.** Yolun nereye kadar geldiğini iz söylüyor, nerede durduğunu kırmızı kart.
- **Sıra yılankavi:** 1-2 soldan sağa, 3-4 sağdan sola. Böylece aşağı inen ok geldiğin kartın tam altında duruyor; normal okuma sırasında ok iki sütunun ortasında havada kalıyor, nereden nereye gittiği anlaşılmıyordu. Sağdan sola akan satırlarda yatay ok da sola dönüyor.
- **Kilit sıkı:** sırası gelmemiş adım sönük duruyor, bağlantı değil düz kutu — dokunulmuyor. Adres çubuğuna elle yazılsa da açılmıyor, projenin yol haritasına düşülüyor.
- Bitmiş adımın simgesi tike dönüyor, alt yazısı "tamam" oluyor. Her adımın kendi simgesi var — hepsi aynı simgeyle dururken kartlar birbirinden ayırt edilemiyordu.
- Başlığa iki satırlık sabit yer ayrıldı: "Tasarımı belirleme" iki satıra sürerken "Beta" bir satırda kalıyor ve kartların iç hizası kayıyordu.
- **Bulunan hata:** bağın yeşile dönme koşuluna gereksiz yere "şimdiki adım" da karışmıştı; bütün adımlar bitince şimdiki adım kalmadığı için hiçbir bağ yeşile dönmüyordu. Koşul yalnız "önceki adım bitti mi" oldu.

## v0.105.1
- **Görsel değiştirmek artık ilk denemede tutuyor.** Eskiden var olan bir görselin üstüne yenisini koyduğunda ilk sefer hiçbir şey değişmiyor, ikinci seferde oluyordu.
- Sebep bir yarış durumuydu: servis işçisi resmi **yolla** önbelliyor ve yeni dosya aynı yolun üzerine yazılıyor. Uygulama "bu resmi unut" mesajını gönderiyor ama **beklemiyordu**; yeni adresi istediğinde silme daha işlenmemiş oluyor ve önbellekten yine eski kopya geliyordu. İkinci denemede silme çoktan olmuş oluyordu — bu yüzden o çalışıyordu.
- Servis işçisi artık silme bitince haber veriyor, uygulama da bunu bekliyor. Cevap gelmezse bir saniye sonra yine de devam ediyor; yüklemeyi askıda bırakmak daha kötü.
- Hem boş kartta hem eski görseli olan kartta ilk denemede çalışıyor.

## v0.105.0
- **Görseller artık her sürümde yeniden inmiyor.** Sebep önbellek kovasının adındaydı: kovanın adı sürüm numarasını taşıyordu ve her yeni sürümde eski kova siliniyordu — müşteri görselleri de onunla birlikte gidiyordu. Sürüm sık çıktığı için görseller neredeyse her açılışta yeniden iniyordu.
- Resimler artık **ayrı ve sürümsüz** bir kovada. Kod değişince görsel bayatlamıyor; sürüm yükseltmesi yalnız kabuk dosyalarının kovasını siliyor.
- **Kart görseli artık geç yüklenmiyor.** Görselde `loading="lazy"` vardı; kart ekranın en üstünde bile olsa tarayıcı yüklemeyi erteliyordu, her sayfa geçişinde görsel bir gecikmeyle oturuyordu — önbellekten gelse bile "yeniden iniyor" gibi görünüyordu.
- Açılışta bütün görselleri indiren ısıtma zaten vardı ve çalışıyordu; ısıttığı şey bir sonraki sürümde siliniyordu. Şimdi kalıcı.

## v0.104.0
- **Görselli kartta bilgi bloğu kartın yarısından çeyreğine indi** — ölçülen oran %50'den **%27**'ye. Görsel artık kartın dörtte üçünü kaplıyor.
- Yalnız punto küçültmek yetmiyordu, %40'ta takılıyordu: çeyreğe inmek için bir satırın gitmesi gerekiyordu. **İlerleme rayı kendi satırından çıkıp kartın en dibine indi** — tam genişlikte ince bir çizgi. Hem yer açıldı hem ray daha okunaklı oldu.
- Platform satırı ("Web · Mobil") ve yüzde yazısı görselli karttan kalktı: aynı bilgiyi alttaki ray ve "bitmiş/toplam görev" sayısı zaten söylüyor. Görselsiz kart ikisini de göstermeye devam ediyor.
- Rozet 34'ten 26 piksele, yazılar bir kademe küçüldü; ayraç çizgisi kalktı — görselli kartta satırları zaten perde ayırıyor.
- Perde de yukarı çekildi: blok yükselince koyu bölge onunla birlikte çıkmalı, yoksa yazı görselin parlak yerine denk geliyor.
- **Bulunan hata:** `•••` menü düğmesi sayı satırının içinde dururken 38 piksellik dokunma hedefiyle satırı 48 piksele şişiriyordu; blok bu yüzden bir türlü çeyreğe inmiyordu. Düğme kartın köşesine alındı — dokunma hedefi aynı kaldı.

## v0.103.1
- **Yükleme bitince kart artık bir an boşalmıyor.** Katman, yeni görsel gerçekten inene kadar duruyor; halka dolu, üstünde "Görsel gönderildi · bitiriliyor…" yazıyor. Sonra katman kalkıyor ve görsel yerinde hazır duruyor.
- Eski görsel zaten silinmiyordu — aynı yolun üzerine yazılıyor. Kötü görünen şey silme değil, katman kalkınca yeni görselin daha inmemiş olmasıydı: kart bir an boşalıp görsel patlayarak geliyordu. Silmeyi öne almak bunu çözmez, kartı yükleme boyunca bomboş bırakırdı.
- Ağ takılırsa beş saniye sonra yine de devam ediliyor; kullanıcıyı dolu bir halkanın karşısında bırakmak daha kötü.

## v0.103.0
- **Görsel yüklenirken kartın üstünde dolan bir halka var.** Yanında yüzde ve kaç KB'ın gittiği yazıyor; bitince yeşil tike dönüyor. Beklerken kartın kendi görseli soluyor — yenisinin geldiği belli olsun.
- **Halkanın dolduğu oran gerçek.** Supabase istemcisi yüklemeyi `fetch` ile yapıyor ve `fetch` gönderim ilerlemesi bildirmiyor; bu yüzden o tek çağrı istemcinin dışına çıkarıldı ve aynı adrese aynı oturum anahtarıyla `XMLHttpRequest` ile gidiliyor. Hata metinleri eskisiyle birebir aynı kaldı — "kova yok", "izin yok" cevapları yine Türkçe çıkıyor.
- Uydurma dolan bir çubuk koymadık: erken biterse zıplar, gecikirse sonda bekler; bir kez öyle olunca kullanıcı hiçbir çubuğa bir daha inanmaz.
- Baytlar gidince halka doluyor ama başlık **"Görsel gönderildi · bitiriliyor…"** oluyor: imzalı adres ve palet kaydı hâlâ sürüyor, iş bitmeden "bitti" demiyoruz.
- **Yükleme kısaldı: görsel artık 1200 piksele küçültülüyor, 1600'e değil.** Ölçü kartın ihtiyacından çıkıyor — kart 358 css piksel, 3x telefonda 1074 piksel istiyor. 1600 bunun bir buçuk katıydı; kazandırdığı netlik ekranda görünmüyor, bekleme ise uzuyordu. ChatGPT için de fazlasıyla yeterli, görsel modeller zaten kendileri küçültüyor.
- **Bulunan hata:** bitiş tikinin simgesi görünmüyordu. "Bitince halkayı gizle" kuralı `.py-halka svg` diyordu ve tik de halkanın içinde duruyor; kural tiki de gizliyordu. Doğrudan çocuk seçicisine çevrildi.

## v0.102.0
- **Proje kartı artık işletmenin görselini taşıyor.** Görsel kartın tamamını kaplıyor; rozet, firma adı ve platform satırı **alta indi**, üst yarı görsele bırakıldı.
- Bilgileri aşağı almak bir zevk kararı değil, ölçüm sonucu: bilgiler üstteyken firma adının kontrast oranı **2.8**, platform satırınınki **1.2** çıkıyordu — çizimlerin en parlak yeri tam oraya denk geliyor. Kartın dibi zaten koyu; aşağı alınca ikisi de **8'in üstüne** çıktı.
- Perde kesik bir kenarla değil, yumuşak bir geçişle iniyor: amaç görseli göstermek, kesmek değil. Görselin **üst %40'ına hiç dokunulmuyor**.
- **Sağ üstte "i" düğmesi:** görsel oradan yükleniyor. Eskiden bu iş dört dokunuş öteydeydi — proje → Tasarımı belirleme → Görsel dünya → Malzeme. Artık kartın üstünde.
- Kartta gösterilen görsel, ChatGPT'ye giden **İşletme görselinin aynısı**. İkinci bir görsel tutulmuyor; her proje için ayrıca üretip yönetmek kazandırdığı kadrajdan pahalı.
- Görselin üstünde silik gri okunmadığı için sayılar ve platform satırı bir kademe parlatıldı; ilerleme yatağı opak kaldı.
- **Görseli olmayan proje bugünkü hâlinde**, kısa duruyor — boş bir görsel alanı açmıyor.
- **Bulunan hata:** ilk perde ayarı dar mockup kartında geçiyordu ama gerçek kart daha geniş; `cover` görselin başka ve daha parlak bir yerini başlığın altına getirince firma adı 3.8'e düşüyordu. Perde ölçülerek yeniden ayarlandı. Ayrıca görselsiz kartta "i" düğmesi durum etiketinin üstüne biniyordu.

## v0.101.1
- **Geri oku Standartlar, Ekip, Görevler ve Ayarlar'da da çalışıyor.** Yalnız proje detayında ve kovada aktifti; diğer ekranlara girince sönük kalıyor, "buradan çıkamıyorum" gibi duruyordu. Artık tek pasif yer **Panel** — zaten açılış ekranı, geri gidilecek yer orası.
- Tarayıcı geçmişi boşken ok bir kat yukarı çıkıyor. Eskiden her yerden Projeler'e atlıyordu; ok artık Ayarlar'da da çalıştığı için oradan Projeler'e düşmek "geri" olmazdı.

## v0.101.0
- **Geri oku artık üst çubuğu kaydırmıyor.** Eskiden 38 piksellik çerçeveli bir kareydi ve alt sayfaya girince beliriyordu; belirdiği anda logo, marka ve sayfa adı 45 piksel sağa kayıyordu. Şimdi yeri her ekranda ayrılı — girip çıkarken tek piksel oynamıyor.
- **Ana ekranda kaybolmuyor, pasifleşiyor.** Ok yerinde duruyor ama sönük ve basılamaz. Gidilecek bir yer olmadığı ok'un yokluğundan değil, solukluğundan anlaşılıyor.
- **Kutu ve çerçeve kalktı, yalnız ok kaldı.** Düğme gibi değil, yön gibi duruyor.
- **Basınca küçülüyor** — uygulamanın her yerindeki dokunma tepkisi. Ok küçük olduğu için oran da büyük tutuldu; %97 bu boyutta hiç fark edilmiyor. Pasifken küçülmüyor.
- Ok 20 piksel ama basılan alan 44: dokunma hedefi simgenin boyu değildir.

## v0.100.1
- **Kova kartlarındaki sayı artık sıfırdan saymıyor**, ilk karede doğru değeriyle geliyor. Sayının yukarı tırmanması "veri henüz yüklenmedi" gibi okunuyordu; oysa değer tarayıcıdaki önbellekten geliyor ve daha ekran çizilirken belli.
- Sayaç canlanması diğer yerlerde duruyor — orada anlatılan şey sayının kendisi değil, ilerleme.

## v0.100.0
- **Projeler ekranı iki kova kartına indi:** Başlamış Projeler · Bitmiş Projeler. Yan yana, tek satırda, içinde yalnız kaç proje olduğu. Basınca o kovanın sayfası açılıyor — kart açılıp kapanmıyor.
- Eskiden üç açılır şerit vardı ve **boş olan hiç çizilmiyordu**; bu yüzden ekranda kaç bölüm göreceğin veriye göre değişiyordu. Artık iki kart hep aynı yerde; boş kova kaybolmuyor, sönüyor ve 0 yazıyor.
- **Başlamış = bitmemiş olan her şey**, yüzdesi sıfır olanlar dahil. İki kova olduğu için başka gidecek yerleri yok; "ilerlemesi sıfırdan büyük" deseydik hiç görevi bitmemiş bir proje ekrandan tamamen kaybolurdu.
- Kartlar havada duruyor: iki katmanlı gölge, üstte ışık kenarı, köşeden geçen huzme. Standartlar ve panel kartlarıyla aynı dil.
- Renkler uydurma değil — sarı uygulamanın "Geliştiriliyor", yeşil "Tamamlandı" rengi. Kırmızı yok, o alt çubuktaki artının.
- Kova sayfası proje detayı sayılmıyor: üst çubuktaki artı "Yeni Görev"e dönmüyor, proje rengi yayılmıyor. Ortada bir proje yok.
- Kovanın içi şimdilik proje kartlarının düz listesi; o sayfanın kendi düzeni sonraki turda.

## v0.99.1
- **Profil paneli artık yağ gibi açılıyor.** Takılmanın dört sebebi vardı, dördü de kalktı.
- **Panel her açılışta sıfırdan kuruluyordu:** beş satır, beş simge ve dinleyiciler yaratılıyor, ardından *aynı karede* hareket başlıyordu. İlk kare hem yeni parçaları çizmek hem hareketi başlatmak zorundaydı. Artık panel bir kez kuruluyor, sonra yalnız gösterilip gizleniyor.
- **Üç ayrı süre, iki ayrı eğri vardı:** içerik yaylanarak hedefi aşıp geri gelirken açılan kenarı düz gidiyor, ikisi birbirinden ayrılıyordu; saydamlık da yolun yarısında bitiyordu. Şimdi tek süre, tek eğri.
- **`clip-path` kaldırıldı.** `transform` ve `opacity` ekran kartında yapılır, `clip-path` yapılmaz — her karede yeniden boyanıyordu.
- **`backdrop-filter` kaldırıldı.** Panelin zemini zaten %96–99 kapalıydı; bulanıklaştırdığı şey görünmüyordu bile, ama her karede arkayı yeniden bulanıklaştırma bedeli ödeniyordu. Görünüşte hiçbir fark yok.
- Sınıf eklenmeden önce başlangıç stili zorlanıyor: tek kare beklemek yetmiyordu, tarayıcı ikisini birleştirince geçiş hiç başlamıyor, panel zıplayarak geliyordu.
- Panel kapalıyken sayfada duruyor ama `visibility: hidden` — altındaki içeriğin tıklamasını yutmuyor.

## v0.99.0
- **"Güncellemeleri denetle" artık profil panelinde de var.** Sağ üstteki kullanıcı kutusuna basınca açılan panelde, Çıkış'ın hemen üstünde; yanında o an yüklü sürüm yazıyor. Ayarlar'daki satır olduğu yerde duruyor — denetlemek için ayarlara gitmek gerekmiyor artık.
- **Denetlerken kum saati devriliyor.** İki yerde de: paneldeki satırın simgesi ve Ayarlar'daki düğme. Sürekli fırıl fırıl dönmüyor, gerçek kum saati gibi yarım tur atıp bekliyor — kesintisiz dönen kum saati bozuk bir bekleme çarkı gibi okunuyor.
- **Yeni sürüm bulunduysa kum saati durmuyor,** sayfa kendini yenileyene kadar dönmeye devam ediyor. Durursa iş bitmiş gibi görünüyor, oysa yenilenme sırada.
- Panel denetleme sürerken kapanmıyor: sonucu kullanıcı satırın kendisinde görüyor.
- Satırın yazısı da "Denetleniyor…" oluyor. Hareket azaltma açıkken animasyon kapanıyor; bekleme bilgisi yalnız harekete bırakılmasın diye.

## v0.98.0
- **Panelin kısayol kartları Standartlar ekranının kart diline geçti.** Simge 46 piksellik yuvarlak daireden 40 piksellik yumuşak karoya döndü ve sola oturdu; yazı da ortalıdan sola hizalandı. Üç sütunlu dar ızgarada sola hizalı satır hem daha çok kelime alıyor hem göz tek bir dikey çizgiyi takip ediyor.
- Ok, kartın altındaki ortadan sağ üste taşındı — alttaki yeri açıklama satırına bıraktı.
- **Malzeme de aynı:** grafit degrade, açık çerçeve, iki katmanlı gölge, üstte ışık kenarı ve köşeden geçen duran huzme. Kısayol kartı panelin koyu kart listesinden çıkarıldı; uygulamanın her yerinde tek bir kart dili konuşulsun diye. Fotoğrafın üstünde duran diğer kartlar koyu kalmaya devam ediyor.
- **Simge renklerine dokunulmadı** — daireler bugünkü gri metalinde. Değişen yalnız kartın biçimi.
- Başlığa iki satırlık sabit yer ayrıldı: "Örnek Projeler" iki satıra taşarken diğerleri bir satırda kalıyor ve kartların iç hizası bozuluyordu.
- Yeni kart eskisinden kısa; panel hâlâ kaydırmasız sığıyor.

## v0.97.0
- **Standartlar baştan sona alfabetik.** Üç kademe birden: gruplar, grubun içindeki alanlar, alanın içindeki kurallar.
- Sıralama Türkçe harf düzeniyle yapılıyor — ç, ğ, ı, ö, ş, ü kendi yerine oturuyor, sona atılmıyor. Altyapı → Çeviri → Erişilebilirlik → Tasarım → Veri.
- Eskiden gruplar `config.js`'teki sabit sıradaydı, alanlar da kayıt sırasına göre diziliyordu; aradığın grubun listenin neresinde olduğunu ezberlemeden bulamıyordun. Kayıt sırası artık yalnız aynı adlı iki kayıt çakışırsa devreye giriyor.
- Aynı sıralama göreve üretilen prompta da yansıyor: kurallar orada da alfabetik gidiyor.

## v0.96.0
- **Standartlar ekranındaki iki düğme kart oldu.** Tek satırda iki sütun, aralarında sırayı taşıyan ince bir çizgi. Kartlar zeminden kopuk duruyor: iki katmanlı gölge, üstte ışık kenarı, köşeden geçen huzme, dokununca hafif çöküş.
- **"Standart ekleme promptu" artık Claude'u açmıyor.** Tek yaptığı promptu panoya yazmak; sekme açmak kullanıcıyı uygulamadan çıkarıyor ve geri döndüğünde kart hâlini kaybediyordu. Basınca simge kırmızıdan yeşile dönüp tik çıkıyor, başlık "Prompt panoda", alt satır "Claude'a yapıştır" oluyor.
- **İkinci kart sırasını bekliyor.** Prompt kopyalanana kadar sönük; sonra canlanıp kırmızıyı devralıyor. Kural kaydedilince birinci kart ilk hâline sıfırlanıyor, ikincisi yeniden sönüyor — bir sonraki standart için hazır. Vazgeçilirse sıfırlama olmuyor, kopyalanan prompt panoda kalıyor.
- **Sekiz standart grubunun her birine kendi simgesi ve rengi geldi:** Altyapı çelik mavisi · Veri teal · Güvenlik altın · Tasarım mor · Animasyon camgöbeği · Optimizasyon zeytin · Biçim kum · Erişilebilirlik gök. Hepsi aynı katman simgesi ve aynı gri karo olunca kartlar birbirinden ayırt edilemiyor, göz listeyi baştan okumak zorunda kalıyordu.
- Renk yalnız karoda; kart, yazı ve çerçeve grafit kalıyor. Doygunluk düşük tutuldu — sekiz canlı renk yan yana gelince ekran şeker kutusuna dönüyor. Kırmızı listede yok: o hâlâ logonun, ana eylemin, aktif sekmenin ve "Acil"in. Tanınmayan bir grup adı doğarsa karo metal kalıyor.
- Grup açılınca içerideki kuralların karoları da aynı renge geçiyor, çok daha sönük.
- **Bulunan hata:** yeni kartlar için seçilen `.sk` ve `.sk-ad` adları, silme ekranındaki mevcut bir bileşende zaten kullanılıyordu; kurallar birbirini eziyor, kart başlığı ödünç aldığı iç paydan ötürü iki satır yerine üçe taşıyordu. Yeni bileşen `.sa-` önekine alındı.

## v0.95.1
- Yalnız sürüm damgası. Hiçbir görsel ya da işlevsel değişiklik yok — otomatik güncellemenin telefonda gerçekten çalıştığını görmek için gönderildi.

## v0.95.0
- **Zemin artık düz gri değil: karbon dokusu.** İnce köşegen bir örgü. Düz yüzeyde kartlar zemine yapışık duruyordu; doku zemine derinlik veriyor ve kartlar üstünde duruyormuş gibi okunuyor.
- **Kartlar zeminden koptu.** Gölge iki katman oldu: yakın ve sert olanı kartı zeminden ayırıyor, uzak ve yumuşak olanı yükseklik hissini veriyor. Aynı kabartma modül, standart grubu ve bilgi şeritlerine de geldi.
- Doku resim değil, çizim — dosya ağırlığı sıfır. Sayfa kaydırılırken zemin yerinde durduğu için yeniden boyanmıyor.
- Panelde görünmüyor: orada ofis fotoğrafı zaten üstünü kapatıyor.

## v0.94.1
- **Profil fotoğrafı da açılış ekranında iniyor.** Isıtma listesine proje logoları ve görselleri girmişti ama kullanıcının kendi fotoğrafı girmemişti; ilk açılışta uygulama açıldıktan sonra, üst çubukta gecikmeli beliriyordu. Artık listenin başında ve tek başına iniyor — diğerlerinin arkasında sıra beklemiyor.
- Ekip fotoğrafları da ısıtmaya girdi; küçültme geldikten sonra hepsi birkaç kilobayt.

## v0.94.0
- **Her şey bir kez iniyor, sonra telefonda kalıyor.** İlk açılış 2.09 MB'tan **1.12 MB**'a indi. İkinci açılıştan itibaren sunucuya yalnız üç istek gidiyor — sürüm denetimi ve servis işçisinin kendi güncellemesi. **Sayfalar arası geçişte tek bayt inmiyor.**
- **Logo iki kez iniyordu.** Dört kullanımdan birinin adresinde sürüm numarası yoktu; tarayıcı onu ayrı bir dosya sayıp 438 KB'ı iki kez indiriyordu. Ayrıca dosya 600 piksel genişliğindeydi, oysa en büyük çizildiği yer açılış ekranında 89 piksel. **876 KB → 37 KB.**
- Uygulama simgeleri 288 KB'tan 50 KB'a, panelin ofis fotoğrafı 142 KB'tan 43 KB'a indi (WebP).
- **Firma logoları ve proje görselleri 45 dakikada bir baştan iniyordu.** Adreslerindeki imza yenilenince adres de değişiyor, tarayıcı aynı resmi yeni dosya sanıyordu. Servis işçisi artık bu resimleri imzasız yolla saklıyor — imza değişse de aynı kayda düşüyor.
- **Yüklenen görseller tarayıcıda küçültülüyor.** Profil fotoğrafı 256 piksele, firma logosu 512'ye, proje görselleri 1600'e; hepsi WebP'ye çevriliyor. 3000×2000 bir fotoğraf 216 KB'tan 25 KB'a iniyor. Sunucuya da zaten küçük dosya gidiyor.
- **Açılış çubuğu artık resimleri de bekliyor.** "Hazır" yazdığında her şey inmiş oluyor. Bağlantı kötüyse üç saniyede bırakıyor, kalanı arkada tamamlanıyor.
- Bir fotoğraf değiştirildiğinde önbellekteki eskisi siliniyor — yenisi bir kez iniyor.

## v0.93.1
- Standartlar ekranının tepesindeki açıklama şeridi kalktı. Liste zaten kendini anlatıyor; her açılışta aynı üç satırı okumak yalnız yer kaplıyordu.

## v0.93.0
- **Standartlar iki eksene oturdu: grup ve alan.** Grup işin cinsini söylüyor — Altyapı, Veri, Güvenlik, Tasarım, Animasyon, Optimizasyon, Biçim, Erişilebilirlik. Alan ekranın parçasını söylüyor — Alt çubuk, Üst çubuk, Panel, Sayfa geçişi. Bir satır tek bir kural; "Alt çubuk standartları" demek, alanı Alt çubuk olan kuralların tamamı demek.
- **Standart eklemek artık elle form doldurmak değil.** Standartlar ekranında iki düğme var: *Standart ekleme promptu* ile promptu alıp değişikliği yaptığın Claude oturumuna yapıştırıyorsun; Claude kuralı sabit bir blok olarak veriyor; *Kuralı yapıştır* ile blok Studio'ya giriyor ve standart kuruluyor. Yapıştırmadan önce hangi kuralın nereye düşeceğini önizleme gösteriyor.
- **Kodda duran teknik standart veritabanına taşındı.** Dil, çatı, barındırma, para birimi, tarih biçimi — hepsi artık `standards` tablosunda ve Studio'nun kaynağına dokunmadan değiştirilebiliyor. `config.js`'teki liste tohum ve yedek olarak duruyor: tablo boşsa prompt yine de standartsız çıkmıyor.
- **Yeni program kurulurken bütün standartlar prompta kendiliğinden giriyor**, gruplu ve alanlı olarak. Eskiden yalnız bir göreve iliştirilmiş standartlar prompta girebiliyordu.
- **Yeni bir standart eklendiğinde kurulmuş programlara duyuruluyor.** Kural yazıldığı anda sürümle damgalanıyor; daha eski kurulmuş her programın Geliştirme durağında "yeni standart" olarak çıkıyor, promptu üretiliyor.
- Standart artık sunucusuz projeler için ayrı bir karşılık taşıyabiliyor. Veri kullanıcının cihazında kalan bir projede prompt o metni yazıyor.
- **İki bozuk yer düzeldi.** `sql/05-standartlar.sql` içindeki hazır standart bloğu çalışmıyordu — sütun sayısı tutmadığı için dosyanın tamamı hata veriyordu; tohum artık `sql/17-standart.sql` içinde. "Hazır blok yapıştır" düğmesi olmayan bir işlevi çağırıyor, yani hiç çalışmıyordu.

## v0.92.0
- **Kısayol kartları yukarı çekildi.** Fotoğrafın masa hizasında değil, logo duvarının hemen altında başlıyorlar.
- **Panel kaydırılmıyor.** İçerik zaten tam sığıyordu; kalan tek hareket parmağı bırakınca gelen esnemeydi, o da kalktı.
- Kartların tepe payı artık ekran boyuna göre kendini ayarlıyor. Sabit bir değer kısa telefonlarda kartları alt çubuğun altına itiyordu; uzun ekranda 228 pikselde duruyor, ekran kısaldıkça kendiliğinden yukarı çıkıyor.

## v0.91.0
- **"Bugünkü durum" kartı panelden kalktı.** Sayılar zaten alt çubuğun rozetlerinde ve Görevler ekranında duruyordu; panel ikinci bir proje listesi taşımak zorunda kalıyordu. Panel artık yalnızca nereye gidileceğini söylüyor.
- **Selam ortalandı ve iki satıra ayrıldı.** Hap duruyor: üstte "İyi günler, Nizam", altında tarih. Avatar kalktı — kim olduğun sağ üstteki kutuda zaten yazıyor.
- Bir önceki sürümdeki kart karartması panelde aslında uygulanmıyordu: `#main.susulu .kk` daha özel bir kuralla eski yarı saydam rengi geri veriyordu. Artık kartlar gerçekten koyu ve saydam değil.

## v0.90.0
- **Panelin malzemesi koyulaştı ve tekleşti.** Kısayol kartları, bugünkü durum kartı, selam hapı, üst çubuk ve alt çubuk artık aynı koyu renk. Fotoğrafın üstünde duran her şey tek malzeme.
- **Kartlar artık açıktan koyuya kaymıyor.** Panelde ekran solarken kartlar yarı saydam kalıyor ve altındaki fotoğrafın ışığını geçiriyordu; kart rengi koyu olmasına rağmen açık başlayıp koyulaşıyordu. Panelde artık yalnız fotoğraf soluyor, kartlar ilk kareden itibaren tam koyu geliyor.
- **Üst çubuktaki kalem kalktı.** Not defteri, sağ üstteki kullanıcı kutusuna basınca açılan panelin ilk satırı oldu. Üst çubuk sadeleşti.

## v0.89.0
- **Sayfa geçişi sadeleşti: kayma gitti, soluk geçiş kaldı.** Yeni ekran solarak gelir, eskisi anında gider.
- Sebebi maliyet. Tarayıcının geçiş motoru (View Transitions) daha zengin bir çapraz geçiş yapıyordu ama her adres değişiminde **tüm sayfanın iki tam ekran görüntüsünü** alıyordu — telefonda 3x çözünürlükte iki doku. Bunun bedeli animasyonun kendisinden büyüktü. Düz `opacity` ise tek katman, ekran kartında bedava sayılır.
- **Panele dönerken ofis fotoğrafı da soluyor.** Fotoğraf `#view`'ın dışında ayrı bir katman olduğu için olduğu yerde patlıyor, geçiş hiç olmamış gibi görünüyordu.
- Yön hesabı, `data-yon` damgası ve kayma kareleri tamamen kalktı — artık her geçiş aynı.

## v0.88.1
- **Sayfa geçişinde üst ve alt çubuk artık kaybolmuyor.** Çubuklar geçişin dışında tutuldu: kaymıyor, solmuyor, oldukları yerde duruyorlar. Yalnız içerik kayıyor.
- Eski çubuk görüntüsü hiç çizilmiyor — zemini yarı saydam olduğu için altta kalınca bir an iki etkin sekme birden görünüyordu.

## v0.88.0
- **Kartlar artık tek tek gelmiyor.** Proje kartları, görev satırları, standartlar, panelin kısayolları — hepsi tek parça. Kart kart beliriş ile sayfa geçişi üst üste binince hem yavaş hem dağınık duruyordu.
- **Sayfalar arası geçiş geldi: derinliğe göre kayma.** İçeri girerken yeni ekran sağdan gelir, eskisi sola çekilip solar; geri dönerken tersi. Yön adresteki parça sayısından çıkıyor — `#/projeler` bir parça, `#/projeler/p1` iki, `#/projeler/p1/yapi` üç; derinleşiyorsa ileri, sığlaşıyorsa geri.
- Geçişi **tarayıcının kendi motoru** yapıyor: eski ve yeni ekranın görüntüsünü alıp ekran kartında kaydırıyor, JS her karede hesap yapmıyor. Desteklemeyen tarayıcıda sessizce eski belirişe düşüyor.
- Yalnız `#view` kayıyor. Üst çubuk, alt çubuk ve panel fotoğrafı yerlerinde yumuşakça eriyor — onlar duran şeyler, kaymamalı.
- Eski ekran tam genişlik kadar kaymıyor, %22'de soluyor: tam kaydırmak "iki ayrı sayfa" hissi verip hantallaştırıyordu.
- İlerleme rayları dolmaya devam ediyor — o kartın gelişi değil, verinin kendisi. Artık sıraya bağlı değil, tek ve sabit gecikmeyle.

## v0.87.0
Panel kaydırırken takılıyordu. Sebep buzlu camdı: kaydırma sırasında **sekiz kart aynı anda** arkasını yeniden bulanıklaştırıyor, üstelik zeminde tam ekran bir bulanıklık katmanı daha duruyordu. Her karede dokuz ayrı bulanıklık hesabı.

- **Bulanıklık görselin kendisine pişirildi.** `ofis.jpg` artık üstte net, %30'dan sonra giderek bulanık — dosyada. Çalışma anında hesap yok. Dosya da küçüldü: 221 → 145 KB.
- **Kartlardan `backdrop-filter` kaldırıldı.** Arkadaki görsel zaten bulanık olduğu için kartların yaptığı tek iş koyultmaktı; opaklık %74'ten %80'e çekildi, görünüş neredeyse aynı kaldı. Panelde `backdrop-filter` kullanan öğe **8'den 1'e** indi (yalnız selam hapı, o da net bölgede duruyor).
- Zemin görseli kendi katmanına alındı (`translateZ(0)`), kaydırırken yeniden boyanmıyor.
- `.view`'a `-webkit-overflow-scrolling: touch` eklendi; eski iOS'ta momentum kaydırma bunsuz açılmıyor ve parmak kalkınca liste anında duruyordu.

## v0.86.0
- **Panel açılışta canlanıyor.** Selam hapı önce, kısayol kartları 42ms arayla sırayla, özet kartı 294ms'de, ilerleme rayları 536ms'de sıfırdan doluyor. Sayılar da sıfırdan gerçek değere sayıyor. Zaten var olan `yukariGel` / `doldur` / `data-sayac` altyapısına bağlandı — yeni bir animasyon dili getirilmedi.
- Giriş yalnız **başka bir ekrandan panele geçince** oynuyor. Aynı ekranda bir şey açılıp kapanınca her şeyin yeniden uçuşması yorucu olurdu; bu kural uygulamada zaten vardı, yeni kartlar da ona uydu.
- **Dokunma tepkisi:** karta basınca hafif çöküyor ve camın üstünden bir ışık huzmesi geçiyor. Süre kısa tutuldu ki art arda dokunuşta birikmesin.
- `prefers-reduced-motion` açıksa hem giriş hem parlama kapalı.

## v0.85.0
- **Selam şeridi buzlu hap oldu.** Yazı doğrudan fotoğrafın üstüne konunca yapışık duruyordu. Artık alt çubukla aynı malzemede bir hapın içinde: avatar · selam · ince ayırıcı · tarih. Aynı camı kullandığı için uygulamaya ait görünüyor, fotoğrafın üstünde yüzüyor.
- Kullanıcının fotoğrafı varsa hapta o görünüyor, yoksa baş harfleri.
- Cam desteklenmeyen tarayıcıda hap neredeyse kapatılıyor; yarı saydam kalırsa yazı fotoğrafa karışıyordu.

## v0.84.0
- **Kısayol ızgarası yeniden sıralandı:** Projeler · Görevler · Örnek Projeler · Ekip · Standartlar · Ayarlar.
- **"Yeni Proje" ızgaradan çıktı.** Alt çubuğun ortasındaki kırmızı `+` zaten aynı işi yapıyordu; ızgarada ikinci kez durması hem yer kaplıyor hem kırmızıyı ikiye bölüyordu. Kırmızı artık yalnız alt çubukta ve aktif sekmede.
- **"Örnek Projeler" yer tutucu olarak eklendi** — ekranı henüz yok, o yüzden sönük ve dokunmuyor. Adı ve yeri hazır; ekranı sonra kurulacak.
- Kart başlığına iki satırlık sabit yer ayrıldı: "Örnek Projeler" iki satıra taştığında diğer kartların iç hizası kayıyordu.

## v0.83.0
- **Kaydırma kararması kalktı, yerine koyu buzlu cam geldi.** Fotoğraf sabit olduğu için kaydırınca kartlar net fotoğrafın üstüne geliyordu; çözüm olarak zemini karartıyorduk — fotoğraf da kayboluyordu. Artık fotoğraf net kalıyor, okunurluğu **camın kendisi** taşıyor: yoğun bulanıklık, düşük geçirgenlik, ince ışıklı kenar. `zeminKoyulugu` fonksiyonu, kaydırma dinleyicisi ve kararma katmanı silindi.
- **Fotoğraf daha çok kırpıldı**, tavan payı azaldı: logo duvarı, raflar ve masa artık ekranın büyük kısmını kaplıyor.
- **Selam şeridi geri geldi** ama küçük ve cam kutusuz: fotoğrafın tavan bandında, doğrudan görselin üstünde. Eski karşılamanın 150px'lik halkası yok — genel yüzde özet kartında duruyor.
- Cam desteklenmeyen tarayıcıda kartlar neredeyse tam kapatılıyor: arkadaki fotoğraf bulanıklaşmadan görünürse yazı okunmuyor.

## v0.82.0
- **Zemin dikey ofis karesine geçti** ve boydan boya kullanılıyor. Önceki iki kare yataydı; telefonda ortadan ince bir dilim alınıyor, simetri ve kırmızı raflar gidiyordu. Yeni kare portre çekilmiş, kırpma yok. Boş tavan üstten kırpıldı.
- **Karşılama bloğu kaldırıldı.** Fotoğrafın kendi logo duvarı hero'yu taşıyor; üstüne halka ve selam yazısı gelince ikisi birbirini eziyor, duvardaki logo hiç görünmüyordu. Üst çubuk zaten kullanıcının adını gösteriyor. Halkadaki genel ilerleme yüzdesi **"Bugünkü durum" kartının başlığına** taşındı — veri kaybolmadı.
- **Üst perde açıldı.** Fotoğrafın üst yarısı artık %10 opaklıkla örtülüyor: logo duvarı, kırmızı raflar ve ödüller okunuyor. Kartların başladığı yerden sonra hızla kapanıyor, kaydırma koyulaşması aynen duruyor.
- Kısayol ızgarası panelde 322px aşağıdan başlıyor; fotoğrafın üst yarısı ona ayrıldı.

## v0.81.1
- Panel zemini yeni ofis fotoğrafına geçti: toplantı odası, kırmızı raflar ve sertifika duvarı. Telefon dikey olduğu için yatay kare ortadan kırpılıyor — kadraj sertifika duvarı ve sağdaki kırmızı raf görünecek şekilde ayarlandı.

## v0.81.0
- **Panel önce nereye gidileceğini gösteriyor.** Eskiden dört sayaç yukarıda, altında proje listesi vardı: ne olduğunu söylüyor ama nereye gidileceğini söylemiyordu — her şeye alt çubuktan ulaşılıyordu. Artık **3×2 kısayol ızgarası**: Projeler · Görevler · **Yeni Proje** · Standartlar · Ekip · Ayarlar. Her kutunun altında o an kaç şey olduğu yazıyor.
- **Sayılar tek karta indi.** "Bugünkü durum": Geliştiriliyor · Kontrolde · Bugün biten, altında son üç proje tek satırlık ince ray ile. Dört ayrı sayaç kartı ekranın tepesini kaplıyordu.
- Kırmızı ızgarada yalnız **Yeni Proje**'de. Alt çubukta zaten kırmızı dolu bir `+` olduğu için ızgaradaki simge dolu değil, kırmızı çerçeveli — iki kırmızı daire üst üste binmiş gibi duruyordu.
- **Bulunan hata:** `.view`'un alt payı yalnız uygulama kipinde veriliyordu; tarayıcı sekmesinde son kart yüzen alt çubuğun arkasına giriyordu. Artık pay her hâlükârda var, uygulama kipinde ana ekran çizgisinin payı da ekleniyor.

## v0.80.0
- **Panelin zemininde ofis fotoğrafı.** Tam ekran, sabit duruyor; kartlar üstünden akıyor. Üç katman üst üste: fotoğraf tepede net → aşağı indikçe artan bulanıklık (maskeyle) → aşağı indikçe koyulaşan perde. Kartlar buzlu cam, fotoğrafın üstünde yüzüyor.
- **Kaydırınca fotoğraf geri çekiliyor.** Sabit fotoğrafın sorunu şuydu: kaydırdıkça kartlar fotoğrafın *net* kısmına geliyor ve yazı okunmuyordu. İlk 220 pikselde bir perde katmanı koyulaşıp fotoğrafı arkaya itiyor. Tek bir CSS değişkeni yazılıyor, düzen hesabı yok.
- Cam yalnız **Panel'de**: diğer ekranlarda arkada fotoğraf yok, kartlar katı grafit kalıyor. Kartın kendi ışık huzmesi ve proje rengi degradesi camın üstünde çamur yaptığı için bu ekranda kapalı.
- `backdrop-filter` desteklenmeyen tarayıcıda bulanıklık düşüyor, perde tek başına okunurluğu taşıyor.
- Fotoğraf sağa kırpıldı: duvardaki "Nizam Software" yazısı üstteki logo ve selamlamayla çakışıyordu.

## v0.79.0
İlk tam turdan dört ders. Görseller ve tasarım doğru geldi; takılan yerler tarifin biçimiydi.

- **Tarif metin olarak isteniyor.** ChatGPT tarifi tasarlanmış bir *tabaka görseli* olarak çizdi — güzel duruyordu ama Studio'ya yapıştırılamıyor, o düz metin okuyor. Prompt artık baştan söylüyor: kod bloğu içinde, kopyalanabilir metin; tablo görseli ya da rehber sayfası çizme.
- **Tek liste, tek numaralandırma.** Önce `G1–G9`, sonra ayrı bir `G10–G20` listesi verdi; hangisinin geçerli olduğu anlaşılmıyordu. Artık: tek YERLEŞİM, `G1`'den kesintisiz; sonradan varlık eklenecekse liste baştan yazılır, yanına ikincisi eklenmez.
- **Arayüz parçaları varlık değil.** Durum etiketi, düğme, giriş alanı, sekme, çip — kodla çiziliyor. Görsele çevrilince yazı resme gömülüyor, ölçeklenmiyor, rengi değişmiyor. Gelen `durum-etiketleri.png` hem yanlış üsluptaydı hem içine harf gömülmüştü. Tasarım promptu da artık uyarıyor: stil panelinde bileşen örneği **görünsün** ama varlık listesine girmeyecek.
- **Doku gerçekten dikişsiz olmalı.** Gelen arka desen çerçeveli tek bir kart olarak geldi: köşelerinde süs, ortasında parlaklık. Döşenince ızgara gibi tekrar ederdi. Kural netleşti: çerçeve, kenarlık, köşe süsü ve vinyet yok; her yerinde aynı yoğunlukta, kenarları birbirine geçen karo.

## v0.78.0
- **Logo artık varlık listesine girmiyor.** İlk başarılı tasarım turunda çıktı: ChatGPT tabakanın varlık listesine logoyu da koyuyordu. Oysa logo Studio'dan geliyor ve uygulama onu ayrı katman olarak çiziyor; yeniden üretilirse asıl logodan sapar ve ekranda iki logo üst üste biner. Üç yere kural kondu — tasarım promptunda *"ekranlarda kullan ama varlık olarak sayma"*, tarif promptunda *"YERLEŞİM'e yazma"*, görsel üretim bölümünde *"logoyu ve G1'i üretme, sıraya koyma"*.

## v0.77.0
Yapıyı tasarımdan önce koymak veriyi doğru getirdi ama tasarımı öldürdü: ChatGPT sol kenar menülü **masaüstü muhasebe paneli** çizdi, ekranlar sayı yığınına döndü, Stil ve Varlık Listesi paneli hiç gelmedi — yani renk kodları da yoktu.

- **Tam künye tasarımcıya gitmiyor artık.** Promptun **%38'i** künyeydi: alan türleri, zorunluluklar, roller, yetkiler. O ayrıntı kodu yazacak olan için; tasarımcıya verilince ekranı veri tablosuna çeviriyor. Yerine kısa özet: hangi ekranlar var, ne işe yarıyor, hangi dört bilgi görünüyor. Prompt 7.756 → 6.491 karakter.
- **Altı ekran rolü korunuyor.** Künye görünce bütün sayfaları ayrı ayrı çiziyordu. Artık açıkça yazıyor: altı rolü gerçek ekranlarla doldur, ama **altı ekran altı kalsın**.
- **"Hepsi telefon" kuralı öne alındı.** Altı ekran başlığının ilk satırı: her ekran dikey telefon çerçevesi içinde, masaüstü yok, sol kenar menüsü yok.
- **Yasak listesine iki madde:** masaüstü paneli çizme · ekranı veri tablosuna çevirme ("program muhasebe bile olsa her ekranda nefes, başlık ve doku olsun").
- **Teslim biçimi zorunlu oldu:** *"Panel olmadan tasarım eksiktir — bir sonraki adımda tarifi isteyeceğim ve renk kodlarını oradan okuyacağım."*

## v0.76.0
- **Silinen projenin görselleri de gidiyor.** Yeni `gorseller` kovasındaki dosyalar kalıyordu: proje satırı silinince palet de gidiyor ve dosyaların yolunu bir daha bulamıyorduk, kovada yer kaplıyorlardı. Silme onayı da artık kaç görsel gideceğini yazıyor.
- **Silmeden sonra "dışarıda kalanlar" penceresi.** Studio yalnız kendi verisini silebiliyor — GitHub deposunu ve sohbetleri silmek jeton saklamayı gerektirirdi, bilerek saklamıyoruz. Pencere üç izi sayıyor ve doğrudan oraya götürüyor: deponun **Settings → Danger Zone** sayfası, Claude Code oturum listesi, ChatGPT sohbeti. Depo adresi silinmeden önce alınıyor; sonrasında proje kaydı yok, bağlantıyı üretemezdik.
- **Bulunan hata:** silme sonrası açılan pencere anında kapanıyordu. Adres `#/projeler`e dönerken `hashchange` bütün pencereleri kapatıyor ve sıra yüzünden bu yeni pencereyi de alıyordu. Artık adres değişimi beklenip pencere ondan sonra açılıyor.
- **Bulunan hata:** yeni pencerenin `.dk` sınıfı yapı ağacındaki `.dk` ile çakışıyordu; numara ve metin alt alta düşüyor, açıklamadaki kalın sözcükler satır kırıyordu. Sınıflar `.sk-` önekine alındı.

## v0.75.0
- **Yapı tasarımdan önce geldi.** Sıra yanlıştı: ChatGPT ekranları çizerken hangi modüllerin ve sayfaların olacağını bilmiyordu, o yüzden altı **genel** ekran çiziyordu. Artık `3 · Yapıyı kurma` → `4 · Tasarımı belirleme`.
- **Tasarım promptu künyeyi taşıyor.** Programın gerçek modülleri, sayfaları ve alanları prompta giriyor: panelin kartları o sayfalar, listenin sütunları o alanlar, formun kutuları o alanlar oluyor. Simgeler de buna göre — her modül ve sayfa için o işi anlatan bir simge isteniyor, genel "belge, ayar, kullanıcı" değil.
- Künye henüz yoksa prompt bunu söylüyor ve genel çizim isteyip modül adı uydurmasını yasaklıyor.

## v0.74.1
- **"Bütün kararları gör" çalışmıyordu.** Haritanın altına yeni eklenen satır adım numarasını ayarlıyor ama adım kipine geçmiyordu; harita yeniden çiziliyor ve düğme ölü görünüyordu.

## v0.74.0
- **Görsel dünya adasında artık tek kart açık.** Dört kart aynı anda "sırada" yazıyordu, hangisinin sırası olduğu anlaşılmıyordu. Şimdi biten adım tik ve özetiyle kapanıyor (*"logo + işletme görseli"*, *"3 yuva açıldı"*), sıradaki açık ve **şimdi** etiketli, bekleyenler sade satır. Kapalı satıra dokununca o adım açılıyor.
- **Şerit adanın kendi adımını sayıyor.** Genel adım şeridi kalan bütün kararları sayıp *"1 / 15"* diyordu; bu ada tek adım olduğu için yanıltıyordu. Yerine dört bölmeli kendi şeridi ve `2/4` sayacı geldi.
- **Başlık iki kez yazmıyor.** Üstteki ada başlığı kaldı, altındaki ikinci büyük başlık gitti.
- **"Adayı bitir" ada bitene kadar sönük**, bitince yeşile dönüyor. Hiçbir şey yapılmadan ana düğme gibi durup kullanıcıyı erken çıkarıyordu.
- **"Bitiş" haritadan çıktı.** Özet bir ada değil; haritanın altında *"Bütün kararları gör"* satırı oldu. Beşinci ada gibi durunca "daha bir ada var" hissi veriyordu.
- **Prompt düğmeleri telefonda uygulamayı açmayı deniyor.** ChatGPT ve Claude için uygulama şeması deneniyor; kurulu değilse hiçbir şey olmuyor ve bağlantı normal seyrinde web'e gidiyor. Şemalar resmî belgelenmiş değil, o yüzden web yolu hep duruyor.

## v0.73.0
Dördü de ilk gerçek kullanımda çıktı.

- **Görseller tek tek isteniyor.** Dört görsel birden istenince ChatGPT ikisini yapıp duruyordu; eksik olan da fark edilmiyordu. Artık: bir mesajda tek görsel, sonunda *"kaldı: G4, G6"* satırı, sen **"devam"** diyene kadar bekle.
- **İki ayrı simge dili.** Tek "ikon seti" istemek yanlıştı. Büyük yerlerde (hızlı işlem kartları, boş durum) zengin çok renkli illüstrasyon; alt çubuk, liste ve formlarda sade **tek renk** çizgi simge — çünkü aktif sekmede renk kodla değişiyor. Tasarım promptu artık ikisini birden kurduruyor, tarif ikisini ayrı yuva olarak yazıyor.
- **Biçim amaca göre.** "Simge için `.svg` yaz" kuralı geri tepiyordu: gölgeli bakır illüstrasyon vektörde çıkmayınca model kolaya kaçıp düz geometrik simgeye çeviriyordu. Yeni kural: illüstrasyon, fotoğraf ve doku → **saydam PNG, en az 256px**; arayüz simgesi ve süsleme → **tek renk SVG**, renk `currentColor` ile.
- **Dosya yolu değil, dosya.** ChatGPT `/mnt/data/...` yazıp geçmişti. Prompt artık indirilebilir dosya ya da kod bloğu istiyor.
- Tarif promptu **yeni sohbette de** çalışıyor: "bu görselleri zaten çizdin *(yeni bir sohbetteysek: ekli tabakada)*".

## v0.72.0
- **"Yeniden tasarlama — çıkar" kuralı geldi.** İlk gerçek denemede ortaya çıktı: ChatGPT tabakada bakır, gölgeli, hacimli ikonlar çiziyor; tek tek istenince aynı konuları **düz iki renkli geometrik simge** olarak yeniden üretiyordu. Tabakayla dosyalar arasındaki bağ kopuyordu. Tarif promptu artık açıkça söylüyor: bu görselleri zaten çizdin, şimdi yenisini üretmiyorsun — kullandığını **tek dosya hâlinde çıkarıyorsun**. Aynı çizim dili, aynı renk, aynı ışık; "daha kullanışlı olur" diye başka üsluba geçmek yasak.
- Tasarım promptu da baştan uyarıyor: ekranları çizerken kullandığın her görseli sonradan ayrı ayrı çıkarabilecek şekilde kur, çünkü aynısı istenecek.
- Üç teknik kural eklendi, üçü de denemede çıktı: **görsellerin içine yazı gömme** (logo ve slogan hero'ya pişmişti, uygulamanın kendi logosuyla üst üste binerdi) · **arkaya açık leke pişirme** (illüstrasyonun arkasındaki kâğıt gölgesi koyu zeminde kirli bulut gibi duruyordu) · **kanvas görselin kendisi kadar olsun** (süs motifi kocaman boş tuvalin ortasındaydı).

## v0.71.0
- **Tarif promptu artık görselleri de zorunlu istiyor.** Eskiden son satırda *"görselleri tek tek verebilirsin"* diyordu; ChatGPT tarifi yazıp duruyordu, görselleri elle istemek gerekiyordu. Artık ayrı ve zorunlu bir bölüm: iki bölümü verdikten hemen sonra, sormadan, YERLEŞİM'deki her görseli üretecek.
- Kurallar netleşti: her görsel ayrı mesajda ve başında `G2 · gorsel-2.jpg` yazacak · dosya adı YERLEŞİM'dekiyle **birebir** aynı olacak · `.svg` olanlar resim değil **SVG kodu** olarak gelecek (kopyalanıp dosyaya kaydedilebilsin) · ikon seti tek dosyada, her simge kendi `<symbol id>` içinde · doku dikişsiz · illüstrasyon zemini saydam · yer tutucu yasak · üretemediğini sessizce atlamayacak.
- YERLEŞİM biçim açıklamasına eklendi: yazdığın dosya adı bağlayıcıdır, görsel aynı adla üretilecek — uygulama onu o adla arıyor.

## v0.70.1
- **Tarif başlıkları `##` olmadan da tanınıyor.** ChatGPT bölüm başlıklarını bazen düz `GÖRSEL DİL` / `YERLEŞİM` diye yazıyor; ayrıştırıcı yalnız `##` ile arıyordu. Bulamayınca yuvalar yine açılıyordu ama yerleşim satırları görsel dil metninin içinde kalıp 2. bloğa iki kez giriyordu.

## v0.70.0
- **Tasarım promptuna kalite çıtası eklendi.** İlk denemede çıkan tasarımlar temiz ama düzdü: renkli başlık şeridi, beyaz kutular, hazır setten çıkmış görünen simgeler. Prompt "tema üret" diyordu ama **hangi katmanlar olmadan tasarımın yarım sayılacağını** söylemiyordu. Artık altı katman tek tek zorunlu: açılış görseli üstüne binen içerik · işe özel çizilmiş çok renkli simgeler · kâğıt dokusu · logo çerçevesi ve süsleme motifi · katmanlı derinlik · gerçek boyutta serif başlık.
- Çıta bir cümleyle bağlandı: *"yönetim paneli gibi değil, butik otel uygulaması gibi görünmeli."* Yanına yasak listesi: beyaz üstüne beyaz kart, renkli şeritten ibaret başlık, Material/Lucide havası, hazır şablon.
- **Teslim biçimi sabitlendi.** ChatGPT ilk denemede altı ekranı tek tabakada, yanında bir Stil ve Varlık Listesi paneliyle vermişti — bu iyi çıktı şansa kalmasın diye prompt artık onu açıkça istiyor: görseller numaralı, ikon seti, doku örneği, renk paleti, yazı tipleri, yuvarlama, bileşen örnekleri.
- **Tarif promptu genişledi:** görsel dile `Doku`, `Derinlik`, `Amblem` ve `Açılış` satırları eklendi. Yeni katmanlar tarife girmezse Claude onları kodda tekrarlayamıyordu.

## v0.69.0
- **Bütün prompt düğmeleri artık "kopyala ve aç".** Dokununca prompt panoya girer, düğme *"ChatGPT açılıyor…"* yazar ve hedef sohbet yeni sekmede açılır. Görsel dünya'nın iki promptu **ChatGPT**'ye, kalan hepsi **Claude Code**'a gider.
- Sonraki bloklar **mevcut oturumu** açıyor (`claude.ai/code`); yalnız ilk tanışma ve Studio geliştirmesi yeni oturum açıyor. Her blokta `/new` açmak gereksiz sohbet yığıyordu.
- Düğmeler gerçek `<a target="_blank">` — iOS'ta ana ekrandan açılan uygulamada `window.open` sessizce çalışmıyor, üstelik genel eylem dinleyicisi `preventDefault` çağırıp bağlantıyı öldürüyordu. Kopyalama dokunma jestinin içinde, `await` beklemeden başlıyor.
- Görev ve Studio geliştirme promptları pencereyle veriliyor; oradaki ana düğme de kopyalayıp açıyor.

## v0.68.0
- **Tasarım durağı baştan kuruldu: 50 karar yerine 13.** Renk, kart biçimi, simge seti, tipografi — bunları artık Studio sormuyor. Logo ve **işletme görseli** ChatGPT'ye gidiyor, o altı ekranı tasarlayıp bir **görsel dil tarifi** döndürüyor, Claude Code bütün ekranları o tarife göre kuruyor. Studio hiçbir estetik karar vermiyor: malzeme topluyor, prompt üretiyor, cevabı taşıyor.
- **On ada dörde indi:** Görsel dünya · Kabuk · Davranış · Sistem. Kalan 13 kararın ortak özelliği, bir ekran görüntüsünde **görünmemeleri** — masaüstü genişliği telefon tasarımında yok, hareket miktarı durağan resimde yok, bildirimin nereye çıktığı davranıştır.
- **Görsel yuvaları geldi.** Tarif kaç görsel gerektiğini ve her birinin nerede duracağını söylüyor; Studio isimli boş yuvalar açıyor. ChatGPT'nin ürettiğini yuvaya bırakıyorsun — sıra karıştıramazsın, çünkü yuvanın adını da dosya adını da tarif yazdı. Verdiğin işletme görselini tarif kullanmışsa o yuva **kendiliğinden doluyor**.
- **2. blok değişti:** artık tasarım kararları listesi değil, görsel dil tarifi + yerleşim + görsellerin imzalı adresleri. Claude ilk iş olarak görselleri depoya indiriyor, sonra tarifi `NIZAM.md`'ye yazıyor.
- Görseller `gorseller` kovasında, özel; adresler bir saat geçerli. Kurulum: `sql/14-gorsel.sql`.
- Kalkanlar: palet adası, marka promptu, `PALET_ALAN`, palet yapıştırma ve elle düzenleme, görünüşe dair 29 çelişki kuralı.
- **Bulunan hata:** önizlemede `a + b + {…}[k] || varsayilan` parantezsiz yazılmıştı; toplama önce olduğu için anahtar bulunamayınca varsayılana hiç düşmüyor, ekrana `undefined` basıyordu. Kararların çoğu kalkınca ortaya çıktı, düzeltildi.

## v0.67.0
- **Geliştirme durağı ikiye ayrıldı: "Bütün programlarda olsun" ve "Yalnız bu programda olsun".** Beta'yı denerken gördüğün eksik bazen tek bir programın değil — *"hiçbir uygulamada yakınlaştırma olmasın"* gibi. Artık ilk kart bunu Studio'nun kendi deposuna yollayan bir prompt üretiyor; ikinci kart yalnız bu programı ilgilendiren işi görev olarak açıyor.
- **Geliştirme durağında görev ekleme düğmesi yoktu.** Beta çıktıktan sonra iş açmak için Yapı durağına dönüp sayfayı bulmak gerekiyordu. Artık durağın kendisinden açılıyor.
- **Teknik standart artık damgalanabiliyor.** Standarda yeni satır eklenince eski programlar bunu hiç duymuyordu; satır sessizce yalnız bir sonraki prompta giriyor, hedef depodaki `NIZAM.md` eski hâliyle kalıyordu. Damgalı satır artık her programın Geliştirme durağında **"yeni standart"** olarak çıkıyor, yol haritasında rozet veriyor ve tek düğmeyle o programa taşınan bir prompt üretiyor. Gerekmiyorsa "gördüm" ile susuyor.
- **İki yeni standart:** *Yakınlaştırma — kapalı* (çift dokunma ve iki parmakla büyütme yok; yazı boyutu ayarlardan değişir) ve *Geliştirme istekleri — Ayarlarda toplanır* (kullanıcı isteğini programın içinden yazar, cihazda birikir, tek metin olarak kopyalanır; sunucuya gitmez).

## v0.66.0
- **Çözümleme promptu artık veri katmanını söylüyor.** Modül kurulurken Claude'a yalnız firma, sektör ve roller gidiyordu; sunucusuz bir projede bile modül kurallarına *"satır güvenliği (RLS)"* yazıyordu. Yerel seçiliyse prompt açıkça yasaklıyor: roller yalnız arayüzü biçimlendirir, RLS yazma.
- **Modül silme her yoldan aynı işi yapıyor.** Proje ekranındaki ⋯ menüsünden silinen modülün sayfa künyeleri, anlatımı ve modül kuralları palette **yetim kalıyordu** — promptlar silinmiş modülü yazmaya devam ediyordu. Artık üç silme yolu da paleti temizliyor ve modülde görev varsa hepsi engelliyor.
- Ağaçtan modül silinince taslak tamamen sıfırlanıyor; modül kuralları ve bağlantı listesi bir sonraki modüle sızıyordu.

## v0.65.0
- **Beta durağına "Yayın adresi" adımı geldi ve sıraya girdi.** Artık 3. blok, yayın adresi kaydedilmeden kopyalanamıyor — düğme sönük duruyor ve sebebi yazıyor. Sıra: adresi al → bloğu kopyala → betayı dene.
- **Pages ayarları tek dokunuşla açılıyor** (`Settings → Pages` bağlantısı) ve geri dönünce adres kendiliğinden yazılıyor: `nizamsoft.github.io/NIZAMSOFT-KisiselButce`. Depo adresinden türetiliyor, elle yazmaya gerek yok.
- **3. blok artık yayın adresini de söylüyor** ve iki yayın tuzağını kapatıyor: GitHub Pages alt klasörden yayınladığı için bütün yollar göreli olmalı (`style.css`, `./app.js`) — kök yol yayında kırılır. Servis işçisi yolları ve manifestteki `start_url` de göreli. Ayrıca depo köküne `.nojekyll` isteniyor.

## v0.64.0
- **Veri katmanı artık proje başına seçiliyor.** Teknik bilgilerde yeni bir alan: **Supabase (bulut)** ya da **Yerel tarayıcı**. Eskiden teknik standart her projede Supabase diyordu; sunucusuz bir uygulama için altı satır birden yanlış gidiyordu.
- **Yerel seçilince** promptta şunlar değişiyor: veri IndexedDB'de, gerçek zamanlı yok, dosyalar cihazda, giriş **yerel PIN** ile, dış paket yok, değişiklik kaydı cihazda. Ayrıca **Yedek: dosyaya dışa/içe aktarma** satırı ekleniyor ve en başta "bu proje sunucusuz" uyarısı çıkıyor.
- Yerel PIN'in gerçek kimlik doğrulama olmadığı, verinin şifrelenmediği ve yedek almanın kullanıcının sorumluluğunda olduğu promptta açıkça yazılı.

## v0.63.1
- **Kopyala düğmeleri artık sessiz kalmıyor.** Prompt üretimi hata verirse ekranda sebebi yazıyor; pano açılamazsa metin pencereyle veriliyor, elle kopyalanabiliyor. Eskiden ikisi de "hiçbir şey olmuyor" gibi görünüyordu.
- **Beta durağı künye eksikse uyarıyor:** "Sayfa künyesi yok. Önce Yapıyı kurma durağında modülü kur." Blok yine kopyalanıyor ama yarım olduğu belli oluyor.
- Beta kartına **"Bloğu gör"** bağlantısı eklendi — metni okumak ya da elle kopyalamak için.

## v0.63.0
- **Link önizlemesi düzenlendi.** Adres birine gönderildiğinde artık 1200×630 bir kapak kartı çıkıyor: logo, "NIZAM | Studio" ve tek cümlelik tanım. Eskiden kare uygulama simgesi küçük bir kutu olarak görünüyordu.
- Bütün Open Graph ve Twitter etiketleri tam adresle yazıldı — kazıyıcılar göreli adresi çözemiyordu. `og:url`, `og:locale`, görsel ölçüleri, `twitter:card = summary_large_image` ve `canonical` eklendi.
- Sekme başlığı ve arama açıklaması genişletildi.

## v0.62.0
- **Proje yolu yeniden sıralandı: 6 durak → 8.** Yapı kurulduktan sonra sıra artık **Beta → Geliştirme → Final → Güncellemeler**. Eskiden Yapı'dan doğrudan Geliştirme'ye geçiliyor, sonunda da hiç sıraya girmeyen boş bir "Sürüm" durağı duruyordu.
- **Beta durağı** son bloğu (modüller, sayfalar ve künyeleri) panoya alıyor — kod bu blokla başlıyor. Claude beş aşamayı bitirip main'e gönderince "Beta çıktı, denedim" diye işaretliyorsun. Studio deponun içini göremediği için bu işareti sen koyuyorsun.
- **Final durağı** bütün görevler bitmeden işaretlenemiyor; sebebi ekranda yazıyor.
- **Güncellemeler durağı** bilerek hiç "tamam" olmuyor — final verildikten sonra proje orada yaşamaya devam ediyor. Depo adresi ve açık istekler orada.
- **3. blok promptu eklendi** (`Modüller ve sayfalar 3/3`): sayfa künyeleri, modül kuralları ve beş aşamalı kurulum talimatı. Önceki iki bloğun aksine bu blok kod yazmayı istiyor.
- Görev durumları yine dört: Yapılacak · Geliştiriliyor · Kontrolde · Tamamlandı. Beta ve Final durak işareti, görev durumu değil.

## v0.61.0
- **Üst çubuk çelişkileri artık yakalanıyor.** "İnce başlık" tarifi *"yalnız sayfa adı ve geri oku"* diyor; yanına kullanıcı çipi, destek düğmesi, arama simgesi, eylem düğmesi ya da güncelleme rozeti seçilirse Özet ekranı uyarıyor ve dokununca o adıma götürüyor. Sağa bir şey koymak istiyorsan üst çubuğu "Logo + arama" ya da "Eylemli" seçmelisin.
- **Yalnız mobil projede masaüstü kararı uyarı veriyor.** "Genişlik" başlığı ve "Bildirim: Sağ üstte" masaüstü kararı; proje sadece mobilse Özet bunu söylüyor. Platform "İkisi birden" ise uyarı çıkmıyor.
- **Marka paleti promptuna kural eklendi:** Ton cümlesi vurgu rengiyle çelişmesin — vurgu maviyse ton "kırmızı kıvılcım" diye tarif edilmesin.

## v0.60.1
- Tasarım bloğunda iki çelişki düzeltildi: başlık "2. blok" derken gövde "iki bloktan birincisi" diyordu — bloklar artık **2/3** ve **3/3** diye numaralanıyor. Ayrıca "renkleri değişken olarak tanımla" talimatı "CSS dosyası yazma" yasağıyla çakışıyordu; artık renk kodlarının şimdilik yalnız NIZAM.md'ye yazılacağı, değişken tanımının kod zamanına kalacağı söyleniyor.

## v0.60.0
- **Tasarım özetindeki düğme artık doğru promptu veriyor.** Eskiden marka paleti *isteme* promptunu kopyalıyordu — oysa o adımda palet çoktan gelmişti. Şimdi **2. bloğu** kopyalıyor: palet, yazı tipleri ve 52 arayüz kararı, üstüne "NIZAM.md'deki *Tasarım kararları* başlığını doldur, `[NS-0] Tasarım kararları` ile main'e gönder, dur ve bekle" talimatı.
- Blok kod yazmayı, sayfa uydurmayı ve karar değiştirmeyi açıkça yasaklıyor; depo uyarısı da içinde.
- Palet adasındaki "Prompt kopyala" değişmedi — o hâlâ logodan palet isteyen prompt. İkisi artık ayrı işler.

## v0.59.2
- **Yanlış depoya bağlı oturum uyarısı sıkılaştırıldı.** Eski metin "yanlış depoya yazma" diyordu; Claude bunu hedef depoyu oturuma **ekleyerek** aşıyor, iş doğru depoya gidiyor ama oturum yanlış depoya bağlı kalıyordu. Artık açıkça yazıyor: depo farklıysa hedef depoyu bu oturuma ekleme, dosya oluşturma, commit atma — dur ve söyle. "Şunları yapma" listesine de **"Bu oturuma başka depo ekleme. Tek depo, tek oturum."** maddesi eklendi.

## v0.59.1
- **Claude Code artık gerçekten yeni oturum açıyor.** Telefonda `claude.ai/code` mevcut oturumu açtığı için `repositories=` parametresi tutmuyor, oturum en son kullanılan depoda başlıyordu. Bağlantı `claude.ai/code/new` oldu — belgede telefonda yeni oturum için bu adres yazıyor.
- **Tanıtım metni dalı da söylüyor:** commit `main` dalına gidecek. Claude Code oturuma ayrı bir dal atayabildiği için bu artık açıkça yazılı; yeni depoda ayrı dala ve pull request'e gerek yok.

## v0.59.0
- **Depo adresi kendiliğinden geliyor.** "GitHub'da aç"a basıp depoyu kurduktan sonra uygulamaya dönünce adres kendi yazılıyor — artık elle yapıştırmıyorsun. Depo adını zaten Studio üretiyor; eksik olan tek parça GitHub kullanıcı adındı, o da ilk projede bir kez soruluyor ve bir daha sorulmuyor.
- Adres yazılınca düğme **"Depoyu aç"**a dönüyor ve deponun kendisine götürüyor; bir daha yeni depo kurdurmuyor.
- Adres satırına elle yazarsan da kullanıcı adı oradan öğreniliyor.

## v0.58.3
- **Tanıtım metni artık hangi depoda çalışılacağını en tepede söylüyor.** Claude Code yeni oturumu en son kullanılan depoyla açabildiği için bu şarttı; eskiden depo satırı yalnız adres kayıtlıysa ve tablonun içinde geçiyordu. Şimdi başlığın hemen altında `> ### Depo: owner/repo` uyarısı var ve "başka bir depoda açıldıysan hiçbir şey yazma, dur ve söyle" diyor. `NIZAM.md` talimatı da depoyu adıyla anıyor.
- Adres henüz kaydedilmemişse metin bunu açıkça yazıyor: "Depo henüz bağlanmadı — dosya oluşturmadan önce bana sor." Depo satırı tabloda da her zaman görünüyor.
- Depo adresi yokken Claude Code düğmesi sönük duruyor ve kart kırmızıyla uyarıyor.

## v0.58.2
- **"GitHub'da aç" ve "Claude Code'da aç" artık gerçekten açılıyor.** iPhone'da ana ekrandan açılan uygulamada `window.open` sessizce engelleniyordu; üstüne çağrı bir `await`'ten sonra geldiği için Safari onu kullanıcı dokunuşu saymıyordu. İkisi de gerçek bağlantıya (`<a target="_blank">`) dönüştü, adres çizim anında hesaplanıyor.
- **Depo kurulunca düğme değişiyor:** "GitHub'da aç" yerine **"Depoyu aç"** oluyor ve deponun kendisine götürüyor — bir daha yeni depo kurdurmuyor.
- Pano kopyalama bağlantıyı engellemeyen ayrı bir dinleyiciye taşındı; tanıtım metni yine panoya giriyor.

## v0.58.1
- **İlk Claude Code oturumuna artık tam kimlik dosyası gitmiyor.** O adımda tasarım ve yapı henüz yapılmamış oluyordu; giden metnin içinde verilmemiş kararlar ve boş künyeler vardı. Yerine kısa bir **tanışma** promptu geldi: firma, ürün, platform, veritabanı, depo ve teknik standart. Claude bunlarla `NIZAM.md` + `README.md` kurup `[NS-0]` ile commit'liyor ve duruyor.
- Prompt açıkça yasaklıyor: uygulama kodu yazma, tasarım kararı verme, sayfa/modül uydurma. Tasarım ve yapı bloklarının sonraki duraklarda geleceğini söylüyor.
- Tanıtım panoya alınıyor ve Claude Code'un prompt kutusu **boş** açılıyor — dolu gelseydi yapıştırmadan önce silmek gerekiyordu. Tek yapıştır, tek gönder.

## v0.58.0
- **Claude Code doğrudan depoyla açılıyor.** İkinci kart artık "Claude Code oturumu": `claude.ai/new` sohbeti yerine `claude.ai/code` açılıyor ve **deposu seçili geliyor** (`repositories=` parametresiyle). Prompt kutusunda ne yapılacağını anlatan açılış mesajı hazır duruyor, projenin kimlik dosyası da panoda — ilk mesajdan sonra yapıştırıyorsun.
- Depo adresi `github.com/owner/repo`, `https://…` ya da düz `owner/repo` biçimlerinden okunuyor; adres yoksa Claude Code yine açılıyor ama depoyu elle seçmen gerektiği söyleniyor.

## v0.57.1
- **Depo adı okunur oldu:** `nizam-soft-kisisel-butce` yerine **`NIZAMSOFT-KisiselButce`** — firma tamamen büyük ve bitişik, modül her kelimenin ilk harfi büyük ve bitişik, aralarında tek tire. Türkçe harfler ASCII'ye iniyor (`Güllüoğlu Kübban` → `GULLUOGLUKUBBAN`). Modül adı boşsa yalnız firma yazılıyor.

## v0.57.0
- **Proje adı artık "Firma - Modül".** Depo durağının tepesine **Modül adı** satırı geldi (örn. Kişisel Bütçe). Yazdığın an proje listesi, künye, üst çubuk, görev başlıkları ve promptlar "Nizam Soft - Kişisel Bütçe" diye görünüyor; depo adı da `nizam-soft-kisisel-butce` oluyor. Modül adı boşsa hiçbir şey değişmiyor, sade firma adı kalıyor.
- Yapı ağacına girince ilk modül bu adla hazır geliyor.
- Rozet harfleri ("NS") firma adından geliyor, önizlemedeki sahte müşteri uygulaması da firma adını kullanmaya devam ediyor — orası müşterinin kendi markası.
- "GitHub'da aç" tarayıcıda kalıyor (mobil uygulamada adı hazır doldurmanın yolu yok), ama artık depo adı açarken panoya alınıyor — iOS uygulamaya devrederse tek yapıştırmayla giriyorsun.

## v0.56.0
- **Yeni durak: Depo ve sohbet.** Proje kurulunca doğrudan buraya düşüyorsun. İki kapı var: GitHub'da gizli depo (adı firmadan türetiliyor, sayfa doldurulmuş açılıyor, adresi yapıştırıyorsun) ve Claude sohbeti (NIZAM.md panoya alınıp claude.ai açılıyor). İkisi bitmeden Tasarım durağı sıraya girmiyor.
- Duraklar 5'ten 6'ya çıktı; Tasarım 3, Yapı 4, Geliştirme 5, Sürüm 6 oldu.

## v0.55.0
- **Tasarım artık ada ada.** Adıma girmeden önce harita açılıyor: 11 ada, her biri bir öbek. Biten yeşil tikli, sıradaki kırmızı ve nabız atıyor, sağda `3/9` karar sayacı ve tepede genel yüzde var. 52 adımı baştan sona takip etmek yerine adayı bitirip haritaya dönüyorsun.
- Adanın son adımında İleri **"Adayı bitir"** oluyor ve haritaya dönüyor; ilk adımında Geri **"Harita"** oluyor. Üstteki öbek rozeti de haritaya dönüş düğmesi.
- Sıra zorunlu değil: ileri bir adaya dokunup açabilirsin.
- Varsayılanı İleri'yle onaylamak da tamamlama sayılıyor; onaylar adadan çıkarken tek yazımda kaydediliyor.

## v0.54.0
- **Roller artık Yapı'da belirleniyor.** Ağaçta firmanın hemen altında "Roller" satırı var: kaç yetki katmanı olduğunu ve adlarını orada yazıyorsun. Modül kurallarındaki "kimler görür" sorusu bu listeden besleniyor — doğru yerde soruluyor.
- **Sihirbaz 6 adımdan 5'e indi.** Roller çıktı, tarihler "Yetkili kişi" adımına inip "Yetkili ve takvim" oldu.
- **Rol merdiveni yeniden çizildi:** satırlar artık kart, en geniş katman metal rozetle işaretli, katman sayısı kırmızı seçiliyor. Eskiden etiketler girdiyi ittiği için her satır farklı genişlikteydi.
- Tarih alanları koyu temaya uyduruldu ve yan yana geldi.

## v0.53.0
- **Prompt kopyalama tek dokunuş oldu.** Eskiden önce pencere açılıyor, sonra kopyalanıyordu. Şimdi düğmeye basınca prompt panoya gidiyor, düğme yeşil tikle "Prompt kopyalandı"ya dönüyor ve kırmızı **Cevabı yapıştır** düğmesine geçip parlıyor — sıradaki adım kendini gösteriyor. Promptu okumak isteyen için altta "Promptu gör" duruyor.
- Palet adımında "Logo yok"un altındaki açıklama kaldırıldı.
- **Logo kutusu artık siyah bir delik gibi durmuyor:** boşken bir tık açık yüzey ve belirgin kesik çerçeve. Yüklenemeyen logo sessizce boş kalmak yerine uyarı renginde çerçeveleniyor.
- Sihirbaz temizliği: kullanılmayan dil/para kodu kaldırıldı, roller yeni projede artık sıfırlanıyor (önceki projenin rolleri taşınıyordu).

## v0.52.0
- **Tek logo.** `logo-full.png` ve `logo-n.png` kalktı; uygulamanın her yerinde tek bir `logo.png` var: zeminsiz N, altında ışık çizgisi, altında STUDIO. Açılış, giriş, üst çubuk ve filigran aynı görseli kullanıyor.
- **Yeni tasarım kararı: Logo görünümü.** Uygulama kabuğu öbeğinde, üst çubuktan hemen sonra soruluyor. Varsayılan "Zeminsiz, altında ad" — Studio'nun kendi logosuyla aynı dil. Diğer seçenekler: yalnız logo · kutu içinde · yanında ad.
- Karar önizlemeye bağlı: seçim üst çubuktaki, açılıştaki ve girişteki logoyu anında değiştiriyor.

## v0.51.1
- Uygulama simgesindeki kırmızı ışık gerçek bir ışığa dönüştü: ince çekirdek, yumuşak hale.

## v0.51.0
- **Künye ikiye ayrıldı.** Kim görür, hangi işler yapılabilir, hangisini kim yapar ve ortak kural artık **bir kez modül için** soruluyor; ağaçta modülün altında "Modül kuralları" satırı olarak duruyor.
- **Sayfa künyesi üç soruya indi:** ne işe yarar · nasıl bir ekran (tür, kaç kayıt, yapı) · neler yazılacak. Dördüncü satır "Farklı mı?" — sayfa modül kuralından ayrılıyorsa orada yazılıyor, dokunulmazsa modülün kuralı geçerli.
- Ağaç satırları düz Türkçe özet gösteriyor: "Alt alta liste · on binlerce kayıt · bir işlem birden fazla yeri etkiler".
- Çözümleme promptu da buna göre kuruldu: Claude modül kurallarını bir kez, sayfa farklarını sayfa içinde veriyor.

## v0.50.1
- Ağaçta bir şeye dokununca sayfa başa fırlıyordu; kaydırma yeri artık korunuyor.
- **Modül kaldırma** geldi: modülün sayfa listesinin altında sessiz bir düğme. Kurulmuş modülü sayfaları ve künyeleriyle siliyor, görevi varsa önce uyarıyor.

## v0.50.0
- **Ağaç tek parça oldu, hep yukarıdan aşağı akıyor:** firma → modüller → seçili modülün sayfaları → açık sayfanın künyesi. Hiçbir kat kaybolmuyor, modüle ikinci dokunuş kapatıyor.
- **Modül adı düzeltilebiliyor** — yol izindeki modül çipine dokununca soruyor. "Yeni Modül" olarak kalmışsa kartın altında "adına dokun, değiştir" yazıyor.
- **Üstteki geri tuşu** artık sabit bir yere atlamıyor: yapı ağacındaysa bir kat yukarı çıkıyor (dal → sayfa → modül → firma), başka yerde tarayıcı geçmişinde bir adım geri gidiyor.
- **Kalıp tek seçim** oldu; ikincisine dokununca öncekinin yerini alıyor. Prompt da Claude'dan tek kalıp istiyor.
- Not defteri düğmesi dar ekranda başlığı eziyordu, küçültüldü.

## v0.49.0
- **Not defteri** — üst çubuğa kalem simgesi geldi. Basınca tepeden açılıyor, alt kenarından çekerek boyunu ayarlıyorsun. Kopyala ve Temizle düğmeleri var. Hiçbir yere kaydedilmiyor; ekranlar arası geziniyor, sayfa yenilenince siliniyor.

## v0.48.1
- Blokta modül adı yoksa aktarım sonrası ağaç boş görünüyordu — sayfalar geliyordu ama adsız modül çizilmiyordu. Artık ad soruluyor; yine de boş kalırsa "Yeni Modül" olarak açılıyor.
- Modül adına dokununca (henüz kurulmamışsa) değiştirilebiliyor.

## v0.48.0
- **Ağaç dikey oldu.** Yapıyı kurmaya basınca tepede firma logosu, altında oklarla modüller. "Yeni modül" de bir modül kartı gibi duruyor.
- **Elle modül kurma kalktı.** Yeni modül anlatarak kuruluyor: metin kutusu, "Prompt oluştur" ve "Cevabı yapıştır". Anlat ekranında önizleme yok. Modülün adını da Claude'un bloğu getiriyor.
- Blok yapıştırılınca ağaç kuruluyor: **modül tepede, sayfalar altında oklarla**. Bir sayfaya dokununca künyesi hemen altında dallanıyor — Amaç · Tür · Kalıp · Alanlar · Eylemler · Roller · Yetki · Kural. İkinci dokunuş kapatıyor.
- Bir dala dokununca düzenleme kendi ekranında açılıyor; üstte canlı önizleme, altta "Sıradaki" ile bir sonraki dala geçiş.

## v0.47.2
- Tür seçilince önizleme yer tutucudan uygulamaya geçmiyordu: yalnız içerik tazeleniyor, alanın kendisi kalıyordu. Artık seçim yapılınca önizleme anında canlanıyor.

## v0.47.1
- Modül kurulduktan sonra "ONIZLEME_ALAN is not defined" hatası çıkıyordu — eski değişken adı iki yerde kalmış, düzeltildi.

## v0.47.0
- **Sütun setlerinin içeriği artık tutuluyor.** "320 Tedarikçiler → Fatura, Fatura No", "108 Çekler → Valör Tarihi, Çözülme Durumu" — her yerin kendi ek sütunları yazılıyor, prompta da öyle giriyor. Eskiden sadece yerin adı kalıyordu.
- **Beklenen kayıt sayısı** soruluyor (az · orta · çok). Sayfalama, arama ve listenin nasıl çizileceği buna bağlıydı, hiçbir yere yazılmıyordu.
- **"Aynı kaydı başka sayfa da yazıyor mu?"** soruluyor. Fiş girişi ile hareketler aynı kaydı tutuyorsa AI iki ayrı tablo kurmuyor: tek tablo, iki görünüm.
- Önizlemede sağ sütun seçimi düzeldi — "Tarih | Tarih" gibi iki aynı sütun çıkmıyor.

## v0.46.3
- Çözümleme yapıştırıldıktan sonra anlat ekranında kalınıyordu; artık ağaca dönüp sonucu gösteriyor.

## v0.46.2
- Ağaç artık yerinden oynamıyor: sütunlar ekran boyunda sabit, içerik uzayınca sütun kendi içinde kayıyor. Kalıp ekleyip çıkardıkça bütün ağacın zıplaması bitti.
- Kalıp adımında tür "Detay" ya da "Form" olsa bile yapıyı gösteren liste çiziliyor — kalıbın ne yaptığı ancak orada görünüyor.

## v0.46.1
- Kalıp adımında alanlar girilmemişken de önizleme çiziliyor: kalıba basınca ne değiştiğini görmen gerekiyordu. Altında "sütunlar örnek — alanları girince kendi adların gelir" notu var.

## v0.46.0
- **Kalıplar artık önizlemeye yansıyor.** Ağaç liste → satırlar girintili, ana kayıtta açılma oku. Yürüyen bakiye / stok → tabloya "Bakiye" (ya da "Kalan") sütunu. Çok bacaklı kayıt → satırın altında etkilenen hesap çipleri. Ana kayıt + satırları → kaydın altında kalemler. Durum akışı → tablonun üstünde adım şeridi. Bağlama göre sütun → sütun seti sekmeleri. Takvim → tarih başlıkları.
- **Boşken uydurma veri gösterilmiyor.** Tür seçilmeden "önce türü seç", alan girilmeden "alan ekle, her alan bir sütun olur" diyor; önizleme ancak gösterecek gerçek bir şey olunca çiziliyor.

## v0.45.1
- Dal ekranlarındaki önizleme kırpılıyordu: altındaki liste uzayınca kutu eziliyor, ölçek eski boya göre kalıyordu. Kutu artık ezilmiyor ve boyu her değiştiğinde önizleme kendini yeniden sığdırıyor.

## v0.45.0
- Ağaçtaki düğümler artık **oklarla bağlı**: modülden dikey gövde çıkıyor, gövdeden her sayfaya ok gidiyor. Ana düğüm çocuklarının tam hizasında duruyor.
- Üstteki yol izi çip çip oldu — her basamağa dokununca oraya dönüyorsun, bulunduğun yer kendiliğinden görünür oluyor. Yanında tek bir geri düğmesi var.
- Alttaki "Kaldır / Ağaç" düğmeleri kalktı; sayfa kaldırma dal listesinin altına sessiz bir düğme olarak indi, dal ekranında yalnız "Sıradaki" düğmesi kaldı.
- Künye düzenleyicisindeki yönerge yazısı geri geldi (gizli kalmıştı) ve alan adımı boşken ne yapılacağını anlatıyor.

## v0.44.0
- Ağaç tek bir yatay raya döndü: **firma → modül → sayfalar → dallar → düzenleyici**. Bir düğüme dokununca ray yumuşakça sola kayıyor, geldiğin yer solda ince şerit olarak duruyor.
- **Düzenleme de ağacın içinde.** Amaç, Tür, Alanlar gibi dallara basınca ayrı ekrana çıkmıyor: dalın kendi sütunu açılıyor, tepesinde o sayfanın canlı önizlemesi, altında düzenleyici. Alttaki düğme sıradaki dala geçiriyor.
- Dal düğümleri seçim yapıldıkça yerinde güncelleniyor; sayfa yeniden çizilmediği için kaydırma ve ray yerinden oynamıyor.

## v0.43.0
- **Yapıyı kurma artık doğrudan ağaçla açılıyor.** Firma logosundan modüle, modülden sayfalara dallanan tam ekran tuval; modül ve sayfa ekleme ağacın içindeki kesik kutulardan yapılıyor. Ara ekran, adım şeridi yok.
- **Sayfaya dokununca o sayfa kökün yerine geçiyor** ve kendi dalları açılıyor: Amaç · Tür · Kalıp · Alanlar · Eylemler · Roller · Yetki · Kural. Her dalın kendi renk şeridi ve durum noktası var, altında o an ne girildiği yazıyor. Dala dokununca düzenleme ekranı açılıyor, "Bitti" ağaca döndürüyor.
- Düğümler soldan akarak geliyor, eksik olanın noktası yanıp sönüyor, seçili düğüm proje renginde parlıyor. Renkler proje renginden ve durum renklerinden geliyor; kırmızı yalnız "Kur" düğmesinde.
- Kurulu tek modül varsa ağaç onunla açılıyor, sayfaları ve künyeleri geri yükleniyor.

## v0.42.0
- **4 yeni kalıp**: ana kayıt + satırları (fatura + kalemleri) · durum akışı (talep → onay → teslim) · stok hareketi (giren, çıkan, kalan) · takvim ve çakışma (rezervasyon, vardiya). Toplam 8 kalıp.
- **Ekranlar arası geçiş** artık kayboluyor değil: blokta `baglantilar` var, "Hesaplar → Hareketler, alt hesaba dokununca" gibi. Prompta ayrı bölüm olarak giriyor.
- **Hazır veri** (tek düzen hesap planı, ürün listesi) ve **çıktılar** (fiş, fatura, ekstre) soruluyor ve prompta yazılıyor.
- Eylem listesi kapalı değil: "Ters kayıt", "Birleştir" gibi işe özel eylemler yazılabiliyor.
- Anlat/prompt adımı sayfalardan sonraya alındı; prompt artık senin saydığın ekran listesini de içeriyor. Akış: Modül → Sayfalar → Anlat → Kontrol.

## v0.41.0
- **Soruları Claude soruyor.** Çözümleme promptu artık "önce bana soru sor, cevaplarımı bekle, emin olmadan blok verme" diyor. Sohbet Claude'da geçiyor; anlaşınca verdiği tek blok Studio'ya yapıştırılıyor ve her şey doluyor — sayfalar, alanlar, seçenek değerleri, kalıplar ve cevapları, roller, eylem bazlı yetkiler, kurallar.
- Studio artık soru sormuyor, **kontrol ettiriyor**: yapıştırdıktan sonra tek ekranda sayfa listesi çıkıyor, eksik kalan sarı işaretli, üstüne dokununca o sayfanın künyesine girip düzeltiyorsun. Düzeltme bitince listeye dönüyor.
- Akış 4 adıma indi: Modül → Anlat → Sayfalar → Kontrol. Künye adımları yalnız düzeltmek istediğinde açılıyor.
- Sohbette verilen kararlar da saklanıyor ve prompta aynen giriyor.

## v0.40.0
- **Anlat adımı** — modülü seçtikten sonra boş bir kutu çıkıyor: modülde ne olacağını kendi cümlelerinle yazıyorsun. Studio bir çözümleme promptu üretiyor, Claude'a veriyorsun, dönen bloğu yapıştırıyorsun; sayfalar, alanlar, kalıplar ve kurallar kendiliğinden doluyor. Anlatmak istemezsen boş geçilir, elle kurulur.
- **Açık sorular adımı** — çözümlemenin karar veremediği yerler soru olarak geliyor; cevapların prompta aynen giriyor.
- **Kalıplar** — ağaç liste · çok bacaklı kayıt · bağlama göre sütun · yürüyen bakiye. Sayfanın kalıbını seçiyorsun, kalıbın kendi 2-3 sorusu çipten cevaplanıyor; veri modelini anlatmana gerek kalmıyor.
- Önizlemedeki örnek metinler alan adına uyuyor: "İşlem Adı" sütununda kişi adı değil işlem adı yazıyor.
- Prompt kullanıcının kendi anlatımını, verdiği cevapları ve kalıp kararlarını da taşıyor.

## v0.39.0
- Künye tek tek soruluyor: **Amaç → Tür → Alanlar → Eylemler → Roller → Yetki → Kural → Onay**. Her ekranda tek soru, sohbet baloncuğunda niye sorulduğu yazıyor, örnek cevaplar dokunmalık.
- **Önizleme künyeden besleniyor** — sütunlar senin alan adların, hücreler alan türüne göre gerçekçi (para 1.240,00, seçenek kendi değerin, ilişki "Masa 4"), formda alan türü belli (seçenekte ok, tarihte takvim, evet/hayırda anahtar, zorunluda yıldız), seçmediğin eylemin düğmesi çıkmıyor.
- Seçenek alanı değerlerini, ilişki alanı kaynak sayfasını soruyor; her alanda "boş bırakılamaz" anahtarı var.
- **Rol merdiveni**: alt katmanı seçince üstü kendiliğinden geliyor. Ayrıca "kim ne yapabilir" ayrı soruluyor — görmek ayrı, yapmak ayrı.
- Sayfa sonunda **onay kartı**: anladığını düz Türkçe tekrar ediyor, altında kuracağı tabloyu gösteriyor.
- Çipe basınca sayfa başa dönmüyor; kaydırma yeri korunuyor.
- 3. durağa girer girmez akış açılıyor; kurulu modül varsa kart olarak seçiliyor, sayfaları ve künyeleri yükleniyor.
- Prompt künye bölümü genişledi: değerler, zorunluluk, ilişki kaynağı ve eylem bazlı RLS kuralları.

## v0.38.0
- Yapı akışı tek modüle göre yeniden kuruldu: **Modül → Sayfalar → her sayfanın künyesi → Özet + Kur**. Sıra/açılış adımı kalktı, kurulu modüller listeden düşüyor.
- **Sayfa künyesi** — her sayfa için ne işe yaradığı, türü (liste/form/detay/panel/takvim/ayarlar), alanları (ad + tür), eylemleri, kullanan roller ve isteğe bağlı kural. Künye zorunlu: eksikken İleri ve Kur açılmıyor.
- Künye prompta yeni bir bölüm olarak giriyor: alan türleri veritabanı tablosunu, roller RLS kuralını, eylemler düğmeleri belirliyor — AI artık tahmin etmiyor.
- Künye adımında önizleme o sayfanın türüne göre çiziliyor ve tablo sütunlarında kendi alan adların görünüyor.

## v0.37.0
- **Yapıyı kurma durağı adım adım akışa döndü** — tasarım durağının aynısı: nokta şeridi, canlı önizleme, altta Geri/İleri. Modüller (sektörün önerdikleri işaretli) → her modülün sayfaları ayrı ekranda → sıra ve açılış → özet ve tek "Kur" düğmesi. Önizlemede menü gerçek modül adlarını, sayfa adımında gerçek sayfa adlarını gösteriyor. Taslak bellekte durur, yarıda bırakmak hiçbir şeyi bozmaz.
- "Modül Ekle" düğmesi duruyor; kurulu projede "Adım adım kur" ile akış yeniden açılıyor.
- Önizleme ölçeği yanlış hesaplanıyordu: ölçüm dönüşümün kendisinden etkilendiği için her adımda biraz daha küçülüyor, uygulamanın üst çubuğu ve alt sekmesi kırpılıyordu. Artık yerleşim boyu ölçülüyor.

## v0.36.2
- "n yeni" çipiyle atlanan karardan sonra İleri düğmesi artık akışı baştan takip ettirmiyor: varsa sıradaki yeni karara, yoksa doğrudan özete götürüyor. Geri'ye ya da nokta şeridine dokununca normal akışa dönülür.

## v0.36.1
- Dolu zemin, buzlu cam ve çizgiyle ayrık hem kartlarda hem önizlemede birbirinin aynısı gözüküyordu: dolu artık tam yüzey renginde gölgeli bant, camda içerik çubuğun altından geçerken renkli görünüyor, çizgide zemin yok yalnız belirgin ayrım çizgisi var.

## v0.36.0
- Sonradan eklenen tasarım kararları artık kayboluyor değil: proje duraklarında "1 yeni" rozeti, akış şeridinde "n yeni" çipi (dokununca o adıma atlar), adım başlığında YENİ etiketi. Seçim yapılınca ya da YENİ'ye dokununca söner. Yeni açılan projelerde çıkmaz.
- Kısa ekranlarda (664px ve altı) akış tek ekrana sığmıyordu: seçenek kartının adı kesiliyor, Geri/İleri satırı alt çubuğun altına giriyordu. Kartlar küçüldü, önizleme daha çok ölçekleniyor.

## v0.35.0
- Yeni tasarım kararı: **Çubuk ve panel dokusu** — dolu zemin · buzlu cam · çizgiyle ayrık · yüzen hap · koyu kontrast. Üst çubuk, alt sekme, yan menü ve sayfa panelinin hepsine iner. Kararlar 49, akış 51 adım.
- Teknik standarda sabit kural: masaüstünde alt sekme çubuğu yok, 900px üstünde gezinme solda panele döner.

## v0.34.2
- Palet adımında Geri/İleri satırı ekranın dışına taşıyordu, basılamıyordu — gövde artık kendi içinde kayıyor, düğmeler sabit.
- Başlangıç adımındaki logo ve palet kartları küçültüldü.

## v0.34.1 — 22 Ağustos 2026
**Yapıştırma penceresinde 48 "okunamadı" satırı kalktı**

Prompt artık arayüz kararlarını istemiyor ama pencere hâlâ 48 kararı
listeleyip hepsine "okunamadı" yazıyordu — hata gibi görünüyordu.

Artık yalnız istenen 15 palet satırı listeleniyor. Cevapta arayüz kararı da
varsa o da görünür; yoksa hiç yazılmaz.

## v0.34.0 — 22 Ağustos 2026
**Prompt yalnız paleti üretiyor, kararlar bizde**

Prompt 23.600 karakterden **2.900 karaktere** indi. Artık sadece renk, yazı
tipi, simge seti ve marka karakteri istiyor. 48 arayüz kararını Claude
değil, biz veriyoruz — akıştaki 49 adımda tek tek.

Promptta kalanlar: logo kontrolü, sekiz aşamalı düşünme sırası (zeminler →
metin tonları → vurgu → durum renkleri → yazı tipleri → kontrast denetimi),
açık tema kuralı, 4.5:1 kontrast şartı, Google Fonts şartı, örneksiz şablon.

Çıkanlar: 48 başlığın tarifi, yasak çiftler listesi, uzun bağlam.

**Çelişki denetimi Özet adımına taşındı.** Kararlar artık elle verildiği
için çelişkiyi orada yakalıyoruz. Uyarı satırına dokununca doğrudan o adıma
gidiyor. Kontrast da orada denetleniyor — paleti elle düzenlemiş olabilirsin.
Sorun yoksa "Çelişen karar yok, kontrastlar yeterli" yazıyor.

## v0.33.2 — 22 Ağustos 2026
**İki düzeltme**

- **Logo satırı sola hizalandı.** `.mk-logo` eski büyük sürümden kalan
  `margin-left: auto` yüzünden sağa itiliyor, satır ortada duruyordu.
- **Palet kutusu görünmüyordu.** Projede tasarım kararı varsa palet nesnesi
  dolu sayılıyor, rengi olmasa da "palet var" gibi davranıyordu; ne şerit ne
  de açıklama kutusu çıkıyordu. Artık renk var mı diye bakılıyor.

## v0.33.1 — 22 Ağustos 2026
**Terminoloji kalktı, kayıt numarası standart oldu**

Terminoloji sorusu tamamen kaldırıldı.

Kayıt numarası artık projeye özel değil, Nizam standardı:
**HARF-SIRA** — kaydın türünü gösteren kısa harf, tire, sıra numarası.
F-1042 (fatura), S-1001 (sipariş). Sayaç 1'den başlar, yıl başında
sıfırlanmaz, boşluk bırakmaz.

Sorulan teknik alan ikiye indi: **Roller** ve **Alan adı**.

## v0.33.0 — 22 Ağustos 2026
**Roller katmanlı oldu**

Virgüllü liste kalktı. Roller artık merdiven: **2, 3, 4 ya da 5 katman**
seçiliyor, her katmanın adı ayrı satırda, en altta en dar yetki en üstte
en geniş.

Örnek dört katman: Personel · Amir · Yönetici · İşveren.

Katman sayısını değiştirince yazdığın adlar korunuyor; eklenen satırlar
kullanılmamış örnek adlarla doluyor. Elle hiç dokunmadıysan doğrudan yeni
örneğe geçiyor.

Sıra önemli çünkü kod bunu kullanıyor: prompta "üstteki katman, alttakinin
gördüğü her şeyi görür" ve "yetki veritabanı kurallarıyla uygulanır, yalnız
arayüzde gizlemekle değil" diye giriyor.

Merdiven hem sihirbazın 4. adımında hem Firma bilgileri → Teknik'te.

## v0.32.1 — 22 Ağustos 2026
**Dört düzeltme**

- **Sihirbazdan dil ve para seçimi kalktı** — ikisi de standart (Türkçe, ₺ TRY).
  Yerine **Roller** alanı geldi; adım artık "Roller ve takvim".
- **"Yapıyı kurma" sayfası olmayan modülle tamamlanmış sayılmıyor.**
  1 modül · 0 sayfa artık "şimdi burada" diyor.
- **Tasarım akışı Palet'ten başlıyor.** Tema adımı (sabit açık) ve Logo adımı
  kalktı — logo zaten sihirbazda alınıyor. Logo satırı Palet adımının içinde,
  değiştirmek için dokunuluyor. 50 adım.
- **Palet şeridinde gelmemiş renkler** gri kutu yerine kesik desenli boş kutu.
  Dört yeni renk (vurgu koyu, başarı, uyarı, tehlike) eski projelerde yok.

Ayrıca "Tüm tasarımı sıfırla" Özet adımına taşındı; ilk adımda önizlemeye
yer bırakmıyordu.

## v0.32.0 — 22 Ağustos 2026
**Teknik standart yazıldı**

AI'ın her projede yeniden karar verdiği teknik konular artık sabit ve
yazılı. Prompta ve NIZAM.md'ye olduğu gibi giriyor: "Tartışma, değiştirme,
alternatif önerme — gerekiyorsa önce sor."

**Nizam standardı (18 madde):** Vanilla JS · derlemesiz · ekran başına ayrı
dosya (tek dosyada 1500 satır sınırı) · GitHub Pages · PWA · Supabase ·
**gerçek zamanlı her zaman açık** · **çevrimdışı her zaman çalışır** ·
**değişiklik kaydı her zaman tutulur** · özel dosya saklama · e-posta+şifre
girişi · yalnız Supabase istemcisi · ₺ TRY (12.400,00) · 22.05.2025 · 14:30 ·
YIL.SAYAÇ sürüm · Türkçe · 44px ve 4.5:1.

Çevrimdışı ve gerçek zamanlı birlikte en zor iş. Kapsam açıkça yazıldı:
okuma yerelden, yazma kuyrukta, çakışırsa son yazan kazanır ve kullanıcıya
söylenir. Belirsiz bırakılırsa veri sessizce kaybolur.

**Projeye özel dört alan** Firma bilgileri durağına eklendi: Roller ·
Terminoloji · Kayıt numarası · Alan adı. Belirlenmemişse prompt "uydurma,
sor" diyor. Veritabanı değişikliği yok — projenin mevcut alanında saklanıyor.

## v0.31.0 — 22 Ağustos 2026
**Müşteri uygulamaları hep açık tema**

Koyu-açık seçimi kalktı. Bütün projelerimiz açık tema; sorulacak bir şey
yok, karar zaten verilmiş.

- **Tema adımı** "Başlangıç" oldu: açık temayı açıklıyor ve "Tüm tasarımı
  sıfırla" düğmesini taşıyor.
- **"Tema değiştirme" kararı kalktı** — tek tema varken anlamsızdı.
- **İkinci tema bloğu kalktı.** Prompt artık ikinci palet istemiyor,
  Studio da eksik diye uyarmıyor.
- Palet örnekleri ve önizleme varsayılanları açık temaya çevrildi.
- Prompt tek satırla açık: "Koyu tema üretme, sorma da."

48 karar, 52 adım.

Studio'nun kendi teması koyu kalıyor — o ayrı.

## v0.30.1 — 22 Ağustos 2026
**Kodlama beş aşamaya bölündü**

NIZAM.md'ye "Nasıl kodlanacak — beş aşama" bölümü girdi. AI hepsini bir
seferde yazmıyor; her aşamanın sonunda durup kullanıcıdan denemesini
istiyor, onay gelmeden devam etmiyor.

1. **İskelet ve tema** — değişkenler, kabuk, açılış, giriş, boş sayfalar.
   *Test: giriş yapılıyor mu, her sayfaya gidiliyor mu, renkler doğru mu.*
2. **Veri ve ana ekranlar** — tablolar, panel, bir tam liste ekranı.
   *Test: veri geliyor mu, arama ve filtre çalışıyor mu.*
3. **Kayıt işlemleri** — ekleme, düzenleme, detay, silme, kalan listeler.
   *Test: yanlış veri girince ne oluyor, sildiğini geri alabiliyor musun.*
4. **Uç durumlar ve ayarlar** — boş, yükleme, hata, bildirim, yetkiler.
   *Test: interneti kes, ne oluyor.*
5. **Hareket ve cila** — animasyon, güncelleme, erişilebilirlik, performans.
   *Test: eski telefonda akıcı mı.*

Görev promptunda beş aşama yok — orada yalnız kısa uygulama sırası var.
Tek bir görev için beş aşamalık plan gürültü olurdu.

## v0.30.0 — 22 Ağustos 2026
**Prompt sağlamlaştırıldı, yapıştırma denetleniyor**

Prompt baştan yazıldı. En büyük sorun cevap kalıbının örnek değerlerle dolu
olmasıydı — model logoya bakmadan kopyalayabiliyordu. Artık kalıpta
`#______` ve `___` var, hiçbir gerçek değer yok.

**Prompta eklenenler**
- **Aşamalı çalışma talimatı**: logoyu oku → paleti kur → durum renkleri →
  yazı tipleri → arayüz kararları → çelişki denetimi → kontrast denetimi →
  cevap. Sekiz aşama, sırayla.
- **"Logo ekli değilse dur"** — uydurma, söyle ve bekle.
- **Bağlam**: sektör, platform, veritabanı, arayüz dili, para birimi.
- **Birlikte olmayacaklar listesi** — 24 yasak çift. "Üst çubuk: Yok +
  Kullanıcı menüsü: Sağ üstte çip" gibi.
- **İkinci tema**: "Tema değiştirme" Sabit değilse öteki temanın 7 rengi de
  isteniyor. Kullanıcı temayı çevirebilecekse iki palet gerekir.
- **Yeni renkler**: Vurgu koyu (üzerine gelince), Başarı, Uyarı, Tehlike.
  Vurgu kırmızıysa "kaydet" ile "sil" karışmasın diye.
- **Simge seti** soruluyor (Lucide, Phosphor, Tabler gibi).
- Yazı tipi Google Fonts şartı, 4px ızgara, 44×44px dokunma hedefi.

**Görev promptu ve NIZAM.md'ye kodlama sırası girdi** — dokuz aşama,
Studio'daki akışın aynısı. AI rastgele değil, sırayla kuracak.

**Yapıştırma artık denetleniyor.** Cevap yapıştırılınca Studio dört şeye
bakıp uyarı gösteriyor:
1. Şablon kopyalanmış mı (renkler örneklerle birebir aynı mı)
2. Kontrast — her metin tonu için WCAG oranı hesaplanıyor, 4.5:1 altı uyarı
3. Çelişen kararlar
4. İkinci tema gerekli ama gelmemiş mi

Uyarılar engel değil; ne olduğunu söylüyor, kaydetmek sende.

**Ad eşleşmesi gevşetildi.** Model `2'li` yerine `2'li` (eğik tırnak) yazsa,
orta noktayı farklı karakterle koysa, başına madde imi eklese de okunuyor.
Eskiden sessizce varsayılana düşüyordu.

## v0.29.0 — 22 Ağustos 2026
**Hareket öbeği, kodlama sırası, belirgin gruplar**

**Yeni öbek: Hareket** — uygulamayı canlandıran katman. Sayfa geçişi ·
Dokunma tepkisi · Seçim vurgusu (seçili olmayan sönsün mü) · Açılma ve
kapanma · Bekleme göstergesi (güncelle düğmesinde dönen halka) · Liste
girişi · Sayı değişimi · Hareket miktarı.

**Sıra kodlama sırasına çevrildi:** ne önce yazılıyorsa o önce soruluyor.
Renk ve bileşen → Uygulama kabuğu → Giriş kapısı → Panel → Liste → Diğer
ekranlar → Uç durumlar → **Hareket** → Sistem. Animasyon en sona geçti,
çünkü kodda da en son cila katmanı.

**Grup başlıkları belirginleşti:** numara rozeti, öbek adı ve tek satır
gerekçesi. İlerleme noktaları öbek öbek ayrıldı — bölüm sınırı görünüyor.

49 karar, 53 adım.

### Düzeltilen önizleme hataları
- "Sonuç ekranı" hiç çizilmiyordu; artık tam sayfa "Kaydedildi" ekranı.
- Sayaç düzeni yalnız bazı dashboard seçeneklerinde işliyordu.
- Genişlik adımında uygulama küçültülüyordu; tam genişlik görünmüyordu.
- "Kaydedildi" bildirimi her ekranda duruyor, içeriği kapatıyordu. Artık
  yalnız kendi adımında çıkıyor — silme şeridi ve kaydırılmış satır da öyle.
- Simge adımında tek simge görünüyordu, üçü birden gösteriliyor.

## v0.28.0 — 22 Ağustos 2026
**42 karar, 46 adım, on öbek**

Kübban Yönetim, YogaTuği Muhasebe ve NIZAM ToDo depolarına bakıldı; o
projelerde var olup Studio'nun hiç sormadığı 15 karar eklendi.

**Yeni kararlar:** Vurgu kartı · Sayaç düzeni · Yol izi · Kullanıcı menüsü ·
Destek ve istek · Dönem seçici · İçe aktarma · Açılış ekranı · Giriş ekranı ·
Sayfa geçişi · Güncelleme · Tema değiştirme · Yedek ve kayıt geçmişi ·
Hata ekranı · İşlem sonucu.

**Akış on öbeğe ayrıldı**, dıştan içe sıralı:

1. Başlangıç · 2. Genel görünüm · 3. Uygulama çatısı · 4. Açılış ve geçiş ·
5. Panel ekranı · 6. Liste ekranı · 7. Diğer ekranlar · 8. Durumlar ·
9. Sistem · 10. Özet

Önce malzeme (kart, köşe, simge), sonra her ekranda ortak olan çatı, sonra
ekran ekran, en sonda uç durumlar ve sistem işleri. Bir öbek içinde önizleme
ekranı olabildiğince sabit kalıyor.

**Dört yeni önizleme ekranı:** Açılış · Giriş · İçe aktarma · Hata.
42 kararın 42'si de önizlemede görünüyor.

## v0.27.1 — 22 Ağustos 2026
**Önizleme çizim düzeltmeleri**

Dashboard grafiği tek bir çapraz şerit olarak çiziliyordu; artık gerçek bir
çizgi grafik: alan dolgusu, ızgara çizgileri, taban çizgisi.

Alt çubuktaki ortadaki düğme boş bir yuvarlaktı — artık artı işareti ve
zemine oturan halkası var.

"Dokulu" kart dokusu açık temada fazla belirgindi, inceltildi. Bildirim
kartının gölgesi güçlendirildi; içeriğin üstünde durduğu belli oluyor.

## v0.27.0 — 22 Ağustos 2026
**27 kararın hepsi önizlemede görünüyor**

Eskiden bazı kararların önizlemede karşılığı yoktu: arama yalnız "Üstte
sabit" seçilince görünüyordu, filtre panelleri hiç çizilmiyordu, sayfa
listesi ve detay ekranının önizlemesi yoktu.

Eklenenler: açılmış arama çubuğu · inen filtre paneli · alttan yarım sayfa ·
**Sayfa listesi** ekranı (yan liste, üst sekme, açılır seçici, kart
ızgarası) · **Detay** ekranı (sekmeli, tek akış, sol özet, katlanır) ·
yarı kaydırılmış silme satırı · silme onay penceresi · açılmış aç-kapa
satırı · üst çubukta ve alt çubukta ana eylem düğmesi.

**Yoğunluk** artık liste ve formu aynı karede gösteriyor — "Karma" ancak
böyle anlaşılıyor.

**Düğme kararları** form ekranına taşındı; panel ekranında düğme yoktu,
seçim değişse de görünmüyordu.

Bir adımda iki örtü çakışırsa (filtre paneli + silme onayı) yalnız o adımın
örtüsü açılıyor.

### Sessiz bir hata düzeldi
İçinde artı geçen seçenek adları — "Sayaç + büyük grafik", "Logo + arama",
"Simge + yazı + düğme", "Alt + orta +" — okunurken parçalanıyor ve hiçbir
seçeneğe uymadığı için sessizce varsayılana düşüyordu. Yani seçtiğiniz şey
ne önizlemeye ne de prompta giriyordu. On seçenek bundan etkileniyordu.

## v0.26.1 — 22 Ağustos 2026
**Karşılaştırma, sıfırlama, kırpılmayan önizleme**

Seçim artık kendiliğinden ilerletmiyor. Seçiyorsun, önizleme değişiyor,
karşılaştırıyorsun; hazır olunca İleri. Karar verdiğin adımda İleri
metalik parlıyor.

İlk adıma **"Tüm tasarımı sıfırla"** geldi: 27 kararı birden varsayılana
döndürür. Palet, logo ve temaya dokunmaz. Onay sorar.

Önizlemedeki büyütme düğmesi kalktı — ekran zaten adıma göre değiştiği
için gereksizdi. Önizleme **kırpılmıyor**: sığmıyorsa uygulama küçülerek
tamamı görünüyor.

Kararlar paneli ekran ekran gruplandı.

## v0.26.0 — 22 Ağustos 2026
**Bir ekranda tek karar, kaydırma yok**

Tasarım akışı 31 ekrana bölündü: her ekranda **tek bir karar**. Üstte adım
çubuğu, ortada önizleme, altta o kararın rafı — üçü ekranı bölüşüyor,
sayfa kaydırılmıyor. Bir seçeneğe dokununca kaydediyor ve kendiliğinden
sonrakine geçiyor. Değiştirmek istemiyorsan "Değiştirmeden geç".

Önizleme artık ekrandan çıkmıyor; hangi kararı veriyorsan onun ekranını
gösteriyor.

**Çoklu seçim üç başlığa indi.** Eskiden altı başlıkta birden fazla
seçilebiliyordu ve birbirini iptal eden seçenekler bir aradaydı (Zebra +
Tam ızgara gibi). Alternatifler ile katmanlar ayrıldı:

- **Kart** (tek) + **Karta ekle** (Şerit vurgu · Işıklı kenar · Dokulu)
- **Tablo satırı** (tek) + **Tabloya ekle** (Gruplu · Rakam hizalı · Vurgulu sütun)
- **Düğme** (tek) + **Düğmeye ekle** (Yazı · İkonlu)

"…ekle" başlıklarında hiçbiri seçilmeyebilir. Kalan 24 başlık tek seçim.

## v0.25.1 — 22 Ağustos 2026
**Kararlar düğmesi**

Adım başlığının yanına "Kararlar" geldi. Basınca verilmiş 24 kararın hepsi
tek listede açılıyor — adımdan çıkmadan. "Ne yapmıştım ya" diye geri gidip
bakmak gerekmiyor.

Bir satıra dokunursan o adıma gidiyor. Geri gitmek yine serbest; sadece
artık hatırlamak için gitmek gerekmiyor.

## v0.25.0 — 22 Ağustos 2026
**Tasarım durağı akışa döndü: 15 adım**

Kararlar artık başlık türüne göre değil, **etkilediği ekrana göre**
gruplanıyor. Bir seçim yapıp "bu neyi değiştirdi?" diye başka sayfada
aramak yok: her adımda önizleme **o adımın ekranını** gösteriyor.

Sıra: Tema → Logo → Palet → Genel iskelet → Yüzey → Panel ekranı →
Tablolu sayfa → Telefonda tablo → Veri girişi → Detay ekranı → Ayarlar →
Boş durum → Yükleme → Bildirim ve silme → Özet.

Kabadan inceye: önce her ekranda ortak olan çatı, sonra ekran ekran.
Bu sırayla gidince geri dönme ihtiyacı doğmuyor.

Üstte ilerleme şeridi (Adım 7 / 15), altta Geri ve bir sonraki adımın adını
yazan İleri düğmesi. Şeritteki noktalardan istediğin adıma atlayabilirsin.
Kaldığın adım hatırlanıyor.

"Telefonda tablo" adımında önizleme kendiliğinden telefon kipine geçiyor —
o kararın anlamı ancak orada görünür.

Son adım **Özet**: 24 kararın hepsi tek listede, palet ve yazı tipleriyle
birlikte. Prompta yazılacak olan tam olarak bu.

Üç sekme (Biçim · Yerleşim · Durumlar) kalktı; adımlar onların yerini aldı.
Prompt ve NIZAM.md'de öbek sırası kabadan inceye değişti:
Yerleşim → Biçim → Durumlar.

## v0.24.0 — 22 Ağustos 2026
**Tasarım kararları 7'den 24'e çıktı: Biçim · Yerleşim · Durumlar**

Şimdiye kadarki yedi karar **yüzey** kararıydı — bir kutunun nasıl
göründüğü. İki öbek daha eklendi:

**Yerleşim (12)** — ekranın iskeleti. Üst çubuk · Gezinme · Sayfa listesi ·
Tablolu sayfa · Dashboard · Veri girişi · Ayarlar · Detay ekranı · Ana
eylem yeri · Arama · Filtre · Genişlik.

**Durumlar (5)** — ekran doluyken değil, boşken ve beklerken. Boş durum ·
Yükleme · Bildirim · Onay & silme · Liste sonu. En çok atlanan yer burası.

Tasarım durağının başına üç sekme geldi. Toplam **118 seçenek**; yerleşim
ve durum seçenekleri kutu değil **tel çizim** — ekranın planı, yüzey
çizimleriyle karışmasın diye ayrı bir dil.

**Önizlemeye altı ekran girdi:** Panel · Liste · Form · Ayarlar · Boş ·
Yükleme. Yerleşim kararları ancak farklı ekranlarda görünür hâle geliyor.
Panel'de dashboard yerleşimini, Liste'de filtre/arama/sayfalama/ana eylem
yerini, Form'da veri giriş biçimini, Ayarlar'da ayar düzenini görüyorsun.
Üst çubuk, gezinme ve genişlik hepsinde ortak.

Marka promptu 24 kararı birden soruyor ve seçimini iki şeye dayandırıyor:
logodan gelen marka karakteri, projeden gelen sektör ve platform. Görev
promptu ile NIZAM.md üç başlık altında yazıyor.

## v0.23.2 — 22 Ağustos 2026
**Önizleme tam ekran değil, yukarıdan inen panel**

Önizleme artık ekranı kaplamıyor: yukarıdan kayarak iniyor ve **altta en az
bir seçim rafı açıkta kalıyor**. Panel açıkken o rafa dokunabiliyorsun —
seçim değişince önizleme aynı anda yeniden çiziliyor. Aç, dene, kapat
döngüsü bitti.

Açılırken sayfa kendiliğinden kayıp altta kalan şeride bir raf getiriyor;
panelin altında boş ekran kalmıyor.

Alt kenarında küçük bir tutamaç var — aşağıda iş yapılabildiği belli olsun
diye. Esc ya da çarpı kapatıyor.

## v0.23.1 — 22 Ağustos 2026
**Her rafın başında Sıfırla**

Yedi başlığın her birinin ilk kartı artık **Sıfırla**. O başlığı varsayılan
hâline döndürüyor — Kart'ı Yükseltilmiş'e, Köşe'yi Yuvarlak'a, Tablo'yu
Zebra'ya. Çoklu başlıklarda ne kadar seçim yapmış olursan ol tek kartta
toparlanıyor.

Seçenek değil eylem olduğu için görünümü de farklı: kesik çerçeve, tik
rozeti yok. Zaten varsayılandaysan sönük duruyor ve tıklanmıyor — boşa
dokunma olmuyor.

## v0.23.0 — 22 Ağustos 2026
**Önizleme düğme oldu, tema kilitlendi**

Önizleme artık sayfanın ortasında duran büyük bir blok değil. Hero'nun
hemen altında **yapışkan bir düğme** var: nereye kaydırırsan kaydır tepede
kalıyor. Basınca önizleme tam ekran açılıyor, kapatınca kaldığın yere
dönüyorsun. Rafların ortasındayken her seferinde yukarı çıkma derdi bitti.

Tam ekranda Web / Telefon geçişi duruyor; Esc ya da çarpı kapatıyor.

**Tema artık palet geldikten sonra değiştirilemiyor.** Palet o temaya göre
üretiliyor — sonradan Koyu'dan Açık'a çevirmek renkleri değiştirmediği için
boşa bir açıp kapama oluyordu. Değiştirmek isteyen logoyu tekrar yükleyip
yeni palet alıyor. Kilitliyken nedeni de yazıyor.

**Tema yukarı taşındı.** Artık sayfanın ilk kararı: Tema → Logo → Palet →
Karakter → biçim rafları. Sıra doğru olunca geri dönüp değiştirme ihtiyacı
zaten kalmıyor.

## v0.22.0 — 22 Ağustos 2026
**Seçimlerin nasıl duracağını uygulamanın içinden görüyorsun**

Tasarımı belirleme durağına, seçim raflarının hemen üstüne bir **önizleme**
girdi: sahte bir müşteri uygulaması. Projenin kendi paleti, kendi logosu ve
yedi biçim kararıyla çiziliyor. Aşağıda bir seçeneğe dokunduğun anda —
kaydı beklemeden — yeniden çiziliyor.

**Web / Telefon geçişi** var. "Karta dönüş", "İki satır", "Yana kaydır"
gibi kararlar ancak telefon kipinde görünür hâle geliyor.

**Örnek veriler sektöre göre.** Restoranda "Masa 4 · Ali Demir", inşaatta
"Bahçelievler · Hakediş No 12", otelde oda, klinikte randevu. Boş kutulara
bakıp hayal etmek zor oluyordu.

Durağan görüntüde anlaşılmayan davranış kararları için altta tek satır
ipucu çıkıyor: "Satıra dokununca kalan sütunlar altında açılır" gibi.

Önizlemenin içine Studio'nun kendi renkleri sızmıyor — gösterdiğimiz şey
müşterinin uygulaması, arka plan bilerek dama deseni.

Ayrıca: tablo ızgara çizgisi satır boyunca uzuyor, kartlı satır kipinde
başlık zemini kalkıyor.

## v0.21.0 — 22 Ağustos 2026
**Biçimler karışabiliyor, tarz sayısı 26'dan 50'ye çıktı**

**Dört başlıkta birden fazla seçenek işaretlenebiliyor** — Kart, Tablo,
Düğme ve Simge. Seçtiklerin birbirini iptal etmiyor, birleşiyor:
"Buzlu cam + Şerit vurgu" camlı bir kart demek, kenarında vurgu şeridiyle.
Başlığın yanında küçük bir rozet hangilerinin karışabildiğini söylüyor.
En az bir seçenek hep açık kalıyor; boş bir başlık AI'ı tahmine iter.

Köşe, Yoğunluk ve Tablo·telefonda tek seçim kaldı — bir kutunun tek bir
köşe yarıçapı, bir satırın tek bir yüksekliği olur.

**Yirmi dört yeni tarz.** Hepsi birbirinden ayrı, aynı şeyin ince ayarı değil:

- **Kart** +4 — Oyulmuş (zemine gömülü) · Işıklı kenar · Degrade · Dokulu
- **Köşe** +3 — Kesik (pahlı) · Yaprak (çapraz) · Kaş (üstü yuvarlak)
- **Yoğunluk** +3 — Karma · Nefesli · Kart dizisi
- **Tablo** +4 — Kartlı satır · Gruplu · Rakam hizalı · Vurgulu sütun
- **Tablo telefonda** +3 — Aç-kapa satır · İki satır · Tam ekran
- **Düğme** +4 — Gölgeli · Degrade · Yazı · İkonlu
- **Simge** +3 — Kalın çizgi · Zeminli · Elle çizim

Marka promptu hangi başlıkta karışım yapılabileceğini söylüyor ve cevabı
artı işaretiyle istiyor. Yapıştırma penceresi `Kart: Buzlu cam + Şerit
vurgu` ve `Tablo: Zebra, Rakam hizalı` biçimlerinin ikisini de okuyor.

Görev promptunda karışımlar tek satırda toplanıp altına her parçanın
tarifi yazılıyor.

## v0.20.0 — 22 Ağustos 2026
**Tasarım artık renkten ibaret değil**

"Tasarımı belirleme" durağına **yedi yeni karar** eklendi: Kart · Köşe ·
Yoğunluk · Tablo · Tablo telefonda · Düğme · Simge. Eskiden bunları AI
tahmin ediyordu; artık projenin kararı olarak yazılı duruyor.

**Seçim yazıyla değil, görselle.** Her başlığın altında yana kayan bir raf
var; rafta gerçek küçük çizimler duruyor. Zebra tabloya bakınca zebra
çizgili tablo görünüyor, yuvarlak köşeye bakınca yuvarlak kutu. Seçilenin
kenarı metalik parlıyor, köşesine tik geliyor.

**Renkler projenin kendi renkleri.** "Şerit vurgu" örneğindeki şerit ve
düğme örneklerindeki dolgu, o projenin vurgu renginden geliyor.

**Marka promptu bunları da soruyor.** Logoyu Claude'a verdiğinde palet ile
birlikte yedi biçim kararını da döndürüyor; yapıştırınca seçimler
kendiliğinden işaretleniyor. Beğenmediğin her biri tek dokunuşla değişir.

**Görev promptu ve NIZAM.md'ye "Arayüz Biçimi" bölümü girdi.** Her karar
tarifiyle yazılıyor — "Zebra: tek sıradaki satırlar hafif açık zeminli"
gibi. AI ne yapacağını okuyor, uydurmuyor.

Yan fayda: **aynı ekran yeniden çizilirken sayfa artık tepeye fırlamıyor.**
Yarıda bir seçim yaparken bulunduğun yerde kalıyorsun.

Veritabanı değişikliği yok — biçim kararları projenin mevcut palet
alanında saklanıyor.

## v0.19.0 — 22 Ağustos 2026
**Her durak kendi sayfası oldu**

Duraklar açılıp kapanan kutular değil; her biri kendi sayfası.
Adres de öyle: `#/projeler/<proje>/firma`. Geri düğmesi bir adım geri
götürüyor — duraktan projeye, projeden listeye.

**Sayfaların tepesinde hero var:** logo büyük, arkasında **projenin kendi
rengi** zemine vuruyor. Altında sektör ve platform rozetleri, köşede durak
numarası.

**Düz form yok, tasarlanmış bölümler var:**

- **Yetkili kişi bir kartvizit.** Baş harfler, ad, iletişim; altında
  **Ara · Mail · Kopyala** düğmeleri. Numarayı okuyup elle tuşlamıyorsun
- **Takvim bir çubuk.** "100 gün kaldı", "%1 geçti" ve bugünün nerede
  olduğunu gösteren nokta. Gecikmişse kırmızı yazıyor
- **Platform ve veritabanı** kendi simgeleriyle iki kutu
- **Palet tam genişlik şerit**, altında renk kodları. Yazı tipleri kendi
  karakterleriyle yazılı
- **Boş alanlar boş satır bırakmıyor:** kesik çerçeveli bir kutu ne
  eksik olduğunu ve neden gerektiğini söylüyor

Beş sayfa: Firma bilgileri · Tasarımı belirleme · Yapıyı kurma ·
Geliştirme · Sürüm.

## v0.18.1 — 21 Ağustos 2026
**Firma bilgileri sonradan düzenlenebiliyor**

SQL çalıştırılmadan önce kurulan projelerde sihirbazda girilen sektör,
yetkili kişi ve tarih bilgileri kaydedilememişti — o sütunlar henüz yoktu.
O projeleri silip yeniden kurmaya gerek yok.

- 1. durakta **Bilgileri düzenle** düğmesi var
- Sektör, yetkili kişi, telefon, e-posta, dil, para birimi, başlangıç ve
  teslim tarihi buradan girilir
- Yalnız eski projeler için değil: yetkili kişi ayrılır, teslim tarihi kayar —
  bunlar zaten değişen bilgiler

## v0.18.0 — 21 Ağustos 2026
**Açılış hızlandı, veri telefonda saklanıyor**

**1 · Açılış çubuğu artık gerçekten bekliyor.** Eskiden animasyon oynuyor,
bitince veri inmeye başlıyordu — o süre boşa gidiyordu. Şimdi veri animasyon
sürerken iniyor. Bağlantı kötüyse üç saniyede bırakıyor, kalanı uygulama
açıkken tamamlanıyor.

**2 · Projeler ve sayılar telefonda saklanıyor.** İkinci açılıştan itibaren
ekran anında doluyor; taze veri arkadan gelip yerine geçiyor.

Ne saklanıyor: proje adı, renk, platform, palet, ilerleme sayıları.
**Ne saklanmıyor:** yetkili kişi adı, telefonu, e-postası, görev başlıkları,
notlar. Telefon başkasının eline geçse müşteri verisi orada durmuyor.
Kayıt 313 bayt — ölçtüm.

**3 · Başkası bir şey değiştirince yalnızca o tablo yenileniyor.** Canlı
bağlantı hangi tablonun değiştiğini söylüyor; aynı anda gelen değişiklikler
birleştirilip tek seferde tazeleniyor. Görev güncellemesi artık on tablo
değil, iki tablo çekiyor.

**4 · Uygulamaya geri dönünce sessiz tazeleme.** Telefon uygulamayı arka
planda dondurunca canlı bağlantı kopuyor ve aradaki değişiklikler kaçıyordu.
En fazla dakikada bir çalışıyor.

**5 · Çıkışta saklanan veri siliniyor.**

## v0.17.4 — 21 Ağustos 2026
**Proje kalıcı olarak silinebiliyor**

Deneme için açtığın projeler arşivde birikiyordu. Artık proje menüsünde
arşivin altında **Projeyi sil** var.

- Modülleri, sayfaları, görevleri ve hareket geçmişi birlikte gidiyor
- **Logo dosyası da kovadan siliniyor** — yetim dosya kalmıyor
- Onay ekranı ne kaybedileceğini sayıyla yazıyor: "1 modül, 1 sayfa, 1 görev"
  ve arşiv seçeneğini hatırlatıyor
- Logo silinemezse proje yine siliniyor; yarım kalmış bir silme olmuyor

Arşiv duruyor — veriyi korumak istediğinde o, tamamen kurtulmak istediğinde
silme.

## v0.17.3 — 21 Ağustos 2026
**"Veri yüklenemedi" hatası düzeltildi**

v0.17.2'de hareket tablosunun sütun adlarını yanlış yazdım: gerçekte `tip`
ve `kim`, ben `tur` ve `kisi` yazmışım. O sorgu patlayınca bütün veri
yüklenemiyordu.

- Hareket ve kişi sorguları artık sütun adı saymıyor; sonradan eklenen bir
  alan olmadığında sorgu patlamıyor
- **Hata mesajı hangi tablodan geldiğini yazıyor.** Önceki mesaj her durumda
  "sql/03-projeler.sql çalıştır" diyordu; sebep başkayken yanlış yere bakılıyordu

## v0.17.2 — 21 Ağustos 2026
**Veri katmanı baştan yazıldı — çok daha hızlı**

Ağırlığın sebebi buydu: **tek bir satır değişince on tablo birden çekiliyordu.**
Görev durumunu değiştirmek, palet kaydetmek, ad düzeltmek — hepsi bütün
veritabanını yeniden indiriyordu. Kodda 25 yerde böyleydi.

**Artık yalnızca ilgili tablo tazeleniyor.**

| İşlem | Önce | Şimdi |
|---|---|---|
| Görev durumu değiştir | 12 sorgu | **4** |
| Palet kaydet | 11 sorgu | **2** |
| Aynı anda üç yenileme | 30 sorgu | **10** |

**Dört ayrı iyileştirme:**

**1 · Tablo başına okuyucu.** Her tablonun tek bir okuma tanımı var; hangi
tabloların tazeleneceği işlem başına belirtiliyor.

**2 · Hareket geçmişi sınırlandı.** `task_events` sınırsız büyüyor ve tamamı
çekiliyordu. Artık son 400 olay geliyor — ekranda zaten o kadarı gösteriliyor.

**3 · Çakışan yüklemeler birleşti.** Canlı bağlantı ile kendi işlemin aynı ana
denk gelince iki tur dönüyordu. Aynı anda gelen istekler tek isteğe iniyor.

**4 · Logo adresleri önbelleğe alındı.** İmzalı adres bir saat geçerli; her
yazma işleminden sonra yeniden üretiliyordu. Liste değişmediyse ve adres
tazeyse dokunulmuyor. 45 dakikayı geçince kendiliğinden yenileniyor —
uygulamayı uzun süre açık bırakınca logoların kaybolması da böylece bitti.

Ayrıca yarım saatte bir sessiz yenileme kuruldu; uygulama gün boyu açık
kalsa da logolar düşmüyor.

## v0.17.1 — 21 Ağustos 2026
**Profil fotoğrafı logolarla aynı yoldan geçiyor**

Fotoğraf için ayrı bir yol kurmuştum; iyileştirmek isterken yavaşlattım.
Şimdi logolarla **tek mekanizma** kullanıyor: aynı indirme, aynı gösterge,
aynı hata davranışı.

Kaldırılanlar — üçü de yavaşlatıyordu:

- **Tarayıcıda saklanan adres.** Fotoğrafı değiştirdiğinde adres de değişiyor;
  açılışta *eski* adresi indirip boşa harcıyordu
- **Açılışta ekip fotoğraflarının hepsini indirme.** Tarayıcının eşzamanlı
  indirme sırası doluyor, senin kendi fotoğrafın arkada kalıyordu.
  Ekip fotoğrafları zaten Ekip ekranında yükleniyor
- **İkinci bir ön-indirme.** Aynı resim iki yerden isteniyordu

Fotoğraf artık yüklenirken baş harflerin üstünde dönen gösterge duruyor —
logolarda olduğu gibi.

## v0.17.0 — 21 Ağustos 2026
**Yeni proje sihirbazı — tam ekran, altı adım**

Sihirbaz alt sayfadan **tam ekrana** taşındı. Üstte ✕, ortada başlık, sağda
adım sayacı; altında altı parçalı şerit. Düğmeler ekranın dibinde sabit.

| Adım | Ne soruyor |
|---|---|
| 1 · Firma | Ad, **sektör**, logo, renk |
| 2 · Yetkili kişi | **Ad, telefon, e-posta** |
| 3 · Ne yapılacak | Platform + veritabanı (eskiden iki ayrı adımdı) |
| 4 · Dil, para, takvim | **Dil, para birimi, başlangıç, teslim** |
| 5 · Bölümler | Modül seçimi — sektöre göre önden işaretli |
| 6 · Özet | Kurmadan önce son bakış |

**Sektör iş yapıyor.** Restoran seçince Sipariş, Stok ve Cari önden
işaretleniyor ve üstlerinde "önerildi" yazıyor. Sektör listesi düzenlenebilir:
**Ayarlar → Sektörler**, ya da sihirbazın içinden **+ Yeni sektör**.

**Yetkili kişi bilgisi prompta girmiyor.** Ekranda da yazıyor: müşterinin
telefonu Claude'a gitmez, müşteri deposuna yazılmaz.

**Yeni alanlar proje ekranında** 1. durakta görünüyor. Boş olanlar satır
açmıyor.

> SQL çalıştırılmadan da sihirbaz çalışır: olmayan sütunlar sessizce düşürülür,
> proje yine kurulur. `sql/13-sektor.sql` çalıştırılınca alanlar dolmaya başlar.

## v0.16.7 — 21 Ağustos 2026
**Silinen şablonlar geri geliyordu · fotoğraf daha da erken iniyor**

**Silinen şablonlar geri geliyordu.** Liste boşalınca uygulama koddaki hazır
listeye düşüyordu — sildiğin yedi modül bir sonraki açılışta geri geliyordu.
Koddaki liste tümüyle kaldırıldı; şablonlar artık yalnızca veritabanından
gelir. Sildiğin silinmiş kalır, hepsini silersen liste boş durur.

**Profil fotoğrafı açılışın ilk anında iniyor.** Önceki sürümde oturum
okunduktan sonra başlıyordu; oturum okuma ağdan geldiği için indirmeye az
zaman kalıyordu. Artık fotoğrafın adresi tarayıcıda saklanıyor ve **açılışın
49. milisaniyesinde** indirme başlıyor — animasyon daha ilk karesinde.

- Çıkış yapınca saklanan adres siliniyor; başkası girerse önceki kişinin
  fotoğrafını beklemez

## v0.16.6 — 21 Ağustos 2026
**Profil fotoğrafı geç geliyordu**

İki ayrı sorun vardı:

**1 · Baş harfler erken gizleniyordu.** Fotoğraf adresi yazılır yazılmaz
"resim var" işareti konuyordu; resim henüz inmemişken baş harfler kayboluyor,
geriye boş bir daire kalıyordu. Artık resim indikten *sonra* yerine konuyor —
o ana kadar baş harfler duruyor.

**2 · İndirme geç başlıyordu.** Fotoğraf ancak uygulama açıldıktan sonra
indirilmeye başlıyordu. Artık oturum okunur okunmaz başlıyor: açılış
animasyonu sürerken arka planda iniyor.

- Aynı resim ikinci kez indirilmiyor

## v0.16.5 — 21 Ağustos 2026
**Resimler açılışta indiriliyor**

Logo ve fotoğraflar ancak o ekrana girilince indirilmeye başlıyordu; ilk
girişte bir saniye gösterge dönüyordu.

Artık uygulama açılırken hepsi arka planda indiriliyor ve tarayıcının
önbelleğine giriyor: proje logoları, senin fotoğrafın, ekipteki herkesin
fotoğrafı.

- İndirme beklenmiyor — uygulama açılmaya devam ediyor, resimler arkadan geliyor
- Ölçtüm: projeye girince logo **1 saniye yerine 75 milisaniyede** görünüyor
- Gösterge yine duruyor; yalnızca ısınmamış bir resim olursa çıkacak

## v0.16.4 — 21 Ağustos 2026
**Yükleme göstergesi silinmiyordu**

Logo gelince göstergenin arkasına geçiyordu ama gösterge duruyordu —
resmin üstünde dönmeye devam ediyordu.

- Gösterge iş bitince DOM'dan çıkarılıyor. Yalnızca gizlemek yetmiyor;
  gizli bir öğe animasyonu arkada döndürmeye devam eder
- Güvenlik ağı olarak CSS'te de gizlendi
- Hem başarılı yüklemede hem bozuk adreste denendi: ikisinde de gösterge
  geriye kalmıyor

## v0.16.3 — 21 Ağustos 2026
**Yeni uygulama simgesi**

- **N yukarı çekildi ve büyütüldü** — simgenin yarısından fazlasını kaplıyor
- "Studio" kırmızıydı ve zemindeki kırmızı parıltının içinde eriyordu.
  Artık **beyaz**, Archivo 700, harf araları açık — küçük boyutta da okunuyor
- N ile yazı arasında iki ucu sönen ince kırmızı çizgi
- Zemin aynı karbon dokusu; ışıklar N'nin yeni yerine göre kaydırıldı
- **icon-180.png** eklendi: iOS ana ekran simgesi 180 piksel ister,
  192 verilince yeniden ölçekleyip yumuşatıyordu

## v0.16.2 — 21 Ağustos 2026
**Proje durakları açılıp kapanıyor**

Beş durak da tek ekrana sığmıyordu. Artık her durak açılır kapanır.

- Varsayılan: **yalnızca üstünde çalışılan durak açık**. Bitmiş ve
  bekleyen duraklar kapalı
- Başlıkta ok işareti var, açıkken 90 derece dönüyor
- Açtığın durak oturum boyunca açık kalıyor
- İçeriği olmayan durak (henüz görev yok gibi) tıklanabilir görünmüyor

## v0.16.1 — 21 Ağustos 2026
**Projeler açılır bölümlere ayrıldı · logo yüklenirken gösterge**

**Projeler ekranı üç bölüm oldu:**

| Bölüm | Açılışta |
|---|---|
| Üstünde çalışılan | **açık** |
| Başlanmamış | kapalı |
| Tamamlanan | kapalı |

Ayrım yüzdeden geliyor, elle girilmiyor: %0 başlanmamış, %100 tamamlanan,
arası üstünde çalışılan. Boş bölüm hiç görünmüyor. Açıp kapattığın oturum
boyunca hatırlanıyor.

**Logo yüklenirken dönen gösterge.** Logolar private kovada olduğu için
indirmesi bir saniye sürebiliyordu, o sırada kutu boş kalıyordu. Artık resim
önce arka planda indiriliyor, bitince yerine konuyor; arada dönen halka duruyor.

Adres bir saatlik imzalı; süresi dolmuşsa indirme patlıyor ve kırık resim
simgesi yerine kesik çerçeveli baş harf kalıyor.

## v0.16.0 — 21 Ağustos 2026
**Proje ekranı bir yola dönüştü**

Dört istatistik kartı, iki buton, bir marka kartı, sonra modüller — hepsi aynı
ağırlıktaydı, göz nereye bakacağını bilmiyordu. Artık proje **beş duraklı bir
yol**: Firma bilgileri → Tasarımı belirleme → Yapıyı kurma → Geliştirme → Sürüm.

**Üst kısım** — dört kart yerine tek künye: logo, firma adı, platform ve ince
bir ilerleme çubuğu. Rakamlar zaten durakların içinde yazıyor.

**Duraklar numaralı.** Biten yeşil, şimdiki kırmızı ve ışıklı, bekleyen gri.
Aralarındaki çizgi kesikli — yol sürüyor ama zorunlu bir sıra değil.

**Durum veriden okunuyor**, elle girilmiyor:
- Tasarım — palet varsa tamam
- Yapı — modül kurulduysa tamam
- Geliştirme — tüm görevler bittiyse tamam

**Kutular kabartma + şerit vurgu.** Üstten ışık, alttan gölge; sol kenarda
durağın durumunun rengi. Satır ayraçları düz çizgi değil oyuk çizgi —
kabartma yüzeyin hacmiyle uyumlu.

- Kimlik Dosyası ve Depo düğmeleri 1. durağın içine girdi
- Marka kartı 2. durak oldu
- Modüller 3. durağın altında; içeride ilerleme çubuğu gizlendi, adlara yer açıldı
- Görev sayıları 4. durakta
- 5. durak Adım 5'e hazır bekliyor

## v0.15.2 — 21 Ağustos 2026
**Tema seçimi: koyu ya da açık**

Marka promptu her müşteri için "koyu tema" istiyordu. Bu bir varsayımdı ve
yanlıştı — tema müşteriye göre değişir.

- Marka bölümüne **Koyu / Açık** seçimi geldi
- Prompt seçime göre yazılıyor. Açık temada kurallar tersine dönüyor:
  zemin açık, kartlar daha açık (çoğu zaman beyaz), çizgi zeminden koyu,
  metin koyu
- Açık temada vurgu rengi için ayrı uyarı var: **beyaz yazı taşıyacak kadar
  koyu olmalı**, yoksa düğme okunmaz
- Tema palete kaydediliyor; görev promptunda ve NIZAM.md'de yazıyor
- Elle düzenlemede de değiştirilebiliyor
- Her iki temada da en silik metin tonunun 4.5:1 kontrastı geçmesi isteniyor

## v0.15.1 — 21 Ağustos 2026
**Bekleyen SQL'ler tek dosyada toplandı**

`sql/guncelleme.sql` — 08'den 12'ye kadar beş dosya tek yerde, doğru sırada.
Bir kez yapıştırmak yeterli. İki kez çalıştırsan da bozulmaz.

Ayrı dosyalar duruyor; kaynağı görmek isteyen oradan bakar.

## v0.15.0 — 21 Ağustos 2026
**Modül şablonları düzenlenebilir oldu**

Yedi modül (Stok, Cari, Fatura, Personel, Rapor, Sipariş, Üretim) kodda sabitti.
Artık veritabanında; Ayarlar'dan ekleniyor, düzenleniyor, kaldırılıyor.

- **Ayarlar → Kütüphane → Modül Şablonları** — her şablon açılıp sayfaları
  görülüyor; ad ve sayfalar değiştirilebiliyor
- Sihirbaz listeyi artık veritabanından okuyor
- **Modül Ekle penceresi yenilendi:** ad, sayfalar (alt alta) ve
  **"Nizam varsayılanlarına ekle"** kutucuğu. İşaretlersen kütüphaneye de girer
- Ad bilinen bir şablonla eşleşirse sayfalar kendiliğinden doluyor,
  üstünde oynayabiliyorsun

**Kurulmuş projelere dokunulmuyor.** Şablon bir kalıp; ondan kurulan modül
artık projenin malı. Şablonu silmek ya da değiştirmek eski projeleri etkilemez.

Tablo henüz kurulmamışsa uygulama koddaki hazır listeye düşüyor ve ekranda
ne yapılması gerektiğini yazıyor.

> Kurulum: `sql/12-modul-sablon.sql` dosyasını Supabase'de bir kez çalıştır.

## v0.14.0 — 21 Ağustos 2026
**Firma logosu ve renk paleti**

Her projenin artık bir markası var: logo ve ondan türetilmiş renk paleti.

**Logo**
- Proje sihirbazının ilk adımında seçiliyor; proje kurulunca yükleniyor
- Proje ekranındaki Marka bölümünden sonradan da eklenip değiştirilebiliyor
- **Private kovada duruyor.** Adresi bilen bile açamaz; uygulama her oturumda
  giriş yapmış kullanıcıya bir saatlik imzalı adres üretiyor
- Yükleme yalnızca yöneticiye açık, okuma giriş yapmış herkese

**Palet**
- **Prompt kopyala** — Studio bir metin üretiyor; logoyla birlikte Claude'a
  veriyorsun, Claude koyu tema paleti öneriyor
- **Paleti yapıştır** — dönen bloğu yapıştırıyorsun, Studio okuyup kaydediyor.
  Yazmadan önce hangi satırın okunduğunu gösteriyor
- **Elle düzenle** — beğenmediğin rengi renk seçiciden değiştiriyorsun
- Palet on alan: arka plan, yüzey, çizgi, üç metin tonu, vurgu, iki yazı tipi
  ve bir cümlelik ton tarifi

**Palet nereye gidiyor**
- O projenin **her görev promptuna** giriyor — Claude renk tahmin etmiyor
- **NIZAM.md** kimlik dosyasına giriyor

> Kurulum: Supabase → Storage → **logolar** adında kova aç (**Public
> KAPALI**), sonra `sql/11-marka.sql` çalıştır.

## v0.13.1 — 21 Ağustos 2026
**Hesap menüsü üst çubuğun parçası oldu**

Ayrı bir kart olarak açılıyordu, ekranın yarısını kaplıyordu. Artık üst çubuk
aşağı doğru uzuyor; satırlar onun içinde. Kırmızı çizgi de panelin dibine
iniyor, çubuk tek parça görünüyor.

**Neden takılmıyor:** panel içeriği aşağı itmiyor, üstüne biniyor. İtseydi her
karede sayfanın yerleşimi baştan hesaplanırdı. Böyle yalnızca kaydırma, kırpma
ve saydamlık oynuyor — üçü de ekran kartında yapılıyor.

- Açılırken perde yukarıdan aşağı sıyrılıyor, kapanırken geri toplanıyor
- Satırlar arasında ince ayraç var, kart yok
- Eski açılır menünün kuralları tümüyle silindi

## v0.13.0 — 21 Ağustos 2026
**Alt çubuk: yüzen cam hap**

Kabartma simge kutuları kaldırıldı. Modern cam dilinde simge kendi kutusunda
durmaz — kap camın kendisidir. Kutular varken çubuk oyuncak gibi duruyordu.

- Çubuk ekranın dibine yapışmıyor: kenarlardan 14 piksel boşluk bırakıp
  havada duruyor, köşeleri 26 piksel yuvarlak
- Zemin `blur(34px) saturate(190%)` — arkasından içerik geçiyor
- Üst kenarda ışık kırılması, altta gölge, çevrede ince cam kenar
- Aktif sekmenin arkasında **cam kabarcık** beliriyor; yaylanarak geliyor
- Simgeler artık çıplak çizgi, 23 piksel. Aktif olanın çizgisi kırmızı,
  yazısı beyaz
- Uygulama kipinde hap ana ekran çizgisinin üstünde duruyor
- Cam desteklenmeyen tarayıcıda düz zemine düşüyor

Üç katmanlı 3D simge seti ve ona ait gradyanlar tümüyle silindi.

## v0.12.0 — 21 Ağustos 2026
**Ekip yönetimi**

Yönetici artık kullanıcıları uygulamadan açıyor; Supabase'e girmiyor.

- **Ayarlar → Ekip** — tüm kullanıcılar tek listede: fotoğraf, ad, rol, erişim
- **Yeni Kullanıcı** — ad soyad, e-posta, geçici şifre, rol. Şifreyi yönetici
  belirler ve kişiye iletir; kişi girdikten sonra kendi adını ve fotoğrafını
  değiştirebilir
- Kişiye dokununca ad, rol ve erişim düzenlenir
- **Pasif kullanıcı giriş yapamaz.** Kaydı silinmez, yalnızca kapanır

**Güvenlik**

Kullanıcı açmak "service role" anahtarı ister; o anahtar tüm kuralları atlar
ve tarayıcıya konamaz. Bu yüzden iş sunucuda yapılıyor: `kullanici-ekle`
adında bir Edge Function. Fonksiyon önce isteği yapanın gerçekten yönetici
olduğunu doğruluyor, sonra kullanıcıyı açıyor.

Kimse kendi rolünü değiştiremiyor — son yöneticinin kendini geliştirici yapıp
sistemi kilitlemesi engellendi. Bu kural veritabanında, arayüzde değil.

> Kurulum: `sql/10-ekip.sql` çalıştır, sonra Supabase → Edge Functions →
> Deploy a new function → via editor → ad `kullanici-ekle` →
> `supabase/functions/kullanici-ekle/index.ts` içeriğini yapıştır → Deploy.

## v0.11.2 — 21 Ağustos 2026
**Profil fotoğrafı**

- Ayarlar → Hesap → **Fotoğraf** satırından telefondan resim seçilip yükleniyor
- Fotoğraf; karşılama halkasının içinde, üst çubuktaki hapta ve hesap
  menüsünde görünüyor. Yoksa baş harfler kalıyor
- Dosya adı kullanıcının kimliği — kimse başkasının fotoğrafının üstüne yazamaz
- En fazla 4 MB, yalnızca resim. Aşarsa Türkçe uyarı
- Yeni fotoğraf yüklenince adresin sonuna zaman damgası ekleniyor; tarayıcı
  eskisini önbellekten göstermiyor
- Depo hataları Türkçeye çevriliyor (kova yok / izin yok / dosya büyük)

> Kurulum: önce Supabase → Storage → **avatarlar** adında **public** kova aç,
> sonra `sql/09-foto.sql` dosyasını çalıştır.

## v0.11.1 — 21 Ağustos 2026
**Ad kaydolmuyordu**

"Ad güncellendi" yazıyor ama ad değişmiyordu. Sebep: `profiles` tablosunda
yalnızca okuma kuralı vardı, güncelleme kuralı yoktu. Supabase bu durumda
hata vermiyor — sessizce hiçbir satıra dokunmuyor.

- `sql/08-profil-ad.sql` eklendi: kullanıcı kendi adını değiştirebilir
- Rol ve aktiflik uygulamadan değiştirilemez (tetikleyici ile kilitli);
  Supabase panelinden yine değiştirilebiliyor
- Uygulama artık **kaç satır güncellendiğini sayıyor**. Sıfırsa "kaydedildi"
  demiyor, ne yapılması gerektiğini yazıyor

## v0.11.0 — 21 Ağustos 2026
**Panel karşılaması**

Panel dört kart + bir listeden ibaretti; tepesine soluk aldıran bir bölüm geldi.

- **İlerleme halkası** — metal gradyan, ortasında **profil fotoğrafı**,
  alt kenarında yüzde rozeti. Yüzde elle girilmez: bitmiş görev / toplam görev
- **Selamlama** saate göre değişiyor — Günaydın · İyi günler · İyi akşamlar ·
  İyi geceler. Yanında ad soyad
- Altında tarih ve tek satır özet: kaç proje, kaç açık iş
- **Zemin süsü** — üst solda soluk kırmızı hâle, sağda metal hâle,
  sağ altta çok soluk N filigranı. Yalnızca Panel'de görünüyor
- **Ad Soyad artık düzenlenebilir** — Ayarlar → Hesap. Karşılamada ve üst
  çubukta bu ad görünüyor

## v0.10.6 — 21 Ağustos 2026
**Basınca çıkan beyaz çerçeve gitti**

Karta basınca çevresinde keskin beyaz bir çizgi beliriyordu.

Sebep: dokunma kuralında `border-color: inherit` duruyordu. Bu, kartın
çerçevesini üstündeki kutudan miras alıyor; o kutunun çerçeve rengi
tanımlı olmadığı için varsayılana, yani **metin rengine** düşüyordu.
Metin rengi de neredeyse beyaz. Aynı satırdaki `background: inherit` de
kartın altın parıltısını basılıyken siliyordu.

Bu iki satır eski hover yamasından kalmıştı; vurgu kuralları fareye
taşınınca işlevleri kalmamıştı. Silindi — geriye yalnızca hafif küçülme kaldı.

## v0.10.5 — 21 Ağustos 2026
**Yapışkan vurgu bitti**

Dokununca öğeler "fare üzerine gelmiş" gibi renk değiştirip o renkte
kalıyordu. Sebep: dokunmatikte parmak kalkınca tarayıcı `:hover` durumunu
öğenin üzerinde bırakıyor.

Tek tek düzeltmek yerine **stil dosyasındaki bütün vurgu kuralları toplandı**
ve `@media (hover: hover)` içine alındı — yani yalnızca gerçek imleç varsa
çalışıyorlar. Dokunmatik cihaza artık hiç düşmüyorlar.

- 35 vurgu kuralı taşındı; dosyanın sonunda tek bir bölümde toplandı
- Eski "dokunmatikte hover'ı geri al" yaması gereksiz kaldı, silindi
- Dokunma tepkisi (hafif küçülme) tüm düğme ve satırlara yayıldı

Doğrulandı: masaüstünde proje kartının kenarı üzerine gelince açılıyor
(`#3c3734` → `#4a4440`), mobilde hiç değişmiyor.

## v0.10.4 — 21 Ağustos 2026
**Dokunma davranışı düzeltildi**

Sekmeye basıp parmağını sürükleyince iOS bağlantıyı "taşınabilir" sayıyor,
başlık + adres balonunu gösteriyor ve arkadaki sayfayı karartıyordu.
Karartma dokunma tepkisi değil, sürükleme perdesiymiş.

- Bağlantı, görsel ve kartlarda sürükleme kapatıldı
  (`-webkit-user-drag: none` + `draggable="false"`)
- `-webkit-touch-callout: none` ve `touch-action: manipulation` tüm
  dokunulabilir öğelere verildi
- **Dokunma tepkisi karartma değil, hafif küçülme** oldu. Zemini
  koyulaştırmak koyu temada "sönüyor" gibi okunuyordu
- Dokunmatikte kalıcı odak halkası kaldırıldı — parmakla basınca kartın
  çevresinde beyaz çerçeve kalıyordu

## v0.10.3 — 21 Ağustos 2026
**Metin seçimi kapatıldı, simgeler büyüdü**

- **Uzun basınca çıkan "Kopyala / Araştır / Çeviri" menüsü gitti.** Arayüzün
  yazıları artık seçilemiyor; yalnızca yazdığın alanlar ve kopyalanmak için
  duran kod blokları seçilebilir kaldı
- Hesap menüsü **kapanırken de** animasyonlu. Kutu geçiş bitmeden siliniyordu
  (200 ms silme, 340 ms geçiş) — kapanış hiç görünmüyordu
- Özet kartlarına simge geldi: klasör · kalem · onay kutusu · tik.
  Her biri kartın kendi renginde
- Alt çubuk simgeleri büyüdü: kutu 29 → 34, simge 19 → 22 piksel.
  Kutuların üst yarısına cam parlaması, basınca hafif içeri çökme eklendi

## v0.10.2 — 21 Ağustos 2026
**Hacimli simgeler, renkli çerçeveler, kayarak açılan menü**

**Alt çubuk simgeleri yeniden çizildi.** Artık çizgi simge değil, üç katmanlı
hacimli çizim: altta 1,6 piksel aşağı kaymış koyu kalınlık, üstte tepesi
parlak dibi koyu gradyanlı yüz, en üstte ince beyaz kırılma çizgisi.
Klasörün kapağı ile gövdesi ayrı düzlemde, görev levhasındaki tik oyulmuş,
ayar düğmeleri raylarının üstünde duruyor.

**Özet kartlarının çerçevesi kendi rengini aldı** ve ışıyor —
Geliştiriliyor sarı, Kontrolde mavi, Bugün Biten yeşil, Aktif Proje metal.
Üstüne gelince çerçeve parlıyor.

**Hesap menüsü kayarak açılıyor.** Perde yukarıdan aşağı sıyrılıyor,
kapanırken geri toplanıyor.

## v0.10.1 — 21 Ağustos 2026
**Kabuk düzeltmeleri**

- Üst çubukta artık **NIZAM | Studio** yazıyor (ayraç kırmızı, girişteki gibi)
- Fotoğrafa basınca alttan sayfa değil, **fotoğrafın altında küçük menü**
  açılıyor; sağ üst köşeden büyüyerek geliyor, oraya küçülerek gidiyor.
  Dışarı basınca, Esc'e basınca ya da ekran değişince kapanıyor
- Panel'deki "GitHub bağlantısı Adım 5'te gelecek" uyarısı kaldırıldı
- Özet kartları kabartma oldu: üstten ışık, altta gölge, sol üstten sızan
  parlaklık; rakamlar kendi renginde hafifçe parlıyor
- **Görevler ve Ayarlar'da ortadaki artı kayboluyordu** — artık her ekranda
  duruyor. Kendine ait eylemi olmayan ekranlarda en sık işi yapıyor: Yeni Proje

## v0.10.0 — 21 Ağustos 2026
**Yeni kabuk: üst çubuk, alt çubuk, zemin**

**Zemin açıldı.** "Çok kara" hissi gitsin diye tüm renk merdiveni bir kademe
yukarı alındı — yalnız arka plan değil, kartlar ve çizgiler de. Yoksa kartlar
zeminle aynı tona düşer, kutular kaybolurdu. Sıcak grafit tonu korundu.

| | Eski | Yeni |
|---|---|---|
| Zemin | `#0f0e0d` | `#171614` |
| Kart | `#252220` | `#2d2a27` |
| Çizgi | `#37322f` | `#3c3734` |

**Üst çubuk yeniden kuruldu.** Solda logo kutusu, yanında firma adı, altında
bulunduğun sayfanın adı (altın). Sağda tek hap: rol · ad soyad · fotoğraf.
Zemin buzlu cam, alt kenarda soldan sağa sönen kırmızı çizgi.

**Kullanıcı hapına basınca** alttan sayfa açılıyor: Bildirimler · Destek ·
Çıkış yap. Okunmamış bildirim varsa fotoğrafın köşesinde rozet çıkar.

**Alt çubuk dört sekmeye indi**, ortasına yükselen kırmızı **+** geldi.
Artı sekme değil eylem: bulunduğun ekrana göre Yeni Proje / Yeni Görev /
Yeni Standart açar. Simgeler kabartma kutulara alındı — üstten ışık,
alttan gölge, parlak metal dolgu.

**Standartlar Ayarlar'ın içine taşındı** — alt çubukta yer açmak için.

- Arama kutusu kaldırıldı (çalışmıyordu, Adım 5'e kalmıştı)
- Baş harf kutuları kırmızıdan metale çevrildi; kırmızı yine dört yerde
- Firma adı ve destek adresi `config.js` içinde: `FIRMA`, `DESTEK`

> Profil fotoğrafı henüz yüklenemiyor, baş harfler görünüyor.
> Gerçek fotoğraf için Supabase'de dosya deposu kurulması gerekiyor.

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
