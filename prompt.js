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
  temaAcik(proje) {
    const t = proje && proje.palet && proje.palet.tema;
    return /a[çc][ıi]k|light/i.test(String(t || ''));
  },

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

  /* Arayüz biçimi — görev promptuna ve NIZAM.md'ye aynı biçimde girer. */
  tasarimBlogu(proje) {
    const pl = (proje && proje.palet) || {};
    const s = ['## Arayüz Biçimi'];
    s.push('Bu kararlar alınmış. Kendi biçimini uydurma, aşağıdakileri uygula.');
    s.push('');
    TASARIM_ALAN.forEach(a => {
      const ad = pl[a.anahtar] || a.varsayilan;
      const sc = a.secim.find(x => x.ad === ad) || a.secim[0];
      s.push(`- **${a.ad}: ${sc.ad}** — ${sc.tarif}`);
    });
    return s.join('\n');
  },

  /* ---------- Marka promptu ----------
     Logoyu Studio gönderemez; kullanıcı bu metni kopyalayıp logoyla birlikte
     yapıştırır. Dönen cevap Studio'ya geri yapıştırılır. */

  marka(projeId) {
    const p = DB.proje(projeId);
    if (!p) return '';

    const acik = PROMPT.temaAcik(p);
    const tema = acik ? 'açık' : 'koyu';

    const s = [];
    s.push('# Marka Paleti İsteği', '');
    s.push(`Ekteki logo **${p.firma}** firmasına ait.`);
    s.push('Bu firma için bir yazılım arayüzü tasarlayacağız.');
    s.push('');
    s.push('Logoyu incele: hangi renkler baskın, ton sıcak mı soğuk mu,');
    s.push(`kurumsal mı canlı mı. Buradan bir **${tema} tema** paleti çıkar.`);
    s.push('');
    s.push('## Kurallar');

    if (acik) {
      s.push('- Açık tema. Arka plan yumuşak bir açık ton; yüzey (kartlar) ondan');
      s.push('  daha açık, çoğu zaman beyaz. Çizgi zeminden bir tık koyu.');
      s.push('- Metin üç tonda ve koyu: ana en koyu, soft orta, silik en açık.');
      s.push('  Üçü de açık zeminde okunabilsin — en siliği bile 4.5:1 kontrastı geçsin.');
      s.push('- Vurgu rengi logodan gelsin ama açık zeminde **beyaz yazı taşıyacak');
      s.push('  kadar koyu** olsun. Açık kalırsa düğme okunmaz.');
    } else {
      s.push('- Koyu tema. Arka plan en koyu, yüzey bir tık açık, çizgi ondan açık.');
      s.push('- Metin üç tonda: ana en açık, soft orta, silik en koyu.');
      s.push('  Üçü de koyu zeminde okunabilsin — en siliği bile 4.5:1 kontrastı geçsin.');
      s.push('- Vurgu rengi logodan gelsin ve koyu zeminde parlasın.');
    }

    s.push('- Vurgu **az kullanılır** — yalnızca ana buton, aktif menü ve acil işareti.');
    s.push('- Renkleri 6 haneli onaltılık kodla yaz (#0f0e0d gibi).');
    s.push('- Yazı tipleri ücretsiz, web\'de kullanılabilir ve Türkçe karakterleri tam olsun.');
    s.push('');
    s.push('');
    s.push('## Arayüz biçimi');
    s.push('Renklerin yanında arayüzün biçimine de karar ver. Her başlık için');
    s.push('**yalnızca listedeki adlardan birini** seç — yeni ad uydurma.');
    s.push('Seçimini markanın karakterine göre yap: kurumsal ve yoğun bir iş');
    s.push('yazılımı ile sıcak, müşteriye dönük bir uygulama aynı biçimi almaz.');
    s.push('');
    TASARIM_ALAN.forEach(a => {
      s.push(`**${a.ad}** — ${a.alt}`);
      a.secim.forEach(x => s.push(`- ${x.ad}: ${x.tarif}`));
      s.push('');
    });

    s.push('## Cevabı tam olarak bu biçimde ver');
    s.push('Başka açıklama yazma, yalnızca bu satırları döndür:');
    s.push('');
    s.push('```');
    PALET_ALAN.forEach(a => {
      s.push(`${a.ad}: ${a.anahtar === 'tema' ? (acik ? 'Açık' : 'Koyu') : a.ornek}`);
    });
    TASARIM_ALAN.forEach(a => s.push(`${a.ad}: ${a.varsayilan}`));
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

    const paletMetni = PROMPT.paletBlogu(proje);
    if (paletMetni) { s.push(paletMetni); s.push(''); }
    s.push(PROMPT.tasarimBlogu(proje)); s.push('');

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

    const paletMetni = PROMPT.paletBlogu(proje);
    if (paletMetni) { s.push(paletMetni); s.push(''); }
    s.push(PROMPT.tasarimBlogu(proje)); s.push('');

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
