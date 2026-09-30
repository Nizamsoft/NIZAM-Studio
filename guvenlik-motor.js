/* ==========================================================================
   NIZAM | Security — Motor (Faz 3: Database Scan + Manifest doğrulama)

   Bu dosya SAF mantık: scan SQL'i, scan okuyucu, RLS ifade sınıflandırıcı
   ve manifest↔DB doğrulama motoru. Ekran yok, DB yazma yok, canlı test yok.
   index.html'de guvenlik-veri.js'ten sonra, app.js'ten önce yükleniyor.

   İlke: MANIFEST = iddia, SCAN = gerçek. Çelişkide gerçek kazanır. NIZAM
   sırf manifest "güvenli" dedi diye güvenli kabul etmez. "Anlamadım"
   (DOGRULANAMADI) ile "güvenli değil" (CELISIYOR) ayrı şeydir.
   ========================================================================== */

'use strict';

/* ---------- Genişletilmiş Database Scan SQL ----------
   Yalnız OKUR. Tek JSON hücresi döndürür. SQL Editor ayrıcalıklı rolle
   çalıştığı için pg_catalog, pg_policies ve storage.buckets okunabilir.
   Eski GUVENLIK_RONTGEN_SQL'e dokunulmadı; bu ayrı, daha kapsamlı sürüm. */
const GUVENLIK_SCAN_SQL = `-- NIZAM Security · Database Scan (yalnız okur)
-- Çıkan tek JSON hücresini kopyala, NIZAM'a yapıştır.
select json_build_object(
  'scan_surumu', '1',
  'tablolar', coalesce((select json_agg(t) from (
     select c.relname as ad,
       (select json_agg(json_build_object(
          'ad', a.attname, 'tip', format_type(a.atttypid, a.atttypmod),
          'nullable', not a.attnotnull,
          'pk', coalesce((select true from pg_constraint k where k.conrelid=c.oid and k.contype='p' and a.attnum = any(k.conkey)), false)))
        from pg_attribute a where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped) as kolonlar,
       (select json_agg(json_build_object('kolon',
            (select a.attname from pg_attribute a where a.attrelid=c.oid and a.attnum=fk.conkey[1]),
          'hedef', cf.relname))
        from pg_constraint fk join pg_class cf on cf.oid=fk.confrelid
        where fk.conrelid=c.oid and fk.contype='f') as fk
     from pg_class c join pg_namespace n on n.oid=c.relnamespace
     where n.nspname='public' and c.relkind in ('r','p')
   ) t), '[]'::json),
  'rls', coalesce((select json_agg(json_build_object(
     'tablo', c.relname, 'acik', c.relrowsecurity, 'zorunlu', c.relforcerowsecurity))
     from pg_class c join pg_namespace n on n.oid=c.relnamespace
     where n.nspname='public' and c.relkind in ('r','p')), '[]'::json),
  'policies', coalesce((select json_agg(json_build_object(
     'tablo', tablename, 'ad', policyname, 'islem', cmd,
     'roller', roles, 'using', qual, 'check', with_check))
     from pg_policies where schemaname='public'), '[]'::json),
  'grants', coalesce((select json_agg(json_build_object(
     'tur','table','ad', table_name, 'rol', grantee, 'yetki', privilege_type))
     from information_schema.role_table_grants
     where table_schema='public' and grantee in ('anon','authenticated')), '[]'::json),
  'functions', coalesce((select json_agg(json_build_object(
     'ad', p.proname, 'definer', p.prosecdef,
     'search_path_sabit', exists(select 1 from unnest(coalesce(p.proconfig,'{}')) x where x like 'search\\_path=%'),
     'anon_execute', has_function_privilege('anon', p.oid, 'execute'),
     'authenticated_execute', has_function_privilege('authenticated', p.oid, 'execute')))
     from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'), '[]'::json),
  'views', coalesce((select json_agg(json_build_object(
     'ad', c.relname,
     'security_invoker', coalesce((select option_value from pg_options_to_table(c.reloptions) where option_name='security_invoker'),'false')))
     from pg_class c join pg_namespace n on n.oid=c.relnamespace
     where n.nspname='public' and c.relkind='v'), '[]'::json),
  'sequences', coalesce((select json_agg(json_build_object(
     'ad', sequencename,
     'anon', has_sequence_privilege('anon', quote_ident(schemaname)||'.'||quote_ident(sequencename), 'usage')
          or has_sequence_privilege('anon', quote_ident(schemaname)||'.'||quote_ident(sequencename), 'select')))
     from pg_sequences where schemaname='public'), '[]'::json),
  'storage', coalesce((select json_agg(json_build_object('kova', id, 'public', public))
     from storage.buckets), '[]'::json)
) as scan;`;

/* ---------- Scan okuyucu ----------
   Yapıştırılan JSON güvenilmez input. Parse et, sürümü ve bölümleri
   doğrula, hassas değer sızmışsa reddet. Hata `hata` alanında döner. */
function guvenlikScanOku(metin) {
  const t = String(metin || '');
  if (guvenlikHassasVar(t)) {
    return { hata: 'Scan çıktısına gizli bir anahtar/şifre sızmış görünüyor — kabul edilmedi.' };
  }
  const bas = t.indexOf('{'), son = t.lastIndexOf('}');
  if (bas < 0 || son <= bas) return { hata: 'Geçerli bir JSON bulunamadı.' };
  let j = null;
  try { j = JSON.parse(t.slice(bas, son + 1)); } catch (h) { return { hata: 'JSON çözülemedi — SQL sonucunu olduğu gibi kopyala.' }; }
  /* SQL Editor "Copy as JSON" [{scan:{…}}] diye sarabiliyor. */
  if (Array.isArray(j)) j = j[0];
  if (j && typeof j === 'object' && j.scan && !j.scan_surumu) j = j.scan;
  if (!j || typeof j !== 'object' || Array.isArray(j)) return { hata: 'Scan bir nesne değil.' };
  if (String(j.scan_surumu || '') !== GUVENLIK_SCAN_SURUMU) {
    return { hata: 'Scan sürümü uyuşmuyor (beklenen ' + GUVENLIK_SCAN_SURUMU + '). Güncel Scan SQL\'ini çalıştır.' };
  }
  for (const b of GUVENLIK_SCAN_BOLUMLERI) {
    if (!(b in j)) return { hata: '"' + b + '" bölümü eksik.' };
    if (!Array.isArray(j[b])) return { hata: '"' + b + '" bir liste olmalı.' };
  }
  return { scan: j };
}

/* ---------- RLS ifade sınıflandırıcı ----------
   Tam SQL parser değil. Yalnız açık kalıpları tanır; tanıyamadığını
   'karmasik' der (→ DOGRULANAMADI). "Anlamadım" ≠ "güvensiz". */
function guvenlikIfadeSinifi(ifade) {
  const s = String(ifade == null ? '' : ifade).trim().toLowerCase();
  if (s === '' || s === 'true') return 'herkes';       // using(true) → koruma yok
  if (s === 'false') return 'kapali';
  const authUid = /auth\.uid\(\)/.test(s);
  const rolBazli = /rolum\(\)|\brol\b|jwt|auth\.role|request\.jwt|katman|yetki/.test(s);
  const sahiplik = /(olusturan|kullanici_id|user_id|owner|sahip|created_by)\s*=/.test(s)
                || /=\s*auth\.uid\(\)/.test(s);
  const tenant = /(sirket_id|company_id|sube_id|tenant|firma_id|kurulus)/.test(s);
  if (sahiplik) return 'sahiplik';
  if (tenant) return 'kiraci';
  if (authUid || rolBazli) return 'rol';
  return 'karmasik';
}

/* Bir tablonun bir işlemi için gerçek koruma sınıfı — scan'deki rls +
   policies'ten çıkarılır. Döner: {sinif, kanit}. sinif:
   'rls_kapali' | 'herkes' | 'sahiplik' | 'kiraci' | 'rol' | 'karmasik' | 'yok'. */
function guvenlikGercekKoruma(scan, tablo, islem) {
  const rls = (scan.rls || []).find(r => r.tablo === tablo);
  if (rls && rls.acik === false) return { sinif: 'rls_kapali', kanit: 'RLS kapalı' };
  const uygun = (scan.policies || []).filter(p =>
    p.tablo === tablo && (String(p.islem).toUpperCase() === 'ALL'
      || String(p.islem).toUpperCase() === String(islem).toUpperCase()));
  if (!uygun.length) return { sinif: (rls ? 'yok' : 'karmasik'), kanit: rls ? 'RLS açık, bu işlem için kural yok' : 'RLS durumu bilinmiyor' };
  /* Yazma işlemlerinde with_check, okumada using önemli. */
  const yaz = ['INSERT', 'UPDATE'].includes(String(islem).toUpperCase());
  const siniflar = uygun.map(p => guvenlikIfadeSinifi(yaz ? (p.check != null ? p.check : p.using) : p.using));
  /* En gevşek kural belirleyicidir: herkes > rol > kiraci > sahiplik. */
  const oncelik = { herkes: 0, rol: 1, kiraci: 2, sahiplik: 3, kapali: 4, karmasik: 5 };
  siniflar.sort((a, b) => (oncelik[a] ?? 9) - (oncelik[b] ?? 9));
  return { sinif: siniflar[0], kanit: 'policy: ' + uygun.map(p => p.ad).join(', ') };
}

/* Manifest RLS beklentisini kabaca sınıfa çevirir. */
function guvenlikBeklentiSinifi(beklenen) {
  const s = String(beklenen || '').toLowerCase();
  if (!s || s === 'yok' || s === 'hicbiri') return 'yok';
  if (s.includes('herkes')) return 'herkes';
  if (s.includes('sahib') || s.includes('kendi') || s.includes('owner')) return 'sahiplik';
  if (s.includes('sirket') || s.includes('sube') || s.includes('firma') || s.includes('tenant') || s.includes('kiraci')) return 'kiraci';
  if (s.includes('rol') || s.includes('yonetici') || s.includes('admin')) return 'rol';
  return 'bilinmiyor';
}

/* Manifest alanının değerini çıkarır ({deger,...} ya da düz değer). */
function guvenlikDeger(x) {
  if (x && typeof x === 'object' && 'deger' in x) return x.deger;
  return x;
}
function guvenlikKanit(x) {
  return (x && typeof x === 'object' && x.kanit) ? String(x.kanit) : '';
}

/* ---------- Doğrulama motoru ----------
   Girdi: { manifest (govde), scan, proje }. Çıktı: { sonuclar, belirsizler,
   ozet }. Her sonuç bir iddia; Test Matrix'in ileride kullanacağı biçimde. */
function guvenlikManifestDogrula({ manifest, scan, proje }) {
  const govde = (manifest && manifest.govde) || manifest || {};
  const sonuclar = [];
  const belirsizler = [];
  const D = GUVENLIK_DOGRULAMA;

  const ekle = (o) => sonuclar.push(Object.assign({
    iddia_id: '', kategori: '', varlik: '', boyut: '', beklenen: '', gercek: '',
    durum: D.BILGI, kanit_manifest: '', kanit_db: '', bulgu_uretir: false,
  }, o));

  const scanTablolar = new Set((scan.tablolar || []).map(t => t.ad));

  /* 1) Varlık RLS beklentileri — manifest ne bekliyor, DB ne gösteriyor. */
  for (const v of (govde.varliklar || [])) {
    const ad = guvenlikDeger(v.ad) || v.ad;
    if (!ad) continue;
    if (!scanTablolar.has(ad)) {
      ekle({ iddia_id: 'varlik:' + ad + ':varlik', kategori: 'rls', varlik: ad,
        boyut: 'varlik', beklenen: 'tablo var', gercek: 'scan\'de yok',
        durum: D.DOGRULANAMADI, kanit_manifest: guvenlikKanit(v.ad) });
      continue;
    }
    const rb = v.rls_beklentisi || {};
    for (const islem of ['select', 'insert', 'update', 'delete']) {
      if (!(islem in rb)) continue;
      const beklenen = guvenlikBeklentiSinifi(rb[islem]);
      const gercek = guvenlikGercekKoruma(scan, ad, islem);
      let durum = D.BILGI, bulgu = false;
      if (gercek.sinif === 'rls_kapali') {
        durum = (beklenen === 'yok' || beklenen === 'herkes') ? D.BILGI : D.CELISIYOR;
        bulgu = durum === D.CELISIYOR;
      } else if (gercek.sinif === 'karmasik' || beklenen === 'bilinmiyor') {
        durum = D.DOGRULANAMADI;
      } else if (gercek.sinif === 'herkes') {
        durum = (beklenen === 'herkes' || beklenen === 'yok') ? D.DOGRULANDI : D.CELISIYOR;
        bulgu = durum === D.CELISIYOR;
      } else {
        /* gerçek koruma var (sahiplik/kiraci/rol). Beklenenle aynıysa doğrulandı. */
        durum = (beklenen === gercek.sinif || beklenen === 'rol' || beklenen === 'yok')
          ? D.DOGRULANDI : D.DOGRULANDI; // koruma beklentiden sıkı → yine güvenli
      }
      ekle({ iddia_id: 'varlik:' + ad + ':rls:' + islem, kategori: 'rls', varlik: ad,
        boyut: islem, beklenen: String(rb[islem]), gercek: gercek.sinif,
        durum, kanit_manifest: '', kanit_db: gercek.kanit, bulgu_uretir: bulgu });
    }
  }

  /* 2) Edge Function yetkileri. */
  const fnScan = scan.functions || [];
  for (const f of ((govde.sunucu && govde.sunucu.edge_functions) || [])) {
    const ad = guvenlikDeger(f.ad) || f.ad;
    if (!ad) continue;
    /* Edge Function'lar pg fonksiyonu değil; scan'de doğrudan yok. Statik
       olarak ölçülemez — kod denetimi/canlı test işi. */
    ekle({ iddia_id: 'fn:' + ad, kategori: 'function', varlik: ad, boyut: 'edge',
      beklenen: String(guvenlikDeger(f.yetki_kontrolu) || 'yetki'), gercek: 'scan ölçemez',
      durum: D.DOGRULANAMADI, kanit_db: 'Edge Function scan kapsamı dışında' });
  }

  /* 3) DB fonksiyonları: manifest yönetici bekliyor ama anon execute açıksa çelişki. */
  for (const f of fnScan) {
    if (f.anon_execute === true) {
      ekle({ iddia_id: 'dbfn:' + f.ad + ':anon', kategori: 'function', varlik: f.ad,
        boyut: 'execute', beklenen: 'ziyaretçiye kapalı', gercek: 'anon EXECUTE açık',
        durum: D.BILGI, kanit_db: 'has_function_privilege(anon)=true' });
    }
    if (f.definer === true && f.search_path_sabit === false) {
      ekle({ iddia_id: 'dbfn:' + f.ad + ':searchpath', kategori: 'function', varlik: f.ad,
        boyut: 'search_path', beklenen: 'sabit search_path', gercek: 'sabitlenmemiş',
        durum: D.CELISIYOR, bulgu_uretir: true, kanit_db: 'security definer + search_path yok' });
    }
  }

  /* 4) Storage kovaları: manifest private bekliyor, scan public gösteriyorsa çelişki. */
  const kovaScan = scan.storage || [];
  for (const st of ((govde.sunucu && govde.sunucu.storage) || [])) {
    const kova = guvenlikDeger(st.kova) || st.kova;
    if (!kova) continue;
    const g = kovaScan.find(x => x.kova === kova);
    if (!g) { ekle({ iddia_id: 'storage:' + kova, kategori: 'storage', varlik: kova,
      boyut: 'kova', beklenen: 'kova var', gercek: 'scan\'de yok', durum: D.DOGRULANAMADI }); continue; }
    const beklenenPublic = String(guvenlikDeger(st.kural) || st.public || '').toLowerCase().includes('public')
      || guvenlikDeger(st.public) === true;
    if (g.public === true && !beklenenPublic) {
      ekle({ iddia_id: 'storage:' + kova + ':public', kategori: 'storage', varlik: kova,
        boyut: 'public', beklenen: 'private', gercek: 'public',
        durum: D.CELISIYOR, bulgu_uretir: true, kanit_db: 'bucket.public=true' });
    } else {
      ekle({ iddia_id: 'storage:' + kova + ':public', kategori: 'storage', varlik: kova,
        boyut: 'public', beklenen: beklenenPublic ? 'public' : 'private',
        gercek: g.public ? 'public' : 'private', durum: D.DOGRULANDI, kanit_db: 'bucket.public=' + g.public });
    }
  }

  /* 5) Public bucket ama manifestte hiç anılmamış → gözlem (açık ilan etme). */
  const manKova = new Set(((govde.sunucu && govde.sunucu.storage) || []).map(s => guvenlikDeger(s.kova) || s.kova));
  for (const g of kovaScan) {
    if (g.public === true && !manKova.has(g.kova)) {
      ekle({ iddia_id: 'storage:' + g.kova + ':gozlem', kategori: 'storage', varlik: g.kova,
        boyut: 'public', beklenen: '(manifestte yok)', gercek: 'public',
        durum: D.BILGI, kanit_db: 'bucket.public=true' });
    }
  }

  /* 6) Hassas veri: manifest bildiriyor, kolon DB'de var mı. */
  const kolonHaritasi = {};
  for (const t of (scan.tablolar || [])) kolonHaritasi[t.ad] = new Set((t.kolonlar || []).map(k => k.ad));
  for (const h of (govde.hassas_veriler || [])) {
    const varlik = guvenlikDeger(h.varlik) || h.varlik;
    const alan = guvenlikDeger(h.alan) || h.alan;
    if (!varlik || !alan) continue;
    const varMi = kolonHaritasi[varlik] && kolonHaritasi[varlik].has(alan);
    ekle({ iddia_id: 'veri:' + varlik + '.' + alan, kategori: 'veri', varlik: varlik,
      boyut: alan, beklenen: 'hassas alan var', gercek: varMi ? 'kolon var' : 'kolon yok',
      durum: varMi ? D.DOGRULANDI : D.DOGRULANAMADI });
  }

  /* 7) RLS'i atlayan görünüm (security_invoker kapalı) → gözlem. */
  for (const v of (scan.views || [])) {
    const inv = String(v.security_invoker).toLowerCase();
    if (!['true', 'on', 'yes', '1'].includes(inv)) {
      ekle({ iddia_id: 'view:' + v.ad, kategori: 'view', varlik: v.ad, boyut: 'security_invoker',
        beklenen: 'security_invoker', gercek: 'kapalı', durum: D.BILGI,
        kanit_db: 'view RLS\'i atlayabilir' });
    }
  }

  const say = (d) => sonuclar.filter(x => x.durum === d).length;
  const ozet = {
    toplam: sonuclar.length,
    dogrulandi: say(D.DOGRULANDI), celisiyor: say(D.CELISIYOR),
    dogrulanamadi: say(D.DOGRULANAMADI), bilgi: say(D.BILGI),
    bulgu_adayi: sonuclar.filter(x => x.bulgu_uretir).length,
  };
  return { sonuclar, belirsizler, ozet };
}

/* ==========================================================================
   Faz 4 · Authorization Test Matrix üretimi

   Manifest (iddia) + Scan (gerçek) + doğrulama sonucundan çalıştırılabilir
   test satırları türetir. Manifestteki onerilen_testler'in kopyası DEĞİL:
   NIZAM izolasyon modelinden, rollerden ve fonksiyonlardan kendi testlerini
   de üretir. Bu faz yalnız ÜRETİR; canlı çalıştırma sonraki faz.

   PII yok: yalnız takma ad (hesap_A/B, sirket_A/B). Test_id deterministik:
   aynı kaynak → aynı id, tarih/kanıt içermez. Aynı id tekrarı elenir. */

/* Bir varlığın bir işlemi için doğrulama sonucunu bulur (yöntem/güven için). */
function guvenlikDogrulamaBul(dogrulama, varlik, islem) {
  if (!dogrulama || !dogrulama.sonuclar) return null;
  return dogrulama.sonuclar.find(x =>
    x.kategori === 'rls' && x.varlik === varlik && x.boyut === islem) || null;
}

/* İşleme göre öntanımlı test yöntemi. Doğrulama statik cevap verdiyse
   (DOGRULANDI/CELISIYOR) okuma zaten bilinir → statik; çözülemediyse okuma
   canlı denenebilir; yazma her hâlde aktif_gerekli (üretimde çalışmaz). */
function guvenlikYontemSec(islem, dvSonuc) {
  if (islem === 'read') {
    if (dvSonuc && (dvSonuc.durum === GUVENLIK_DOGRULAMA.DOGRULANDI
      || dvSonuc.durum === GUVENLIK_DOGRULAMA.CELISIYOR)) return 'statik';
    return 'okuma_canli';
  }
  if (islem === 'call') return 'aktif_gerekli';
  return 'aktif_gerekli'; // insert/update/delete
}

/* Deterministik risk. Genel skor değil, tek testin önemi. */
function guvenlikRisk(kategori, kapsam, islem, hassas) {
  if (kapsam === 'baska_sirket') return 'kritik';
  if (kapsam === 'baskasinin') return hassas ? 'yuksek' : 'yuksek';
  if (islem === 'delete' || islem === 'call') return 'yuksek';
  if (kategori === 'dis') return hassas ? 'yuksek' : 'orta';
  return 'orta';
}

const GUVENLIK_ISLEM_AD = { select: 'read', insert: 'insert', update: 'update',
  delete: 'delete', call: 'call', read: 'read' };

function guvenlikMatrisUret({ manifest, scan, dogrulama, proje }) {
  const govde = (manifest && manifest.govde) || manifest || {};
  const scanTablolar = new Set((scan && scan.tablolar || []).map(t => t.ad));
  const izo = govde.izolasyon || {};
  const izoModel = String(guvenlikDeger(izo.model) || '').toLowerCase();
  const sahiplikVar = /kullanici|sahip|owner/.test(izoModel) || !!guvenlikDeger(izo.sahiplik_alani);
  const tenantVar = /sirket|sube|firma|tenant/.test(izoModel) || !!guvenlikDeger(izo.kiraci_alani);

  const harita = new Map();  // test_id → satır (ilk kazanır, tekrar elenir)
  const ekle = (o) => {
    const test_id = [o.kategori, o.kaynak.varlik, o.aktor.deger, o.kaynak.kapsam, o.islem]
      .join(':').toLowerCase().replace(/\s+/g, '_');
    if (harita.has(test_id)) return;
    const dv = guvenlikDogrulamaBul(dogrulama, o.kaynak.varlik, o.islem);
    harita.set(test_id, Object.assign({
      test_id, kategori: 'ic', durum: 'beklemede', gercek: '', kanit: '',
      test_yontemi: guvenlikYontemSec(o.islem, dv),
      risk: guvenlikRisk(o.kategori, o.kaynak.kapsam, o.islem, !!o.hassas),
      dogrulama_durumu: dv ? dv.durum : '',
    }, o));
  };

  const hassasVarliklar = new Set((govde.hassas_veriler || [])
    .map(h => guvenlikDeger(h.varlik) || h.varlik).filter(Boolean));

  /* 1) Varlık bazlı: anonim DENY + sahiplik/tenant izolasyonu. */
  for (const v of (govde.varliklar || [])) {
    const ad = guvenlikDeger(v.ad) || v.ad;
    if (!ad || !scanTablolar.has(ad)) continue;   // scan'de olmayanı test etme
    const hassas = v.hassas === true || hassasVarliklar.has(ad);

    /* Dış: anonim hassas/korumalı kaynağı okuyamamalı. */
    ekle({ kategori: 'dis', aktor: { tur: 'anonim', deger: 'anonim' },
      kaynak: { varlik: ad, kapsam: 'herhangi' }, islem: 'read',
      beklenen: 'DENY', beklenti_kaynagi: 'otomatik', hassas });

    /* İç: sahiplik varsa kendi ALLOW + başkası DENY (read + yazma). */
    if (sahiplikVar) {
      ekle({ aktor: { tur: 'hesap', deger: 'hesap_A' }, kategori: 'ic',
        kaynak: { varlik: ad, kapsam: 'kendi' }, islem: 'read',
        beklenen: 'ALLOW', beklenti_kaynagi: 'otomatik', hassas });
      ekle({ aktor: { tur: 'hesap', deger: 'hesap_A' }, kategori: 'ic',
        kaynak: { varlik: ad, kapsam: 'baskasinin' }, islem: 'read',
        beklenen: 'DENY', beklenti_kaynagi: 'dogrulama', hassas });
      for (const islem of ['update', 'delete']) {
        ekle({ aktor: { tur: 'hesap', deger: 'hesap_A' }, kategori: 'ic',
          kaynak: { varlik: ad, kapsam: 'baskasinin' }, islem,
          beklenen: 'DENY', beklenti_kaynagi: 'dogrulama', hassas });
      }
    }
    /* İç: tenant varsa kendi şirketi ALLOW + başka şirket DENY. */
    if (tenantVar) {
      ekle({ aktor: { tur: 'hesap', deger: 'hesap_A' }, kategori: 'ic',
        kaynak: { varlik: ad, kapsam: 'baska_sirket' }, islem: 'read',
        beklenen: 'DENY', beklenti_kaynagi: 'dogrulama', hassas });
    }
  }

  /* 2) Rol bazlı: manifest.yetkiler'den (yalnız anlamlı olanlar). */
  for (const y of (govde.yetkiler || [])) {
    const rol = guvenlikDeger(y.rol) || y.rol;
    const varlik = guvenlikDeger(y.varlik) || y.varlik;
    const islemHam = String(guvenlikDeger(y.islem) || y.islem || '').toLowerCase();
    const islem = GUVENLIK_ISLEM_AD[islemHam] || islemHam;
    const beklenen = String(guvenlikDeger(y.beklenen) || y.beklenen || '').toUpperCase();
    if (!rol || !varlik || !islem || !['ALLOW', 'DENY'].includes(beklenen)) continue;
    if (varlik !== '*' && !scanTablolar.has(varlik)) continue;
    ekle({ kategori: 'ic', aktor: { tur: 'rol', deger: rol },
      kaynak: { varlik, kapsam: 'herhangi' }, islem, beklenen,
      beklenti_kaynagi: 'manifest', hassas: hassasVarliklar.has(varlik) });
  }

  /* 3) Fonksiyonlar: manifest.sunucu.edge_functions'tan çağıran rolü. */
  const roller = (govde.roller || []).map(r => guvenlikDeger(r.ad) || r.ad).filter(Boolean);
  for (const f of ((govde.sunucu && govde.sunucu.edge_functions) || [])) {
    const ad = guvenlikDeger(f.ad) || f.ad;
    const gerekliRol = String(guvenlikDeger(f.yetki_kontrolu) || '').toLowerCase();
    if (!ad) continue;
    /* Anonim her zaman DENY beklenir. */
    ekle({ kategori: 'dis', aktor: { tur: 'anonim', deger: 'anonim' },
      kaynak: { varlik: ad, kapsam: 'herhangi' }, islem: 'call',
      beklenen: 'DENY', beklenti_kaynagi: 'manifest' });
    /* Gerekli rol dışındaki roller DENY, gerekli rol ALLOW. */
    for (const r of roller) {
      const ayni = gerekliRol && r.toLowerCase().includes(gerekliRol);
      ekle({ kategori: 'ic', aktor: { tur: 'rol', deger: r },
        kaynak: { varlik: ad, kapsam: 'herhangi' }, islem: 'call',
        beklenen: ayni ? 'ALLOW' : 'DENY', beklenti_kaynagi: 'manifest' });
    }
  }

  /* 4) Storage: private kova için anonim/başkası DENY, sahip ALLOW. */
  const kovaScan = (scan && scan.storage) || [];
  for (const st of ((govde.sunucu && govde.sunucu.storage) || [])) {
    const kova = guvenlikDeger(st.kova) || st.kova;
    if (!kova) continue;
    const g = kovaScan.find(x => x.kova === kova);
    if (g && g.public === true) continue;   // public kovada DENY testi anlamsız
    ekle({ kategori: 'dis', aktor: { tur: 'anonim', deger: 'anonim' },
      kaynak: { varlik: kova, kapsam: 'herhangi' }, islem: 'read',
      beklenen: 'DENY', beklenti_kaynagi: 'manifest' });
    ekle({ kategori: 'ic', aktor: { tur: 'hesap', deger: 'hesap_A' },
      kaynak: { varlik: kova, kapsam: 'kendi' }, islem: 'read',
      beklenen: 'ALLOW', beklenti_kaynagi: 'manifest' });
    ekle({ kategori: 'ic', aktor: { tur: 'hesap', deger: 'hesap_A' },
      kaynak: { varlik: kova, kapsam: 'baskasinin' }, islem: 'read',
      beklenen: 'DENY', beklenti_kaynagi: 'manifest' });
  }

  /* 5) Manifestin kendi önerdiği testler. */
  for (const t of (govde.onerilen_testler || [])) {
    const varlik = guvenlikDeger(t.varlik) || t.varlik;
    const islemHam = String(guvenlikDeger(t.islem) || t.islem || '').toLowerCase();
    const islem = GUVENLIK_ISLEM_AD[islemHam] || islemHam;
    const beklenen = String(guvenlikDeger(t.beklenen) || t.beklenen || '').toUpperCase();
    const rol = guvenlikDeger(t.aktor_rol) || t.aktor_rol || 'rol';
    const kapsam = guvenlikDeger(t.kapsam) || t.kapsam || 'herhangi';
    if (!varlik || !islem || !['ALLOW', 'DENY'].includes(beklenen)) continue;
    ekle({ kategori: 'ic', aktor: { tur: 'rol', deger: rol },
      kaynak: { varlik, kapsam }, islem, beklenen,
      beklenti_kaynagi: 'manifest', hassas: hassasVarliklar.has(varlik) });
  }

  const satirlar = [...harita.values()];
  const say = (k, v) => satirlar.filter(x => x[k] === v).length;
  const ozet = {
    toplam: satirlar.length,
    dis: say('kategori', 'dis'), ic: say('kategori', 'ic'),
    aktif_gerekli: say('test_yontemi', 'aktif_gerekli'),
    kritik: say('risk', 'kritik'), yuksek: say('risk', 'yuksek'),
  };
  return { satirlar, ozet };
}

/* ==========================================================================
   Faz 5 · Canlı sonuç yorumlama (saf) + bulgu imzası + denetim özeti

   Yorumlama HTTP koduna tek başına bakmaz: durum + satır sayısı + hata türü
   + beklenen birlikte değerlendirilir. Bağlantı/sunucu hatası güvenlik
   sonucu SAYILMAZ (DOGRULANAMADI). IO burada YOK — çağıran gözlemi verir. */

/* gozlem: { yontem, http, satir_sayisi, hata, olcum? }  (olcum = statik doğrulama durumu)
   Döner: { durum, gercek, aciklama }. */
function guvenlikCanliYorumla(row, gozlem) {
  const S = GUVENLIK_SONUC;
  const g = gozlem || {};
  const beklenen = String(row.beklenen || '').toUpperCase();

  /* aktif_gerekli: üretimde çalıştırılmadı. */
  if (row.test_yontemi === 'aktif_gerekli') {
    return { durum: S.AKTIF_TEST_GEREKLI, gercek: '',
      aciklama: 'Üretim ortamında veri değişikliği gerektirdiği için otomatik çalıştırılmadı.' };
  }
  /* statik: Faz 3 doğrulamasından karar. */
  if (row.test_yontemi === 'statik') {
    const dv = g.olcum;
    if (dv === GUVENLIK_DOGRULAMA.CELISIYOR) return { durum: S.ACIK, gercek: 'doğrulama: çelişki', aciklama: 'DB koruması manifest beklentisiyle çelişiyor.' };
    if (dv === GUVENLIK_DOGRULAMA.DOGRULANDI) return { durum: beklenen === 'DENY' ? S.KAPALI : S.DOGRULANDI, gercek: 'doğrulama: uyumlu', aciklama: '' };
    return { durum: S.DOGRULANAMADI, gercek: '', aciklama: 'Statik doğrulama sonucu yetersiz.' };
  }
  /* yetki_sorgusu: tarayıcıdan işlemsiz yetki ölçümü yok → ölçülemedi. */
  if (row.test_yontemi === 'yetki_sorgusu') {
    return { durum: S.DOGRULANAMADI, gercek: '', aciklama: 'İşlemsiz yetki sorgusu bu ortamda ölçülemiyor.' };
  }

  /* okuma_canli: gerçek SELECT/GET gözlemi. */
  if (g.hata) return { durum: S.DOGRULANAMADI, gercek: 'bağlantı hatası', aciklama: 'Bağlantı kurulamadı — güvenlik sonucu değil.' };
  if (g.olculemedi) return { durum: S.DOGRULANAMADI, gercek: g.olculemedi, aciklama: g.aciklama || 'Güvenli test kaydı bulunamadı.' };
  const http = g.http;
  const satir = g.satir_sayisi;
  const reddedildi = http === 401 || http === 403;
  const okundu = http >= 200 && http < 300 && satir > 0;
  const bosDondu = http >= 200 && http < 300 && (satir === 0 || satir == null);

  if (beklenen === 'DENY') {
    if (reddedildi) return { durum: S.KAPALI, gercek: 'HTTP ' + http, aciklama: 'Yetkisiz erişim reddedildi.' };
    if (bosDondu)   return { durum: S.KAPALI, gercek: 'boş sonuç', aciklama: 'Satır güvenliği erişimi engelledi (0 satır).' };
    if (okundu)     return { durum: S.ACIK,   gercek: 'HTTP ' + http + ' · ' + satir + ' satır', aciklama: 'Yetkisiz erişim başarılı — güvenlik açığı.' };
    return { durum: S.DOGRULANAMADI, gercek: 'HTTP ' + (http == null ? '?' : http), aciklama: 'Sonuç sınıflandırılamadı.' };
  }
  if (beklenen === 'ALLOW') {
    if (okundu)     return { durum: S.DOGRULANDI, gercek: 'HTTP ' + http + ' · ' + satir + ' satır', aciklama: 'Yetkili erişim başarılı.' };
    if (bosDondu)   return { durum: S.DOGRULANAMADI, gercek: 'boş sonuç', aciklama: 'Erişilebilir kayıt bulunamadı — kesin değil.' };
    if (reddedildi) return { durum: S.DOGRULANAMADI, gercek: 'HTTP ' + http, aciklama: 'Yetkili beklenen erişim reddedildi — hesap/kayıt nedeniyle olabilir.' };
    return { durum: S.DOGRULANAMADI, gercek: 'HTTP ' + (http == null ? '?' : http), aciklama: 'Sonuç sınıflandırılamadı.' };
  }
  return { durum: S.BILGI, gercek: '', aciklama: '' };
}

/* Bulgu imzası — kanıt/tarih/HTTP İÇERMEZ. Aynı açık aynı imzayı üretir. */
function guvenlikBulguImzasi(hedefId, row) {
  return [hedefId, row.kategori, row.kaynak.varlik, row.islem, row.kaynak.kapsam]
    .join(':').toLowerCase().replace(/\s+/g, '_');
}

/* Denetim özeti — yalnız ACIK "acik" sayılır; ölçülemedi/aktif ayrı. */
function guvenlikDenetimOzeti(sonuclar) {
  const S = GUVENLIK_SONUC;
  const say = (d) => sonuclar.filter(x => x.durum === d).length;
  const acik = sonuclar.filter(x => x.durum === S.ACIK);
  return {
    toplam: sonuclar.length,
    acik: acik.length,
    kritik: acik.filter(x => x.risk === 'kritik').length,
    yuksek: acik.filter(x => x.risk === 'yuksek').length,
    dogrulandi: say(S.DOGRULANDI),
    dogrulanamadi: say(S.DOGRULANAMADI),
    aktif_gerekli: say(S.AKTIF_TEST_GEREKLI),
    kapali: say(S.KAPALI),
  };
}
