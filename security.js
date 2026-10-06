/* ==========================================================================
   NIZAM Security — İlk aşama: Erişim Kuralları

   ESKİ GÜVENLİK SİSTEMİNDEN TAMAMEN BAĞIMSIZ. guvenlik-*.js dosyalarındaki
   hiçbir fonksiyonu çağırmaz, guvenlik_* tablolarından veri okumaz. Yalnız
   Studio'nun genel yardımcılarını kullanır (render, esc, toast, modalAc…).

   Akış:
     Proje seç → gerçek DB yapısını al (SQL Editor) → Claude promptu →
     güvenlik modeli JSON'u → Erişim Kuralları tablosu.

   İki ayrı bilgi tutulur, birbirine karıştırılmaz:
     yapi  = veritabanının GERÇEK hali (tablo, kolon, tip, PK, FK, RLS)
     model = OLMASI İSTENEN erişim (rol × kolon × Oku/Ekle/Değiştir/Sil
             + rol başına satır erişimi)

   Rotalar:  #/security            → proje listesi
             #/security/<projeId>  → Erişim Kuralları
   Tablo:    sql/44-nizam-security.sql (security_modelleri)
   index.html'de app.js'ten sonra yükleniyor.
   ========================================================================== */

'use strict';

const SEC_YAPI_SURUM  = 'yapi-3';
/* Erişim Kuralları eski yapı çıktısıyla da çalışır; Test Ortamı en yenisini (yapi-3) ister. */
const SEC_YAPI_KABUL  = ['yapi-1', 'yapi-2', 'yapi-3'];
const SEC_MODEL_SURUM = 1;
const SEC_IZINLER = ['oku', 'ekle', 'degistir', 'sil'];
const SEC_IZIN_AD = { oku: 'Oku', ekle: 'Ekle', degistir: 'Değiştir', sil: 'Sil' };
/* Bilinen satır kuralları; bunların dışındaki metin olduğu gibi gösterilir
   (ör. "Kendi şubesinin satırları"). */
const SEC_SATIR_AD = { tum: 'Tüm satırlar', kendi: 'Kendi satırı', yok: 'Hiçbiri' };
/* Şartlı satır kuralı: {kolon, kosul, deger, aciklama} — test aracı bunu okuyabilir.
   Ör. {kolon:'tablo_adi', kosul:'esit_degil', deger:'kullanicilar'} */
const SEC_KOSULLAR = ['esit', 'esit_degil', 'icinde', 'icinde_degil'];
const SEC_KOSUL_AD = { esit: '=', esit_degil: '≠', icinde: 'şunlardan biri:', icinde_degil: 'şunlardan biri değil:' };
/* Giriş yapmamış kişi için ayrılmış rol adı. Modelde yoksa ziyaretçi HİÇBİR
   şey göremez (varsayılan kapalı). Test hesabı açılmaz; giriş yapmadan denenir. */
const SEC_ZIYARETCI_ROL = 'Ziyaretçi';
const SEC_YAZMA_YOLLARI = ['dogrudan', 'fonksiyon_ile'];
const secSartMi = d => !!(d && typeof d === 'object' && !Array.isArray(d) && d.kolon);

/* ---------- Gerçek yapıyı okuyan SQL ----------
   Yalnız sistem kataloğunu okur (pg_class, pg_attribute, pg_constraint,
   pg_policy, pg_proc…). Hiçbir tablonun SATIRINA dokunmaz; müşteri verisi,
   şifre, token çıkmaz.
   yapi-2/3: test ortamı bu yapıdan kurulabilsin diye varsayılan değerler,
   kısıtlar, RLS kuralları (policy), yetkiler, fonksiyonlar, tetikleyiciler,
   enum tipleri ve görünümler de alınıyor — hepsi TANIM, hiçbiri veri değil. */
const SEC_YAPI_SQL = `-- NIZAM Security · Veritabanı yapısı
-- Yalnız YAPIYI okur: tablo, kolon, tip, anahtar, ilişki, RLS kuralları,
-- yetkiler, fonksiyon ve tetikleyici tanımları. Hiçbir satır verisi okunmaz.
-- Çıkan tek hücreyi kopyala, Nizam'a yapıştır.
select json_build_object(
  'nizam_security', '${SEC_YAPI_SURUM}',
  'tablolar', coalesce((select json_agg(t order by t.ad) from (
    select c.relname as ad,
      c.relrowsecurity as rls,
      c.relforcerowsecurity as rls_zorunlu,
      coalesce((select json_agg(json_build_object(
          'ad', a.attname,
          'tip', format_type(a.atttypid, a.atttypmod),
          'bos_olabilir', not a.attnotnull,
          'pk', exists(select 1 from pg_constraint k
                       where k.conrelid = c.oid and k.contype = 'p' and a.attnum = any(k.conkey)),
          'varsayilan', pg_get_expr(d.adbin, d.adrelid),
          'kimlik', nullif(a.attidentity::text, ''),
          'uretilmis', nullif(a.attgenerated::text, ''),
          'yetkiler', (select json_agg(json_build_object('rol', r.rol, 'yetki', r.yetki))
                       from (select case when x.grantee = 0 then 'public' else pg_get_userbyid(x.grantee) end as rol,
                                    x.privilege_type as yetki
                             from aclexplode(a.attacl) x) r
                       where r.rol in ('anon', 'authenticated', 'public'))
        ) order by a.attnum)
        from pg_attribute a
        left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
        where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped), '[]'::json) as kolonlar,
      coalesce((select json_agg(json_build_object(
          'kolon', (select string_agg(a.attname, ',') from pg_attribute a
                    where a.attrelid = c.oid and a.attnum = any(f.conkey)),
          'hedef_tablo', case when fn.nspname = 'public' then cf.relname
                              else fn.nspname || '.' || cf.relname end,
          'hedef_kolon', (select string_agg(a.attname, ',') from pg_attribute a
                          where a.attrelid = f.confrelid and a.attnum = any(f.confkey))))
        from pg_constraint f
        join pg_class cf on cf.oid = f.confrelid
        join pg_namespace fn on fn.oid = cf.relnamespace
        where f.conrelid = c.oid and f.contype = 'f'), '[]'::json) as iliskiler,
      coalesce((select json_agg(json_build_object(
          'ad', k.conname, 'tur', k.contype, 'tanim', pg_get_constraintdef(k.oid))
          order by k.contype, k.conname)
        from pg_constraint k
        where k.conrelid = c.oid and k.contype in ('p', 'u', 'c', 'f', 'x')), '[]'::json) as kisitlar,
      coalesce((select json_agg(json_build_object(
          'ad', p.polname,
          'islem', case p.polcmd when 'r' then 'SELECT' when 'a' then 'INSERT'
                                 when 'w' then 'UPDATE' when 'd' then 'DELETE' else 'ALL' end,
          'kisitlayici', not p.polpermissive,
          'roller', (select json_agg(case when r = 0 then 'public' else pg_get_userbyid(r) end)
                     from unnest(p.polroles) r),
          'using', pg_get_expr(p.polqual, p.polrelid),
          'check', pg_get_expr(p.polwithcheck, p.polrelid))
          order by p.polname)
        from pg_policy p where p.polrelid = c.oid), '[]'::json) as politikalar,
      c.relacl is null as yetki_varsayilan,
      (select json_agg(json_build_object('rol', r.rol, 'yetki', r.yetki))
         from (select case when x.grantee = 0 then 'public' else pg_get_userbyid(x.grantee) end as rol,
                      x.privilege_type as yetki
               from aclexplode(c.relacl) x) r
         where r.rol in ('anon', 'authenticated', 'public')) as yetkiler,
      coalesce((select json_agg(json_build_object('ad', tg.tgname, 'tanim', pg_get_triggerdef(tg.oid))
          order by tg.tgname)
        from pg_trigger tg where tg.tgrelid = c.oid and not tg.tgisinternal), '[]'::json) as tetikleyiciler
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
  ) t), '[]'::json),
  'gorunumler', coalesce((select json_agg(json_build_object(
      'ad', c.relname,
      'tanim', pg_get_viewdef(c.oid),
      'secenekler', c.reloptions,
      'yetki_varsayilan', c.relacl is null,
      'yetkiler', (select json_agg(json_build_object('rol', r.rol, 'yetki', r.yetki))
         from (select case when x.grantee = 0 then 'public' else pg_get_userbyid(x.grantee) end as rol,
                      x.privilege_type as yetki
               from aclexplode(c.relacl) x) r
         where r.rol in ('anon', 'authenticated', 'public')))
      order by c.oid)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'v'), '[]'::json),
  'tipler', coalesce((select json_agg(json_build_object(
      'ad', ty.typname,
      'degerler', (select json_agg(e.enumlabel order by e.enumsortorder) from pg_enum e where e.enumtypid = ty.oid)))
    from pg_type ty join pg_namespace n on n.oid = ty.typnamespace
    where n.nspname = 'public' and ty.typtype = 'e'), '[]'::json),
  'diziler', coalesce((select json_agg(c.relname)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'S'
      and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'i')), '[]'::json),
  'fonksiyonlar', coalesce((select json_agg(json_build_object(
      'ad', p.proname,
      'imza', pg_get_function_identity_arguments(p.oid),
      'tanim', pg_get_functiondef(p.oid),
      'anon', has_function_privilege('anon', p.oid, 'execute'),
      'authenticated', has_function_privilege('authenticated', p.oid, 'execute'))
      order by p.oid)
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind in ('f', 'p')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')), '[]'::json),
  'eklentiler', coalesce((select json_agg(json_build_object('ad', e.extname, 'sema', en.nspname) order by e.extname)
    from pg_extension e join pg_namespace en on en.oid = e.extnamespace
    where e.extname <> 'plpgsql'), '[]'::json),
  'auth_tetikleyiciler', coalesce((select json_agg(json_build_object('ad', tg.tgname, 'tanim', pg_get_triggerdef(tg.oid)))
    from pg_trigger tg join pg_class c on c.oid = tg.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth' and c.relname = 'users' and not tg.tgisinternal), '[]'::json)
) as yapi;`;

/* ---------- Ekran durumu ---------- */
const SEC = {
  liste: null,        // [{proje_id, yapi_tarihi, model_tarihi}] — liste ekranı
  kayit: {},          // projeId → tam satır (null = kayıt yok)
  yukleniyor: {},
  acik: {},           // projeId → { tabloAdı: true } — 2. adımda açık tablolar
  liste_ac: {},       // projeId → adım no: o adımdayken "Tüm adımlar" listesi açık
  ayar_ac: {},        // projeId → { adımNo: true/false } — Proje ayarları sayfasında açık bölümler
  rol: {},            // projeId → seçili rol (açılan tablolarda)
  ara: {},            // projeId → tablo arama metni
};

/* Kurallar'daki tablo araması: yeniden çizmeden satırları süzer. */
document.addEventListener('input', e => {
  const el = e.target.closest && e.target.closest('.sec-ara');
  if (!el) return;
  SEC.ara[el.dataset.id] = el.value;
  secAraUygula(el.value);
});
function secAraUygula(metin) {
  const q = String(metin || '').trim().toLocaleLowerCase('tr');
  document.querySelectorAll('.sec-tb').forEach(x => {
    x.hidden = !!q && x.dataset.ad.toLocaleLowerCase('tr').indexOf(q) < 0;
  });
}

/* ==========================================================================
   VERİ — yalnız security_modelleri tablosu
   ========================================================================== */

const SEC_VERI = {
  async listeGetir() {
    if (!AUTH.bagli) return [];
    const { data, error } = await AUTH.db.from('security_modelleri')
      .select('proje_id, yapi_tarihi, model_tarihi');
    if (error) throw new Error(secHata(error));
    return data || [];
  },

  async getir(projeId) {
    if (!AUTH.bagli) return null;
    const { data, error } = await AUTH.db.from('security_modelleri')
      .select('*').eq('proje_id', projeId).maybeSingle();
    if (error) throw new Error(secHata(error));
    return data || null;
  },

  /* alanlar: {yapi, yapi_tarihi} ya da {model, model_tarihi} */
  async kaydet(projeId, alanlar) {
    yazmaKontrol();
    const govde = Object.assign({ proje_id: projeId }, alanlar,
      { guncellendi: new Date().toISOString() });
    const { data, error } = await AUTH.db.from('security_modelleri')
      .upsert(govde, { onConflict: 'proje_id' }).select('*');
    if (error) throw new Error(secHata(error));
    if (!data || !data.length) throw new Error('Kaydedilemedi.');
    return data[0];
  },
};

function secHata(err) {
  const m = (err && err.message) || '';
  if (/security_modelleri/i.test(m) && /does not exist|schema cache|Could not find/i.test(m)) {
    return 'Nizam Security tablosu kurulmamış. sql/44-nizam-security.sql dosyasını Supabase\'de çalıştır.';
  }
  return veriHatasi(err);
}

/* ==========================================================================
   YAPIŞTIRILAN METİNLER — güvenilmez girdi
   ========================================================================== */

/* Gizli değer sızmış mı: JWT (service_role / anon), Supabase gizli
   anahtarları, şifreli bağlantı adresi. Yapı çıktısında bunlar olmamalı. */
function secGizliVar(metin) {
  const t = String(metin || '');
  return /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./.test(t)
    || /\bsbp_[A-Za-z0-9]{20,}/.test(t)
    || /\bsb_secret_[A-Za-z0-9_-]{10,}/.test(t)
    || /postgres(ql)?:\/\/[^\s:@\/]+:[^\s@\/]+@/i.test(t);
}

/* Metindeki JSON'u çıkarır: ```json bloğu varsa onu, yoksa ilk { ile
   son } arasını. SQL Editor sonucu [{yapi:{…}}] ya da metin hâlinde
   sarılı gelebilir — ikisi de açılır. */
function secJsonAl(metin, sarmalAnahtar) {
  let t = String(metin || '');
  const blok = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (blok) t = blok[1];
  const bas = Math.min(...['{', '['].map(c => { const i = t.indexOf(c); return i < 0 ? Infinity : i; }));
  const son = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
  if (!isFinite(bas) || son <= bas) return { hata: 'Metinde JSON bulunamadı.' };
  let j;
  try { j = JSON.parse(t.slice(bas, son + 1)); } catch (h) {
    return { hata: 'JSON çözülemedi — çıktıyı olduğu gibi, eksiksiz kopyala.' };
  }
  if (Array.isArray(j)) j = j[0];
  if (j && sarmalAnahtar && j[sarmalAnahtar] !== undefined && !j.tablolar) j = j[sarmalAnahtar];
  if (typeof j === 'string') { try { j = JSON.parse(j); } catch (h) { return { hata: 'JSON çözülemedi.' }; } }
  if (!j || typeof j !== 'object' || Array.isArray(j)) return { hata: 'Beklenen biçimde bir JSON değil.' };
  return { json: j };
}

/* ---------- Yapı okuyucu ----------
   yapi-1 (eski) yalnız tablo/kolon/ilişki/RLS taşır. yapi-2 ek olarak test
   ortamını kurmak için gereken tanımları taşır; hepsi metin olarak saklanır. */
function secYapiOku(metin) {
  if (secGizliVar(metin)) return { hata: 'Çıktıda gizli bir anahtar ya da şifre var gibi görünüyor — kabul edilmedi.' };
  const r = secJsonAl(metin, 'yapi');
  if (r.hata) return r;
  const j = r.json;
  if (!SEC_YAPI_KABUL.includes(j.nizam_security)) {
    return { hata: 'Bu, Nizam Security yapı SQL\'inin çıktısı değil. Buradaki SQL\'i kopyalayıp çalıştır.' };
  }
  if (!Array.isArray(j.tablolar)) return { hata: 'Tablo listesi bulunamadı.' };
  const v2 = j.nizam_security !== 'yapi-1';   // yapi-2 ve yapi-3
  const dz = x => (Array.isArray(x) ? x : []);
  const yt = x => dz(x).map(y => ({ rol: String(y.rol || ''), yetki: String(y.yetki || '') }))
    .filter(y => y.rol && y.yetki);
  const tanimli = (x, alanlar) => dz(x).map(y => {
    const o = {};
    alanlar.forEach(a => { o[a] = y[a] === null || y[a] === undefined ? null : String(y[a]); });
    return o;
  }).filter(y => y.ad);

  const tablolar = [];
  for (const t of j.tablolar) {
    if (!t || typeof t.ad !== 'string' || !t.ad) return { hata: 'Adı olmayan bir tablo var.' };
    const kolonlar = dz(t.kolonlar).map(k => {
      const o = { ad: String(k.ad || ''), tip: String(k.tip || ''),
        bos_olabilir: !!k.bos_olabilir, pk: !!k.pk };
      if (v2) {
        o.varsayilan = k.varsayilan === null || k.varsayilan === undefined ? null : String(k.varsayilan);
        o.kimlik = k.kimlik === 'a' || k.kimlik === 'd' ? k.kimlik : null;
        o.uretilmis = k.uretilmis === 's' ? 's' : null;   // hesaplanan kolon (generated … stored)
        o.yetkiler = yt(k.yetkiler);
      }
      return o;
    }).filter(k => k.ad);
    const iliskiler = dz(t.iliskiler).map(f => ({
      kolon: String(f.kolon || ''), hedef_tablo: String(f.hedef_tablo || ''),
      hedef_kolon: String(f.hedef_kolon || ''),
    }));
    const tablo = { ad: t.ad, rls: !!t.rls, kolonlar, iliskiler };
    if (v2) {
      tablo.rls_zorunlu = !!t.rls_zorunlu;
      tablo.kisitlar = tanimli(t.kisitlar, ['ad', 'tur', 'tanim']);
      tablo.politikalar = dz(t.politikalar).map(p => ({
        ad: String(p.ad || ''), islem: String(p.islem || 'ALL'), kisitlayici: !!p.kisitlayici,
        roller: dz(p.roller).map(String),
        using: p.using === null || p.using === undefined ? null : String(p.using),
        check: p.check === null || p.check === undefined ? null : String(p.check),
      })).filter(p => p.ad);
      tablo.yetki_varsayilan = !!t.yetki_varsayilan;
      tablo.yetkiler = yt(t.yetkiler);
      tablo.tetikleyiciler = tanimli(t.tetikleyiciler, ['ad', 'tanim']);
    }
    tablolar.push(tablo);
  }
  const yapi = { nizam_security: j.nizam_security, tablolar };
  if (v2) {
    yapi.gorunumler = dz(j.gorunumler).map(g => ({
      ad: String(g.ad || ''), tanim: String(g.tanim || ''),
      secenekler: dz(g.secenekler).map(String),
      yetki_varsayilan: !!g.yetki_varsayilan, yetkiler: yt(g.yetkiler),
    })).filter(g => g.ad && g.tanim);
    yapi.tipler = dz(j.tipler).map(x => ({ ad: String(x.ad || ''), degerler: dz(x.degerler).map(String) }))
      .filter(x => x.ad);
    yapi.diziler = dz(j.diziler).map(String).filter(Boolean);
    yapi.fonksiyonlar = dz(j.fonksiyonlar).map(f => ({
      ad: String(f.ad || ''), imza: String(f.imza || ''), tanim: String(f.tanim || ''),
      anon: !!f.anon, authenticated: !!f.authenticated,
    })).filter(f => f.ad && f.tanim);
    yapi.auth_tetikleyiciler = tanimli(j.auth_tetikleyiciler, ['ad', 'tanim']);
    yapi.eklentiler = dz(j.eklentiler).map(x => ({ ad: String(x.ad || ''), sema: String(x.sema || 'extensions') }))
      .filter(x => /^[a-z0-9_-]+$/i.test(x.ad));
  }
  return { yapi };
}

/* Modelleme promptu için mevcut güvenlik tasarımının kısa özeti (yapi-2+):
   tablo başına RLS kuralları ve tetikleyiciler, yetki kontrolü yapan fonksiyonlar,
   security definer sunucu fonksiyonları. Uzun ifadeler kısaltılır. Yoksa null. */
function secGuvenlikTasarimi(yapi) {
  const kisa = (x, n = 240) => (x && x.length > n ? x.slice(0, n) + '…' : x);
  const fonk = yapi.fonksiyonlar || [];
  if (!fonk.length && !(yapi.tablolar || []).some(t => (t.politikalar || []).length || (t.tetikleyiciler || []).length)) return null;
  const yetkiFonk = new Set(fonk.filter(f => /yetki|permission|not allowed|izin verilmez|korun/i.test(f.tanim)).map(f => f.ad));
  const tablolar = (yapi.tablolar || []).map(t => {
    const o = { ad: t.ad };
    if ((t.politikalar || []).length) {
      o.rls_kurallari = t.politikalar.map(p => ({ islem: p.islem, roller: p.roller,
        using: kisa(p.using) || undefined, check: kisa(p.check) || undefined }));
    }
    const tg = (t.tetikleyiciler || []).map(x => {
      const m = /EXECUTE (?:FUNCTION|PROCEDURE)\s+(?:public\.)?"?([a-z0-9_]+)"?/i.exec(x.tanim || '');
      const zaman = /\b(BEFORE|AFTER|INSTEAD OF)\s+([A-Z ,]+?)\s+ON\b/i.exec(x.tanim || '');
      return { ad: x.ad, ne_zaman: zaman ? zaman[1] + ' ' + zaman[2].trim() : undefined,
        fonksiyon: m ? m[1] : undefined, ertelenmis: /DEFERRABLE/i.test(x.tanim || '') || undefined,
        yetki_kontrolu: m && yetkiFonk.has(m[1]) ? true : undefined };
    });
    if (tg.length) o.tetikleyiciler = tg;
    return o;
  }).filter(o => o.rls_kurallari || o.tetikleyiciler);
  const sunucu = fonk.filter(f => /SECURITY DEFINER/i.test(f.tanim)).map(f => ({ ad: f.ad, imza: kisa(f.imza, 160),
    giris_yapan_cagirabilir: f.authenticated, ziyaretci_cagirabilir: f.anon }));
  return { tablolar, sunucu_fonksiyonlari_security_definer: sunucu };
}

/* Claude'a giden modelleme promptunda yalnız tablo/kolon/ilişki/RLS yeter;
   fonksiyon gövdeleri ve kurallar promptu gereksiz büyütür. */
function secYapiOzet(yapi) {
  return {
    nizam_security: yapi.nizam_security,
    tablolar: (yapi.tablolar || []).map(t => ({
      ad: t.ad, rls: t.rls, iliskiler: t.iliskiler,
      kolonlar: t.kolonlar.map(k => ({ ad: k.ad, tip: k.tip, bos_olabilir: k.bos_olabilir, pk: k.pk })),
    })),
  };
}

/* ---------- Model okuyucu ----------
   Gerçek yapı esas: modelde veritabanında OLMAYAN tablo/kolon varsa model
   reddedilir (Claude tahmin etmiş demektir). Modelde eksik kalan tablo ve
   kolonlar serbest — ekranda "karar verilmedi" görünür. */
function secModelOku(metin, yapi, projeId) {
  const r = secJsonAl(metin, 'model');
  if (r.hata) return r;
  const j = r.json;
  const hatalar = [];

  if (Number(j.surum) !== SEC_MODEL_SURUM) return { hata: 'Bu bir Nizam Security güvenlik modeli değil (surum: 1 bekleniyor).' };
  if (j.proje && j.proje !== projeId) return { hata: 'Bu model başka bir projeye ait.' };

  const roller = Array.isArray(j.roller) ? j.roller.map(x => String(x || '').trim()).filter(Boolean) : [];
  if (!roller.length) return { hata: 'Modelde rol yok.' };
  if (new Set(roller).size !== roller.length) return { hata: 'Aynı rol iki kez yazılmış.' };
  if (roller.length > 8) return { hata: 'Çok fazla rol var (en fazla 8).' };
  const rolVar = new Set(roller);

  /* kolonlar: tablonun gerçek kolon adları (şartlı kuralın kolonu bunlardan olmalı). */
  const satirOku = (s, yer, kolonlar) => {
    const out = {};
    if (s === undefined || s === null) return out;
    if (typeof s !== 'object' || Array.isArray(s)) { hatalar.push(yer + ': satır erişimi nesne olmalı.'); return out; }
    for (const [rol, deger] of Object.entries(s)) {
      if (!rolVar.has(rol)) { hatalar.push(yer + ': tanımsız rol "' + rol + '".'); continue; }
      if (deger && typeof deger === 'object') {
        const sart = secSartOku(deger, yer + ': "' + rol + '"', kolonlar, hatalar);
        if (sart) out[rol] = sart;
        continue;
      }
      const d = String(deger || '').trim();
      if (!d) { hatalar.push(yer + ': "' + rol + '" satır erişimi boş.'); continue; }
      if (rol === SEC_ZIYARETCI_ROL && (d === 'kendi' || /kendi|şube|sube|branch/i.test(d))) {
        hatalar.push(yer + ': Ziyaretçi giriş yapmamış kişidir; "kendi" ya da "şube" kuralı olamaz (tum, yok ya da şart).'); continue;
      }
      if (d.length > 200) { hatalar.push(yer + ': "' + rol + '" satır erişimi çok uzun (' + d.length + ' karakter, en fazla 200).'); continue; }
      out[rol] = d;
    }
    return out;
  };

  const yapiTablo = {};
  (yapi.tablolar || []).forEach(t => { yapiTablo[t.ad] = t; });
  const gorulenTablo = new Set();
  const tablolar = [];

  for (const t of (Array.isArray(j.tablolar) ? j.tablolar : [])) {
    const ad = String((t && t.ad) || '');
    const gercek = yapiTablo[ad];
    if (!gercek) { hatalar.push('Veritabanında olmayan tablo: ' + (ad || '(adsız)')); continue; }
    if (gorulenTablo.has(ad)) { hatalar.push('Tablo iki kez yazılmış: ' + ad); continue; }
    gorulenTablo.add(ad);
    const gercekKolon = new Set(gercek.kolonlar.map(k => k.ad));

    let sahip = t.sahip_kolon ? String(t.sahip_kolon) : '';
    if (sahip && !gercekKolon.has(sahip)) { hatalar.push(ad + ': sahip kolonu veritabanında yok: ' + sahip); sahip = ''; }

    const gorulenKolon = new Set();
    const kolonlar = [];
    for (const k of (Array.isArray(t.kolonlar) ? t.kolonlar : [])) {
      const kad = String((k && k.ad) || '');
      if (!gercekKolon.has(kad)) { hatalar.push(ad + ': veritabanında olmayan kolon: ' + (kad || '(adsız)')); continue; }
      if (gorulenKolon.has(kad)) { hatalar.push(ad + ': kolon iki kez yazılmış: ' + kad); continue; }
      gorulenKolon.add(kad);
      const izin = {};
      const kaynak = (k.izin && typeof k.izin === 'object') ? k.izin : {};
      for (const [rol, liste] of Object.entries(kaynak)) {
        if (!rolVar.has(rol)) { hatalar.push(ad + '.' + kad + ': tanımsız rol "' + rol + '".'); continue; }
        if (!Array.isArray(liste)) { hatalar.push(ad + '.' + kad + ': "' + rol + '" izinleri liste olmalı.'); continue; }
        const yanlis = liste.filter(x => !SEC_IZINLER.includes(x));
        if (yanlis.length) { hatalar.push(ad + '.' + kad + ': bilinmeyen izin ' + yanlis.join(', ')); continue; }
        izin[rol] = SEC_IZINLER.filter(x => liste.includes(x));
      }
      kolonlar.push({ ad: kad, izin, satir: satirOku(k.satir, ad + '.' + kad, gercekKolon) });
    }
    /* yazma: rol → dogrudan | fonksiyon_ile. fonksiyon_ile = rol tabloya doğrudan yazmaz,
       işi sunucu fonksiyonu (security definer) üzerinden yapar. Varsayılan dogrudan. */
    const yazma = {};
    if (t.yazma !== undefined && t.yazma !== null) {
      if (typeof t.yazma !== 'object' || Array.isArray(t.yazma)) hatalar.push(ad + ': "yazma" nesne olmalı.');
      else {
        for (const [rol, yol] of Object.entries(t.yazma)) {
          if (!rolVar.has(rol)) { hatalar.push(ad + ': yazma — tanımsız rol "' + rol + '".'); continue; }
          if (!SEC_YAZMA_YOLLARI.includes(yol)) { hatalar.push(ad + ': yazma — "' + rol + '" için ' + SEC_YAZMA_YOLLARI.join(' / ') + ' olmalı.'); continue; }
          if (yol !== 'dogrudan') yazma[rol] = yol;
        }
      }
    }
    tablolar.push(Object.assign({ ad, sahip_kolon: sahip || undefined, satir: satirOku(t.satir, ad, gercekKolon), kolonlar },
      Object.keys(yazma).length ? { yazma } : {}));
  }

  if (hatalar.length) {
    return { hata: 'Model gerçek veritabanı yapısıyla uyuşmuyor:', ayrinti: hatalar.slice(0, 20) };
  }
  if (!tablolar.length) return { hata: 'Modelde hiç tablo yok.' };
  return { model: { surum: SEC_MODEL_SURUM, proje: projeId, roller, tablolar } };
}

/* Şartlı satır kuralını doğrular; hatada null döner ve hatalar'a yazar. */
function secSartOku(d, yer, kolonlar, hatalar) {
  if (Array.isArray(d)) { hatalar.push(yer + ': satır kuralı liste olamaz.'); return null; }
  const kolon = String(d.kolon || '');
  if (!kolon) { hatalar.push(yer + ': şartta "kolon" yok.'); return null; }
  if (!kolonlar.has(kolon)) { hatalar.push(yer + ': şart kolonu veritabanında yok: ' + kolon); return null; }
  if (!SEC_KOSULLAR.includes(d.kosul)) { hatalar.push(yer + ': bilinmeyen koşul "' + d.kosul + '" (' + SEC_KOSULLAR.join(', ') + ').'); return null; }
  const liste = d.kosul === 'icinde' || d.kosul === 'icinde_degil';
  let deger;
  if (liste) {
    if (!Array.isArray(d.deger) || !d.deger.length) { hatalar.push(yer + ': "' + d.kosul + '" için "deger" boş olmayan bir liste olmalı.'); return null; }
    if (d.deger.some(x => x === null || typeof x === 'object')) { hatalar.push(yer + ': "deger" listesinde yalnız metin/sayı olmalı.'); return null; }
    deger = d.deger.map(String);
  } else {
    if (d.deger === null || d.deger === undefined || typeof d.deger === 'object') { hatalar.push(yer + ': "' + d.kosul + '" için "deger" tek bir metin/sayı olmalı.'); return null; }
    deger = String(d.deger);
  }
  const aciklama = String(d.aciklama || '').trim().slice(0, 200);
  return aciklama ? { kolon, kosul: d.kosul, deger, aciklama } : { kolon, kosul: d.kosul, deger };
}

/* ==========================================================================
   CLAUDE PROMPTU
   ========================================================================== */

function secPrompt(p, yapi) {
  const roller = rolListesi((p.palet || {}).roller);
  const ornek = {
    surum: 1, proje: p.id,
    roller: ['Yönetici', 'Personel'],
    tablolar: [{
      ad: 'personeller', sahip_kolon: 'kullanici_id',
      satir: { 'Yönetici': 'tum', 'Personel': 'kendi' },
      kolonlar: [
        { ad: 'isim', izin: { 'Yönetici': ['oku', 'ekle', 'degistir', 'sil'], 'Personel': ['oku'] },
          satir: { 'Personel': 'tum' } },
        { ad: 'maas', izin: { 'Yönetici': ['oku', 'ekle', 'degistir', 'sil'], 'Personel': ['oku'] } },
      ],
    }],
  };
  const s = [];
  s.push('# NIZAM Security — Erişim kuralları görüşmesi');
  s.push('');
  s.push('Bu programın veritabanı için **olması istenen** erişim kurallarını benimle birlikte belirleyeceksin.');
  s.push('Bu bir görüşme: soru sor, cevaplarıma göre güvenlik modelini kur, en sonda tek bir JSON ver.');
  s.push('');
  s.push('## Proje');
  s.push('- Ad: ' + projeAdi(p));
  if (p.platform) s.push('- Platform: ' + p.platform);
  if (roller.length) s.push('- Studio\'daki rol listesi (öneri): ' + roller.join(', '));
  if (p.repo) s.push('- Repo: ' + p.repo + ' (yalnız bağlam için; tablo/kolon bilgisi için repoya değil aşağıdaki yapıya bak)');
  s.push('');
  s.push('## Kurallar');
  s.push('- **Yalnız aşağıdaki gerçek yapıdaki tablo ve kolonları kullan.** Tablo/kolon uydurma, adını değiştirme, tahmin etme.');
  s.push('- Kod yazma, SQL ya da RLS politikası yazma, test yapma. Bu aşamada yalnız istenen davranışı belirliyoruz.');
  s.push('- Yapıdaki `rls` alanı veritabanının ŞU ANKİ durumu. "RLS açık" güvenli demek değildir; kararlarını buna göre verme.');
  s.push('- Sade Türkçe konuş, teknik terim kullanma. Kısa sorular sor.');
  s.push('');
  s.push('## Görüşme nasıl ilerlesin');
  s.push('1. Önce rolleri netleştir (bu programı kimler kullanıyor?). Yapıdan çıkarabiliyorsan öner, onaylat.');
  s.push('2. Genel kuralı bir kez sor (ör. "Yönetici her tabloda her şeyi yapabilsin mi?"). Her tabloda tekrar sorma.');
  s.push('3. Sonra tablo tablo ilerle: her mesajda bir tablo, yalnız gerçekten karar gerektiren soruları numaralı ve toplu sor.');
  s.push('   Örnek: "Personel diğer personelleri görebilsin mi?", "Maaş bilgisini görebilsin mi?", "Ürün adedini değiştirebilsin mi?"');
  s.push('4. Satır erişimini (hangi satırları görebilir) kolon izinlerinden AYRI sor.');
  s.push('   "Kendi satırı" için satırı kullanıcıya bağlayan kolonu yapıdan bul (ör. auth.users\'a giden ilişki); bulamazsan bana sor.');
  s.push('5. Bir kez sor: "Giriş yapmamış biri (ziyaretçi) herhangi bir şeyi görebilsin mi?" Varsayılan cevap: hiçbir şey.');
  s.push('   Yalnız herkese açık bir şey varsa (ör. web sitesindeki ürün listesi) hangi tablo ve kolonlar olduğunu sor.');
  s.push('6. Log, ayar gibi yardımcı tabloları tek soruda topluca geç.');
  s.push('7. Aşağıda veritabanının ŞU ANKİ güvenlik tasarımı var (RLS kuralları, yetki kontrolü yapan tetikleyiciler, sunucu fonksiyonları).');
  s.push('   İstediğim bir kural bu tasarımla çatışıyorsa (ör. "Muhasebeci yazsın" diyorum ama tabloya doğrudan yazma yalnız en üst role açık,');
  s.push('   diğerleri bir sunucu fonksiyonuyla yazıyor) bunu bana sade dille söyle ve sor: "Modeli mi değiştirelim, veritabanını mı?"');
  s.push('   Rol işi fonksiyonla yapıyorsa `yazma` alanında `fonksiyon_ile` yaz.');
  s.push('8. Bitince kısa bir özet göster, onayımı al, sonra JSON\'u ver.');
  s.push('');
  s.push('## Son çıktı');
  s.push('Son mesajında yalnız tek bir ```json bloğu ver. Biçim:');
  s.push('```json');
  s.push(JSON.stringify(ornek, null, 2));
  s.push('```');
  s.push('- `surum`: her zaman 1. `proje`: aynen "' + p.id + '".');
  s.push('- `roller`: rol adları. Bütün izin ve satır kuralları bu adlarla yazılır.');
  s.push('- `' + SEC_ZIYARETCI_ROL + '` ayrılmış rol adıdır = giriş yapmamış kişi. Ziyaretçi hiçbir şey göremiyorsa bu rolü HİÇ yazma (varsayılan: her şey kapalı).');
  s.push('  Bir şey görebiliyorsa `roller`a "' + SEC_ZIYARETCI_ROL + '" ekle; yalnız açık olan kolonlara izin ver, satır kuralı `tum`, `yok` ya da şart olsun (`kendi`/şube olamaz).');
  s.push('- `izin`: her rol için `oku`, `ekle`, `degistir`, `sil` listesinin alt kümesi. Boş liste = hiçbir yetki yok.');
  s.push('- `sil` = o satırı silebilme yetkisi. Bir rol tabloda satır silebiliyorsa o tablonun bütün kolonlarında `sil` yaz.');
  s.push('- Tablodaki `satir`: her rolün varsayılan satır erişimi. Değerler: `tum` (tüm satırlar), `kendi` (kendi satırı), `yok` (hiçbiri)');
  s.push('  ya da kısa bir açıklama (ör. "Kendi şubesinin satırları", "Tüm ürünler"). Açıklama en fazla 60 karakter olsun;');
  s.push('  hangi işlemi yapabildiği satır kuralına değil kolon izinlerine (`izin`) yazılır.');
  s.push('- **Satır kuralı bir kolonun değerine bağlıysa düz metin YAZMA, şart nesnesi yaz.** Biçim:');
  s.push('  `{"kolon": "tablo_adi", "kosul": "esit_degil", "deger": "kullanicilar", "aciklama": "Kullanıcı kayıtları hariç tümü"}`');
  s.push('  `kosul`: `esit`, `esit_degil`, `icinde` (deger liste), `icinde_degil` (deger liste). `kolon` o tablonun gerçek kolonu olmalı.');
  s.push('  Şartı sağlayan satırları rol görür, sağlamayanları göremez. Nizam bu şartı otomatik test eder.');
  s.push('- Düz metin kural yalnız gerçekten şarta çevrilemiyorsa kalsın; o zaman bana "bu kural otomatik test edilemeyecek" de.');
  s.push('- Kolondaki `satir`: YALNIZ o kolon varsayılandan farklıysa yaz (ör. isim herkese açık, maaş yalnız kendi satırında). Gereksiz yere her kolona yazma.');
  s.push('- `sahip_kolon`: "kendi satırı" kuralı varsa satırı kullanıcıya bağlayan kolon; yoksa yazma.');
  s.push('- `yazma` (isteğe bağlı): rol → `dogrudan` ya da `fonksiyon_ile`. `fonksiyon_ile` = bu rol tabloya DOĞRUDAN yazmaz;');
  s.push('  ekleme/değiştirme/silmeyi ekrandaki bir sunucu fonksiyonu (security definer) üzerinden yapar. O zaman tabloya doğrudan');
  s.push('  yazması reddedilmeli; Nizam bunu böyle test eder. `izin` yine rolün iş olarak neyi yapabildiğini gösterir. Varsayılan `dogrudan`, yazmana gerek yok.');
  s.push('  Örnek: `"yazma": {"Muhasebeci": "fonksiyon_ile"}`');
  s.push('- Gerçek yapıdaki her tabloyu ve her kolonu yaz; karar verilmeyen bir şey kalırsa bana sor.');
  s.push('');
  const tasarim = secGuvenlikTasarimi(yapi);
  if (tasarim) {
    s.push('## Veritabanının şu anki güvenlik tasarımı (bilgi için — "olması istenen" değil)');
    s.push('```json');
    s.push(JSON.stringify(tasarim));
    s.push('```');
    s.push('');
  }
  s.push('## Gerçek veritabanı yapısı (SQL Editor çıktısı)');
  s.push('```json');
  s.push(JSON.stringify(secYapiOzet(yapi)));
  s.push('```');
  s.push('');
  s.push('Hazırsan ilk sorularınla başla.');
  return s.join('\n');
}

/* ==========================================================================
   EKRANLAR
   ========================================================================== */

function secYukle(anahtar, isFn) {
  if (SEC.yukleniyor[anahtar]) return;
  SEC.yukleniyor[anahtar] = true;
  Promise.resolve().then(isFn).catch(h => { toast('Yüklenemedi: ' + (h.message || h), 'hata'); })
    .finally(() => { SEC.yukleniyor[anahtar] = false; render(); });
}

function secProjeler() {
  return (DB.projeler || []).filter(p => !cekirdekMi(p) && sunuculuMu(p));
}

function secTarih(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const ay = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  return d.getDate() + ' ' + ay[d.getMonth()];
}

function securityEkran() {
  if (YUKLENIYOR) return iskeletler(3);
  if (DB.hata)    return hataKutusu(DB.hata);
  if (!AUTH.yonetici) {
    return `<div class="card">${empty(ICON.gGuvenlik, 'Bu ekran yöneticiye ait',
      'Nizam Security\'yi yalnızca yönetici görebilir.')}</div>`;
  }
  const r = rota();
  return r.id ? secSihirbaz(r.id, r.durak) : secListeEkran();
}

/* ---------- Proje seç ---------- */
function secListeEkran() {
  if (SEC.liste === null) {
    secYukle('liste', async () => { SEC.liste = await SEC_VERI.listeGetir(); });
    return iskeletler(3);
  }
  const projeler = secProjeler();
  const durum = pid => {
    const k = SEC.liste.find(x => x.proje_id === pid);
    if (!k || !k.yapi_tarihi) return 'Başlanmadı';
    if (!k.model_tarihi) return 'Yapı alındı · model bekleniyor';
    return 'Erişim kuralları hazır · ' + secTarih(k.model_tarihi);
  };
  const kartlar = projeler.map(p => `
    <a class="lk" href="#/security/${esc(p.id)}">
      <span class="lk-ikon">${svg(ICON.gGuvenlik, 26)}</span>
      <span class="lk-yz">
        <b>${esc(basHarfleriBuyuk(projeAdi(p)))}</b>
        <i>${esc(p.platform || '')}</i>
        <em>${esc(durum(p.id))}</em>
      </span>
      <span class="lk-ok">${svg(ICON.chevron, 18)}</span>
    </a>`).join('');
  return `
    <div class="pj-tepe"><div class="pj-tepe-yz">
      <h1>Nizam Security</h1>
      <p>Proje seç; gerçek veritabanı yapısından istenen erişim kurallarını oluştur.</p>
    </div></div>
    ${projeler.length ? `<div class="lk-liste">${kartlar}</div>`
      : `<div class="card">${empty(ICON.gGuvenlik, 'Sunuculu proje yok',
          'Nizam Security, veritabanı olan (Supabase\'li) projelerde çalışır.')}</div>`}`;
}

/* ---------- Proje → kurulum sihirbazı ----------
   Dokuz adım tek sırada: #/security/<id>/<1–9>. Adres adımsızsa ilk eksik
   adım açılır. Şimdilik kilit yok: her adıma geçilebilir. */
const SEC_ADIMLAR = [
  { ad: 'Gerçek yapı', kisa: 'Production veritabanı analizi', ikon: '🗄️', aciklama: 'Studio, gerçek veritabanının tablolarını, kolonlarını ve kurallarını okur. Hiçbir müşteri verisi alınmaz.' },
  { ad: 'Olması gereken güvenlik', kisa: 'Roller, tablolar ve yetkiler', ikon: '🤖', aciklama: 'Claude, gerçek yapına bakıp hangi rolün neyi görüp değiştirebileceğini yazar.' },
  { ad: 'Test projesi', kisa: 'Ayrı test veritabanı', ikon: '🔌', aciklama: 'Testler gerçek veritabanında değil, ayrı bir test projesinde çalışır. Bir kez bağlanır, her proje kullanır.' },
  { ad: 'Test kurulumu', kisa: 'İzole kopya', ikon: '🏗️', aciklama: 'Gerçek yapının bir kopyası test projesine kurulur.' },
  { ad: 'Test kullanıcıları', kisa: 'Her rol için hesaplar', ikon: '👥', aciklama: 'Her rol için gerçekten giriş yapabilen test hesapları açılır.' },
  { ad: 'Sahte veri', kisa: 'Deneme kayıtları', ikon: '🧪', aciklama: 'Test veritabanına, testlerin deneyeceği sahte kayıtlar eklenir. Gerçek müşteri verisi kullanılmaz.' },
  { ad: 'Tarama', kisa: 'Okuma, yazma ve ziyaretçi testleri', ikon: '🛡️', aciklama: 'Test kullanıcıları ve giriş yapmamış bir ziyaretçi; okumayı, eklemeyi, değiştirmeyi ve silmeyi dener.' },
  { ad: 'Düzelt ve doğrula', kisa: 'Göç dosyaları ve tekrar test', ikon: '🔧', aciklama: 'Açıkları Claude\'a bildir, göç dosyalarını önce teste sonra gerçeğe uygula, yeniden tara.' },
  { ad: 'Teslim öncesi kontrol', kisa: 'Son güvenlik adımları', ikon: '✅', aciklama: 'Taramanın göremediği beş şeyi son kez kontrol et.' },
];

/* Her adım için: bitti mi, durum yazısı. */
function secAdimDurum(projeId) {
  const k = SEC.kayit[projeId] || {};
  const o = SEC_TEST.kayit[projeId] || {};
  const yapi = k.yapi && Array.isArray(k.yapi.tablolar) ? k.yapi : null;
  const model = yapi && k.model && Array.isArray(k.model.tablolar) ? k.model : null;
  const t = yapi && model ? secTestParcalar(projeId) : null;   // security-test.js
  const kt = t && t.kartlar ? t.kartlar : [];
  const { hepsi } = secTumSonuclar(projeId);                  // security-okuma.js
  const acik = hepsi.filter(x => x.sonuc !== 'gecti').length;
  const kusursuz = secKusursuzMu(projeId);
  const tm = secTeslimMaddeler(projeId), ti = secTeslimIsaret(projeId);
  const tBiten = tm.filter(x => x.otomatik || ti[x.id]).length;
  return [
    { bitti: !!yapi, yazi: yapi ? yapi.tablolar.length + ' tablo · ' + secTarih(k.yapi_tarihi) : '' },
    { bitti: !!model, yazi: model ? (yapi.tablolar.length) + ' tablo · ' + model.roller.length + ' rol · ' + secTarih(k.model_tarihi) : '' },
    { bitti: !!(kt[0] && kt[0].bitti), yazi: kt[0] ? kt[0].rozet : '' },
    { bitti: !!(kt[1] && kt[1].bitti), yazi: kt[1] ? kt[1].rozet : '' },
    { bitti: !!(kt[2] && kt[2].bitti), yazi: kt[2] ? kt[2].rozet : '' },
    { bitti: !!(kt[3] && kt[3].bitti), yazi: kt[3] ? kt[3].rozet : '' },
    { bitti: hepsi.length > 0, yazi: hepsi.length ? hepsi.length + ' test · ' + acik + ' sorun' : '' },
    { bitti: kusursuz, yazi: kusursuz ? 'Açık yok, yapılar aynı' : hepsi.length ? acik + ' sorun' : '' },
    { bitti: tBiten === tm.length, yazi: tBiten + ' / ' + tm.length + ' madde' },
  ];
}

function secSihirbaz(projeId, durak) {
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
  const durumlar = secAdimDurum(projeId);
  /* Sayfalar: ana ekran · ayarlar (1–6) · duzelt (8) · teslim (9) · acik/<sıra>.
     Eski adresler (sayılı adımlar, /test, /testler) karşılıklarına düşer. */
  const eski = { test: 'ayarlar', testler: '', 7: '', 8: 'duzelt', 9: 'teslim' };
  let sayfa = durak || '';
  if (/^[1-6]$/.test(sayfa)) sayfa = 'ayarlar';
  else if (sayfa in eski) sayfa = eski[sayfa];
  let ic;
  if (sayfa === 'acik') ic = secAcikDetay(projeId, Number((location.hash || '').split('/')[4]));   // security-okuma.js
  else if (sayfa === 'ayarlar') ic = secAyarlarSayfa(projeId, durumlar);
  else if (sayfa === 'duzelt') ic = secTekSayfa(projeId, 8, secDuzeltIcerik(projeId));
  else if (sayfa === 'teslim') ic = secTekSayfa(projeId, 9, secTeslimHtml(projeId));
  else ic = secAnaSayfa(projeId, durumlar);
  return `<div class="secv">${ic}</div>`;
}

/* Düzelt / Teslim gibi tek iş sayfası: geri düğmeli başlık + içerik. */
function secTekSayfa(projeId, n, icerik) {
  const a = SEC_ADIMLAR[n - 1];
  const ok = svg(ICON.chevron, 15);
  return `
    <div class="secv-ust">
      <a class="secv-geri" href="#/security/${esc(projeId)}" aria-label="Ana ekrana dön">${ok}</a>
      <div class="secv-ust-yz"><h1>${esc(a.ad)}</h1><p>${esc(a.aciklama)}</p></div>
    </div>
    ${icerik}
    <div class="dsa sec-dsa"><a class="dsa-btn geri" href="#/security/${esc(projeId)}">${ok} Ana ekran</a><span></span><span></span></div>`;
}

/* Taramadan önce bir kez yapılan 6 ayar, tek sayfada. Bitmemişler açık gelir. */
function secAyarlarSayfa(projeId, durumlar) {
  const ok = svg(ICON.chevron, 15);
  const acik = SEC.ayar_ac[projeId] || {};
  const biten = durumlar.slice(0, 6).filter(x => x.bitti).length;
  const ilk = durumlar.slice(0, 6).findIndex(x => !x.bitti);
  const bolum = (x, i) => {
    const d = durumlar[i];
    const ac = acik[i + 1] !== undefined ? acik[i + 1] : !d.bitti && i === ilk;
    return `
      <div class="secv-ayar ${d.bitti ? 'bitti' : i === ilk ? 'simdi' : ''}${ac ? ' acik' : ''}">
        <button class="secv-adim" type="button" data-eylem="sec-ayar-ac" data-id="${esc(projeId)}" data-n="${i + 1}" data-ac="${ac}">
          <span class="secv-adim-no">${i + 1}</span>
          <span class="secv-adim-yz"><b>${esc(x.ad)}</b><i>${esc(d.yazi || x.kisa)}</i></span>
          <span class="secv-adim-s">${d.bitti ? `<i class="secv-tik">${SEC_TIK}</i>` : ac ? '⌄' : '›'}</span>
        </button>
        ${ac ? `<div class="secv-ayar-ic"><p class="secv-ayar-acik">${esc(x.aciklama)}</p>${secAdimIcerik(projeId, i + 1)}</div>` : ''}
      </div>`;
  };
  return `
    <div class="secv-ust">
      <a class="secv-geri" href="#/security/${esc(projeId)}" aria-label="Ana ekrana dön">${ok}</a>
      <div class="secv-ust-yz"><h1>Proje ayarları</h1>
        <p>Taramadan önce bir kez yapılır. <b>${biten} / 6 tamam</b>${biten < 6 ? ' · ' + (6 - biten) + ' eksik' : ''}</p></div>
    </div>
    <div class="secv-cubuk">${durumlar.slice(0, 6).map((x, i) => `<i class="${x.bitti ? 'bitti' : i === ilk ? 'su' : ''}"></i>`).join('')}</div>
    <div class="secv-adimlar">${SEC_ADIMLAR.slice(0, 6).map(bolum).join('')}</div>
    ${biten === 6 ? `<a class="secv-buyuk" href="#/security/${esc(projeId)}">Taramaya geç ›</a>` : ''}`;
}

/* Projenin Security ana ekranı: kahraman kart, durum, sayılar, tarama düğmesi,
   "Proje ayarlarını kur", sıradaki iş ve sonuçlar. */
const SEC_KALKAN = `<svg viewBox="0 0 120 140" width="104" height="122" aria-hidden="true">
  <defs><linearGradient id="seck-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6a5e"/><stop offset="1" stop-color="#c81f16"/></linearGradient></defs>
  <path d="M60 4 L112 22 V66 C112 100 90 124 60 136 C30 124 8 100 8 66 V22 Z" fill="url(#seck-g)"/>
  <path d="M60 18 L100 32 V66 C100 93 83 112 60 122 C37 112 20 93 20 66 V32 Z" fill="#fff"/>
  <text x="60" y="88" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-weight="700" font-size="52" fill="#c81f16">N</text>
</svg>`;

function secAnaSayfa(projeId, durumlar) {
  const p = DB.proje(projeId);
  const o = SEC_TEST.kayit[projeId] || {};
  const hero = `
    <a class="tl-geri" href="#/security">${svg(ICON.chevron, 14)} Nizam Security</a>
    <div class="secv-hero">
      <div class="secv-hero-yz"><h1>${esc(basHarfleriBuyuk(projeAdi(p)))}</h1><p>Güvenli, sağlam ve kontrol altında.</p></div>
      <span class="secv-kalkan">${SEC_KALKAN}</span>
    </div>`;
  /* Tarama sürerken yalnız ilerleme. */
  const calisiyor = !!SEC_OKUMA.calisiyor[projeId] || (typeof SEC_YAZMA !== 'undefined' && !!SEC_YAZMA.calisiyor[projeId]);
  if (calisiyor) return hero + secTaramaEkran(projeId);   // security-okuma.js

  const kisiSay = (o.kullanicilar || []).filter(x => x.kimlik).length;
  const biten = durumlar.slice(0, 6).filter(x => x.bitti).length;
  const hazir = biten === 6;
  const engel = hazir ? secUretimAyriMi(p, o) : 'Önce proje ayarlarını tamamla (' + (6 - biten) + ' eksik).';
  const kur = `
    <a class="secv-kur${hazir ? ' tamam' : ''}" href="#/security/${esc(projeId)}/ayarlar">
      <span class="secv-kur-ik">⚙️</span>
      <span class="secv-adim-yz"><b>Proje ayarlarını kur</b>
        <i>${hazir ? '6 / 6 tamam · değiştirmek için dokun' : biten + ' / 6 tamam · ' + (6 - biten) + ' eksik'}</i></span>
      <span class="secv-adim-s">${hazir ? `<i class="secv-tik">${SEC_TIK}</i>` : '›'}</span>
    </a>`;

  /* Sıradaki iş: sorun varsa Düzelt, yoksa Teslim kontrolü. */
  const { s, y, hepsi } = secTumSonuclar(projeId);
  const sorun = hepsi.filter(x => x.sonuc !== 'gecti').length;
  const yfSay = typeof secFarkSay === 'function' ? secFarkSay(secGuncelFark(projeId)) : null;
  const tm = secTeslimMaddeler(projeId), ti = secTeslimIsaret(projeId);
  const tBiten = tm.filter(x => x.otomatik || ti[x.id]).length;
  const sonraki = !hepsi.length ? ''
    : sorun || yfSay ? `<a class="secv-buyuk" href="#/security/${esc(projeId)}/duzelt">🔧 Düzelt${sorun ? ' · ' + sorun + ' sorun' : ' · ' + yfSay + ' yapı farkı'}</a>`
    : s && y ? `<a class="secv-buyuk yesil" href="#/security/${esc(projeId)}/teslim">✅ Teslim kontrolü · ${tBiten} / ${tm.length}</a>` : '';

  return hero + secPano(projeId, engel, kisiSay) + kur + sonraki + secOkumaSonuclar(projeId);
}

/* Numaralı yapılacaklar listesi: [[metin, alt, düğmeler], …] */
function secYapilacak(maddeler) {
  return `<ol class="sec-yap">${maddeler.map((m, i) => `
    <li><span class="sec-yap-no">${i + 1}</span><div><b>${m[0]}</b>${m[1] ? `<small>${m[1]}</small>` : ''}
      ${m[2] ? `<div class="sec-t-dg">${m[2]}</div>` : ''}</div></li>`).join('')}</ol>`;
}

function secAdimIcerik(projeId, n) {
  const k = SEC.kayit[projeId] || {};
  const yapi = k.yapi && Array.isArray(k.yapi.tablolar) ? k.yapi : null;
  const model = yapi && k.model && Array.isArray(k.model.tablolar) ? k.model : null;
  const dug = (yazi, eylem, ana = false, kapali = false) =>
    `<button class="sec-dug${ana ? ' ana' : ''}" type="button" data-eylem="${eylem}" data-id="${esc(projeId)}"
       ${kapali ? 'disabled' : ''}>${esc(yazi)}</button>`;

  if (n === 1) {
    return secYapilacak([
      ['Yapı SQL\'ini kopyala, gerçek veritabanının SQL Editor\'ünde çalıştır, çıkan sonucu yapıştır',
        'Açılan pencerede SQL\'i kopyalama düğmesi de var.', dug(yapi ? 'Yenile' : 'Başla', 'sec-yapi', !yapi)],
    ]) + (yapi && yapi.nizam_security !== SEC_YAPI_SURUM
      ? `<div class="sec-uyari">⚠️ Yapı SQL'i güncellendi; testler için "Yenile" ile yeniden al.</div>` : '');
  }
  if (n === 2) {
    if (!yapi) return `<div class="card">${empty(ICON.gGuvenlik, 'Önce 1. adım', 'Claude, gerçek yapıya bakarak yazar.')}</div>`;
    return secYapilacak([
      ['Promptu kopyala, Claude\'a yapıştır', 'Claude birkaç soru sorabilir, cevapla.', dug('📋 Promptu kopyala', 'sec-prompt', !model)],
      ['Claude\'un verdiği JSON\'u yapıştır', '', dug(model ? 'Yeni JSON yapıştır' : 'JSON yapıştır', 'sec-model')],
    ]) + (model ? secKurallar(yapi, model, projeId) : '');
  }
  if (n >= 3 && n <= 6) {
    const t = secTestParcalar(projeId);   // security-test.js
    if (t.hata) return t.hata;
    const kr = t.kartlar[n - 3];
    return (n === 3 && t.kalkan ? `<p class="sec-t-ipucu">${t.kalkan}</p>` : '')
      + (n === 4 ? secTestSema(projeId) : '')
      + `<div class="sec-sb-kart">${kr.govde}<div class="sec-t-dg">${kr.dugmeler}</div></div>`;
  }
  if (n === 7) return secOkumaGovde(projeId);   // security-okuma.js
  if (n === 8) return secDuzeltIcerik(projeId);
  return secTeslimHtml(projeId);                 // security-okuma.js
}

/* 8. adım: hataları bildir → göç → teste uygula, tara → gerçeğe uygula, yenile. */
function secDuzeltIcerik(projeId) {
  const { hepsi } = secTumSonuclar(projeId);
  const sorun = hepsi.filter(x => x.sonuc !== 'gecti').length;
  const t = secTestParcalar(projeId);
  const dug = (yazi, eylem, ana = false, kapali = false) =>
    `<button class="sec-dug${ana ? ' ana' : ''}" type="button" data-eylem="${eylem}" data-id="${esc(projeId)}"
       ${kapali ? 'disabled' : ''}>${esc(yazi)}</button>`;
  const yap = secYapilacak([
    ['Sorunları Claude\'a bildir', hepsi.length ? (sorun ? sorun + ' 🔴/🟡 sonuç projenin Claude sohbeti için kopyalanır.' : 'Bildirilecek sorun yok 🎉') : 'Önce 7. adımda tara.',
      dug('📋 Hataları bildir' + (sorun ? ' (' + sorun + ')' : ''), 'sec-o-y-rapor', !!sorun, !sorun)],
    ['Claude\'un yazdığı göç dosyalarını önce test veritabanına uygula ve yeniden tara', '',
      `<a class="sec-dug" href="#/security/${esc(projeId)}">Ana ekrana git, yeniden tara</a>`],
    ['Aynı göçleri gerçek veritabanına uygula, sonra gerçek yapıyı yenile', 'Damga 🟢 olur: test ile gerçek aynı yapıda.',
      dug('Gerçek yapıyı yenile', 'sec-yapi')],
  ]);
  const kusursuz = secKusursuzMu(projeId);
  return yap + (kusursuz ? `<div class="secv-kusursuz"><span>${SEC_TIK}</span><div><b>Kusursuz — açık yok</b>
      <i>Tüm testler geçti, iki yapı aynı.</i></div></div>` : '')
    + (t.hata ? '' : (t.yfSay ? t.farkHtml : '') + t.yedek);
}

/* 4. adım: gerçek → izole kopya → test ortamı akışı ve kurulum maddeleri. */
const SEC_DB = r => `<svg viewBox="0 0 40 46" width="34" height="40" aria-hidden="true"><g fill="${r ? '#e5342a' : '#56565c'}">
  <ellipse cx="20" cy="8" rx="16" ry="6"/><path d="M4 12c0 3.3 7.2 6 16 6s16-2.7 16-6v8c0 3.3-7.2 6-16 6S4 23.3 4 20z"/>
  <path d="M4 24c0 3.3 7.2 6 16 6s16-2.7 16-6v8c0 3.3-7.2 6-16 6S4 35.3 4 32z"/></g></svg>`;
function secTestSema(projeId) {
  const p = DB.proje(projeId);
  const k = SEC.kayit[projeId] || {};
  const o = SEC_TEST.kayit[projeId] || {};
  const d = secAdimDurum(projeId);
  const yapi = k.yapi || { tablolar: [] };
  const kural = yapi.tablolar.reduce((n, t) => n + (t.politikalar || []).length, 0);
  const kisiSay = (o.kullanicilar || []).filter(x => x.kimlik).length;
  const kutu = (ikon, ad, durum, ok, alt) => `
    <div class="secv-db"><span class="secv-db-ik">${ikon}</span>
      <div><b>${esc(ad)}</b><i class="${ok ? 'ok' : ''}">● ${esc(durum)}</i><small>${esc(alt)}</small></div></div>`;
  const madde = (ad, alt, ok) => `<div class="secv-cl${ok ? ' ok' : ''}"><span>${ok ? SEC_TIK : ''}</span>
    <div><b>${esc(ad)}</b><i>${esc(alt)}</i></div></div>`;
  return `
    <div class="secv-sema">
      <div class="secv-akis">
        ${kutu(SEC_DB(false), 'Production', d[0].bitti ? 'Okundu' : 'Bekliyor', d[0].bitti, (secKisalt(secUretimRef(p) || '?', 4, 4)) + '.supabase.co')}
        <span class="secv-ok">↓</span>
        ${kutu('📄', 'İzole kopya', d[3].bitti ? 'Kuruldu' : 'Bekliyor', d[3].bitti, 'Gerçek yapının kopyası, gerçek veri yok')}
        <span class="secv-ok">↓</span>
        ${kutu(SEC_DB(true), 'Test ortamı', d[2].bitti ? (d[3].bitti ? 'Hazır' : 'Bağlı') : 'Bağlanmadı', d[2].bitti && d[3].bitti,
          o.test_ref ? secKisalt(o.test_ref, 4, 4) + '.supabase.co' : '—')}
      </div>
      <div class="secv-cl-liste">
        ${madde('Şema', yapi.tablolar.length + ' tablo', d[3].bitti)}
        ${madde('RLS kuralları', kural + ' kural', d[3].bitti)}
        ${madde('Fonksiyonlar', (yapi.fonksiyonlar || []).length + ' fonksiyon', d[3].bitti)}
        ${madde('Kullanıcılar', kisiSay + ' test kullanıcısı', d[4].bitti)}
        ${madde('Sahte veri', d[5].bitti ? 'Hazır' : 'Bekliyor', d[5].bitti)}
      </div>
    </div>`;
}

function secSatirAd(d) {
  if (!d) return '—';
  if (secSartMi(d)) {
    const deger = Array.isArray(d.deger) ? d.deger.join(', ') : d.deger;
    return (d.aciklama ? d.aciklama + ' · ' : '') + d.kolon + ' ' + (SEC_KOSUL_AD[d.kosul] || d.kosul) + ' ' + deger;
  }
  return SEC_SATIR_AD[d] || d;
}

/* Gerçek yapı + istenen model → kapalı tablo listesi. Yapının sırası esas.
   Dokunulan tablo açılır; içinde rol seçilir, kolonlar o rol için gösterilir. */
function secKurallar(yapi, model, projeId) {
  const roller = model.roller;
  const mTablo = {};
  model.tablolar.forEach(t => { mTablo[t.ad] = t; });

  /* Yapı yenilendikten sonra modelde kalıp veritabanından kalkanlar. */
  const kayip = [];
  model.tablolar.forEach(t => {
    const g = yapi.tablolar.find(x => x.ad === t.ad);
    if (!g) { kayip.push(t.ad); return; }
    const gk = new Set(g.kolonlar.map(x => x.ad));
    t.kolonlar.forEach(c => { if (!gk.has(c.ad)) kayip.push(t.ad + '.' + c.ad); });
  });

  const tablolar = yapi.tablolar.filter(t => mTablo[t.ad]);
  const kararsiz = yapi.tablolar.filter(t => !mTablo[t.ad]).map(t => t.ad);
  const acik = SEC.acik[projeId] || {};
  const rol = roller.includes(SEC.rol[projeId]) ? SEC.rol[projeId] : roller[0];
  const ara = SEC.ara[projeId] || '';
  const q = ara.trim().toLocaleLowerCase('tr');

  const satirlar = tablolar.map(t => {
    const ac = !!acik[t.ad];
    return `
    <div class="sec-tb${ac ? ' acik' : ''}" data-ad="${esc(t.ad)}"${q && t.ad.toLocaleLowerCase('tr').indexOf(q) < 0 ? ' hidden' : ''}>
      <button class="sec-tb-bas" type="button" data-eylem="sec-tablo" data-id="${esc(projeId)}" data-ad="${esc(t.ad)}" aria-expanded="${ac}">
        <code>${esc(t.ad)}</code>
        <span class="sec-tb-rls${t.rls ? '' : ' kapali'}">${t.rls ? 'RLS' : 'RLS kapalı'}</span>
        <small>${t.kolonlar.length} kolon</small>
        <span class="sec-tb-ok">${ac ? '⌄' : '›'}</span>
      </button>
      ${ac ? secTabloIc(t, mTablo[t.ad], roller, rol, projeId) : ''}
    </div>`;
  }).join('');

  return `
    ${kayip.length ? `<div class="sec-uyari">⚠️ Modelde var ama veritabanında artık yok:
      ${kayip.map(x => `<code>${esc(x)}</code>`).join(' ')} — Claude ile modeli güncelle.</div>` : ''}
    <h3 class="sec-bas sec-bas-say">Tablolar <span>${tablolar.length}</span></h3>
    <input class="sec-ara" type="search" data-id="${esc(projeId)}" value="${esc(ara)}" placeholder="Tablo ara…" autocomplete="off">
    <div class="sec-tb-liste">${satirlar}</div>
    ${kararsiz.length ? `<div class="sec-kararsiz"><b>Karar verilmemiş tablolar:</b>
      ${kararsiz.map(x => `<code>${esc(x)}</code>`).join(' ')}</div>` : ''}`;
}

/* Açık tablonun içi: rol seçici, satır kuralı, kolon × izin listesi. */
function secTabloIc(t, m, roller, rol, projeId) {
  const mKolon = {};
  m.kolonlar.forEach(c => { mKolon[c.ad] = c; });
  const fk = {};
  t.iliskiler.forEach(f => { if (f.kolon && f.kolon.indexOf(',') < 0) fk[f.kolon] = f.hedef_tablo; });

  const cipler = roller.map(r => `<button class="sec-cip${r === rol ? ' aktif' : ''}" type="button"
      data-eylem="sec-rol" data-id="${esc(projeId)}" data-rol="${esc(r)}">${esc(r)}</button>`).join('');
  const bilgi = [`Satırlar: <b>${esc(secSatirAd(m.satir[rol]))}</b>`]
    .concat(m.sahip_kolon ? [`kendi satırı: <code>${esc(m.sahip_kolon)}</code>`] : [])
    .concat(m.yazma && m.yazma[rol] ? ['tabloya doğrudan değil, sunucu fonksiyonuyla yazar'] : [])
    .join(' · ');

  const satirlar = t.kolonlar.map(c => {
    const etiket = [c.tip, c.pk ? 'PK' : '', fk[c.ad] ? '→ ' + fk[c.ad] : ''].filter(Boolean).join(' · ');
    const mc = mKolon[c.ad];
    const fark = mc && mc.satir[rol];
    const ad = `<div class="sec-kl-ad"><code>${esc(c.ad)}</code><small>${esc(etiket)}</small>
      ${fark ? `<small class="fark">↳ ${esc(secSatirAd(fark))}</small>` : ''}</div>`;
    if (!mc) return `<div class="sec-kl">${ad}<span class="sec-kl-yok">karar verilmedi</span></div>`;
    const izin = mc.izin[rol] || [];
    return `<div class="sec-kl">${ad}${SEC_IZINLER.map(x => izin.includes(x)
      ? `<span class="sec-e" title="${esc(rol + ' · ' + SEC_IZIN_AD[x])}">✓</span>`
      : `<span class="sec-h" title="${esc(rol + ' · ' + SEC_IZIN_AD[x])}">✕</span>`).join('')}</div>`;
  }).join('');

  return `
    <div class="sec-tb-ic">
      ${roller.length > 1 ? `<div class="sec-cipler kaydir">${cipler}</div>` : ''}
      <p class="sec-tb-bilgi">${bilgi}</p>
      <div class="sec-kl-liste">
        <div class="sec-kl sec-kl-bas"><span>Kolon</span><span>Oku</span><span>Ekle</span><span>Değ.</span><span>Sil</span></div>
        ${satirlar}
      </div>
    </div>`;
}

/* ==========================================================================
   EYLEMLER (data-eylem="sec-…")
   ========================================================================== */

/* Büyük metin yapıştırma penceresi. Kaydet → dogrula(metin) hata dönerse
   pencere açık kalır, hata altında görünür. */
function secYapistirPenceresi({ baslik, aciklama, ust = '', yerTutucu, dogrula }) {
  modalAc(`
    ${modalBaslik(ICON.gGuvenlik, baslik, aciklama)}
    ${ust}
    <label class="field">
      <textarea id="sec-metin" rows="9" class="sec-metin" placeholder="${esc(yerTutucu)}"></textarea>
    </label>
    <div class="sec-hata" id="sec-hata" hidden></div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-m="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-m="tamam" type="button"><span>Kaydet</span></button>
    </div>`, kutu => {
    const alan = $('#sec-metin', kutu);
    const hata = $('#sec-hata', kutu);
    setTimeout(() => alan.focus(), 40);
    const kopya = $('[data-m="kopya"]', kutu);
    if (kopya) kopya.addEventListener('click', async () => {
      const ok = await panoyaKopyala(SEC_YAPI_SQL);
      toast(ok ? 'SQL kopyalandı — Supabase SQL Editor\'de çalıştır.' : 'Kopyalanamadı.', ok ? 'basari' : 'hata');
    });
    $('[data-m="iptal"]', kutu).addEventListener('click', () => modalKapat());
    $('[data-m="tamam"]', kutu).addEventListener('click', async () => {
      const dugme = $('[data-m="tamam"]', kutu);
      dugme.disabled = true;
      const sonuc = await dogrula(alan.value);
      dugme.disabled = false;
      if (sonuc && sonuc.hata) {
        hata.hidden = false;
        hata.innerHTML = esc(sonuc.hata) + (sonuc.ayrinti
          ? `<ul>${sonuc.ayrinti.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
        return;
      }
      modalKapat();
    });
  }, 'genis');
}

async function securityEylem(e, el) {
  const projeId = el.dataset.id;
  if (e.indexOf('sec-t-') === 0) return secTestEylem(e, el);   // security-test.js
  if (e.indexOf('sec-o-') === 0) return secOkumaEylem(e, el);  // security-okuma.js

  if (e === 'sec-tablo') {
    const a = SEC.acik[projeId] = SEC.acik[projeId] || {};
    if (a[el.dataset.ad]) delete a[el.dataset.ad]; else a[el.dataset.ad] = true;
    render();
    return true;
  }
  if (e === 'sec-rol') { SEC.rol[projeId] = el.dataset.rol; render(); return true; }
  if (e === 'sec-ayar-ac') {
    const a = SEC.ayar_ac[projeId] = SEC.ayar_ac[projeId] || {};
    a[el.dataset.n] = el.dataset.ac !== 'true';
    render();
    return true;
  }
  if (e === 'sec-adimlar') {
    const n = Number(el.dataset.n);
    SEC.liste_ac[projeId] = SEC.liste_ac[projeId] === n ? null : n;
    render();
    return true;
  }
  if (e === 'sec-adim-git') {
    SEC.liste_ac[projeId] = false;
    const hedef = '#/security/' + projeId + '/' + el.dataset.n;
    if (location.hash === hedef) render(); else location.hash = hedef;
    return true;
  }

  if (e === 'sec-yapi') {
    secYapistirPenceresi({
      baslik: 'Veritabanı yapısı',
      aciklama: 'Yalnız yapı okunur; hiçbir satır verisi, şifre ya da müşteri bilgisi alınmaz.',
      ust: `<ol class="sec-yol">
          <li>SQL'i kopyala.</li>
          <li>Projenin Supabase panelinde SQL Editor'ü aç, yapıştır, Run'a bas.</li>
          <li>Çıkan tek hücreyi kopyalayıp aşağıya yapıştır.</li>
        </ol>
        <button class="btn btn-ghost sec-kopya" data-m="kopya" type="button">${svg(ICON.kopya, 15)} SQL'i kopyala</button>`,
      yerTutucu: '{"nizam_security":"yapi-1","tablolar":[…]}',
      dogrula: async metin => {
        const r = secYapiOku(metin);
        if (r.hata) return r;
        try {
          SEC.kayit[projeId] = await SEC_VERI.kaydet(projeId,
            { yapi: r.yapi, yapi_tarihi: new Date().toISOString() });
          SEC.liste = null;
          toast(r.yapi.tablolar.length + ' tablo kaydedildi.', 'basari');
          render();
        } catch (h) { return { hata: h.message }; }
        return null;
      },
    });
    return true;
  }

  if (e === 'sec-prompt') {
    const p = DB.proje(projeId);
    const k = SEC.kayit[projeId];
    if (!p || !k || !k.yapi) { toast('Önce veritabanı yapısını al.', 'hata'); return true; }
    const ok = await panoyaKopyala(secPrompt(p, k.yapi));
    toast(ok ? 'Prompt kopyalandı — Claude\'a yapıştır.' : 'Kopyalanamadı.', ok ? 'basari' : 'hata');
    return true;
  }

  if (e === 'sec-model') {
    const k = SEC.kayit[projeId];
    if (!k || !k.yapi) { toast('Önce veritabanı yapısını al.', 'hata'); return true; }
    secYapistirPenceresi({
      baslik: 'Güvenlik modeli',
      aciklama: 'Claude\'un en sonda verdiği JSON\'u yapıştır. Gerçek yapıyla karşılaştırılır.',
      yerTutucu: '{"surum":1,"roller":[…],"tablolar":[…]}',
      dogrula: async metin => {
        const r = secModelOku(metin, k.yapi, projeId);
        if (r.hata) return r;
        try {
          SEC.kayit[projeId] = await SEC_VERI.kaydet(projeId,
            { model: r.model, model_tarihi: new Date().toISOString() });
          SEC.liste = null;
          toast('Güvenlik modeli kaydedildi.', 'basari');
          render();
        } catch (h) { return { hata: h.message }; }
        return null;
      },
    });
    return true;
  }
  return false;
}
