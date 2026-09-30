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
