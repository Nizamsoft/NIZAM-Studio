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
    const s = ['## Arayüz Kararları'];
    s.push('Bunlar alınmış kararlar. Kendi biçimini uydurma, aşağıdakileri uygula.');

    s.push('');
    s.push('### Nasıl kodlanacak');
    s.push('Kararları rastgele uygulama; şu sırayla ilerle. Her aşamayı bitirmeden');
    s.push('ötekine geçme, sonrakiler öncekilerin üstüne kurulur:');
    AKIS_OBEK.forEach((o, i) => s.push(`${i + 1}. **${o.ad}** — ${o.not}`));
    s.push('');
    s.push('Renk ve ölçüler değişken olarak tek yerde tanımlansın; her ekranda');
    s.push('yeniden yazılmasın. Bir sonraki görevde bu kararlar aynen geçerli olacak.');

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

  /* ---------- Marka promptu ----------
     Logoyu Studio gönderemez; kullanıcı bu metni kopyalayıp logoyla birlikte
     yapıştırır. Dönen cevap Studio'ya geri yapıştırılır. */

  marka(projeId) {
    const p = DB.proje(projeId);
    if (!p) return '';

    const acik = PROMPT.temaAcik(p);
    const tema = acik ? 'açık' : 'koyu';
    const s = [];

    s.push('# Marka ve Arayüz Kararları', '');
    s.push(`Ekteki logo **${p.firma}** firmasına ait. Bu firma için bir yazılım`);
    s.push('arayüzü tasarlayacağız. Senden renk paleti ve arayüz kararları istiyorum.');
    s.push('');
    s.push('> **Logo ekli değilse dur.** Uydurma; "logo gelmemiş" yaz ve bekle.');
    s.push('');

    /* ---- Bağlam: kararları neye göre vereceğini bilsin ---- */
    s.push('## Proje');
    s.push(hiza('Firma', p.firma));
    if (p.sektor) s.push(hiza('Sektör', p.sektor));
    s.push(hiza('Platform', PLATFORM_ADI[p.platform] || 'Web'));
    s.push(hiza('Veritabanı', VERI_ADI[p.veri] || '—'));
    if (p.dil)  s.push(hiza('Arayüz dili', (DIL_SECENEK.find(x => x.kod === p.dil) || {}).ad || p.dil));
    if (p.para) s.push(hiza('Para birimi', (PARA_SECENEK.find(x => x.kod === p.para) || {}).ad || p.para));
    s.push(hiza('Tema', acik ? 'Açık' : 'Koyu'));
    s.push('');
    s.push('Bu bilgiler kararların dayanağı. Sahada telefonla kullanılan bir iş ile');
    s.push('masa başında çok kayıtla çalışılan bir iş aynı yerleşimi kaldırmaz.');
    s.push('');

    /* ---- Aşamalı çalışma ---- */
    s.push('## Nasıl ilerle');
    s.push('Hepsini bir anda karara bağlama. Şu sırayla düşün, her aşamayı');
    s.push('bitirmeden ötekine geçme:');
    s.push('');
    s.push('1. **Logoyu oku.** Baskın renkler, sıcak mı soğuk mu, kurumsal mı canlı mı.');
    s.push('   Bir cümleyle karakteri tarif et (bu cümle "Ton" satırı olacak).');
    s.push('2. **Paleti kur.** Önce arka plan ve yüzey, sonra çizgi, sonra üç metin tonu,');
    s.push('   en son vurgu. Her rengi bir öncekine göre seç — tek tek uydurma.');
    s.push('3. **Durum renklerini seç.** Başarı, uyarı, tehlike. Vurgu kırmızıysa');
    s.push('   tehlike ondan ayrışmalı, yoksa "kaydet" ile "sil" karışır.');
    s.push('4. **Yazı tiplerini seç.** Başlık ve metin.');
    s.push('5. **Arayüz kararlarını ver.** Aşağıdaki başlıkları sırayla geç: önce');
    s.push('   Yerleşim, sonra Biçim, sonra Açılış, Durumlar, Hareket, Sistem.');
    s.push('6. **Çelişki denetimi yap.** Aşağıdaki yasak çiftlere takılan var mı bak.');
    s.push('7. **Kontrastı denetle.** En silik metin bile arka planda 4.5:1 geçmeli.');
    s.push('8. **Cevabı ver.** Yalnız istenen satırlar, başka açıklama yok.');
    s.push('');

    /* ---- Palet kuralları ---- */
    s.push('## Palet kuralları');
    if (acik) {
      s.push('- Açık tema. Arka plan yumuşak bir açık ton; yüzey ondan daha açık,');
      s.push('  çoğu zaman beyaz. Çizgi zeminden bir tık koyu.');
      s.push('- Metin üç tonda ve koyu: ana en koyu, soft orta, silik en açık.');
      s.push('- Vurgu logodan gelsin ama açık zeminde **beyaz yazı taşıyacak kadar');
      s.push('  koyu** olsun. Açık kalırsa düğme okunmaz.');
    } else {
      s.push('- Koyu tema. Arka plan en koyu, yüzey bir tık açık, çizgi ondan açık.');
      s.push('- Metin üç tonda: ana en açık, soft orta, silik en koyu.');
      s.push('- Vurgu logodan gelsin ve koyu zeminde parlasın.');
    }
    s.push('- Üç metin tonu da zeminde okunabilsin — en siliği bile **4.5:1** geçsin.');
    s.push('- Vurgu **az kullanılır**: ana buton, aktif menü, acil işareti. Başka yerde yok.');
    s.push('- Vurgu koyu = vurgunun üzerine gelince ve basılınca kullanılacak tonu.');
    s.push('- Renkleri 6 haneli onaltılık kodla yaz. Kısaltma (#fff) kullanma.');
    s.push('- Yazı tipleri **Google Fonts\'ta bulunsun**, Türkçe karakterleri tam olsun.');
    s.push('  Başlık 600-700, metin 400-500 ağırlıkta kullanılacak.');
    s.push('- Simge seti ücretsiz ve açık kaynak olsun (Lucide, Phosphor, Tabler gibi).');
    s.push('- Ölçüler 4px ızgarasına otursun. Dokunma hedefi en az 44×44px.');
    s.push('');

    /* ---- Arayüz kararları ---- */
    s.push('## Arayüz kararları');
    s.push('**Yalnızca listedeki adları** kullan — yeni ad uydurma, kısaltma yapma.');
    s.push('Adı harfi harfine yaz (kesme işareti ve orta nokta dahil).');
    s.push('');
    s.push('Bir kısmında **birden fazla seçebilirsin**; artı ile ayır');
    s.push('(örnek: `Zebra + Rakam hizalı`). Seçtiklerin birleşerek uygulanır, o yüzden');
    s.push('yalnızca gerçekten bir arada duranları birleştir. Gerekmiyorsa tek bırak,');
    s.push('hiç gerekmiyorsa `yok` yaz.');
    s.push('');

    TASARIM_GRUP.forEach(g => {
      s.push(`### ${g.ad}`, '');
      g.alanlar.forEach(a => {
        s.push(`**${a.ad}** — ${a.alt}${
          a.bos ? ' _(birkaçı seçilebilir, gerekmiyorsa `yok` yaz)_'
                : a.coklu ? ' _(birden fazla seçilebilir)_' : ' _(tek seçim)_'}`);
        a.secim.forEach(x => s.push(`- ${x.ad}: ${x.tarif}`));
        s.push('');
      });
    });

    /* ---- Çelişkiler ---- */
    s.push('## Birlikte olmayacaklar');
    s.push('Bu çiftlerden ikisini birden seçme — biri ötekinin yerini ortadan kaldırır:');
    s.push('');
    CELISKI.forEach(([[a1, d1], [a2, d2], neden]) => {
      const b1 = TUM_TASARIM.find(x => x.anahtar === a1);
      const b2 = TUM_TASARIM.find(x => x.anahtar === a2);
      if (b1 && b2) s.push(`- **${b1.ad}: ${d1}** + **${b2.ad}: ${d2}** — ${neden}`);
    });
    s.push('');

    /* ---- İkinci tema ---- */
    s.push('## İkinci tema (koşullu)');
    s.push('"Tema değiştirme" için **Sabit** dışında bir şey seçersen kullanıcı temayı');
    s.push(`çevirebilecek demektir. O zaman ${acik ? 'koyu' : 'açık'} temanın renklerini de ver:`);
    s.push('cevabın sonuna aşağıdaki 7 satırı ekle. Sabit seçersen bu satırları hiç yazma.');
    s.push('');

    /* ---- Cevap biçimi ---- */
    s.push('## Cevap');
    s.push('Denetimleri yaptıktan sonra **yalnızca** aşağıdaki satırları döndür.');
    s.push('Başka açıklama, başlık ya da yorum yazma.');
    s.push('');
    s.push('> Aşağısı bir **şablon**, örnek cevap değil. `___` yazan her yeri kendin');
    s.push('> doldur. Buradaki hiçbir değeri olduğu gibi kopyalama.');
    s.push('');
    s.push('```');
    PALET_ALAN.forEach(a => {
      if (a.anahtar === 'tema') { s.push(`Tema: ${acik ? 'Açık' : 'Koyu'}`); return; }
      s.push(`${a.ad}: ${a.renk ? '#______' : '___'}`);
    });
    TUM_TASARIM.forEach(a => s.push(`${a.ad}: ___`));
    s.push('```');
    s.push('');
    s.push('Tema değiştirme Sabit değilse ek olarak:');
    s.push('');
    s.push('```');
    PALET_ALAN_2.forEach(a => s.push(`${a.ad}: #______`));
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
