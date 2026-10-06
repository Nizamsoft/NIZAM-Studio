/* ==========================================================================
   NIZAM Studio — Test Klonu
   Müşteriye yapılmış bir programın bağlantısız ikizi: ayrı GitHub deposu,
   ayrı Supabase, birebir aynı yapı (tablo, kolon, RLS, fonksiyon, tetikleyici),
   boş veri. Klonda ne yapılırsa yapılsın müşterinin sistemine dokunmaz.

   Adres: #/projeler/<klonId> — klon projeler aşama akışından geçmez, bu ekran açılır.
   Kurulum: 1 GitHub (template'ten kopya) · 2 Supabase · 3 Yapı · 4 Bağlantıyı kopar ·
   5 Bağlantı kontrolü. Sonra elle başlatılan eşitleme (asıl program değişince).

   Yapı okuma ve kurulum Nizam Security'nin parçalarını kullanır (security*.js):
   SEC_YAPI_SQL, secKurulumGovde, secTemizleSql, secYapiKarsilastir.
   Durum projenin paletinde: palet.klon = { kaynak, olusturuldu, yapiKuruldu,
   yapiKaynakTarihi, koparildi, kontrol: {temiz, tarih, bulunanlar}, kodEsitlendi }.
   index.html'de security-*.js'ten sonra.
   ========================================================================== */

const KLON = { ac: {} };   // projeId → { adımNo: true/false } — açık kurulum bölümleri

const KLON_ADIMLAR = [
  { id: 'depo',     ad: 'GitHub deposu',          kisa: 'Asıl kodun kopyası',
    aciklama: 'Asıl programın kodu, GitHub\'ın "template" yoluyla yeni ve ayrı bir depoya kopyalanır.' },
  { id: 'supabase', ad: 'Supabase bağlantısı',    kisa: 'Ayrı, boş bir veritabanı',
    aciklama: 'Klon için Supabase\'de yeni, boş bir proje aç; adresini ve açık anahtarını gir.' },
  { id: 'yapi',     ad: 'Veritabanı yapısı',      kisa: 'Tablolar, kurallar, fonksiyonlar',
    aciklama: 'Asıl veritabanının bugünkü yapısı klona kurulur. Veri kopyalanmaz, klon boş başlar.' },
  { id: 'kopar',    ad: 'Bağlantıyı kopar',       kisa: 'Kodda adres ve servisler',
    aciklama: 'Claude, klonun kodundaki Supabase adresini ve anahtarını yenileriyle değiştirir; alan adı, e-posta, ödeme gibi dış bağlantıları kapatır.' },
  { id: 'kontrol',  ad: 'Bağlantı kontrolü',      kisa: 'Asıldan iz kaldı mı?',
    aciklama: 'Claude klonun kodunu tarar: asıl programın adresi, anahtarı ya da alan adı bir yerde kalmış mı?' },
];

function klonVeri(p) { return ((p && p.palet) || {}).klon || {}; }
function klonKaynak(p) { return DB.proje(klonVeri(p).kaynak); }

/* Her adım bitti mi + kısa durum yazısı. */
function klonDurumlari(p) {
  const pl = p.palet || {}, k = klonVeri(p);
  return [
    { bitti: !!depoSlug(p.repo), yazi: depoSlug(p.repo) },
    { bitti: !!(pl.supabaseUrl && pl.supabaseAnon), yazi: pl.supabaseUrl ? secKisalt(secRef(pl.supabaseUrl), 4, 4) + '.supabase.co' : '' },
    { bitti: !!k.yapiKuruldu, yazi: k.yapiKuruldu ? 'Kuruldu · ' + secTarih(k.yapiKuruldu) : '' },
    { bitti: !!k.koparildi, yazi: k.koparildi ? 'Koparıldı · ' + secTarih(k.koparildi) : '' },
    { bitti: !!(k.kontrol && k.kontrol.temiz), yazi: k.kontrol ? (k.kontrol.temiz ? 'Temiz · ' + secTarih(k.kontrol.tarih)
      : (k.kontrol.bulunanlar || []).length + ' iz bulundu') : '' },
  ];
}

async function klonPaletYaz(p, alanlar) {
  const pl = Object.assign({}, p.palet || {});
  pl.klon = Object.assign({}, pl.klon || {}, alanlar);
  await DB.paletKaydet(p.id, pl);
}

/* ---------- Oluşturma ---------- */

function klonKaynakSec() {
  modalHepsiniKapat();
  const liste = (DB.projeler || []).filter(p => !p.arsiv && !cekirdekMi(p) && !klonMi(p));
  if (!liste.length) { toast('Klonlanacak proje yok.', 'uyari'); return; }
  modalAc(`
    ${modalBaslik(ICON.kopya, 'Hangi programın klonu?',
      'Ayrı depo ve ayrı veritabanıyla, müşterinin sistemine bağlanmayan bir test ikizi kurulur.')}
    <div class="secim">
      ${liste.map(p => `
        <div class="satir sec-satir" data-kl="${p.id}" role="button" tabindex="0">
          <span class="sec-yazi"><b>${esc(projeAdi(p))}</b>
            <i>${esc(depoSlug(p.repo) || 'GitHub deposu kayıtlı değil')}</i></span>
        </div>`).join('')}
    </div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-kl="kapat" type="button">Vazgeç</button>
    </div>`, kutu => {
    kutu.addEventListener('click', async ev => {
      const t = ev.target.closest('[data-kl]');
      if (!t) return;
      modalKapat();
      if (t.dataset.kl === 'kapat') return;
      await klonOlustur(t.dataset.kl);
    });
  }, 'genis');
}

async function klonOlustur(kaynakId) {
  const kaynak = DB.proje(kaynakId);
  if (!kaynak) return;
  try {
    const id = await DB.projeKopyala(kaynakId, { tur: 'deneme' });
    await DB.projeGuncelle(id, { firma: (kaynak.firma || 'Proje') + ' · Klon' });
    const p = DB.proje(id);
    await DB.paletKaydet(id, Object.assign({}, p.palet || {}, {
      klon: { kaynak: kaynakId, olusturuldu: new Date().toISOString() },
    }));
    toast('Klon açıldı. Kurulum adımlarını sırayla tamamla.', 'basari');
    location.hash = '#/projeler/' + id;
  } catch (h) {
    toast('Klon açılamadı: ' + (h.message || h), 'hata');
  }
}

/* ---------- Ekran ---------- */

function klonEkrani(p) {
  const kaynak = klonKaynak(p);
  const k = klonVeri(p);
  /* Asıl projenin ve klonun Nizam Security kaydı (yapı) — yoksa yükle. */
  if (kaynak && SEC.kayit[kaynak.id] === undefined) {
    secYukle('kayit-' + kaynak.id, async () => { SEC.kayit[kaynak.id] = await SEC_VERI.getir(kaynak.id); });
    return iskeletler(3);
  }
  if (SEC.kayit[p.id] === undefined) {
    secYukle('kayit-' + p.id, async () => { SEC.kayit[p.id] = await SEC_VERI.getir(p.id); });
    return iskeletler(3);
  }
  const durumlar = klonDurumlari(p);
  const biten = durumlar.filter(x => x.bitti).length;
  const hazir = biten === durumlar.length;

  const hero = `
    <div class="secv-hero klon-hero">
      <div class="secv-hero-yz">
        <span class="klon-rozet">🧬 Test Klonu</span>
        <h1>${esc(basHarfleriBuyuk(projeAdi(p)))}</h1>
        <p>Asıl program: <b>${esc(kaynak ? projeAdi(kaynak) : 'silinmiş')}</b> · müşterinin sistemine bağlı değil.</p>
      </div>
    </div>`;

  const durum = hazir
    ? `<div class="secv-kusursuz"><span>${SEC_TIK}</span><div><b>Klon hazır — bağlantı temiz</b>
        <i>İstediğin gibi dene; müşterinin sistemine hiçbir şey gitmez.</i></div></div>`
    : `<div class="secv-durum">○ Kurulum · <b>${biten} / ${durumlar.length}</b> tamam</div>`;

  const kurulum = `
    <h3 class="sec-bas">Kurulum · ${biten} / ${durumlar.length}</h3>
    <div class="secv-cubuk">${durumlar.map((x, i) => `<i class="${x.bitti ? 'bitti' : i === durumlar.findIndex(d => !d.bitti) ? 'su' : ''}"></i>`).join('')}</div>
    <div class="secv-adimlar">${KLON_ADIMLAR.map((a, i) => klonBolum(p, a, i, durumlar)).join('')}</div>`;

  const araclar = hazir ? `
    <a class="secv-kur tamam" href="#/security/${esc(p.id)}">
      <span class="secv-kur-ik">🛡️</span>
      <span class="secv-adim-yz"><b>Klonu Nizam Security'de tara</b>
        <i>Müşteriyi riske atmadan güvenlik testi</i></span>
      <span class="secv-adim-s">›</span>
    </a>` : '';

  return `<div class="secv">${hero}${durum}${hazir ? klonEsitleme(p) + araclar : ''}
    ${hazir ? `<details class="sec-gelismis"><summary>Kurulum adımları (5 / 5 tamam)</summary>${kurulum}</details>` : kurulum}</div>`;
}

function klonBolum(p, a, i, durumlar) {
  const d = durumlar[i];
  const ilk = durumlar.findIndex(x => !x.bitti);
  const acikDurum = (KLON.ac[p.id] || {})[i];
  const ac = acikDurum !== undefined ? acikDurum : (!d.bitti && i === ilk);
  return `
    <div class="secv-ayar ${d.bitti ? 'bitti' : i === ilk ? 'simdi' : ''}${ac ? ' acik' : ''}">
      <button class="secv-adim" type="button" data-eylem="klon-ac-kapa" data-id="${esc(p.id)}" data-n="${i}" data-ac="${ac}">
        <span class="secv-adim-no">${i + 1}</span>
        <span class="secv-adim-yz"><b>${esc(a.ad)}</b><i>${esc(d.yazi || a.kisa)}</i></span>
        <span class="secv-adim-s">${d.bitti ? `<i class="secv-tik">${SEC_TIK}</i>` : ac ? '⌄' : '›'}</span>
      </button>
      ${ac ? `<div class="secv-ayar-ic"><p class="secv-ayar-acik">${esc(a.aciklama)}</p>${klonAdimIcerik(p, a.id)}</div>` : ''}
    </div>`;
}

function klonDug(p, yazi, eylem, ana = false, kapali = false, ek = '') {
  return `<button class="sec-dug${ana ? ' ana' : ''}" type="button" data-eylem="${eylem}" data-id="${esc(p.id)}" ${ek}
    ${kapali ? 'disabled' : ''}>${esc(yazi)}</button>`;
}

function klonAdimIcerik(p, id) {
  const kaynak = klonKaynak(p);
  const k = klonVeri(p);
  const pl = p.palet || {};
  const not = m => `<p class="sec-t-not">${m}</p>`;
  if (!kaynak) return not('Asıl proje bulunamadı (silinmiş ya da arşivde).');

  if (id === 'depo') {
    const kSlug = depoSlug(kaynak.repo);
    if (!kSlug) return not('Asıl projenin GitHub deposu Studio\'da kayıtlı değil; önce oraya depoyu gir.');
    const yeniAd = depoAdi(p);
    return secYapilacak([
      ['Asıl depoyu bir kez "Template repository" yap',
        esc(kSlug) + ' → Settings → General → "Template repository" kutusunu işaretle. Zararsız, kalıcı bir ayar.',
        `<a class="sec-dug" target="_blank" rel="noopener" href="https://github.com/${esc(kSlug)}/settings">GitHub ayarlarını aç</a>`],
      ['GitHub\'da kopyala',
        'Açılan sayfada <b>Repository name</b> alanına bu adı yapıştır, <b>Private</b> seç, <b>Create repository</b> de.',
        `<a class="sec-dug ana" target="_blank" rel="noopener" href="https://github.com/${esc(kSlug)}/generate">GitHub'da kopyala</a>
         <button class="sec-dug" type="button" data-eylem="klon-pano" data-id="${esc(p.id)}" data-metin="${esc(yeniAd)}">📋 ${esc(yeniAd)}</button>`],
      ['Yeni deponun adresini gir', depoSlug(p.repo) ? 'Kayıtlı: <code>' + esc(depoSlug(p.repo)) + '</code>' : '',
        klonDug(p, depoSlug(p.repo) ? 'Değiştir' : 'Adresi gir', 'klon-depo', !depoSlug(p.repo))],
    ]) + klonAlanUyarisi(p, kaynak);
  }

  if (id === 'supabase') {
    return not('Supabase\'de <b>yeni, boş</b> bir proje aç (asıl projeyi değil). Adresi ve <b>publishable / anon</b> anahtarı gir; service_role istenmez.')
      + `<div class="sec-t-dg">${klonDug(p, pl.supabaseUrl ? 'Değiştir' : 'Bağlantıyı gir', 'klon-supabase', !pl.supabaseUrl)}</div>`
      + (pl.supabaseUrl ? `<p class="sec-t-ipucu">🛡️ Asıl ${esc(secKisalt(secUretimRef(kaynak) || '?', 4, 4))} ≠ Klon ${esc(secKisalt(secRef(pl.supabaseUrl), 4, 4))}</p>` : '');
  }

  if (id === 'yapi') {
    const ky = (SEC.kayit[kaynak.id] || {}).yapi;
    const kyTarih = (SEC.kayit[kaynak.id] || {}).yapi_tarihi;
    if (!pl.supabaseUrl) return not('Önce 2. adımda klonun Supabase bağlantısını gir.');
    const yapiGuncel = ky && ky.nizam_security === SEC_YAPI_SURUM;
    return secYapilacak([
      ['Asıl veritabanının yapısını oku',
        yapiGuncel ? 'Okundu · ' + esc(secTarih(kyTarih)) + ' · ' + ky.tablolar.length + ' tablo. Asılda değişiklik olduysa yenile.'
          : 'Yapı SQL\'ini <b>asıl</b> projenin SQL Editor\'ünde çalıştır, çıkan sonucu yapıştır. Yalnız okur, veri almaz.',
        klonDug(p, yapiGuncel ? 'Yenile' : 'Yapıyı oku', 'klon-kaynak-yapi', !yapiGuncel)],
      ['Kurulum SQL\'ini kopyala ve <b>klonun</b> SQL Editor\'ünde çalıştır',
        'Klonun Supabase\'i: <code>' + esc(secKisalt(secRef(pl.supabaseUrl), 4, 4)) + '.supabase.co</code>. Asılda çalıştırırsan kendini durdurur.',
        klonDug(p, '📋 SQL\'i kopyala', 'klon-yapi-sql', yapiGuncel && !k.yapiKuruldu, !yapiGuncel)
        + klonDug(p, '✅ Çalıştırdım', 'klon-yapi-tamam', false, !yapiGuncel || !!k.yapiKuruldu)],
    ]);
  }

  if (id === 'kopar') {
    if (!depoSlug(p.repo) || !pl.supabaseUrl) return not('Önce 1. ve 2. adımları tamamla.');
    return secYapilacak([
      ['Promptu kopyala, klonun deposunda Claude Code\'a ver',
        'Claude kodda Supabase adresini ve anahtarını yenileriyle değiştirir, dış bağlantıları kapatır, uygulamanın adına "(Klon)" ekler.',
        klonDug(p, '📋 Promptu kopyala', 'klon-kopar-prompt', !k.koparildi)],
      ['Claude bitirip gönderince onayla', '', klonDug(p, '✅ Claude bitirdi', 'klon-kopar-tamam', false, !!k.koparildi)],
    ]);
  }

  if (id === 'kontrol') {
    const kn = k.kontrol;
    const liste = kn && !kn.temiz && (kn.bulunanlar || []).length ? `
      <div class="sec-uyari">⚠️ Asıl programdan kalan izler:
        <ul class="klon-iz">${kn.bulunanlar.slice(0, 20).map(b => `<li><code>${esc(b.dosya || '?')}${b.satir ? ':' + esc(b.satir) : ''}</code> — ${esc(b.ne || '')}</li>`).join('')}</ul>
        4. adımın promptunu yeniden kopyala; bu izler de içine eklenir. Sonra kontrolü tekrarla.</div>` : '';
    return (k.koparildi ? '' : not('Önce 4. adımı (bağlantıyı kopar) tamamla.')) + liste + secYapilacak([
      ['Kontrol promptunu kopyala, klonun deposunda Claude Code\'a ver', 'Claude kodu değiştirmez, yalnız tarar ve bir JSON verir.',
        klonDug(p, '📋 Promptu kopyala', 'klon-kontrol-prompt', !kn, !k.koparildi)],
      ['Claude\'un verdiği JSON\'u yapıştır', kn ? (kn.temiz ? '✅ Temiz · ' + esc(secTarih(kn.tarih)) : '') : '',
        klonDug(p, 'Sonucu yapıştır', 'klon-kontrol-sonuc', false, !k.koparildi)],
    ]);
  }
  return '';
}

/* Aynı GitHub hesabı = aynı yayın alan adı (kullanici.github.io). Tarayıcı ikisini tek
   site sayar; localStorage, IndexedDB, çerez ve önbellek ORTAK olur. */
function klonAyniAlan(p, kaynak) {
  const sahip = s => (depoSlug(s) || '').split('/')[0].toLowerCase();
  return !!(depoSlug(p.repo) && kaynak && sahip(p.repo) && sahip(p.repo) === sahip(kaynak.repo));
}
function klonAlanUyarisi(p, kaynak) {
  const sahip = (depoSlug(kaynak.repo) || '').split('/')[0];
  if (depoSlug(p.repo) && !klonAyniAlan(p, kaynak)) return '';
  return `<div class="sec-uyari">⚠️ <b>${depoSlug(p.repo) ? 'Klon ve asıl aynı GitHub hesabında' : 'Önerim: klonu ayrı bir GitHub hesabında aç'}.</b>
    Aynı hesaptan yayınlanırlarsa (${esc(sahip || 'hesap')}.github.io) tarayıcı ikisini tek site sayar; hafıza ortak olur ve
    klonun yazdığı veri asılın tarafından okunabilir. En temiz çözüm klonları ayrı bir GitHub organizasyonunda açmak
    (ör. <code>${esc(sahip || 'firma')}-klon</code>): "GitHub'da kopyala" sayfasında <b>Owner</b> olarak onu seç.
    ${depoSlug(p.repo) ? 'Ayrı hesap mümkün değilse 4. adımın promptu hafıza adlarını klona özel yapar; kontrol bunu da denetler.' : ''}</div>`;
}

/* ---------- Eşitleme (elle başlatılır) ---------- */

function klonEsitleme(p) {
  const kaynak = klonKaynak(p);
  if (!kaynak) return '';
  const k = klonVeri(p);
  const ks = SEC.kayit[kaynak.id] || {}, cs = SEC.kayit[p.id] || {};
  const ky = ks.yapi, cy = cs.yapi;
  let fark = null;
  if (ky && cy) {
    const f = secYapiKarsilastir(ky, cy);   // security-test.js — "üretim" = asıl, "test" = klon
    fark = { say: f.sadeceTest.length + f.sadeceUretim.length + f.farkli.length, f };
  }
  const ad = x => (SEC_YAPI_TUR[x.tur] || x.tur) + ' · ' + x.ad;
  const farkListe = fark && fark.say ? `<ul class="klon-iz">${[]
    .concat(fark.f.sadeceUretim.map(x => '<li>Asılda yeni: <code>' + esc(ad(x)) + '</code></li>'),
      fark.f.farkli.map(x => '<li>Değişmiş: <code>' + esc(ad(x)) + '</code></li>'),
      fark.f.sadeceTest.map(x => '<li>Asılda kalkmış: <code>' + esc(ad(x)) + '</code></li>'))
    .slice(0, 10).join('')}${fark.say > 10 ? '<li>… ve ' + (fark.say - 10) + ' fark daha</li>' : ''}</ul>` : '';
  const ozet = !ky ? 'Asıl yapı okunmamış.'
    : fark === null ? 'Klonun yapı kaydı yok; yapıyı yeniden kurunca karşılaştırma başlar.'
    : fark.say ? '<b>' + fark.say + ' yapı farkı</b> var — asıl program değişmiş.' : '<b>Yapılar aynı ✓</b>';
  return `
    <h3 class="sec-bas">Asıl programla eşitle</h3>
    <div class="secv-durum${fark && !fark.say ? ' tamam' : ''}">${ozet}
      <br><small>Asıl yapı: ${esc(secTarih(ks.yapi_tarihi) || '—')} · Klon kuruldu: ${esc(secTarih(k.yapiKuruldu) || '—')}
      ${k.kodEsitlendi ? ' · Kod eşitlendi: ' + esc(secTarih(k.kodEsitlendi)) : ''}</small></div>
    ${farkListe}
    ${secYapilacak([
      ['Asıl yapıyı yenile', 'Asılda değişiklik var mı görmek için; yapı SQL\'ini asıl projede çalıştırıp sonucu yapıştır.',
        klonDug(p, 'Asıl yapıyı yenile', 'klon-kaynak-yapi')],
      ['Kodu eşitle', 'Claude asıl depodaki yenilikleri klona getirir; klonun bağlantı ayarlarını korur.',
        klonDug(p, '📋 Eşitleme promptu', 'klon-esitle-prompt') + klonDug(p, '✅ Claude bitirdi', 'klon-esitle-tamam')],
      ['Yapıyı yeniden kur', 'Klonun veritabanı asılın güncel yapısıyla baştan kurulur. <b>Klondaki veriler silinir.</b>',
        klonDug(p, '📋 Kurulum SQL\'i', 'klon-yapi-sql', !!(fark && fark.say)) + klonDug(p, '✅ Çalıştırdım', 'klon-yapi-tamam')],
      ['Bağlantı kontrolünü tekrarla', 'Eşitlemeden sonra asıldan yeni iz gelmiş olabilir.',
        klonDug(p, '📋 Kontrol promptu', 'klon-kontrol-prompt') + klonDug(p, 'Sonucu yapıştır', 'klon-kontrol-sonuc')],
    ])}`;
}

/* ---------- SQL ve promptlar ---------- */

function klonKurulumSql(yapi, p, kaynakRef, klonRef) {
  const T = yapi.tablolar, F = yapi.fonksiyonlar || [];
  const s = [];
  s.push('-- NIZAM Studio · Test Klonu — veritabanı yapısı');
  s.push('-- YALNIZ KLONUN veritabanında çalıştır: ' + klonRef + '.supabase.co');
  s.push('-- Asıl program (' + kaynakRef + ') DEĞİL. Kilit, başka bir veritabanında kendini durdurur.');
  s.push('-- Satır verisi içermez. Klondaki her şey silinip baştan kurulur.');
  s.push('begin;');
  s.push('set local check_function_bodies = off;');
  s.push('set local search_path = public, extensions;');
  s.push('');
  s.push(`do $nizam_klon_kilit$
declare v_klon text;
begin
  if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and c.relname = 'nizam_test_ortami') then
    raise exception 'NIZAM: DURDURULDU. Burası Nizam Security test veritabanı, klon değil. Hiçbir şey değiştirilmedi.';
  end if;
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname = 'public' and c.relname = 'nizam_klon') then
    if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
               where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')) then
      raise exception 'NIZAM: DURDURULDU. Bu veritabanında tablolar var ama klon işareti yok — burası asıl program olabilir. Hiçbir şey değiştirilmedi.';
    end if;
  else
    execute 'select klon_id from public.nizam_klon where anahtar = ''nizam''' into v_klon;
    if v_klon is distinct from ${secQl(p.id)} then
      raise exception 'NIZAM: DURDURULDU. Bu veritabanı başka bir klona ait. Hiçbir şey değiştirilmedi.';
    end if;
  end if;
end
$nizam_klon_kilit$;`);
  s.push('');
  s.push('-- 1) Klonu baştan temizle');
  s.push(secTemizleSql());
  s.push('');
  s.push('-- İşaret: bu veritabanı bir Nizam test klonu');
  s.push(`create table public.nizam_klon (
  anahtar text primary key default 'nizam',
  klon_id text not null,
  kaynak_ref text,
  klon_ref text,
  kuruldu timestamptz
);`);
  s.push('alter table public.nizam_klon enable row level security;');
  s.push('revoke all on table public.nizam_klon from public, anon, authenticated;');
  s.push(`insert into public.nizam_klon (anahtar, klon_id, kaynak_ref, klon_ref, kuruldu)
values ('nizam', ${secQl(p.id)}, ${secQl(kaynakRef)}, ${secQl(klonRef)}, now());`);
  s.push('');
  secKurulumGovde(yapi).forEach(x => s.push(x));   // security-test.js
  s.push('');
  s.push('commit;');
  s.push(`select 'NIZAM: Klon yapısı kuruldu — ${T.length} tablo, ${T.reduce((n, t) => n + (t.politikalar || []).length, 0)} kural, ${F.length} fonksiyon.' as sonuc;`);
  return s.join('\n');
}

/* Asıl programı tanımlayan izler: klonda hiçbiri kalmamalı. */
function klonIzler(p) {
  const kaynak = klonKaynak(p);
  const kpl = (kaynak && kaynak.palet) || {};
  const iz = [];
  const ref = secUretimRef(kaynak);
  if (ref) iz.push(ref);
  if (kpl.alanAdi) iz.push(String(kpl.alanAdi).replace(/^https?:\/\//, '').replace(/\/.*$/, ''));
  if (kpl.supabaseAnon) iz.push(String(kpl.supabaseAnon).slice(0, 24) + '… (asıl açık anahtarın başı)');
  if (kaynak && depoSlug(kaynak.repo)) iz.push(depoSlug(kaynak.repo));
  return iz;
}

function klonKoparPrompt(p) {
  const kaynak = klonKaynak(p);
  const pl = p.palet || {}, k = klonVeri(p);
  const s = [];
  s.push('# NIZAM Studio — Test Klonu: asıl programla bağlantıyı kopar');
  s.push('');
  s.push('Bu depo (`' + depoSlug(p.repo) + '`), `' + depoSlug(kaynak.repo) + '` deposunun birebir kopyası:');
  s.push('"' + projeAdi(kaynak) + '" programının **TEST KLONU**. Müşteri asıl programı kullanıyor;');
  s.push('klon ona hiçbir şekilde bağlanmamalı.');
  s.push('');
  s.push('## Kesin kurallar');
  s.push('- Asıl depoya (`' + depoSlug(kaynak.repo) + '`) ASLA dokunma, commit/push yapma. Yalnız bu depoda çalış.');
  s.push('- Asıl Supabase projesine (`' + secUretimRef(kaynak) + '.supabase.co`) hiçbir istek kalmamalı.');
  s.push('');
  s.push('## Yapılacaklar');
  s.push('1. **Supabase:** Koddaki bütün Supabase adreslerini ve açık anahtarları yenileriyle değiştir:');
  s.push('   - Adres: `https://' + secRef(pl.supabaseUrl) + '.supabase.co`');
  s.push('   - Açık (publishable/anon) anahtar: `' + pl.supabaseAnon + '`');
  s.push('   service_role ya da gizli anahtar varsa SİL; klonda kullanılmaz.');
  s.push('2. **Alan adı ve yayın:** CNAME, özel alan adı ve yayın/dağıtım ayarları asılın alan adına gitmesin; kaldır.');
  s.push('3. **Dış servisler:** e-posta/SMS gönderimi, ödeme, bildirim (push), webhook, analitik ve 3. parti API');
  s.push('   anahtarlarını kapat ya da boş bırak. Uygulama açılmaya devam etsin ama hiçbir dış sisteme istek gitmesin.');
  s.push('4. **Edge Functions:** varsa kodları kalsın; içlerindeki asıl adres ve anahtarları da değiştir.');
  s.push('5. **Tarayıcı hafızası (ÇOK ÖNEMLİ):** klon ile asıl aynı alan adında yayınlanırsa tarayıcı ikisini tek site');
  s.push('   sayar ve hafızayı ORTAK kullanır; klonun yazdığı veri asılda görünür ve asıl onu müşterinin gerçek');
  s.push('   veritabanına gönderebilir. Bu yüzden:');
  s.push('   - localStorage, sessionStorage, IndexedDB (veritabanı ve store adları) ve çerez adlarının HEPSİNE klona özel');
  s.push('     bir ön ek ver (ör. `yt_` → `ytklon_`). Kodda dağınık sabit ad bırakma; tek bir ön ek sabiti kullan.');
  s.push('   - Supabase/bağlantı ayarını hafızada tutan anahtar varsa ayrıca yeniden adlandır; ayrıca açılışta hafızadan');
  s.push('     okunan adres klonun adresi değilse (ör. asılın adresi) onu YOK SAY ve sil, koddaki klon adresini kullan.');
  s.push('   - Service worker varsa önbellek (cache) adlarını klona özel yap; kapsamı (scope) yalnız klonun yolu olsun.');
  s.push('   - Supabase oturum anahtarı (`sb-…-auth-token`) adresten türediği için zaten ayrılır; özel `storageKey`');
  s.push('     verilmişse onu da klona özel yap.');
  s.push(`${klonAyniAlan(p, kaynak) ? '   - ⚠️ Bu klon asılla AYNI GitHub hesabında: yukarıdakiler zorunlu.' : '   - Klon ayrı bir hesapta olsa bile yukarıdakileri yap (ileride aynı alana taşınabilir).'}`);
  s.push('6. **Ad:** uygulamanın başlığına ve adına "(Klon)" ekle ki asılla karıştırılmasın.');
  s.push('7. Proje kimlik dosyası ya da README varsa en üstüne yalnız "Bu depo bir TEST KLONU." notunu ekle;');
  s.push('   asıl deponun adını, adresini ya da alan adını YAZMA (bağlantı kontrolü bunları iz sayar).');
  s.push('8. Commit mesajı: `[KLON] Asıl programla bağlantı koparıldı` — push et.');
  s.push('');
  s.push('## Klonda kalmaması gereken izler');
  klonIzler(p).forEach(x => s.push('- `' + x + '`'));
  const b = (k.kontrol && !k.kontrol.temiz && k.kontrol.bulunanlar) || [];
  if (b.length) {
    s.push('');
    s.push('## Son kontrolde bulunanlar — bunları da temizle');
    b.slice(0, 30).forEach(x => s.push('- `' + (x.dosya || '?') + (x.satir ? ':' + x.satir : '') + '` — ' + (x.ne || '')));
  }
  s.push('');
  s.push('Bitince kısa özet ver: hangi dosyaları değiştirdin, neyi kapattın.');
  return s.join('\n');
}

function klonKontrolPrompt(p) {
  const s = [];
  s.push('# NIZAM Studio — Test Klonu: bağlantı kontrolü');
  s.push('');
  s.push('Bu depo bir TEST KLONU. **KOD DEĞİŞTİRME**, yalnız tara.');
  s.push('Bütün depoda ara (gizli dosyalar, .env örnekleri, yapılandırma, Edge Functions, HTML, JSON dahil;');
  s.push('node_modules, .git ve derleme çıktıları hariç):');
  s.push('');
  s.push('1. Asıl programın izleri:');
  klonIzler(p).forEach(x => s.push('   - `' + x + '`'));
  s.push('2. `service_role`, `sb_secret_` ya da başka bir gizli anahtar.');
  s.push('3. Gerçek bir dış servise giden ve kapatılmamış bağlantı: e-posta/SMS, ödeme, push, webhook, analitik.');
  s.push('4. Tarayıcı hafızası: localStorage / sessionStorage / IndexedDB / çerez / service worker önbellek adlarından');
  s.push('   klona özel ön eki OLMAYAN var mı? Hafızadan okunan Supabase adresi doğrulanmadan kullanılıyor mu?');
  s.push('   Klon ile asıl aynı alan adında yayınlanıyorsa (aynı GitHub hesabı) bunların her biri bir bulgudur.');
  s.push('');
  s.push('Cevabını **yalnız** şu JSON olarak ver (başka metin yazma):');
  s.push('```json');
  s.push('{ "nizam_klon_kontrol": "1", "temiz": true, "hafiza_ayrik": true, "bulunanlar": [ { "dosya": "yol/dosya.js", "satir": 12, "ne": "kısa açıklama" } ] }');
  s.push('```');
  s.push('`hafiza_ayrik`: bütün hafıza adları klona özel ve hafızadaki bağlantı ayarı doğrulanıyorsa true.');
  s.push('Hiç iz yoksa `"temiz": true` ve `"bulunanlar": []`.');
  return s.join('\n');
}

function klonEsitlePrompt(p) {
  const kaynak = klonKaynak(p);
  const s = [];
  s.push('# NIZAM Studio — Test Klonunu asıl programla eşitle');
  s.push('');
  s.push('Bu depo (`' + depoSlug(p.repo) + '`), `' + depoSlug(kaynak.repo) + '` deposunun TEST KLONU.');
  s.push('Asıl depodaki son değişiklikleri buraya getir.');
  s.push('');
  s.push('## Kesin kurallar');
  s.push('- Asıl depoya ASLA push yapma; yalnız oradan oku, buraya yaz.');
  s.push('- Klonun bağlantı ayarları her zaman klonda kalır: Supabase adresi ve anahtarı, kapatılmış dış servisler,');
  s.push('  kaldırılmış alan adı, "(Klon)" adı ve klona özel tarayıcı hafızası adları (ön ek). Çakışmada klonun hâli');
  s.push('  kazanır; geri kalan her şey asıldaki gibi olur. Asıldan gelen yeni hafıza anahtarlarına da klon ön ekini ver.');
  s.push('');
  s.push('## Yapılacaklar');
  s.push('1. Asıl depoyu ikinci uzak olarak ekle ve çek: `git remote add asil https://github.com/' + depoSlug(kaynak.repo) + '.git`');
  s.push('   (varsa geç), sonra `git fetch asil`.');
  s.push('2. Asılın ana dalını bu dala birleştir. Depo template\'ten açıldığı için geçmişler ilişkisiz olabilir;');
  s.push('   öyleyse asıldaki dosyaları tek tek karşılaştırıp farklı olanları buraya getir.');
  s.push('3. Asıldan gelen yeni kodda asıl programın izi (aşağıda) varsa onu da klon ayarına çevir.');
  s.push('4. Yeni göç (migration) dosyaları geldiyse yalnız listesini ver; SQL çalıştırma — veritabanını Studio yeniden kuracak.');
  s.push('5. Commit mesajı: `[KLON] Asıl programla eşitlendi` — push et.');
  s.push('');
  s.push('## Klonda kalmaması gereken izler');
  klonIzler(p).forEach(x => s.push('- `' + x + '`'));
  s.push('');
  s.push('Bitince kısa özet: kaç değişiklik geldi, hangi dosyalar, hangi klon ayarlarını korudun.');
  return s.join('\n');
}

/* ---------- Eylemler (data-eylem="klon-…") ---------- */

async function klonEylem(e, el) {
  if (e === 'klon-yeni') { klonKaynakSec(); return true; }
  const p = DB.proje(el.dataset.id);
  if (!p) return true;
  const kaynak = klonKaynak(p);
  const pl = p.palet || {};
  const kopyala = async (metin, mesaj) => {
    const ok = await panoyaKopyala(metin);
    toast(ok ? mesaj : 'Kopyalanamadı.', ok ? 'basari' : 'hata');
    return ok;
  };

  if (e === 'klon-ac-kapa') {
    const a = KLON.ac[p.id] = KLON.ac[p.id] || {};
    a[el.dataset.n] = el.dataset.ac !== 'true';
    render();
    return true;
  }
  if (e === 'klon-pano') { await kopyala(el.dataset.metin || '', 'Depo adı kopyalandı.'); return true; }
  if (!kaynak) { toast('Asıl proje bulunamadı.', 'hata'); return true; }

  if (e === 'klon-depo') {
    const giris = await metinSor({ baslik: 'Klonun GitHub deposu', aciklama: 'Az önce açtığın yeni deponun adresi.',
      deger: p.repo || '', yerTutucu: 'github.com/kullanici/depo-adi', buton: 'Kaydet' });
    if (giris === null || giris === undefined) return true;
    const slug = depoSlug(giris);
    if (!slug) { toast('Adres github.com/kullanici/depo biçiminde olmalı.', 'hata'); return true; }
    if (slug.toLowerCase() === depoSlug(kaynak.repo).toLowerCase()) {
      toast('⛔ Bu, asıl programın deposu. Klon ayrı bir depo olmalı.', 'hata'); return true;
    }
    await isYap(() => DB.projeGuncelle(p.id, { repo: 'github.com/' + slug }), 'Klonun deposu kaydedildi.');
    return true;
  }

  if (e === 'klon-supabase') { klonSupabasePenceresi(p, kaynak); return true; }

  if (e === 'klon-kaynak-yapi') {
    /* Nizam Security'nin yapı okuma penceresi — asıl proje için. */
    securityEylem('sec-yapi', { dataset: { id: kaynak.id } });
    return true;
  }

  if (e === 'klon-yapi-sql') {
    const ky = (SEC.kayit[kaynak.id] || {}).yapi;
    if (!ky || ky.nizam_security !== SEC_YAPI_SURUM) { toast('Önce asıl yapıyı oku.', 'hata'); return true; }
    const kaynakRef = secUretimRef(kaynak), klonRef = secRef(pl.supabaseUrl);
    if (!klonRef || klonRef === kaynakRef) { toast('⛔ Klonun Supabase\'i asılla aynı ya da eksik — durduruldu.', 'hata'); return true; }
    if (klonVeri(p).yapiKuruldu && !(await onaySor({ baslik: 'Klonun veritabanı baştan kurulsun mu?',
      mesaj: 'Klondaki bütün tablolar ve içlerindeki veriler silinip asılın güncel yapısıyla yeniden kurulur.', buton: 'Kopyala' }))) return true;
    await kopyala(klonKurulumSql(ky, p, kaynakRef, klonRef), 'Kurulum SQL\'i kopyalandı — KLONUN SQL Editor\'ünde çalıştır.');
    return true;
  }

  if (e === 'klon-yapi-tamam') {
    const ks = SEC.kayit[kaynak.id] || {};
    try {
      /* Klonun yapısı artık asılınkiyle aynı: Nizam Security kaydına da yaz (eşitleme
         karşılaştırması ve klonu Security'de taramak için). Erişim kuralları da taşınır. */
      const alan = { yapi: ks.yapi, yapi_tarihi: new Date().toISOString() };
      if (ks.model && !(SEC.kayit[p.id] || {}).model) Object.assign(alan, { model: ks.model, model_tarihi: ks.model_tarihi });
      SEC.kayit[p.id] = await SEC_VERI.kaydet(p.id, alan);
      await klonPaletYaz(p, { yapiKuruldu: new Date().toISOString(), yapiKaynakTarihi: ks.yapi_tarihi || null });
      toast('Klonun yapısı kuruldu olarak işaretlendi.', 'basari');
      render();
    } catch (h) { toast(h.message || String(h), 'hata'); }
    return true;
  }

  if (e === 'klon-kopar-prompt') { await kopyala(klonKoparPrompt(p), 'Prompt kopyalandı — klonun deposunda Claude Code\'a yapıştır.'); return true; }
  if (e === 'klon-kopar-tamam') {
    await isYap(() => klonPaletYaz(p, { koparildi: new Date().toISOString(), kontrol: null }), 'Tamam. Şimdi bağlantı kontrolünü yap.');
    return true;
  }
  if (e === 'klon-kontrol-prompt') { await kopyala(klonKontrolPrompt(p), 'Kontrol promptu kopyalandı.'); return true; }
  if (e === 'klon-kontrol-sonuc') {
    secYapistirPenceresi({
      baslik: 'Bağlantı kontrolü sonucu',
      aciklama: 'Claude\'un verdiği JSON\'u olduğu gibi yapıştır.',
      yerTutucu: '{ "nizam_klon_kontrol": "1", "temiz": true, "bulunanlar": [] }',
      dogrula: async metin => {
        const r = secJsonAl(metin);
        if (r.hata) return r;
        const j = r.json;
        if (j.nizam_klon_kontrol === undefined || typeof j.temiz !== 'boolean') return { hata: 'Bu, bağlantı kontrolü JSON\'u değil.' };
        const bulunanlar = Array.isArray(j.bulunanlar) ? j.bulunanlar.filter(x => x && typeof x === 'object').slice(0, 50)
          .map(x => ({ dosya: String(x.dosya || ''), satir: x.satir ? String(x.satir) : '', ne: String(x.ne || '') })) : [];
        if (j.hafiza_ayrik === false) bulunanlar.push({ dosya: 'tarayıcı hafızası', satir: '', ne: 'Hafıza adları klona özel değil — asılla ortak hafıza riski.' });
        const temiz = j.temiz && !bulunanlar.length;
        try {
          await klonPaletYaz(p, { kontrol: { temiz, tarih: new Date().toISOString(), bulunanlar } });
        } catch (h) { return { hata: h.message }; }
        toast(temiz ? 'Temiz ✓ Klon hazır.' : bulunanlar.length + ' iz bulundu — 4. adımı tekrarla.', temiz ? 'basari' : 'uyari');
        render();
        return null;
      },
    });
    return true;
  }
  if (e === 'klon-esitle-prompt') { await kopyala(klonEsitlePrompt(p), 'Eşitleme promptu kopyalandı — klonun deposunda Claude Code\'a ver.'); return true; }
  if (e === 'klon-esitle-tamam') {
    await isYap(() => klonPaletYaz(p, { kodEsitlendi: new Date().toISOString(), kontrol: null }),
      'Kod eşitlendi. Yapı farkı varsa yeniden kur, sonra bağlantı kontrolünü tekrarla.');
    return true;
  }
  return false;
}

function klonSupabasePenceresi(p, kaynak) {
  const pl = p.palet || {};
  modalAc(`
    ${modalBaslik(ICON.kopya, 'Klonun Supabase projesi', 'Yeni, boş bir proje. Asıl programın projesi değil. service_role istenmez.')}
    <label class="field"><span>Proje adresi</span>
      <input type="url" id="kl-url" placeholder="https://xxxx.supabase.co" value="${esc(pl.supabaseUrl || '')}" autocomplete="off"></label>
    <label class="field"><span>Publishable / anon anahtarı</span>
      <input type="text" id="kl-anahtar" placeholder="sb_publishable_…" value="${esc(pl.supabaseAnon || '')}" autocomplete="off"></label>
    <div class="sec-hata" id="kl-hata" hidden></div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-m="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-m="tamam" type="button"><span>Kaydet</span></button>
    </div>`, kutu => {
    const hata = $('#kl-hata', kutu);
    const goster = m => { hata.hidden = false; hata.textContent = m; };
    $('[data-m="iptal"]', kutu).addEventListener('click', () => modalKapat());
    $('[data-m="tamam"]', kutu).addEventListener('click', async () => {
      const url = $('#kl-url', kutu).value.trim().replace(/\/+$/, '');
      const anahtar = $('#kl-anahtar', kutu).value.trim();
      const ref = secRef(url);
      const studioRef = secRef((typeof SUPABASE !== 'undefined' && SUPABASE.url) || '');
      const testRef = SEC_TEST.sabit && SEC_TEST.sabit.test_ref;
      if (!ref) return goster('Adres https://<proje>.supabase.co biçiminde olmalı.');
      if (ref === secUretimRef(kaynak)) return goster('⛔ Bu adres ASIL programın veritabanı. Klon ayrı bir proje olmalı.');
      if (studioRef && ref === studioRef) return goster('⛔ Bu adres Nizam Studio\'nun kendi veritabanı.');
      if (testRef && ref === testRef) return goster('⛔ Bu adres Nizam Security\'nin test veritabanı. Klon için ayrı bir proje aç.');
      const diger = (DB.projeler || []).find(x => x.id !== p.id && !x.arsiv && secUretimRef(x) === ref);
      if (diger) return goster('⛔ Bu adres başka bir projede kayıtlı: ' + projeAdi(diger) + '.');
      const ah = secTestAnahtarHatasi(anahtar, ref);
      if (ah) return goster(ah);
      try {
        const yeni = Object.assign({}, p.palet || {}, { supabaseUrl: 'https://' + ref + '.supabase.co', supabaseAnon: anahtar });
        if (pl.supabaseUrl && secRef(pl.supabaseUrl) !== ref) {
          /* Veritabanı değişti: yapı ve kontrol yeniden yapılmalı. */
          yeni.klon = Object.assign({}, yeni.klon || {}, { yapiKuruldu: null, kontrol: null, koparildi: null });
        }
        await DB.paletKaydet(p.id, yeni);
        modalKapat();
        toast('Klonun Supabase bağlantısı kaydedildi.', 'basari');
        render();
      } catch (h) { goster(h.message || String(h)); }
    });
  });
}
