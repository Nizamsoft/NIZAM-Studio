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
    const d  = pl.dil;
    const t  = String(pl.tarif || '').trim();
    if (!dilGecerli(d) && !t) return '';

    const s = ['## Görsel Dil'];
    s.push('Bunu ben yazmadım, tasarımı yapan çıkardı. **Olduğu gibi uygula.**');
    s.push('Renk tahmin etme, yazı tipi değiştirme, kendi ölçünü koyma.');
    s.push('');

    /* Yeni akış blok veriyor: değerler tam, tahmine yer yok. Eski projelerde
       yalnız serbest metin tarif var; o da olduğu gibi geçiyor. */
    if (dilGecerli(d)) {
      s.push('**Renk**');
      DIL_RENK.forEach(([anahtar, ad]) => {
        if (d.renk[anahtar]) s.push(`- ${ad}: \`${d.renk[anahtar]}\``);
      });
      Object.keys(d.renk).forEach(k => {
        if (!DIL_RENK.some(x => x[0] === k)) s.push(`- ${k}: \`${d.renk[k]}\``);
      });
      const y = d.yazi || {};
      if (y.baslik || y.metin) {
        s.push('', '**Yazı**');
        if (y.baslik) s.push(`- Başlık: ${y.baslik}`);
        if (y.metin)  s.push(`- Metin: ${y.metin}`);
        if (y.yedek) {
          s.push(`- **Çevrimdışı yedek: ${y.yedek}**`);
          s.push('  Yazı tipi dosyalarını servis işçisi önbelleğe alsın;');
          s.push('  alamıyorsa bu yedeğe düşülür, ekran bozulmaz.');
        }
        Object.keys(y.olcek || {}).forEach(k =>
          s.push(`- ${k}: ${y.olcek[k]} (boyut/satır, px)`));
      }
      const ko = d.kose || {};
      if (Object.keys(ko).length || d.bosluk) {
        s.push('', '**Ölçü**');
        Object.keys(ko).forEach(k => s.push(`- Köşe · ${k}: ${ko[k]}px`));
        if (d.bosluk) s.push(`- Boşluk birimi: ${d.bosluk}px — bütün aralıklar bunun katı.`);
      }
      const ek = [['golge', 'Gölge'], ['doku', 'Doku'], ['amblem', 'Amblem'],
                  ['bosDurumGorseli', 'Boş durum görseli']];
      const varEk = ek.filter(x => d[x[0]]);
      if (varEk.length) {
        s.push('', '**Malzeme**');
        varEk.forEach(([k, ad]) => s.push(`- ${ad}: ${d[k]}`));
      }
      if (d.durum && Object.keys(d.durum).length) {
        s.push('', '**Durum renkleri**');
        Object.keys(d.durum).forEach(k => {
          const m = (d.durumMetin || {})[k];
          s.push(`- ${k}: \`${d.durum[k]}\`${m ? ` — üstündeki yazı \`${m}\`` : ''}`);
        });
      }

      /* Kontrast: hangi renk metin olur, hangisi olmaz. En sık yapılan
         erişilebilirlik hatası zayıf kontrastlı rengi yazıya uygulamak. */
      const kn = d.kontrast || {};
      if ((kn.metneUygun || []).length || (kn.yalnizCizgi || []).length) {
        s.push('', '**Kontrast** — ölçüldü, tahmin değil.');
        if ((kn.metneUygun || []).length)
          s.push(`- Metin olarak kullanılabilir: ${kn.metneUygun.join(' · ')}`);
        if ((kn.yalnizCizgi || []).length) {
          s.push(`- **Yalnız çizgi, kenar ve dolgu:** ${kn.yalnizCizgi.join(' · ')}`);
          s.push('  Bu renkleri yazıya uygulama — 4.5:1 kuralını karşılamıyorlar.');
        }
      }

      if (d.grafik && Object.keys(d.grafik).length) {
        s.push('', '**Grafik**');
        Object.keys(d.grafik).forEach(k => s.push(`- ${k}: ${d.grafik[k]}`));
      }

      /* Bileşenler kodun asıl işi: her biri tek cümle, sayı içeriyor.
         "Kart nasıl görünür" sorusu yirmi iki sayfada aynı cevabı alsın. */
      const b = d.bilesenler || {};
      const bVar = DIL_BILESEN.filter(x => b[x[0]]);
      if (bVar.length) {
        s.push('', '**Bileşenler** — her ekranda aynı, yeniden yorumlama.');
        bVar.forEach(([k, ad]) => s.push(`- **${ad}:** ${b[k]}`));
        Object.keys(b).forEach(k => {
          if (!DIL_BILESEN.some(x => x[0] === k)) s.push(`- **${k}:** ${b[k]}`);
        });
      }

      const sm = d.simge || {};
      if (sm.bicim || (sm.liste || []).length) {
        s.push('', '**Simgeler** — hazır set kullanma, hepsini kodda SVG olarak çiz.');
        if (sm.bicim) s.push(`- Biçim: ${sm.bicim}`);
        if (sm.cizgi) s.push(`- Çizgi kalınlığı: ${sm.cizgi}px`);
        if ((sm.boyut || []).length) s.push(`- Boyutlar: ${sm.boyut.join(' · ')}px`);
        (sm.liste || []).forEach(x => s.push(`  - \`${x.ad}\` — ${x.cizim || ''}`));
      }

      const isk = d.iskelet || {};
      const iVar = Object.keys(isk);
      if (iVar.length) {
        s.push('', '**Sayfa iskeletleri** — künyedeki ekran türüne göre.');
        s.push('Her sayfa türünün düzeni budur; sayfa sayfa yeni düzen kurma.');
        iVar.forEach(k => s.push(`- **${k}:** ${isk[k]}`));
      }
      s.push('');
    }
    if (t) { s.push(t, ''); }

    s.push('Renk ve ölçüler tek yerde değişken olarak tanımlansın; her ekranda');
    s.push('yeniden yazılmasın. Bir ekranda uyguladığın kural bütün ekranlarda aynı.');
    return s.join('\n');
  },

  /* ---- Tasarımla ilgili standart satırları ----
     ChatGPT'ye standardı vermiyorduk; o da üst çubuğu, alt menüyü ve
     gezinmeyi kendi kafasına göre tarif edip standardın karşısına
     geçiyordu. Görülen sekiz çakışmanın hepsi bu eksiklikten. */
  TASARIM_GRUBU: ['Tasarım', 'Animasyon', 'Erişilebilirlik', 'Biçim', 'Optimizasyon'],

  tasarimStandardi(proje) {
    const satir = [];
    DB.standartGruplari(standartListesi()).forEach(g => {
      if (PROMPT.TASARIM_GRUBU.indexOf(g.ad) < 0) return;
      /* Biçim `teknikBlogu` ile aynı: alan · başlık, altında kural.
         Standart satırlarında ayrı bir "değer" alanı yok — başlık zaten
         kararı söylüyor, tarif nedenini. */
      g.alanlar.forEach(a => a.liste.forEach(st => {
        if (!st.ad || !st.tarif) return;
        satir.push(`- **${a.ad} · ${st.ad}**`);
        satir.push('  - ' + String(st.tarif).replace(/\n+/g, ' '));
      }));
    });
    if (!satir.length) return '';

    const s = ['## Nizam Standardı — bunlara uy'];
    s.push('Bunlar bütün Nizam programlarında geçerli. **Karşısına geçme,');
    s.push('alternatif önerme.** Tasarımını bunların üstüne kur; bir satırla');
    s.push('çelişiyorsan bloğu verme, önce bana sor.', '');
    return s.concat(satir).join('\n');
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
             boş kalır ve hiç yazılmaz. */
          const t = (yerel && st.yerel) ? st.yerel : st.tarif;
          if (!t) return;
          satir.push('- **' + a.ad + ' · ' + st.ad + '**');
          satir.push('  - ' + String(t).replace(/\n+/g, ' '));
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
    s.push('1. **Tasarım sistemi** — renk, tipografi, bileşenler, simge dili, iskeletler.');
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
    s.push('# ' + projeAdi(p) + ' — Tasarım sistemi (2/3)', '');

    const slug = depoSlug(p.repo);
    if (slug) {
      s.push('> ### Depo: `' + slug + '`');
      s.push('> Bu oturum yalnız bu depoya bağlı olmalı. Deposu farklıysa dur');
      s.push('> ve söyle; başka depo ekleme, dosya oluşturma, commit atma.');
      s.push('');
    }

    s.push('Tanıtımdan sonraki **ilk blok** bu. Uygulamanın nasıl görüneceği');
    s.push('burada yazıyor: renk, tipografi, ölçüler, bileşenler, simge dili ve');
    s.push('sayfa iskeletleri. Sonuncusu modüller, sayfalar ve künyeleri olacak.');
    s.push('');

    const gorsel = PROMPT.gorselBlogu(p);
    if (gorsel) {
      s.push('Bu blokta iki iş var: **görselleri depoya indirmek** ve tasarım');
      s.push('sistemini `NIZAM.md`\'ye yazmak. **Uygulama kodu yazmanı hâlâ');
      s.push('istemiyorum.**', '');
      s.push(gorsel); s.push('');
    } else {
      s.push('Tek iş var: **tasarım sistemini `NIZAM.md`\'ye yazmak.**');
      s.push('İndirilecek dosya yok — simgeler kodda SVG olarak çizilecek,');
      s.push('nasıl çizileceği aşağıda yazıyor. **Uygulama kodu yazmanı hâlâ');
      s.push('istemiyorum.**', '');
    }

    const dil = PROMPT.gorselDilBlogu(p);
    if (dil) { s.push(dil); s.push(''); }
    else {
      s.push('> **Görsel dil yok.** Studio\'da Görsel dünya adası');
      s.push('> tamamlanmamış. Renk ve biçim uydurma — bana sor.');
      s.push('');
    }


    s.push(PROMPT.tasarimBlogu(p));
    s.push('');

    const cevap = PROMPT.cevapBlogu(p);
    if (cevap) { s.push(cevap); s.push(''); }

    s.push('## Şimdi ne yapacaksın');
    let n = 1;
    if (gorsel) {
      s.push(n++ + '. Yukarıdaki görselleri indir, depo köküne koy. Adresler bir');
      s.push('   saat geçerli — ilk işin bu olsun.');
    }
    s.push(n++ + '. `NIZAM.md` içindeki `## Tasarım kararları` başlığının altındaki');
    s.push('   *"henüz belirlenmedi"* satırını sil; yukarıdaki her şeyi oraya');
    s.push('   yaz — renk kodları, yazı tipleri ve ölçekleri, köşe ve boşluk');
    s.push('   değerleri, bileşen tarifleri, simge dili ve listesi, sayfa');
    s.push('   iskeletleri, arayüz kararları. **Sayıları olduğu gibi aktar**,');
    s.push('   yuvarlama, kendi ölçünü koyma.');
    s.push(n++ + '. Renk ve ölçüleri `NIZAM.md`de tek bir değişken listesi olarak');
    s.push('   yaz — kod yazarken oradan okunacak, her ekranda yeniden');
    s.push('   tanımlanmayacak.');
    s.push(n++ + '. Tek commit\'le **`main` dalına** gönder. Commit mesajı:');
    s.push('   `[' + TASK_PREFIX + '-0] Tasarım sistemi`.');
    s.push(n++ + '. Dur ve bekle. Sıradaki ve son blok: modüller, sayfalar ve künyeleri.');
    s.push('');

    s.push('## Şunları yapma');
    s.push('- **Uygulama kodu yazma.** Ekran, bileşen, CSS dosyası — hiçbiri.');
    s.push('- **Tasarım sistemini yorumlama.** Ne yazıyorsa o; "daha modern');
    s.push('  olur" diye değiştirme, eksik gördüğünü uydurma, sor.');
    s.push('- **Simge çizme.** Şimdi değil. Nasıl çizileceğini not al; kodu');
    s.push('  yazarken çizeceksin.');
    if (gorsel) {
      s.push('- **Görsel üretme ya da yerine başkasını koyma.** Bir adres');
      s.push('  açılmıyorsa dur ve söyle.');
    }
    s.push('- **Sayfa ya da modül uydurma.** Hangi ekranların olacağı hâlâ belli değil.');
    s.push('- **Bu oturuma başka depo ekleme.** Tek depo, tek oturum.');
    s.push('- **Emin olmadığını uydurma.** Takıldığın bir şey varsa dur ve sor;');
    s.push('  sonradan söküp yeniden yazmaktan iyidir.');
    s.push('');
    s.push(gorsel
      ? 'Görseller indi ve yazıldıysa tek cümleyle onayla ve bekle.'
      : 'Yazıldıysa tek cümleyle onayla ve bekle.');

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

    const cevap = PROMPT.cevapBlogu(p);
    if (cevap) { s.push(cevap); s.push(''); }

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
    s.push('- **Emin olmadığını uydurma.** Künyede yazmayan bir karar gerekiyorsa');
    s.push('  dur ve sor; yanlış tahmin sonradan söküp yeniden yazmak demek.');
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
    s.push('');
    s.push(PROMPT.yetkiBlogu());
    return s.join('\n');
  },

  /* Yetki tasarım anında değil, uygulamanın içinde yönetiliyor. Müşterinin
     ekibi zamanla değişiyor; her işe alımda geliştiriciye dönüp kod
     yazdırmak anlamsız. Studio yalnız katmanların ne olduğunu söylüyor,
     kimin hangi katmanda olacağını uygulamadaki admin belirliyor. */
  yetkiBlogu() {
    const s = ['### Yetkiler ekranı — uygulamanın içinde'];
    s.push('');
    s.push('Kimin neyi görebileceğini ve yapabileceğini **kodda sabitleme.**');
    s.push('Uygulamada bir **Yetkiler** ekranı olacak, yetkiyi oradan admin');
    s.push('yönetecek. Şunları karşılasın:');
    s.push('');
    s.push('- **Kullanıcı listesi.** Admin kullanıcı ekler, siler, pasife alır.');
    s.push('- **Katman atama.** Her kullanıcıya yukarıdaki rol katmanlarından');
    s.push('  biri verilir. Üstteki katman, alttakinin gördüğü her şeyi görür.');
    s.push('- **Modül ve sayfa izinleri.** Her katman için hangi sayfaların');
    s.push('  görüneceği ve hangi işlerin (ekle, düzenle, sil) yapılabileceği');
    s.push('  açılıp kapatılabilir olsun.');
    s.push('- **Yetkiler ekranını yalnız en üst katman görür.** Kendi katmanını');
    s.push('  düşüremesin, son admini silemesin.');
    s.push('- **Varsayılan:** en üst katman her şeyi yapar, alt katmanlar');
    s.push('  yalnız görür. Admin gerekeni açar.');
    s.push('');
    s.push('İzinler veritabanında tutulur ve **satır güvenliği (RLS) bu tabloyu');
    s.push('okur** — arayüzde düğmeyi gizlemek yetmez, sunucu tarafında da');
    s.push('engellensin. Veri yerel tarayıcıdaysa sunucu yok; o zaman Yetkiler');
    s.push('ekranı yalnız arayüzü biçimlendirir.');
    return s.join('\n');
  },

  /* Arayüz biçimi — görev promptuna ve NIZAM.md'ye aynı biçimde girer. */
  tasarimBlogu(proje) {
    const pl = (proje && proje.palet) || {};
    const s = ['## Arayüz Kararları'];
    s.push('Bir ekran görüntüsünde görünmeyen kararlar. Görsel dil bunları');
    s.push('söylemiyor; ben seçtim. Kendi biçimini uydurma.');
    if (pl.cozum) {
      s.push('');
      s.push('> Bu listede yalnız **bu projede gereken** başlıklar var. Burada');
      s.push('> geçmeyen bir özelliği kendiliğinden ekleme.');
    }

    tasarimGruplari(proje).forEach(g => {
      if (!g.alanlar.length) return;
      s.push('', `### ${g.ad}`);
      g.alanlar.forEach(a => {
        const adlar = bicimSecim(pl, a);
        if (!adlar.length) { s.push(`- **${a.ad}: yok**`); return; }
        s.push(`- **${a.ad}: ${adlar.join(' + ')}**${a.claude ? ' _(bu projeye özel başlık)_' : ''}`);
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
    s.push('- **Yetkiyi burada arama.** Hangi katmanın hangi sayfayı görüp hangi işi');
    s.push('  yapabileceği uygulamanın kendi Yetkiler ekranından yönetiliyor —');
    s.push('  aşağıdaki "Yetkiler ekranı" bölümüne bak.');

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

  /* ---------- İhtiyaç çözümlemesi ----------
     Her projede aynı on dört kararı sormak yanlıştı. Bu prompt hangi kararın
     bu projede gerektiğini, ne önerildiğini ve sayfa sayfa neyin nasıl
     görünmesi gerektiğini soruyor. Studio karar vermiyor; soruyu daraltıyor.

     Künyenin tamamı burada yok: aynı sohbete modül çözümlemesi zaten
     yapıştırıldı ve NIZAM.md depoda duruyor. Tekrar basmak promptun üçte
     ikisini kaplıyor ve tasarım sorusunu veri tablosunun altında bırakıyordu.
     Tasarım kararı için gereken tek şey ekranların listesi: ne tür ekran,
     kaç alan, hangi öbekte. */
  ihtiyac(projeId) {
    const p = DB.proje(projeId);
    if (!p) return '';
    const pl = p.palet || {};
    const roller = rolListesi(pl.roller);

    const s = [];
    s.push('# ' + projeAdi(p) + ' — tasarım ihtiyaç çözümlemesi', '');
    s.push('Bu modülü bu sohbette zaten konuştuk; künyeyi tekrar yazmıyorum —');
    s.push('gerekirse yukarıya ya da depodaki `NIZAM.md`ye bak. Şimdi sorduğum');
    s.push('şey **nasıl görüneceği**. Kod yazma, dosya değiştirme — yalnız');
    s.push('sondaki bloğu ver.', '');

    s.push('## Program');
    s.push(hiza('Firma', p.firma));
    if (modulAdi(p)) s.push(hiza('Ürün', modulAdi(p)));
    if (p.sektor)    s.push(hiza('Sektör', p.sektor));
    s.push(hiza('Platform', PLATFORM_ADI[p.platform] || '—'));
    if (roller.length) s.push(hiza('Roller', roller.join(' · ')));
    s.push('');

    /* Tek satırlık ekran listesi: tasarım kararı için gereken yoğunluk.
       Ne tür ekran, kaç kayıt, kaç alan — "tablo gerekir mi" sorusunun
       cevabı bu üçünde. */
    const kunye = pl.kunye || {};
    const adlar = Object.keys(kunye);
    if (adlar.length) {
      s.push('## Ekranlar', '');
      s.push('`sayfa · öbek · tür · beklenen kayıt · alan sayısı`', '');
      adlar.forEach(tam => {
        const k = kunye[tam] || {};
        const sf = tam.split(' · ').pop();
        const par = [k.grup || 'Diğer', (k.tur || 'belirsiz').toLocaleLowerCase('tr'),
                     k.olcek ? k.olcek.toLocaleLowerCase('tr') + ' kayıt' : '',
                     (k.alanlar || []).length + ' alan'].filter(Boolean);
        s.push(`- **${sf}** — ${par.join(' · ')}`);
      });
      s.push('');
    } else {
      s.push('> **Künye yok.** Yapı durağı tamamlanmamış. Elindeki azla karar ver,');
      s.push('> emin olmadığın başlığı `gerek: true` bırak — soru sorulmaya devam etsin.', '');
    }

    /* Studio'nun sabit listesi. Claude neyi eleyeceğini bilmek için hem
       başlıkları hem seçenekleri görmeli. */
    s.push('## Studio\'nun karar başlıkları');
    s.push('Bunlar bugün **her projede** soruluyor. Hangisi bu programda');
    s.push('gerçekten gerekli, hangisi boşuna soruluyor — sen söyleyeceksin.', '');
    TASARIM_GRUP.forEach(g => {
      if (!g.alanlar.length) return;
      s.push(`### ${g.ad}`);
      g.alanlar.forEach(a => {
        s.push(`- \`${a.anahtar}\` — **${a.ad}**: ${a.alt}`);
        s.push(`  Seçenekler: ${a.secim.map(x => x.ad).join(' | ')}`);
      });
      s.push('');
    });

    s.push('## Senden istediğim altı şey', '');
    s.push('**1 · Hangi karar gerekli.** Yukarıdaki her başlık için `gerek`');
    s.push('   yaz. Bu programda karşılığı yoksa `false` — o başlık hiç');
    s.push('   sorulmayacak ve koda da girmeyecek. Emin değilsen `true` bırak;');
    s.push('   fazladan soru, eksik özellikten iyidir.', '');
    s.push('**2 · Ne öneriyorsun.** `gerek: true` olan her başlık için bir');
    s.push('   seçenek öner ve **ekran listesinden gerekçe göster** — "sekiz');
    s.push('   ekranın beşi liste ve çok kayıtlı" gibi. Genel geçer cümle');
    s.push('   yazma. Öneri seçim yerine geçmiyor; kullanıcı görüp kendi');
    s.push('   dokunacak.', '');
    s.push('**3 · Eksik gördüğün başlık.** Studio\'nun listesinde olmayan ama bu');
    s.push('   programda karar verilmesi gereken bir şey varsa kendin aç —');
    s.push('   en az iki seçenekle. Uydurma; ekranlarda karşılığı olsun.', '');
    s.push('**4 · Sayfa sayfa tasarım.** Yukarıdaki ekranlar için: neyin nerede duracağı,');
    s.push('   hangi bileşenlerin gerektiği ve **o sayfada bir görsel gerekiyorsa**');
    s.push('   nerede ve ne olduğu. Bu liste ChatGPT\'ye gidecek ve tam o');
    s.push('   görseller üretilecek — "genel bir simge" deme, ne çizileceğini yaz.', '');
    s.push('   Her sayfaya not yazmak zorunda değilsin: sıradan bir liste');
    s.push('   ekranıysa atla. Notu hak eden sayfalara yaz.', '');
    s.push('**6 · Emin olmadıkların.** Künyede yazmayan ama kod yazılırken');
    s.push('   **karar vermek zorunda kalacağın** her şeyi sor. Tahmin edip');
    s.push('   geçme — yanlış tahmin sonradan söküp yeniden yazmak demek.');
    s.push('   Soruyu **gündelik dille** yaz, teknik terim kullanma; cevabı');
    s.push('   veren kişi yazılımcı değil. Nedenini de yaz: künyede neyi');
    s.push('   görüp bu soruyu sorduğunu. Cevabı birkaç seçeneğe sığıyorsa');
    s.push('   seçenekleri de ver — kullanıcı dokunup geçsin.');
    s.push('   Üç ile sekiz arası; her şeyi sorma, gerçekten takıldıklarını sor.', '');
    s.push('**5 · Hangi simgeler gerekiyor.** Bu programın ekranlarında hangi');
    s.push('   nesnelerin simgesi çizilecek — künyeden çıkar. "Belge, ayar,');
    s.push('   kullanıcı" gibi genel simge yazma; **bu işin kendi nesneleri**');
    s.push('   olsun: hesap, defter, fatura, kasa, mizan… On ile yirmi arası.');
    s.push('   Bu liste ChatGPT\'ye gidecek, tam onları çizecek.', '');
    s.push('   **Künyede karşılığı olmayan simge yazma.** Her simge için o');
    s.push('   nesnenin hangi sayfada geçtiğini `ne` alanında söyle; sayfayı');
    s.push('   gösteremiyorsan o simge gerekmiyor demektir. Arayüzün kendi');
    s.push('   simgelerini de unutma: geri oku, arama, kapatma, ekle.', '');

    s.push('## Cevabın', '');
    s.push('Tek bir JSON bloğu. Öncesinde ve sonrasında açıklama yazma —');
    s.push('kullanıcı bunu olduğu gibi kopyalayıp Studio\'ya yapıştıracak.', '');
    s.push('```json');
    s.push('{');
    s.push('  "kararlar": [');
    s.push('    { "anahtar": "genislik", "gerek": true, "oneri": "Tam genişlik",');
    s.push('      "neden": "22 sayfanın 9\'u tablo; dar kolon fatura satırını kırar." },');
    s.push('    { "anahtar": "iceaktarma", "gerek": false,');
    s.push('      "neden": "Veriler elle giriliyor, dosyadan toplu alım yok." }');
    s.push('  ],');
    s.push('  "yeni": [');
    s.push('    { "obek": "Kabuk", "ad": "Tablo yoğunluğu",');
    s.push('      "soru": "Satırlar ne kadar sık olsun?",');
    s.push('      "secim": [');
    s.push('        { "ad": "Sıkı", "tarif": "Satır yüksekliği 34px; ekrana çok kayıt sığar." },');
    s.push('        { "ad": "Ferah", "tarif": "Satır yüksekliği 52px; okuması kolay, az kayıt." }');
    s.push('      ],');
    s.push('      "oneri": "Sıkı",');
    s.push('      "neden": "Aylık gider satırı 200\'ü geçiyor." }');
    s.push('  ],');
    s.push('  "sorular": [');
    s.push('    { "soru": "Fatura numarasını sistem mi versin, elle mi girilsin?",');
    s.push('      "neden": "Künyede \'Fatura No\' alanı var ama kimin doldurduğu yazmıyor.",');
    s.push('      "secim": ["Sistem versin", "Elle girilsin", "İkisi de olsun"] },');
    s.push('    { "soru": "Kapanan bir hesap silinebilsin mi, pasife mi alınsın?",');
    s.push('      "neden": "Mali kayıt; silme geri alınamaz olabilir.",');
    s.push('      "secim": ["Pasife alınsın", "Silinebilsin"] },');
    s.push('    { "soru": "Hesap Defteri açılırken hangi tarih aralığı gelsin?",');
    s.push('      "neden": "Aylık 200+ satır var; hepsini açmak yavaş olur." }');
    s.push('  ],');
    s.push('  "simgeler": [');
    s.push('    { "ad": "hesap",  "ne": "Hesap kartı — cari ve banka hesapları listesinde" },');
    s.push('    { "ad": "defter", "ne": "Hesap defteri — hareket listesi başlığında" },');
    s.push('    { "ad": "fatura", "ne": "Alış ve satış faturaları ekranında" },');
    s.push('    { "ad": "kasa",   "ne": "Nakit hareketleri ve kasa sayımı" }');
    s.push('  ],');
    s.push('  "sayfalar": [');
    s.push('    { "sayfa": "Giderler",');
    s.push('      "yerlesim": "Üstte ay seçici ve toplam kartı yan yana; altında gider satırları. En altta sabit toplam satırı.",');
    s.push('      "bilesenler": ["Özet kartı", "Filtre şeridi", "Tablo", "Sabit toplam satırı"],');
    s.push('      "gorseller": [');
    s.push('        { "yer": "Boş durum", "ne": "Fiş ve makbuz çizimi — henüz gider girilmemişken ortada durur." }');
    s.push('      ],');
    s.push('      "not": "Tutar sütunu sağa hizalı ve mono." }');
    s.push('  ]');
    s.push('}');
    s.push('```', '');
    s.push('**Kurallar**');
    s.push('- `anahtar` yukarıdaki listeden birebir gelsin; uydurma anahtar yazma.');
    s.push('- Her başlık için bir satır olsun — atladığın başlık "gerekli" sayılır.');
    s.push('- `sayfa` künyedeki sayfa adıyla birebir aynı olsun.');
    s.push('- `simgeler` içindeki `ad` tek kelime ve küçük harf olsun.');
    s.push('- `sorular` içinde `secim` isteğe bağlı: cevap serbest metinse yazma.');
    s.push('- Görsel gerekmeyen sayfada `gorseller` boş kalsın; uydurma.');
    s.push('- Türkçe yaz. Tırnakları düz tırnak kullan.');

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

  /* Tasarımcıya giden kısa künye. Tam künye (alan türleri, zorunluluk,
     roller, yetkiler) kodu yazacak olan için; tasarımcıya verilince
     promptun üçte birini kaplıyor ve ekranı tabloya çeviriyor. Burada
     yalnız hangi ekranlar var ve her birinde ne görünüyor. */
  ekranOzeti(proje) {
    const kunye = (proje.palet || {}).kunye || {};
    const adlar = Object.keys(kunye);
    if (!adlar.length) return '';

    const s = [];
    adlar.slice(0, 12).forEach(tam => {
      const k = kunye[tam] || {};
      const sayfa = tam.split(' · ').pop();
      const sutun = (k.alanlar || []).slice(0, 4).map(a => a.ad).filter(Boolean);
      s.push('- **' + sayfa + '**' + (k.tur ? ' _(' + k.tur.toLocaleLowerCase('tr') + ')_' : '')
        + (k.amac ? ' — ' + k.amac : '')
        + (sutun.length ? '  \n  Görünen bilgiler: ' + sutun.join(' · ') : ''));
    });
    if (adlar.length > 12) s.push('- …ve ' + (adlar.length - 12) + ' ekran daha');
    return s.join('\n');
  },

  /* ---------- Görsel dünya: ChatGPT'ye giden iki prompt ----------
     Studio kod tarafını Claude'a, görünüş tarafını ChatGPT'ye veriyor.
     Buradan çıkan iki metin de müşteri deposuna değil, bir sohbete gider;
     depo uyarısı yok, kod talimatı yok. */

  /* ---------- Görsel dünya: üç ayrı prompt ----------
     Altı ekranı tek promptta çizdirmek ChatGPT'yi dağıtıyordu: birini yapıp
     ötekini unutuyor, ya da hepsini yüzeysel çiziyordu. Üçe bölündü:
     yirmi iki sayfa için yirmi iki tasarım değil, bir tasarım sistemi ve
     dört sayfa iskeleti. Ekran ekran çizdirme kalktı.

     Her prompt sonunda bir JSON bloğu istiyor: Studio bloğu geri çizip
     kullanıcıya ChatGPT'nin resmiyle yan yana gösteriyor. Uyuşmazsa blok
     resmi anlatmıyor demektir — kod bloktan yazılacağı için bu fark önemli. */

  /* Ortak açılış: bunu bir uygulamaya yapıştıracağım uyarısı. */
  blokUyarisi(s) {
    s.push('> ### Bloğu metin olarak ver');
    s.push('> Bunu bir uygulamaya yapıştıracağım; **düz metin** okuyor,');
    s.push('> resim okumuyor. Bloğu tasarlanmış bir tabaka ya da tablo');
    s.push('> görseli olarak **çizme**. Kod bloğu içinde, kopyalanıp');
    s.push('> yapıştırılabilir metin olarak ver. Tırnakları düz tırnak yap.');
    s.push('');
  },

  /* 02 · Tasarım sistemi — tek levha, tek blok.
     Ekran ekran çizdirmeyi bıraktık: yirmi iki sayfa için yirmi iki tasarım
     değil, bir sistem ve dört iskelet lazım. ChatGPT bileşen levhasını
     çiziyor (palet, düğmeler, kart, tablo satırı, çipler, boş durum,
     simgeler yan yana), sonra onu JSON'a döküyor. Navigasyon düzenine
     karışmıyor — o Studio'nun kararı. */
  gorselDil(projeId) {
    const p = DB.proje(projeId);
    if (!p) return '';
    const pl = p.palet || {};
    const simgeler = ((pl.cozum || {}).simgeler || []);

    const s = [];
    s.push('# ' + projeAdi(p) + ' — tasarım sistemi', '');
    s.push('Sana iki görsel veriyorum: **birincisi firmanın logosu**,');
    s.push('**ikincisi işletmenin kendisi**. Bu ikisinden bir tasarım sistemi');
    s.push('çıkar: renk, yazı, bileşenler, simge dili ve sayfa iskeletleri.', '');

    s.push('> **Ekran tasarlama.** Panel, liste, form — hiçbirini ayrı ayrı');
    s.push('> çizme. Bir **bileşen levhası** çiz: palet şeridi, üç düğme, bir');
    s.push('> kart, bir tablo satırı, çipler, bir boş durum ve simge seti —');
    s.push('> hepsi yan yana, tek görselde.', '');
    s.push('> **Navigasyon düzenine karar verme.** Sayfaların yan menüde mi üst');
    s.push('> sekmede mi duracağını ben belirliyorum. Sen üst çubuğun ve alt');
    s.push('> menünün **nasıl göründüğünü** söyle.', '');

    s.push('## Firma');
    s.push(hiza('Firma', p.firma));
    if (modulAdi(p)) s.push(hiza('Ürün', modulAdi(p)));
    if (p.sektor)    s.push(hiza('Sektör', p.sektor));
    s.push(hiza('Platform', PLATFORM_ADI[p.platform] || '—'));
    s.push('');

    /* Sayfa türleri künyeden geliyor: iskelet listesi uydurulmasın.
       Geniş tablo ve tablo içi giriş sayıları da burada — ChatGPT bunları
       görmeden "tam genişlik tablo" deyip telefonu unutuyordu. */
    const kunye = pl.kunye || {};
    const kAdlar = Object.keys(kunye);
    if (kAdlar.length) {
      const tur = {};
      let genis = 0;
      kAdlar.forEach(x => {
        const k = kunye[x] || {};
        const t = k.tur || 'Belirsiz';
        tur[t] = (tur[t] || 0) + 1;
        if ((k.alanlar || []).length >= 7) genis += 1;
      });
      s.push('## Bu programın ekranları', '');
      s.push(`${kAdlar.length} sayfa var. Türlere göre:`, '');
      Object.keys(tur).forEach(t => s.push(`- **${t}** — ${tur[t]} sayfa`));
      s.push('');
      s.push('**İskeletleri bu türlerden kur.** Listede olmayan bir tür için');
      s.push('iskelet yazma; her türe bir iskelet yaz, hiçbirini atlama.', '');
      if (genis) {
        s.push(`> **${genis} sayfada yedi ya da daha çok sütun var.** Telefon`);
        s.push('> genişliğine sığmaz. Tablonun dar ekranda ne olacağını —');
        s.push('> hangi sütunun nereye gideceğini — açıkça yaz.', '');
      }
    }

    if (simgeler.length) {
      s.push('## Gereken simgeler', '');
      s.push('Bu programın ekranlarında şu simgeler kullanılacak. Levhada');
      s.push('**hepsini çiz** ve blokta her birinin ne çizileceğini yaz —');
      s.push('kodu yazan kişi bunlara bakarak SVG çizecek.', '');
      simgeler.forEach(x => s.push(`- **${x.ad}**${x.ne ? ' — ' + x.ne : ''}`));
      s.push('');
    }

    const std = PROMPT.tasarimStandardi(p);
    if (std) { s.push(std, ''); }

    s.push('## Nasıl bir dil istiyorum', '');
    s.push('**1 · İşin kendisinden çıksın.** Hazır tasarım sistemi rengi değil,');
    s.push('   bu işletmenin rengi. Logodaki ve fotoğraftaki malzemeye bak:');
    s.push('   ahşap mı, bakır mı, tuğla mı, kâğıt mı.');
    s.push('**2 · Doku olsun.** Düz dolgu bırakma. Kart zemininde kâğıt greni,');
    s.push('   ekran arkasında dikişsiz bir doku — %5-8, okunurluğu bozmayacak.');
    s.push('**3 · Simge dili işe özel.** Hazır simge setine benzeyen çizim değil;');
    s.push('   bu işin kendi nesneleri. Kaç renk, çizgi kalınlığı, arkasında');
    s.push('   zemin var mı — hepsini söyle.');
    s.push('**4 · Sayı ver.** "Yumuşak köşe" değil `18px`. "Sıcak kırmızı" değil');
    s.push('   `#8F2D22`. Kod bu değerlerden yazılacak.', '');

    PROMPT.blokUyarisi(s);

    s.push('## Cevabın', '');
    s.push('Önce bileşen levhasını çiz, sonra **tek JSON bloğu** ver:', '');
    s.push('```json');
    s.push('{');
    s.push('  "renk": { "vurgu": "#8F2D22", "ikinci": "#C9A227", "zemin": "#E8DCC8",');
    s.push('            "yuzey": "#FFFDF8", "metin": "#2C2620", "cizgi": "#E0D6C4",');
    s.push('            "kontur": "#A66A32" },');
    s.push('  "durum": { "basari": "#3F7D57", "uyari": "#C9821F", "hata": "#B4342A" },');
    s.push('  "durumMetin": { "basari": "#2A5C40", "uyari": "#8A5810", "hata": "#8A2018" },');
    s.push('  "kontrast": { "metneUygun": ["vurgu", "metin", "hata"],');
    s.push('                "yalnizCizgi": ["ikinci", "uyari"] },');
    s.push('  "yazi": { "baslik": "Playfair Display", "metin": "Inter",');
    s.push('            "yedek": "Georgia, serif · system-ui, sans-serif",');
    s.push('            "olcek": { "h1": "24/28", "h2": "18/24", "govde": "15/22", "kucuk": "13/18" } },');
    s.push('  "kose": { "kart": 18, "dugme": 14, "kutu": 10 },');
    s.push('  "bosluk": 8,');
    s.push('  "golge": "0 6px 14px -8px rgba(0,0,0,.35)",');
    s.push('  "doku": "Kağıt greni %6 — CSS ile, tekrarlayan degrade; görsel dosya yok",');
    s.push('  "amblem": "Logo etrafında ince bakır çerçeve, altında slogan",');
    s.push('  "grafik": { "birincil": "#8F2D22", "ikincil": "#3A6D9C",');
    s.push('              "beklenen": "kesikli çizgi, %55 opaklık",');
    s.push('              "sifirCizgisi": "#C6BBA6 1px", "eksiBolge": "#B4342A %10 dolgu" },');
    s.push('  "bosDurumGorseli": "Kodda SVG olarak çizilir, dosya yok — simge diliyle aynı",');
    s.push('');
    s.push('  "bilesenler": {');
    s.push('    "ustCubuk":  "56px, zemin rengi, altında 1px bakır çizgi; solda başlık, sağda avatar çipi",');
    s.push('    "altMenu":   "64px, yüzey rengi, seçili simge vurgu renginde ve altında 2px çizgi",');
    s.push('    "kart":      "Yüzey rengi, 18px köşe, 1px #E0D6C4 kenar, yumuşak tek katman gölge, 12px iç boşluk",');
    s.push('    "tablo":     "Satır 36px, başlık satırı büyük harf 11px, ayırıcı 1px #E0D6C4, rakam sağa hizalı mono, zebra yok",');
    s.push('    "tabloIcGiris": "Satır içinde giriş kutusu varsa satır 44px\'e çıkar, kutu 36px kalır",');
    s.push('    "tabloDarEkran": "560px altında tablo kart satırına döner: ilk sütun başlık, tutar sağda, kalanlar altta küçük yazı",');
    s.push('    "liste":     "56px satır, solda 32px simge, ortada iki satır yazı, sağda değer",');
    s.push('    "form":      "Etiket üstte 13px, kutu 44px, 10px köşe, odakta 2px vurgu çerçeve",');
    s.push('    "dugme":     "Birincil: vurgu dolgu, beyaz yazı, 14px köşe, 44px. İkincil: çerçeveli, saydam.",');
    s.push('    "cip":       "28px, tam yuvarlak, zemin rengi, seçilince vurgu dolgu",');
    s.push('    "rozet":     "18px, tam yuvarlak, durum rengi %14 opaklıkta zemin",');
    s.push('    "arama":     "40px, oyuk zemin, solda büyüteç simgesi",');
    s.push('    "bosDurum":  "Ortada 96px simge, altında tek cümle, altında birincil düğme",');
    s.push('    "bildirimK": "Alttan kayan kart, yüzey rengi, sol kenarında 3px durum çizgisi",');
    s.push('    "pencere":   "Ortada 20px köşe kart, arkada %55 karartma"');
    s.push('  },');
    s.push('');
    s.push('  "simge": { "bicim": "İki katman, sıcak zemin daire", "cizgi": 1.8,');
    s.push('             "renk": 2, "boyut": [16, 20, 24],');
    s.push('             "liste": [ { "ad": "hesap", "cizim": "Bakır kenarlı hesap defteri, köşesi kıvrık" } ] },');
    s.push('');
    s.push('  "iskelet": {');
    s.push('    "Panel":   "Tam genişlik görsel, üstüne binen özet kartları, altında kısayol ızgarası",');
    s.push('    "Liste":   "Üstte arama ve filtre şeridi, altında tablo, sağ altta yüzen ekle düğmesi",');
    s.push('    "Form":    "Tek sütun, gruplu alanlar, altta sabit kaydet çubuğu",');
    s.push('    "Rapor":   "Üstte tarih aralığı, ortada grafik, altta özet tablosu",');
    s.push('    "Ayarlar": "Gruplu liste, her grubun üstünde büyük harf başlık"');
    s.push('  }');
    s.push('}');
    s.push('```', '');
    s.push('- Renkler **hex** olsun, isim değil.');
    s.push('- **Kullandığın her rengi `renk` içine koy.** Bileşen tarifinde geçip');
    s.push('  listede olmayan renk kodda tek başına kalmış sabit olur.');
    s.push('- **Kontrastı sen ölç.** Yüzey rengi üzerinde 4.5:1\'i karşılamayan');
    s.push('  rengi `yalnizCizgi` listesine koy; metin olarak kullanılmayacak.');
    s.push('  Durum rozetlerinin üstündeki yazı için `durumMetin` ver.');
    s.push('- `bilesenler` ve `iskelet` değerleri **tek cümle**, sayı içersin.');
    s.push('- `iskelet` anahtarları **yukarıdaki ekran türleridir**; hepsini doldur,');
    s.push('  listede olmayan tür uydurma.');
    s.push('- `simge.liste` içinde yukarıda istediğim **bütün simgeler** olsun.');
    s.push('- **Bileşen tarifleri birbiriyle çelişmesin.** Bir ölçüyü iki yerde');
    s.push('  yazacaksan iki yerde de aynı sayıyı yaz.');
    s.push('- **Dosya üretme.** Ne doku görseli, ne illüstrasyon, ne yazı tipi');
    s.push('  dosyası. Her şey kodda çizilecek; yazı tipleri için çevrimdışında');
    s.push('  düşülecek yedeği `yazi.yedek` içinde ver.');

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

  /* Tasarımcıya giden kısa künye. Tam künye (alan türleri, zorunluluk,
     roller, yetkiler) kodu yazacak olan için; tasarımcıya verilince
     promptun üçte birini kaplıyor ve ekranı tabloya çeviriyor. Burada
     yalnız hangi ekranlar var ve her birinde ne görünüyor. */
  ekranOzeti(proje) {
    const kunye = (proje.palet || {}).kunye || {};
    const adlar = Object.keys(kunye);
    if (!adlar.length) return '';

    const s = [];
    adlar.slice(0, 12).forEach(tam => {
      const k = kunye[tam] || {};
      const sayfa = tam.split(' · ').pop();
      const sutun = (k.alanlar || []).slice(0, 4).map(a => a.ad).filter(Boolean);
      s.push('- **' + sayfa + '**' + (k.tur ? ' _(' + k.tur.toLocaleLowerCase('tr') + ')_' : '')
        + (k.amac ? ' — ' + k.amac : '')
        + (sutun.length ? '  \n  Görünen bilgiler: ' + sutun.join(' · ') : ''));
    });
    if (adlar.length > 12) s.push('- …ve ' + (adlar.length - 12) + ' ekran daha');
    return s.join('\n');
  },

  /* ---------- Görsel dünya: ChatGPT'ye giden iki prompt ----------
     Studio kod tarafını Claude'a, görünüş tarafını ChatGPT'ye veriyor.
     Buradan çıkan iki metin de müşteri deposuna değil, bir sohbete gider;
     depo uyarısı yok, kod talimatı yok. */

  /* ---------- Görsel dünya: üç ayrı prompt ----------
     Altı ekranı tek promptta çizdirmek ChatGPT'yi dağıtıyordu: birini yapıp
     ötekini unutuyor, ya da hepsini yüzeysel çiziyordu. Üçe bölündü:
     yirmi iki sayfa için yirmi iki tasarım değil, bir tasarım sistemi ve
     dört sayfa iskeleti. Ekran ekran çizdirme kalktı.

     Her prompt sonunda bir JSON bloğu istiyor: Studio bloğu geri çizip
     kullanıcıya ChatGPT'nin resmiyle yan yana gösteriyor. Uyuşmazsa blok
     resmi anlatmıyor demektir — kod bloktan yazılacağı için bu fark önemli. */

  /* Ortak açılış: bunu bir uygulamaya yapıştıracağım uyarısı. */
  blokUyarisi(s) {
    s.push('> ### Bloğu metin olarak ver');
    s.push('> Bunu bir uygulamaya yapıştıracağım; **düz metin** okuyor,');
    s.push('> resim okumuyor. Bloğu tasarlanmış bir tabaka ya da tablo');
    s.push('> görseli olarak **çizme**. Kod bloğu içinde, kopyalanıp');
    s.push('> yapıştırılabilir metin olarak ver. Tırnakları düz tırnak yap.');
    s.push('');
  },

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
    yeniler.forEach(st => {
      s.push('- **' + st.alan + ' · ' + st.ad + '** _(' + st.grup + ')_');
      const t = (yerel && st.yerel) ? st.yerel : st.tarif;
      if (t) s.push('  - ' + String(t).replace(/\n+/g, ' '));
    });
    s.push('');

    s.push('## Şimdi ne yapacaksın');
    s.push('1. `NIZAM.md` dosyasını aç. `## Nizam Standardı` başlığının altına');
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
    const cevapMetni = PROMPT.cevapBlogu(proje);
    if (cevapMetni) { s.push(cevapMetni); s.push(''); }
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
