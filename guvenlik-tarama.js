/* ==========================================================================
   NIZAM Studio — Güvenlik kontrolü (v0.381.0)
   Eski Nizam Security denetim ekranlarının yerine. Onaylanan taslak:
   yapilanlar-gorseller/studio-esitleme-guvenlik-taslak.png (3).

   "Şimdi tara":
     1. Programın veritabanındaki ns_studio_guvenlik(anahtar) fonksiyonu
        (ana 498 · ME 498 · GK GK-130) yalnız KİLİT BİLGİSİNİ döndürür:
        kim hangi fonksiyonu çalıştırabilir, hangi tabloya kimin yetkisi var,
        satır kilidi (RLS) açık mı, dosya kovaları. Veri dönmez, hiçbir şey
        değişmez. Anahtar Etkileşim geçmişiyle aynı (etkilesim_kapilari).
     2. Programın yayındaki sitesi okunur: kodda gizli (service_role /
        sb_secret) anahtar var mı.
   Sonuç Studio'da guvenlik_taramalari'na yazılır (sql/57). "Bilerek açık"
   denen öğeler guvenlik_kabuller'de durur ve bir daha sorun sayılmaz.
   Proje durumundaki 🛡️ satırı (pdGuvenlik) buradan beslenir.
   ========================================================================== */
'use strict';

const GT = { durum: 'bos', son: {}, kabul: {}, calisan: {}, hata: '' };

/* Giriş öncesi çalışması GEREKEN fonksiyonlar: şifreli linkler (sipariş,
   kasa, sayım, kritik stok, yönetim, zam), kurulum sorusu, Studio kapısı. */
const GT_LINK = /^ns_(.*_link_.*|kisa_link_oku|kurulum_gerekli|kasa_notu_.*|rapor_not_.*|studio_ozet|studio_guvenlik)$/;

function gtYukle(zorla) {
  if (!AUTH.yonetici || !AUTH.db) return;
  if (!zorla && GT.durum !== 'bos') return;
  GT.durum = 'yukleniyor';
  Promise.all([
    AUTH.db.from('guvenlik_taramalari').select('*').order('zaman', { ascending: false }).limit(400),
    AUTH.db.from('guvenlik_kabuller').select('proje_id, anahtar'),
  ]).then(([t, k]) => {
    const hata = t.error || k.error;
    if (hata) {
      GT.durum = /guvenlik_taramalari|guvenlik_kabuller|schema cache|does not exist/i.test(hata.message || '') ? 'kurulmadi' : 'hata';
      GT.hata = hata.message || '';
    } else {
      GT.son = {}; GT.gecmis = {};
      (t.data || []).forEach(r => {
        if (!GT.son[r.proje_id]) GT.son[r.proje_id] = r;
        (GT.gecmis[r.proje_id] = GT.gecmis[r.proje_id] || []).push(r);
      });
      GT.kabul = {};
      (k.data || []).forEach(r => { (GT.kabul[r.proje_id] = GT.kabul[r.proje_id] || new Set()).add(r.anahtar); });
      GT.durum = 'tamam';
    }
    render();
  }, h => { GT.durum = 'hata'; GT.hata = String(h && h.message || h); render(); });
}

/* Kabul edilenler çıkarılınca bulgunun kalan öğeleri. */
function gtKalan(pid, b) {
  const kab = GT.kabul[pid];
  const og = b.ogeler || [];
  return kab ? og.filter(o => !kab.has(o.a)) : og;
}
/* Bulgular → { durum: temiz|bak|sorun, onemli, bak, ozet } */
function gtDegerlendir(pid, bulgular) {
  let onemli = 0, bak = 0;
  const yazilar = [];
  (bulgular || []).forEach(b => {
    if (b.onem === 'iyi') return;
    const n = b.ogeler && b.ogeler.length ? gtKalan(pid, b).length : 1;
    if (!n) return;
    if (b.onem === 'onemli') { onemli++; yazilar.push(b.kisa || b.baslik); } else bak++;
  });
  const durum = onemli ? 'sorun' : bak ? 'bak' : 'temiz';
  const ozet = onemli ? onemli + ' önemli sorun' + (yazilar.length ? ' · ' + yazilar.join(', ') : '')
    : bak ? bak + ' bakılacak nokta' : 'Sorun yok';
  return { durum, onemli, bak, ozet };
}

/* Proje durumundaki 🛡️ satırı. { s, kisa, yazi } · s = y | b | k | g */
function gtPdDurum(p) {
  if (!sunuculuMu(p)) return { s: 'g', kisa: '–', yazi: 'Veritabanı yok' };
  gtYukle();
  if (GT.durum === 'yukleniyor' || GT.durum === 'bos') return { s: 'g', kisa: '…', yazi: 'Okunuyor…' };
  if (GT.durum === 'kurulmadi') return { s: 'g', kisa: '–', yazi: 'Güvenlik kontrolü kurulmadı (Studio sql/57)' };
  if (GT.durum === 'hata') return { s: 'g', kisa: '?', yazi: 'Güvenlik bilgisi okunamadı' };
  const son = GT.son[p.id];
  const sqlNot = pdNotlar(p).find(n => n && n.sql);
  const sqlYazi = sqlNot ? 'Yeni SQL yazıldı (' + String(sqlNot.sql) + ')' : '';
  if (!son) return sqlNot ? { s: 'b', kisa: 'Tara', yazi: sqlYazi + ' · hiç taranmadı' } : { s: 'g', kisa: 'Hiç', yazi: 'Henüz taranmadı' };
  const d = gtDegerlendir(p.id, son.bulgular);
  if (d.durum === 'sorun') return { s: 'k', kisa: 'Sorun', yazi: d.ozet };
  const gun = String(son.zaman || '').slice(0, 10);
  if (sqlNot && sqlNot.tarih && String(sqlNot.tarih) > gun) return { s: 'b', kisa: 'Tara', yazi: sqlYazi + ' · tarama yapılmalı' };
  if (d.durum === 'bak') return { s: 'b', kisa: 'Bak', yazi: d.ozet + ' · son tarama ' + pdGunUzun(son.zaman) };
  return { s: 'y', kisa: 'Temiz', yazi: 'Son tarama ' + pdGunUzun(son.zaman) + ' · sorun yok' };
}

/* ---------- Tarama ---------- */
const GT_HAK = { s: 'okuma', i: 'ekleme', u: 'değiştirme', d: 'silme', t: 'tümünü silme' };
function gtHaklar(h) { return Object.keys(GT_HAK).filter(k => h && h[k]).map(k => GT_HAK[k]); }

function gtBulgular(v, sir, siteOkundu) {
  const B = [];
  const fns = v.fonksiyonlar || [], tbs = v.tablolar || [];
  const link = fns.filter(f => f.anon && GT_LINK.test(f.ad));
  const anonFn = fns.filter(f => f.anon && !GT_LINK.test(f.ad));
  if (anonFn.length) {
    const def = anonFn.filter(f => f.definer).length;
    B.push({ kod: 'anon_fn', onem: 'onemli', kisa: 'girişsiz fonksiyon',
      baslik: 'Girişsiz çalışan ' + anonFn.length + ' fonksiyon',
      aciklama: 'Giriş yapmamış biri bunları çağırabiliyor' + (def ? ' · ' + def + ' tanesi tam yetkiyle çalışıyor' : '') + '.',
      ogeler: anonFn.map(f => ({ a: 'fn:' + f.ad + '(' + (f.arg || '') + ')', y: f.ad + (f.definer ? ' · tam yetki' : '') })) });
  }
  const anonTb = tbs.filter(t => gtHaklar(t.anon).length);
  if (anonTb.length) {
    B.push({ kod: 'anon_tb', onem: 'onemli', kisa: 'girişsiz tablo',
      baslik: 'Giriş yapmadan erişilen ' + anonTb.length + ' tablo',
      aciklama: 'Giriş yapmamış birinin bu tablolarda yetkisi var.',
      ogeler: anonTb.map(t => ({ a: 'tb:' + t.ad, y: t.ad + ' · ' + gtHaklar(t.anon).join(', ') })) });
  }
  const rls = tbs.filter(t => /^[rp]$/.test(t.tur) && !t.rls && gtHaklar(t.giris).length);
  if (rls.length) {
    B.push({ kod: 'rls', onem: 'bak', baslik: 'Satır kilidi kapalı ' + rls.length + ' tablo',
      aciklama: 'Giriş yapan her kullanıcı (kasiyer dahil) bu tablolarda bütün satırlara ulaşır.',
      ogeler: rls.map(t => ({ a: 'rls:' + t.ad, y: t.ad + ' · ' + gtHaklar(t.giris).join(', ') })) });
  }
  const yol = fns.filter(f => f.definer && !f.yol && (f.anon || f.giris));
  if (yol.length) {
    B.push({ kod: 'yol', onem: 'bak', baslik: 'Güvenlik ayarı eksik ' + yol.length + ' fonksiyon',
      aciklama: 'Tam yetkiyle çalışan bu fonksiyonlarda arama yolu (search_path) sabit değil.',
      ogeler: yol.map(f => ({ a: 'yol:' + f.ad + '(' + (f.arg || '') + ')', y: f.ad })) });
  }
  const kova = (v.kovalar || []).filter(k => k.acik);
  if (kova.length) {
    B.push({ kod: 'kova', onem: 'bak', baslik: 'Herkese açık ' + kova.length + ' dosya kovası',
      aciklama: 'Adresi bilen herkes bu kovalardaki dosyaları indirebilir.',
      ogeler: kova.map(k => ({ a: 'kova:' + k.ad, y: k.ad })) });
  }
  if (sir.length) {
    B.push({ kod: 'sir', onem: 'onemli', kisa: 'kodda gizli anahtar',
      baslik: 'Sitede gizli anahtar var',
      aciklama: 'Yayındaki kodda tam yetkili bir anahtar görünüyor. Koddan çıkarılmalı ve Supabase\'de yenilenmeli.',
      ogeler: sir.map(x => ({ a: 'sir:' + x.dosya, y: x.dosya + ' · ' + x.tur })) });
  }
  /* İyi haberler */
  if (link.length) B.push({ kod: 'link', onem: 'iyi', baslik: link.length + ' link fonksiyonu girişsiz açık (bilerek · şifreli linkler)' });
  const tabloSay = tbs.filter(t => /^[rp]$/.test(t.tur)).length;
  if (!anonTb.length) B.push({ kod: 'tb_ok', onem: 'iyi', baslik: 'Giriş yapmadan hiçbir tabloya erişilemiyor (' + tabloSay + ' tablo)' });
  if (!rls.length) B.push({ kod: 'rls_ok', onem: 'iyi', baslik: 'Giriş yapanlar için kilitsiz tablo yok' });
  if (!kova.length) B.push({ kod: 'kova_ok', onem: 'iyi', baslik: v.kovalar ? 'Dosya kovaları herkese kapalı' : 'Dosya kovası yok' });
  if (!sir.length) B.push({ kod: 'sir_ok', onem: 'iyi', baslik: siteOkundu ? 'Sitede gizli anahtar yok (' + siteOkundu + ' dosya bakıldı)' : 'Site okunamadı · gizli anahtar kontrolü yapılamadı' });
  return B;
}

/* Yayındaki sitenin betiklerinde tam yetkili anahtar arar. */
async function gtSirTara(site) {
  if (!site) return { sir: [], sayi: 0 };
  const kok = site.replace(/\/?$/, '/');
  const kuyruk = ['index.html'], gorulen = new Set(kuyruk), sir = [];
  let sayi = 0;
  const jwt = /eyJ[A-Za-z0-9_-]{8,}\.(eyJ[A-Za-z0-9_-]{8,})\.[A-Za-z0-9_-]{8,}/g;
  const ekle = yol => {
    yol = yol.replace(/^\.\//, '').replace(/^\//, '').replace(/[?#].*$/, '');
    if (!yol || /^[a-z]+:/i.test(yol) || yol.includes('..') || gorulen.has(yol) || gorulen.size > 260) return;
    gorulen.add(yol); kuyruk.push(yol);
  };
  while (kuyruk.length) {
    const parca = kuyruk.splice(0, 8);
    await Promise.all(parca.map(async yol => {
      const t = await svGetir(kok + yol, false);
      if (!t) return;
      sayi++;
      let m;
      jwt.lastIndex = 0;
      while ((m = jwt.exec(t))) {
        try {
          const g = JSON.parse(atob(m[1].replace(/-/g, '+').replace(/_/g, '/')));
          if (g && g.role === 'service_role') sir.push({ dosya: yol, tur: 'service_role anahtarı' });
        } catch (h) { /* çözülmeyen dize anahtar değil */ }
      }
      if (/sb_secret_[A-Za-z0-9_-]{16,}/.test(t)) sir.push({ dosya: yol, tur: 'gizli (sb_secret) anahtar' });
      if (/\.html$/.test(yol)) {
        for (const s of t.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)) ekle(s[1]);
      }
      for (const s of t.matchAll(/["'`]((?:\.\/)?[0-9a-z_\-/.]+\.(?:js|html))(?:\?[^"'`]*)?["'`]/gi)) ekle(s[1]);
    }));
  }
  return { sir, sayi };
}

async function gtTara(p) {
  if (GT.calisan[p.id]) return;
  GT.calisan[p.id] = true; render();
  try {
    const { data: k, error } = await AUTH.db.from('etkilesim_kapilari').select('*').eq('proje_id', p.id).maybeSingle();
    if (error) throw new Error('Studio kapı tablosu okunamadı: ' + error.message);
    if (!k) throw new Error('Program Studio\'ya bağlı değil · önce proje sayfasında Etkileşim geçmişi → bağla (aynı anahtar).');
    const r = await fetch(k.adres + '/rest/v1/rpc/ns_studio_guvenlik', {
      method: 'POST',
      headers: { apikey: k.anon, Authorization: 'Bearer ' + k.anon, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_anahtar: k.anahtar }),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) {
      const msj = (j && (j.message || j.hint)) || ('HTTP ' + r.status);
      if (r.status === 404 || /could not find|does not exist|schema cache/i.test(msj))
        throw new Error('Programda tarama fonksiyonu yok · programın veritabanında güvenlik taraması SQL\'i (ana 498 / GK-130) çalıştırılmalı.');
      if (/anahtar/i.test(msj)) throw new Error('Studio anahtarı programda geçersiz · Etkileşim geçmişindeki anahtarı yenile.');
      throw new Error('Tarama okunamadı: ' + msj);
    }
    const site = pjYayinda(p) && pjAdresYazi(p) ? 'https://' + pjAdresYazi(p) + '/' : '';
    const { sir, sayi } = await gtSirTara(site);
    const bulgular = gtBulgular(j || {}, sir, sayi);
    const d = gtDegerlendir(p.id, bulgular);
    const { error: e2 } = await AUTH.db.from('guvenlik_taramalari').insert({ proje_id: p.id, durum: d.durum, ozet: d.ozet, bulgular });
    if (e2) throw new Error('Sonuç kaydedilemedi: ' + e2.message);
    toast(d.durum === 'temiz' ? 'Tarama bitti · sorun yok ✅' : 'Tarama bitti · ' + d.ozet, d.durum === 'sorun' ? 'uyari' : 'basari');
    GT.durum = 'bos'; gtYukle(true);
  } catch (h) {
    toast(h.message, 'hata');
  } finally {
    GT.calisan[p.id] = false; render();
  }
}

/* ---------- Düzelt talimatı ---------- */
const GT_COZUM = {
  anon_fn: 'Bu fonksiyonlardan giriş yapmamış kullanıcının (anon ve PUBLIC) çalıştırma yetkisini geri al: revoke execute on function … from public, anon. Giriş yapanların yetkisine dokunma.',
  anon_tb: 'Bu tablolardan giriş yapmamış kullanıcının (anon) bütün yetkilerini geri al: revoke all on … from anon.',
  rls: 'Satır kilidini aç (alter table … enable row level security) ve programın bugünkü davranışını koruyan politikaları yaz (giriş yapan kullanıcı kendi katmanına göre).',
  yol: 'Her fonksiyona sabit arama yolu ver: alter function …(argümanlar) set search_path = public, extensions.',
  kova: 'Kovayı herkese kapat (storage.buckets public = false); program dosyaları imzalı adresle almalı, gerekiyorsa kodu ona göre düzelt.',
  sir: 'Anahtarı koddan çıkar (gizli anahtar yalnız sunucu tarafında, Edge Function ortam değişkeninde durur). Supabase panelinde bu anahtar yenilenmeli; bunu kullanıcıya söyle.',
};
function gtDuzeltTalimati(p, b, ogeler) {
  const son = GT.son[p.id];
  return [
    `[Güvenlik] ${projeAdi(p)} · ${ogeler.length ? b.baslik.replace(/[0-9]+/, ogeler.length) : b.baslik}`,
    '',
    `NIZAM Studio güvenlik taraması (${son ? pzZaman(son.zaman) : 'bugün'}) şunu buldu: ${b.aciklama}`,
    '',
    'Liste:',
    ogeler.map(o => '- ' + o.y).join('\n'),
    '',
    'Yap:',
    '1. Bu depoda yeni bir veritabanı göçü yaz (sıradaki numara, CLAUDE.md\'deki kurala göre).',
    '2. ' + (GT_COZUM[b.kod] || 'Bulguyu kapat.'),
    '3. Programı bozma: giriş ekranı ve şifreli linkler (sipariş, kasa, sayım…) çalışmaya devam etmeli. Koddan çağrıldığı için açık kalması gereken bir öğe görürsen ona dokunma, bana söyle (Studio\'da "Bilerek açık" denir).',
    '4. Önce test veritabanında dene; canlı veritabanına uygulamadan önce yedek al ve onay iste.',
    '5. Sürüm notuna "sql" alanını yaz. Bitince Studio › Güvenlik › Şimdi tara.',
  ].join('\n');
}

/* ---------- Ekranlar ---------- */
function gtProjeleri() {
  return (DB.projeler || []).filter(p => !p.arsiv && sunuculuMu(p) && !(typeof klonMi === 'function' && klonMi(p))
    && !(typeof denemeMi === 'function' && denemeMi(p)));
}

function guvenlikTaramaEkrani() {
  if (!AUTH.yonetici) return '<div class="at-bos">Güvenlik kontrolü yalnız yöneticiye açık.</div>';
  if (typeof YUKLENIYOR !== 'undefined' && YUKLENIYOR) return iskeletler(3);
  gtYukle();
  const id = rota().id;
  if (id) {
    const p = DB.proje(id);
    return p ? gtProjeEkrani(p) : '<div class="at-bos">Proje bulunamadı.</div>';
  }
  const liste = gtProjeleri();
  return `<div class="gt">
    <div class="gt-ust"><h2>🛡️ Güvenlik kontrolü</h2><p>Programların kilitleri tek tuşla okunur. Tarama hiçbir şeyi değiştirmez.</p></div>
    ${GT.durum === 'kurulmadi' ? gtKurulumNotu() : ''}
    <div class="gt-kutu">${liste.length ? liste.map(p => {
      const d = gtPdDurum(p);
      return `<div class="gt-sat" data-eylem="gt-ac" data-id="${p.id}" role="button" tabindex="0">
        <span class="gt-ik ${d.s}">${d.s === 'k' ? '🔴' : d.s === 'b' ? '🟡' : d.s === 'y' ? '🟢' : '⚪'}</span>
        <span class="gt-yz"><b>${esc(projeAdi(p))}</b><i>${esc(d.yazi)}</i></span><span class="gt-sg">›</span></div>`;
    }).join('') : '<div class="at-bos ic">Veritabanı olan proje yok.</div>'}</div>
  </div>`;
}

function gtKurulumNotu() {
  return `<div class="gt-not">Sonuçların saklanması için Studio'nun Supabase'inde <b>sql/57-esitleme-guvenlik.sql</b> bir kez çalıştırılmalı.</div>`;
}

function gtProjeEkrani(p) {
  const son = GT.son[p.id];
  const calisiyor = !!GT.calisan[p.id];
  const tara = `<button type="button" class="sayfa-dug" data-eylem="gt-tara" data-id="${p.id}" ${calisiyor ? 'disabled' : ''}>
    ${calisiyor ? '⏳ Taranıyor…' : '🔍 Şimdi tara'}</button>`;
  const geri = `<a class="gt-geri" href="#/guvenlik">‹ Bütün projeler</a>`;
  if (GT.durum === 'kurulmadi') return `<div class="gt">${geri}<div class="gt-ust"><h2>🛡️ ${esc(projeAdi(p))}</h2></div>${gtKurulumNotu()}</div>`;
  if (GT.durum !== 'tamam') return `<div class="gt">${geri}${iskeletler(2)}</div>`;
  let govde;
  if (!son) {
    govde = `<div class="gt-buyuk g"><span class="em">⚪</span><span><b>Henüz taranmadı</b><i>İlk tarama 5–10 saniye sürer.</i></span></div>`;
  } else {
    const d = gtDegerlendir(p.id, son.bulgular);
    const sqlNot = pdNotlar(p).find(n => n && n.sql);
    const eski = sqlNot && sqlNot.tarih && String(sqlNot.tarih) > String(son.zaman).slice(0, 10);
    const buyuk = d.durum === 'sorun'
      ? `<div class="gt-buyuk k"><span class="em">🔴</span><span><b>${d.onemli} önemli sorun</b><i>Giriş yapmamış biri bunlara ulaşabiliyor</i></span></div>`
      : d.durum === 'bak' ? `<div class="gt-buyuk b"><span class="em">🟡</span><span><b>${d.bak} bakılacak nokta</b><i>Acil değil, ama düzeltilmesi iyi olur</i></span></div>`
      : `<div class="gt-buyuk y"><span class="em">🟢</span><span><b>Sorun yok</b><i>Giriş yapmamış biri hiçbir şeye ulaşamıyor</i></span></div>`;
    const kab = GT.kabul[p.id] || new Set();
    const bul = (son.bulgular || []).filter(b => b.onem !== 'iyi').map((b, i) => {
      const kalan = b.ogeler ? gtKalan(p.id, b) : [];
      const kabulEdilen = (b.ogeler || []).filter(o => kab.has(o.a));
      if (b.ogeler && !kalan.length) return '';
      const acik = GT_ACIK[p.id + ':' + b.kod];
      return `<div class="gt-bul">
        <div class="gt-bb"><span class="gt-cip ${b.onem === 'onemli' ? 'k' : 'b'}">${b.onem === 'onemli' ? 'Önemli' : 'Bak'}</span><b>${esc(b.ogeler ? b.baslik.replace(/\d+/, kalan.length) : b.baslik)}</b></div>
        <p>${esc(b.aciklama || '')}${kabulEdilen.length ? ` · ${kabulEdilen.length} öğe bilerek açık` : ''}</p>
        ${acik && kalan.length ? `<div class="gt-oge">${kalan.slice(0, 300).map(o => `<label><input type="checkbox" data-gt-sec="${esc(o.a)}"> ${esc(o.y)}</label>`).join('')}</div>` : ''}
        <div class="gt-ee">
          <button type="button" class="gt-hap a" data-eylem="gt-duzelt" data-id="${p.id}" data-deger="${i}">📋 Düzelt · talimat</button>
          ${b.ogeler ? `<button type="button" class="gt-hap" data-eylem="gt-liste" data-id="${p.id}" data-deger="${esc(b.kod)}">${acik ? 'Listeyi kapat' : 'Liste (' + kalan.length + ')'}</button>` : ''}
          ${acik && kalan.length ? `<button type="button" class="gt-hap" data-eylem="gt-kabul" data-id="${p.id}">Seçilenler bilerek açık</button>` : ''}
        </div></div>`;
    }).join('');
    const iyi = (son.bulgular || []).filter(b => b.onem === 'iyi').map(b => `<div class="gt-iyi">✅ ${esc(b.baslik)}</div>`).join('');
    govde = buyuk
      + (eski ? `<div class="gt-bul"><div class="gt-bb"><span class="gt-cip b">Bak</span><b>Yeni SQL taranmadı</b></div><p>${esc(String(sqlNot.sql))} yazıldıktan sonra tarama yapılmadı.</p></div>` : '')
      + bul
      + (iyi ? `<div class="yd-baslik2">Sorun yok</div>${iyi}` : '');
  }
  const gecmis = (GT.gecmis && GT.gecmis[p.id] || []).slice(1, 8);
  return `<div class="gt">${geri}
    <div class="gt-ust"><h2>🛡️ ${esc(projeAdi(p))}</h2><p>${son ? 'Son tarama ' + esc(pzZaman(son.zaman)) : 'Güvenlik kontrolü'}</p></div>
    ${govde}
    <div class="gt-dug">${tara}</div>
    <p class="gt-acik">Tarama programın veritabanını <b>yalnız okur</b>, hiçbir şey değiştirmez. Programda bir kez güvenlik taraması SQL'i (ana 498) ve Etkileşim bağlantısı gerekir.</p>
    ${gecmis.length ? `<div class="yd-baslik2">Önceki taramalar</div>` + gecmis.map(r => {
      const d = gtDegerlendir(p.id, r.bulgular);
      return `<div class="gt-gec"><span>${d.durum === 'sorun' ? '🔴' : d.durum === 'bak' ? '🟡' : '🟢'}</span><b>${esc(pzZaman(r.zaman))}</b><i>${esc(d.ozet)}</i></div>`;
    }).join('') : ''}
  </div>`;
}
const GT_ACIK = {};

/* Proje durağı (sıfırdan projelerde "Güvenlik kontrolü" adımı). */
function gtDurakOzeti(p) {
  const d = gtPdDurum(p);
  return `<div class="gt-durak ${d.s}"><span>${d.s === 'k' ? '🔴' : d.s === 'b' ? '🟡' : d.s === 'y' ? '🟢' : '⚪'}</span>
    <span><b>${esc(d.kisa === '–' ? 'Güvenlik' : d.yazi)}</b></span></div>
    <button class="sayfa-dug bitir" type="button" onclick="location.hash='#/guvenlik/${esc(p.id)}'">🛡️ Güvenlik kontrolünü aç</button>`;
}

/* ---------- Eylemler (app.js 'gt-' önekiyle buraya yollar) ---------- */
async function guvenlikTaramaEylem(e, el) {
  const p = el.dataset.id ? DB.proje(el.dataset.id) : null;
  if (e === 'gt-ac') { location.hash = '#/guvenlik/' + el.dataset.id; return true; }
  if (e === 'gt-tara') { if (p) await gtTara(p); return true; }
  if (e === 'gt-liste') { const k = el.dataset.id + ':' + el.dataset.deger; GT_ACIK[k] = !GT_ACIK[k]; render(); return true; }
  if (e === 'gt-duzelt') {
    const son = p && GT.son[p.id];
    const b = son && (son.bulgular || []).filter(x => x.onem !== 'iyi')[Number(el.dataset.deger)];
    if (!b) return true;
    const ogeler = b.ogeler ? gtKalan(p.id, b) : [];
    const ok = await panoyaKopyala(gtDuzeltTalimati(p, b, ogeler));
    toast(ok === false ? 'Panoya yazılamadı.' : 'Talimat kopyalandı · Claude Code\'da programın deposuna yapıştır ✨', ok === false ? 'hata' : 'basari');
    return true;
  }
  if (e === 'gt-kabul') {
    const sec = $$('[data-gt-sec]').filter(x => x.checked).map(x => x.dataset.gtSec);
    if (!sec.length) { toast('Önce listeden seç.', 'uyari'); return true; }
    if (!confirm(sec.length + ' öğe "bilerek açık" sayılsın mı? Bir daha sorun olarak görünmez.')) return true;
    const { error } = await AUTH.db.from('guvenlik_kabuller').upsert(sec.map(a => ({ proje_id: p.id, anahtar: a })));
    if (error) { toast('Kaydedilemedi: ' + error.message, 'hata'); return true; }
    toast('Kaydedildi.'); GT.durum = 'bos'; gtYukle(true); return true;
  }
  return false;
}
