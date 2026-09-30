/* ==========================================================================
   NIZAM | Security — Ekranlar (Faz 6)

   Yeni #/guvenlik akışı. MOTOR YENİDEN YAZILMADI: manifest/scan/doğrulama/
   matris/canlı tarama için Faz 2-5 fonksiyonları ve mevcut kartlar aynen
   kullanılıyor. Bu dosya yalnız ekran, gezinme ve veri gösterimi.

   Rotalar (rota() → key='guvenlik', id, durak):
     #/guvenlik                     → ana (hedef listesi)
     #/guvenlik/<projeId>           → hedef detay
     #/guvenlik/<projeId>/denetim   → yeni denetim akışı (mevcut kartlar)
     #/guvenlik/<projeId>/gecmis    → denetim geçmişi
     #/guvenlik/<projeId>/bulgular  → bulgular
   index.html'de app.js'ten sonra yükleniyor.
   ========================================================================== */

'use strict';

/* Ekran verisi önbelleği — async DB okumaları buraya düşer, sonra render. */
const GUV_EKRAN = {
  hedefler: null, yukleniyor: {}, denetimler: {}, bulgular: {},
  acikDenetim: null, seciliBulgu: null, bulguFiltre: 'hepsi',
};

/* Bir yükleyiciyi bir kez çalıştırır, bitince ekranı tazeler. */
function guvEkranYukle(anahtar, isFn) {
  if (GUV_EKRAN.yukleniyor[anahtar]) return;
  GUV_EKRAN.yukleniyor[anahtar] = true;
  Promise.resolve().then(isFn).catch(h => { toast('Yüklenemedi: ' + (h.message || h), 'hata'); })
    .finally(() => { GUV_EKRAN.yukleniyor[anahtar] = false; render(); });
}

/* Server-backed (Supabase'li) NIZAM projeleri — güvenlik hedefi adayları. */
function guvEkranProjeler() {
  return (DB.projeler || []).filter(p => !cekirdekMi(p) && sunuculuMu(p));
}

/* Bir projeye bağlı hedef (varsa) — hedefler yüklüyse bellekten. */
function guvEkranHedef(projeId) {
  return (GUV_EKRAN.hedefler || []).find(h => h.proje_id === projeId) || null;
}

/* ---------- Ana ekran ---------- */
function guvenlikAnaEkran() {
  if (!AUTH.yonetici) {
    return `<div class="card">${empty(ICON.gGuvenlik, 'Bu ekran yöneticiye ait',
      'Güvenliği yalnızca yönetici görebilir.')}</div>`;
  }
  const r = rota();
  if (r.id && r.durak === 'denetim') return guvenlikDenetimEkran(r.id);
  if (r.id && r.durak === 'gecmis')  return guvenlikGecmisEkran(r.id);
  if (r.id && r.durak === 'bulgular') return guvenlikBulgularEkran(r.id);
  if (r.id) return guvenlikHedefDetay(r.id);

  if (GUV_EKRAN.hedefler === null) {
    guvEkranYukle('hedefler', async () => { GUV_EKRAN.hedefler = await GUVENLIK_VERI.hedefleriGetir(); });
    return iskeletler(3);
  }
  const projeler = guvEkranProjeler();
  const kartlar = projeler.map(p => {
    const h = guvEkranHedef(p.id);
    const o = h && h.son_denetim_id ? null : null; // özet denetim detayında
    return `
      <a class="lk" href="#/guvenlik/${esc(p.id)}">
        <span class="lk-ikon">${svg(ICON.gGuvenlik, 26)}</span>
        <span class="lk-yz">
          <b>${esc(basHarfleriBuyuk(projeAdi(p)))}</b>
          <i>${esc(p.firma || '')}${p.platform ? ' · ' + esc(p.platform) : ''}</i>
          <em>${h ? (h.son_denetim_id ? 'Denetlendi' : 'Hedef hazır, denetim yok') : 'Henüz denetlenmedi'}</em>
        </span>
        <span class="lk-ok">${svg(ICON.chevron, 18)}</span>
      </a>`;
  }).join('');
  return `
    <div class="pj-tepe"><div class="pj-tepe-yz">
      <h1>Güvenlik</h1>
      <p>Programların güvenlik denetimi. Bir hedef seç, denetim başlat.</p>
    </div></div>
    ${projeler.length ? `<div class="lk-liste">${kartlar}</div>`
      : `<div class="card">${empty(ICON.gGuvenlik, 'Sunuculu proje yok',
          'Güvenlik denetimi Supabase bağlı projelerde yapılır.')}</div>`}
    <p class="ipucu" style="margin-top:14px">Eski güvenlik ekranı:
      <a href="#/guvenlik-eski">#/guvenlik-eski</a></p>`;
}

/* ---------- Hedef detay ---------- */
function guvenlikHedefDetay(projeId) {
  const p = DB.proje(projeId);
  if (!p) return `<div class="card">${empty(ICON.uyari, 'Proje bulunamadı', '')}</div>`;
  if (GUV_EKRAN.hedefler === null) {
    guvEkranYukle('hedefler', async () => { GUV_EKRAN.hedefler = await GUVENLIK_VERI.hedefleriGetir(); });
    return iskeletler(3);
  }
  const h = guvEkranHedef(projeId);
  const g = durakGuvenlikDurum(projeId);
  const man = g.manifest;
  const bilgi = (etiket, deger) => `<div class="kur-deger duz"><b style="color:var(--ink-soft)">${esc(etiket)}:</b> ${esc(deger)}</div>`;
  return `
    <a class="tl-geri" href="#/guvenlik">${svg(ICON.chevron, 14)} Güvenlik</a>
    <div class="pj-tepe"><div class="pj-tepe-yz">
      <h1>${esc(basHarfleriBuyuk(projeAdi(p)))}</h1>
      <p>${esc(p.firma || '')}${p.platform ? ' · ' + esc(p.platform) : ''}</p>
    </div></div>
    <div class="btk">
      <div class="btk-ust"><span class="btk-ik mavi">${svg(ICON.gGuvenlik, 22)}</span>
        <span class="btk-yz"><b>Durum</b><i>${h ? 'Hedef kayıtlı' : 'Henüz hedef kaydı yok — ilk denetimde oluşur'}</i></span></div>
      ${bilgi('Uygulama tipi', (man && man.govde && guvenlikProgramOzeti(man)) || (h && h.uygulama_tipi) || '—')}
      ${bilgi('Son manifest commit', (man && man.commit) || '—')}
    </div>
    <button class="sayfa-dug bitir" type="button" onclick="location.hash='#/guvenlik/${esc(projeId)}/denetim'">
      ${svg(ICON.gGuvenlik, 16)} Yeni Denetim Başlat</button>
    <button class="sayfa-dug ikincil" type="button" onclick="location.hash='#/guvenlik/${esc(projeId)}/gecmis'">
      ${svg(ICON.saat, 15)} Denetim Geçmişi</button>
    <button class="sayfa-dug ikincil" type="button" onclick="location.hash='#/guvenlik/${esc(projeId)}/bulgular'">
      ${svg(ICON.bayrak, 15)} Bulgular</button>`;
}

/* ---------- Yeni denetim akışı (mevcut kartlar) ---------- */
function guvenlikDenetimEkran(projeId) {
  const p = DB.proje(projeId);
  if (!p) return `<div class="card">${empty(ICON.uyari, 'Proje bulunamadı', '')}</div>`;
  const g = durakGuvenlikDurum(projeId);
  return `
    <a class="tl-geri" href="#/guvenlik/${esc(projeId)}">${svg(ICON.chevron, 14)} ${esc(basHarfleriBuyuk(projeAdi(p)))}</a>
    <div class="pj-tepe"><div class="pj-tepe-yz">
      <h1>Yeni Denetim</h1>
      <p>Sırayla: kod denetimi → manifest → veritabanı doğrulama → test matrisi → canlı tarama → kaydet.</p>
    </div></div>
    ${guvenlikKodKarti(g.kod, projeId)}
    ${guvenlikManifestKarti(g.manifest, projeId)}
    ${guvenlikProgramNotu(g.kod)}
    ${guvenlikDogrulamaKarti(g, projeId)}
    ${guvenlikMatrisKarti(g, projeId)}
    ${guvenlikTaramaKarti(g, projeId)}`;
}

/* ---------- Denetim geçmişi ---------- */
function guvenlikGecmisEkran(projeId) {
  const p = DB.proje(projeId);
  const h = guvEkranHedef(projeId);
  if (GUV_EKRAN.hedefler === null) {
    guvEkranYukle('hedefler', async () => { GUV_EKRAN.hedefler = await GUVENLIK_VERI.hedefleriGetir(); });
    return iskeletler(3);
  }
  if (!h) return guvenlikBosGecmis(projeId, p);
  if (!(h.id in GUV_EKRAN.denetimler)) {
    guvEkranYukle('den-' + h.id, async () => { GUV_EKRAN.denetimler[h.id] = await GUVENLIK_VERI.denetimGecmisi(h.id); });
    return iskeletler(3);
  }
  /* Bir denetim açıldıysa onun snapshot'ını göster. */
  if (GUV_EKRAN.acikDenetim) return guvenlikDenetimSnapshot(projeId, p);

  const liste = GUV_EKRAN.denetimler[h.id] || [];
  const satirlar = liste.map(d => {
    const o = d.ozet || {};
    return `<a class="lk" href="#" data-eylem="guv-denetim-ac" data-id="${esc(d.id)}">
      <span class="lk-ikon ${o.acik ? '' : ''}">${svg(ICON.gGuvenlik, 24)}</span>
      <span class="lk-yz"><b>Denetim #${String(d.no).padStart(3, '0')}</b>
        <i>${esc(tarihYaz(d.olusturuldu))}</i>
        <em>${(o.toplam || 0)} test · ${(o.acik || 0)} açık · ${(o.kritik || 0)} kritik · ${(o.yuksek || 0)} yüksek · ${(o.dogrulanamadi || 0)} ölçülemedi · ${(o.aktif_gerekli || 0)} aktif test gerekli</em></span>
      <span class="lk-ok">${svg(ICON.chevron, 18)}</span></a>`;
  }).join('');
  return `
    <a class="tl-geri" href="#/guvenlik/${esc(projeId)}">${svg(ICON.chevron, 14)} ${esc(p ? basHarfleriBuyuk(projeAdi(p)) : 'Hedef')}</a>
    <div class="pj-tepe"><div class="pj-tepe-yz"><h1>Denetim Geçmişi</h1>
      <p>Her denetim değişmez bir anlık görüntüdür.</p></div></div>
    ${liste.length ? `<div class="lk-liste">${satirlar}</div>`
      : `<div class="card">${empty(ICON.saat, 'Denetim yok', 'Bu hedefte henüz denetim kaydı yok.')}</div>`}`;
}

function guvenlikBosGecmis(projeId, p) {
  return `<a class="tl-geri" href="#/guvenlik/${esc(projeId)}">${svg(ICON.chevron, 14)} ${esc(p ? basHarfleriBuyuk(projeAdi(p)) : 'Hedef')}</a>
    <div class="card">${empty(ICON.saat, 'Denetim yok', 'Bu hedefte henüz denetim kaydı yok.')}</div>`;
}

function guvenlikDenetimSnapshot(projeId, p) {
  const d = GUV_EKRAN.acikDenetim;
  const sonuc = Array.isArray(d.sonuclar) ? d.sonuclar : [];
  /* Snapshot'ı tarama sonuç tablosuyla aynı biçimde göster (yeniden hesap yok). */
  const tablo = guvenlikTaramaTablosu({ sonuclar: sonuc, ozet: d.ozet || {} });
  return `
    <a class="tl-geri" href="#" data-eylem="guv-denetim-kapat">${svg(ICON.chevron, 14)} Geçmiş</a>
    <div class="pj-tepe"><div class="pj-tepe-yz"><h1>Denetim #${String(d.no).padStart(3, '0')}</h1>
      <p>${esc(tarihYaz(d.olusturuldu))} · değişmez anlık görüntü</p></div></div>
    ${tablo || `<div class="card">${empty(ICON.gGuvenlik, 'Sonuç yok', '')}</div>`}`;
}

/* ---------- Bulgular ---------- */
function guvenlikBulgularEkran(projeId) {
  const p = DB.proje(projeId);
  const h = guvEkranHedef(projeId);
  if (GUV_EKRAN.hedefler === null) {
    guvEkranYukle('hedefler', async () => { GUV_EKRAN.hedefler = await GUVENLIK_VERI.hedefleriGetir(); });
    return iskeletler(3);
  }
  if (!h) return `<a class="tl-geri" href="#/guvenlik/${esc(projeId)}">${svg(ICON.chevron, 14)} Geri</a>
    <div class="card">${empty(ICON.bayrak, 'Bulgu yok', 'Bu hedefte henüz bulgu yok.')}</div>`;
  if (!(h.id in GUV_EKRAN.bulgular)) {
    guvEkranYukle('bul-' + h.id, async () => { GUV_EKRAN.bulgular[h.id] = await GUVENLIK_VERI.bulgulariGetir(h.id); });
    return iskeletler(3);
  }
  if (GUV_EKRAN.seciliBulgu) return guvenlikBulguDetay(projeId, h);

  let liste = GUV_EKRAN.bulgular[h.id] || [];
  const f = GUV_EKRAN.bulguFiltre;
  if (f === 'acik') liste = liste.filter(b => b.son_durum === 'ACIK');
  else if (f === 'kapali') liste = liste.filter(b => b.son_durum !== 'ACIK');
  const onemRenk = { kritik: 'var(--red)', yuksek: '#b8801a', orta: 'var(--ink-soft)', dusuk: 'var(--ink-dim)' };
  const filtreBtn = (deger, ad) => `<button class="pj-arac tekil ${f === deger ? '' : ''}" type="button"
      data-eylem="guv-bulgu-filtre" data-deger="${deger}"
      style="${f === deger ? 'border-color:var(--ink-strong);color:var(--ink-strong)' : ''};width:auto;padding:0 14px">${esc(ad)}</button>`;
  const satirlar = liste.map(b => `
    <a class="lk" href="#" data-eylem="guv-bulgu-ac" data-imza="${esc(b.imza)}">
      <span class="lk-ikon" style="background:color-mix(in srgb, ${onemRenk[b.onem] || 'var(--ink-soft)'} 14%, #fff);color:${onemRenk[b.onem] || 'var(--ink-soft)'}">${svg(ICON.bayrak, 24)}</span>
      <span class="lk-yz"><b>${esc(b.baslik || b.imza)}</b>
        <i>${esc((b.onem || '').toUpperCase())} · ${esc(b.kategori || '')} · ${esc(b.son_durum || '')}</i>
        <em>İlk: ${esc(tarihYaz(b.ilk_gorulme))} · Son: ${esc(tarihYaz(b.son_gorulme))}</em></span>
      <span class="lk-ok">${svg(ICON.chevron, 18)}</span></a>`).join('');
  return `
    <a class="tl-geri" href="#/guvenlik/${esc(projeId)}">${svg(ICON.chevron, 14)} ${esc(p ? basHarfleriBuyuk(projeAdi(p)) : 'Hedef')}</a>
    <div class="pj-tepe"><div class="pj-tepe-yz"><h1>Bulgular</h1>
      <p>Aynı açık her denetimde tek kayıt olarak izlenir.</p></div></div>
    <div class="pj-araclar" style="gap:8px">${filtreBtn('hepsi', 'Hepsi')}${filtreBtn('acik', 'Açık')}${filtreBtn('kapali', 'Kapalı')}</div>
    ${liste.length ? `<div class="lk-liste">${satirlar}</div>`
      : `<div class="card">${empty(ICON.bayrak, 'Bulgu yok', 'Bu filtrede bulgu yok.')}</div>`}`;
}

function guvenlikBulguDetay(projeId, h) {
  const b = (GUV_EKRAN.bulgular[h.id] || []).find(x => x.imza === GUV_EKRAN.seciliBulgu);
  if (!b) { GUV_EKRAN.seciliBulgu = null; return guvenlikBulgularEkran(projeId); }
  const parca = String(b.imza).split(':');   // hedef:kategori:varlik:islem:kapsam
  const bilgi = (etiket, deger) => `<div class="tl-bolum"><dt>${esc(etiket)}</dt><dd>${esc(deger || '—')}</dd></div>`;
  return `
    <a class="tl-geri" href="#" data-eylem="guv-bulgu-kapat">${svg(ICON.chevron, 14)} Bulgular</a>
    <div class="tl-tepe"><h1>${esc(b.baslik || 'Bulgu')}</h1>
      <p>${esc((b.onem || '').toUpperCase())} · ${esc(b.son_durum || '')} · ${esc(b.duzeltme_durumu || '')}</p></div>
    <div class="tl-kutu">
      ${bilgi('Kategori', b.kategori)}
      ${bilgi('Varlık', parca[2])}
      ${bilgi('İşlem', parca[3])}
      ${bilgi('Kapsam', parca[4])}
      ${bilgi('İmza', b.imza)}
      ${bilgi('İlk görülme', tarihYaz(b.ilk_gorulme))}
      ${bilgi('Son görülme', tarihYaz(b.son_gorulme))}
      ${b.claude_gorevi ? bilgi('Claude görevi', b.claude_gorevi) : ''}
    </div>
    <button class="sayfa-dug" type="button" data-eylem="guv-bulgu-duzelt" data-proje="${esc(projeId)}" data-imza="${esc(b.imza)}">
      ${svg(ICON.kopya, 15)} Düzeltme Promptu Oluştur</button>
    <button class="sayfa-dug ikincil" type="button" data-eylem="guv-bulgu-karar" data-hedef="${esc(h.id)}" data-imza="${esc(b.imza)}">
      ${svg(ICON.tik, 15)} Bilerek Böyle / Risk Kabul</button>`;
}

/* ---------- Ekran eylemleri (app.js dispatcher'dan çağrılır) ---------- */
async function guvenlikEkranEylem(e, el) {
  if (e === 'guv-denetim-ac') {
    const id = el.dataset.id;
    GUV_EKRAN.acikDenetim = await GUVENLIK_VERI.denetimGetir(id);
    render(); return true;
  }
  if (e === 'guv-denetim-kapat') { GUV_EKRAN.acikDenetim = null; render(); return true; }
  if (e === 'guv-bulgu-filtre') { GUV_EKRAN.bulguFiltre = el.dataset.deger; render(); return true; }
  if (e === 'guv-bulgu-ac')    { GUV_EKRAN.seciliBulgu = el.dataset.imza; render(); return true; }
  if (e === 'guv-bulgu-kapat') { GUV_EKRAN.seciliBulgu = null; render(); return true; }

  if (e === 'guv-bulgu-duzelt') {
    /* Mevcut düzeltme promptunu kullan; bulguyu tek satır olarak ver. */
    const parca = String(el.dataset.imza).split(':');
    const satir = [{ kim: parca[1] || 'ic', deneme: parca[2] + ' · ' + parca[3] + ' · ' + parca[4],
      sonuc: 'AÇIK', ayrinti: '' }];
    const metin = PROMPT.guvenlikDuzelt(el.dataset.proje || '', satir);
    const ok = await panoyaKopyala(metin);
    toast(ok ? 'Düzeltme promptu kopyalandı — Claude Code\'a yapıştır.' : 'Kopyalanamadı.', ok ? 'basari' : 'hata');
    return true;
  }

  if (e === 'guv-bulgu-karar') {
    const gerekce = await metinSor({ baslik: 'Bilerek böyle / Risk kabul',
      aciklama: 'Bu bulgunun neden kabul edildiğini yaz. Kim ve ne zaman bilgisi otomatik eklenir.',
      yerTutucu: 'Örn. kayıt olma bu üründe bilinçli olarak açık.', cok: true, buton: 'Kararı kaydet' });
    if (!gerekce) return true;
    try {
      const h = guvEkranHedef(el.closest ? null : null) || (GUV_EKRAN.hedefler || []).find(x => x.id === el.dataset.hedef);
      const commit = (durakGuvenlikDurum((h && h.proje_id) || '').manifest || {}).commit || '';
      await GUVENLIK_VERI.kararOlustur({ hedefId: el.dataset.hedef, imza: el.dataset.imza,
        karar: 'bilerek', gerekce, gecerliCommit: commit });
      toast('Karar kaydedildi.', 'basari');
    } catch (err) { toast('Karar kaydedilemedi: ' + err.message, 'hata'); }
    return true;
  }
  return false;
}
