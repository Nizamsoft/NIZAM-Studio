-- ==========================================================================
-- NIZAM | Studio — Adım 4
-- Nizam Standartları ve görevlere bağlanmaları.
-- Supabase → SQL Editor'e yapıştır, bir kez çalıştır.
-- İki kez çalıştırsan da bozulmaz.
-- ==========================================================================

-- 1) Standartlar -----------------------------------------------------------
--    Her standart yazılı bir tariftir. Bir göreve bağlanınca tarifi
--    promptun içine kendiliğinden girer — aynı şeyi her seferinde yazmazsın.

create table if not exists public.standards (
  id          uuid primary key default gen_random_uuid(),
  ad          text        not null unique,
  grup        text        not null default 'Arayüz',
  ozet        text        not null default '',
  tarif       text        not null default '',
  sira        int         not null default 0,
  aktif       boolean     not null default true,
  olusturuldu timestamptz not null default now()
);

-- 2) Görev ↔ standart bağı -------------------------------------------------

create table if not exists public.task_standards (
  gorev_id    uuid not null references public.tasks (id)     on delete cascade,
  standart_id uuid not null references public.standards (id) on delete cascade,
  primary key (gorev_id, standart_id)
);

create index if not exists task_standards_gorev_idx on public.task_standards (gorev_id);

-- 3) Satır güvenliği -------------------------------------------------------

alter table public.standards      enable row level security;
alter table public.task_standards enable row level security;

drop policy if exists "standart okuma" on public.standards;
drop policy if exists "standart yazma" on public.standards;

create policy "standart okuma" on public.standards for select
  using (public.rolum() is not null);

create policy "standart yazma" on public.standards for all
  using (public.rolum() = 'yonetici')
  with check (public.rolum() = 'yonetici');

drop policy if exists "gorev standart okuma" on public.task_standards;
drop policy if exists "gorev standart yazma" on public.task_standards;

create policy "gorev standart okuma" on public.task_standards for select
  using (exists (select 1 from public.tasks t
                 where t.id = gorev_id
                   and (public.rolum() = 'yonetici' or t.atanan = auth.uid())));

create policy "gorev standart yazma" on public.task_standards for all
  using (public.rolum() = 'yonetici')
  with check (public.rolum() = 'yonetici');

-- 4) Hazır standartlar -----------------------------------------------------
--    Tarifler prompta olduğu gibi girer, bu yüzden net ve emir kipinde.
--    Zaten varsa dokunulmaz — kendi düzenlemen korunur.

insert into public.standards (ad, ozet, tarif, sira) values
(
  'Açılış Ekranı',
  'Nizam Standard 1 · Minimal · Animasyonsuz',
  'Ekranın ortasında logo, altında marka adı, en altta ince bir ilerleme çubuğu ve tek satır durum yazısı bulunur. Toplam süre bir saniyeyi geçmez. Zıplayan, dönen, büyüyüp küçülen animasyon yoktur; yalnızca yumuşak bir belirme kullanılır. Açılış bittiğinde ekran silinir, geride iz bırakmaz.',
  1
),
(
  'Login',
  'E-posta + şifre · kayıt ekranı yok',
  'Tek kart içinde logo, marka adı, e-posta ve şifre alanları, tam genişlikte bir giriş düğmesi bulunur. Kayıt olma ekranı yoktur — kullanıcıları yalnızca yönetici ekler. Hatalı girişte kartın içinde kırmızı bir uyarı satırı çıkar; bu uyarı Türkçe ve anlaşılır olmalıdır, hata kodu gösterilmez. Giriş sırasında düğme pasifleşir ve "Giriş yapılıyor…" yazar. Oturum kalıcıdır: sayfa yenilenince tekrar giriş istenmez.',
  2
),
(
  'Menü',
  'Masaüstü sidebar · mobil alt sekme',
  'Masaüstünde solda sabit bir yan menü bulunur: üstte logo ve marka, ortada bölüm bağlantıları, altta kullanıcı kutusu. Aktif bölüm, sol kenarında ince bir kırmızı şeritle belirtilir. Mobilde yan menü gizlenir; yerini alt sekme çubuğu alır — kuralları Alt Sekme Çubuğu standardındadır. Aynı bölüm iki yerde birden gösterilmez.',
  3
),
(
  'Ayarlar',
  'Nizam Standard Settings',
  'Ayarlar tek sütun halinde, başlıklı bölümlerden oluşur: Hesap, Uygulama, Bağlantılar. Her bölüm bir kart içinde satır satır listelenir; solda alan adı, sağda değeri. Değiştirilemeyen bilgiler düz yazı, değiştirilebilenler düğme veya anahtar olarak görünür. Çıkış düğmesi en altta ve sade durur, kırmızı değildir.',
  4
),
(
  'Bildirim Merkezi',
  'Uygulama içi bildirim listesi',
  'Üst çubukta bir zil simgesi bulunur; okunmamış bildirim varsa üzerinde sayı görünür. Tıklanınca açılan listede her satır: kısa başlık, bir cümlelik açıklama ve göreceli zaman (5 dk önce) içerir. Okunmamışlar sol kenarındaki nokta ile ayrılır. Satıra tıklanınca ilgili sayfaya gidilir ve bildirim okundu sayılır. "Tümünü okundu işaretle" seçeneği listenin üstünde durur.',
  5
),
(
  'Excel / PDF Çıktı',
  'Tablo dışa aktarma',
  'Tablonun üstünde tek bir dışa aktar düğmesi bulunur; tıklanınca Excel ve PDF seçenekleri açılır. Çıktı ekranda görünen filtreye ve sıralamaya uyar — tüm veriyi değil, kullanıcının baktığı veriyi verir. Dosya adı "musteri-tablo-YYYY-AA-GG" biçimindedir. Çıktı hazırlanırken düğme pasifleşir ve "Hazırlanıyor…" yazar. PDF çıktısında sayfa başlığı ve tarih üst bilgide yer alır.',
  6
),
(
  'Tarih Filtresi',
  'Gün · Hafta · Ay · Aralık',
  'Dört seçenek sunulur: Gün, Hafta, Ay ve Aralık. Varsayılan "Ay". Aralık seçilirse iki tarih alanı açılır ve bitiş tarihi başlangıçtan önce seçilemez. Filtre değiştiğinde liste anında yenilenir, sayfa yeniden yüklenmez. Seçim adres çubuğunda saklanır ki sayfa yenilendiğinde ya da bağlantı paylaşıldığında aynı görünüm gelsin.',
  7
),
(
  'Dosya Yükleme',
  'Görsel ve belge yükleme',
  'Yükleme alanı hem tıklanabilir hem sürükle-bırak kabul eder. Yüklenmeden önce dosya türü ve boyutu denetlenir; sınır aşılırsa Türkçe uyarı verilir. Görseller küçük önizleme ile listelenir, belgeler simge ve dosya adı ile. Her satırda silme düğmesi bulunur. Yükleme sırasında ilerleme çubuğu görünür ve iptal edilebilir.',
  8
),
(
  'Alt Sekme Çubuğu',
  'Arayüz',
  'Mobil · buzlu cam · ekranın dibine yapışık',
  '900 pikselin altındaki ekranlarda yan menü gizlenir, yerine ekranın altında bir sekme çubuğu gelir; sekme sayısı beşi geçmez. Çubuk yerleşimin parçası değildir, içeriğin üstünde durur ve sayfa altından akıp geçer — bu yüzden sayfa içeriğine çubuk yüksekliği kadar alt pay verilir, son satır çubuğun altında kalmaz. Zemin buzlu camdır: yarı saydam bir katman ve arkasını bulanıklaştıran bir süzgeç; tarayıcı bunu desteklemiyorsa düz koyu zemine düşülür. Her sekmede üstte simge, altında küçük bir yazı bulunur; aktif sekmenin arkasında yumuşak kırmızı bir hap belirir, yazısı ve simgesi kırmızıya döner. Kırmızı bu ekranda yalnızca aktif sekmede kullanılır. Çubuk ekranın fiziksel dibine oturur: ana ekran çizgisinin payı çubuğun dışına değil içine verilir, tarayıcıda ise hiç verilmez çünkü tarayıcının kendi çubuğu zaten oradadır. iOS''ta uygulama kipinde durum çubuğu ayarı black olmalıdır; black-translucent sayfayı ekranın tepesine yapıştırıp altta erişilemeyen bir boşluk bırakır.',
  9
)
on conflict (ad) do nothing;
