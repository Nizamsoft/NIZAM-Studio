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
    const kunye = ((proje && proje.palet) || {}).kunye || {};
    const anahtarlar = Object.keys(kunye);
    if (!anahtarlar.length) return '';

    const s = ['## Sayfa Künyeleri'];
    s.push('Her sayfanın ne yaptığı, neyi tuttuğu, kimin ne yapabildiği aşağıda.');
    s.push('Bunlar kullanıcıyla tek tek konuşularak alındı; tahmin değil, karar.');
    s.push('');
    s.push('- **Alan listesi o sayfanın veritabanı tablosudur.** Sütun adlarını ve');
    s.push('  türlerini buradan al, kendin uydurma, fazladan sütun ekleme.');
    s.push('- **Seçenek alanlarının değerleri sabittir.** Yalnız yazılı değerler');
    s.push('  girilebilir; başka bir değer kabul edilmemeli.');
    s.push('- **İlişki alanı** yazılı sayfanın kaydına bağlanır (foreign key).');
    s.push('- **Zorunlu alan** boş kaydedilemez; hem arayüzde hem veritabanında engelle.');
    s.push('- **Yetki satırı** satır güvenliği (RLS) kuralıdır: yazılı rol ve üstü o');
    s.push('  işi yapabilir, altındakiler yapamaz. Görme ile yapma ayrıdır.');
    s.push('- **Kural** satırı iş kuralıdır; arayüzde de veritabanında da uygula.');

    anahtarlar.forEach(ad => {
      const k = kunye[ad] || {};
      s.push('', `### ${ad}`);
      if (k.amac) s.push(k.amac);
      s.push('');
      if (k.tur) s.push(`- **Ekran türü:** ${k.tur}`);

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

      if ((k.roller || []).length) s.push(`- **Görebilen:** ${k.roller.join(' · ')}`);
      if ((k.eylemler || []).length) {
        s.push('- **Eylemler ve yetkiler:**');
        k.eylemler.forEach(ey => {
          const r = (k.yetki && k.yetki[ey] && k.yetki[ey].length)
            ? k.yetki[ey] : (k.roller || []);
          s.push(`  - ${ey} — ${r.length ? r.join(' · ') : 'belirtilmedi'}`);
        });
      }
      if (k.kural) s.push(`- **Kural:** ${k.kural}`);
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

    s.push(`# ${proje.firma} — Proje Kimliği`, '');
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
