-- ============================================================================
-- 41 · NIZAM Standart — Canonical TAŞIMA (77 → 66) · TEK-BLOK sürüm
-- ============================================================================
-- Migration Phase 41 — veri taşıma. ÖNCE sql/39 (şema) ve sql/40 (snapshot)
-- çalıştırılmış olmalı. Hiçbir satır DELETE EDİLMEZ; eskiler yalnız aktif=false.
--
-- NEDEN TEK BLOK: Supabase SQL Editor, art arda gelen ifadeler arasında geçici
-- (temporary) tabloları koruyamıyordu ("_kodmap does not exist"). Bu yüzden tüm
-- taşıma TEK bir "do $$ ... $$" bloğunda çalışır; temp tablolar baştan sona aynı
-- çalışma içinde yaşar. Mantık, eşleme ve validation önceki sürümle BİREBİR aynı.
--
-- Mantık: survivor = eskiStandartlar[0]'ın mevcut satırı → UPDATE. İlk eski kod
-- başka canonical'a atanmışsa o canonical yeni UUID ile INSERT (yalnız ST-066).
-- task_standards, survivor olmayan eski satırlardan survivor'a taşınır. Canonical
-- olmayan eskiler + ST-075 → aktif=false. Benzersizlik: kanonik_id unique + partial
-- unique(alan,ad) WHERE aktif. Sonda validation; hata olursa transaction ROLLBACK.
--
-- Pre-check: canlı standards snapshot ile birebir aynı set olmalı → taşıma bir kez
-- uygulandıktan sonra (ST-066 eklenince) ikinci çalıştırmayı güvenle reddeder.
-- Snapshot-türevli validation: beklenen_toplam = snapshot+1, aktif canonical = 66.
-- Canlı gerçek: 86 → 87 / 66 aktif / 21 pasif. İki kez çalıştırmak güvenlidir.
-- ============================================================================
begin;

do $$
declare
  r record;
  v_sv jsonb; v_snap int; v_cur int; v_fark int; n int;
  v_aktif int; v_inaktif int; v_toplam int; v_dupkan int; v_aktif_null int;
  v_st75_aktif int; v_066 uuid; v_006 uuid; v_orphan int;
  v_st75_task int; v_dup_task int; v_bos_eski int; v_distinct int;
  v_snap_toplam int; v_bek_toplam int; v_bek_inaktif int;
begin
  -- 0) Snapshot zorunlu
  if not exists (select 1 from public.standart_gecmisi where etiket='standart-canonical-v1') then
    raise exception 'Snapshot yok (standart-canonical-v1). Önce sql/40 calistir.';
  end if;

  -- 0b) Pre-check: canlı standards snapshot ile birebir aynı set olmalı
  select standards_veri into v_sv from public.standart_gecmisi
    where etiket='standart-canonical-v1' order by alindi asc limit 1;
  v_snap := jsonb_array_length(v_sv);
  select count(*) into v_cur from public.standards;
  if v_cur <> v_snap then
    raise exception 'Pre-check: canli standards (%) snapshot (%) ile ayni sayida degil.', v_cur, v_snap;
  end if;
  select (select count(*) from (
            select id from public.standards
            except
            select (jsonb_populate_recordset(null::public.standards, v_sv)).id) a)
       + (select count(*) from (
            select (jsonb_populate_recordset(null::public.standards, v_sv)).id
            except
            select id from public.standards) b)
    into v_fark;
  if v_fark <> 0 then
    raise exception 'Pre-check: standards ID kumesi snapshot ile ayni degil (fark=%).', v_fark;
  end if;

  -- Köprü: eski ST-kodu → (grup, alan, ad)  [77]
  create temporary table _kodmap (kod text primary key, grup text, alan text, ad text) on commit drop;
  insert into _kodmap (kod, grup, alan, ad) values
  ('ST-01','Altyapı','Dil ve çatı','Vanilla JS · HTML · CSS'),
  ('ST-02','Altyapı','Derleme','Yok'),
  ('ST-03','Altyapı','Dosya düzeni','Ekran başına ayrı dosya'),
  ('ST-04','Altyapı','Barındırma','GitHub Pages'),
  ('ST-05','Altyapı','Depo','GitHub · main dalı'),
  ('ST-06','Altyapı','PWA','Var'),
  ('ST-07','Altyapı','Paketler','Yalnız Supabase istemcisi'),
  ('ST-08','Altyapı','Geliştirme istekleri','Ayarlarda toplanır'),
  ('ST-09','Altyapı','Sürümleme','Sürüm, damga ve önbellek birlikte artar'),
  ('ST-10','Altyapı','Dosya düzeni','Sınıf adı tek bir bileşene aittir'),
  ('ST-11','Altyapı','Ayarlar','Güncelleme ayarlardaki düğmeyle yapılır'),
  ('ST-12','Veri','Veri katmanı','Supabase'),
  ('ST-13','Veri','Gerçek zamanlı','Her zaman açık'),
  ('ST-14','Veri','Çevrimdışı','Her zaman çalışır'),
  ('ST-15','Veri','Değişiklik kaydı','Her zaman tutulur'),
  ('ST-16','Veri','Dosya saklama','Supabase Storage'),
  ('ST-17','Veri','Yedek','Dosyaya dışa/içe aktarma'),
  ('ST-18','Veri','Veri katmanı','Yüzde hesaplanır, girilmez'),
  ('ST-19','Güvenlik','Giriş','E-posta + şifre'),
  ('ST-20','Güvenlik','Veri katmanı','Satır güvenliği her tabloda'),
  ('ST-21','Güvenlik','Veri katmanı','Yetki sunucuda denetlenir'),
  ('ST-22','Güvenlik','Veri katmanı','Yalnız yayınlanabilir anahtar istemcide'),
  ('ST-23','Güvenlik','Dosya saklama','Belgeler imzalı adresle sunulur'),
  ('ST-24','Güvenlik','Güvenlik','Güvenlik testi'),
  ('ST-25','Tasarım','Açıklama şeridi','Ekran tepesinde kalıcı açıklama olmaz'),
  ('ST-26','Tasarım','Liste ve kartlar','Boş liste kendini anlatır'),
  ('ST-27','Tasarım','Uyarı metni','Hata metni ne olduğunu ve ne yapılacağını söyler'),
  ('ST-28','Tasarım','Onay penceresi','Geri alınamaz işlem adıyla onaylatılır'),
  ('ST-29','Tasarım','Liste ve kartlar','Izgara kartlarında başlığa sabit yer'),
  ('ST-30','Tasarım','Gezinme','Masaüstünde panel, telefonda alt çubuk'),
  ('ST-31','Tasarım','Alt çubuk','Buzlu cam, ekranın dibine yapışık'),
  ('ST-32','Tasarım','Alt çubuk','Kırmızı yalnız aktif sekmede'),
  ('ST-33','Tasarım','Alt çubuk','Ekranın fiziksel dibine oturur'),
  ('ST-34','Tasarım','Profil paneli','Panel sonucu kendi içinde gösterir'),
  ('ST-35','Tasarım','Üst çubuk','Geri oku her ekranda durur'),
  ('ST-36','Tasarım','Üst çubuk','Yalnız marka, sayfa adı ve profil'),
  ('ST-37','Tasarım','Üst çubuk','Beliren düğme yerleşimi kaydırmaz'),
  ('ST-38','Tasarım','Üst çubuk','Yol izi geri oku ve başlıktır'),
  ('ST-39','Tasarım','Üst çubuk','Kullanıcı sağ üstte çiple durur'),
  ('ST-40','Tasarım','Açılış ekranı','Minimal, animasyonsuz'),
  ('ST-41','Tasarım','Bildirim','Uyarılar alttan kartla çıkar'),
  ('ST-42','Tasarım','Form','İşlem sonucu kısa mesajla bildirilir'),
  ('ST-43','Tasarım','Giriş ekranı','Tek kart, kayıt yok'),
  ('ST-44','Tasarım','Hata','Hata ekranı simge ve tekrar dene düğmesidir'),
  ('ST-45','Tasarım','Panel','Önce nereye gidileceği'),
  ('ST-46','Tasarım','Ayarlar','Başlıklı bölümler, satır satır'),
  ('ST-47','Tasarım','Profil paneli','Araç düğmeleri burada toplanır'),
  ('ST-48','Tasarım','Bildirim merkezi','Zil, sayı, okundu'),
  ('ST-49','Tasarım','Genel','Geri al şeridi'),
  ('ST-50','Tasarım','Tablo çıktısı','Excel ve PDF'),
  ('ST-51','Tasarım','Tarih filtresi','Gün · Hafta · Ay · Aralık'),
  ('ST-52','Tasarım','Dosya yükleme','Tıkla veya sürükle'),
  ('ST-53','Animasyon','Dokunma tepkisi','Bekleme göstergesi işi bitince durur'),
  ('ST-54','Animasyon','Dokunma tepkisi','Küçülme oranı öğe boyuna göre'),
  ('ST-55','Animasyon','Geçişler','Hareket az tutulur'),
  ('ST-56','Animasyon','Sayfa geçişi','Yeni ekran solarak gelir'),
  ('ST-57','Animasyon','Liste ve kartlar','Tek tek belirme yok'),
  ('ST-58','Animasyon','Dokunma tepkisi','Küçülme, karartma değil'),
  ('ST-59','Optimizasyon','Ön yükleme','Bütün resimler açılışta iner'),
  ('ST-60','Optimizasyon','Önbellek','İmza önbelleği kırmaz'),
  ('ST-61','Optimizasyon','Dosya yükleme','Yüklemeden önce küçültülür'),
  ('ST-62','Optimizasyon','Görsel ağırlığı','Görseller WebP ve tek kopya'),
  ('ST-63','Optimizasyon','Bulanıklık','Kaydırılan listede kullanılmaz'),
  ('ST-64','Optimizasyon','Kart zemini','Saydam değil, düz koyu'),
  ('ST-65','Optimizasyon','Görsel ağırlığı','Tek zemin görseli, kırpılmış'),
  ('ST-66','Biçim','Para birimi','₺ TRY'),
  ('ST-67','Biçim','Tarih ve saat','22.05.2025 · 14:30'),
  ('ST-68','Biçim','Kayıt numarası','HARF-SIRA'),
  ('ST-69','Biçim','Sürümleme','YIL.SAYAÇ'),
  ('ST-70','Biçim','Arayüz dili','Türkçe'),
  ('ST-71','Biçim','Liste ve kartlar','Listeler alfabetik sıralanır'),
  ('ST-72','Biçim','Arayüz dili','Sıralama arayüz diline göre'),
  ('ST-73','Biçim','Uzun liste','Daha fazla göster'),
  ('ST-74','Erişilebilirlik','Dokunma ve kontrast','44px · 4.5:1'),
  ('ST-75','Erişilebilirlik','Yakınlaştırma','Kapalı'),
  ('ST-76','Erişilebilirlik','Dokunma tepkisi','Bekleme yalnız harekete bırakılmaz'),
  ('ST-77','Erişilebilirlik','Dokunma ve kontrast','Basılan alan simgeden büyüktür');

  -- Canonical hedef veri  [66]
  create temporary table _canon (
    kanonik_id text primary key, tip text, kategori text, aile text, ad text, kural text,
    kosul text, yerel text, istisna text, neden text, kapsam text, kaynak text,
    versiyon int, a11y boolean, eski_std jsonb, survivor_kod text, yeni_insert boolean
  ) on commit drop;
  insert into _canon (kanonik_id,tip,kategori,aile,ad,kural,kosul,yerel,istisna,neden,kapsam,kaynak,versiyon,a11y,eski_std,survivor_kod,yeni_insert) values
  ('ST-001','VARSAYILAN','TECH',null,'Vanilla JS · HTML · CSS','Hazır çatı (React, Vue) kullanılmaz; bağımlılık az, ömrü uzun olsun.','','','Proje gereği farklı bir yol gerekiyorsa önce sorulur.','Az bağımlılık = uzun ömür ve kolay bakım.','nizam','koken_proje',1,false,'["ST-01"]'::jsonb,'ST-01',false),
  ('ST-002','VARSAYILAN','TECH',null,'Derleme yok','Dosyalar doğrudan çalışır; build adımı, paket yöneticisi ve node_modules yoktur.','','','','Kurulumsuz çalışma ve basit yayın.','nizam','koken_proje',1,false,'["ST-02"]'::jsonb,'ST-02',false),
  ('ST-003','KURAL','TECH',null,'Ekran başına ayrı dosya','Her ekran kendi dosyasındadır; tek dosyada 1500 satır aşılmaz.','','','','Büyük dosyada bir yeri düzeltirken başka yer bozulur.','nizam','koken_proje',1,false,'["ST-03"]'::jsonb,'ST-03',false),
  ('ST-004','KURAL','TECH',null,'Stil sınıf adı tek bileşene aittir','Bir stil sınıfı adı yalnız tek bileşene aittir; yeni ad verirken o ad ve öneki tüm stil dosyasında aranır, çakışırsa yeni önek alınır. Ortak görünüm için ad paylaşılmaz, ortak bir sınıf ikisine birden verilir.','','','','Aynı ad iki bileşende kuralları sessizce ezer, hata yalnız bozuk hizayla görünür.','nizam','koken_proje',1,false,'["ST-10"]'::jsonb,'ST-10',false),
  ('ST-005','VARSAYILAN','TECH',null,'Barındırma: GitHub Pages','Depoya gönderilen kod kendiliğinden yayınlanır.','','','','Ayrı dağıtım adımı olmadan yayın.','nizam','koken_proje',1,false,'["ST-04"]'::jsonb,'ST-04',false),
  ('ST-006','VARSAYILAN','TECH',null,'Depo: GitHub main dalı','Geliştirme main dalında yapılır.','','','','Tek ve öngörülebilir geliştirme dalı.','nizam','koken_proje',1,false,'["ST-05"]'::jsonb,'ST-05',false),
  ('ST-007','VARSAYILAN','TECH',null,'PWA','Uygulama ana ekrana eklenebilir; servis işçisi kabuğu önbelleğe alır, sürüm değişince günceller.','','','','Mobil-masaüstü tek kod, çevrimdışı kabuk.','nizam','koken_proje',1,false,'["ST-06"]'::jsonb,'ST-06',false),
  ('ST-008','KURAL','TECH',null,'Bağımlılık disiplini','İstemciye yalnız Supabase istemcisi girer; Excel gerekiyorsa xlsx. Başka paket eklemeden önce sorulur.','','Dış paket kullanılmaz. Excel gerekiyorsa xlsx. Başka paket eklemeden önce sor.','','Kontrolsüz bağımlılık ömrü ve güvenliği bozar.','nizam','koken_proje',1,false,'["ST-07"]'::jsonb,'ST-07',false),
  ('ST-009','KURAL','TECH',null,'Sürüm, damga ve önbellek birlikte artar','Yayına giden her değişiklikte üçü birlikte güncellenir: sürüm numarası, dosya adreslerindeki sürüm damgası ve servis işçisi önbellek adı. Damgalı dosyalar önce önbellekten okunur; giriş sayfası damgasız ve her zaman önce ağdan okunur.','','','','Biri unutulursa kullanıcı eski dosyayla kalır, hata hiçbir yerde görünmez.','nizam','koken_proje',1,false,'["ST-09"]'::jsonb,'ST-09',false),
  ('ST-010','VARSAYILAN','DATA',null,'Veri katmanı: Supabase','Veri Supabase''de durur: Postgres + Auth + Realtime + Storage.','Sunuculu proje.','Yerel tarayıcı (IndexedDB). Sunucu yok; bütün kayıtlar cihazda durur, site verisi silinirse kayıtlar da gider — yedeği kullanıcı alır.','','Tek ve tutarlı veri/oturum/dosya katmanı.','nizam','koken_proje',1,false,'["ST-12"]'::jsonb,'ST-12',false),
  ('ST-011','KOŞULLU','DATA',null,'Gerçek zamanlı','Başkası bir kaydı değiştirince ekran kendiliğinden tazelenir.','Veri katmanı sunucudaysa (ör. Supabase) bu davranış geçerlidir; veri katmanı yalnızca tarayıcı/cihazdaysa `yerel` karşılığı geçerlidir.','Yok. Tek cihaz, tek kullanıcı; eşitlenecek başka yer yok.','Gerçek zamanlı veri ihtiyacı yoksa gerekmez; Supabase kullanılması Realtime''ı zorunlu kılmaz.','Çok kullanıcılı veride tutarlı görünüm.','nizam','koken_proje',1,false,'["ST-13"]'::jsonb,'ST-13',false),
  ('ST-012','KURAL','DATA',null,'Çevrimdışı çalışır','Okuma yerelden yapılır (son görülen veri tarayıcıda durur); yazma kuyruğa girer, internet gelince gönderilir. Çakışırsa son yazan kazanır ve kullanıcıya söylenir.','','Yerelde tüm veri zaten cihazda durur; çevrimdışı doğası gereği çalışır, gönderilecek sunucu/kuyruk yoktur.','','Bağlantı kopsa da uygulama kullanılabilir kalır.','nizam','koken_proje',1,false,'["ST-14"]'::jsonb,'ST-14',false),
  ('ST-013','KURAL','DATA',null,'Değişiklik kaydı tutulur','Her yazma işleminde kim, ne, ne zaman kaydedilir ve Ayarlar''da listelenir.','','Yerelde tutulur; ne ve ne zaman değişti cihazda kaydedilir ve Ayarlar''da listelenir. ''Kim'' yok — uygulamayı tek kişi kullanır.','','İzlenebilir denetim izi.','nizam','koken_proje',1,false,'["ST-15"]'::jsonb,'ST-15',false),
  ('ST-014','KOŞULLU','DATA',null,'Yedek: dosyaya dışa/içe aktarma','Ayarlar''dan tek dosya olarak indirilir ve geri yüklenir; uygulama yedeği düzenli hatırlatır.','Veri katmanı yalnızca tarayıcı/cihazdaysa (sunucusuz) geçerlidir; yedeği almak kullanıcının sorumluluğundadır.','Ayarlar''dan tek dosya olarak indirilir ve geri yüklenir. Sunucu olmadığı için yedeği almak kullanıcının sorumluluğunda; uygulama düzenli hatırlatır.','','Sunucusuz veride tek koruma yedektir.','nizam','koken_proje',1,false,'["ST-17"]'::jsonb,'ST-17',false),
  ('ST-015','KURAL','DATA',null,'Yüzde ve özet sayılar hesaplanır, girilmez','İlerleme yüzdesi, doluluk oranı ve benzeri özet sayılar elle girilmez; her zaman alttaki kayıtlardan hesaplanır ve veritabanında saklanmaz, gösterileceği an hesaplanır.','','','Sıralamanın kendisi anlam taşıyan süreç adımları hariç değil — bu kural yalnız özet sayılar içindir.','Elle girilen özet ilk günden sonra gerçeği göstermeyi bırakır.','nizam','koken_proje',1,false,'["ST-18"]'::jsonb,'ST-18',false),
  ('ST-016','KURAL','SECURITY',null,'Satır güvenliği her tabloda','Her tabloda satır güvenliği (RLS) açıktır ve en az bir okuma, bir yazma kuralı tanımlıdır; kuralı yazılmamış tablo yayına çıkmaz.','Veri katmanı sunucudaysa (ör. Supabase) bu davranış geçerlidir; veri katmanı yalnızca tarayıcı/cihazdaysa `yerel` karşılığı geçerlidir.','Gerek yok. Sunucu yok; veriye yalnız uygulamanın kendisi erişir, kural yazılacak tablo yoktur.','','Güvenlik açık ama kuralsız tablo herkese kapalı görünür, geliştirici güvenliği yanlışlıkla gevşetir.','nizam','koken_proje',1,false,'["ST-20"]'::jsonb,'ST-20',false),
  ('ST-017','KURAL','SECURITY',null,'Yetki sunucuda denetlenir','Kullanıcının ne görüp değiştirebileceği sunucudaki kurallarla belirlenir. Arayüzde düğme gizlemek yetki denetimi değildir; gizlenen isteğin kendisi de sunucuda engellenir.','Veri katmanı sunucudaysa (ör. Supabase) bu davranış geçerlidir; veri katmanı yalnızca tarayıcı/cihazdaysa `yerel` karşılığı geçerlidir.','Yetki yalnız arayüzde uygulanır; sunucu yok, arayüz tek katmandır.','','Gizlenen düğmenin çağırdığı istek elle gönderilebilir.','nizam','koken_proje',1,false,'["ST-21"]'::jsonb,'ST-21',false),
  ('ST-018','KURAL','SECURITY',null,'İstemcide yalnız yayınlanabilir anahtar','İstemci koduna yalnız yayınlanabilir (publishable/anon) anahtar girer; veriyi koruyan şey anahtar değil satır güvenliği kurallarıdır. Tüm kuralları atlayan yönetici/service_role anahtarı istemciye, depoya ya da yapılandırmaya hiçbir koşulda yazılmaz.','Veri katmanı sunucudaysa (ör. Supabase) bu davranış geçerlidir; veri katmanı yalnızca tarayıcı/cihazdaysa `yerel` karşılığı geçerlidir.','Gerek yok. İstemci-sunucu ayrımı ve anahtar yoktur.','','Gizli anahtar sızarsa tüm güvenlik düşer.','nizam','koken_proje',1,false,'["ST-22"]'::jsonb,'ST-22',false),
  ('ST-019','VARSAYILAN','SECURITY',null,'Giriş: e-posta + şifre, kayıt yok','Giriş e-posta ve şifreyledir; kayıt ekranı yoktur, hesabı yönetici açar.','Veri katmanı sunucudaysa (ör. Supabase) bu davranış geçerlidir; veri katmanı yalnızca tarayıcı/cihazdaysa `yerel` karşılığı geçerlidir.','Yok. Uygulama açılır açılmaz kullanılır; giriş ekranı, şifre, PIN gibi katman yoktur — cihazın sahibi zaten tek kullanıcıdır.','','İç araçta açık kayıt istenmez.','nizam','koken_proje',1,false,'["ST-19"]'::jsonb,'ST-19',false),
  ('ST-020','KURAL','SECURITY','FILE_STORAGE','Dosya saklama: Storage + imzalı adres','Belge ve müşteriye ait görseller Supabase Storage''da özel klasörde durur (varsayılan konum). Erişim koşulu: herkese açık klasörde tutulmaz, süreli ve imzalı adresle sunulur; adresin tahmin edilebilir olması erişimi engellemez. Profil fotoğrafı gibi zaten herkese görünenler bu erişim kısıtının dışındadır.','Veri katmanı sunucudaysa ve dosya saklanıyorsa bu davranış geçerlidir; veri katmanı yalnızca tarayıcı/cihazdaysa `yerel` karşılığı geçerlidir.','Dosyalar cihazda (IndexedDB) durur, imzalı adres yok; tarayıcı doğrudan kendi sakladığından okur ve dosyalar yedeğe dahildir.','Profil fotoğrafı genel olabilir.','Açık klasör + tahmin edilebilir adres veri sızdırır.','nizam','koken_proje',1,false,'["ST-16", "ST-23"]'::jsonb,'ST-16',false),
  ('ST-021','KURAL','SECURITY',null,'Program deposunda guvenlik.json bulunur','Studio''ya eklenen her programın depo kökünde, adı birebir ''guvenlik.json'' olan bir tarif dosyası bulunur; Studio güvenlik testlerini, kurulum dosyalarını ve kurulum sonrası ayarları bu dosyadan okur. Dosya yoksa Studio durmaz, yalnız evrensel denetimleri yapar. Dosya yolları ya da sürüm değişince guvenlik.json aynı commit''te güncellenir.','','','','Sabit yol her sürümde bozulur; sabit olan tek şey dosyanın adı ve yeridir.','nizam','koken_proje',1,false,'["ST-24"]'::jsonb,'ST-24',false),
  ('ST-022','VARSAYILAN','FORMAT',null,'Para birimi: ₺ TRY','Binlik nokta, ondalık virgül: 12.400,00.','','','Proje farklı para birimi gerektirebilir.','Tutarlı yerel biçim.','nizam','koken_proje',1,false,'["ST-66"]'::jsonb,'ST-66',false),
  ('ST-023','VARSAYILAN','FORMAT',null,'Tarih ve saat biçimi','Gün.Ay.Yıl ve 24 saatlik saat: 22.05.2025 · 14:30.','','','','Tutarlı yerel biçim.','nizam','koken_proje',1,false,'["ST-67"]'::jsonb,'ST-67',false),
  ('ST-024','VARSAYILAN','FORMAT',null,'Kayıt numarası: HARF-SIRA','Türü gösteren kısa harf, tire ve sıra numarası: F-1042, S-1001. Sayaç 1''den başlar, yıl başında sıfırlanmaz, boşluk bırakmaz.','','','','Okunur, çakışmasız kayıt kimliği.','nizam','koken_proje',1,false,'["ST-68"]'::jsonb,'ST-68',false),
  ('ST-025','VARSAYILAN','FORMAT',null,'Uygulama sürüm formatı: YIL.SAYAÇ','Kullanıcıya gösterilen uygulama sürümü YIL.SAYAÇ biçimindedir (örn. 2026.14) ve Ayarlar ekranında görünür.','','','','Bu, ST-009''daki teknik önbellek/damga mekanizmasından ayrıdır; o mekanik, bu kullanıcıya görünen etikettir.','nizam','koken_proje',1,false,'["ST-69"]'::jsonb,'ST-69',false),
  ('ST-026','VARSAYILAN','FORMAT',null,'Arayüz dili: Türkçe','Tek dil Türkçedir; metinler koda yazılır, sözlük dosyası yoktur.','','','','İç araçta tek dil yeterli.','nizam','koken_proje',1,false,'["ST-70"]'::jsonb,'ST-70',false),
  ('ST-027','KURAL','FORMAT',null,'Sıralama: alfabetik ve arayüz diline göre','Kullanıcının taradığı her liste alfabetik sıralanır (menü, gruplar, alt başlıklar, kayıtlar — iç içe tüm kademeler). Sıralama arayüz dilinin harf düzeniyle yapılır: Türkçede ç, ğ, ı, i, ö, ş, ü kendi yerine oturur, sona atılmaz. Ekleme tarihi/sabit dizilim yalnız iki ad birebir aynıysa devreye girer.','','','Sıralamanın kendisi anlam taşıyorsa (süreç adımları, tarihe göre hareket geçmişi, kullanıcının elle dizdiği liste) kendi sırasını korur.','Sabit sırada kullanıcı yeri ezberler; yanlış harf düzeni aradığını bulduramaz.','nizam','koken_proje',1,false,'["ST-71", "ST-72"]'::jsonb,'ST-71',false),
  ('ST-028','KURAL','A11Y','TOUCH_TARGET','Dokunma hedefi ve kontrast','Dokunma hedefi en az 44×44px, metin kontrastı en az 4.5:1''dir. Düğmenin dokunma alanı içindeki simgeyle sınırlı tutulmaz; simge küçük olsa da basılan alan en az 44px kalır (çerçevesiz, yalnız simgeli düğmelerde en çok atlanan yer).','','','','Küçük hedef ve düşük kontrast erişimi engeller.','nizam','koken_proje',1,true,'["ST-74", "ST-77"]'::jsonb,'ST-74',false),
  ('ST-029','KURAL','PERF',null,'backdrop-filter kaydırılan listede kullanılmaz','Bulanıklık kaydırılan içerikte kullanılmaz (her karede yeniden hesaplanır, takılma yapar). Bulanıklık sabit bir görselin arkasındaysa görselin kendisine pişirilir. Yalnız yerinde duran tek bir yüzey (alt çubuk gibi) buzlu cam olabilir.','','','Yerinde duran tek yüzey.','Kaydırmada sürekli yeniden hesap performansı düşürür.','nizam','koken_proje',1,false,'["ST-63"]'::jsonb,'ST-63',false),
  ('ST-030','KURAL','PERF',null,'Görseller WebP ve tek kopya','Fotoğraflar WebP saklanır; eski biçimdeki kopya işi bitince depoda bırakılmaz. Görsel ekranda kaplayacağı boyuta küçültülmüş yüklenir. Simge ve çizim işi görseller SVG''dir, fotoğraf biçimine çevrilmez.','','','Vektör dosyalar.','Tarayıcıda küçültmek indirme süresini gizler, dosyayı küçültmez.','nizam','koken_proje',1,false,'["ST-62"]'::jsonb,'ST-62',false),
  ('ST-031','KURAL','PERF',null,'Arka plan görseli: tek, kırpılmış, ≤200 KB','Arka plan görseli kullanılacaksa tek tane olur, hedef ekran oranına kırpılır ve 200 KB''ı geçmez; aynı görselin birden çok kopyası üst üste bindirilmez.','','','','Ağır/çok katmanlı zemin görseli yükü artırır.','nizam','koken_proje',1,false,'["ST-65"]'::jsonb,'ST-65',false),
  ('ST-032','KOŞULLU','PERF',null,'İmza önbelleği kırmaz','İmzalı adresle gelen resimler önbelleğe adresin tamamıyla değil, sorgu kısmı atılmış yoluyla kaydedilir. Bir resim değiştirildiğinde o kaydın önbellekten silinmesi gerekir.','İmzalı adres (signed URL) kullanılıyorsa.','','','Anahtar adresin tamamı olursa tarayıcı aynı resmi her imza yenilenişinde baştan indirir; silinmezse kullanıcı eskisini görmeye devam eder.','nizam','koken_proje',1,false,'["ST-60"]'::jsonb,'ST-60',false),
  ('ST-033','KOŞULLU','PERF',null,'Kritik görseller öncelikli, gerisi tembel yüklenir','İlk ekran için gerekli kritik görseller (ör. kullanıcının kendi profil fotoğrafı) öncelikli yüklenir; diğer görseller uygun olduğunda tembel (lazy) yüklenebilir.','İlk ekranda görünmeyen ya da ilk ekran deneyimi için gerekli olmayan görseller için geçerlidir; ilk ekran için gerekli kritik görseller öncelikli yüklenir.','','','Tüm görselleri açılışta zorla indirmek yavaş bağlantıda açılışı geciktirir ve ölçeklenmez; revize edildi (eski ''hepsi açılışta iner'' kuralı).','nizam','koken_proje',2,false,'["ST-59"]'::jsonb,'ST-59',false),
  ('ST-034','KURAL','UI',null,'Ekran tepesinde kalıcı açıklama şeridi olmaz','Bir ekranın tepesine her açılışta görünen kalıcı açıklama şeridi konmaz; ekran kendini yerleşimiyle anlatır. Açıklama gerekiyorsa üç yerden birine gider: boş durum metni, ilgili alanın altındaki ipucu ya da işlemi başlatan pencerenin başlığı.','','','','Okunmayan tekrar metin yalnız yer kaplar, içeriği aşağı iter.','nizam','koken_proje',1,false,'["ST-25"]'::jsonb,'ST-25',false),
  ('ST-035','KURAL','UI','APP_HEADER','Üst çubuk kompozisyonu','Üst çubukta solda logo ve marka, altında bulunulan sayfanın adı (yol izi = geri oku + başlık; ayrı ''Ana Sayfa › Raporlar'' satırı olmaz), sağda kullanıcı çipi (avatar, ad ve rol bir arada, dokununca menü) bulunur. Araç düğmeleri üst çubuğa dizilmez; not defteri, bildirim, destek, çıkış gibi araçlar kullanıcı çipine basınca açılan panelin satırlarıdır.','','','','Tek ve öngörülebilir başlık düzeni; yalnız avatar kimin girdiğini belirsiz bırakır.','nizam','koken_proje',1,false,'["ST-36", "ST-38", "ST-39", "ST-47"]'::jsonb,'ST-36',false),
  ('ST-036','KURAL','UI','APP_HEADER','Geri oku her ekranda durur','Geri oku üst çubuğun solunda, açılış ekranı dışındaki her ekranda çalışır ve bir kat yukarı çıkarır (alt sayfadan üst sayfaya, oradan listeye). Sabit bir hedefe atlamak geri gitmek değildir.','','','Açılış ekranı.','Sönük/eksik geri oku ''buradan çıkamıyorum'' hissi verir.','nizam','koken_proje',1,false,'["ST-35"]'::jsonb,'ST-35',false),
  ('ST-037','KURAL','UI','APP_HEADER','Üst çubuk yerleşimi kaymaz','Bazı ekranlarda görünüp bazılarında görünmeyen bir düğmenin yeri her ekranda ayrılır; görünmediği yerde gizlenmez, pasifleşir ve solar. Üst çubuk sayfadan sayfaya yer değiştirmez ve geçiş sırasında solmaz.','','','','Düğme gizlenirse logo/marka/başlık kayar, çubuk her geçişte oynuyormuş gibi durur.','nizam','koken_proje',1,false,'["ST-37"]'::jsonb,'ST-37',false),
  ('ST-038','KURAL','UI','NAV','Gezinme: masaüstünde panel, telefonda alt çubuk','900px ve üstünde alt sekme çubuğu gizlenir, gezinme solda dikey panele döner; alt çubuk yalnız telefon ve tablette görünür. Aynı bölüm iki yerde birden gösterilmez, seçili çubuk dokusu ikisinde de aynıdır.','','','','Ekran boyutuna uygun tek gezinme.','nizam','koken_proje',1,false,'["ST-30"]'::jsonb,'ST-30',false),
  ('ST-039','VARSAYILAN','UI','BOTTOM_NAV','Alt çubuk görünümü','900px altında ekranın dibinde sekme çubuğu gelir; sekme sayısı beşi geçmez. Çubuk yerleşimin parçası değildir, içeriğin üstünde durur ve sayfa altından akar — içeriğe çubuk yüksekliği kadar alt pay verilir. Zemin buzlu camdır; tarayıcı desteklemiyorsa düz koyu zemine düşülür.','','','','Son satır çubuğun altında kalmamalı.','nizam','koken_proje',1,false,'["ST-31"]'::jsonb,'ST-31',false),
  ('ST-040','VARSAYILAN','UI','BOTTOM_NAV','Alt çubukta kırmızı yalnız aktif sekmede','Her sekmede üstte simge, altında küçük yazı bulunur; aktif sekmenin arkasında yumuşak kırmızı bir hap belirir, yazı ve simge kırmızıya döner. Kırmızı bu ekranda başka hiçbir yerde kullanılmaz.','','','','Vurgu nadir olduğunda vurgudur.','nizam','koken_proje',1,false,'["ST-32"]'::jsonb,'ST-32',false),
  ('ST-041','KURAL','UI','BOTTOM_NAV','Alt çubuk ekranın fiziksel dibine oturur','Ana ekran çizgisinin payı çubuğun içine verilir; tarayıcıda hiç verilmez (tarayıcının kendi çubuğu oradadır). iOS uygulama kipinde durum çubuğu ayarı black olmalıdır.','','','','black-translucent sayfayı tepeye yapıştırıp altta erişilemeyen boşluk bırakır.','nizam','koken_proje',1,false,'["ST-33"]'::jsonb,'ST-33',false),
  ('ST-042','KURAL','UI','PROFILE_PANEL','Profil paneli sonucu kendi içinde gösterir','Profil panelindeki bir satır bir iş başlatıyor ve başka ekran açmıyorsa panel kapanmaz; bekleme ve sonuç o satırın kendisinde görünür. Satır başka bir ekrana götürüyorsa panel kapanır.','','','','Panel kapanırsa kullanıcı işin sürdüğünü gösteren tek şeyi kaybeder.','nizam','koken_proje',1,false,'["ST-34"]'::jsonb,'ST-34',false),
  ('ST-043','VARSAYILAN','UI','SPLASH','Açılış ekranı minimal ve animasyonsuz','Ortada logo, altında marka adı, en altta ince ilerleme çubuğu ve tek satır durum yazısı bulunur; toplam süre bir saniyeyi geçmez. Zıplayan/dönen/büyüyen animasyon yoktur, yalnız yumuşak belirme. Açılış bitince ekran silinir, iz bırakmaz.','','','','Açılış hızlı ve sade olmalı.','nizam','koken_proje',1,false,'["ST-40"]'::jsonb,'ST-40',false),
  ('ST-044','VARSAYILAN','UI','DASHBOARD','Panel önce nereye gidileceğini gösterir','Panel sayı dökmez, yol gösterir: bölümlere giden kısayol kartları asıl içeriktir. Aynı sayı hem panelde hem alt çubuk rozetinde tekrarlanmaz. Panel kaydırılmaz, içerik ekrana sığar.','','','','Panel bir gösterge tablosu değil, yön levhasıdır.','nizam','koken_proje',1,false,'["ST-45"]'::jsonb,'ST-45',false),
  ('ST-045','VARSAYILAN','UI','SETTINGS','Ayarlar başlıklı bölümler, satır satır','Ayarlar tek sütun, başlıklı bölümlerden oluşur (Hesap, Uygulama, Bağlantılar). Her bölüm bir kartta satır satır listelenir: solda alan adı, sağda değeri. Değişmeyen bilgiler düz yazı, değişebilenler düğme/anahtar. Çıkış düğmesi en altta, sade ve kırmızı değildir.','','','','Telefon ayarları gibi öngörülebilir düzen.','nizam','koken_proje',1,false,'["ST-46"]'::jsonb,'ST-46',false),
  ('ST-046','VARSAYILAN','UI','SETTINGS','Güncelleme ayarlardaki düğmeyle yapılır','Ayarlar ekranında ''Uygulamayı güncelle'' düğmesi ve altında sürüm etiketi bulunur; kullanıcı yeni sürüme oradan geçer. Üst çubukta rozet ya da kendiliğinden yenileme olmaz.','','','','Güncelleme kullanıcı denetiminde, sessiz değil.','nizam','koken_proje',1,false,'["ST-11"]'::jsonb,'ST-11',false),
  ('ST-047','KURAL','UI','EMPTY_STATE','Boş liste kendini anlatır','Hiç kaydı olmayan liste boş bırakılmaz; yerinde üç şey durur: ne olduğu, neden boş olduğu ve buradan çıkmak için basılacak düğme. Filtre yüzünden boşalmış liste ile hiç kaydı olmayan liste aynı metni göstermez.','','','','''Kayıt bulunamadı'' kullanıcıya hata mı yaptı yoksa henüz mü başlamadı demez.','nizam','koken_proje',1,false,'["ST-26"]'::jsonb,'ST-26',false),
  ('ST-048','KURAL','UI','LIST','Izgara kartlarında başlığa sabit yer','Yan yana kartlarda başlığa (ve açıklama satırına) en uzun başlığın sürdüğü kadar sabit yer ayrılır; metni kısaltmak yerine yer ayrılır.','','','','Biri iki satıra sürerken komşusu bir satırda kalırsa ızgara kayar; kısaltma bir dilde tutar öbüründe tutmaz.','nizam','koken_proje',1,false,'["ST-29"]'::jsonb,'ST-29',false),
  ('ST-049','VARSAYILAN','UI','LIST','Uzun liste: Daha fazla göster','Liste makul bir ilk grup gösterir; altta ''Daha fazla göster'' düğmesi basılınca bir grup daha eklenir. Sayfa numarası ya da sonsuz kaydırma kullanılmaz; telefon ve masaüstünde aynı davranış. Grup büyüklüğüne projeye göre karar verilir.','','','','Öngörülebilir ve tek tip sayfalama.','nizam','koken_proje',1,false,'["ST-73"]'::jsonb,'ST-73',false),
  ('ST-050','KOŞULLU','UI','CARD','Kart zemini tema davranışı','Arkasında görsel olan kartın zemini yarı saydam bırakılmaz; düz ve dolu bir zemin olur. Rengin açık/koyu seçimi projenin temasına göredir — koyu zemin NIZAM''ın değişmez kuralı değildir.','Arkasında görsel olan kartlarda.','','','Saydam zemin ekran solarak gelirken altındaki ışığı geçirir ve kart renk kayması yapar; ama renk teması projeye bağlıdır.','nizam','koken_proje',2,false,'["ST-64"]'::jsonb,'ST-64',false),
  ('ST-051','VARSAYILAN','UI','FORM','Giriş ekranı: tek kart, kayıt yok','Tek kart içinde logo, marka adı, e-posta ve şifre alanları ve tam genişlikte giriş düğmesi bulunur; kayıt ekranı yoktur. Hatalı girişte kart içinde Türkçe kırmızı uyarı satırı çıkar, hata kodu gösterilmez. Giriş sırasında düğme pasifleşir (''Giriş yapılıyor…''). Oturum kalıcıdır.','','','','Sade ve öngörülebilir giriş.','nizam','koken_proje',1,false,'["ST-43"]'::jsonb,'ST-43',false),
  ('ST-052','KURAL','UI','MODAL','Silme davranışı (geri alınabilir/alınamaz)','Geri alınabilir işlemde ekranı durduran pencere açılmaz: kayıt önce ekrandan kaldırılır, altta birkaç saniyelik ''Geri al'' şeridi çıkar, süre dolunca kalıcı silinir. Geri alınamaz işlemde açık onay penceresi çıkar; pencere neyin silineceğini adıyla ve kaç şeyi etkileyeceğini söyler, onay düğmesi ''Tamam'' değil yapılacak işin adıdır. İşlemin geri alınabilir olup olmadığı onaydan önce belirtilir. Ekranı durduran pencere yalnız geri alınamaz işler için kullanılır.','','','','Her silmeye modal sormak yorar; hiç sormamak veri kaybettirir — ikisi ayrılır.','nizam','koken_proje',1,false,'["ST-28", "ST-41", "ST-49"]'::jsonb,'ST-28',false),
  ('ST-053','KURAL','UI','TOAST','Geri bildirim: alttan toast','Uyarı, onay ve işlem sonucu mesajları alttan kayan bir kartla belirir ve birkaç saniyede kaybolur; ayrı bir ''Gönderildi'' ekranı açılmaz, kullanıcı bulunduğu yerde kalır. Ekranı durduran pencereden (modal) ayrıdır — modal yalnız geri alınamaz işler içindir.','','','Uzun süren işte toast yerine yüzdeli ilerleme çubuğu gösterilir (bkz. ST-064).','Kısa bilgi akışı kullanıcıyı durdurmaz.','nizam','koken_proje',1,false,'["ST-41", "ST-42"]'::jsonb,'ST-41',false),
  ('ST-054','KURAL','UI','ERROR_STATE','Hata metni ve hata ekranı','Gösterilen her hata metni Türkçe ve anlaşılırdır; ne olduğunu ve ne yapılacağını söyler. Sunucudan gelen ham hata ve hata kodu ekrana basılmaz, özür dilenmez, teknik terim kullanılmaz; işlem tamamlanamadıysa kullanıcının girdiği veri silinmez, formda kalır. Bir ekran tümden yüklenemediğinde uyarı simgesi, gündelik dille tek cümle ve ''Tekrar dene'' düğmesi gösterilir.','','','','Ham hata/kod kullanıcıya bir şey anlatmaz.','nizam','koken_proje',1,false,'["ST-27", "ST-44"]'::jsonb,'ST-27',false),
  ('ST-055','VARSAYILAN','UI','NOTIFICATION','Bildirim merkezi','Üst çubukta zil simgesi bulunur; okunmamış varsa üzerinde sayı görünür. Listede her satır kısa başlık, bir cümle açıklama ve göreceli zaman içerir; okunmamışlar sol kenardaki nokta ile ayrılır. Satıra tıklanınca ilgili sayfaya gidilir ve okundu sayılır. ''Tümünü okundu işaretle'' listenin üstündedir.','','','','Tutarlı bildirim deneyimi.','nizam','koken_proje',1,false,'["ST-48"]'::jsonb,'ST-48',false),
  ('ST-056','KURAL','UI','FILE_UPLOAD','Dosya yükleme deneyimi','Yükleme alanı hem tıklanabilir hem sürükle-bırak kabul eder. Yüklemeden önce tür ve boyut denetlenir, sınır aşılırsa Türkçe uyarı verilir. Görseller küçük önizlemeyle, belgeler simge ve adla listelenir; her satırda silme düğmesi bulunur. Yükleme sırasında ilerleme çubuğu görünür ve iptal edilebilir.','','','','Öngörülebilir ve denetimli yükleme.','nizam','koken_proje',1,false,'["ST-52"]'::jsonb,'ST-52',false),
  ('ST-057','KURAL','PERF','FILE_UPLOAD','Yükleme öncesi görsel optimizasyonu','Seçilen görsel sunucuya gönderilmeden önce tarayıcıda ölçeklenir ve WebP''ye çevrilir; en uzun kenar kullanıma göre sınırlanır — profil 256, logo 512, tam ekran 1600 piksel. Vektör dosyalara dokunulmaz; küçültme başarısız olursa özgün dosya yüklenir.','','','Vektör dosyalar; küçültme başarısızsa özgün dosya.','Telefon fotoğrafı birkaç MB''tır ve küçük bir alanda gösterilmek üzere herkesçe indirilir.','nizam','koken_proje',1,false,'["ST-61"]'::jsonb,'ST-61',false),
  ('ST-058','VARSAYILAN','UI','EXPORT','Tablo çıktısı: Excel ve PDF','Tablo üstünde tek dışa aktar düğmesi Excel ve PDF seçeneği açar. Çıktı ekrandaki filtre ve sıralamaya uyar (tüm veriyi değil). Dosya adı ''ad-tablo-YYYY-AA-GG'' biçimindedir. Hazırlanırken düğme pasifleşir (''Hazırlanıyor…''); PDF üst bilgisinde sayfa başlığı ve tarih yer alır.','','','','Kullanıcı baktığı veriyi dışa alır.','nizam','koken_proje',1,false,'["ST-50"]'::jsonb,'ST-50',false),
  ('ST-059','VARSAYILAN','UI','DATE_FILTER','Tarih filtresi','Dört seçenek sunulur: Gün, Hafta, Ay, Aralık; varsayılan Ay. Aralıkta iki tarih alanı açılır, bitiş başlangıçtan önce seçilemez. Filtre değişince liste anında yenilenir, sayfa yeniden yüklenmez. Seçim adres çubuğunda saklanır.','','','','Yenilenince/paylaşılınca aynı görünüm gelsin.','nizam','koken_proje',1,false,'["ST-51"]'::jsonb,'ST-51',false),
  ('ST-060','KURAL','UI','MOTION','Hareket az tutulur','Yalnız geçiş ve dokunma tepkisi animasyonlanır; süreler 160-220ms arasındadır. Sayı sayma, parlama ve yaylanma yoktur.','','','Veriyi anlatan hareketler (ilerleme çubuğu dolması) hariç.','İş uygulaması gün boyu bakılır, hareket yorar.','nizam','koken_proje',1,false,'["ST-55"]'::jsonb,'ST-55',false),
  ('ST-061','VARSAYILAN','UI','MOTION','Sayfa geçişi solarak gelir','Sayfa değişince yeni ekran kısa bir soluklaşmayla gelir (~0,25 sn), eskisi anında gider. Kayma, çevirme, büyütme yoktur; üst ve alt çubuk geçişe katılmaz.','','','','Duran öğeler yerinde kalmalı.','nizam','koken_proje',1,false,'["ST-56"]'::jsonb,'ST-56',false),
  ('ST-062','KURAL','UI','MOTION','Liste tek tek belirmez','Kartlar sıraya girip birer birer belirmez; sayfa bir bütün olarak gelir. Yalnızca veriyi anlatan hareketler kalır (ilerleme çubuğunun dolması, sayacın sıfırdan sayması).','','','','Sahneleme dikkat dağıtır ve yavaş hissettirir.','nizam','koken_proje',1,false,'["ST-57"]'::jsonb,'ST-57',false),
  ('ST-063','KURAL','UI','MOTION','Dokunma tepkisi (küçülme)','Basılan öğe hafifçe küçülür; küçülme oranı sabit bir sayı değil öğenin boyuna göredir — küçük öğe daha çok küçülür, büyük öğe az. Koyu temada zemini koyulaştırmak kullanılmaz; dokunmatik cihazda kalan odak halkası kapatılır. Kullanılamaz durumdaki öğe hiç küçülmez.','','','Kullanılamaz öğe.','Sabit oran küçük düğmede fark edilmez, dokunuş cevapsız sanılır.','nizam','koken_proje',2,true,'["ST-54", "ST-58"]'::jsonb,'ST-54',false),
  ('ST-064','KURAL','UI','MOTION','Bekleme (loading) göstergesi','Süren işi anlatan gösterge iş tam bitene kadar oynar; işlem başarılıysa ama ardından sayfa yenileme/yönlendirme/başka bekleme geliyorsa o da bitene kadar durmaz. Aynı işi başlatan düğme iş sürerken ikinci kez çalışmaz; uzun işte yüzdeli çubuk gösterilir. İşin sürdüğü bilgisi yalnız harekete bırakılmaz: öğenin yazısı da o an ne olduğunu söyler. Hareket azaltma (reduced-motion) açıkken animasyonlar kapanır, geriye yazı ve hareketsiz simge kalır.','','','','Erken duran gösterge ''bitti'' der, kullanıcı hâlâ beklerken başka şeye basar; hareketsiz kullanıcı yalnız animasyondan durumu anlayamaz.','nizam','koken_proje',1,true,'["ST-53", "ST-76"]'::jsonb,'ST-53',false),
  ('ST-065','VARSAYILAN','UI','SETTINGS','Geliştirme istekleri Ayarlarda toplanır','Ayarlar''da ''Geliştirme istekleri'' ekranı bulunur: kullanıcı isteğini yazar, liste cihazda birikir, ''Hepsini kopyala'' ile tek metin olarak alınır. Sunucuya gitmez, kimseye gönderilmez.','','','','İstekler tek yerde toplansın, elle iletilsin.','nizam','koken_proje',1,false,'["ST-08"]'::jsonb,'ST-08',false),
  ('ST-066','KURAL','TECH',null,'Commit etiketi: [NS-x]','Her commit mesajı ilgili görevin [NS-x] etiketiyle başlar; Studio commit''i bu etiketten tanıyıp görevi ''Kontrolde''ye çeker.','','','','Görev-commit bağı etiketsiz kurulamaz.','nizam','koken_proje',1,false,'["ST-05"]'::jsonb,'ST-05',true);

  -- Mevcut UNIQUE(alan,ad) kısıtını adını varsaymadan kaldır
  for r in
    select con.conname from pg_constraint con
    join pg_class c on c.oid=con.conrelid
    join pg_namespace ns on ns.oid=c.relnamespace
    where ns.nspname='public' and c.relname='standards' and con.contype='u'
      and coalesce(array_length(con.conkey,1),0) = 2
      and 2 = (select count(*) from unnest(con.conkey) k
               join pg_attribute a on a.attrelid=con.conrelid and a.attnum=k
               where a.attname in ('alan','ad'))
  loop execute format('alter table public.standards drop constraint %I', r.conname); end loop;
  for r in
    select i.indexname from pg_indexes i
    where i.schemaname='public' and i.tablename='standards'
      and i.indexdef ilike '%UNIQUE%(alan, ad)%' and i.indexdef not ilike '%where%'
      and not exists (select 1 from pg_constraint con where con.conname=i.indexname
                      and con.conrelid='public.standards'::regclass)
  loop execute format('drop index if exists public.%I', r.indexname); end loop;

  -- Survivor UUID'leri çöz
  create temporary table _resolve on commit drop as
  select c.kanonik_id,
    coalesce(
      (select s.id from public.standards s where s.kanonik_id=c.kanonik_id limit 1),
      (select s.id from public.standards s join _kodmap m on m.kod=c.survivor_kod
         where s.alan=m.alan and s.ad=m.ad and s.kanonik_id is null limit 1)
    ) as survivor_id
  from _canon c where not c.yeni_insert;

  select count(*) into n from _resolve where survivor_id is null;
  if n>0 then raise exception 'Cozulemeyen survivor sayisi: %', n; end if;

  -- Survivor UPDATE
  update public.standards s set
    ad=c.ad, tarif=c.kural, yerel=c.yerel,
    kanonik_id=c.kanonik_id, tip=c.tip, kategori=c.kategori, aile=c.aile,
    kosul=c.kosul, istisna=c.istisna, neden=c.neden, kapsam=c.kapsam,
    kaynak=c.kaynak, versiyon=c.versiyon, a11y=c.a11y, eski_standartlar=c.eski_std,
    aktif=true
  from _canon c join _resolve rr on rr.kanonik_id=c.kanonik_id
  where s.id=rr.survivor_id;

  -- Yeni INSERT (ST-066)
  insert into public.standards
    (ad, grup, alan, ozet, tarif, yerel, sira, aktif, eklendi, kanonik_id, tip, kategori, aile,
     kosul, istisna, neden, kapsam, kaynak, versiyon, a11y, eski_standartlar)
  select c.ad, m.grup, m.alan, '', c.kural, c.yerel, 0, true, 'canonical-v1',
         c.kanonik_id, c.tip, c.kategori, c.aile, c.kosul, c.istisna, c.neden,
         c.kapsam, c.kaynak, c.versiyon, c.a11y, c.eski_std
  from _canon c join _kodmap m on m.kod=c.survivor_kod
  where c.yeni_insert
    and not exists (select 1 from public.standards s where s.kanonik_id=c.kanonik_id);

  -- task_standards re-point haritası
  create temporary table _repoint on commit drop as
  select s.id as old_uuid, rr.survivor_id as survivor_uuid
  from (
    select ac.kod, ac.kanonik_id
    from (select jsonb_array_elements_text(eski_std) kod, kanonik_id from _canon) ac
    where ac.kod not in (select survivor_kod from _canon where not yeni_insert)
      and ac.kod <> 'ST-75'
  ) loser
  join _kodmap m on m.kod=loser.kod
  join public.standards s on s.alan=m.alan and s.ad=m.ad and s.kanonik_id is null
  join _resolve rr on rr.kanonik_id=loser.kanonik_id;

  update public.task_standards ts set standart_id=rp.survivor_uuid
  from _repoint rp
  where ts.standart_id=rp.old_uuid
    and not exists (select 1 from public.task_standards x
                    where x.gorev_id=ts.gorev_id and x.standart_id=rp.survivor_uuid);

  delete from public.task_standards ts using _repoint rp
  where ts.standart_id=rp.old_uuid
    and exists (select 1 from public.task_standards x
               where x.gorev_id=ts.gorev_id and x.standart_id=rp.survivor_uuid);

  -- Aktiflik
  update public.standards set aktif=(kanonik_id is not null);

  -- Benzersizlik
  create unique index if not exists standards_kanonik_id_key
    on public.standards (kanonik_id) where kanonik_id is not null;
  create unique index if not exists standards_alan_ad_aktif_key
    on public.standards (alan, ad) where aktif;

  -- VALIDATION
  select jsonb_array_length(standards_veri) into v_snap_toplam
    from public.standart_gecmisi where etiket='standart-canonical-v1' order by alindi asc limit 1;
  v_bek_toplam  := v_snap_toplam + 1;
  v_bek_inaktif := v_bek_toplam - 66;

  select count(*) into v_aktif   from public.standards where aktif and kanonik_id is not null;
  select count(*) into v_inaktif from public.standards where not aktif;
  select count(*) into v_toplam  from public.standards;
  select count(*)-count(distinct kanonik_id) into v_dupkan from public.standards where kanonik_id is not null;
  select count(*) into v_aktif_null from public.standards where aktif and kanonik_id is null;
  select count(*) into v_st75_aktif from public.standards s join _kodmap m on m.kod='ST-75'
    where s.alan=m.alan and s.ad=m.ad and (s.aktif or s.kanonik_id is not null);
  select id into v_066 from public.standards where kanonik_id='ST-066';
  select id into v_006 from public.standards where kanonik_id='ST-006';
  select count(*) into v_orphan from public.task_standards ts
    join public.standards s on s.id=ts.standart_id
    where s.kanonik_id is null
      and s.id <> coalesce((select s2.id from public.standards s2 join _kodmap m on m.kod='ST-75'
                            where s2.alan=m.alan and s2.ad=m.ad limit 1), '00000000-0000-0000-0000-000000000000'::uuid);
  select count(*) into v_st75_task from public.task_standards ts
    join public.standards s on s.id=ts.standart_id
    join _kodmap m on m.kod='ST-75' where s.alan=m.alan and s.ad=m.ad;
  select coalesce(sum(c-1),0) into v_dup_task from (
    select count(*) c from public.task_standards group by gorev_id, standart_id) q;
  select count(*) into v_bos_eski from public.standards where aktif and kanonik_id is not null
    and (eski_standartlar is null or eski_standartlar='[]'::jsonb);
  select count(distinct kanonik_id) into v_distinct from public.standards where kanonik_id is not null;

  if v_aktif<>66 then raise exception 'A: aktif canonical %, beklenen 66', v_aktif; end if;
  if v_inaktif<>v_bek_inaktif then raise exception 'B: inaktif %, beklenen %', v_inaktif, v_bek_inaktif; end if;
  if v_toplam<>v_bek_toplam then raise exception 'C: toplam %, beklenen %', v_toplam, v_bek_toplam; end if;
  if v_dupkan<>0 then raise exception 'D: kanonik_id duplicate %', v_dupkan; end if;
  if v_aktif_null>0 then raise exception 'E: aktif ama kanonik_id null %', v_aktif_null; end if;
  if v_st75_aktif>0 then raise exception 'F: ST-075 aktif/canonical gorunuyor'; end if;
  if v_066 is null then raise exception 'G: ST-066 yok'; end if;
  if v_006 is null then raise exception 'G: ST-006 yok'; end if;
  if v_066=v_006 then raise exception 'G: ST-066 ile ST-006 ayni UUID'; end if;
  if v_orphan>0 then raise exception 'I: canonical olmayan satira bagli % task', v_orphan; end if;
  if v_dup_task>0 then raise exception 'J: task_standards duplicate %', v_dup_task; end if;
  if v_bos_eski>0 then raise exception 'K: eski_standartlar bos % canonical', v_bos_eski; end if;
  if v_distinct<>66 then raise exception 'L: distinct canonical %, beklenen 66', v_distinct; end if;

  raise notice 'VALIDATION OK: aktif=% inaktif=% toplam=% distinct=% ST075_task=%',
    v_aktif, v_inaktif, v_toplam, v_distinct, v_st75_task;
end $$;

commit;
