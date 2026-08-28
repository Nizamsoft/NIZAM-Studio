/* ==========================================================================
   NIZAM | Studio — Prompt motoru
   İki metin üretir:
     1) Görev promptu — geliştirici kopyalar, AI'a yapıştırır
     2) NIZAM.md      — müşteri deposundaki proje kimlik dosyası
   Tek kural: geliştirici hiçbir şey yazmasın, yalnızca yapıştırsın.
   ========================================================================== */

'use strict';

const PROMPT = {

  /* Projenin teması açık mı? Varsayılan koyu. */
  /* Müşteri uygulamaları hep açık tema. Studio'nun kendi teması ayrı. */
  temaAcik() { return true; },

  /* ---- Görsel dil ----
     Renk, yüzey, tipografi ve simge biçimi artık Studio'da seçilmiyor:
     ChatGPT logo ve işletme görselinden bir tarif çıkarıyor, o tarif
     buraya olduğu gibi giriyor. Studio karar vermiyor, taşıyor. */
  gorselDilBlogu(proje) {
    const pl = (proje && proje.palet) || {};
    const t = String(pl.tarif || '').trim();
    if (!t) return '';

    const s = ['## Görsel Dil'];
    s.push('Bu tarifi ben yazmadım, tasarımı yapan çıkardı. **Olduğu gibi uygula.**');
    s.push('Renk tahmin etme, yazı tipi değiştirme, kendi ölçünü koyma.');
    s.push('');
    s.push(t);
    s.push('');
    s.push('Renk ve ölçüler tek yerde değişken olarak tanımlansın; her ekranda');
    s.push('yeniden yazılmasın. Bir ekranda uyguladığın kural bütün ekranlarda aynı.');
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
    if (!yuvalar.length) return '';

    const s = ['## Görseller'];
    s.push('Aşağıdaki görselleri **indir ve depoya koy**. Her birinin nerede');
    s.push('kullanılacağı yazıyor; başka yere koyma, kırpma, rengini değiştirme.');
    s.push('');
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

  /* Teknik standart — her projede aynı. Görev promptuna ve NIZAM.md'ye girer. */
  teknikBlogu(proje) {
    const pl0 = (proje && proje.palet) || {};
    const yerel = pl0.veriKatmani === 'Yerel tarayıcı';

    const s = ['## Teknik Standart'];
    s.push('Bunlar Nizam Soft standardı. Tartışma, değiştirme, alternatif önerme —');
    s.push('gerekiyorsa önce sor.');
    if (yerel) {
      s.push('');
      s.push('> **Bu proje sunucusuz.** Veri kullanıcının tarayıcısında kalıyor;');
      s.push('> Supabase, kimlik doğrulama ve gerçek zamanlı yok. Aşağıdaki');
      s.push('> satırlar buna göre yazıldı.');
    }
    s.push('');

    /* Yerelde altı satır anlamını yitiriyor; yerlerine YEREL_STANDART geçiyor. */
    const yazilan = [];
    TEKNIK_STANDART.forEach(([ad, deger, not]) => {
      const y = yerel && YEREL_STANDART[ad];
      if (y) { yazilan.push(ad); s.push(`- **${ad}: ${y[0]}**`); if (y[1]) s.push(`  - ${y[1]}`); return; }
      s.push(`- **${ad}: ${deger}**`);
      if (not) s.push(`  - ${not}`);
    });
    /* Standartta karşılığı olmayanlar (Yedek gibi) sona eklenir. */
    if (yerel) {
      Object.keys(YEREL_STANDART).forEach(ad => {
        if (yazilan.includes(ad)) return;
        const y = YEREL_STANDART[ad];
        s.push(`- **${ad}: ${y[0]}**`);
        if (y[1]) s.push(`  - ${y[1]}`);
      });
    }

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
        s.push('  - Yetki veritabanı kurallarıyla (RLS) uygulanır, yalnız arayüzde gizlemekle değil.');
      });
    }
    const eksik = TEKNIK_ALAN.filter(a => !pl[a.anahtar] && a.anahtar !== 'veriKatmani');
    if (eksik.length) {
      s.push('', `> Şunlar henüz belirlenmedi: ${eksik.map(a => a.ad).join(', ')}.`);
      s.push('> Bunlara ihtiyaç duyduğunda uydurma — sor.');
    }
    return s.join('\n');
  },

  /* Depo durağının tanışma promptu. Tasarım (durak 3) ve yapı (durak 4)
     henüz yapılmadı; buraya onlardan hiçbir şey girmez. Amaç yalnızca
     depoyu tanıtmak ve NIZAM.md'yi kurmak. */
  tanisma(projeId) {
    const p = DB.proje(projeId);
    if (!p) return '';

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

    s.push('## Şimdi ne yapacaksın');
    s.push('1. ' + (slug ? '`' + slug + '` deposunun' : 'Deponun')
      + ' köküne `NIZAM.md` adında bir dosya aç. İçine yukarıdaki');
    s.push('   proje bilgilerini ve teknik standardı yaz. Sonuna şu üç boş');
    s.push('   başlığı ekle: `## Tasarım kararları`, `## Modüller ve sayfalar`,');
    s.push('   `## Kararlar` — hepsinin altına *"henüz belirlenmedi"* yaz.');
    s.push('2. Kısa bir `README.md` ekle: firma adı, ürün adı, tek cümle tarif.');
    s.push('3. Bunları tek commit\'le **`main` dalına** gönder. Commit mesajı:');
    s.push('   `[' + TASK_PREFIX + '-0] Proje kimliği`. Oturuma ayrı bir dal atanmış');
    s.push('   olabilir; bu depo yeni, ayrı dala ve pull request\'e gerek yok.');
    s.push('4. Dur ve bekle.');
    s.push('');

    s.push('## Şunları yapma');
    s.push('- **Uygulama kodu yazma.** Ekran, bileşen, veritabanı şeması, hiçbiri.');
    s.push('- **Tasarım kararı verme.** Renk, yazı tipi, yerleşim — hiçbirini seçme.');
    s.push('- **Sayfa ya da modül uydurma.** Hangi ekranların olacağı henüz belli değil.');
    s.push('- **Bu oturuma başka depo ekleme.** Tek depo, tek oturum.');
    s.push('- Eksik gördüğün bir şeyi tahmin etme; not al, sonra sor.');
    s.push('');

    s.push('## Sırada ne var');
    s.push('Bundan sonra sana iki blok daha yapıştıracağım (2/3 ve 3/3):');
    s.push('');
    s.push('1. **Tasarım kararları** — palet, yazı tipleri ve arayüz kararları.');
    s.push('2. **Modüller, sayfalar ve künyeleri** — hangi ekranlar olacak, her');
    s.push('   birinde hangi alanlar duracak, kim ne yapabilecek.');
    s.push('');
    s.push('Her blok geldiğinde `NIZAM.md` dosyasını büyüteceksin. Uygulama kodu');
    s.push('ancak ikisi de geldikten sonra, görev görev yazılacak.');
    s.push('');
    s.push('Anladıysan tek cümleyle onayla, dosyaları oluştur ve bekle.');

    return s.join('\n');
  },

  /* 2. blok — tasarım kararları. Tanıtımdan sonra aynı Claude Code
     oturumuna yapıştırılır. Marka paleti promptuyla karıştırılmasın:
     o palet İSTEMEK için, bu palet GELDİKTEN sonra kararları teslim için. */
  tasarim(projeId) {
    const p = DB.proje(projeId);
    if (!p) return '';

    const s = [];
    s.push('# ' + projeAdi(p) + ' — Görsel dil (2/3)', '');

    const slug = depoSlug(p.repo);
    if (slug) {
      s.push('> ### Depo: `' + slug + '`');
      s.push('> Bu oturum yalnız bu depoya bağlı olmalı. Deposu farklıysa dur');
      s.push('> ve söyle; başka depo ekleme, dosya oluşturma, commit atma.');
      s.push('');
    }

    s.push('Tanıtımdan sonraki **ilk blok** bu. Uygulamanın nasıl görüneceği');
    s.push('burada yazıyor. Sonuncusu modüller, sayfalar ve künyeleri olacak.');
    s.push('');
    s.push('Bu blokta iki iş var: **görselleri depoya indirmek** ve görsel dili');
    s.push('`NIZAM.md`\'ye yazmak. **Uygulama kodu yazmanı hâlâ istemiyorum.**');
    s.push('');

    const gorsel = PROMPT.gorselBlogu(p);
    if (gorsel) { s.push(gorsel); s.push(''); }

    const dil = PROMPT.gorselDilBlogu(p);
    if (dil) { s.push(dil); s.push(''); }
    else {
      s.push('> **Görsel dil tarifi yok.** Studio\'da Görsel dünya adası');
      s.push('> tamamlanmamış. Renk ve biçim uydurma — bana sor.');
      s.push('');
    }

    s.push(PROMPT.tasarimBlogu(p));
    s.push('');

    s.push('## Şimdi ne yapacaksın');
    let n = 1;
    if (gorsel) {
      s.push(n++ + '. Yukarıdaki görselleri indir, depo köküne koy. Adresler bir');
      s.push('   saat geçerli — ilk işin bu olsun.');
    }
    s.push(n++ + '. `NIZAM.md` içindeki `## Tasarım kararları` başlığının altındaki');
    s.push('   *"henüz belirlenmedi"* satırını sil; görsel dili, görsel');
    s.push('   yerleşimini ve arayüz kararlarını oraya yaz. Renk kodlarını');
    s.push('   olduğu gibi aktar.');
    s.push(n++ + '. Tek commit\'le **`main` dalına** gönder. Commit mesajı:');
    s.push('   `[' + TASK_PREFIX + '-0] Görsel dil`.');
    s.push(n++ + '. Dur ve bekle. Sıradaki ve son blok: modüller, sayfalar ve künyeleri.');
    s.push('');

    s.push('## Şunları yapma');
    s.push('- **Uygulama kodu yazma.** Ekran, bileşen, CSS dosyası — hiçbiri.');
    s.push('- **Görsel dili yorumlama.** Tarifte ne yazıyorsa o; "daha modern');
    s.push('  olur" diye değiştirme, eksik gördüğünü uydurma, sor.');
    s.push('- **Görsel üretme ya da yerine başkasını koyma.** Bir adres');
    s.push('  açılmıyorsa dur ve söyle.');
    s.push('- **Sayfa ya da modül uydurma.** Hangi ekranların olacağı hâlâ belli değil.');
    s.push('- **Bu oturuma başka depo ekleme.** Tek depo, tek oturum.');
    s.push('');
    s.push('Görseller indi ve yazıldıysa tek cümleyle onayla ve bekle.');

    return s.join('\n');
  },

  /* 3. blok — modüller, sayfalar ve künyeleri. Öncekilerin aksine bu blok
     kod yazmayı İSTER: beta sürüm buradan çıkar. */
  yapi(projeId) {
    const p = DB.proje(projeId);
    if (!p) return '';

    const s = [];
    s.push('# ' + projeAdi(p) + ' — Modüller ve sayfalar (3/3)', '');

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

    s.push(PROMPT.kurulumBlogu());
    s.push('');

    s.push('## Şimdi ne yapacaksın');
    s.push('1. `NIZAM.md` içindeki `## Modüller ve sayfalar` başlığının altındaki');
    s.push('   *"henüz belirlenmedi"* satırını sil, yukarıdaki künyeleri oraya yaz.');
    s.push('2. Yukarıdaki **beş aşamayı** sırayla uygula. Her aşamanın sonunda dur,');
    s.push('   ne yaptığını özetle ve bana denetmeden sonrakine geçme.');
    s.push('3. Her aşamayı ayrı commit\'le **`main` dalına** gönder. Commit mesajı');
    s.push('   `[' + TASK_PREFIX + '-0] <aşama adı>` biçiminde olsun.');
    s.push('4. Beş aşama bitince haber ver — ben deneyip eksikleri görev olarak');
    s.push('   açacağım, sonra tek tek geleceğiz.');
    s.push('');

    s.push('## Şunları yapma');
    s.push('- **Görsel dili değiştirme.** 2. bloktaki tarif neyse o. Görseller');
    s.push('  zaten depoda; yerlerini değiştirme, yenisini üretme.');
    s.push('- **Künyede olmayan alan, sayfa ya da modül ekleme.** Alan listesi o');
    s.push('  sayfanın veritabanı tablosudur; eksik gördüğün bir şey varsa sor.');
;
    s.push('- **Beş aşamayı birleştirme.** Hepsini bir seferde yazarsan ters giden');
    s.push('  şey 5000 satır sonra anlaşılır.');
    s.push('- **Bu oturuma başka depo ekleme.** Tek depo, tek oturum.');

    return s.join('\n');
  },

  /* Kurulum aşamaları — hem görev promptunda hem NIZAM.md'de yazar. */
  kurulumBlogu() {
    const s = ['### Nasıl kodlanacak — beş aşama'];
    s.push('');
    s.push('**Hepsini bir seferde yazma.** Aşağıdaki beş aşamaya böl. Her aşamanın');
    s.push('sonunda dur, ne yaptığını özetle ve kullanıcıdan denemesini iste.');
    s.push('Onay gelmeden sonraki aşamaya geçme. Bir şey ters gittiyse 5000 satır');
    s.push('sonra değil, o aşamada anlaşılsın.');
    s.push('');
    KURULUM_ADIM.forEach((a, i) => {
      s.push(`#### ${i + 1}. ${a.ad}`);
      a.yap.forEach(x => s.push(`- ${x}`));
      s.push(`> **Kullanıcıya test ettir:** ${a.test}`);
      s.push('');
    });
    s.push('Her aşamanın içinde "Uygulama sırası" bölümündeki sırayı izle.');
    s.push('Bir sonraki görevde bu kararlar aynen geçerli olacak.');
    return s.join('\n');
  },

  /* Arayüz biçimi — görev promptuna ve NIZAM.md'ye aynı biçimde girer. */
  tasarimBlogu(proje) {
    const pl = (proje && proje.palet) || {};
    const s = ['## Arayüz Kararları'];
    s.push('Bir ekran görüntüsünde görünmeyen kararlar. Görsel dil bunları');
    s.push('söylemiyor; ben seçtim. Kendi biçimini uydurma.');

    TASARIM_GRUP.forEach(g => {
      if (!g.alanlar.length) return;
      s.push('', `### ${g.ad}`);
      g.alanlar.forEach(a => {
        const adlar = bicimSecim(pl, a);
        if (!adlar.length) { s.push(`- **${a.ad}: yok**`); return; }
        s.push(`- **${a.ad}: ${adlar.join(' + ')}**`);
        adlar.forEach(ad => {
          const sc = a.secim.find(x => x.ad === ad);
          if (sc) s.push(`  - ${sc.ad}: ${sc.tarif}`);
        });
        if (adlar.length > 1) s.push('  - Bu seçenekler birleşerek uygulanır, biri diğerini iptal etmez.');
      });
    });
    return s.join('\n');
  },

  /* Sayfa künyeleri — AI'ın ekranı tahmin etmeden kurabilmesi için.
     Alan türleri veritabanı sütununu, eylemler düğmeleri, roller satır
     güvenliği kurallarını belirliyor. */
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
    s.push('- Yetki satırı satır güvenliği (RLS) kuralıdır: yazılı rol ve üstü o işi');
    s.push('  yapabilir, altındakiler yapamaz.');

    /* Modül düzeyi */
    const mkh = pl.modulKunye || {};
    Object.keys(mkh).forEach(m => {
      const mk = mkh[m] || {};
      if (!(mk.roller || []).length && !(mk.eylemler || []).length) return;
      s.push('', `### ${m} — modül kuralları`, '');
      if ((mk.roller || []).length)
        s.push(`- **Görebilen:** ${mk.roller.join(' · ')}`);
      if ((mk.eylemler || []).length) {
        s.push('- **Yapılabilecek işler ve yetkiler:**');
        mk.eylemler.forEach(ey => {
          const r = ((mk.yetki || {})[ey] || mk.roller || []);
          s.push(`  - ${ey} — ${r.length ? r.join(' · ') : 'belirtilmedi'}`);
        });
      }
      if (mk.kural) s.push(`- **Ortak kural:** ${mk.kural}`);
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
      const farkli = (f.roller || []).length || (f.eylemler || []).length
        || Object.keys(f.yetki || {}).length || (f.kural || '').trim();
      if (farkli) {
        s.push('- **Bu sayfada modül kuralından farklı:**');
        if ((f.roller || []).length) s.push(`  - Görebilen: ${f.roller.join(' · ')}`);
        (f.eylemler || []).forEach(ey => {
          const r = (f.yetki || {})[ey] || [];
          s.push(`  - ${ey} — ${r.length ? r.join(' · ') : 'yalnız bu sayfada var'}`);
        });
        if ((f.kural || '').trim()) s.push(`  - Kural: ${f.kural}`);
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
    const s = [];
    s.push('Bir iş yazılımının bir modülünü kuruyorum. Aşağıda ne olacağını');
    s.push('kendi cümlelerimle anlattım.');
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
    s.push(`Modül: ${taslak.modul || '—'}`);
    if (roller.length) s.push(`Roller (alttan üste): ${roller.join(' · ')}`);

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
    s.push('- Bir kaydı kim görebilir, kim değiştirebilir, kim silebilir');
    s.push('  (bunu modülün tamamı için sor, sayfa sayfa değil)');
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
    s.push('    "roller": ["Personel"],');
    s.push('    "eylemler": ["Ekle", "Düzenle", "Sil", "Ara"],');
    s.push('    "yetki": { "Ekle": ["Personel"], "Düzenle": ["Amir"], "Sil": ["Yönetici"] },');
    s.push('    "kural": "Bütün sayfalarda geçerli iş kuralı, yoksa boş"');
    s.push('  },');
    s.push('  "sayfalar": [');
    s.push('    {');
    s.push('      "ad": "Hesaplar",');
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
    s.push('      "fark": { "roller": [], "eylemler": [], "yetki": {}, "kural": "" }');
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
    s.push('- `tur` yalnız: ' + SAYFA_TURU.map(x => x.ad).join(' · '));
    s.push('- Alan `tur` yalnız: ' + ALAN_TURU.map(x => x.ad).join(' · '));
    s.push('- **`modulKurallari` bir kez yazılır, bütün sayfalarda geçerlidir.**');
    s.push('  Kim görür, hangi işler yapılabilir, hangi işi kim yapar, ortak kural.');
    s.push('  Sayfaların içinde bunları tekrarlama.');
    s.push('- `eylemler` şunlar olabilir: ' + SAYFA_EYLEM.join(' · '));
    s.push('  Listede olmayan gerçek bir iş varsa ("Ters kayıt", "Birleştir") onu da');
    s.push('  yazabilirsin — uydurma, gerçekten gerekiyorsa.');
    s.push('- `fark` yalnız o sayfa modül kuralından **ayrılıyorsa** dolar.');
    s.push('  Ör. yalnız işverenin gördüğü bir ayar ekranı, ya da o sayfaya özel bir');
    s.push('  kural. Ayrılmıyorsa hepsini boş bırak.');
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
    if (roller.length) {
      s.push('- `roller` ve `yetki` yalnız şu rollerden: ' + roller.join(' · '));
      s.push('  Roller alttan üste sıralı; alttaki bir rol yazılırsa üstündekiler');
      s.push('  de o işi yapabilir demektir, hepsini yazmana gerek yok.');
    }
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

  /* ---------- Görsel dünya: ChatGPT'ye giden iki prompt ----------
     Studio kod tarafını Claude'a, görünüş tarafını ChatGPT'ye veriyor.
     Buradan çıkan iki metin de müşteri deposuna değil, bir sohbete gider;
     depo uyarısı yok, kod talimatı yok. */

  /* 1 · Tasarım promptu — logo ve işletme görseliyle birlikte verilir. */
  gorselTasarim(projeId) {
    const p = DB.proje(projeId);
    if (!p) return '';
    const pl = p.palet || {};
    const roller = rolListesi(pl.roller);

    const s = [];
    s.push('# ' + projeAdi(p) + ' — görsel dünya', '');

    s.push('Sana iki görsel veriyorum: **birincisi firmanın logosu**,');
    s.push('**ikincisi işletmenin kendisi**. Bu ikisinden bir görsel dil çıkar');
    s.push('ve aşağıdaki altı ekranı tasarla. Hepsi tek dünyadan çıksın —');
    s.push('renk, doku, simge biçimi ve tipografi bütün ekranlarda aynı olsun.', '');

    s.push('## Firma');
    s.push(hiza('Firma', p.firma));
    if (modulAdi(p)) s.push(hiza('Ürün', modulAdi(p)));
    if (p.sektor)    s.push(hiza('Sektör', p.sektor));
    s.push(hiza('Platform', PLATFORM_ADI[p.platform] || '—'));
    if (roller.length) s.push(hiza('Roller', roller.join(' · ')));
    s.push('');

    s.push('## Tasarlayacağın altı ekran');
    s.push('1. **Panel** — açılışta karşılayan ekran; kısayol kartları ve günün özeti.');
    s.push('2. **Liste** — en çok bakılan ekran; arama, filtre, satırlar, ana eylem.');
    s.push('3. **Kayıt girişi** — form; alan etiketleri, kutular, kaydet düğmesi.');
    s.push('4. **Boş durum** — hiç kayıt yokken liste ekranı ne diyor.');
    s.push('5. **Giriş ekranı** — e-posta ve şifre; uygulamaya girilen ilk ekran.');
    s.push('6. **Ayarlar** — satır satır seçenek listesi.');
    s.push('');

    s.push('## Kalite çıtası — en önemli bölüm');
    s.push('Temiz ve düzgün bir ekran yetmiyor. Aşağıdaki **altı katman**');
    s.push('olmadan tasarım yarım sayılır. Her birini uygula:', '');

    s.push('**1 · Açılış görseli.** Panel düz bir renk şeridiyle başlamaz.');
    s.push('   Tam genişlik bir görselle açılır, içerik sayfası büyük bir köşe');
    s.push('   yarıçapıyla onun **üstüne biner**. Görselin altına, yazının');
    s.push('   okunacağı yere perde koy.');
    s.push('**2 · İşe özel simgeler.** Hazır simge setine benzeyen çizim verme.');
    s.push('   Bu işin **kendi nesnelerini** çiz — kasap için satır ve terazi,');
    s.push('   kuruyemişçi için çuval ve kavanoz, lokanta için tencere ve ocak.');
    s.push('   Tek renk çizgi değil: paletten iki üç renk kullan, arkalarına');
    s.push('   yumuşak bir daire zemin koy.');
    s.push('**3 · Doku.** Düz dolgu bırakma. Kart zemininde kâğıt greni,');
    s.push('   ekran arkasında dikişsiz bir doku olsun — hafif, %5-8 civarı,');
    s.push('   okunurluğu bozmayacak kadar.');
    s.push('**4 · Amblem ve süsleme.** Logoyu kutuya sıkıştırma; çevresine');
    s.push('   markaya yakışan bir çerçeve kur. Altına bir satır slogan koy.');
    s.push('   Bölüm başlıklarının altına ince çizgi, kart köşelerine küçük');
    s.push('   bir işaret gibi tekrar eden bir motif bırak.');
    s.push('**5 · Derinlik.** Her şey tek düzlemde durmasın. Yumuşak ve');
    s.push('   katmanlı gölge kullan; sayfa görselin üstünde, kart sayfanın');
    s.push('   üstünde dursun. Sert kutu gölgesi değil, geniş ve düşük opaklıklı.');
    s.push('**6 · Tipografi ölçeği.** Serif yazı tipini aksesuar gibi kullanma.');
    s.push('   Panel selamlaması ve bölüm başlıkları **gerçek boyutta** serif');
    s.push('   olsun (28-32px), gövde sans kalsın. Boyut basamakları belirgin');
    s.push('   olsun, her şey 14-16px arasında sıkışmasın.', '');

    s.push('Çıta şu: bu ekranlar bir **yönetim paneli** gibi değil, bir');
    s.push('**butik otel ya da el yapımı marka uygulaması** gibi görünmeli.');
    s.push('İş verisi her zaman önde ve okunaklı — ama arkasında bir dünya olsun.', '');

    s.push('### Şunları yapma');
    s.push('- Beyaz zemin üstünde beyaz kart. En az bir tonluk fark olsun.');
    s.push('- Renkli bir şeritten ibaret üst başlık.');
    s.push('- Material, Lucide, Feather gibi hazır setlerden çıkmış görünen simge.');
    s.push('- Hazır yönetim paneli şablonu havası.');
    s.push('- Süs uğruna okunurluğu bozmak: metin kontrastı her yerde 4.5:1.', '');

    s.push('## Görselleri sen üret');
    s.push('Tasarımın gerektirdiği görselleri **kendin üret** ve her birine sıra');
    s.push('numarası ver. **`G1` benim verdiğim işletme görselidir** — onu');
    s.push('kullanmak istersen numarası odur, yeniden üretme.');
    s.push('');
    s.push('- **İki ayrı simge dili kur.** Büyük yerlerde (hızlı işlem kartları,');
    s.push('  boş durum) zengin, gölgeli, çok renkli illüstrasyon simgeler;');
    s.push('  alt çubuk, liste satırları ve form alanlarında sade, **tek renk**,');
    s.push('  ince çizgi simgeler. İkincisi tek renk olmalı çünkü aktif sekmede');
    s.push('  rengi kodla değiştireceğiz.');
    s.push('- Doku ve zemin dikişsiz döşenebilsin.');
    s.push('- Metnin üstüne gelen her görselde perde ya da karartma olsun;');
    s.push('  yazı kontrastı en az **4.5:1** kalmalı.');
    s.push('');

    s.push('## Uyacağın kurallar');
    s.push('- Arayüz dili **Türkçe**. Para `₺` (12.400,00), tarih `22.05.2025`.');
    s.push('- Dokunma hedefi en az **44×44px**.');
    s.push('- Logonun rengini, biçimini ve oranını değiştirme.');
    s.push('- Bu bir **iş uygulaması**: gün boyu kullanılacak. Süs okunurluğu');
    s.push('  bozmasın, veri her zaman önde olsun.');
    s.push('- Ekranları telefon ölçüsünde tasarla; masaüstünde aynı dil geniş');
    s.push('  ekrana taşınacak.');
    s.push('');

    s.push('## Nasıl teslim edeceksin');
    s.push('Hepsini **tek bir tabakada** ver: solda altı ekran numaralı ve');
    s.push('başlıklı, sağda bir **Stil ve Varlık Listesi** paneli. O panelde');
    s.push('şunlar olsun:', '');
    s.push('- **Görseller** — ürettiğin her görselin küçük hâli, altında');
    s.push('  numarası (`G1`, `G2`…) ve tek satırlık ne olduğu');
    s.push('- **İkon seti** — bütün simgeler bir arada, tek SVG');
    s.push('- **Doku / zemin** — dikişsiz örneğin bir karesi');
    s.push('- **Renk paleti** — kutucuklar ve altında hex kodları');
    s.push('- **Yazı tipleri** — başlık ve gövde, örnek satırlarıyla');
    s.push('- **Yuvarlama** — köşe yarıçapı değeri');
    s.push('- **Bileşen örnekleri** — birincil ve ikincil düğme, durum etiketleri,');
    s.push('  giriş alanı', '');

    s.push('Beğenmezsem söyleyeceğim, düzelteceksin. Anlaştıktan sonra senden');
    s.push('iki şey isteyeceğim: **bunu nasıl yaptığının tarifi** ve');
    s.push('**ekranlarda kullandığın görsellerin tek tek dosya hâli**.');
    s.push('O yüzden ekranları çizerken kullandığın her görseli — hero,');
    s.push('illüstrasyon, ikon seti, doku, süsleme — sonradan ayrı ayrı');
    s.push('çıkarabileceğin şekilde kur. Sonra "yeniden çizeyim" olmayacak;');
    s.push('aynısını isteyeceğim.');

    return s.join('\n');
  },

  /* 2 · Tarif promptu — tasarım beğenildikten sonra verilir.
     Çıktı Studio'ya yapıştırılıyor; YERLEŞİM bölümü boru işaretiyle
     ayrılmış olmalı ki yuvalar kendiliğinden açılabilsin. */
  gorselTarif(projeId) {
    const p = DB.proje(projeId);
    if (!p) return '';

    const s = [];
    s.push('Tasarımı beğendim. Şimdi **bunu nasıl yaptığını yaz** — başka biri');
    s.push('aynı dili hiç görmediği ekranlarda tekrarlayabilsin diye.', '');

    s.push('İki bölüm istiyorum, **tam olarak bu başlıklarla**:', '');

    s.push('```');
    s.push('## GÖRSEL DİL');
    s.push('Renk: ana, ikincil, vurgu, zemin, metin — hex kodlarıyla ve hangisi nerede');
    s.push('Yüzey: kart zemini, köşe yarıçapı, kenarlık');
    s.push('Doku: hangi yüzeyde hangi doku, opaklığı ne');
    s.push('Derinlik: gölge değerleri ve neyin neyin üstünde durduğu');
    s.push('Tipografi: başlık ve gövde yazı tipi, ağırlık, boyut basamakları (px)');
    s.push('Simge: çizim biçimi, çizgi kalınlığı, kaç renk, arkasında zemin var mı');
    s.push('Amblem: logo çerçevesi, slogan, tekrar eden süsleme motifi');
    s.push('Açılış: panelin tepesi nasıl kurulur — görsel, perde, içeriğin binmesi');
    s.push('Boşluk: temel birim ve kart içi / kartlar arası ölçüler');
    s.push('Başlık düzeni: bölüm başlıkları nasıl görünür');
    s.push('Alt çubuk: zemin, simge rengi, ortadaki düğme');
    s.push('');
    s.push('## YERLEŞİM');
    s.push('G1 | gorsel-1.jpg | Panel açılışı | Tam genişlik 260px, üstüne koyudan şeffafa perde');
    s.push('G2 | gorsel-2.png | Zemin dokusu | Bütün ekranların arkasında, %6 opaklık, dikişsiz');
    s.push('```');
    s.push('');

    s.push('### YERLEŞİM biçimi — buna harfiyen uy');
    s.push('Her satır tek görsel, **dört alan, aralarında boru işareti** `|`:');
    s.push('');
    s.push('`numara | dosya adı | nerede | nasıl duracağı`');
    s.push('');
    s.push('- **numara**: `G1`, `G2`… ürettiğin sırayla. `G1` benim verdiğim');
    s.push('  işletme görselidir; kullanmadıysan onu yazma.');
    s.push('- **dosya adı**: `gorsel-1.jpg` gibi, küçük harf, Türkçe harf yok.');
    s.push('  Uzantıyı amaca göre seç: illüstrasyon ve doku `.png`, arayüz');
    s.push('  simgesi ve süsleme `.svg`. Burada yazdığın ad bağlayıcı: görseli');
    s.push('  aynı adla üreteceksin, uygulama o adla arayacak.');
    s.push('- **İki simge setini ayrı satır yaz.** Örnek:');
    s.push('  `G4 | ikon-buyuk.png | Hızlı işlem kartları | Bakır illüstrasyon, 256px, saydam`');
    s.push('  `G5 | ikon-arayuz.svg | Alt çubuk ve liste satırları | Tek renk, currentColor`');
    s.push('- **nerede**: kısa ad — "Panel açılışı", "Giriş ekranı zemini".');
    s.push('- **nasıl duracağı**: ölçü, perde, opaklık — tek cümle.');
    s.push('- Satır başına `-` ya da numara koyma, tabloya çevirme.');
    s.push('');

    s.push('### Şunları yapma');
    s.push('- Kod yazma. Ne CSS ne HTML — bu bir tarif, uygulama değil.');
    s.push('- İki başlığın dışına bölüm ekleme.');
    s.push('- "Duruma göre", "tercihen" gibi belirsiz ifade kullanma; kararı ver.');
    s.push('- Kullanmadığın bir görseli YERLEŞİM\'e yazma.');
    s.push('');

    s.push('## Sonra görselleri ver — bu bölüm zorunlu');
    s.push('Tarif tek başına işe yaramıyor: kodu yazacak olan görselleri de');
    s.push('almalı. İki bölümü verdikten **hemen sonra**, sormadan, beklemeden');
    s.push('`YERLEŞİM` listesindeki **her görseli tek tek üret**.', '');

    s.push('> ### Yeniden tasarlama — çıkar');
    s.push('> Bu görselleri tasarımda **zaten çizdin** (yeni bir sohbetteysek:');
    s.push('> yukarıda ekli tasarım tabakasında). Şimdi yapacağın şey');
    s.push('> yeni bir görsel üretmek değil, ekranlarda kullandığın görseli');
    s.push('> tek dosya hâlinde **çıkarmak**. Aynı çizim dili, aynı renkler,');
    s.push('> aynı ışık, aynı malzeme hissi. Sadeleştirme, moderniz etme,');
    s.push('> "daha kullanışlı olur" diye başka bir üsluba geçme.');
    s.push('> ');
    s.push('> **Özellikle ikon setinde.** Ekranlarda hangi çizim diliyle');
    s.push('> çizdiysen — gölgeli mi, hacimli mi, kaç renkli, hangi malzeme —');
    s.push('> dosyada da o dil olacak. Düz iki renkli geometrik simgeye');
    s.push('> çevirme. Küçük boyutta okunması için yeterince büyük ve net');
    s.push('> üret; üslubu değiştirerek çözme.');
    s.push('');

    s.push('### Sırayla ver — hepsini bir seferde deneme');
    s.push('Bir mesajda **tek görsel**. Verdikten sonra tek satırla');
    s.push('*"kaldı: G4, G6"* diye yaz ve dur. Ben **"devam"** diyeceğim,');
    s.push('sıradakine geçeceksin. Hepsini bir seferde üretmeye kalkışınca');
    s.push('yarıda kesiliyor ve eksik görsel fark edilmiyor.', '');

    s.push('- Görselin başında numarası ve dosya adı yazsın: `G2 · gorsel-2.jpg`.');
    s.push('- **Dosya adı YERLEŞİM\'de yazdığıyla birebir aynı olsun.** Uzantıyı');
    s.push('  değiştirme; listede `.svg` yazan `.png` olarak gelmesin.');
    s.push('- **Bana dosyanın kendisini ver.** İndirilebilir dosya ya da kod');
    s.push('  bloğu; çalışma alanındaki yol (`/mnt/data/...`) işime yaramıyor,');
    s.push('  onu indiremiyorum.', '');

    s.push('### Biçim amaca göre seçilir');
    s.push('- **İllüstrasyon, fotoğraf, doku, gölgeli/çok renkli simge → PNG.**');
    s.push('  Saydam zemin, en az 256×256. Bunları SVG olarak üretmeye');
    s.push('  çalışma: gölge ve malzeme hissi vektörde ya kayboluyor ya da');
    s.push('  dosya devleşiyor. Sen de kolaya kaçıp düz simgeye çeviriyorsun —');
    s.push('  **çevirme**, PNG ver.');
    s.push('- **Arayüz simgesi (alt çubuk, liste, form) → SVG.** Tek renk,');
    s.push('  gölgesiz, ince çizgi. Tek dosya; her simge kendi');
    s.push('  `<symbol id="ikon-siparis">` öğesinde. **Dosyada renk gömülü');
    s.push('  olmasın** (`currentColor` kullan) — aktif sekmede rengi kodla');
    s.push('  değiştireceğiz.');
    s.push('- **Süsleme, çerçeve, ayırıcı → SVG.** Tek ya da iki renk, sade.');
    s.push('- **Doku dikişsiz olsun** — yan yana döşenince ek yeri görünmesin.');
    s.push('- İllüstrasyonların zemini **gerçekten saydam** olsun. Arkasına');
    s.push('  açık renk leke, kâğıt parçası ya da yumuşak gölge **pişirme** —');
    s.push('  koyu zeminde kirli bir bulut gibi görünüyor.');
    s.push('- **Görsellerin içine yazı gömme.** Logo, slogan, etiket, başlık,');
    s.push('  sahte tablo satırı — hiçbiri. Uygulama yazıyı kendi çiziyor;');
    s.push('  gömülü olursa üst üste biner ve ölçeklenince bulanıklaşır.');
    s.push('- **Kanvas görselin kendisi kadar olsun.** Küçük bir motifi kocaman');
    s.push('  boş tuvalin ortasına koyma; kırpılmış ver.');
    s.push('- Örnek, yer tutucu, "burada şöyle bir görsel olacak" gibi şeyler');
    s.push('  gönderme. Gerçek dosyayı üret.');
    s.push('- Bir görseli üretemiyorsan sessizce atlama: hangisi ve neden,');
    s.push('  tek cümleyle söyle.', '');

    s.push('Hepsi bittiğinde tek satırla onayla: kaç görsel verdin ve');
    s.push('numaraları ne. Ben bunları uygulamadaki yuvalarına koyacağım.');

    return s.join('\n');
  },

  /* ---------- Geliştirme durağı: iki ayrı yön ---------- */

  /* Program geliştirmesi — Studio'ya sonradan eklenen teknik standartları
     bu programa taşır. Yalnız o programın deposunda çalışır. */
  programGelistirme(projeId) {
    const p = DB.proje(projeId);
    if (!p) return '';

    const yeniler = yeniStandartlar(p.palet);
    if (!yeniler.length) return '';

    const pl    = p.palet || {};
    const yerel = pl.veriKatmani === 'Yerel tarayıcı';
    const s = [];

    s.push('# ' + projeAdi(p) + ' — standart güncellemesi', '');

    const slug = depoSlug(p.repo);
    s.push('> ### Depo: ' + (slug ? '`' + slug + '`' : 'kayıtlı değil'));
    if (slug) {
      s.push('> Bu oturum yalnız bu depoya bağlı olmalı. Deposu farklıysa dur');
      s.push('> ve söyle; başka depo ekleme, dosya oluşturma, commit atma.');
    } else {
      s.push('> Bu programın deposunu Studio\'ya yazmamışım. Dosyaya dokunmadan');
      s.push('> önce doğru depoda olduğunu bana sor.');
    }
    s.push('');

    s.push('Nizam Soft teknik standardına yeni satır' + (yeniler.length > 1 ? 'lar' : '')
      + ' eklendi. Bu program o');
    s.push('satır' + (yeniler.length > 1 ? 'lar' : '') + ' yokken kuruldu; şimdi ona da uygulanacak.', '');

    s.push('## Yeni standart' + (yeniler.length > 1 ? 'lar' : ''), '');
    yeniler.forEach(([ad, deger, not]) => {
      const y = yerel && YEREL_STANDART[ad];
      s.push('- **' + ad + ': ' + (y ? y[0] : deger) + '**');
      const n = y ? y[1] : not;
      if (n) s.push('  - ' + n);
    });
    s.push('');

    s.push('## Şimdi ne yapacaksın');
    s.push('1. `NIZAM.md` dosyasını aç. `## Teknik Standart` başlığının altına');
    s.push('   yukarıdaki satır' + (yeniler.length > 1 ? 'ları' : 'ı') + ' ekle — kimlik dosyası doğruluk kaynağı,');
    s.push('   önce orası güncellenir.');
    s.push('2. Sonra kodda uygula. Bu standart mevcut bir davranışla çakışıyorsa');
    s.push('   uydurma — dur ve bana sor.');
    s.push('3. Tek commit yeter. Mesajın başına `[' + TASK_PREFIX + '-0]` yaz ve');
    s.push('   **`main` dalına** gönder.');
    s.push('');

    s.push('## Şunları yapma');
    s.push('- **Başka bir şeye dokunma.** Yalnız bu standart' + (yeniler.length > 1 ? 'lar' : '') + '. Yol üstünde');
    s.push('  gördüğün eksikleri düzeltme, not olarak yaz.');
    s.push('- **Tasarım kararlarını değiştirme.**');
    s.push('- **Bu oturuma başka depo ekleme.**');

    return s.join('\n');
  },

  /* Studio geliştirmesi — "bütün programlarda böyle olsun" isteği.
     Hedef depo müşterininki değil, Studio'nun kendisi. */
  studioGelistirme(istek) {
    const metin = String(istek || '').trim();
    if (!metin) return '';

    const s = [];
    s.push('# NIZAM Studio — yeni teknik standart', '');

    s.push('> ### Depo: `' + APP.depo + '`');
    s.push('> Bu istek tek bir müşteri programı için değil. Studio\'nun kendi');
    s.push('> deposunda çalış; müşteri deposuna dokunma, bu oturuma başka depo');
    s.push('> ekleme. Oturum başka bir depodaysa dur ve söyle.');
    s.push('');

    s.push('## İstek', '');
    s.push(metin, '');

    s.push('## Ne yapacaksın');
    s.push('1. Bunu `config.js` içindeki `TEKNIK_STANDART` dizisine yeni bir satır');
    s.push('   olarak ekle. Biçim: `[ad, değer, not, eklendi]`.');
    s.push('   - **ad** kısa olsun, iki üç kelime.');
    s.push('   - **not** neden ve nasıl olduğunu tek paragrafta anlatsın.');
    s.push('   - **eklendi** bu sürümün bir üstü olsun — damgasız satırı eski');
    s.push('     programlar hiç duymaz.');
    s.push('2. Veri yerelde olan projelerde anlamı değişiyorsa `YEREL_STANDART`');
    s.push('   içine de karşılığını yaz.');
    s.push('3. Zaten var olan bir satırla çakışıyorsa yeni satır açma — mevcut');
    s.push('   satırı güncelle ve damgasını bu sürüme çek.');
    s.push('4. Studio\'nun sürüm işlerini yap: `config.js` içindeki `APP.version`,');
    s.push('   `CHANGELOG.md` (en yeni üstte), `index.html` içindeki `?v=`');
    s.push('   numaraları, `sw.js` içindeki `CACHE` adı.');
    s.push('5. `main` dalına gönder.');
    s.push('');

    s.push('## Şunları yapma');
    s.push('- **Kod yazma dışında bir şey kurma.** Bu bir standart satırı; yeni');
    s.push('  ekran, yeni ayar, yeni tablo istemiyorum.');
    s.push('- **Görev durumlarını artırma.** Dört tane: Yapılacak, Geliştiriliyor,');
    s.push('  Kontrolde, Tamamlandı.');
    s.push('');

    s.push('Bittiğinde Studio\'yu güncelleyip her programın Geliştirme durağında');
    s.push('bu standardı göreceğim; oradan tek tek uygulatacağım.');

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
    const dilMetni = PROMPT.gorselDilBlogu(proje);
    if (dilMetni) { s.push(dilMetni); s.push(''); }
    /* Kimlik dosyasında adres değil yerleşim dursun — imzalı adres bir
       saatte ölür, depoya yazılırsa yanıltıcı olur. */
    const yerlesim = ((proje.palet || {}).gorseller || []).filter(y => y.yol && y.no !== 'G0');
    if (yerlesim.length) {
      s.push('## Görseller', '');
      yerlesim.forEach(y => s.push(`- **${y.no} · ${y.dosya}** — ${y.ad}${y.tarif ? ': ' + y.tarif : ''}`));
      s.push('');
    }
    s.push(PROMPT.tasarimBlogu(proje)); s.push('');
    const kunyeMetni2 = PROMPT.kunyeBlogu(proje);
    if (kunyeMetni2) { s.push(kunyeMetni2); s.push(''); }
    s.push(PROMPT.kurulumBlogu()); s.push('');

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
  return (etiket + '          ').slice(0, 11) + ': ' + deger;
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
