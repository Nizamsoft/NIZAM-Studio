/* ==========================================================================
   NIZAM Studio — Eşitleme (v0.381.0)
   Atölye › Eşitleme rafı. Onaylanan taslak:
   yapilanlar-gorseller/studio-esitleme-guvenlik-taslak.png (1 ve 2).

   Veri sürüm takibinden gelir (SURUM · surumTakipYukle): her ana programın
   ve firmalarının surumler.json'u. İki yön var:
     al     · firma → ana program : firmanın "genel" notları (alinan'dan sonra)
     getir  · ana program → firma : ana programın notları (firmanın ana_surum'undan sonra)
   Ana programdaki bir not o firmadan geldiyse (kaynak: "GK" ya da özeti
   "Güllüoğlu'ndan" diye başlıyorsa) o firmaya "bekliyor" sayılmaz.

   Korunacaklar: firmaya özel, eşitlemede kaybolmaması gereken özellikler
   (Studio tablosu esitleme_korunacaklar · sql/57). "iz" kodda geçen bir
   metin; talimat onu ana programdaki araclar/esitleme-kontrol.py'ye verir.
   ========================================================================== */
'use strict';

const ESIT = { kor: null, korDurum: 'bos', ekleAcik: false };

function esKorYukle(zorla) {
  if (!AUTH.yonetici || !AUTH.db) return;
  if (!zorla && ESIT.korDurum !== 'bos') return;
  ESIT.korDurum = 'yukleniyor';
  Promise.resolve(AUTH.db.from('esitleme_korunacaklar').select('*').order('olusturuldu')).then(({ data, error }) => {
    if (error) {
      ESIT.korDurum = /esitleme_korunacaklar|schema cache|does not exist/i.test(error.message || '') ? 'kurulmadi' : 'hata';
      ESIT.kor = [];
    } else { ESIT.korDurum = 'tamam'; ESIT.kor = data || []; }
    esYenidenCiz();
  }, () => { ESIT.korDurum = 'hata'; ESIT.kor = []; esYenidenCiz(); });
}
function esKorunacaklar(kod) { return (ESIT.kor || []).filter(k => k.firma_kod === kod); }

/* Atölye açıksa yeniden çiz; paket penceresi açıksa onu da tazele. */
function esYenidenCiz() {
  if (typeof ATL_RAF !== 'undefined' && ATL_RAF === 'esitleme') render();
  const m = $('.es-modal');
  if (m && m.dataset.yon) esitlemePaketAc(m.dataset.yon, m.dataset.kod, true);
}

/* Ana programdaki not bu firmadan mı geldi? */
function esKaynakBu(n, f) {
  if (n.kaynak) return String(n.kaynak).toUpperCase() === String(f.kod).toUpperCase();
  const ozet = String(n.ozet || '');
  return [esKisaAd(f.ad), String(f.ad || '').split(/\s+/)[0]].filter(Boolean)
    .some(a => new RegExp('^' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "['’]", 'i').test(ozet));
}

/* Firma için iki yönün listeleri. */
function esYonler(ana, f) {
  const getir = (f.asagi || []).filter(n => !esKaynakBu(n, f));
  const alinan = f.alinan || '';
  const sonra = n => !alinan || svKiyas(n.surum, alinan) > 0;
  const fnot = f.notlar || [];
  const al = fnot.filter(n => n.tur === 'genel' && sonra(n));
  const alOzel = fnot.filter(n => n.tur === 'ozel' && sonra(n));
  const alSayi = f.notVar ? al.length : (f.yukariSayi || 0);
  /* Son eşitlemeler: firmanın son "esitleme" notu · ana programın bu firmadan son notu */
  const sonGetir = fnot.find(n => n.tur === 'esitleme') || null;
  const sonAl = (ana.notlar || []).find(n => esKaynakBu(n, f)) || null;
  return { getir, al, alOzel, alSayi, sonGetir, sonAl };
}

function esSqlSay(l) { return l.filter(n => n.sql).length; }
function esTarihKisa(n) { return n && n.tarih ? svTarih(n.tarih) : ''; }

/* ---------- Raf ---------- */
function esitlemeRafi() {
  if (!AUTH.yonetici) return '<div class="at-bos">Eşitleme yalnız yöneticiye açık.</div>';
  esKorYukle();
  if (SURUM.durum !== 'tamam') return '<div class="at-bos">Programların sürümleri okunuyor…</div>';
  const analar = (SURUM.analar || []).filter(a => !a.hata);
  if (!analar.length) return '<div class="at-bos">Sürüm takibinde ana program yok.</div>';
  return analar.map(esAnaBlok).join('') + esKorBlok(analar)
    + `<div class="es-dip">Firmaların yayındaki sitesinden okunur · <button type="button" class="sv-yenile" data-eylem="es-yenile">Yenile</button></div>`;
}

function esKutu(kod, ad, surum, tur) {
  return `<div class="es-fk ${tur || ''}"><span class="es-lg">${esc(kod)}</span><b>${esc(ad)}</b><small>${esc(surum || '–')}</small></div>`;
}
function esOk(sayi, yazi) {
  return `<div class="es-ok ${sayi ? 'bek' : ''}"><span>${esc(yazi)}</span><i></i></div>`;
}
/* Kısa ad: "Güllüoğlu Kübban" → Güllüoğlu · "Merkez Efendi Köftecisi" → Merkez Efendi */
function esKisaAd(ad) {
  const k = String(ad || '').trim().split(/\s+/);
  return k[0] && k[0].length <= 6 && k[1] ? k[0] + ' ' + k[1] : (k[0] || '');
}
/* Ayrılma eki: Güllüoğlu'ndan · Merkez Efendi'den · Kübban'dan */
function esDan(ad) {
  const s = String(ad || '').toLocaleLowerCase('tr');
  const sesli = (s.match(/[aeıioöuü]/g) || []).pop() || 'a';
  const ince = 'eiöü'.includes(sesli);
  const son = s.slice(-1);
  /* "-oğlu" iyelikli: Güllüoğlu'ndan · ünlüyle biten: Ankara'dan · sert ünsüz: Ahmet'ten */
  const ek = /o[gğ]lu$/.test(s) ? 'nd' : 'çfhkpsşt'.includes(son) ? 't' : 'd';
  return ad + "'" + ek + (ince ? 'en' : 'an');
}

function esAnaBlok(ana) {
  const fl = (ana.firmalar || []).map(f => ({ f, y: esYonler(ana, f) }));
  /* Akış: ana programa alınacak işi olanlar solda, kalanlar sağda. */
  const sol = fl.filter(x => x.y.alSayi), sag = fl.filter(x => !x.y.alSayi);
  const akis = `<div class="es-akis">
    ${sol.length ? `<div class="es-yan">${sol.map(x => `<div class="es-cift">${esKutu(x.f.kod, esKisaAd(x.f.ad), svKisa(x.f.canli))}${esOk(1, x.y.alSayi + ' genel →')}</div>`).join('')}</div>` : ''}
    ${esKutu('ANA', 'Ana program', svKisa(ana.canli), 'ana')}
    ${sag.length ? `<div class="es-yan">${sag.map(x => `<div class="es-cift">${esOk(x.y.getir.length, x.y.getir.length ? '→ ' + x.y.getir.length + ' bekliyor' : '→ güncel ✓')}${esKutu(x.f.kod, esKisaAd(x.f.ad), svKisa(x.f.canli))}</div>`).join('')}</div>` : ''}
  </div>`;
  const satirlar = fl.map(({ f, y }) => {
    const ad = esKisaAd(f.ad);
    const alYazi = !f.anaSurum && !f.notVar ? 'Sürüm bilgisi okunamadı'
      : y.alSayi ? `${y.alSayi} genel${y.alOzel.length ? ' · ' + y.alOzel.length + ' özel (alınmayacak)' : ''}${esSqlSay(y.al) ? ' · ' + esSqlSay(y.al) + ' SQL' : ''}`
      : 'Ana programa alınacak bir şey yok' + (y.sonAl ? ' · son alma ' + esTarihKisa(y.sonAl) : '');
    const getirYazi = y.getir.length ? `${y.getir.length} güncelleme bekliyor${esSqlSay(y.getir) ? ' · ' + esSqlSay(y.getir) + ' SQL' : ''}`
      : y.alSayi ? `Güncel · ${esDan(ad)} alınınca diğer firmalara gidecek` : 'Güncel' + (y.sonGetir ? ' · son eşitleme ' + esTarihKisa(y.sonGetir) : '');
    return esSatir('al', f.kod, `${ad} → Ana program`, alYazi, y.alSayi ? 'bek' : 'ok')
      + esSatir('getir', f.kod, `Ana program → ${ad}`, getirYazi, y.getir.length ? 'bek' : 'ok');
  }).join('');
  return `<div class="es-blok">
    <div class="es-bas"><b>🔄 ${esc(ana.ad)}</b><i>Sürüm ${esc(svKisa(ana.canli))} · ${fl.length} firma</i></div>
    ${akis}
    <div class="es-kutu">${satirlar || '<div class="at-bos ic">Bu programdan henüz firma yok.</div>'}</div>
  </div>`;
}

function esSatir(yon, kod, bas, alt, s) {
  return `<div class="es-sat" data-eylem="es-paket" data-yon="${yon}" data-id="${esc(kod)}" role="button" tabindex="0">
    <span class="es-ik ${s}">${s === 'bek' ? '🟡' : '✅'}</span>
    <span class="es-yz"><b>${esc(bas)}</b><i>${esc(alt)}</i></span>
    <span class="es-sg">›</span></div>`;
}

function esKorBlok(analar) {
  const kodlar = [];
  analar.forEach(a => (a.firmalar || []).forEach(f => { if (!kodlar.some(k => k.kod === f.kod)) kodlar.push({ kod: f.kod, ad: f.ad }); }));
  let govde;
  if (ESIT.korDurum === 'yukleniyor' || ESIT.korDurum === 'bos') govde = '<div class="es-kor-bos">Okunuyor…</div>';
  else if (ESIT.korDurum === 'kurulmadi') govde = `<div class="es-kor-bos">Korunacaklar listesi için Studio'nun Supabase'inde <b>sql/57-esitleme-guvenlik.sql</b> bir kez çalıştırılmalı.</div>`;
  else if (ESIT.korDurum === 'hata') govde = '<div class="es-kor-bos">Liste okunamadı · <button type="button" class="sv-yenile" data-eylem="es-yenile">Tekrar dene</button></div>';
  else {
    govde = (ESIT.kor.length ? ESIT.kor.map(k => `<div class="es-kor">🔒 <b>${esc(k.firma_kod)}</b><span>${esc(k.yazi)}${k.iz ? ` <code>${esc(k.iz)}</code>` : ''}</span>
        <button type="button" class="es-kor-sil" data-eylem="es-kor-sil" data-id="${esc(k.id)}" aria-label="Sil">×</button></div>`).join('')
      : '<div class="es-kor-bos">Henüz korunacak yok.</div>')
      + (ESIT.ekleAcik ? `<div class="es-kor-form">
          <select id="es-kor-firma">${kodlar.map(k => `<option value="${esc(k.kod)}">${esc(k.kod)} · ${esc(esKisaAd(k.ad))}</option>`).join('')}</select>
          <input id="es-kor-yazi" placeholder="Ne korunacak? (ör. Gün sonu elle kayıt)" maxlength="200">
          <input id="es-kor-iz" placeholder="Kodda geçen iz (ör. sambaElleUygula) · isteğe bağlı" maxlength="200">
          <div class="es-kor-dug"><button type="button" class="sayfa-dug" data-eylem="es-kor-kaydet">Ekle</button>
            <button type="button" class="sayfa-dug ikincil" data-eylem="es-kor-ac">Vazgeç</button></div></div>`
        : `<button type="button" class="es-kor-ekle" data-eylem="es-kor-ac">＋ Korunacak ekle</button>`);
  }
  return `<div class="es-blok"><div class="es-bas"><b>🔒 Korunacaklar</b><i>Firmaya özel · eşitlemede kaybolmamalı</i></div>
    <div class="es-kutu es-kor-kutu">${govde}</div></div>`;
}

/* ---------- Paket penceresi ---------- */
function esFirmaBul(kod) { return svFirmaBul(kod); }

function esitlemePaketAc(yon, kod, yerinde) {
  const b = esFirmaBul(kod);
  if (!b) return;
  esKorYukle();
  const { ana, f } = b;
  const y = esYonler(ana, f);
  const ad = esKisaAd(f.ad);
  const kor = esKorunacaklar(f.kod);
  const satir = (n, etiket) => {
    const [s, et] = SV_ETIKET[etiket] || SV_ETIKET.genel;
    return `<div class="sv-ds ${etiket === 'ozel' ? 'es-ust' : ''}"><span class="sv-cip ${s}">${et}</span>
      <span class="sv-ds-yz">${esc(n.ozet || '')}${n.sql ? ` <span class="es-sql">SQL ${esc(n.sql)}</span>` : ''}</span><em>${esc(svKisa(n.surum))}</em></div>`;
  };
  let baslik, alt, liste, kontrol, dug, son;
  if (yon === 'al') {
    baslik = `${ad} → Ana program`;
    alt = `${ad} ${svKisa(f.alinan || '?')} → ${svKisa(f.canli || '?')} · ${y.al.length + y.alOzel.length} not`;
    const hepsi = y.al.map(n => ({ n, e: 'genel' })).concat(y.alOzel.map(n => ({ n, e: 'ozel' })))
      .sort((a, b2) => svKiyas(b2.n.surum, a.n.surum));
    liste = hepsi.length ? hepsi.slice(0, 40).map(x => satir(x.n, x.e)).join('')
      + (hepsi.length > 40 ? `<div class="es-daha">＋ ${hepsi.length - 40} not daha (talimatta hepsi var)</div>` : '')
      : (!f.notVar && y.alSayi ? `<div class="es-daha">Firmanın notları okunamadı; yayındaki sürümden ${y.alSayi} yeni sürüm olduğu anlaşıldı.</div>`
        : '<div class="es-daha">Ana programa alınacak genel güncelleme yok ✅</div>');
    kontrol = ['🔍 Firmanın adı, rengi, özel ekranı ana programa sızdı mı',
      '🎨 Sıcak renkler ana programın nötr paletine çevrildi mi',
      '🗄️ SQL: yalnız yapı alınır, firma verisi alınmaz',
      kor.length ? `🔒 ${ad} için özel ${kor.length} özellik ana programa girmez` : '',
      '🧪 Ekranlar açılıyor mu'];
    dug = y.alSayi ? promptBaglantisi({ tur: 'surum:al:' + f.kod, yazi: '📋 Ana programa alma talimatını kopyala', slug: ana.repo }) : '';
    son = y.sonAl;
  } else {
    baslik = `Ana program → ${ad}`;
    alt = `Ana ${svKisa(f.anaSurum || '?')} → ${svKisa(ana.canli)} · ${y.getir.length} güncelleme`;
    liste = y.getir.length ? y.getir.map(n => satir(n, 'bekleyen')).join('')
      : `<div class="es-daha">${y.alSayi ? `Ana programda yeni bir şey yok. Önce ${ad} programındaki ${y.alSayi} genel güncelleme ana programa alınır.` : 'Ana programdaki her şey bu firmada var ✅'}</div>`;
    kontrol = ['🔍 Başka firmanın adı / rengi / ekranı sızdı mı',
      `🔒 Korunacaklar yerinde mi (${kor.length} madde)`,
      '🏷️ Firma kimliği aynı mı (marka, önbellek adı, alan adı)',
      '🗄️ Yeni SQL: önce yedek, sonra firmanın veritabanına',
      '🧪 Ekranlar açılıyor mu'];
    dug = y.getir.length ? promptBaglantisi({ tur: 'surum:esitle:' + f.kod, yazi: '📋 Eşitleme talimatını kopyala', slug: f.repo }) : '';
    son = y.sonGetir;
  }
  const korHtml = kor.length ? `<div class="yd-baslik2">${yon === 'al' ? `${ad} için özel · ana programa alınmaz` : 'Korunacaklar'}</div>`
    + kor.map(k => `<div class="es-kon">🔒 ${esc(k.yazi)}${k.iz ? ` <code>${esc(k.iz)}</code>` : ''}</div>`).join('') : '';
  const html = `
    ${modalBaslik(ICON.dal || ICON.kaydet, baslik, alt)}
    <div class="es-liste">${liste}</div>
    ${korHtml}
    <div class="yd-baslik2">Eşitleme bitince otomatik kontrol</div>
    ${kontrol.filter(Boolean).map(k => `<div class="es-kon">${esc(k)}</div>`).join('')}
    ${dug ? `<div class="es-dug">${dug}</div>
      <p class="es-not">Claude Code'a yapıştırılır. Kontrol aracı (ana programda <code>araclar/esitleme-kontrol.py</code>) sorun bulursa Claude düzeltir; sonucu sürüm notuna yazar.</p>` : ''}
    ${son ? `<div class="es-son">Son ${yon === 'al' ? 'alma' : 'eşitleme'} · ${esc(esTarihKisa(son))} · ${esc(svKisa(son.surum))}${son.kontrol ? ' · ' + esc(son.kontrol) : ''}</div>` : ''}`;
  if (yerinde) {
    const m = $('.es-modal');
    if (m) { const ic = m.querySelector('.es-ic'); if (ic) ic.innerHTML = html; }
    return;
  }
  modalHepsiniKapat();
  modalAc(`<div class="es-ic">${html}</div>`, k => { k.classList.add('es-modal'); k.dataset.yon = yon; k.dataset.kod = f.kod; }, 'yd-modal');
}

/* ---------- Talimatlar (surumPrompt bunları çağırır) ---------- */
function esKomutKor(kor) {
  return kor.filter(k => k.iz).map(k => ' --korunacak "' + String(k.iz).replace(/"/g, '\\"') + '"').join('');
}

function esitlemeTalimati(tur, kod) {
  const b = esFirmaBul(kod);
  if (!b) return '';
  const { ana, f } = b;
  const y = esYonler(ana, f);
  const ad = esKisaAd(f.ad);
  const kor = esKorunacaklar(f.kod);
  const liste = l => l.map(n => '- ' + n.surum + ' · ' + (n.ozet || '') + (n.sql ? ' (SQL ' + n.sql + ')' : '')).join('\n');
  const anaKlasor = '../' + String(ana.repo || 'ana-program').split('/').pop();
  if (tur === 'esitle') {
    return [
      `[Eşitleme] Ana program → ${f.ad}`,
      '',
      `Ana program: ${ana.repo} · yayındaki sürüm ${ana.canli}`,
      `Firma: ${f.repo} (bu depo) · ana programdan aldığı son sürüm ${f.anaSurum}`,
      '',
      'Taşınacak ana program güncellemeleri:',
      liste(y.getir.slice().reverse()),
      kor.length ? '\nKORUNACAKLAR (firmaya özel, kaybolmamalı):\n' + kor.map(k => '- ' + k.yazi + (k.iz ? ' · kodda iz: "' + k.iz + '"' : '')).join('\n') : '',
      '',
      'Yöntem:',
      `1. Başlamadan önce bu deponun son commit'ini not et (TABAN). Ana program deposunu yanına klonla (${anaKlasor}).`,
      `2. Ana programda ${f.anaSurum} ile ${ana.canli} arasındaki farkı üç yönlü uygula (git diff | git apply --3way). Çakışmada firmanın kimliği korunur: marka, renkler, görseller, surum.js NS.* ayarları, sw.js önbellek adı, CNAME. Yeni gelen satırlar firmanın renginde olsun.`,
      '3. Yeni veritabanı göçleri ana programın numarasıyla gelir. Firmanın veritabanına uygulamadan önce yedek al; firmaya özel göçlerle çakışmasın.',
      `4. KONTROL: python ${anaKlasor}/araclar/esitleme-kontrol.py --repo . --firma ${f.kod} --taban <TABAN>${esKomutKor(kor)}`,
      '   ❌ kalmayana dek düzelt. ⚠️ satırlarına bak (yorumdaki adlar, SQL veri adımları).',
      `5. surumler.json: ana_surum = "${ana.canli}"; notlar'ın en üstüne { "surum", "tarih", "tur": "esitleme", "sql", "kontrol": "<KONTROL satırı>", "ozet": "Ana program ${svKisa(ana.canli)}'den: …" }. NS.surum ve damgalar yeni sürüme.`,
      '6. Bütün ekranları dene, sonra gönder. Firmanın CLAUDE.md\'sindeki "Sürüm takibi" kuralına uy.',
    ].filter(x => x !== '').join('\n');
  }
  if (tur === 'al') {
    return [
      `[Ana programa alma] ${f.ad} → Ana program`,
      '',
      `Ana program: ${ana.repo} (bu depo) · sürüm ${ana.canli}`,
      `Firma: ${f.repo} · ana programa alınan son sürüm ${f.alinan || '?'} · yayındaki sürüm ${f.canli || '?'}`,
      y.al.length ? '\nAlınacak GENEL güncellemeler:\n' + liste(y.al.slice().reverse())
        : `\nFirmanın sürüm notları okunamadı: ${f.alinan || '?'} sonrası commit'lere bak, genel olanları ayır.`,
      y.alOzel.length ? '\nALINMAYACAK (firmaya özel):\n' + liste(y.alOzel.slice().reverse()) : '',
      kor.length ? `\n${ad} için özel, ana programa GİRMEYECEK özellikler:\n` + kor.map(k => '- ' + k.yazi + (k.iz ? ' (' + k.iz + ')' : '')).join('\n') : '',
      '',
      'Yöntem:',
      `1. Başlamadan önce bu deponun son commit'ini not et (TABAN). Firma deposunu yanına salt-okur klonla; ona yazma.`,
      '2. Genel güncellemeleri commit commit uygula. Özel olanlar alınmaz. Bir genel güncelleme özel bir koda dayanıyorsa gereken kısmı nötr al (firmaya göre değişen şey surum.js\'te NS.* ayarı olur).',
      '3. Firma izi kalmaz: firma adı, kişiler, firma tarihleri, tedarikçiler. Renkler ana programın nötr paletine (araclar/sicak-renkler.json karşılıkları).',
      `4. Veritabanı göçleri ana programın sıradaki numarasıyla; başlıkta "(${ad} ${f.kod}-xx)" kaynak notu. Yalnız yapı: firmanın kendi verisini taşıyan adımlar alınmaz. OKUBENI'ye satır.`,
      `5. KONTROL: python araclar/esitleme-kontrol.py --repo . --firma ANA --taban <TABAN>`,
      '   ❌ kalmayana dek düzelt. ⚠️ satırlarına bak.',
      `6. surumler.json: notlar'ın en üstüne { "surum", "tarih", "kaynak": "${f.kod}", "sql", "kontrol": "<KONTROL satırı>", "ozet": "${esDan(ad)}: …" }; firmalar → ${f.kod} → alinan = "${f.canli || ''}".`,
      '7. Bütün ekranları dene, sonra gönder. Bundan sonra diğer firmalarda bu güncellemeler Studio › Eşitleme\'de "bekliyor" görünür.',
    ].filter(x => x !== '').join('\n');
  }
  return '';
}

/* ---------- Eylemler (app.js 'es-' önekiyle buraya yollar) ---------- */
async function esitlemeEylem(e, el) {
  if (e === 'es-paket') { esitlemePaketAc(el.dataset.yon, el.dataset.id); return true; }
  if (e === 'es-yenile') { ESIT.korDurum = 'bos'; esKorYukle(true); surumTakipYukle(true); render(); return true; }
  if (e === 'es-kor-ac') { ESIT.ekleAcik = !ESIT.ekleAcik; render(); return true; }
  if (e === 'es-kor-kaydet') {
    const firma = ($('#es-kor-firma') || {}).value, yazi = String(($('#es-kor-yazi') || {}).value || '').trim();
    const iz = String(($('#es-kor-iz') || {}).value || '').trim();
    if (!firma || yazi.length < 2) { toast('Ne korunacağını yaz.', 'uyari'); return true; }
    if (iz && iz.length < 3) { toast('İz en az 3 harf olmalı.', 'uyari'); return true; }
    const { error } = await AUTH.db.from('esitleme_korunacaklar').insert({ firma_kod: firma, yazi, iz: iz || null });
    if (error) { toast('Eklenemedi: ' + error.message, 'hata'); return true; }
    ESIT.ekleAcik = false; toast('Korunacak eklendi 🔒'); esKorYukle(true); return true;
  }
  if (e === 'es-kor-sil') {
    const k = (ESIT.kor || []).find(x => x.id === el.dataset.id);
    if (!k || !confirm('"' + k.yazi + '" korunacaklardan çıkarılsın mı?')) return true;
    const { error } = await AUTH.db.from('esitleme_korunacaklar').delete().eq('id', k.id);
    if (error) { toast('Silinemedi: ' + error.message, 'hata'); return true; }
    esKorYukle(true); return true;
  }
  return false;
}
