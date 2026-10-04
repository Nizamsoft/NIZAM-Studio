/* ==========================================================================
   NIZAM Security — 3. aşama: Güvenlik Testleri (yalnız OKUMA / SELECT)

   Test kullanıcıları test projesine GERÇEK Supabase girişi yapar, her
   tabloyu kendi biletiyle okur; dönen veri Erişim Kuralları modeliyle
   karşılaştırılır. Karar HTTP durumuna göre değil, DÖNEN VERİYE göre verilir.

   Yalnız okur: Auth girişi (token) + /rest/v1 GET. INSERT/UPDATE/DELETE yok.
   Sahte JWT yok, rol taklidi yok.

   Veri haritası: test projesinde çalıştırılan salt-okur SQL'in çıktısı —
   her model tablosundan yalnız kayıt kimliği (k), sahibi (s), şubesi (g).
   "Hangi kayıt gerçekten var, kimin, hangi şubede?" sorusunun cevabı.

   Harita ve sonuçlar YALNIZ BELLEKTE (sayfa yenilenince gider).

   Production kilitleri:
     - Başlamadan: test ref ≠ production ref ≠ Studio ref; production
       bilinmiyorsa durur.
     - Her istek yalnız https://<test_ref>.supabase.co adresine gider.
     - Giriş biletinin (JWT) yayıncısı test projesi değilse durur.
     - Harita SQL'i secKilitSql ile başlar (Nizam test işareti yoksa durur).

   ESKİ GÜVENLİK SİSTEMİNDEN BAĞIMSIZ. security.js ve security-test.js'in
   verisini ve yardımcılarını kullanır, onların kodunu değiştirmez.

   Rota: #/security/<projeId>/testler   index.html'de security-test.js'ten sonra.
   ========================================================================== */

'use strict';

const SEC_HARITA_SURUM = '3';   // 2: çok kolonlu kimlik (k = a|b) · 3: şart kolonlarının değeri (v)
const SEC_HARITA_SINIR = 200;                       // tablo başına haritadaki en fazla satır
const SEC_SUBE_KOLON = /^(sube_id|şube_id|branch_id)$/i;   // yalnız açık isimler

const SEC_OKUMA = { harita: {}, sonuc: {}, ilerleme: {}, calisiyor: {}, filtre: {}, islem: {} };

const SEC_SONUC_AD = { gecti: '🟢 GEÇTİ', acik: '🔴 GÜVENLİK AÇIĞI', edilemedi: '🟡 TEST EDİLEMEDİ' };

/* ==========================================================================
   VERİ HARİTASI
   ========================================================================== */

/* Model tablosunun birincil anahtar kolonları, sahip ve şube kolonu.
   Birden fazla kolonlu anahtarda kimlik değerleri '|' ile birleştirilir. */
function secOkumaTabloBilgi(yapiTablo, modelTablo) {
  const pk = yapiTablo.kolonlar.filter(k => k.pk);
  const sube = yapiTablo.kolonlar.find(k => SEC_SUBE_KOLON.test(k.ad));
  return {
    ad: yapiTablo.ad,
    pk: pk.length ? pk.map(k => k.ad) : null,
    sahip: modelTablo.sahip_kolon || null,
    sube: sube ? sube.ad : null,
    sart: secSartKolonlari(modelTablo),
  };
}

/* Tablodaki şartlı satır kurallarının kullandığı kolonlar (haritada değerleri okunur). */
function secSartKolonlari(m) {
  const set = new Set();
  const ekle = sat => Object.values(sat || {}).forEach(d => { if (secSartMi(d)) set.add(d.kolon); });
  ekle(m.satir);
  m.kolonlar.forEach(c => ekle(c.satir));
  return [...set];
}

function secOkumaTablolar(yapi, model) {
  const yt = {};
  yapi.tablolar.forEach(t => { yt[t.ad] = t; });
  return model.tablolar.filter(t => yt[t.ad]).map(t => ({ m: t, b: secOkumaTabloBilgi(yt[t.ad], t) }));
}

/* Salt-okur harita SQL'i. Test projesinin SQL Editor'ünde çalışır. */
function secHaritaSql(projeId, yapi, model, ortam) {
  const kol = c => (c ? `x.${secQi(c)}::text` : 'null');
  const kimlik = pk => (pk ? (pk.length === 1 ? kol(pk[0]) : `concat_ws('|', ${pk.map(kol).join(', ')})`) : 'null');
  const parca = secOkumaTablolar(yapi, model).map(({ b }) =>
    `    json_build_object('ad', ${secQl(b.ad)}, 'satirlar', coalesce((select json_agg(json_build_object(`
    + `'k', ${kimlik(b.pk)}, 's', ${kol(b.sahip)}, 'g', ${kol(b.sube)}, 'v', `
    + (b.sart.length ? `json_build_object(${b.sart.map(c => secQl(c) + ', ' + kol(c)).join(', ')})` : 'null') + '))'
    + ` from (select * from public.${secQi(b.ad)} limit ${SEC_HARITA_SINIR}) x), '[]'::json))`);
  return [
    '-- NIZAM Security · Veri haritası (YALNIZ OKUR)',
    '-- YALNIZ TEST PROJESİNDE çalıştır: ' + ortam.test_ref + '.supabase.co',
    '-- Her tablodan yalnız kayıt kimliği, sahibi, şubesi ve şartlı kuralların kolonu okunur. Hiçbir şey yazılmaz.',
    '-- Nizam test ortamı işareti yoksa (production gibi) kendini durdurur.',
    secKilitSql(projeId, false),
    '',
    'select json_build_object(',
    `  'nizam_harita', '${SEC_HARITA_SURUM}',`,
    `  'proje', ${secQl(projeId)},`,
    "  'tablolar', json_build_array(",
    parca.join(',\n'),
    '  )',
    ') as harita;',
  ].join('\n');
}

function secHaritaOku(metin, projeId) {
  if (secGizliVar(metin)) return { hata: 'Çıktıda gizli bir anahtar var gibi görünüyor — kabul edilmedi.' };
  const r = secJsonAl(metin, 'harita');
  if (r.hata) return r;
  const j = r.json;
  if (j.nizam_harita && String(j.nizam_harita) !== SEC_HARITA_SURUM) return { hata: 'Harita SQL\'i güncellendi — "SQL\'i kopyala" ile yenisini al, test projesinde çalıştır.' };
  if (String(j.nizam_harita) !== SEC_HARITA_SURUM) return { hata: 'Bu, Nizam veri haritası SQL\'inin çıktısı değil.' };
  if (j.proje !== projeId) return { hata: 'Bu harita başka bir projeye ait.' };
  const s = x => (x === null || x === undefined ? null : String(x));
  const tablolar = {};
  (Array.isArray(j.tablolar) ? j.tablolar : []).forEach(t => {
    if (!t || !t.ad) return;
    tablolar[String(t.ad)] = (Array.isArray(t.satirlar) ? t.satirlar : [])
      .map(x => {
        const v = {};
        if (x.v && typeof x.v === 'object') Object.keys(x.v).forEach(c => { v[c] = s(x.v[c]); });
        return { k: s(x.k), s: s(x.s), g: s(x.g), v };
      });
  });
  return { harita: { tablolar, tarih: new Date().toISOString() } };
}

/* ==========================================================================
   KURAL → BEKLENTİ
   ========================================================================== */

/* Satır kuralını tanır: tum | kendi | yok | sube | sart | null (anlaşılmadı). */
function secKuralTur(d) {
  if (!d) return null;
  if (secSartMi(d)) return 'sart';
  if (d === 'tum' || d === 'kendi' || d === 'yok') return d;
  const t = String(d).toLocaleLowerCase('tr');
  if (/şube|sube|branch/.test(t)) return /kendi|aynı|ayni|bağlı|bagli/.test(t) ? 'sube' : null;
  if (/^tüm|^tum|^bütün|^butun|^hepsi/.test(t)) return 'tum';
  if (/^hiçbir|^hicbir|^yok$/.test(t)) return 'yok';
  if (/^kendi (satır|satir|kayd|kayıt)/.test(t)) return 'kendi';
  return null;
}

/* Bir kural bu satırı kapsıyor mu? {v: true|false|null, neden} */
function secKapsar(kural, satir, b, kisi) {
  const tur = secKuralTur(kural);
  if (!kural) return { v: null, neden: 'Modelde bu rol için satır kuralı yok' };
  if (!tur) return { v: null, neden: 'Bu kural serbest metin ("' + kural + '"); otomatik test için şartlı biçimde yazın' };
  if (tur === 'sart') {
    if (!satir.v || !(kural.kolon in satir.v)) return { v: null, neden: 'Haritada "' + kural.kolon + '" değeri yok — haritayı yeniden al' };
    const deger = satir.v[kural.kolon];
    if (deger === null) return { v: null, neden: 'Kaydın "' + kural.kolon + '" değeri boş' };
    if (kural.kosul === 'esit') return { v: deger === kural.deger };
    if (kural.kosul === 'esit_degil') return { v: deger !== kural.deger };
    if (kural.kosul === 'icinde') return { v: kural.deger.includes(deger) };
    if (kural.kosul === 'icinde_degil') return { v: !kural.deger.includes(deger) };
    return { v: null, neden: 'Bilinmeyen koşul: ' + kural.kosul };
  }
  if (tur === 'tum') return { v: true };
  if (tur === 'yok') return { v: false };
  if (tur === 'kendi') {
    if (!b.sahip) return { v: null, neden: '"Kendi satırı" kuralı var ama modelde sahip kolonu yok' };
    if (satir.s === null) return { v: null, neden: 'Kaydın sahibi boş' };
    return { v: satir.s === kisi.uid };
  }
  /* sube */
  if (!b.sube) return { v: null, neden: 'Tabloda güvenilir bir şube kolonu yok (sube_id / branch_id)' };
  if (!kisi.sube) return { v: null, neden: 'Kullanıcının şubesi veriden bulunamadı' };
  if (satir.g === null) return { v: null, neden: 'Kaydın şubesi boş' };
  return { v: satir.g === kisi.sube };
}

function secKolonBeklenen(m, c, rol, satir, b, kisi) {
  if (!c) return { v: null, neden: 'Modelde bu kolon için karar yok' };
  if (!(c.izin[rol] || []).includes('oku')) return { v: false };
  return secKapsar(c.satir[rol] || m.satir[rol], satir, b, kisi);
}

/* Satır görünmeli mi: okunabilen en az bir kolonu kapsıyorsa evet. */
function secSatirBeklenen(m, rol, satir, b, kisi) {
  let bilinmez = null;
  for (const c of m.kolonlar) {
    const r = secKolonBeklenen(m, c, rol, satir, b, kisi);
    if (r.v === true) return { v: true };
    if (r.v === null && !bilinmez) bilinmez = r;
  }
  return bilinmez || { v: false };
}

/* Kullanıcının şubesi: kendi satırlarındaki (sahibi o, ya da kimliği o)
   şube değeri. Birden fazla farklı değer çıkarsa belirsiz → null. */
function secKisiSube(harita, bilgiler, uid) {
  const bul = new Set();
  bilgiler.forEach(({ b }) => {
    if (!b.sube) return;
    (harita.tablolar[b.ad] || []).forEach(x => {
      if (x.g !== null && (x.s === uid || (b.pk && b.pk.length === 1 && x.k === uid))) bul.add(x.g);
    });
  });
  return bul.size === 1 ? [...bul][0] : null;
}

/* ==========================================================================
   İSTEKLER — yalnız test projesi, yalnız okuma
   ========================================================================== */

function secOkumaTaban(ortam) {
  const ref = secRef(ortam.test_url);
  if (!ref || ref !== ortam.test_ref) throw new Error('Test adresi kayıtlı test projesiyle uyuşmuyor — durduruldu.');
  return 'https://' + ref + '.supabase.co';
}

async function secOkumaGet(ortam, jeton, yol) {
  const r = await fetch(secOkumaTaban(ortam) + '/rest/v1/' + yol, {
    method: 'GET',
    /* jeton yoksa: giriş yapmamış ziyaretçi — yalnız herkese açık anahtar gider. */
    headers: Object.assign({ apikey: ortam.test_anahtar, Accept: 'application/json' },
      jeton ? { Authorization: 'Bearer ' + jeton } : {}),
  });
  let j = null;
  try { j = await r.json(); } catch (h) {}
  return { satirlar: Array.isArray(j) ? j : null, hata: Array.isArray(j) ? '' : String((j && (j.message || j.code)) || ('HTTP ' + r.status)) };
}

const secKolonAdi = c => (/^[a-z_][a-z0-9_]*$/.test(c) ? c : '"' + c.replace(/"/g, '') + '"');

/* Kullanıcının bu tablodan gerçekten okuyabildiği satırlar: pk → satır.
   select=* reddedilirse (kolon yetkisi) kolon kolon okunur. */
async function secTabloOku(ortam, jeton, b, m) {
  const tablo = encodeURIComponent(b.ad);
  const anahtar = x => (b.pk.every(c => x[c] !== undefined && x[c] !== null) ? b.pk.map(c => String(x[c])).join('|') : null);
  const pkSec = b.pk.map(secKolonAdi).join(',');
  const tum = await secOkumaGet(ortam, jeton, tablo + '?select=*&limit=1000');
  const gorunen = new Map();
  if (tum.satirlar) {
    tum.satirlar.forEach(x => { const a = anahtar(x); if (a !== null) gorunen.set(a, x); });
    return { gorunen, sayi: tum.satirlar.length };
  }
  /* Kimlik kolonları okunamıyorsa satırlar eşleştirilemez. */
  const pkOku = await secOkumaGet(ortam, jeton, tablo + '?select=' + encodeURIComponent(pkSec) + '&limit=1000');
  if (!pkOku.satirlar) return { hata: tum.hata, pkYok: /permission|denied|42501/i.test(pkOku.hata) };
  pkOku.satirlar.forEach(x => { const a = anahtar(x); if (a !== null) gorunen.set(a, Object.assign({}, x)); });
  for (const c of m.kolonlar) {
    if (b.pk.includes(c.ad)) continue;
    const r = await secOkumaGet(ortam, jeton, tablo + '?select='
      + encodeURIComponent(pkSec + ',' + secKolonAdi(c.ad)) + '&limit=1000');
    (r.satirlar || []).forEach(x => {
      const g = gorunen.get(anahtar(x));
      if (g && c.ad in x) g[c.ad] = x[c.ad];
    });
  }
  return { gorunen, sayi: pkOku.satirlar.length };
}

/* Gerçek Supabase Auth girişi. Bilet test projesinden gelmeli. */
async function secOkumaGiris(ortam, kisi) {
  secOkumaTaban(ortam);
  let g;
  try {
    g = await secTestIstek(ortam, 'token?grant_type=password', { email: kisi.eposta, password: kisi.sifre });
  } catch (h) { return { hata: 'Test projesine ulaşılamadı' }; }
  const j = g.j || {};
  if (!g.ok || !j.access_token) return { hata: 'Giriş yapılamadı: ' + String(j.msg || j.error_description || j.error_code || g.durum) };
  const govde = secJwtGovde(j.access_token) || {};
  if (String(govde.iss || '').indexOf('://' + ortam.test_ref + '.supabase.co') < 0) {
    return { dur: 'Giriş bileti test projesinden gelmedi (' + (govde.iss || '?') + ') — test durduruldu.' };
  }
  if (govde.role !== 'authenticated') return { hata: 'Bilet rolü beklenmedik: ' + (govde.role || '?') };
  return { jeton: j.access_token, uid: String(govde.sub || (j.user && j.user.id) || '') };
}

/* ==========================================================================
   TEST ÇALIŞTIRICI
   ========================================================================== */

function secUretimAyriMi(p, o) {
  const uretim = secUretimRef(p);
  const studio = secRef((typeof SUPABASE !== 'undefined' && SUPABASE.url) || '');
  if (!o || !o.test_ref) return 'Test projesi bağlı değil.';
  if (!uretim) return 'Production adresi Studio\'da kayıtlı değil — karşılaştırılamadığı için test durduruldu.';
  if (o.test_ref === uretim) return '⛔ Test projesi production ile AYNI — test durduruldu.';
  if (studio && o.test_ref === studio) return '⛔ Test projesi Studio\'nun kendi veritabanı — test durduruldu.';
  return '';
}

async function secOkumaCalistir(projeId) {
  const p = DB.proje(projeId);
  const k = SEC.kayit[projeId] || {};
  const o = SEC_TEST.kayit[projeId] || {};
  const harita = SEC_OKUMA.harita[projeId];
  const engel = secUretimAyriMi(p, o);
  if (engel) { toast(engel, 'hata'); return; }
  if (!k.yapi || !k.model || !harita) return;
  const kisiler = (o.kullanicilar || []).filter(x => x.eposta && x.sifre);
  if (!kisiler.length) { toast('Test kullanıcısı yok — önce Test Ortamı → 3. adım.', 'hata'); return; }

  const bilgiler = secOkumaTablolar(k.yapi, k.model);
  const sonuclar = [];
  /* Yüzde: hazırlık + girişler + (kişi + ziyaretçi) × tablo adımı. */
  let adim = 0;
  const toplam = 1 + kisiler.length * (1 + bilgiler.length) + bilgiler.length;
  const ilerle = (metin, kisi, tablo) => {
    SEC_OKUMA.ilerleme[projeId] = { metin, kisi, tablo, yuzde: Math.min(99, Math.floor(100 * adim++ / toplam)) };
    render();
  };
  SEC_OKUMA.calisiyor[projeId] = true;
  SEC_OKUMA.sonuc[projeId] = null;
  ilerle('Test hazırlanıyor…');

  try {
    /* Girişler önce: kimlikler (uid) şube ve "başka kullanıcı" seçimi için gerekli. */
    const oturum = [];
    for (const kisi of kisiler) {
      ilerle('Giriş yapılıyor…', kisi.etiket);
      const g = await secOkumaGiris(o, kisi);
      if (g.dur) { toast(g.dur, 'hata'); return; }
      oturum.push(Object.assign({ kisi }, g));
    }
    oturum.forEach(x => { if (x.uid) x.sube = secKisiSube(harita, bilgiler, x.uid); });

    for (const os of oturum) {
      const { kisi } = os;
      const temel = { kisi: kisi.etiket, rol: kisi.rol };
      if (!os.jeton) {
        sonuclar.push(Object.assign({}, temel, { tablo: '—', hedef: 'Giriş', tur: 'Giriş',
          beklenen: 'Giriş yapabilmeli', gercek: os.hata, sonuc: 'edilemedi' }));
        continue;
      }
      const ben = { uid: os.uid, sube: os.sube };
      const esler = oturum.filter(x => x !== os && x.uid).map(x => x.uid);
      for (const { m, b } of bilgiler) {
        ilerle('SELECT', kisi.etiket, b.ad);
        secTabloDegerlendir(sonuclar, temel, await secTabloOkuGuvenli(o, os.jeton, b, m),
          m, b, kisi.rol, ben, esler, harita.tablolar[b.ad] || []);
      }
    }
    /* Dış saldırı: giriş yapmadan, yalnız uygulamanın herkese açık anahtarıyla. */
    /* Modelde Ziyaretçi rolü varsa onun kurallarıyla (satır + kolon), yoksa
       "hiçbir şey görülmemeli" ile değerlendirilir. */
    const ziyaretciRol = k.model.roller.includes(SEC_ZIYARETCI_ROL);
    const anonJeton = /^eyJ/.test(o.test_anahtar || '') ? o.test_anahtar : null;
    for (const { m, b } of bilgiler) {
      ilerle('SELECT', SEC_ZIYARETCI, b.ad);
      if (ziyaretciRol) {
        const bz = Object.assign({}, b, { sahip: null, sube: null });   // "kendi"/şube yok
        secTabloDegerlendir(sonuclar, { kisi: SEC_ZIYARETCI, rol: SEC_ZIYARETCI_ROL },
          await secTabloOkuGuvenli(o, anonJeton, bz, m), m, bz, SEC_ZIYARETCI_ROL,
          { uid: null, sube: null }, [], harita.tablolar[b.ad] || []);
      } else {
        sonuclar.push(await secZiyaretciTest(o, b, harita.tablolar[b.ad] || []));
      }
    }
    SEC_OKUMA.sonuc[projeId] = { liste: sonuclar, tarih: new Date().toISOString() };
    const acik = sonuclar.filter(x => x.sonuc === 'acik').length;
    toast(acik ? acik + ' güvenlik açığı bulundu.' : 'Test bitti.', acik ? 'hata' : 'basari');
  } catch (h) {
    toast('Test durdu: ' + (h.message || h), 'hata');
  } finally {
    SEC_OKUMA.calisiyor[projeId] = false;
    SEC_OKUMA.ilerleme[projeId] = null;
    render();
  }
}

/* Giriş yapmamış ziyaretçi: modelde böyle bir rol yok, yani HİÇBİR kayıt
   görülmemeli. Dönen her satır açıktır (haritada olsun olmasın). */
const SEC_ZIYARETCI = 'Ziyaretçi (giriş yok)';

async function secZiyaretciTest(o, b, satirlar) {
  const temel = { kisi: SEC_ZIYARETCI, rol: 'Dış erişim', tablo: b.ad, hedef: 'Tüm kayıtlar', tur: 'Satır',
    beklenen: 'Giriş yapmadan görülmemeli' };
  /* Eski anon anahtarı (JWT) Authorization'da da gider; publishable anahtar yalnız apikey'de. */
  const jeton = /^eyJ/.test(o.test_anahtar || '') ? o.test_anahtar : null;
  let r;
  try { r = await secOkumaGet(o, jeton, encodeURIComponent(b.ad) + '?select=*&limit=1000'); }
  catch (h) { return Object.assign(temel, { gercek: 'Okuma hatası: ' + (h.message || h), sonuc: 'edilemedi' }); }
  if (r.satirlar && r.satirlar.length) {
    return Object.assign(temel, { gercek: r.satirlar.length + ' kayıt görüldü', sonuc: 'acik' });
  }
  const reddedildi = !r.satirlar && /permission|denied|42501|401|JWT/i.test(r.hata);
  if (!r.satirlar && !reddedildi) return Object.assign(temel, { gercek: 'Okuma hatası: ' + r.hata, sonuc: 'edilemedi' });
  /* Boş tabloda "hiçbir şey dönmedi" bir şey kanıtlamaz. */
  if (!satirlar.length) return Object.assign(temel, { gercek: 'Tabloda test verisi yok', sonuc: 'edilemedi' });
  return Object.assign(temel, { gercek: reddedildi ? 'Erişim reddedildi' : 'Hiçbiri görülmedi', sonuc: 'gecti' });
}

async function secTabloOkuGuvenli(o, jeton, b, m) {
  if (!b.pk) return { hata: 'Tabloda birincil anahtar yok', pkYok: true };
  try { return await secTabloOku(o, jeton, b, m); }
  catch (h) { return { hata: h.message || String(h) }; }
}

/* Bir kullanıcı × tablo için hedef kayıtları seçer ve testleri üretir. */
function secTabloDegerlendir(sonuclar, temel, okuma, m, b, rol, ben, esler, satirlar) {
  const ekle = x => sonuclar.push(Object.assign({}, temel, { tablo: b.ad }, x));
  const edilemedi = (hedef, neden) => ekle({ hedef, tur: 'Satır', beklenen: '—', gercek: neden, sonuc: 'edilemedi' });

  if (!satirlar.length) return edilemedi('—', 'Haritada bu tabloda test verisi yok');
  if (!b.pk) return edilemedi('—', 'Tabloda birincil anahtar yok — kayıtlar eşleştirilemez');
  if (okuma.hata && okuma.pkYok) {
    /* Kimlik bile okunamıyorsa hiçbir satır dönmüyor demektir; satır görünmemeliyse bu geçer. */
    const hepsiYasak = satirlar.every(x => secSatirBeklenen(m, rol, x, b, ben).v === false);
    return hepsiYasak
      ? ekle({ hedef: 'Tüm kayıtlar', tur: 'Satır', beklenen: 'Görülememeli', gercek: 'Görülemedi', sonuc: 'gecti' })
      : edilemedi('Tüm kayıtlar', 'Okuma reddedildi: ' + okuma.hata);
  }
  if (okuma.hata) return edilemedi('—', 'Okuma hatası: ' + okuma.hata);

  /* Rolün tablo kuralı şartlıysa: şarta uyan / uymayan iki grup. */
  if (secKuralTur(m.satir[rol]) === 'sart') return secSartTest(ekle, okuma, m, b, rol, ben, satirlar);

  /* Hedefler: tablonun yapısına göre gerekenler. */
  const hedefler = [];
  const kullanildi = new Set();
  /* Kullanılmamış kayıt öncelikli; yoksa aynı kayıt başka bir hedef için de kullanılır. */
  const sec = (ad, bul, gerekli) => {
    const x = satirlar.find(s => !kullanildi.has(s.k) && bul(s)) || satirlar.find(bul);
    if (x) { kullanildi.add(x.k); hedefler.push({ ad, satir: x }); }
    else if (gerekli) edilemedi(ad, 'Haritada uygun kayıt yok');
  };
  if (b.sahip) {
    if (!ben.uid) edilemedi('Kendi kaydı', 'Kullanıcı kimliği alınamadı');
    else {
      sec('Kendi kaydı', s => s.s === ben.uid, true);
      /* Önce başka bir test kullanıcısının kaydı; yoksa herhangi bir başkasınınki. */
      sec('Başka kullanıcının kaydı', s => s.s !== null && s.s !== ben.uid && esler.includes(s.s), false);
      if (!hedefler.some(h => h.ad === 'Başka kullanıcının kaydı')) {
        sec('Başka kullanıcının kaydı', s => s.s !== null && s.s !== ben.uid, true);
      }
    }
  }
  /* Şube testi yalnız bu rolün kuralında şube geçiyorsa (ör. "Kendi şubesinin
     satırları"). "Tüm satırlar" gibi kurallarda kullanıcının şubesi aranmaz. */
  const subeKurali = [m.satir[rol]].concat(m.kolonlar.map(c => c.satir[rol]))
    .some(d => secKuralTur(d) === 'sube');
  if (b.sube && subeKurali) {
    if (!ben.sube) edilemedi('Başka şubenin kaydı', 'Kullanıcının şubesi veriden bulunamadı');
    else {
      sec('Kendi şubesinin kaydı', s => s.g === ben.sube, false);
      sec('Başka şubenin kaydı', s => s.g !== null && s.g !== ben.sube, true);
    }
  }
  if (!b.sahip && !(b.sube && subeKurali)) sec('Bir kayıt', () => true, true);

  hedefler.forEach(h => secHedefTest(ekle, okuma, m, b, rol, ben, h));

  /* Geri kalan kayıtlar: görmemesi gerekip gördüğü var mı (sızıntı taraması). */
  const kalan = satirlar.filter(s => !kullanildi.has(s.k));
  if (kalan.length) {
    const sizan = kalan.filter(s => okuma.gorunen.has(s.k) && secSatirBeklenen(m, rol, s, b, ben).v === false);
    const bilinmez = kalan.filter(s => secSatirBeklenen(m, rol, s, b, ben).v === null);
    if (sizan.length) {
      ekle({ hedef: 'Diğer ' + kalan.length + ' kayıt', tur: 'Satır', beklenen: 'Görmemesi gereken kayıt görülmemeli',
        gercek: sizan.length + ' kayıt görüldü', sonuc: 'acik' });
    } else if (bilinmez.length === kalan.length) {
      ekle({ hedef: 'Diğer ' + kalan.length + ' kayıt', tur: 'Satır', beklenen: '—',
        gercek: secSatirBeklenen(m, rol, kalan[0], b, ben).neden, sonuc: 'edilemedi' });
    } else {
      ekle({ hedef: 'Diğer ' + kalan.length + ' kayıt', tur: 'Satır', beklenen: 'Görmemesi gereken kayıt görülmemeli',
        gercek: 'Hiçbiri görülmedi', sonuc: 'gecti' });
    }
  }
}

/* Bir hedef kayıt: önce SATIR testi, satır döndüyse KOLON testleri. */
function secHedefTest(ekle, okuma, m, b, rol, ben, h) {
  const bek = secSatirBeklenen(m, rol, h.satir, b, ben);
  const veri = okuma.gorunen.get(h.satir.k);
  const geldi = !!veri;
  const satir = { hedef: h.ad, tur: 'Satır', kolon: '' };
  if (bek.v === null) ekle(Object.assign(satir, { beklenen: '—', gercek: bek.neden + (geldi ? ' · satır döndü' : ''), sonuc: 'edilemedi' }));
  else if (bek.v && geldi) ekle(Object.assign(satir, { beklenen: 'Görülmeli', gercek: 'Görüldü', sonuc: 'gecti' }));
  else if (!bek.v && !geldi) ekle(Object.assign(satir, { beklenen: 'Görülememeli', gercek: 'Görülemedi', sonuc: 'gecti' }));
  else if (!bek.v && geldi) ekle(Object.assign(satir, { beklenen: 'Görülememeli', gercek: 'Görüldü', sonuc: 'acik' }));
  else ekle(Object.assign(satir, { beklenen: 'Görülmeli', gercek: 'Görülemedi — erişim fazla kısıtlı', sonuc: 'edilemedi' }));
  /* Kolon testi yalnız görülmesi gereken ve gerçekten dönen satırda. Görülmemesi
     gereken satır döndüyse o SATIR açığıdır; kolonlarını ayrıca saymıyoruz. */
  if (!geldi || bek.v !== true) return;

  secKolonTest(ekle, veri, m, b, rol, ben, h.satir, h.ad);
}

/* Görülmesi gereken ve dönen bir satırda kolon testleri:
   yasak olanlar tek tek; izinliler ve belirsizler toplu. */
function secKolonTest(ekle, veri, m, b, rol, ben, satir, hedef) {
  const izinli = [], eksik = [], belirsiz = [];
  m.kolonlar.forEach(c => {
    const r = secKolonBeklenen(m, c, rol, satir, b, ben);
    const var_ = c.ad in veri;
    const ortak = { hedef, tur: 'Kolon', kolon: c.ad };
    if (r.v === false) {
      ekle(Object.assign(ortak, var_
        ? { beklenen: 'Görülememeli', gercek: 'Görüldü', sonuc: 'acik' }
        : { beklenen: 'Görülememeli', gercek: 'Görülemedi', sonuc: 'gecti' }));
    } else if (r.v === true) { izinli.push(c.ad); if (!var_) eksik.push(c.ad); }
    else belirsiz.push(c.ad + (var_ ? ' (döndü)' : ''));
  });
  const toplu = { hedef, tur: 'Kolon' };
  if (izinli.length) {
    ekle(Object.assign({}, toplu, { kolon: 'izinli ' + izinli.length + ' kolon', beklenen: 'Görülmeli',
      gercek: eksik.length ? 'Görülemedi: ' + eksik.join(', ') + ' — erişim fazla kısıtlı' : 'Hepsi görüldü',
      sonuc: eksik.length ? 'edilemedi' : 'gecti' }));
  }
  if (belirsiz.length) {
    ekle(Object.assign({}, toplu, { kolon: belirsiz.length + ' kolon', beklenen: '—',
      gercek: 'Kural anlaşılamadı: ' + belirsiz.join(', '), sonuc: 'edilemedi' }));
  }
}

/* Şartlı satır kuralı: bütün kayıtlar şarta göre iki gruba ayrılır.
   Uyanlar görülmeli (rolün okuma izni varsa), uymayanlar görülmemeli. */
function secSartTest(ekle, okuma, m, b, rol, ben, satirlar) {
  const kural = m.satir[rol];
  const uyan = [], uymayan = [], bos = [];
  satirlar.forEach(x => {
    const r = secKapsar(kural, x, b, ben);
    (r.v === true ? uyan : r.v === false ? uymayan : bos).push(x);
  });
  const sart = secSatirAd(kural);

  if (!uyan.length) ekle({ hedef: 'Şarta uyan kayıt', tur: 'Satır', beklenen: sart, gercek: 'Haritada şarta uyan kayıt yok — test verisine ekle', sonuc: 'edilemedi' });
  else {
    const gorulmeli = uyan.filter(x => secSatirBeklenen(m, rol, x, b, ben).v === true);
    const yasak = uyan.filter(x => secSatirBeklenen(m, rol, x, b, ben).v === false);
    const sizan = yasak.filter(x => okuma.gorunen.has(x.k));
    const gelen = gorulmeli.filter(x => okuma.gorunen.has(x.k));
    const hedef = 'Şarta uyan ' + uyan.length + ' kayıt';
    if (sizan.length) ekle({ hedef, tur: 'Satır', beklenen: 'Görülememeli (okuma izni yok)', gercek: sizan.length + ' kayıt görüldü', sonuc: 'acik' });
    else if (gelen.length === gorulmeli.length) {
      ekle({ hedef, tur: 'Satır', beklenen: gorulmeli.length ? 'Görülmeli' : 'Görülememeli (okuma izni yok)',
        gercek: gorulmeli.length ? gelen.length + ' / ' + gorulmeli.length + ' görüldü' : 'Görülemedi', sonuc: 'gecti' });
    } else {
      ekle({ hedef, tur: 'Satır', beklenen: 'Görülmeli', gercek: gelen.length + ' / ' + gorulmeli.length + ' görüldü — erişim fazla kısıtlı', sonuc: 'edilemedi' });
    }
    /* Kolon testi: şarta uyan, dönen ilk kayıtta. */
    const ornek = gelen[0];
    if (ornek) secKolonTest(ekle, okuma.gorunen.get(ornek.k), m, b, rol, ben, ornek, hedef);
  }

  if (!uymayan.length) ekle({ hedef: 'Şarta uymayan kayıt', tur: 'Satır', beklenen: sart, gercek: 'Haritada şarta uymayan kayıt yok — test verisine ekle', sonuc: 'edilemedi' });
  else {
    const sizan = uymayan.filter(x => okuma.gorunen.has(x.k) && secSatirBeklenen(m, rol, x, b, ben).v === false);
    ekle({ hedef: 'Şarta uymayan ' + uymayan.length + ' kayıt', tur: 'Satır', beklenen: 'Görülememeli',
      gercek: sizan.length ? sizan.length + ' kayıt görüldü' : 'Hiçbiri görülmedi', sonuc: sizan.length ? 'acik' : 'gecti' });
  }

  if (bos.length) {
    ekle({ hedef: bos.length + ' kayıt', tur: 'Satır', beklenen: sart,
      gercek: secKapsar(kural, bos[0], b, ben).neden, sonuc: 'edilemedi' });
  }
}

/* ==========================================================================
   EKRAN
   ========================================================================== */

function secOkumaEkran(projeId) {
  const p = DB.proje(projeId);
  if (!p) return `<div class="card">${empty(ICON.uyari, 'Proje bulunamadı', '')}</div>`;
  if (SEC.kayit[projeId] === undefined) {
    secYukle('kayit-' + projeId, async () => { SEC.kayit[projeId] = await SEC_VERI.getir(projeId); });
    return iskeletler(3);
  }
  if (SEC_TEST.kayit[projeId] === undefined) {
    secYukle('test-' + projeId, async () => { SEC_TEST.kayit[projeId] = await SEC_TEST_VERI.getir(projeId); });
    return iskeletler(3);
  }
  const k = SEC.kayit[projeId] || {};
  const o = SEC_TEST.kayit[projeId] || {};
  const ust = `
    <a class="tl-geri" href="#/security">${svg(ICON.chevron, 14)} Nizam Security</a>
    <div class="pj-tepe"><div class="pj-tepe-yz">
      <h1>${esc(basHarfleriBuyuk(projeAdi(p)))}</h1>
      <p>Güvenlik Testleri · test kullanıcılarıyla gerçek okuma (SELECT) denemesi</p>
    </div></div>
    ${secSekmeler(projeId, 'testler')}`;

  if (!k.yapi || !k.model) {
    return ust + `<div class="card">${empty(ICON.gGuvenlik, 'Önce Erişim Kuralları',
      'Testler, Erişim Kuralları modelinden üretilir.')}</div>`;
  }
  const kisiler = (o.kullanicilar || []).filter(x => x.kimlik);
  if (!o.test_ref || !kisiler.length) {
    return ust + `<div class="card">${empty(ICON.gGuvenlik, 'Önce Test Ortamı',
      'Test projesini bağla, kurulumu yap, test kullanıcılarını ve sentetik veriyi oluştur.')}</div>`;
  }

  const engel = secUretimAyriMi(p, o);
  const harita = SEC_OKUMA.harita[projeId];
  const calisiyor = !!SEC_OKUMA.calisiyor[projeId];
  const yaziyor = typeof SEC_YAZMA !== 'undefined' && !!SEC_YAZMA.calisiyor[projeId];   // security-yazma.js
  const dug = (yazi, eylem, ana = false, kapali = false) =>
    `<button class="sec-dug${ana ? ' ana' : ''}" type="button" data-eylem="${eylem}" data-id="${esc(projeId)}"
       ${kapali ? 'disabled' : ''}>${esc(yazi)}</button>`;

  const satirSay = harita ? Object.values(harita.tablolar).reduce((n, x) => n + x.length, 0) : 0;
  const haritaKart = `
    <div class="sec-t-kart${harita ? ' bitti' : ''}">
      <div class="sec-t-ku"><span class="sec-no">1</span><b>Veri haritası</b>
        <em>${harita ? '✓ ' + Object.keys(harita.tablolar).length + ' tablo · ' + satirSay + ' kayıt' : 'Bekliyor'}</em></div>
      <p class="sec-t-not">Test projesinde hangi kayıtların var olduğunu, kime ve hangi şubeye ait olduğunu
        okur. Yalnız okur; hiçbir şey yazmaz. Sayfa yenilenince yeniden yapıştır.</p>
      <div class="sec-t-dg">
        ${dug('SQL\'i kopyala', 'sec-o-harita-kopya', false, !!engel)}
        ${dug('Sonucu yapıştır', 'sec-o-harita', !harita, !!engel)}
        <span class="sec-t-ipucu">TEST projesinin SQL Editor'ünde çalıştır</span>
      </div>
    </div>`;

  const baslatKart = `
    <div class="sec-t-kart">
      <div class="sec-t-ku"><span class="sec-no">2</span><b>Güvenlik Testleri</b><em>${kisiler.length} test kullanıcısı + ziyaretçi · SELECT</em></div>
      <p class="sec-t-not">Her test kullanıcısı test projesine kendi e-posta ve şifresiyle giriş yapar,
        tabloları okur. Ardından giriş yapmamış bir ziyaretçi gibi, yalnız herkese açık anahtarla
        okumayı dener. Görmemesi gereken veriyi görürse güvenlik açığıdır.</p>
      <div class="sec-t-dg">${dug(calisiyor ? 'Test çalışıyor…' : 'Testi Başlat', 'sec-o-baslat', true, !harita || calisiyor || yaziyor || !!engel)}</div>
    </div>`;

  const il = SEC_OKUMA.ilerleme[projeId];
  const ilerleme = calisiyor && il ? `
    <div class="sec-t-durum">
      <span class="sec-t-emoji">⏳</span>
      <span class="sec-t-durum-yz"><b>${esc(il.metin)}</b>
        <i>${il.kisi ? 'Test kullanıcısı: ' + esc(il.kisi) : ''}${il.tablo ? ' · Tablo: ' + esc(il.tablo) + ' · İşlem: SELECT' : ''}</i></span>
    </div>${typeof secIlerlemeCubugu === 'function' ? secIlerlemeCubugu(il.yuzde) : ''}` : '';

  const kalkan = `
    <div class="sec-t-durum">
      <span class="sec-t-emoji">${engel ? '⛔' : '🛡️'}</span>
      <span class="sec-t-durum-yz"><b>${engel ? esc(engel) : 'Yalnız test projesinde çalışır'}</b>
        <i>Production: ${esc(secKisalt(secUretimRef(p) || '?', 4, 4))} ≠ Test: ${esc(secKisalt(o.test_ref, 4, 4))}</i></span>
    </div>`;

  return ust + kalkan + `<div class="sec-t-izgara">${haritaKart}${baslatKart}${typeof secYazmaKart === 'function' ? secYazmaKart(projeId, engel) : ''}</div>` + ilerleme + secOkumaSonuclar(projeId);
}

function secOkumaSonuclar(projeId) {
  const s = SEC_OKUMA.sonuc[projeId];
  const y = typeof SEC_YAZMA !== 'undefined' ? SEC_YAZMA.sonuc[projeId] : null;   // security-yazma.js
  if (!s && !y) return '';
  const islemi = x => x.islem || 'SELECT';
  const islemF = SEC_OKUMA.islem[projeId] || 'hepsi';
  const bildir = typeof secHataRaporu === 'function'
    ? [].concat(s ? s.liste : [], y ? y.liste : []).filter(x => x.sonuc !== 'gecti').length : 0;
  const liste = [].concat(s ? s.liste : [], y ? y.liste : []).filter(x => islemF === 'hepsi' || islemi(x) === islemF);
  const tarih = [s && s.tarih, y && y.tarih].filter(Boolean).sort().pop();
  const say = t => liste.filter(x => x.sonuc === t).length;
  const filtre = SEC_OKUMA.filtre[projeId] || 'hepsi';
  const sira = { acik: 0, edilemedi: 1, gecti: 2 };
  const gorunen = liste.filter(x => filtre === 'hepsi' || x.sonuc === filtre)
    .slice().sort((a, b) => sira[a.sonuc] - sira[b.sonuc]);
  const f = (ad, deger) => `<button class="sec-dug${filtre === deger ? ' ana' : ''}" type="button"
      data-eylem="sec-o-filtre" data-id="${esc(projeId)}" data-f="${deger}">${ad}</button>`;
  const fi = (ad, deger) => `<button class="sec-dug${islemF === deger ? ' ana' : ''}" type="button"
      data-eylem="sec-o-islem" data-id="${esc(projeId)}" data-f="${deger}">${ad}</button>`;

  const kartlar = gorunen.map(x => `
    <div class="sec-o-sonuc ${x.sonuc}">
      <div class="sec-o-ust"><b>${esc(x.kisi)}</b><i>${esc(x.rol)}</i><span>${SEC_SONUC_AD[x.sonuc]}</span></div>
      <div class="sec-o-hedef"><code>${esc(x.tablo + (x.kolon && !/ kolon$/.test(x.kolon) ? '.' + x.kolon : ''))}</code>
        ${x.tur === 'Kolon' && / kolon$/.test(x.kolon) ? ' · ' + esc(x.kolon) : ''}
        · ${esc(islemi(x))} · ${esc(x.hedef)} · <em>${esc(x.tur)} testi</em></div>
      <div class="sec-o-bg"><span>Beklenen: <b>${esc(x.beklenen)}</b></span><span>Gerçek: <b>${esc(x.gercek || '—')}</b></span></div>
    </div>`).join('');

  return `
    <h3 class="sec-bas">Sonuç · ${esc(secTarih(tarih))}</h3>
    <div class="sec-o-ozet">
      <span>Toplam <b>${liste.length}</b></span>
      <span>🟢 Geçti <b>${say('gecti')}</b></span>
      <span>🔴 Açık <b>${say('acik')}</b></span>
      <span>🟡 Test edilemedi <b>${say('edilemedi')}</b></span>
    </div>
    ${bildir ? `<div class="sec-t-dg sec-o-filtre">
      <button class="sec-dug ana" type="button" data-eylem="sec-o-y-rapor" data-id="${esc(projeId)}">📋 Hataları bildir (${bildir})</button>
      <span class="sec-t-ipucu">🔴 ve 🟡 sonuçlar projenin Claude sohbeti için kopyalanır</span>
    </div>` : ''}
    ${y ? `<div class="sec-t-dg sec-o-filtre">
      ${fi('Tümü', 'hepsi')}${fi('Okuma', 'SELECT')}${fi('Ekleme', 'INSERT')}${fi('Değiştirme', 'UPDATE')}${fi('Silme', 'DELETE')}
    </div>` : ''}
    <div class="sec-t-dg sec-o-filtre">
      ${f('Hepsi', 'hepsi')}${f('🟢 Geçti', 'gecti')}${f('🔴 Açık', 'acik')}${f('🟡 Edilemedi', 'edilemedi')}
    </div>
    <div class="sec-o-liste">${kartlar || '<p class="sec-t-not">Bu filtrede sonuç yok.</p>'}</div>`;
}

/* ==========================================================================
   EYLEMLER (data-eylem="sec-o-…")
   ========================================================================== */

async function secOkumaEylem(e, el) {
  const projeId = el.dataset.id;
  const p = DB.proje(projeId);
  const k = SEC.kayit[projeId] || {};
  const o = SEC_TEST.kayit[projeId] || {};

  if (e.indexOf('sec-o-y-') === 0) return secYazmaEylem(e, el);   // security-yazma.js
  if (e === 'sec-o-filtre') { SEC_OKUMA.filtre[projeId] = el.dataset.f; render(); return true; }
  if (e === 'sec-o-islem') { SEC_OKUMA.islem[projeId] = el.dataset.f; render(); return true; }

  const engel = secUretimAyriMi(p, o);
  if (engel) { toast(engel, 'hata'); return true; }
  if (!k.yapi || !k.model) return true;

  if (e === 'sec-o-harita-kopya') {
    const ok = await panoyaKopyala(secHaritaSql(projeId, k.yapi, k.model, o));
    toast(ok ? 'Harita SQL\'i kopyalandı — TEST projesinin SQL Editor\'ünde çalıştır.' : 'Kopyalanamadı.', ok ? 'basari' : 'hata');
    return true;
  }

  if (e === 'sec-o-harita') {
    secYapistirPenceresi({
      baslik: 'Veri haritası',
      aciklama: 'Harita SQL\'inin test projesindeki çıktısını yapıştır. Yalnız bellekte tutulur.',
      yerTutucu: '{"nizam_harita":"1", …}',
      dogrula: async metin => {
        const r = secHaritaOku(metin, projeId);
        if (r.hata) return r;
        SEC_OKUMA.harita[projeId] = r.harita;
        SEC_OKUMA.sonuc[projeId] = null;
        toast('Veri haritası alındı.', 'basari');
        render();
        return null;
      },
    });
    return true;
  }

  if (e === 'sec-o-baslat') {
    if (SEC_OKUMA.calisiyor[projeId] || (typeof SEC_YAZMA !== 'undefined' && SEC_YAZMA.calisiyor[projeId])) return true;
    await secOkumaCalistir(projeId);
    return true;
  }
  return false;
}
