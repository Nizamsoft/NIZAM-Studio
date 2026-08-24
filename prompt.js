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

  /* Paleti hem görev promptuna hem NIZAM.md'ye aynı biçimde basar. */
  paletBlogu(proje) {
    const pl = proje && proje.palet;
    if (!pl) return '';

    const s = ['## Renk ve Tipografi'];
    s.push('Bu proje için belirlenmiş palet. Renk tahmin etme, buradakileri kullan.');
    s.push('');
    PALET_ALAN.forEach(a => { if (pl[a.anahtar]) s.push(hiza(a.ad, pl[a.anahtar])); });
    s.push('');
    s.push('Vurgu rengi az kullanılır: ana buton, aktif menü ve acil işareti.');
    return s.join('\n');
  },

  /* Teknik standart — her projede aynı. Görev promptuna ve NIZAM.md'ye girer. */
  teknikBlogu(proje) {
    const s = ['## Teknik Standart'];
    s.push('Bunlar Nizam Soft standardı. Tartışma, değiştirme, alternatif önerme —');
    s.push('gerekiyorsa önce sor.');
    s.push('');
    TEKNIK_STANDART.forEach(([ad, deger, not]) => {
      s.push(`- **${ad}: ${deger}**`);
      if (not) s.push(`  - ${not}`);
    });

    const pl = (proje && proje.palet) || {};
    const ozel = TEKNIK_ALAN.filter(a => pl[a.anahtar]);
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
    const eksik = TEKNIK_ALAN.filter(a => !pl[a.anahtar]);
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
    s.push('# ' + projeAdi(p) + ' — Tasarım kararları (2/3)', '');

    const slug = depoSlug(p.repo);
    if (slug) {
      s.push('> ### Depo: `' + slug + '`');
      s.push('> Bu oturum yalnız bu depoya bağlı olmalı. Deposu farklıysa dur');
      s.push('> ve söyle; başka depo ekleme, dosya oluşturma, commit atma.');
      s.push('');
    }

    s.push('Tanıtımdan sonraki **ilk blok** bu; içinde rengin, yazının ve');
    s.push('arayüzün bütün kararları var. Sonuncusu modüller, sayfalar ve');
    s.push('künyeleri olacak. Kod yazmanı hâlâ **istemiyorum** — bu kararları');
    s.push('şimdilik yalnız `NIZAM.md`\'ye yazacaksın.', '');

    const palet = PROMPT.paletBlogu(p);
    if (palet) { s.push(palet); s.push(''); }
    s.push(PROMPT.tasarimBlogu(p));
    s.push('');

    s.push('## Şimdi ne yapacaksın');
    s.push('1. `NIZAM.md` içindeki `## Tasarım kararları` başlığının altındaki');
    s.push('   *"henüz belirlenmedi"* satırını sil, yukarıdaki kararları oraya yaz.');
    s.push('   Renk kodlarını olduğu gibi aktar — kod yazma zamanı geldiğinde');
    s.push('   tek yerde değişken olarak tanımlayacaksın, ama şimdi değil.');
    s.push('2. Tek commit\'le **`main` dalına** gönder. Commit mesajı:');
    s.push('   `[' + TASK_PREFIX + '-0] Tasarım kararları`.');
    s.push('3. Dur ve bekle. Sıradaki ve son blok: modüller, sayfalar ve künyeleri.');
    s.push('');

    s.push('## Şunları yapma');
    s.push('- **Uygulama kodu yazma.** Ekran, bileşen, CSS dosyası — hiçbiri.');
    s.push('- **Sayfa ya da modül uydurma.** Hangi ekranların olacağı hâlâ belli değil.');
    s.push('- **Karar ekleme ya da değiştirme.** Yukarıdakiler tartışılmadan uygulanır;');
    s.push('  eksik gördüğün bir şey varsa uydurma, sor.');
    s.push('- **Bu oturuma başka depo ekleme.** Tek depo, tek oturum.');
    s.push('');
    s.push('Yazdıktan sonra tek cümleyle onayla ve bekle.');

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
    s.push('Bunlar alınmış kararlar. Kendi biçimini uydurma, aşağıdakileri uygula.');

    s.push('');
    s.push('### Uygulama sırası');
    s.push('Kararları rastgele uygulama; şu sırayla ilerle — sonrakiler');
    s.push('öncekilerin üstüne kurulur:');
    AKIS_OBEK.forEach((o, i) => s.push(`${i + 1}. **${o.ad}** — ${o.not}`));
    s.push('');
    s.push('Renk ve ölçüler değişken olarak tek yerde tanımlansın; her ekranda');
    s.push('yeniden yazılmasın.');

    TASARIM_GRUP.forEach(g => {
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

  /* ---------- Marka promptu ----------
     Logoyu Studio gönderemez; kullanıcı bu metni kopyalayıp logoyla birlikte
     yapıştırır. Dönen cevap Studio'ya geri yapıştırılır. */

  marka(projeId) {
    const p = DB.proje(projeId);
    if (!p) return '';
    const s = [];

    s.push('# Marka Paleti İsteği', '');
    s.push(`Ekteki logo **${p.firma}** firmasına ait. Bu firma için bir yazılım`);
    s.push('arayüzü tasarlıyoruz. Senden **yalnız renk paleti ve yazı tipleri**');
    s.push('istiyorum — arayüz kararlarını biz kendimiz veriyoruz.');
    s.push('');
    s.push('> **Logo ekli değilse dur.** Uydurma; "logo gelmemiş" yaz ve bekle.');
    s.push('');

    s.push('## Proje');
    s.push(hiza('Firma', p.firma));
    if (modulAdi(p)) s.push(hiza('Ürün', modulAdi(p)));
    if (p.sektor) s.push(hiza('Sektör', p.sektor));
    s.push(hiza('Platform', PLATFORM_ADI[p.platform] || 'Web'));
    s.push(hiza('Tema', 'Açık — bütün projelerimiz açık tema'));
    s.push(hiza('Arayüz dili', 'Türkçe'));
    s.push('');

    s.push('## Nasıl ilerle');
    s.push('Hepsini bir anda karara bağlama. Şu sırayla düşün:');
    s.push('');
    s.push('1. **Logoyu oku.** Baskın renkler, ton sıcak mı soğuk mu, kurumsal mı');
    s.push('   canlı mı. Bir cümleyle karakteri tarif et — bu cümle "Ton" satırı olacak.');
    s.push('2. **Zeminleri kur.** Önce arka plan, sonra yüzey, sonra çizgi.');
    s.push('   Her rengi bir öncekine göre seç; tek tek uydurma.');
    s.push('3. **Metin tonlarını seç.** Ana, soft, silik — üçü de zeminde okunsun.');
    s.push('4. **Vurguyu logodan çıkar.** Sonra bir tık koyusunu (basılı hâli).');
    s.push('5. **Durum renklerini seç.** Başarı, uyarı, tehlike.');
    s.push('6. **Yazı tiplerini ve simge setini seç.**');
    s.push('7. **Kontrastı denetle.** Tutmuyorsa 3. adıma dön, tonu düzelt.');
    s.push('8. **Cevabı ver.** Yalnız istenen satırlar.');
    s.push('');

    s.push('## Kurallar');
    s.push('- **Açık tema.** Koyu tema üretme, sorma da.');
    s.push('- Arka plan yumuşak bir açık ton; yüzey ondan daha açık, çoğu zaman');
    s.push('  beyaz. Çizgi zeminden bir tık koyu.');
    s.push('- Metin üç tonda ve koyu: ana en koyu, soft orta, silik en açık.');
    s.push('  Üçü de zeminde okunsun — en siliği bile **4.5:1** geçsin.');
    s.push('- Vurgu logodan gelsin ama **beyaz yazı taşıyacak kadar koyu** olsun.');
    s.push('  Açık kalırsa düğme okunmaz.');
    s.push('- Vurgu **az kullanılır**: ana buton, aktif menü, acil işareti. Başka yerde yok.');
    s.push('- Vurgu koyu = üzerine gelince ve basılınca kullanılacak ton.');
    s.push('- Tehlike rengi vurgudan ayrışsın; yoksa "kaydet" ile "sil" karışır.');
    s.push('- Renkleri 6 haneli onaltılık kodla yaz. Kısaltma (#fff) kullanma.');
    s.push('- Yazı tipleri **Google Fonts\'ta bulunsun**, Türkçe karakterleri tam olsun.');
    s.push('  Başlık 600-700, metin 400-500 ağırlıkta kullanılacak.');
    s.push('- Simge seti ücretsiz ve açık kaynak olsun (Lucide, Phosphor, Tabler gibi).');
    s.push('');

    s.push('## Cevap');
    s.push('Kontrast denetimini yaptıktan sonra **yalnızca** aşağıdaki satırları');
    s.push('döndür. Başka açıklama, başlık ya da yorum yazma.');
    s.push('');
    s.push('> Aşağısı bir **şablon**, örnek cevap değil. `___` yazan her yeri kendin');
    s.push('> doldur. Buradaki hiçbir değeri olduğu gibi kopyalama.');
    s.push('');
    s.push('```');
    PALET_ALAN.forEach(a => s.push(`${a.ad}: ${a.renk ? '#______' : '___'}`));
    s.push('```');

    return s.join('\n');
  },

  /* ---------- Görev promptu ---------- */

  gorev(gorevId) {
    const g = DB.gorev(gorevId);
    if (!g) return '';

    const proje = DB.proje(g.proje_id);
    const modul = g.modul_id ? DB.moduller.find(m => m.id === g.modul_id) : null;
    const sayfa = g.sayfa_id ? DB.sayfalar.find(s => s.id === g.sayfa_id) : null;
    const stdlar = DB.gorevinStandartlari(gorevId);
    const no = TASK_PREFIX + '-' + g.no;

    const s = [];

    s.push('# NIZAM Studio — Geliştirme Görevi', '');

    s.push('## Proje');
    s.push(hiza('Firma', proje ? proje.firma : '—'));
    if (proje && modulAdi(proje)) s.push(hiza('Ürün', modulAdi(proje)));
    s.push(hiza('Platform', PLATFORM_ADI[proje && proje.platform] || '—'));
    s.push(hiza('Veritabanı', VERI_ADI[proje && proje.veri] || '—'));
    if (proje && proje.repo) s.push(hiza('Depo', proje.repo));
    s.push('');

    s.push(PROMPT.teknikBlogu(proje)); s.push('');
    const paletMetni = PROMPT.paletBlogu(proje);
    if (paletMetni) { s.push(paletMetni); s.push(''); }
    s.push(PROMPT.tasarimBlogu(proje)); s.push('');
    const kunyeMetni = PROMPT.kunyeBlogu(proje);
    if (kunyeMetni) { s.push(kunyeMetni); s.push(''); }

    s.push('Deponun kökünde `NIZAM.md` adında bir kimlik dosyası var.');
    s.push('İşe başlamadan önce oku — projenin mevcut sayfaları, kullanılan');
    s.push('bileşenler ve alınmış kararlar orada yazıyor.');
    s.push('');

    s.push(`## Görev — ${no}`);
    s.push(hiza('Başlık', g.baslik));
    s.push(hiza('Yeri', yerYaz(modul, sayfa)));
    if (g.oncelik === 'acil') s.push(hiza('Öncelik', 'ACİL'));
    s.push('');

    if (g.aciklama) {
      s.push('Ne yapılacak:');
      s.push(g.aciklama.trim());
      s.push('');
    }

    if (stdlar.length) {
      s.push(stdlar.length === 1 ? '## Kullanılacak Nizam Standardı' : '## Kullanılacak Nizam Standartları');
      stdlar.forEach(st => {
        s.push('');
        s.push(`### ${st.ad}`);
        s.push(st.tarif || st.ozet);
      });
      s.push('');
    }

    s.push('## Kurallar');
    s.push(`1. Commit mesajının başına \`[${no}]\` yaz. Studio bu etiketi arayıp`);
    s.push('   görevi kendiliğinden "Kontrolde"ye çekiyor.');
    s.push('2. İş bitince `NIZAM.md` dosyasını güncelle — eklediğin sayfa, özellik');
    s.push('   ve aldığın kararlar oraya yazılsın.');
    s.push('3. Mevcut tasarım dilini bozma: yeni renk, yeni yazı tipi, yeni bileşen');
    s.push('   düzeni getirme.');
    s.push('4. Yalnızca bu görevi yap. Aklına gelen başka iyileştirmeleri yapma,');
    s.push('   not olarak yaz.');
    s.push('5. Bitince değişikliği GitHub\'a gönder.');

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
    const paletMetni = PROMPT.paletBlogu(proje);
    if (paletMetni) { s.push(paletMetni); s.push(''); }
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
