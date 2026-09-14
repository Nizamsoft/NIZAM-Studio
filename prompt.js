/* ==========================================================================
   NIZAM | Studio — Prompt motoru
   İki metin üretir:
     1) Görev promptu — geliştirici kopyalar, AI'a yapıştırır
     2) NIZAM.md      — müşteri deposundaki proje kimlik dosyası
   Tek kural: geliştirici hiçbir şey yazmasın, yalnızca yapıştırsın.
   ========================================================================== */

'use strict';

const PROMPT = {

  /* ---- Supabase bağlantısı ----
     Bağlantı kurulum adımında toplanıyor ve ilk bloktan itibaren gidiyor:
     sonradan verilirse kod önce cihaz-içi bir deneme hesabıyla yazılıyor,
     sonra sökülüp bağlanıyor. anon key tarayıcıya zaten iniyor, gizli
     değil; gizli olan service_role Studio'da hiç istenmiyor. */
  baglantiBlogu(proje) {
    const pl = (proje && proje.palet) || {};
    if (!sunuculuMu(proje)) return '';
    const url = String(pl.supabaseUrl || '').trim();
    const anon = String(pl.supabaseAnon || '').trim();

    const s = ['## Supabase Bağlantısı'];
    if (!url || !anon) {
      s.push('> **Bağlantı bilgisi henüz girilmedi.** Deneme hesabı ya da');
      s.push('> geçici bir bağlantı **uydurma**; veriye dokunan bir iş');
      s.push('> geldiğinde dur ve bana sor.');
      return s.join('\n');
    }
    s.push('Bunları `js/yapilandirma.js` içine yaz ve **her yerden oradan oku.**');
    s.push('Başka dosyaya kopyalama, ikinci bir yapılandırma açma.', '');
    s.push(hiza('Proje adresi', url));
    s.push(hiza('anon key', anon));
    s.push('');
    s.push('- **anon key gizli değildir** — tarayıcıya iniyor, depoda durması');
    s.push('  normal. Veriyi satır güvenliği (RLS) koruyor.');
    s.push('- Anahtar `sb_publishable_…` ile başlıyorsa Supabase\'in **yeni**');
    s.push('  biçimidir; eski `eyJhbG…` JWT ile aynı işi görür. `supabase-js`');
    s.push('  sürümünün bu biçimi desteklediğinden emin ol, gerekiyorsa güncelle.');
    s.push('- **service_role anahtarını isteme ve kullanma.** Sana verilmedi;');
    s.push('  gerektiğini düşünüyorsan tasarım yanlıştır, dur ve sor.');
    s.push('- **Cihaz-içi deneme hesabı açma.** Giriş ilk günden Supabase Auth');
    s.push('  ile olsun.');
    return s.join('\n');
  },

  /* ---- Claude'un sorduğu, kullanıcının cevapladığı ----
     Künyede yazmayan ama kod yazılırken karar gerektiren şeyler. Bir kez
     soruldu, bir kez cevaplandı; her bloğa ve kimlik dosyasına giriyor ki
     ikinci kez sorulmasın. */
  cevapBlogu(proje) {
    const pl = (proje && proje.palet) || {};
    const sorular = ((pl.cozum || {}).sorular) || [];
    const cevaplar = pl.cevaplar || {};
    const dolu = sorular.filter(x => (cevaplar[x.soru] || '').trim());
    if (!dolu.length) return '';

    const s = ['## Sorduklarının Cevabı'];
    s.push('Bunları sen sormuştun, ben cevapladım. **Karar verilmiştir** —');
    s.push('yeniden sorma, aksini uygulama.', '');
    dolu.forEach(x => {
      s.push(`- **${x.soru}**`);
      s.push(`  → ${cevaplar[x.soru].trim()}`);
    });
    const bos = sorular.length - dolu.length;
    if (bos) {
      s.push('', `> ${bos} soru henüz cevaplanmadı. Onlara denk gelirsen`);
      s.push('> **uydurma — dur ve sor.**');
    }
    return s.join('\n');
  },

  /* ---- Görsel yerleşimi ----
     Hangi görsel nerede duracak ve dosyası nereden inecek. Adresler imzalı
     ve bir saat geçerli — blok kopyalandıktan sonra bekletilmemeli. */
  gorselBlogu(proje) {
    const pl = (proje && proje.palet) || {};
    /* G0 ChatGPT'ye giden kaynak görsel; tarif ona yer verdiyse zaten
       başka bir numarayla listede. İki kez indirtmenin anlamı yok. */
    const yuvalar = (pl.gorseller || []).filter(y => y.yol && y.no !== 'G0');
    /* Logo sihirbazda alınıyor ve Studio'da duruyordu ama hiçbir bloğa
       girmiyordu: kodu yazan onu göremediği için açılışta, girişte ve üst
       çubukta yerini boş bırakıyordu. Artık ilk sırada. */
    const logo = ((typeof DB !== 'undefined' && DB.logoAdres) || {})[proje.id] || '';
    if (!yuvalar.length && !logo) return '';

    const s = ['## Görseller'];
    s.push('Aşağıdaki görselleri **indir ve depoya koy**. Her birinin nerede');
    s.push('kullanılacağı yazıyor; başka yere koyma, kırpma, rengini değiştirme.');
    s.push('');
    if (logo) {
      s.push('### Logo');
      s.push(hiza('Dosya', 'logo.png'));
      s.push(hiza('Yer', 'Açılış ekranı, giriş kartı, üst çubuktaki amblem, '
        + 'favicon ve PWA simgesi'));
      s.push(hiza('İndir', logo));
      s.push('');
      s.push('Firmanın kendi logosu — **yeniden çizme, sadeleştirme, rengini');
      s.push('değiştirme.** Simge boyutlarında (16-512px) net görünsün diye');
      s.push('gereken yerde kendi kopyalarını üret ama çizimi bozma.');
      s.push('');
    }
    yuvalar.forEach(y => {
      s.push('### ' + y.no + ' · ' + (y.ad || 'Görsel'));
      s.push(hiza('Dosya', y.dosya));
      s.push(hiza('Yer', y.tarif || '—'));
      /* Aynı dosyayı paylaşan yuvalar olabilir (G1 = G0'ın dosyası);
         kendi anahtarında adres yoksa aynı yolu gösterenden al. */
      const harita = (typeof DB !== 'undefined' && DB.gorselAdres) || {};
      let adres = harita[proje.id + '/' + y.no] || '';
      if (!adres) {
        const es = (pl.gorseller || []).find(x => x.yol === y.yol && harita[proje.id + '/' + x.no]);
        if (es) adres = harita[proje.id + '/' + es.no];
      }
      if (adres) s.push(hiza('İndir', adres));
      s.push('');
    });
    s.push('Adresler **bir saat** geçerli. İlk iş olarak indir; sonra kodda');
    s.push('göreli yoldan çağır (`./gorsel-1.jpg`), kök yol kullanma.');
    s.push('Adres açılmıyorsa dur ve söyle — kırık bağlantıyla devam etme.');
    return s.join('\n');
  },

  /* Nizam standardı — her projede aynı. Kurulum promptuna ve NIZAM.md'ye
     girer. Kaynak Supabase'deki tablo; tablo boşsa koddaki tohuma düşer
     (bkz. standartListesi). İki eksende yazılır: önce grup, grubun içinde
     alan — AI'ın "alt çubuk kuralları" diye arayacağı yer orası. */
  teknikBlogu(proje) {
    const pl0   = (proje && proje.palet) || {};
    const yerel = pl0.veriKatmani === 'Yerel tarayıcı';

    const s = ['## Nizam Standardı'];
    s.push('Bunlar Nizam Soft standardı. Tartışma, değiştirme, alternatif önerme —');
    s.push('gerekiyorsa önce sor.');
    if (yerel) {
      s.push('');
      s.push('> **Bu proje sunucusuz.** Veri kullanıcının tarayıcısında kalıyor;');
      s.push('> Supabase, kimlik doğrulama ve gerçek zamanlı yok. Aşağıdaki');
      s.push('> satırlar buna göre yazıldı.');
    }
    s.push('');

    DB.standartGruplari(standartListesi()).forEach(g => {
      const satir = [];
      g.alanlar.forEach(a => {
        a.liste.forEach(st => {
          /* Sunucusuz projede `yerel` metni tarifin yerine geçer. Yalnız
             yerelde anlamı olan satırlar (Yedek gibi) sunuculu projede
             boş kalır ve hiç yazılmaz. Başlık da `yerel`den okunmalı —
             yoksa başlık bulut varsayımında kalıp açıklamayla çelişiyordu
             ("Giriş · E-posta + şifre" başlığı, altında "Yerel PIN" yazısı). */
          const yerelMi = yerel && st.yerel;
          const t = yerelMi ? st.yerel : st.tarif;
          if (!t) return;
          /* `yerel` alanı "Değer. Açıklama" biçiminde tek metin — tohumda
             da (standartTohum) aynı şekilde birleştiriliyor. */
          const nokta = yerelMi ? String(st.yerel).indexOf('. ') : -1;
          const baslik = nokta > -1 ? st.yerel.slice(0, nokta) : (yerelMi ? st.yerel : st.ad);
          const aciklama = nokta > -1 ? st.yerel.slice(nokta + 2) : (yerelMi ? '' : t);
          satir.push('- **' + a.ad + ' · ' + baslik + '**');
          if (aciklama) satir.push('  - ' + String(aciklama).replace(/\n+/g, ' '));
        });
      });
      if (!satir.length) return;
      s.push('### ' + g.ad);
      satir.forEach(x => s.push(x));
      s.push('');
    });

    const pl = (proje && proje.palet) || {};
    const ozel = TEKNIK_ALAN.filter(a => pl[a.anahtar] && a.anahtar !== 'veriKatmani');
    if (ozel.length) {
      s.push('', '### Bu projeye özel');
      ozel.forEach(a => {
        if (a.tur !== 'katman') { s.push(`- **${a.ad}:** ${pl[a.anahtar]}`); return; }
        const r = rolListesi(pl[a.anahtar]);
        s.push(`- **${a.ad}:** ${r.length} katman, en alttan en üste:`);
        r.forEach((ad, i) => s.push(`  ${i + 1}. ${ad}`));
        s.push('  - Üstteki katman, alttakinin gördüğü her şeyi görür.');
        if (yerel) {
          s.push('  - Sunucu yok: yetki yalnız arayüzde uygulanır, veritabanı kuralı yazılamaz.');
        } else {
          s.push('  - Yetki veritabanı kurallarıyla (RLS) uygulanır, yalnız arayüzde gizlemekle değil.');
        }
      });
    }
    const eksik = TEKNIK_ALAN.filter(a => !pl[a.anahtar] && a.anahtar !== 'veriKatmani');
    if (eksik.length) {
      s.push('', `> Şunlar henüz belirlenmedi: ${eksik.map(a => a.ad).join(', ')}.`);
      s.push('> Bunlara ihtiyaç duyduğunda uydurma — sor.');
    }
    return s.join('\n');
  },

  /* Depo durağının tanışma promptu. Yapı (durak 4) henüz yapılmadı; buraya
     ondan hiçbir şey girmez. Amaç yalnızca depoyu tanıtmak ve NIZAM.md'yi
     kurmak. Profesyonel tasarım (durak 6) ayrı bir akış — bu promptun
     zincirine dahil değil. */
  tanisma(projeId) {
    const p = DB.proje(projeId);
    if (!p) return '';
    /* Şablon kopyasında depo zaten dolu — "sıfırdan proje" promptu yanlış
       oturum verir. Bağlantılar ve temel'de Claude bilerek en sona alınıyor
       (bkz. app.js sablonMu/baglantiAdimListesi) ki bu ayrı prompt Supabase/
       yayın bilgisinin hepsini eldeyken tek seferde yazabilsin. */
    if ((p.palet || {}).sablon) return PROMPT.sablonTanisma(p);

    const s = [];
    s.push('# ' + projeAdi(p) + ' — proje başlangıcı', '');

    /* Claude Code yeni oturumu en son kullanılan depoyla açabiliyor.
       Hangi depoda çalışılacağı en tepede, tartışmasız yazsın. */
    const slug = depoSlug(p.repo);
    if (slug) {
      s.push('> ### Depo: `' + slug + '`');
      s.push('> Bu oturum **yalnız bu depoya** bağlı olmalı. Oturumun deposu');
      s.push('> farklıysa: bu oturuma hedef depoyu **ekleme**, dosya oluşturma,');
      s.push('> commit atma. Dur ve "oturum yanlış depoda" de — doğru depoyla');
      s.push('> yeni bir oturum açacağım. Depo doğruysa aşağıdakileri yap.');
    } else {
      s.push('> ### Depo henüz bağlanmadı');
      s.push('> Hangi depoda çalışacağımızı sana söylemedim. Dosya oluşturmadan');
      s.push('> önce bana depo adresini sor ve onayımı al.');
    }
    s.push('');

    s.push('Bu deponun ilk oturumu. Kod yazmanı **istemiyorum**; şimdilik yalnız');
    s.push('projeyi tanı ve kimlik dosyasını kur.', '');

    s.push('## Proje');
    s.push(hiza('Firma', p.firma));
    if (modulAdi(p)) s.push(hiza('Ürün', modulAdi(p)));
    if (p.sektor)    s.push(hiza('Sektör', p.sektor));
    s.push(hiza('Platform', PLATFORM_ADI[p.platform] || '—'));
    s.push(hiza('Veritabanı', VERI_ADI[p.veri] || '—'));
    s.push(hiza('Depo', p.repo || 'BELİRLENMEDİ — sor'));
    s.push(hiza('Arayüz dili', 'Türkçe'));
    s.push('');

    s.push(PROMPT.teknikBlogu(p));
    s.push('');

    const baglanti = PROMPT.baglantiBlogu(p);
    if (baglanti) { s.push(baglanti); s.push(''); }

    s.push('## Şimdi ne yapacaksın', '');
    s.push('Kimlik tek dosyada tutulmuyor: yirmi iki sayfalık bir modülde o');
    s.push('dosya iki bin satıra çıkıyor ve her oturum baştan okumak zorunda');
    s.push('kalıyor. Bölüyoruz — her oturum yalnız ihtiyacı olan dosyayı açsın.', '');
    s.push('**1 · `CLAUDE.md`** — depo köküne, **20 satırı geçmesin.** Yalnız');
    s.push('   şunlar: firma ve ürün adı, tek cümle tarif, ve diğer dosyaların');
    s.push('   nerede olduğu. Claude Code bunu her oturumda kendiliğinden');
    s.push('   okuyor; kısa kalması önemli.', '');
    s.push('**2 · `NIZAM.md`** — proje kimliği: yukarıdaki proje bilgileri ve');
    s.push('   teknik standart. Sonuna `## Dosyalar` başlığı ekle ve altında');
    s.push('   `nizam/` içindeki dosyaları neyin nerede olduğuyla listele.', '');
    s.push('**3 · `nizam/` klasörü.**', '');
    s.push('- `nizam/tasarim.md` — **şimdi gerçekten doldur.** Teknik standarda');
    s.push('  uyan, basit ve tutarlı bir taslak tasarım sistemi yaz: renk');
    s.push('  paleti, tipografi, boşluk/ölçü skalası, temel bileşenler (buton,');
    s.push('  kart, liste, form), ikon üslubu, sayfa iskeletleri, geçişler.');
    s.push('  **Açık tema.** Müşteri uygulamaları her zaman açık temadır —');
    s.push('  koyu tema seçme. (Studio\'nun kendi teması ayrı, bunu etkilemez.)');
    s.push('  **Marka kimliği uydurma** — nötr ve profesyonel bir varsayılan');
    s.push('  yeter. Bu taslak ileride "Profesyonel tasarım" aşamasında');
    s.push('  görsellerle, ikonlarla ve gerçek marka rengiyle güncellenecek;');
    s.push('  şimdilik kod yazmaya yetecek kadar net olsun.');
    s.push('- `nizam/sayfalar.md` — modüller ve sayfa künyeleri. Başına başlık');
    s.push('  ve *"henüz belirlenmedi"* satırı yaz.');
    s.push('- `nizam/kararlar.md` — arayüz kararları ve verilmiş cevaplar.');
    s.push('  Başına başlık ve *"henüz belirlenmedi"* satırı yaz.');
    s.push('- `nizam/durum.md` — hangi aşama bitti, ne kaldı. Başına başlık ve');
    s.push('  *"henüz belirlenmedi"* satırı yaz.', '');
    s.push('**4 · `README.md`** — kısa: firma adı, ürün adı, tek cümle tarif.', '');
    s.push('**5 ·** Tek commit\'le **`main` dalına** gönder. Commit mesajı:');
    s.push('   `[' + TASK_PREFIX + '-0] Proje kimliği`. Oturuma ayrı bir dal atanmış');
    s.push('   olabilir; bu depo yeni, ayrı dala ve pull request\'e gerek yok.', '');
    s.push('**6 ·** Dur ve bekle.', '');

    s.push('## Şunları yapma');
    s.push('- **Uygulama kodu yazma.** Ekran, bileşen, veritabanı şeması, hiçbiri.');
    s.push('- **Marka kimliği uydurma.** Logo yok, özel renk yok — `nizam/tasarim.md`');
    s.push('  için nötr bir taslak yeter, gerçek kimlik ileride gelecek.');
    s.push('- **Sayfa ya da modül uydurma.** Hangi ekranların olacağı henüz belli değil.');
    s.push('- **Bu oturuma başka depo ekleme.** Tek depo, tek oturum.');
    s.push('- Eksik gördüğün bir şeyi tahmin etme; not al, sonra sor.');
    s.push('');

    s.push('## Sırada ne var');
    s.push('Bundan sonra sana bir blok daha yapıştıracağım: **modüller, sayfalar');
    s.push('ve künyeleri** — hangi ekranlar olacak, her birinde hangi alanlar');
    s.push('duracak, kim ne yapabilecek. `nizam/sayfalar.md` ve');
    s.push('`nizam/kararlar.md`\'yi o blok dolduracak; uygulama kodu ancak ondan');
    s.push('sonra, aşama aşama yazılacak.');
    s.push('');
    s.push('> `nizam/tasarim.md`\'yi az önce doldurdun — bu bir taslak.');
    s.push('> İleride "Profesyonel tasarım" aşamasında üstüne yazılıp gerçek');
    s.push('> görsel kimlikle güncellenecek. Şimdilik bu taslakla ilerle.');
    s.push('');
    s.push('Anladıysan tek cümleyle onayla, dosyaları oluştur ve bekle.');

    return s.join('\n');
  },

  /* Şablon kopyası için tanışma promptu. Depo boş değil — çalışan bir
     programın birebir kopyası. Bağlantılar ve temel'de Claude en sona
     alındığı için buraya kadar GitHub/Yayın/(varsa) Supabase/Namecheap
     zaten kurulmuş oluyor; bu prompt onları tek seferde ortama yazdırıp
     depoyu yeni firmaya bağlıyor. Yapıya (modül/sayfa/tasarım) dokunmuyor —
     o iş ayrı bir "Değişim" promptunda (bkz. PROMPT.sablonDegisim). */
  sablonTanisma(p) {
    const pl    = p.palet || {};
    const slug  = depoSlug(p.repo);
    const yayin = pl.alanAdi || '';

    const s = [];
    s.push('# ' + projeAdi(p) + ' — şablondan uyarlama', '');
    if (slug) {
      s.push('> ### Depo: `' + slug + '`');
      s.push('> Bu oturum yalnız bu depoya bağlı olmalı. Deposu farklıysa dur');
      s.push('> ve söyle.', '');
    }

    s.push('Bu depo **sıfırdan bir proje değil** — çalışan bir muhasebe');
    s.push('programının birebir kopyası. Amacımız bu kopyayı ');
    s.push((p.firma ? '**' + p.firma + '**' : 'yeni bir firma') + ' için uyarlamak.');
    s.push('Kod yapısını, sayfaları ve modülleri **değiştirmeyeceksin** —');
    s.push('sadece bu firmaya özel olanı uygulayacaksın.', '');

    s.push('Şimdilik uygulama kodu yazma. Az sonra sana ayrı bir "Değişim"');
    s.push('promptu gelecek; şube/kullanıcı/hesap planı, POS okuyucu, banka');
    s.push('ve fatura&kart yapıları gibi bu firmaya özel her şeyi tek seferde');
    s.push('koda işleyecek. Şimdi tek işin: aşağıdaki bağlantı bilgilerini');
    s.push('depoya yazıp ortamı bu firmaya bağlamak.', '');

    s.push('## Yeni firma');
    s.push(hiza('Firma', p.firma || 'BELİRLENMEDİ'));
    if (p.sektor)  s.push(hiza('Sektör', p.sektor));
    if (p.telefon) s.push(hiza('Telefon', p.telefon));
    if (p.eposta)  s.push(hiza('E-posta', p.eposta));
    s.push('');
    s.push('Depoda eski firmaya ait görünür bir iz varsa (isim, iletişim,');
    s.push('footer, sayfa/sekme başlığı, manifest, README) yukarıdaki yeni');
    s.push('bilgiyle değiştir. Marka rengi, logo ve görselleri **şimdi');
    s.push('değiştirme** — onlar "Profesyonel tasarım" aşamasında ayrıca');
    s.push('gelecek.', '');

    const baglanti = PROMPT.baglantiBlogu(p);
    if (baglanti) { s.push(baglanti); s.push(''); }

    if (yayin) {
      s.push('## Yayın adresi');
      s.push(hiza('Adres', 'https://' + yayin));
      s.push('Uygulama buraya yayınlanacak; ortam ya da yapılandırma');
      s.push('dosyalarında geçen eski adresi bu adresle değiştir.', '');
    }

    s.push('## Şimdi ne yapacaksın');
    s.push('1. Depoyu incele, mevcut kimlik dosyalarını (`CLAUDE.md`,');
    s.push('   `NIZAM.md`, `nizam/` klasörü) oku.');
    s.push('2. Yukarıdaki bağlantı bilgilerini (varsa Supabase, yayın adresi)');
    s.push('   ortama işle.');
    s.push('3. Eski firmaya ait görünür izleri yeni firma bilgisiyle değiştir.');
    s.push('4. `NIZAM.md`\'ye bu deponun artık ' + (p.firma || 'bu firma')
      + ' için uyarlandığını tek satır not düş.');
    s.push('5. Tek commit\'le **`main` dalına** gönder:');
    s.push('   `[' + TASK_PREFIX + '-0] Şablon uyarlaması — bağlantılar`');
    s.push('6. Dur ve bekle — "Değişim" promptu az sonra gelecek.', '');

    s.push('## Şunları yapma');
    s.push('- Yeni sayfa, modül ya da özellik uydurma.');
    s.push('- Marka rengi, logo, görsel değiştirme.');
    s.push('- Veritabanı şemasını değiştirme.', '');

    s.push('Anladıysan tek cümleyle onayla ve bekle.');

    return s.join('\n');
  },

  /* Kod yazmayı İSTER: beta sürüm buradan çıkar. */
  yapi(projeId) {
    const p = DB.proje(projeId);
    if (!p) return '';

    const s = [];
    s.push('# ' + projeAdi(p) + ' — Modüller ve sayfalar', '');

    const slug = depoSlug(p.repo);
    if (slug) {
      s.push('> ### Depo: `' + slug + '`');
      s.push('> Bu oturum yalnız bu depoya bağlı olmalı. Deposu farklıysa dur');
      s.push('> ve söyle; başka depo ekleme, dosya oluşturma, commit atma.');
      s.push('');
    }

    const yayin = (p.palet || {}).alanAdi;
    if (yayin) {
      s.push('> ### Yayın adresi: `https://' + yayin + '`');
      s.push('> GitHub Pages projeyi **alt klasörden** yayınlıyor. Bu yüzden');
      s.push('> bütün yollar **göreli** olsun: `style.css`, `./app.js`, `./icon.png`.');
      s.push('> Kök yol (`/style.css`) kullanma — yayında kırılır. Servis işçisinin');
      s.push('> önbelleklediği yollar ve PWA manifestindeki `start_url` de göreli olsun.');
      s.push('> Depo köküne boş bir `.nojekyll` dosyası ekle; yoksa GitHub bazı');
      s.push('> dosyaları yok sayar.');
      s.push('');
    }

    s.push('Söz verdiğim son blok bu. Hangi ekranların olacağı, her birinde');
    s.push('hangi bilgilerin duracağı ve kimin ne yapabileceği aşağıda.');
    s.push('**Bu blokla birlikte kod yazmaya başlıyorsun** — çıkacak şey');
    s.push('müşteriye denetilecek ilk çalışan sürüm, yani beta.', '');

    const kunye = PROMPT.kunyeBlogu(p);
    if (kunye) { s.push(kunye); s.push(''); }

    s.push(PROMPT.yetkiBlogu(p));
    s.push('');

    const cevap = PROMPT.cevapBlogu(p);
    if (cevap) { s.push(cevap); s.push(''); }

    s.push('## Şimdi ne yapacaksın', '');
    s.push('**Kod yazma.** Bu blok da bilgi taşıyor; kod aşama aşama, ayrı');
    s.push('oturumlarda yazılacak.', '');
    s.push('**1 · `nizam/sayfalar.md`** — *"henüz belirlenmedi"* satırını sil,');
    s.push('   yukarıdaki modül kurallarını ve sayfa künyelerini oraya yaz.');
    s.push('   Her sayfa kendi `###` başlığı altında dursun ki tek sayfa');
    s.push('   aranıp bulunabilsin.', '');
    s.push('**2 · `nizam/kararlar.md`** — Yetkiler ekranı kuralları ve varsa');
    s.push('   verilmiş cevaplar oraya.', '');
    s.push('**3 · `nizam/durum.md`** — beş aşamayı liste hâlinde yaz, hepsi');
    s.push('   *bekliyor* olarak. Biçim:', '');
    s.push('   ```');
    KURULUM_ADIM.forEach((a, i) => s.push(`   - [ ] ${i + 1}. ${a.ad}`));
    s.push('   ```');
    s.push('   Altına "Son oturumda ne yapıldı" diye boş bir bölüm aç.', '');
    const bg = PROMPT.baglantiBlogu(p);
    if (bg) {
      s.push('**4 · `sql/01-tablolar.sql`** — künyedeki alanlardan veritabanı');
      s.push('   şemasını yaz: tablolar, sütun türleri, foreign key\'ler,');
      s.push('   indeksler ve **her tabloda satır güvenliği (RLS)**. Sonuna');
      s.push('   yetki tablolarını da ekle.', '');
      s.push('   > Dosya **baştan sona bir kerede çalıştırılabilir** olsun:');
      s.push('   > `create table if not exists`, `drop policy if exists` gibi');
      s.push('   > yeniden çalıştırmaya dayanıklı yaz. Ben Supabase\'in SQL');
      s.push('   > editörüne yapıştırıp çalıştıracağım — sen çalıştıramazsın.', '');
      s.push('   > `js/yapilandirma.js` dosyasını da aç ve yukarıdaki bağlantı');
      s.push('   > bilgilerini yaz. Kod ilk günden gerçek veritabanına bağlansın.', '');
      s.push('**5 · `NIZAM.md`** içindeki `## Dosyalar` listesini güncelle.', '');
      s.push('**6 ·** Tek commit\'le **`main` dalına** gönder:');
      s.push('   `[' + TASK_PREFIX + '-0] Sayfalar, kararlar ve şema`', '');
    } else {
      s.push('**4 · `NIZAM.md`** içindeki `## Dosyalar` listesini güncelle.', '');
      s.push('**5 ·** Tek commit\'le **`main` dalına** gönder:');
      s.push('   `[' + TASK_PREFIX + '-0] Sayfalar ve kararlar`', '');
    }
    s.push('**6 ·** Dur. Bundan sonra her aşama için sana kısa bir komut');
    s.push('   vereceğim; gereken dosyayı kendin açacaksın.', '');

    s.push('## Şunları yapma');
    s.push('- **Uygulama kodu yazma.** Bu blok bilgi taşıyor; kod sırada.');
    s.push('- **Görsel dili değiştirme.** `nizam/tasarim.md` neyse o.');
    s.push('- **Künyede olmayan alan, sayfa ya da modül ekleme.** Alan listesi o');
    s.push('  sayfanın veritabanı tablosudur; eksik gördüğün bir şey varsa sor.');
    s.push('- **Emin olmadığını uydurma.** Künyede yazmayan bir karar gerekiyorsa');
    s.push('  dur ve sor; yanlış tahmin sonradan söküp yeniden yazmak demek.');
    s.push('- **Bu oturuma başka depo ekleme.** Tek depo, tek oturum.');

    return s.join('\n');
  },

  /* ---------- Aşama promptu ----------
     Kod beş aşamada yazılıyor ve her aşama **ayrı oturumda**: tek oturumda
     beşini yaparsan konuşma binlerce satıra çıkıyor, her yeni mesajda
     tamamı yeniden gönderiliyor ve model yavaşlıyor. Bu prompt kısa —
     bilgiyi taşımıyor, nereden okunacağını söylüyor. */
  asama(projeId, no) {
    const p = DB.proje(projeId);
    if (!p) return '';
    const a = kurulumAdimListesi(p)[no];
    if (!a) return '';
    const slug = depoSlug(p.repo);

    const s = [];
    s.push(`# Aşama ${no + 1} — ${a.ad}`, '');
    if (slug) {
      s.push('> ### Depo: `' + slug + '`');
      s.push('> Bu oturum yalnız bu depoya bağlı olmalı. Deposu farklıysa dur');
      s.push('> ve söyle.', '');
    }
    s.push('Proje bilgisi depoda duruyor, ben burada tekrar yazmıyorum —');
    s.push('konuşma geçmişine değil dosyalara güven. Şunları oku:', '');
    s.push('- `nizam/durum.md` — nerede kaldığımız');
    s.push('- `nizam/tasarim.md` — renk, ölçü, bileşen ve iskeletler');
    s.push('- `nizam/sayfalar.md` — bu aşamada dokunacağın sayfaların künyesi');
    s.push('- `nizam/kararlar.md` — arayüz kararları ve verilmiş cevaplar');
    s.push('- `NIZAM.md` — teknik standart');
    if (sunuculuMu(p)) s.push('- `js/yapilandirma.js` — Supabase bağlantısı');
    s.push('');
    s.push('> **Sayfalar dosyasının tamamını okuma.** Bu aşamada hangi');
    s.push('> sayfalara dokunacaksan yalnız onların bölümünü aç.', '');

    s.push('## Bu aşamada yapılacaklar', '');
    a.yap.forEach(x => s.push('- ' + x));
    s.push('');
    s.push(`> **Bitince bana test ettir:** ${a.test}`, '');

    s.push('## Kurallar', '');
    s.push('- **Yalnız bu aşama.** Sonraki aşamanın işine girme; ters giden');
    s.push('  şey beş bin satır sonra değil, burada anlaşılsın.');
    s.push('- **Tasarım kararı verme.** `nizam/tasarim.md` neyse o. Orada');
    s.push('  yazmayan bir şey gerekiyorsa uydurma, sor.');
    s.push('- **Künyede olmayan alan, sayfa ya da modül ekleme.**');
    s.push('- Renk ve ölçüleri tek değişken dosyasından oku; ekranda');
    s.push('  yeniden tanımlama.');
    if (sunuculuMu(p)) {
      s.push('- **Deneme hesabı ya da sahte veri uydurma.** Bağlantı');
      s.push('  `js/yapilandirma.js` içinde; tablolar Supabase\'de kurulu.');
      s.push('  Bir şey eksikse dur ve sor.', '');
    } else {
      s.push('- **Deneme hesabı ya da sahte veri uydurma.** Bu proje sunucusuz');
      s.push('  — veri tarayıcıda (yerel) tutulur, Supabase yok. Bir şey');
      s.push('  eksikse dur ve sor.', '');
    }

    s.push('## Bitirince', '');
    s.push('1. `nizam/durum.md` içinde bu aşamayı işaretle ve "Son oturumda ne');
    s.push('   yapıldı" bölümünü güncelle — sonraki oturum oradan devam edecek.');
    s.push('2. Tek commit\'le **`main` dalına** gönder:');
    s.push(`   \`[${TASK_PREFIX}-0] ${a.ad}\``);
    s.push('3. Ne yaptığını birkaç cümleyle özetle ve dur. Sıradaki aşamayı');
    s.push('   ben başlatacağım.');

    return s.join('\n');
  },

  /* ---------- Tek görev promptu ----------
     Görev kartındaki "Prompt Kopyala" düğmesinden. Beş aşama bittikten
     sonra proje/modül/sayfa için açılan tek tük görevler için — kimlik
     tek dosyada tutulmuyor, burada da tekrar yazmıyoruz: Claude nizam/
     klasöründen okusun. */
  gorev(gorevId) {
    const g = DB.gorev(gorevId);
    if (!g) return '';
    const p = DB.proje(g.proje_id);
    if (!p) return '';

    const modul = g.modul_id ? DB.moduller.find(m => m.id === g.modul_id) : null;
    const sayfa = g.sayfa_id ? DB.sayfalar.find(s => s.id === g.sayfa_id) : null;
    const stdlar = DB.gorevinStandartlari(gorevId);
    const no = TASK_PREFIX + '-' + g.no;
    const slug = depoSlug(p.repo);

    const s = [];
    s.push(`# Görev ${no} — ${g.baslik}`, '');
    if (slug) {
      s.push('> ### Depo: `' + slug + '`');
      s.push('> Bu oturum yalnız bu depoya bağlı olmalı. Deposu farklıysa dur');
      s.push('> ve söyle.', '');
    }

    s.push('Proje bilgisi depoda duruyor; burada tekrar yazmıyorum. Şunları oku:', '');
    s.push('- `nizam/durum.md` — nerede kaldığımız');
    s.push('- `nizam/tasarim.md` — renk, ölçü, bileşen ve iskeletler');
    s.push('- `nizam/sayfalar.md` — ' + yerYaz(modul, sayfa) + ' bölümünün künyesi');
    s.push('- `nizam/kararlar.md` — arayüz kararları ve verilmiş cevaplar');
    s.push('- `NIZAM.md` — teknik standart');
    if (sunuculuMu(p)) s.push('- `js/yapilandirma.js` — Supabase bağlantısı');
    s.push('');
    s.push('> **Sayfalar dosyasının tamamını okuma.** Yalnız bu görevin ilgili');
    s.push('> bölümünü aç.', '');

    s.push('## Görev', '');
    s.push(hiza('Yeri', yerYaz(modul, sayfa)));
    if (g.oncelik === 'acil') s.push(hiza('Öncelik', 'ACİL'));
    s.push('');
    if (g.aciklama) {
      s.push('Ne yapılacak:');
      s.push('> ' + g.aciklama.trim().split('\n').join('\n> '));
      s.push('');
    }

    if (stdlar.length) {
      s.push(stdlar.length === 1 ? '## Kullanılacak Nizam Standardı' : '## Kullanılacak Nizam Standartları', '');
      stdlar.forEach(st => {
        s.push(`### ${st.ad}`);
        s.push(st.tarif || st.ozet || '');
        s.push('');
      });
    }

    s.push('## Kurallar', '');
    s.push('- **Tasarım kararı verme.** `nizam/tasarim.md` neyse o; yeni renk,');
    s.push('  yazı tipi ya da bileşen düzeni getirme.');
    s.push('- **Künyede olmayan alan, sayfa ya da modül ekleme.**');
    s.push('- **Emin olmadığını uydurma.** Gerekiyorsa dur ve sor.', '');

    s.push('## Bitirince', '');
    s.push('1. Commit mesajının başına `[' + no + ']` yaz — Studio bu etiketi');
    s.push('   arayıp görevi kendiliğinden "Kontrolde"ye çekiyor.');
    s.push('2. `nizam/durum.md`\'yi güncelle: bu görevde ne değişti.');
    s.push('3. Tek commit\'le **`main` dalına** gönder.');

    return s.join('\n');
  },

  /* Kurulum aşamaları — hem görev promptunda hem NIZAM.md'de yazar. */
  kurulumBlogu(proje) {
    const s = ['### Nasıl kodlanacak — beş aşama'];
    s.push('');
    s.push('**Hepsini bir seferde yazma.** Aşağıdaki beş aşamaya böl. Her aşamanın');
    s.push('sonunda dur, ne yaptığını özetle ve kullanıcıdan denemesini iste.');
    s.push('Onay gelmeden sonraki aşamaya geçme. Bir şey ters gittiyse 5000 satır');
    s.push('sonra değil, o aşamada anlaşılsın.');
    s.push('');
    kurulumAdimListesi(proje).forEach((a, i) => {
      s.push(`#### ${i + 1}. ${a.ad}`);
      a.yap.forEach(x => s.push(`- ${x}`));
      s.push(`> **Kullanıcıya test ettir:** ${a.test}`);
      s.push('');
    });
    s.push('Her aşamanın içinde "Uygulama sırası" bölümündeki sırayı izle.');
    s.push('Bir sonraki görevde bu kararlar aynen geçerli olacak.');
    s.push('');
    s.push(PROMPT.yetkiBlogu(proje));
    return s.join('\n');
  },

  /* Kullanıcı ekleme ve katmanlar burada, ilk kurulumda kuruluyor —
     kısıtlamalar (kim ne yapabilir) ise ayrı, sonraki bir "Yetkilendirme"
     promptuyla gelecek (bkz. PROMPT.yetkiKur). Bilerek ikiye bölündü: hangi
     katmanların olduğu ve nasıl kullanıcı ekleneceği baştan belli, ama
     kısıtlamalar müşteriyle konuşulduktan sonra, ayrı bir görevle netleşiyor —
     ikisini aynı anda istemek ya tahmin ettirir ya da işi geciktirir. */
  yetkiBlogu(proje) {
    const roller = rolListesi(proje && (proje.palet || {}).roller);
    const sunuculu = proje ? sunuculuMu(proje) : true;
    const pl = (proje && proje.palet) || {};

    /* Rol katmanı tanımlanmamışsa (eski proje) ya da sunucusuzsa (yerel
       projede hesap/kullanıcı sistemi kurulamaz) proje tek kullanıcılık
       demektir: kullanıcı ekleme, katman, giriş kilidi gibi hiçbir şey
       buna göre kurulmasın. */
    if (proje && (!roller.length || !sunuculu)) {
      const s = ['### Giriş ve yetki — yok'];
      s.push('');
      if (!sunuculu) {
        s.push('Bu proje sunucusuz: hesap/kullanıcı sistemi kurulamaz —');
        s.push('roller tanımlanmış olsa bile **tek kullanıcılık.** Kullanıcı');
        s.push('listesi, katman atama, giriş ekranı gibi hiçbir şey kurma —');
        s.push('uygulama açılır açılmaz kullanılır.');
      } else {
        s.push('Bu projede rol katmanı tanımlanmadı: **tek kullanıcı, giriş');
        s.push('ekranı yok.** Kullanıcı listesi, katman atama gibi hiçbir şey');
        s.push('kurma — herkes uygulamayı açtığında her şeyi görsün ve yapsın.');
      }
      return s.join('\n');
    }

    const s = ['### Kullanıcı ekleme — uygulamanın içinde'];
    s.push('');
    s.push('Uygulamada bir **Ayarlar → Kullanıcı ekle** ekranı olacak. Kimin');
    s.push('neyi yapabileceğine **şimdi karar verme** — o, ayrı bir');
    s.push('"Yetkilendirme" promptuyla sonra gelecek. Şimdi yalnız altyapıyı');
    s.push('kur:');
    s.push('');
    s.push('- **Kullanıcı listesi.** Admin kullanıcı ekler, siler, pasife alır.');
    s.push('- **Katman ataması.** Yeni kullanıcı eklenirken şu katmanlardan');
    s.push('  biri seçilir: ' + roller.map(r => '**' + r + '**').join(', ') + '.');
    s.push('- **Ekleme mekanizması.** Tarayıcıdan normal `signUp()` çağırma —');
    s.push('  admin\'in kendi oturumunu bozar. Bunun yerine bir **Edge');
    s.push('  Function** yaz (`service_role` anahtarı yalnız orada, sunucu');
    s.push('  tarafında dursun): admin panelden e-posta + şifre + katman');
    s.push('  gönderilince bu fonksiyon `auth.admin.createUser()` ile hesabı');
    s.push('  açsın, `kullanicilar` tablosuna satırını yazsın.');
    s.push('- **Kendi katmanını düşüremesin, son admini silemesin** —');
    s.push('  bunun dışında bir kısıtlama yok.');
    s.push('- **RLS şimdilik yalnız "giriş yapmış mı" diye baksın** — katmana');
    s.push('  göre ayrım yapma. Her katman her sayfayı görür, her işi yapar.');
    s.push('  "Kim ne yapabilir" sorusu ilerideki "Yetkilendirme" aşamasında');
    s.push('  cevaplanacak.');
    s.push('');
    if (pl.ilkKullaniciEklendi) {
      const eposta = (pl.ilkKullanici || {}).eposta || '';
      s.push('**İlk giriş.** İlk admin hesabı Supabase Authentication\'da zaten');
      s.push('açık' + (eposta ? ` (**${eposta}**)` : '') + ' — ama az önce kurduğun kullanıcı');
      s.push('tablosunda henüz satırı yok, çünkü o tablo bu hesap açıldığında');
      s.push('henüz yoktu. Bu e-posta için o tabloya bir Admin satırı ekle (tek');
      s.push('seferlik bir SQL ile yeter). Kodun içine sabit bir kullanıcı');
      s.push('adı/şifre gömmene gerek yok; giriş ekranı bu gerçek admin hesabını');
      s.push('baştan itibaren kullanabilir.');
    } else {
      s.push('**İlk giriş.** Veritabanında hiç kullanıcı yokken normal girişle');
      s.push('kimse içeri giremez — kayıt ekranı da yok. Kodun içine sabit bir');
      s.push('kullanıcı adı ve şifre göm; kullanıcı tablosu boşken giriş ekranı');
      s.push('yalnız bu bilgiyi kabul etsin ve içeri alsın. İlk gerçek kullanıcı');
      s.push('yukarıdaki Kullanıcı ekle özelliğinden oluşturulur oluşturulmaz');
      s.push('bu sabit giriş bir daha çalışmasın — kalıcı bir arka kapı kalmasın.');
    }
    return s.join('\n');
  },

  /* "Yetkilendirme" durağının kod-yazma promptu. Kullanıcı ekleme ve
     katmanlar zaten kurulu (bkz. yetkiBlogu — ilk kurulum promptunun
     içinde çalıştı); burada yalnız gerçek kısıtlamalar ("kim ne
     yapabilir") koda işleniyor. Sonunda istenen JSON, Studio'nun
     kurulumun bittiğini bilmesi için — palete yazılıyor (bkz. yetki-kod-onayla). */
  yetkiKur(projeId) {
    const p = DB.proje(projeId);
    if (!p) return '';
    const pl = p.palet || {};
    const roller = rolListesi(pl.roller);
    if (!roller.length) return '';

    const s = [];
    const slug = depoSlug(p.repo);
    if (slug) {
      s.push('> ### Depo: `' + slug + '`');
      s.push('> Bu oturum yalnız bu depoya bağlı olmalı. Deposu farklıysa dur');
      s.push('> ve söyle; başka depo ekleme, dosya oluşturma, commit atma.');
      s.push('');
    }
    s.push('# Yetkilendirme');
    s.push('');
    s.push('Kullanıcı ekleme ve katmanlar zaten kurulu — şu ana kadar her');
    s.push('katman her şeyi yapabiliyordu. Şimdi gerçek kısıtlamaları uygula:');
    s.push('');
    s.push('## Katmanlar (dar yetkiden genişe)');
    s.push('');
    const gorev = pl.rolGorev || {};
    roller.forEach((ad, i) => {
      const g = (gorev[ad] || '').trim();
      s.push(`${i + 1}. **${ad}**${g ? ' — ' + g : ''}`);
    });
    s.push('');

    if (p.id) {
      const moduller = DB.modulleri(p.id).filter(m => m.ad !== GENEL_MODUL);
      if (moduller.length) {
        s.push('## Mevcut modül ve sayfalar');
        s.push('');
        moduller.forEach(m => {
          const sayfalar = DB.sayfalari(m.id).map(sf => sf.ad);
          s.push(`- **${m.ad}**${sayfalar.length ? ': ' + sayfalar.join(', ') : ''}`);
        });
        s.push('');
      }
    }

    s.push('## Nasıl uygula');
    s.push('');
    s.push('- Hangi katmanın hangi sayfayı görüp hangi işi (ekle/düzenle/sil)');
    s.push('  yapabileceğini yukarıdaki tarife göre kodla — ilgisiz düğmeyi/');
    s.push('  sayfayı arayüzde gizle, **sunucu tarafında da (RLS) aynı kuralı');
    s.push('  uygula**, yalnız arayüzde gizlemek yetmez.');
    s.push('- En üstteki katman (Admin) her zaman her şeyi yapabilir.');
    s.push('- Kendi katmanını düşüremesin, son admini silemesin kuralı zaten');
    s.push('  kuruluydu — boz-ma.');
    s.push('');
    s.push('## Bitirince');
    s.push('');
    s.push('Başka hiçbir şey yazma, yalnızca aşağıdaki bloğu doldurup ver —');
    s.push('Studio bu bloğu okuyup kurulumun bittiğini anlayacak:');
    s.push('');
    s.push('```json');
    s.push('{ "kuruldu": true }');
    s.push('```');
    return s.join('\n');
  },

  /* Sayfa künyeleri — AI'ın ekranı tahmin etmeden kurabilmesi için.
     Alan türleri veritabanı sütununu, eylemler düğmeleri belirliyor.
     Roller kodda sabitlenmiyor: Yetkiler ekranının veritabanına yazılan
     bir varsayılan — admin runtime'da değiştirebiliyor. */
  kunyeBlogu(proje) {
    const pl = (proje && proje.palet) || {};
    const kunye = pl.kunye || {};
    const anahtarlar = Object.keys(kunye);
    if (!anahtarlar.length) return '';

    const s = ['## Sayfa Künyeleri'];
    s.push('Kullanıcıyla tek tek konuşularak alındı; tahmin değil, karar.');
    s.push('');
    s.push('- **Alan listesi o sayfanın veritabanı tablosudur.** Sütun adlarını ve');
    s.push('  türlerini buradan al, kendin uydurma, fazladan sütun ekleme.');
    s.push('- **Seçenek alanlarının değerleri sabittir.**');
    s.push('- **İlişki alanı** yazılı sayfanın kaydına bağlanır (foreign key).');
    s.push('- **Zorunlu alan** boş kaydedilemez; arayüzde de veritabanında da engelle.');
    s.push('- **Modül kuralları bütün sayfalarda geçerlidir.** Bir sayfada "Bu sayfada');
    s.push('  farklı" satırı varsa yalnız orada modül kuralının yerine geçer.');
    s.push('- **Yetkiyi koda gömme.** Hangi katmanın hangi sayfayı görüp hangi işi');
    s.push('  yapabileceği uygulamanın kendi Yetkiler ekranından yönetiliyor —');
    s.push('  aşağıdaki "Yetkiler ekranı" bölümüne bak. Bir sayfada "Görebilen"');
    s.push('  notu varsa bu bir **varsayılan**: Yetkiler ekranının veritabanına o');
    s.push('  izni başlangıç değeri olarak yaz, admin sonra değiştirebilsin —');
    s.push('  kodda "if (rol !== ...)" gibi sabit bir kontrol yazma.');

    /* Modül düzeyi iş kuralı. Yetki burada yazılmıyor: kimin neyi görüp
       yapabileceğini uygulamanın kendi Yetkiler ekranından admin belirliyor. */
    const mkh = pl.modulKunye || {};
    Object.keys(mkh).forEach(m => {
      const mk = mkh[m] || {};
      if (!mk.kural) return;
      s.push('', `### ${m} — ortak kural`, '');
      s.push(`- ${mk.kural}`);
    });

    /* Kullanıcının kendi anlatımı ve verdiği cevaplar */
    const anlatim = pl.anlatim || {};
    Object.keys(anlatim).forEach(m => {
      const a = anlatim[m];
      if (!a || (!a.metin && !(a.sorular || []).length)) return;
      s.push('', `### ${m} — kullanıcının anlatımı`);
      if (a.metin) s.push('> ' + a.metin.split('\n').join('\n> '));
      (a.sorular || []).forEach(x => s.push(`- ${x.soru} → **${x.cevap}**`));
      if ((a.baglantilar || []).length) {
        s.push('', '**Ekranlar arası geçiş**');
        a.baglantilar.forEach(b =>
          s.push(`- ${b.nereden} → ${b.nereye}${b.ne_zaman ? ' — ' + b.ne_zaman : ''}`));
      }
      if ((a.hazirVeri || []).length) {
        s.push('', '**Kurulurken yüklenecek hazır veri**');
        a.hazirVeri.forEach(h => s.push(`- ${h.sayfa ? h.sayfa + ': ' : ''}${h.kaynak}`));
      }
      if ((a.ciktilar || []).length) {
        s.push('', '**Çıktılar**');
        a.ciktilar.forEach(c =>
          s.push(`- ${c.ad}${c.nereden ? ' — ' + c.nereden : ''}${c.bicim ? ' · ' + c.bicim : ''}`));
      }
    });

    /* Sayfalar */
    anahtarlar.forEach(ad => {
      const k = kunye[ad] || {};
      s.push('', `### ${ad}`);
      if (k.amac) s.push(k.amac);
      s.push('');
      if (k.tur) s.push(`- **Ekran türü:** ${k.tur}`);
      if (k.olcek) {
        const o = OLCEK.find(x => x.ad === k.olcek);
        s.push(`- **Beklenen kayıt:** ${k.olcek}${o ? ' — ' + o.alt : ''}`);
        s.push('  Listeyi, sayfalamayı ve aramayı bu hacme göre kur.');
      }
      if (k.ayniKayit) {
        s.push(`- **Aynı kaydı yazar:** ${k.ayniKayit}`);
        s.push('  İki ayrı tablo kurma; tek tablo, iki görünüm.');
      }
      if ((k.alanlar || []).length) {
        s.push('- **Alanlar:**');
        k.alanlar.forEach(a => {
          const ek = [];
          if (a.zorunlu) ek.push('zorunlu');
          if (a.tur === 'Seçenek' && (a.degerler || []).length)
            ek.push('değerler: ' + a.degerler.join(' | '));
          if (a.tur === 'İlişki' && a.kaynak) ek.push('kaynak: ' + a.kaynak);
          s.push(`  - ${a.ad} — ${a.tur}${ek.length ? ' — ' + ek.join(' — ') : ''}`);
        });
      }
      if ((k.kalip || []).length) {
        s.push('- **Yapı:**');
        k.kalip.forEach(a => {
          const kl = KALIP.find(x => x.anahtar === a);
          if (!kl) return;
          s.push(`  - **${kl.ad}** — ${kl.ozet} (${kl.ornek})`);
          kl.sorular.forEach(sr => {
            const c = (k.kalipCevap || {})[a + '.' + sr.anahtar];
            if (!c || (Array.isArray(c) && !c.length)) return;
            if (sr.tur === 'set') {
              s.push(`    - ${sr.soru}`);
              setListesi(c).forEach(st => s.push(
                `      - **${st.ad}** → ek sütunlar: ${(st.alanlar || []).join(', ') || '—'}`));
              return;
            }
            s.push(`    - ${sr.soru} → ${Array.isArray(c) ? c.join(' · ') : c}`);
          });
        });
      }
      const f = k.fark || {};
      if ((f.kural || '').trim()) {
        s.push(`- **Bu sayfada modül kuralından farklı:** ${f.kural}`);
      }
      /* Claude'un tasarım notu — künyenin "ne" dediği yere "nasıl görünecek"
         eklenir. İkisini ayrı bölümlere koyunca AI birini okuyup diğerini
         atlıyordu. */
      const tn = ((pl.cozum || {}).sayfalar || {})[ad.split(' · ').pop()];
      if (tn) {
        s.push('- **Tasarım notu:**');
        if (tn.yerlesim) s.push(`  - Yerleşim: ${tn.yerlesim}`);
        if ((tn.bilesenler || []).length)
          s.push(`  - Bileşenler: ${tn.bilesenler.join(' · ')}`);
        (tn.gorseller || []).forEach(g =>
          s.push(`  - Görsel — ${g.yer}: ${g.ne}`));
        if (tn.not) s.push(`  - ${tn.not}`);
      }
    });
    return s.join('\n');
  },

  /* ---------- Çözümleme promptu ----------
     Kullanıcı modülü kendi cümleleriyle anlatıyor; bu prompt onu yapıya
     çeviriyor. Studio tarayıcıda Claude'a bağlanmıyor: metin kopyalanıp
     yapıştırılıyor — paletteki döngünün aynısı. */
  cozumleme(proje, taslak) {
    const roller = rolListesi((proje.palet || {}).roller);
    /* Kaç bölüme (Studio'daki adıyla "modül") ayrılacağına ben karar
       vermiyorum, Claude veriyor — soru-cevabın sonunda bütün resmi gören
       o. Bu yüzden var olan bölümleri de söylüyorum: anlattığım şey
       bunlardan birine mi giriyor yoksa gerçekten yeni bir alan mı, onu
       da kendisi ayırt etsin. */
    const digerBolumler = DB.modulleri(proje.id).filter(m => m.ad !== GENEL_MODUL);
    const s = [];
    s.push('Bir iş yazılımı kuruyorum. Aşağıda ne olacağını kendi cümlelerimle');
    s.push('anlattım.');
    s.push('');
    s.push('**Önce bana soru sor.** Anlatımımda karar verilmemiş ne varsa tek tek');
    s.push('sor, cevaplarımı bekle. Emin olmadan yapıyı kurma, varsayım yapma.');
    s.push('Anlaştığımıza kanaat getirince en sonda tek bir JSON bloğu ver —');
    s.push('onu uygulamaya yapıştıracağım.');
    s.push('');
    s.push('Soruları yazılım terimiyle değil, işi bilen ama yazılım bilmeyen');
    s.push('birinin anlayacağı dille sor. Bir seferde en çok 3-4 soru sor,');
    s.push('cevapladıkça devam et. Cevabımdan yeni bir belirsizlik doğarsa onu da');
    s.push('sor. Sormaya değer bir şey kalmayınca "Bloğu veriyorum" deyip ver.');
    s.push('');
    s.push('## Firma');
    s.push(`${proje.firma}${proje.sektor ? ' · ' + proje.sektor : ''}`);
    if (roller.length) s.push(`Roller (alttan üste): ${roller.join(' · ')}`);
    if (digerBolumler.length) {
      s.push('');
      s.push('## Zaten kurulu bölümler');
      digerBolumler.forEach(m => s.push('- ' + m.ad));
      s.push('Anlattığım şey bunlardan biriyle ilgiliyse `modul` alanına aynı adı');
      s.push('yaz, oraya ekleme yapılsın. Gerçekten ayrı bir alansa yeni bir ad ver.');
    }
    s.push('');
    s.push('## Kaç bölüme ayrılacak');
    s.push('Genelde **tek bölüm yeterli** — gereksiz yere bölme. Yalnız');
    s.push('anlattığım iş gerçekten birbirinden bağımsız birkaç büyük alansa');
    s.push('(ör. "Muhasebe" ile "İnsan Kaynakları" gibi, biri bitmeden');
    s.push('diğeri anlaşılmayan değil, ayrı ayrı da kurulabilecek iki dünya)');
    s.push('birden fazla bölüm açabilirsin. O zaman bile hepsini birden verme:');
    s.push('önce ilk bölümün bloğunu ver, ben onu uygulamaya işleyip sana');
    s.push('haber veririm, sonra ikincisine geçeriz.');

    /* Veri katmanı buraya girmezse Claude kurallara RLS yazıyor —
       sunucusuz projede karşılığı yok. */
    if ((proje.palet || {}).veriKatmani === 'Yerel tarayıcı') {
      s.push('Veri: Yerel tarayıcı — sunucu yok, kimlik doğrulama yok.');
      s.push('Roller yalnız arayüzü biçimlendirir. Kurallara "RLS", "satır');
      s.push('güvenliği" ya da "kullanıcı yalnız kendi kaydını görür" yazma.');
    } else {
      s.push('Veri: Supabase — satır güvenliği (RLS) her tabloda açık.');
    }
    s.push('');
    if ((taslak.sayfalar || []).length) {
      s.push('## Kuracağım ekranlar');
      taslak.sayfalar.forEach(x => s.push('- ' + x));
      s.push('');
      s.push('Bu listeyi esas al. Eksik gördüğün ekran varsa önce bana sor.');
      s.push('');
    }
    s.push('## Anlattığım');
    s.push(String(taslak.anlat || '').trim());
    s.push('');
    s.push('## Sorman gereken tipik yerler');
    s.push('- Bir kaydın birden çok yeri etkilediği durumlar: nasıl belirlenir,');
    s.push('  toplam denk olmalı mı, yanlış kayıt nasıl düzeltilir');
    s.push('- Kodlu/hiyerarşik listelerde alt kodun nasıl türediği, kaç kat indiği');
    s.push('- Hesaplanan sütunlar: neye göre, nereden başlayarak');
    s.push('- Seçenek alanlarının alabileceği değerler');
    s.push('- Sayfalar arası bağlantı: hangi ekrandan hangisine gidilir');
    s.push('- Kurulurken hazır yüklenmesi gereken liste var mı');
    s.push('- Yazdırılacak ya da dışa verilecek bir belge var mı');
    s.push('- Bir kaydın içinde satırlar varsa: üst toplam nereden gelir,');
    s.push('  satırsız kayıt olabilir mi');
    s.push('');
    s.push('## En sonda vereceğin blok');
    s.push('Yalnız JSON, öncesine sonrasına açıklama yazma.');
    s.push('');
    s.push('```json');
    s.push('{');
    s.push('  "modul": "Muhasebe Modülü",');
    s.push('  "modulKurallari": {');
    s.push('    "kural": "Bütün sayfalarda geçerli iş kuralı, yoksa boş"');
    s.push('  },');
    s.push('  "sayfalar": [');
    s.push('    {');
    s.push('      "ad": "Hesaplar",');
    s.push('      "grup": "Kayıtlar",');
    s.push('      "amac": "Tek cümleyle bu ekran ne işe yarar",');
    s.push('      "tur": "Liste",');
    s.push('      "olcek": "Orta",');
    s.push('      "ayniKayit": "",');
    s.push('      "kalip": ["agac"],');
    s.push('      "kalipCevap": { "agac.kod": "Üstünden türesin (100 → 100.01)" },');
    s.push('      "alanlar": [');
    s.push('        { "ad": "Kod", "tur": "Metin", "zorunlu": true },');
    s.push('        { "ad": "Durum", "tur": "Seçenek", "degerler": ["Açık", "Kapalı"] },');
    s.push('        { "ad": "Üst Hesap", "tur": "İlişki", "kaynak": "Hesaplar" }');
    s.push('      ],');
    s.push('      "fark": { "kural": "" }');
    s.push('    }');
    s.push('  ],');
    s.push('  "baglantilar": [');
    s.push('    { "nereden": "Hesaplar", "nereye": "Hareketler",');
    s.push('      "ne_zaman": "Alt hesaba dokununca o hesabın hareketleri açılır" }');
    s.push('  ],');
    s.push('  "hazirVeri": [');
    s.push('    { "sayfa": "Hesaplar", "kaynak": "Tek düzen hesap planı hazır yüklensin" }');
    s.push('  ],');
    s.push('  "ciktilar": [');
    s.push('    { "ad": "Hesap ekstresi", "nereden": "Hareketler", "bicim": "PDF" }');
    s.push('  ],');
    s.push('  "kararlar": [');
    s.push('    { "soru": "Sorduğun soru", "cevap": "Verdiğim cevap" }');
    s.push('  ]');
    s.push('}');
    s.push('```');
    s.push('');
    s.push('### Blok kuralları');
    s.push('- `modul`: modülün adı. Ben söylediysem onu yaz, söylemediysem kısa');
    s.push('  ve Türkçe bir ad öner ("Muhasebe Modülü", "Sipariş Takibi").');
    s.push('- `grup`: sayfanın hangi öbeğe ait olduğu. Sen belirle — işe göre,');
    s.push('  türe göre değil: "Kayıtlar", "Raporlar", "Panolar", "Tanımlar",');
    s.push('  "Ayarlar" gibi. Kısa ve Türkçe olsun, 2-6 öbeği geçme,');
    s.push('  her sayfaya bir öbek ver. Öbekleri kullanıcının menüde göreceği');
    s.push('  sırayla yaz: önce günlük kullanılanlar, en sona ayarlar.');
    s.push('- `tur` yalnız: ' + SAYFA_TURU.map(x => x.ad).join(' · '));
    s.push('- Alan `tur` yalnız: ' + ALAN_TURU.map(x => x.ad).join(' · '));
    s.push('- **`modulKurallari` bir kez yazılır, bütün sayfalarda geçerlidir.**');
    s.push('  Yalnız iş kuralı — yetki yazma. Kimin neyi görüp yapabileceğini');
    s.push('  uygulamadaki Yetkiler ekranından admin belirliyor.');
    s.push('- `fark` yalnız o sayfa modül kuralından **ayrılıyorsa**, kendi iş');
    s.push('  kuralıyla dolar. Ayrılmıyorsa boş bırak.');
    s.push('- `olcek` yalnız: ' + OLCEK.map(x => x.ad + ' (' + x.alt + ')').join(' · '));
    s.push('  Kullanıcı "1000 hesap olacak" gibi bir şey söylediyse ona göre yaz.');
    s.push('- `ayniKayit`: bu sayfa başka bir sayfayla **aynı kaydı** yazıyorsa o');
    s.push('  sayfanın adını yaz (fiş girişi ile hareketler gibi). Yoksa boş bırak —');
    s.push('  yazılmazsa iki ayrı tablo kurulur ve düzenleme birine yansımaz.');
    s.push('- `baglantilar` boş kalmasın: hangi ekrandan hangisine, ne zaman');
    s.push('  gidildiğini yaz. Ekran arası geçiş yazılmazsa kaybolur.');
    s.push('- `hazirVeri`: kurulurken hazır yüklenecek liste varsa yaz');
    s.push('  (hesap planı, ürün listesi, il-ilçe). Yoksa boş dizi.');
    s.push('- `ciktilar`: yazdırılacak ya da dışa verilecek belge varsa yaz');
    s.push('  (fiş, fatura, ekstre, rapor). Yoksa boş dizi.');
    s.push('- `Seçenek` alanına mutlaka `degerler` yaz — bana sormadan uydurma.');
    s.push('- `İlişki` alanına mutlaka `kaynak` yaz (hangi sayfanın kaydı).');
    s.push('- Alan adları benim dilimde olsun (Türkçe, insan gibi).');
    s.push('- `kararlar` bölümüne konuşmamızda netleştirdiğimiz her şeyi yaz;');
    s.push('  kodu yazacak olan onu okuyacak.');
    s.push('');
    s.push('### Kalıplar');
    s.push('Bir sayfa aşağıdakine uyuyorsa `kalip` dizisine **tek** anahtar yaz');
    s.push('(en baskın olanı) ve `kalipCevap` içine o kalıbın cevaplarını koy.');
    s.push('Uymuyorsa boş dizi bırak.');
    KALIP.forEach(k => {
      s.push('');
      s.push(`**${k.anahtar}** · ${k.ad} — ${k.ozet} (${k.ornek})`);
      k.sorular.forEach(sr => {
        const bicim = sr.secim ? sr.secim.map(x => '"' + x + '"').join(' | ')
          : sr.tur === 'set'
            ? '[{ "ad": "320 Tedarikçiler", "alanlar": ["Fatura", "Fatura No"] }, …]'
            : 'liste (birden çok değer)';
        s.push(`  - \`${k.anahtar}.${sr.anahtar}\` — ${sr.soru} → ${bicim}`);
      });
    });
    return s.join('\n');
  },

  /* ---------- Modül güncelleme promptu ----------
     Kurulumdan sonra "Kurulum ve yapı"da elle işlem yok; kod ilerledikçe
     depo ile künye arasında açılan farkın tek köprüsü bu. Claude depoyu
     kendi inceliyor, künyede hiç yazmayan bir şey (yeni sayfa, yeni alan)
     bulursa aynı çözümleme bloğuyla tamamlıyor — var olan hiçbir şeyin
     üstüne yazmıyor, yalnız eksiği dolduruyor. cozumlemeOku/Uygula aynen
     kullanılıyor: biçim tıpatıp aynı. */
  modulGuncelle(projeId, hedefModul) {
    const p = DB.proje(projeId);
    if (!p) return '';
    /* Açık olan modül belliyse onu güncelle; belirtilmezse (eski çağrılar)
       ilk gerçek modüle düş — çok modüllü projede yanlış modülü etiketleyip
       cevabı yanlış yere dosyalatmasın. */
    const modul = hedefModul
      ? DB.modulleri(p.id).find(m => m.ad === hedefModul)
      : DB.modulleri(p.id).find(m => m.ad !== GENEL_MODUL);
    const ad = (modul && modul.ad) || hedefModul || modulAdi(p) || 'Program';
    const slug = depoSlug(p.repo);

    const s = [];
    s.push('# ' + projeAdi(p) + ' — modül güncelleme', '');
    if (slug) {
      s.push('> ### Depo: `' + slug + '`');
      s.push('> Bu oturum yalnız bu depoya bağlı olmalı. Deposu farklıysa dur');
      s.push('> ve söyle.', '');
    }
    s.push('Studio\'da bu programın kayıtlı yapısı aşağıda. **Depoyu iyice');
    s.push('incele** — kodu, sayfaları, veritabanı tablolarını gör — ve bu');
    s.push('kayıtla karşılaştır.');
    s.push('');
    s.push('Kodda olup aşağıda **hiç yazmayan** bir sayfa ya da alan bulursan');
    s.push('onu tamamla. **Zaten yazan bir şeyi değiştirme**, yalnız eksik');
    s.push('olanı ekle — bu bir düzeltme değil, tamamlama. Hiçbir eksik');
    s.push('yoksa bana kısaca "eksik yok" de, blok verme.');
    s.push('');
    const kunye = PROMPT.kunyeBlogu(p);
    if (kunye) { s.push(kunye); s.push(''); }
    else {
      s.push('(Henüz kayıtlı bir künye yok — bulduğun her şeyi ekle.)');
      s.push('');
    }
    s.push('## En sonda vereceğin blok');
    s.push('Eksik gördüğün varsa, yalnız JSON ver — öncesine sonrasına açıklama');
    s.push('yazma. Zaten yazan sayfa ya da alanı tekrar etme, yalnız eksik olanı');
    s.push('yaz. Biçim, ilk kurulumdakiyle birebir aynı:');
    s.push('');
    s.push('```json');
    s.push('{');
    s.push(`  "modul": "${ad}",`);
    s.push('  "sayfalar": [');
    s.push('    {');
    s.push('      "ad": "Eksik olan yeni sayfanın ya da var olan bir sayfanın adı",');
    s.push('      "grup": "Kayıtlar",');
    s.push('      "amac": "Tek cümleyle bu ekran ne işe yarar",');
    s.push('      "tur": "Liste",');
    s.push('      "alanlar": [');
    s.push('        { "ad": "Kod", "tur": "Metin", "zorunlu": true }');
    s.push('      ]');
    s.push('    }');
    s.push('  ]');
    s.push('}');
    s.push('```');
    s.push('');
    s.push('- `tur` yalnız: ' + SAYFA_TURU.map(x => x.ad).join(' · '));
    s.push('- Alan `tur` yalnız: ' + ALAN_TURU.map(x => x.ad).join(' · '));
    s.push('- `Seçenek` alanına mutlaka `degerler` yaz.');
    s.push('- `İlişki` alanına mutlaka `kaynak` yaz (hangi sayfanın kaydı).');
    return s.join('\n');
  },

  /* ---------- Beta güncelleme promptu ----------
     Beta ve geliştirme'de aşama/görev takibi yok: yayına giren uygulama
     denenip eksik ya da güncellenmesi gereken bir şey bulunca yazılıyor,
     Claude düzeltiyor. Yapıyı da etkiliyorsa (yeni sayfa/alan) modül
     güncellemesiyle aynı bloğu veriyor — cozumlemeOku/Uygula aynen okuyor. */
  betaIstek(projeId, istek) {
    const p = DB.proje(projeId);
    if (!p) return '';
    const metin = String(istek || '').trim();
    if (!metin) return '';
    const slug = depoSlug(p.repo);
    const yayin = (p.palet || {}).alanAdi;

    const s = [];
    s.push('# ' + projeAdi(p) + ' — güncelleme', '');
    if (slug) {
      s.push('> ### Depo: `' + slug + '`');
      s.push('> Bu oturum yalnız bu depoya bağlı olmalı. Deposu farklıysa dur');
      s.push('> ve söyle.', '');
    }
    if (yayin) {
      s.push('> ### Yayın adresi: `https://' + yayin + '`');
      s.push('> Denediğim canlı sürüm bu adres.', '');
    }
    s.push('Yayındaki uygulamayı denedim. Şunu buldum / şunu istiyorum:', '');
    s.push('> ' + metin.split('\n').join('\n> '));
    s.push('');
    s.push('Depoyu incele, gerekeni düzelt ya da ekle.');
    s.push('');
    s.push('Eğer bu, programın yapısını da etkiliyorsa — yeni bir sayfa ya da');
    s.push('yeni bir alan gerekiyorsa — düzeltmenin sonunda **ayrıca** aşağıdaki');
    s.push('biçimde bir JSON bloğu ver, ben Studio\'ya yapıştıracağım. Yapıyı');
    s.push('etkilemiyorsa (görsel düzeltme, hata giderme gibi) blok verme.');
    s.push('');
    const kunye = PROMPT.kunyeBlogu(p);
    if (kunye) { s.push('## Kayıtlı yapı (karşılaştırman için)', ''); s.push(kunye); s.push(''); }

    s.push('## Yapı değiştiyse vereceğin blok');
    s.push('Yalnız yeni olanı yaz — zaten kayıtlı sayfa ya da alanı tekrar etme.');
    s.push('Proje birden çok modüllüyse `modul` alanına **ilgili gerçek modülün');
    s.push('adını** yaz — yukarıdaki kayıtlı yapıdan bul, örnekteki adı kopyalama.');
    s.push('');
    s.push('```json');
    s.push('{');
    s.push('  "modul": "İlgili modülün adı",');
    s.push('  "sayfalar": [');
    s.push('    {');
    s.push('      "ad": "Yeni ya da güncellenen sayfanın adı",');
    s.push('      "grup": "Kayıtlar",');
    s.push('      "amac": "Tek cümleyle bu ekran ne işe yarar",');
    s.push('      "tur": "Liste",');
    s.push('      "alanlar": [');
    s.push('        { "ad": "Kod", "tur": "Metin", "zorunlu": true }');
    s.push('      ]');
    s.push('    }');
    s.push('  ]');
    s.push('}');
    s.push('```');
    s.push('');
    s.push('- `tur` yalnız: ' + SAYFA_TURU.map(x => x.ad).join(' · '));
    s.push('- Alan `tur` yalnız: ' + ALAN_TURU.map(x => x.ad).join(' · '));
    s.push('');
    s.push('Bitirince tek commit\'le **`main` dalına** gönder:');
    s.push(`   \`[${TASK_PREFIX}-0] Güncelleme\``);
    return s.join('\n');
  },

  /* ---------- Test ve Güncelle promptu (yalnız şablon kopyaları) ----------
     betaIstek'in sade hâli: yapı zaten template'ten geliyor, künye/JSON
     bloğuna gerek yok — genel bir "şunu buldum, düzelt" isteği yeter. */
  denemeIstek(projeId, istek) {
    const p = DB.proje(projeId);
    if (!p) return '';
    const metin = String(istek || '').trim();
    if (!metin) return '';
    const slug = depoSlug(p.repo);
    const yayin = (p.palet || {}).alanAdi;

    const s = [];
    s.push('# ' + projeAdi(p) + ' — test sonrası güncelleme', '');
    if (slug) {
      s.push('> ### Depo: `' + slug + '`');
      s.push('> Bu oturum yalnız bu depoya bağlı olmalı. Deposu farklıysa dur');
      s.push('> ve söyle.', '');
    }
    if (yayin) {
      s.push('> ### Yayın adresi: `https://' + yayin + '`');
      s.push('> Denediğim sürüm bu adres.', '');
    }
    s.push('Uygulamayı gerçek verilerle denedim. Şunu buldum / şunu istiyorum:', '');
    s.push('> ' + metin.split('\n').join('\n> '));
    s.push('');
    s.push('Depoyu incele, gerekeni düzelt ya da ekle. **Var olan hiçbir özelliği');
    s.push('kırma** — bu istek dışındaki hiçbir şeyi değiştirme.');
    s.push('');
    s.push('Bitirince tek commit\'le **`main` dalına** gönder:');
    s.push(`   \`[${TASK_PREFIX}-0] Güncelleme\``);
    return s.join('\n');
  },

  /* ---------- Geliştirme (final sonrası) güncelleme promptu ----------
     betaIstek ile aynı iskelet, tek fark: final zaten verildi, uygulama
     müşterinin elinde, gerçek kullanıcı verisi olabilir. O yüzden burada
     ekstra bir dikkat uyarısı var — beta'da yoktu, çünkü beta'da henüz
     gerçek veri riski düşük. Yapı bloğu (JSON) aynen betaIstek'le aynı;
     cozumlemeOku/Uygula ikisini de aynı şekilde okuyor. */
  guncellemeIstek(projeId, istek) {
    const p = DB.proje(projeId);
    if (!p) return '';
    const metin = String(istek || '').trim();
    if (!metin) return '';
    const slug = depoSlug(p.repo);
    const yayin = (p.palet || {}).alanAdi;

    const s = [];
    s.push('# ' + projeAdi(p) + ' — güncelleme isteği', '');
    if (slug) {
      s.push('> ### Depo: `' + slug + '`');
      s.push('> Bu oturum yalnız bu depoya bağlı olmalı. Deposu farklıysa dur');
      s.push('> ve söyle.', '');
    }
    if (yayin) {
      s.push('> ### Yayın adresi: `https://' + yayin + '`');
      s.push('> Bu, **müşterinin elinde canlı kullanılan** sürüm — beta değil.');
      s.push('> Var olan veriyi silme ya da göç ettirme gerektiren bir değişiklik');
      s.push('> yapacaksan önce dur ve söyle, benim onayım olmadan uygulama.');
      s.push('');
    }
    s.push('Final zaten verildi, uygulama yayında ve kullanılıyor. Şu güncelleme');
    s.push('isteniyor:', '');
    s.push('> ' + metin.split('\n').join('\n> '));
    s.push('');
    s.push('Depoyu incele, gerekeni düzelt ya da ekle. **Var olan hiçbir özelliği');
    s.push('kırma** — bu istek dışındaki hiçbir şeyi değiştirme.');
    s.push('');
    s.push('Eğer bu, programın yapısını da etkiliyorsa — yeni bir sayfa ya da');
    s.push('yeni bir alan gerekiyorsa — düzeltmenin sonunda **ayrıca** aşağıdaki');
    s.push('biçimde bir JSON bloğu ver, ben Studio\'ya yapıştıracağım. Yapıyı');
    s.push('etkilemiyorsa (görsel düzeltme, hata giderme gibi) blok verme.');
    s.push('');
    const kunye = PROMPT.kunyeBlogu(p);
    if (kunye) { s.push('## Kayıtlı yapı (karşılaştırman için)', ''); s.push(kunye); s.push(''); }

    s.push('## Yapı değiştiyse vereceğin blok');
    s.push('Yalnız yeni olanı yaz — zaten kayıtlı sayfa ya da alanı tekrar etme.');
    s.push('Proje birden çok modüllüyse `modul` alanına **ilgili gerçek modülün');
    s.push('adını** yaz — yukarıdaki kayıtlı yapıdan bul, örnekteki adı kopyalama.');
    s.push('');
    s.push('```json');
    s.push('{');
    s.push('  "modul": "İlgili modülün adı",');
    s.push('  "sayfalar": [');
    s.push('    {');
    s.push('      "ad": "Yeni ya da güncellenen sayfanın adı",');
    s.push('      "grup": "Kayıtlar",');
    s.push('      "amac": "Tek cümleyle bu ekran ne işe yarar",');
    s.push('      "tur": "Liste",');
    s.push('      "alanlar": [');
    s.push('        { "ad": "Kod", "tur": "Metin", "zorunlu": true }');
    s.push('      ]');
    s.push('    }');
    s.push('  ]');
    s.push('}');
    s.push('```');
    s.push('');
    s.push('- `tur` yalnız: ' + SAYFA_TURU.map(x => x.ad).join(' · '));
    s.push('- Alan `tur` yalnız: ' + ALAN_TURU.map(x => x.ad).join(' · '));
    s.push('');
    s.push('Bitirince tek commit\'le **`main` dalına** gönder:');
    s.push(`   \`[${TASK_PREFIX}-0] Güncelleme\``);
    return s.join('\n');
  },

  /* ---------- Muhasebe şablonu: Temel tanımlar ve Değişim ----------
     Şablon akışında "Temel tanımlar" durağı depoya hiç dokunmuyor — yalnız
     bilgi topluyor. POS/banka/fatura adımlarında Claude'dan istenen tek şey
     örnek Excel'in yapısını anlatması (kod yazmadan); toplanan cevaplar
     "Değişim" durağında tek promptta koda işleniyor. */
  sablonOgren(projeId, konu, ipucu) {
    const p = DB.proje(projeId);
    if (!p) return '';
    const slug = depoSlug(p.repo);

    const s = [];
    s.push('# ' + projeAdi(p) + ' — ' + konu + ' yapısını öğren', '');
    if (slug) {
      s.push('> ### Depo: `' + slug + '`');
      s.push('> Bu oturum yalnız bu depoya bağlı olmalı. Deposu farklıysa dur');
      s.push('> ve söyle.', '');
    }
    s.push('Az sonra sana ' + konu.toLowerCase() + ' için örnek bir Excel');
    s.push('dosyası vereceğim. **Kod yazma, hiçbir dosyayı değiştirme** — tek');
    s.push('işin dosyanın yapısını inceleyip bana düz metinle anlatmak.');
    s.push('');
    if (ipucu) { s.push('> ' + ipucu, ''); }
    s.push('Dosyayı incele ve şunları anlat:');
    s.push('- Kaç satır başlık var, veri hangi satırdan başlıyor');
    s.push('- Sütunlar sırayla hangi isimde ve ne anlama geliyor');
    s.push('- Tarih ve tutar gibi alanların formatı nasıl (ör. 12.01.2025,');
    s.push('  1.234,56)');
    s.push('- Dikkat çeken, sabit ya da değişken olabilecek bir şey varsa belirt');
    s.push('');
    s.push('Kısa ve net anlat, madde madde yeter. JSON ya da kod isteme.');
    return s.join('\n');
  },

  /* Banka/fatura/gunsonu bölümlerinin üçü de aynı kalıp: hazır (kodda zaten
     var) + öğrenilen (başka bir projede bir kez anlatılmış, tarifi
     `sablonSecenekleri`'nden geliyor) + ekstra (bu projede yeni anlatılmış).
     Öğrenilen bir tarif de dahil edilmezse, şablon kopyası kendi başına bir
     kod tabanı olduğundan Claude o formatı hiç bilmez — az önce anlatılmış
     gibi burada tekrar veriliyor. */
  sablonDegisimBolumu(s, tur, kategori, t, hazirListe, baslik, hazirCumle) {
    const veri = t[kategori] || {};
    const secili = veri.secili || [];
    const ekstra = (veri.ekstra || []).filter(x => (x.ad || '').trim());
    const hazirAd = hazirListe.filter(h => secili.indexOf(h.anahtar) > -1).map(h => h.ad);
    const ogrenilen = secili
      .filter(id => !hazirListe.some(h => h.anahtar === id))
      .map(id => sablonSecenekleri(tur, kategori).find(o => o.id === id))
      .filter(Boolean);
    if (!hazirAd.length && !ogrenilen.length && !ekstra.length) return;
    s.push('## ' + baslik);
    if (hazirAd.length) s.push(hazirCumle + hazirAd.join(', ') + '.');
    ogrenilen.forEach(o => {
      s.push('', '### ' + o.ad + ' — Excel yapısı (başka bir projede öğrenildi)');
      s.push(o.tarif);
    });
    ekstra.forEach(x => {
      s.push('', '### ' + x.ad + ' — Excel yapısı');
      s.push((x.cevap || '').trim() || '(açıklama girilmedi)');
    });
    s.push('');
  },

  /* Değişim: Temel tanımlar'da toplanan her şeyi tek seferde koda işleyen
     prompt. Genel yapıyı (modül/sayfa) değiştirmiyor, yalnız bu firmaya
     özel bilgiyi uyguluyor. */
  sablonDegisim(projeId) {
    const p = DB.proje(projeId);
    if (!p) return '';
    const pl  = p.palet || {};
    const t   = pl.sablonTanimlar || {};
    const tur = pl.sablon || '';
    const slug = depoSlug(p.repo);

    const s = [];
    s.push('# ' + projeAdi(p) + ' — şablon özelleştirmesi', '');
    if (slug) {
      s.push('> ### Depo: `' + slug + '`');
      s.push('> Bu oturum yalnız bu depoya bağlı olmalı. Deposu farklıysa dur');
      s.push('> ve söyle.', '');
    }
    s.push('Bu proje bir muhasebe programı şablonundan kopyalandı. Aşağıdaki');
    s.push('bilgiler bu firmaya özel — bunları koda işle. **Modül, sayfa ve');
    s.push('genel yapıyı değiştirme**, yalnız aşağıdaki bilgilere göre uyarla.');
    s.push('');

    if ((t.temel || {}).metin) {
      s.push('## Temel tanımlar');
      s.push('> ' + t.temel.metin.trim().split('\n').join('\n> '));
      s.push('');
    }

    PROMPT.sablonDegisimBolumu(s, tur, 'gunsonu', t, [],
      'Gün Sonu — POS sistemi', 'Hazır: ');
    const ozel = ((t.gunsonu || {}).ozel || '').trim();
    if (ozel) {
      s.push('## Gün Sonu — bu firmaya özel');
      s.push(ozel);
      s.push('');
    }

    PROMPT.sablonDegisimBolumu(s, tur, 'banka', t, SABLON_BANKA_HAZIR,
      'Bankalar', 'Hazır ekstre yapısı zaten sistemde kayıtlı: ');

    PROMPT.sablonDegisimBolumu(s, tur, 'fatura', t, SABLON_FATURA_HAZIR,
      'Fatura ve kart hareketleri', 'Hazır entegrasyon zaten sistemde kayıtlı: ');

    s.push(PROMPT.yetkiBlogu(p));
    s.push('');

    s.push('Bitirince proje kimlik dosyasını (`nizam/` klasörü) bu bilgilere');
    s.push('göre güncelle ve tek commit\'le **`main` dalına** gönder:');
    s.push(`   \`[${TASK_PREFIX}-0] Şablon özelleştirmesi\``);
    return s.join('\n');
  },

  /* ---------- Template oluşturma: temizleme promptu ----------
     Ayarlar > Templateler'de bir müşteri projesinden template çıkarırken
     tek prompt — firma izini kaldırır, tasarımı standarda döndürür, gerçek
     bağlantıları koparır. Kaynak proje adı `kopyaKaynagi`dan bulunuyor;
     `DB.projeKopyala` bunu her kopyada zaten saklıyor. Yapıya (modül/sayfa/
     iş mantığı) dokunmuyor — o hiç değişmeyecek. */
  cekirdekTemizle(projeId) {
    const p = DB.proje(projeId);
    if (!p) return '';
    const pl = p.palet || {};
    const kaynak = pl.kopyaKaynagi ? DB.proje(pl.kopyaKaynagi) : null;
    const eskiFirma = (kaynak && kaynak.firma) ? kaynak.firma.trim() : '';
    const slug = depoSlug(p.repo);

    const s = [];
    s.push('# ' + projeAdi(p) + ' — template temizliği', '');
    if (slug) {
      s.push('> ### Depo: `' + slug + '`');
      s.push('> Bu oturum yalnız bu depoya bağlı olmalı. Deposu farklıysa dur');
      s.push('> ve söyle.', '');
    }

    s.push('Bu depo, çalışan bir müşteri programının birebir kopyası.');
    s.push('Amacımız bunu **yeniden kullanılabilir bir template**\'e');
    s.push('dönüştürmek — ileride başka firmalara buradan kopya çıkacağız.');
    s.push('**Modül, sayfa ve iş mantığını hiç değiştirmeyeceksin** —');
    s.push('sadece bu firmaya özel her izi kaldıracaksın.', '');

    s.push('## 1 · Firma izini kaldır');
    if (eskiFirma) {
      s.push('Depoda **"' + eskiFirma + '"** adı ve bu firmaya özel HERHANGİ');
      s.push('bir iz — logo dosyası, adres, telefon, e-posta, footer, sayfa/');
      s.push('sekme başlığı, PWA adı ve manifest, favicon, README, kimlik');
      s.push('dosyası, kod içi yorumlar, örnek/tohum veri — kodun hiçbir');
      s.push('yerinde kalmasın. Bulduğun her yeri jenerik bir değerle');
      s.push('değiştir (ör. "Örnek Firma", "0212 000 00 00",');
      s.push('"ornek@firma.com").');
    } else {
      s.push('Depoda hangi firmaya ait olduğunu gösteren bir iz (isim, logo,');
      s.push('iletişim, footer, başlık) varsa bul ve jenerik bir değerle');
      s.push('değiştir (ör. "Örnek Firma").');
    }
    s.push('');

    s.push('## 2 · Tasarımı standarda döndür');
    s.push('Uygulama "Profesyonel tasarım" aşamasında özelleştirilmiş');
    s.push('olabilir — özel renk paleti, tipografi, görseller/ikonlar. Bunu');
    s.push('geri al: `nizam/tasarim.md` (ya da kimlik dosyalarındaki ilk');
    s.push('tasarım tanımı neyse) uygulamayı **o sade/nötr hâline** döndür.');
    s.push('Özel görsel/ikon eklemelerini kaldır, marka rengini nötr');
    s.push('metalik-gri + kırmızı vurgu paletine döndür.');
    s.push('');

    s.push('## 3 · Gerçek bağlantıları kopar');
    s.push('Depoda gerçek bir Supabase bağlantısı (proje adresi, anon key)');
    s.push('varsa bul ve **sahte** değerle değiştir: adresi ve anahtarı');
    s.push('`000000000` yap, hemen yanına bir not/yorum ekle: **"Supabase');
    s.push('bağlı değil — kullanmadan önce Ayarlar\'dan gerçek bağlantıyı');
    s.push('gir."** Başka bir gerçek servise (ör. e-posta, SMS) ait anahtar');
    s.push('varsa aynı şekilde sahtele ve aynı uyarıyı ekle.');
    s.push('');

    s.push('## Kesinlikle yapma');
    s.push('- Modül, sayfa ya da veritabanı tablosu ekleme/çıkarma/değiştirme.');
    s.push('- İş mantığını değiştirme, yeni özellik ekleme.');
    s.push('- Bu üç madde dışında hiçbir şeye dokunma.');
    s.push('');

    s.push('Bitirince tek commit\'le **`main` dalına** gönder:');
    s.push(`   \`[${TASK_PREFIX}-0] Template temizliği\``);
    s.push('');
    s.push('Anladıysan tek cümleyle onayla, sonra temizliği yap.');

    return s.join('\n');
  },

  /* ---------- Görsel dünya: ChatGPT'ye giden iki prompt ----------
     Studio kod tarafını Claude'a, görünüş tarafını ChatGPT'ye veriyor.
     Buradan çıkan iki metin de müşteri deposuna değil, bir sohbete gider;
     depo uyarısı yok, kod talimatı yok. */

  /* Profesyonel tasarım — 5 sabit yön promptu. Her biri projenin gerçek
     ekran görüntüsünü girdi alıp yalnız görsel dili değiştiriyor; içerik,
     kartlar, menü aynı kalıyor. Metinler TASARIM_YON'da (config.js). */
  tasarimYonu(projeId, anahtar) {
    const p = DB.proje(projeId);
    const yon = TASARIM_YON.find(y => y.anahtar === anahtar);
    if (!p || !yon) return '';
    const firma = p.firma || 'Bu işletme';
    const sektor = p.sektor ? p.sektor + ' sektörüne' : 'işletmenin diline';
    return yon.prompt.replace(/\{FIRMA\}/g, firma).replace(/\{SEKTOR\}/g, sektor);
  },

  /* Yön seçildikten sonraki ilk Claude Code promptu. Studio artık işin
     içinde değil — asıl uygulama Claude Code'da doğrudan konuşularak
     yapılıyor. Bu prompt kapıyı açıyor ama Claude'dan liste istemiyor:
     ihtiyaç duyduğu her görsel/ikon için AYRI, kullanıcının doğrudan
     ChatGPT'ye yapıştırabileceği bir prompt yazmasını istiyor — o prompt
     ekteki mockup'ın görsel dilini kendi cümleleriyle tarif ediyor,
     çünkü aynı referans görseli ChatGPT'ye de elle verilecek. */
  tasarimVarlikIstek(projeId, anahtar) {
    const p = DB.proje(projeId);
    if (!p) return '';
    const yon = TASARIM_YON.find(y => y.anahtar === anahtar);

    const s = [];
    s.push('# ' + projeAdi(p) + ' — profesyonel tasarıma geçiş', '');

    const slug = depoSlug(p.repo);
    if (slug) {
      s.push('> ### Depo: `' + slug + '`');
      s.push('> Bu oturum yalnız bu depoya bağlı olmalı. Deposu farklıysa dur');
      s.push('> ve söyle; başka depo ekleme, commit atma.');
      s.push('');
    }

    s.push('Ekteki görseli incele. **Profesyonel tasarıma geçiş** aşamasındayız —');
    s.push('uygulamayı şimdi tam olarak bu görseldeki gibi görünür hale getireceğiz.');
    s.push('Müşteriye 5 farklı görsel yön sunuldu, ekteki mockup şu seçilen yöne ait:');
    s.push('');
    if (yon) {
      s.push(`**${yon.ad}** — ${yon.ozet}`);
    } else {
      s.push('> Yön adı Studio\'da bulunamadı; sohbete eklediğim mockup görseline bak.');
    }
    s.push('');
    s.push('Bu görseli bu sohbete **ekli olarak** ekliyorum — yoksa dur ve iste,');
    s.push('tahmin etme.', '');

    s.push('## Şimdi senden istediğim', '');
    s.push('**Henüz uygulama kodu yazma.** Bu görsele geçmek için gereken her');
    s.push('görseli ve ikonu **ChatGPT\'den** isteyeceğiz — sen kodu yazmadan önce');
    s.push('bana o istekleri hazırla:', '');
    s.push('1. Ekteki mockup\'ı incele, hangi yeni görsel/ikon dosyalarına ihtiyaç');
    s.push('   olduğunu çıkar — mockup\'ta gördüğün ama depoda karşılığı olmayan');
    s.push('   her illüstrasyon, fotoğraf ya da özel simge için ayrı ayrı say.');
    s.push('   Kodda SVG olarak çizilebilecek basit ikonları sayma — onları zaten');
    s.push('   sen çizeceksin.');
    s.push('2. **İhtiyacım olan her görsel/ikon için AYRI bir ChatGPT promptu yaz.**');
    s.push('   Ben o promptu, ekteki mockup görseliyle **birlikte** ChatGPT\'ye');
    s.push('   vereceğim. İki durum var, hangisiyse ona göre yaz:', '');
    s.push('   - **Mockup\'ta zaten görünen bir öğeyse** (ör. ana illüstrasyon,');
    s.push('     fotoğraf) — **sıfırdan tarif etme.** Doğrudan ekteki görsele işaret');
    s.push('     et: "Ekteki görselde [nerede duran, ne olan] [öğe] var — bunu');
    s.push('     **birebir aynısıyla**, yalnız bu öğeyi, saydam zeminli PNG olarak');
    s.push('     ver." Rengini, pozunu, kıyafetini kendi cümlelerinle yeniden');
    s.push('     anlatma — bu, ChatGPT\'nin görseldekinden **farklı** bir şey');
    s.push('     üretmesine yol açar; biz aynı görseli istiyoruz, benzerini değil.');
    s.push('   - **Mockup\'ta hiç görünmeyen ama aynı görsel dille çizilmesi gereken');
    s.push('     yeni bir öğeyse** (ör. mockup\'ta olmayan bir ikon) — bu kez neyin');
    s.push('     çizileceğini tarif et, ama yine ekteki görsele referans vererek:');
    s.push('     "Ekteki görselin çizim stiline, renk paletine ve çizgi kalınlığına');
    s.push('     uygun bir [öğe] çiz."');
    s.push('   Her iki durumda da tam olarak hangi dosyadan söz ettiğini ve');
    s.push('   önerilen boyut/formatı belirt (ör. `1200×800 · webp`,');
    s.push('   `512×512 · png, saydam zemin`).');
    s.push('3. Her promptun üstüne, kod bloğundan **önce**, kısa başlık olarak şunu');
    s.push('   yaz: dosyanın adı ve depoda hangi klasöre konacağı. Klasör yapısını');
    s.push('   sen belirle ve **kendin oluştur** (boş kalmasın diye içine kısa bir');
    s.push('   `README.md` koyabilirsin); benden klasör açmamı isteme.');
    s.push('4. Cevabın: her görsel için `### Dosya adı — depo/klasör/yolu` başlığı,');
    s.push('   altında kopyalanabilir bir kod bloğu içinde ChatGPT promptu. Kaç');
    s.push('   görsel gerekiyorsa o kadar blok olsun.');
    s.push('');
    s.push('ChatGPT\'den gelen görselleri sana verdiğimde devam edip tasarımı');
    s.push('gerçek koda uygulayacaksın — şimdilik yalnız bu promptları bekliyorum.');

    return s.join('\n');
  },

  /* Standart ekleme promptu — bir programda yeni bir kural doğduğunda,
     o değişikliği yapan Claude oturumuna yapıştırılır. Claude kuralı sabit
     bir blok olarak geri verir; blok Studio'ya yapıştırılınca standart
     kendiliğinden kurulur. Amaç: standart yazmak için Studio'ya oturup
     form doldurmak zorunda kalmamak. */
  standartEkle() {
    const alanlar = [...new Set(standartListesi()
      .map(st => (st.alan || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr'));

    const s = [];
    s.push('# Nizam standardı — kural çıkar', '');

    s.push('Bu oturumda yaptığımız **son değişikliğe** bak. İçinde bundan sonra');
    s.push('**her** programda geçerli olması gereken bir kural var mı?');
    s.push('');
    s.push('- Yoksa yalnızca `YOK` yaz, başka hiçbir şey yazma.');
    s.push('- Varsa aşağıdaki bloğu doldur. Blok dışında tek kelime yazma —');
    s.push('  ne giriş, ne özet, ne kutlama. Metnin tamamı Studio\'ya yapıştırılacak.');
    s.push('');

    s.push('## Biçim', '');
    s.push('```');
    s.push('Grup: Tasarım');
    s.push('Alan: Üst çubuk');
    s.push('Başlık: Araç düğmeleri profil panelinde');
    s.push('Kural: Üst çubukta yalnız marka, sayfa adı ve kullanıcı kutusu durur.');
    s.push('Not defteri, bildirim, destek gibi araçlar kullanıcı kutusuna basınca');
    s.push('açılan panelin satırları olur.');
    s.push('```');
    s.push('');
    s.push('Birden fazla kural çıktıysa blokları `---` ile ayır.');
    s.push('');

    s.push('## Grup — bu sekizden birini seç, yenisini uydurma', '');
    STANDART_GRUPLARI.forEach(g => s.push('- ' + g));
    s.push('');

    if (alanlar.length) {
      s.push('## Alan — varsa bu listeden seç', '');
      s.push('Alan, ekranın hangi parçasından söz ettiğini söyler. Aşağıdakilerden');
      s.push('biri uyuyorsa **aynen** onu yaz; hiçbiri uymuyorsa yeni bir tane');
      s.push('yaz ama kısa tut, iki kelimeyi geçme.');
      s.push('');
      alanlar.forEach(a => s.push('- ' + a));
      s.push('');
    }

    s.push('## Kuralı nasıl yazacaksın', '');
    s.push('- **Kod anlatma.** "`#btn-not` kaldırıldı" değil, "kalem üst çubukta');
    s.push('  durmaz". Kuralı okuyan başka bir programı sıfırdan yazacak.');
    s.push('- **Emir kipi, geniş zaman.** "Yaptık", "kaldırdık" değil; "olur",');
    s.push('  "durmaz", "kullanılmaz".');
    s.push('- **Nedenini bir cümleyle söyle** — sonradan tartışma çıkmasın.');
    s.push('- **Bu programa özel şeyi standart yapma.** "Ofis fotoğrafı panelde');
    s.push('  arka plan olur" bir standart değil, bu programın tercihidir.');
    s.push('  "Arka plan görseli 200 KB\'ı geçmez" standarttır.');
    s.push('- **Başlık iki üç kelime.** Alan zaten yeri söylüyor, başlık kuralın');
    s.push('  ne dediğini söyler.');
    s.push('');

    s.push('Kod yazma, dosya değiştirme, commit atma. Yalnız bloğu ver.');

    return s.join('\n');
  },

  /* ---------- Proje kimlik dosyası ---------- */

  kimlik(projeId) {
    const proje = DB.proje(projeId);
    if (!proje) return '';

    const moduller = DB.modulleri(projeId);
    const gorevler = DB.gorevleri({ proje: projeId });
    const s = [];

    s.push(`# ${projeAdi(proje)} — Proje Kimliği`, '');
    s.push('> Bu dosyayı NIZAM Studio üretti.');
    s.push('> Her iş sonrası güncellenmesi geliştirmeyi yapan AI\'ın görevidir.');
    s.push('');

    s.push('## Genel');
    s.push(hiza('Platform', PLATFORM_ADI[proje.platform] || '—'));
    s.push(hiza('Veritabanı', VERI_ADI[proje.veri] || '—'));
    s.push(hiza('Ana renk', (PROJE_RENK[proje.renk] || PROJE_RENK.metal)[0]));
    if (proje.repo) s.push(hiza('Depo', proje.repo));
    s.push('');

    s.push(PROMPT.teknikBlogu(proje)); s.push('');
    const cevapMetni = PROMPT.cevapBlogu(proje);
    if (cevapMetni) { s.push(cevapMetni); s.push(''); }
    /* Kimlik dosyasında adres değil yerleşim dursun — imzalı adres bir
       saatte ölür, depoya yazılırsa yanıltıcı olur. G0 (kart zemini) ve
       Y_ ile başlayanlar (tasarım yönü mockup'ları) uygulamanın gerçek
       görseli değil, buraya girmiyor. */
    const yerlesim = ((proje.palet || {}).gorseller || [])
      .filter(y => y.yol && y.no !== 'G0' && y.no.slice(0, 2) !== 'Y_');
    const logoVar = !!((typeof DB !== 'undefined' && DB.logoAdres) || {})[proje.id];
    if (yerlesim.length || logoVar) {
      s.push('## Görseller', '');
      if (logoVar) {
        s.push('- **logo.png** — firmanın logosu: açılış, giriş, üst çubuk '
             + 'amblemi, favicon ve PWA simgesi. Yeniden çizilmez.');
      }
      yerlesim.forEach(y => s.push(`- **${y.no} · ${y.dosya}** — ${y.ad}${y.tarif ? ': ' + y.tarif : ''}`));
      s.push('');
    }
    const kunyeMetni2 = PROMPT.kunyeBlogu(proje);
    if (kunyeMetni2) { s.push(kunyeMetni2); s.push(''); }
    s.push(PROMPT.kurulumBlogu(proje)); s.push('');

    s.push('## Modüller ve sayfalar');
    moduller.forEach(m => {
      const sayfalar = DB.sayfalari(m.id);
      s.push('');
      s.push(`### ${m.ad}`);

      if (m.genel) {
        s.push('Modüle bağlanmayan işler bu kovaya düşer.');
        return;
      }
      if (!sayfalar.length) { s.push('_Henüz sayfa tanımlanmadı._'); return; }

      sayfalar.forEach(sf => {
        const bitmis = DB.gorevleri({ sayfa: sf.id })
          .filter(g => g.durum === 'tamamlandi')
          .map(g => g.baslik);
        s.push(`- ${sf.ad}${bitmis.length ? ' — ' + bitmis.join(', ') : ''}`);
      });
    });
    s.push('');

    const kullanilan = new Set();
    gorevler.forEach(g => DB.gorevinStandartlari(g.id).forEach(st => kullanilan.add(st.ad)));
    if (kullanilan.size) {
      s.push('## Kullanılan Nizam Standartları');
      Array.from(kullanilan).sort().forEach(ad => s.push(`- ${ad}`));
      s.push('');
    }

    const acik = gorevler.filter(g => g.durum !== 'tamamlandi');
    if (acik.length) {
      s.push('## Devam eden işler');
      acik.forEach(g => s.push(`- [${TASK_PREFIX}-${g.no}] ${g.baslik} — ${DURUM_GOREV_ADI[g.durum]}`));
      s.push('');
    }

    s.push('## Kararlar');
    s.push('_Buraya projeye özel kalıcı kararlar yazılır. Örnek:_');
    s.push('_"Kayıtlar silinmez, pasife alınır." · "Fiyatlar KDV hariç tutulur."_');
    s.push('');

    const son = gorevler
      .filter(g => g.durum === 'tamamlandi')
      .sort((a, b) => (b.guncellendi || '').localeCompare(a.guncellendi || ''))[0];

    s.push('## Son güncelleme');
    s.push(son ? `${gunYaz(son.guncellendi)} · ${TASK_PREFIX}-${son.no}` : gunYaz(new Date().toISOString()));

    return s.join('\n');
  },
};

/* ---------- Yardımcılar ---------- */

function hiza(etiket, deger) {
  return (etiket + '            ').slice(0, 12) + ': ' + deger;
}

function yerYaz(modul, sayfa) {
  if (modul && sayfa) return `${modul.ad} modülü › ${sayfa.ad} sayfası`;
  if (modul)          return `${modul.ad} modülü`;
  return 'Proje geneli';
}

function gunYaz(iso) {
  const a = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const d = new Date(iso);
  return `${d.getDate()} ${a[d.getMonth()]} ${d.getFullYear()}`;
}

/* Panoya kopyala — eski tarayıcılarda da çalışsın diye iki yol */
async function panoyaKopyala(metin) {
  try {
    await navigator.clipboard.writeText(metin);
    return true;
  } catch (e) {
    try {
      const alan = document.createElement('textarea');
      alan.value = metin;
      alan.style.position = 'fixed';
      alan.style.opacity = '0';
      document.body.appendChild(alan);
      alan.select();
      const ok = document.execCommand('copy');
      alan.remove();
      return ok;
    } catch (e2) { return false; }
  }
}

/* Metni dosya olarak indir */
function dosyaIndir(adi, metin) {
  const bag = new Blob([metin], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(bag);
  const a = document.createElement('a');
  a.href = url; a.download = adi;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
