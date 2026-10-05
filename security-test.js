/* ==========================================================================
   NIZAM Security — 2. aşama: Test Ortamı

   Production'a dokunmadan, ayrı bir Supabase test projesinde:
     gerçek yapının kopyası + mevcut RLS/policy yapısı +
     sentetik test kullanıcıları + sentetik test verisi.
   Güvenlik TESTİ burada çalışmaz (sonraki aşama).

   ESKİ GÜVENLİK SİSTEMİNDEN BAĞIMSIZ. Yalnız security.js'in verisini
   (SEC, SEC_VERI, yapı ve model) ve Studio'nun genel yardımcılarını kullanır.

   Production'a karşı üç kilit:
     1) Bağlarken: test adresi production adresiyle (ve Studio'nun kendi
        adresiyle) aynıysa kayıt engellenir. Production adresi bilinmiyorsa
        da engellenir — karşılaştırılamayan şey güvenli sayılmaz.
     2) Anahtar: yalnız anon/publishable. service_role / gizli anahtar
        reddedilir; anon JWT'si başka projeye aitse reddedilir.
     3) SQL'in içinde: her Nizam SQL'i bir kilitle başlar. Veritabanında
        tablo var ama "Nizam test ortamı" işareti yoksa (production gibi) ya
        da işaret başka projeninse hiçbir şey yapmadan durur.

   Test kullanıcıları test projesinin KENDİ Auth kayıt adresiyle açılır
   (/auth/v1/signup, publishable anahtar). auth.users'a SQL ile yazılmaz,
   service_role kullanılmaz.

   Rota: #/security/<projeId>/test     Tablo: sql/45-nizam-security-test.sql
   index.html'de security.js'ten sonra yükleniyor.
   ========================================================================== */

'use strict';

const SEC_TEST_ALAN = 'test.nizamsoft.com';   // test hesaplarının e-posta alanı
const SEC_TEST_KONTROL_SURUM = '1';

const SEC_TEST = { kayit: {}, goster: {}, mesgul: {}, yapiFark: {} };   // yapiFark: bellekte

/* ==========================================================================
   VERİ — yalnız security_test_ortamlari tablosu
   ========================================================================== */

const SEC_TEST_VERI = {
  async getir(projeId) {
    if (!AUTH.bagli) return null;
    const { data, error } = await AUTH.db.from('security_test_ortamlari')
      .select('*').eq('proje_id', projeId).maybeSingle();
    if (error) throw new Error(secTestHata(error));
    return data || null;
  },

  /* Sabit test veritabanı başka projeye geçti: o projelerin kurulum/kullanıcı/kontrol
     bilgisi artık geçersiz. */
  async devret(testRef, projeId) {
    yazmaKontrol();
    const { error } = await AUTH.db.from('security_test_ortamlari')
      .update({ kullanicilar: [], kontrol: null, kontrol_tarihi: null, kurulum_tarihi: null,
        guncellendi: new Date().toISOString() })
      .eq('test_ref', testRef).neq('proje_id', projeId);
    if (error) throw new Error(secTestHata(error));
    Object.keys(SEC_TEST.kayit).forEach(id => {
      const x = SEC_TEST.kayit[id];
      if (id !== projeId && x && x.test_ref === testRef) delete SEC_TEST.kayit[id];
    });
  },

  async kaydet(projeId, alanlar) {
    yazmaKontrol();
    const govde = Object.assign({ proje_id: projeId }, alanlar,
      { guncellendi: new Date().toISOString() });
    const { data, error } = await AUTH.db.from('security_test_ortamlari')
      .upsert(govde, { onConflict: 'proje_id' }).select('*');
    if (error) throw new Error(secTestHata(error));
    if (!data || !data.length) throw new Error('Kaydedilemedi.');
    SEC_TEST.kayit[projeId] = data[0];
    return data[0];
  },
};

function secTestHata(err) {
  const m = (err && err.message) || '';
  if (/security_test_ortamlari/i.test(m) && /does not exist|schema cache|Could not find/i.test(m)) {
    return 'Test ortamı tablosu kurulmamış. sql/45-nizam-security-test.sql dosyasını Supabase\'de çalıştır.';
  }
  return veriHatasi(err);
}

/* ==========================================================================
   YARDIMCILAR
   ========================================================================== */

const secQi = s => '"' + String(s).replace(/"/g, '""') + '"';          // tanımlayıcı
const secQl = s => "'" + String(s).replace(/'/g, "''") + "'";           // metin
const secRol = r => (r === 'public' ? 'public' : secQi(r));
const SEC_YETKI_TURU = /^(SELECT|INSERT|UPDATE|DELETE|TRUNCATE|REFERENCES|TRIGGER|MAINTAIN)$/;
const SEC_ISLEM = { ALL: 'all', SELECT: 'select', INSERT: 'insert', UPDATE: 'update', DELETE: 'delete' };

/* https://<ref>.supabase.co → ref. Başka biçim kabul edilmez. */
function secRef(url) {
  const m = String(url || '').trim().match(/^https:\/\/([a-z0-9]{10,40})\.supabase\.co\/?$/i);
  return m ? m[1].toLowerCase() : '';
}

function secUretimRef(p) {
  return secRef(((p && p.palet) || {}).supabaseUrl);
}

function secKisalt(s, bas = 4, son = 4) {
  s = String(s || '');
  return s.length <= bas + son + 1 ? s : s.slice(0, bas) + '…' + s.slice(-son);
}

/* JWT gövdesini çözer (imza doğrulamaz — yalnız rol/ref denetimi için). */
function secJwtGovde(t) {
  try {
    const p = String(t).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(p + '='.repeat((4 - p.length % 4) % 4)));
  } catch (h) { return null; }
}

/* Yalnız anon / publishable anahtar. Hata metni ya da null döner. */
function secTestAnahtarHatasi(anahtar, testRef) {
  const a = String(anahtar || '').trim();
  if (!a) return 'Anahtar boş.';
  if (/^sb_secret_/i.test(a)) return 'Bu GİZLİ anahtar (sb_secret_). Nizam yalnız publishable/anon anahtarı kabul eder.';
  if (/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(a)) return null;
  if (/^eyJ/.test(a)) {
    const g = secJwtGovde(a);
    if (!g) return 'Anahtar çözülemedi.';
    if (g.role !== 'anon') return 'Bu anahtar "' + (g.role || '?') + '" rolünde. Yalnız anon anahtar kabul edilir — service_role asla.';
    if (g.ref && testRef && g.ref !== testRef) return 'Bu anahtar başka bir Supabase projesine ait (' + g.ref + ').';
    return null;
  }
  return 'Tanınmayan anahtar. Test projesinin publishable (sb_publishable_…) ya da anon anahtarını yapıştır.';
}

function secSifre() {
  const harf = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const r = new Uint32Array(22);
  crypto.getRandomValues(r);
  let s = '';
  for (let i = 0; i < 20; i++) s += harf[r[i] % harf.length];
  return s + '!#%+-=?@'[r[20] % 8] + '23456789'[r[21] % 8];   // her türden en az bir karakter
}

function secKod() {
  const r = new Uint32Array(1);
  crypto.getRandomValues(r);
  return r[0].toString(36).slice(0, 5);
}

function secSlug(s) {
  const tr = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', İ: 'i' };
  return String(s || '').toLowerCase().replace(/[çğıöşüİ]/g, c => tr[c] || c)
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'rol';
}

/* Bir rol kısıtlı mı: herhangi bir tabloda/kolonda "tüm satırlar" dışında
   bir satır kuralı ya da eksik bir izni varsa evet. Kısıtlı role iki kişi
   (A ve B — "kendi" / "başkasının" ayrımı için), tam yetkiliye bir kişi. */
function secRolKisitli(model, rol) {
  return model.tablolar.some(t =>
    (t.satir[rol] && t.satir[rol] !== 'tum')
    || t.kolonlar.some(c => (c.satir[rol] && c.satir[rol] !== 'tum')
                          || (c.izin[rol] || []).length < SEC_IZINLER.length));
}

function secTestKisiPlani(model, kod) {
  const liste = [];
  /* Ziyaretçi = giriş yapmamış kişi: test hesabı açılmaz. */
  model.roller.filter(rol => rol !== SEC_ZIYARETCI_ROL).forEach(rol => {
    const harfler = secRolKisitli(model, rol) ? ['a', 'b'] : [''];
    harfler.forEach(h => liste.push({
      rol,
      etiket: rol + (h ? ' ' + h.toUpperCase() : ''),
      eposta: secSlug(rol) + (h ? '-' + h : '') + '.' + kod + '@' + SEC_TEST_ALAN,
      sifre: secSifre(),
      kimlik: null,
    }));
  });
  return liste;
}

/* ==========================================================================
   SQL ÜRETİCİLER
   ========================================================================== */

/* Her Nizam SQL'inin başındaki kilit.
   bosOlabilir=true  (kurulum): veritabanı boşsa ya da bu projenin işareti
                     varsa devam; tablo var ama işaret yoksa DUR.
   bosOlabilir=false (veri):    yalnız bu projenin işareti varsa devam. */
function secKilitSql(projeId, bosOlabilir, devralabilir) {
  return `do $nizam_kilit$
declare
  v_isaret boolean;
  v_proje  text;
begin
  select exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname = 'public' and c.relname = 'nizam_test_ortami') into v_isaret;
  if not v_isaret then
    ${bosOlabilir ? `if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
               where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')) then
      raise exception 'NIZAM: DURDURULDU. Bu veritabanında tablolar var ama Nizam test ortamı işareti yok — burası production olabilir. Hiçbir şey değiştirilmedi.';
    end if;` : `raise exception 'NIZAM: DURDURULDU. Burası Nizam test ortamı değil (işaret yok). Önce 2. adımın kurulum SQL''ini TEST projesinde çalıştır. Hiçbir şey değiştirilmedi.';`}
  else
    execute 'select proje_id from public.nizam_test_ortami where anahtar = ''nizam''' into v_proje;
    if v_proje is distinct from ${secQl(projeId)} then
      ${devralabilir
        ? `raise notice 'NIZAM: Test veritabanı % projesinden bu projeye devrediliyor.', v_proje;`
        : `raise exception 'NIZAM: DURDURULDU. Bu test ortamı başka bir Nizam projesine ait. Hiçbir şey değiştirilmedi.';`}
    end if;
  end if;
end
$nizam_kilit$;`;
}

function secYetkiSql(nesne, yetkiVarsayilan, yetkiler, kolonlar) {
  const s = [`revoke all on table ${nesne} from public, anon, authenticated;`];
  (yetkiler || []).forEach(y => {
    if (SEC_YETKI_TURU.test(y.yetki)) s.push(`grant ${y.yetki} on table ${nesne} to ${secRol(y.rol)};`);
  });
  (kolonlar || []).forEach(k => (k.yetkiler || []).forEach(y => {
    if (SEC_YETKI_TURU.test(y.yetki)) s.push(`grant ${y.yetki} (${secQi(k.ad)}) on table ${nesne} to ${secRol(y.rol)};`);
  }));
  if (yetkiVarsayilan && !(yetkiler || []).length) s[0] += '  -- production\'da varsayılan: yalnız sahibi';
  return s;
}

/* Sabit test veritabanı: kurulum, işaretli (Nizam) test veritabanındaki public
   şemanın TAMAMINI siler — hangi projeye ait olursa olsun. Korunanlar: işaret
   tablosu, nizam_* fonksiyonları (yazma yardımcısı), eklentilere ait nesneler.
   İşaretsiz veritabanında (production) kilit daha önce durdurur. */
function secTemizleSql() {
  const ext = `not exists (select 1 from pg_depend d where d.objid = %s and d.deptype = 'e')`;
  return `do $nizam_temizle$
declare r record;
begin
  for r in select c.relname, c.relkind from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind in ('v', 'm') and ${ext.replace('%s', 'c.oid')} loop
    execute format(case when r.relkind = 'm' then 'drop materialized view if exists public.%I cascade'
                        else 'drop view if exists public.%I cascade' end, r.relname);
  end loop;
  for r in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind in ('r', 'p') and c.relname <> 'nizam_test_ortami'
             and ${ext.replace('%s', 'c.oid')} loop
    execute format('drop table if exists public.%I cascade', r.relname);
  end loop;
  for r in select p.proname, p.prokind, pg_get_function_identity_arguments(p.oid) as a
           from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname !~ '^nizam_' and ${ext.replace('%s', 'p.oid')} loop
    execute format('drop %s if exists public.%I(%s) cascade',
      case r.prokind when 'p' then 'procedure' when 'a' then 'aggregate' else 'function' end, r.proname, r.a);
  end loop;
  for r in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'S' and ${ext.replace('%s', 'c.oid')} loop
    execute format('drop sequence if exists public.%I cascade', r.relname);
  end loop;
  for r in select t.typname, t.typtype from pg_type t join pg_namespace n on n.oid = t.typnamespace
           where n.nspname = 'public' and t.typtype in ('e', 'd', 'c')
             and (t.typtype <> 'c' or (select c.relkind from pg_class c where c.oid = t.typrelid) = 'c')
             and ${ext.replace('%s', 't.oid')} loop
    execute format(case when r.typtype = 'd' then 'drop domain if exists public.%I cascade'
                        else 'drop type if exists public.%I cascade' end, r.typname);
  end loop;
end
$nizam_temizle$;`;
}

/* Proje değiştiyse (işaret başka projenin) önceki projenin test hesapları silinir.
   Yalnız Nizam test alanındaki e-postalar; işaret yoksa hiçbir şey yapmaz. */
function secDevirSql(projeId) {
  return `do $nizam_devir$
declare v_eski text;
begin
  if to_regclass('public.nizam_test_ortami') is not null then
    execute 'select proje_id from public.nizam_test_ortami where anahtar = ''nizam''' into v_eski;
    if v_eski is distinct from ${secQl(projeId)} then
      delete from auth.users where email like ${secQl('%@' + SEC_TEST_ALAN)};
      raise notice 'NIZAM: Önceki projenin (%) test kullanıcıları silindi.', v_eski;
    end if;
  end if;
end
$nizam_devir$;`;
}

/* Kurulum SQL'i: gerçek yapının ve güvenlik kurallarının kopyası.
   Satır verisi YOK. Tek işlem (transaction): bir hata olursa hiçbir şey kalmaz. */
function secTestKurulumSql(yapi, projeId, ortam) {
  const T = yapi.tablolar, G = yapi.gorunumler || [], F = yapi.fonksiyonlar || [];
  const tab = t => 'public.' + secQi(t);
  const s = [];
  s.push('-- NIZAM Security · Test ortamı kurulumu');
  s.push('-- YALNIZ TEST PROJESİNDE çalıştır: ' + ortam.test_ref + '.supabase.co');
  s.push('-- Production (' + ortam.uretim_ref + ') değil. Kilit, production\'da kendini durdurur.');
  s.push('-- Satır verisi içermez; tablolar, kurallar, yetkiler, fonksiyonlar ve tetikleyiciler kurulur.');
  s.push('begin;');
  s.push('set local check_function_bodies = off;');
  s.push('set local search_path = public, extensions;');
  s.push('');
  s.push(secKilitSql(projeId, true, true));
  s.push('');
  s.push('-- Sabit test veritabanı: başka projeden devralınıyorsa önceki test kullanıcıları silinir.');
  s.push(secDevirSql(projeId));
  s.push('');
  s.push('-- İşaret: bu veritabanının bir Nizam test ortamı olduğunu söyler.');
  s.push(`create table if not exists public.nizam_test_ortami (
  anahtar text primary key default 'nizam',
  proje_id text not null,
  uretim_ref text,
  test_ref text,
  kuruldu timestamptz
);`);
  s.push('alter table public.nizam_test_ortami enable row level security;');
  s.push('revoke all on table public.nizam_test_ortami from public, anon, authenticated;');
  s.push(`insert into public.nizam_test_ortami (anahtar, proje_id, uretim_ref, test_ref, kuruldu)
values ('nizam', ${secQl(projeId)}, ${secQl(ortam.uretim_ref)}, ${secQl(ortam.test_ref)}, now())
on conflict (anahtar) do update set proje_id = excluded.proje_id, uretim_ref = excluded.uretim_ref, test_ref = excluded.test_ref, kuruldu = now();`);
  s.push('');
  s.push('-- 1) Test veritabanını baştan temizle (önceki proje dahil; yalnız Nizam test ortamında, kilit bunu sağlar)');
  s.push(secTemizleSql());
  s.push('');
  s.push('-- 2) Eklentiler, tipler ve sayaçlar');
  (yapi.eklentiler || []).forEach(x => s.push(`do $nizam_eklenti$ begin
  create extension if not exists ${secQi(x.ad)} with schema ${secQi(x.sema)};
exception when others then raise notice 'NIZAM: % eklentisi açılamadı (%) — gerekiyorsa Database → Extensions''tan aç.', ${secQl(x.ad)}, sqlerrm;
end $nizam_eklenti$;`));
  (yapi.tipler || []).forEach(x =>
    s.push(`create type public.${secQi(x.ad)} as enum (${x.degerler.map(secQl).join(', ')});`));
  (yapi.diziler || []).forEach(d => s.push(`create sequence if not exists public.${secQi(d)};`));
  s.push('');
  s.push('-- 3) Tablolar (kolon, tip, boş olamaz, kimlik)');
  T.forEach(t => {
    const kol = t.kolonlar.filter(k => k.uretilmis !== 's').map(k => '  ' + secQi(k.ad) + ' ' + k.tip
      + (k.kimlik === 'a' ? ' generated always as identity' : k.kimlik === 'd' ? ' generated by default as identity' : '')
      + (k.bos_olabilir ? '' : ' not null'));
    s.push(`create table ${tab(t.ad)} (\n${kol.join(',\n')}\n);`);
  });
  s.push('');
  s.push('-- 4) Fonksiyonlar (RLS kurallarının ve tetikleyicilerin kullandıkları)');
  F.forEach(f => s.push(f.tanim.trim().replace(/;?\s*$/, ';')));
  s.push('');
  s.push('-- 5) Hesaplanan kolonlar (fonksiyonlardan sonra; ifade fonksiyon kullanabilir) ve varsayılan değerler');
  T.forEach(t => t.kolonlar.forEach(k => {
    if (k.uretilmis === 's') s.push(`alter table ${tab(t.ad)} add column ${secQi(k.ad)} ${k.tip}`
      + ` generated always as (${k.varsayilan}) stored${k.bos_olabilir ? '' : ' not null'};`);
  }));
  T.forEach(t => t.kolonlar.forEach(k => {
    if (k.varsayilan && !k.kimlik && k.uretilmis !== 's') s.push(`alter table ${tab(t.ad)} alter column ${secQi(k.ad)} set default ${k.varsayilan};`);
  }));
  s.push('');
  s.push('-- 6) Anahtarlar ve kısıtlar (önce PK/benzersiz/kontrol, sonra ilişkiler)');
  const kisit = (t, k) => s.push(`alter table ${tab(t.ad)} add constraint ${secQi(k.ad)} ${k.tanim};`);
  T.forEach(t => (t.kisitlar || []).filter(k => k.tur !== 'f').forEach(k => kisit(t, k)));
  T.forEach(t => (t.kisitlar || []).filter(k => k.tur === 'f').forEach(k => kisit(t, k)));
  s.push('');
  if (G.length) {
    s.push('-- 7) Görünümler');
    G.forEach(g => {
      const sec = g.secenekler.filter(x => /^[a-z_]+=[A-Za-z0-9_.]+$/.test(x));
      s.push(`create view ${tab(g.ad)}${sec.length ? ' with (' + sec.join(', ') + ')' : ''} as\n${g.tanim.trim().replace(/;?\s*$/, ';')}`);
    });
    s.push('');
  }
  s.push('-- 8) Tetikleyiciler');
  T.forEach(t => (t.tetikleyiciler || []).forEach(x => s.push(x.tanim.trim().replace(/;?\s*$/, ';'))));
  (yapi.auth_tetikleyiciler || []).forEach(x => {
    s.push(`drop trigger if exists ${secQi(x.ad)} on auth.users;`);
    s.push(x.tanim.trim().replace(/;?\s*$/, ';'));
  });
  s.push('');
  s.push('-- 9) Satır güvenliği (RLS) ve kurallar — production\'daki gibi');
  T.forEach(t => {
    if (t.rls) s.push(`alter table ${tab(t.ad)} enable row level security;`);
    if (t.rls_zorunlu) s.push(`alter table ${tab(t.ad)} force row level security;`);
    (t.politikalar || []).forEach(p => {
      const roller = (p.roller && p.roller.length ? p.roller : ['public']).map(secRol).join(', ');
      s.push(`create policy ${secQi(p.ad)} on ${tab(t.ad)} as ${p.kisitlayici ? 'restrictive' : 'permissive'}`
        + ` for ${SEC_ISLEM[p.islem] || 'all'} to ${roller}`
        + (p.using ? `\n  using (${p.using})` : '')
        + (p.check ? `\n  with check (${p.check})` : '') + ';');
    });
  });
  s.push('');
  s.push('-- 10) Yetkiler (anon / authenticated) — production\'daki gibi');
  T.forEach(t => secYetkiSql(tab(t.ad), t.yetki_varsayilan, t.yetkiler, t.kolonlar).forEach(x => s.push(x)));
  G.forEach(g => secYetkiSql(tab(g.ad), g.yetki_varsayilan, g.yetkiler, []).forEach(x => s.push(x)));
  F.forEach(f => {
    const ad = `public.${secQi(f.ad)}(${f.imza})`;
    s.push(`revoke execute on function ${ad} from public, anon, authenticated;`);
    if (f.anon) s.push(`grant execute on function ${ad} to anon;`);
    if (f.authenticated) s.push(`grant execute on function ${ad} to authenticated;`);
  });
  s.push('');
  s.push('commit;');
  s.push(`select 'NIZAM: Test ortamı kuruldu — ${T.length} tablo, ${T.reduce((n, t) => n + (t.politikalar || []).length, 0)} kural, ${F.length} fonksiyon.' as sonuc;`);
  return s.join('\n');
}

/* Durum kontrolü — YALNIZ OKUR. Test projesinde çalıştırılır. */
function secTestKontrolSql(kisiler) {
  const epostalar = (kisiler || []).map(k => secQl(k.eposta)).join(', ') || "''";
  return `-- NIZAM Security · Test ortamı durum kontrolü (yalnız okur)
-- TEST projesinin SQL Editor'ünde çalıştır, çıkan tek hücreyi Nizam'a yapıştır.
select json_build_object(
  'nizam_kontrol', '${SEC_TEST_KONTROL_SURUM}',
  'isaret', case when to_regclass('public.nizam_test_ortami') is null then null
    else (xpath('/row/p/text()', query_to_xml(
      'select proje_id as p from public.nizam_test_ortami where anahtar = ''nizam''', false, true, '')))[1]::text end,
  'tablolar', coalesce((select json_agg(json_build_object(
      'ad', c.relname,
      'rls', c.relrowsecurity,
      'politika', (select count(*) from pg_policy p where p.polrelid = c.oid),
      'satir', (xpath('/row/s/text()', query_to_xml(
          format('select count(*) as s from public.%I', c.relname), false, true, '')))[1]::text::int))
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and c.relname <> 'nizam_test_ortami'), '[]'::json),
  'fonksiyonlar', coalesce((select json_agg(p.proname)
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'), '[]'::json),
  'kullanicilar', coalesce((select json_agg(u.email) from auth.users u
    where u.email in (${epostalar})), '[]'::json)
) as kontrol;`;
}

function secTestKontrolOku(metin) {
  if (secGizliVar(metin)) return { hata: 'Çıktıda gizli bir anahtar var gibi görünüyor — kabul edilmedi.' };
  const r = secJsonAl(metin, 'kontrol');
  if (r.hata) return r;
  const j = r.json;
  if (String(j.nizam_kontrol) !== SEC_TEST_KONTROL_SURUM) {
    return { hata: 'Bu, Nizam test ortamı kontrol SQL\'inin çıktısı değil.' };
  }
  const dz = x => (Array.isArray(x) ? x : []);
  return { kontrol: {
    isaret: j.isaret ? String(j.isaret) : null,
    tablolar: dz(j.tablolar).map(t => ({ ad: String(t.ad || ''), rls: !!t.rls,
      politika: Number(t.politika) || 0, satir: Number(t.satir) || 0 })).filter(t => t.ad),
    fonksiyonlar: dz(j.fonksiyonlar).map(String),
    kullanicilar: dz(j.kullanicilar).map(x => String(x).toLowerCase()),
  } };
}

/* ---------- Sentetik veri: Claude promptu ---------- */
function secTestVeriPrompt(p, yapi, model, kisiler) {
  const ozet = {
    tablolar: yapi.tablolar.map(t => ({
      ad: t.ad, rls: t.rls,
      kolonlar: t.kolonlar.map(k => ({ ad: k.ad, tip: k.tip, bos_olabilir: k.bos_olabilir, pk: k.pk,
        varsayilan: k.varsayilan || undefined, kimlik: k.kimlik || undefined })),
      kisitlar: (t.kisitlar || []).map(k => k.tanim),
      politikalar: (t.politikalar || []).map(x => ({ ad: x.ad, islem: x.islem, using: x.using, check: x.check })),
      tetikleyiciler: (t.tetikleyiciler || []).map(x => x.tanim),
    })),
    tipler: yapi.tipler || [],
    auth_tetikleyiciler: (yapi.auth_tetikleyiciler || []).map(x => x.tanim),
    fonksiyonlar: (yapi.fonksiyonlar || []).map(f => f.tanim),
  };
  const s = [];
  s.push('# NIZAM Security — Sentetik test verisi');
  s.push('');
  s.push('Bir TEST veritabanı için en az sayıda, uydurma (sentetik) test verisi yazan tek bir SQL hazırla.');
  s.push('Bu veri daha sonra erişim kurallarını denemek için kullanılacak. Şimdi test yapma, yalnız veriyi yaz.');
  s.push('');
  s.push('## Proje');
  s.push('- ' + projeAdi(p));
  s.push('');
  s.push('## Test kullanıcıları (zaten oluşturuldu — auth.users\'ta var)');
  kisiler.forEach(k => s.push(`- ${k.etiket} (rol: ${k.rol}) → ${k.eposta}`));
  s.push('Kullanıcının kimliğini her zaman e-postasıyla bul:');
  s.push("`(select id from auth.users where email = '" + (kisiler[0] ? kisiler[0].eposta : 'x@' + SEC_TEST_ALAN) + "')`");
  s.push('');
  s.push('## Ne lazım');
  s.push('- Modeldeki "' + SEC_ZIYARETCI_ROL + '" rolü giriş yapmamış kişidir; onun için kullanıcı ya da kişiye bağlı kayıt yazma. Açık olması gereken tablolara satır yazman yeterli.');
  s.push('- Her test kullanıcısı uygulamada DOĞRU ROLDE olmalı. Rolün nerede tutulduğunu yapıdan, kurallardan ve fonksiyonlardan bul (ör. profiller.rol).');
  s.push('- Aynı rolden iki kişi varsa (A ve B) ayrımı destekle: A\'nın kendi kaydı, B\'nin kendi kaydı.');
  s.push('- Yapıda şube/bölüm/firma gibi bir ayrım varsa iki ayrı kayıt aç (Şube 1, Şube 2); A\'yı birine, B\'yi ötekine bağla.');
  s.push('- Herkesin görmesi gereken ortak kayıtlar için birkaç satır ekle (ör. 2–3 ürün).');
  s.push('- Modelde kuralı olan her tabloya en az bir satır düşsün; gereğinden fazla satır yazma.');
  s.push('- Modelde satır kuralı ŞART nesnesi olan ({kolon, kosul, deger}) her tabloda şartın İKİ TARAFINDAN da en az bir satır yaz: şartı sağlayan ve sağlamayan (ör. tablo_adi = \'kullanicilar\' olan ve olmayan). Şart kolonunu boş bırakma.');
  s.push('- auth.users tetikleyicisi bazı satırları (ör. profil) zaten oluşturmuş olabilir: bunlar için insert yerine update ya da `on conflict … do update` kullan.');
  s.push('');
  s.push('## Kurallar');
  s.push('- Yalnız aşağıdaki gerçek yapıdaki tablo ve kolonları kullan; uydurma tablo/kolon yok.');
  s.push('- Gerçek kişi, telefon, e-posta, adres kullanma. Hepsi açıkça sahte olsun ("Test Personel A", "Şube 1").');
  s.push('- auth şemasına YAZMA (auth.users\'ı yalnız okuyarak kimlik bul).');
  s.push('- Şunları kullanma: drop, alter, create, grant, revoke, begin, commit, rollback. Nizam SQL\'i kendisi bir işlem içine ve güvenlik kilidinin arkasına koyacak.');
  s.push('- SQL birden fazla kez çalıştırılabilsin: başta kendi eklediğin tabloların içini `delete from public.…` ile temizleyebilirsin (ilişki sırasına dikkat et).');
  s.push('');
  s.push('## Erişim modeli (olması istenen)');
  s.push('```json');
  s.push(JSON.stringify(model));
  s.push('```');
  s.push('');
  s.push('## Gerçek veritabanı yapısı, RLS kuralları ve fonksiyonlar');
  s.push('```json');
  s.push(JSON.stringify(ozet));
  s.push('```');
  s.push('');
  s.push('## Çıktı');
  s.push('Kısa bir açıklama (hangi kullanıcıya hangi satırı bağladın) ve ardından tek bir ```sql bloğu ver.');
  return s.join('\n');
}

/* Claude'dan gelen veri SQL'i: güvenilmez girdi. Yalnız veri yazabilir. */
function secTestVeriOku(metin) {
  let t = String(metin || '');
  if (secGizliVar(t)) return { hata: 'SQL\'de gizli bir anahtar var gibi görünüyor — kabul edilmedi.' };
  const blok = t.match(/```(?:sql)?\s*([\s\S]*?)```/i);
  if (blok) t = blok[1];
  t = t.trim();
  if (!t) return { hata: 'SQL bulunamadı.' };
  if (t.length > 200000) return { hata: 'SQL çok uzun.' };
  const yasak = [
    [/\b(drop|alter|grant|revoke|create|comment\s+on|vacuum|copy|reindex|cluster|security\s+label)\b/i, 'yapıyı değiştiren komut'],
    [/(^|;)\s*(begin|commit|rollback|savepoint|start\s+transaction)(\s+(transaction|work))?\s*;/im, 'işlem (transaction) komutu'],
    [/\bset\s+(local\s+|session\s+)?(role|session\s+authorization|session_replication_role)\b/i, 'rol değiştirme'],
    [/\b(insert\s+into|update|delete\s+from|truncate(\s+table)?)\s+(only\s+)?"?auth"?\s*\./i, 'auth şemasına yazma'],
    [/nizam_test_ortami/i, 'Nizam işaret tablosuna dokunma'],
    [/\$nizam_kilit\$/i, 'kilit etiketi'],
  ];
  for (const [re, ad] of yasak) {
    const m = t.match(re);
    if (m) return { hata: 'SQL kabul edilmedi: ' + ad + ' içeriyor ("' + m[0].trim() + '"). Claude\'dan yalnız veri ekleyen SQL iste.' };
  }
  return { sql: t };
}

function secTestVeriSar(sql, projeId, ortam) {
  return [
    '-- NIZAM Security · Sentetik test verisi',
    '-- YALNIZ TEST PROJESİNDE çalışır: ' + ortam.test_ref + '.supabase.co',
    '-- Nizam test ortamı işareti yoksa (production gibi) kendini durdurur.',
    'begin;',
    secKilitSql(projeId, false),
    '',
    sql.replace(/;?\s*$/, ';'),
    '',
    'commit;',
    "select 'NIZAM: Test verisi yüklendi.' as sonuc;",
  ].join('\n');
}

/* ==========================================================================
   TEST KULLANICILARI — test projesinin kendi Auth kayıt adresi
   ========================================================================== */

async function secTestIstek(ortam, yol, govde) {
  const r = await fetch(ortam.test_url.replace(/\/+$/, '') + '/auth/v1/' + yol, {
    method: 'POST',
    headers: { apikey: ortam.test_anahtar, 'Content-Type': 'application/json' },
    body: JSON.stringify(govde),
  });
  let j = {};
  try { j = await r.json(); } catch (h) {}
  return { ok: r.ok, durum: r.status, j };
}

/* Sonuç: {kimlik} | {dogrulama:true} | {hata} */
async function secTestKayitOl(ortam, kisi) {
  let r;
  try {
    r = await secTestIstek(ortam, 'signup', { email: kisi.eposta, password: kisi.sifre,
      data: { nizam_test: true, rol: kisi.rol, ad: 'Test ' + kisi.etiket } });
  } catch (h) { return { hata: 'Test projesine ulaşılamadı.' }; }
  const j = r.j || {};
  const mesaj = String(j.msg || j.error_description || j.message || j.error_code || j.error || '');
  if (r.ok) {
    if (j.access_token && j.user && j.user.id) return { kimlik: j.user.id };
    return { dogrulama: true };     // e-posta doğrulaması açık
  }
  if (/already|exists|registered/i.test(mesaj)) {
    try {
      const g = await secTestIstek(ortam, 'token?grant_type=password', { email: kisi.eposta, password: kisi.sifre });
      if (g.ok && g.j.user && g.j.user.id) return { kimlik: g.j.user.id };
      if (/confirm/i.test(String(g.j.msg || g.j.error_description || g.j.error_code || ''))) return { dogrulama: true };
    } catch (h) {}
    return { hata: kisi.eposta + ' test projesinde zaten var ama şifresi farklı. "Yeniden oluştur" ile yeni hesaplar aç.' };
  }
  if (/signup.*(disabled|not allowed)|signups not allowed/i.test(mesaj)) {
    return { hata: 'Test projesinde yeni kayıt kapalı. Authentication → Sign In / Providers → "Allow new users to sign up" açık olmalı.' };
  }
  if (/password/i.test(mesaj)) return { hata: 'Şifre kuralı reddetti: ' + mesaj };
  return { hata: mesaj || ('Kayıt başarısız (' + r.durum + ').') };
}

/* ==========================================================================
   DURUM
   ========================================================================== */

/* Ekranın tepesindeki şerit ve "Durum kontrolü" listesi.
   renk: yesil (hazır) · sari (hazırlanıyor) · kirmizi (eksik) */
function secTestDurum(projeId, yapi, model, ortam) {
  const maddeler = [];
  const ekle = (ok, metin, ek) => maddeler.push({ ok, metin, ek: ek || '' });
  if (!ortam || !ortam.test_ref) {
    ekle(false, 'Test Supabase projesi bağlanmadı');
    return { renk: 'kirmizi', baslik: 'Test ortamı eksik', alt: '1. adımdan test projesini bağla', maddeler };
  }
  const kisiler = ortam.kullanicilar || [];
  const k = ortam.kontrol;
  if (!k) {
    const adim = 1 + (kisiler.length && kisiler.every(x => x.kimlik) ? 1 : 0) + (ortam.veri_sql ? 1 : 0);
    ekle(true, 'Test projesi bağlandı', secKisalt(ortam.test_ref, 4, 4));
    ekle(false, 'Kurulumun durumu bilinmiyor', 'Kontrol SQL\'ini test projesinde çalıştır');
    return { renk: 'sari', baslik: 'Test ortamı hazırlanıyor', alt: adim + ' / 4 adım · durum kontrolü bekleniyor', maddeler };
  }

  let kirmizi = false, sari = false;
  const kt = {};
  k.tablolar.forEach(t => { kt[t.ad] = t; });

  if (k.isaret !== projeId) {
    kirmizi = true;
    ekle(false, k.isaret ? 'Bu çıktı başka bir projenin test ortamından geliyor' : 'Nizam test ortamı işareti yok',
      'Kurulum SQL\'i bu test projesinde çalıştırılmamış');
  }
  const eksikTablo = yapi.tablolar.filter(t => !kt[t.ad]).map(t => t.ad);
  if (eksikTablo.length) { kirmizi = true; ekle(false, eksikTablo.length + ' tablo eksik', eksikTablo.join(', ')); }
  else ekle(true, yapi.tablolar.length + ' tablo test ortamında var', yapi.tablolar.slice(0, 3).map(t => t.ad).join(', ') + (yapi.tablolar.length > 3 ? '…' : ''));

  const istenenKural = yapi.tablolar.reduce((n, t) => n + (t.politikalar || []).length, 0);
  const kuralEksik = yapi.tablolar.filter(t => kt[t.ad] && (kt[t.ad].politika < (t.politikalar || []).length || kt[t.ad].rls !== t.rls));
  const varKural = yapi.tablolar.reduce((n, t) => n + Math.min((kt[t.ad] || {}).politika || 0, (t.politikalar || []).length), 0);
  if (kuralEksik.length) { kirmizi = true; ekle(false, 'RLS kuralları eksik: ' + varKural + ' / ' + istenenKural, kuralEksik.map(t => t.ad).join(', ')); }
  else ekle(true, istenenKural + ' / ' + istenenKural + ' RLS kuralı kurulu');

  const kf = new Set(k.fonksiyonlar);
  const eksikF = (yapi.fonksiyonlar || []).map(f => f.ad).filter(a => !kf.has(a));
  if (eksikF.length) { kirmizi = true; ekle(false, eksikF.length + ' fonksiyon eksik', eksikF.join(', ')); }

  const ku = new Set(k.kullanicilar);
  const eksikK = kisiler.filter(x => !ku.has(x.eposta.toLowerCase()));
  if (!kisiler.length || eksikK.length) {
    kirmizi = true;
    ekle(false, 'Test kullanıcıları eksik', kisiler.length ? eksikK.map(x => x.etiket).join(', ') : '3. adım');
  } else ekle(true, 'Test kullanıcıları hazır', kisiler.length + ' kişi');

  const modelTablo = (model ? model.tablolar.map(t => t.ad) : []).filter(a => kt[a]);
  const bos = modelTablo.filter(a => !kt[a].satir);
  if (!modelTablo.length || bos.length === modelTablo.length) {
    sari = true; ekle(false, 'Test verisi eksik', bos.slice(0, 4).map(a => a + ': 0 satır').join(' · '));
  } else if (bos.length) {
    sari = true; ekle(false, 'Bazı tablolarda test verisi yok', bos.join(', '));
  } else ekle(true, 'Test verisi var', modelTablo.length + ' tabloda satır');

  if (kirmizi) return { renk: 'kirmizi', baslik: 'Test ortamı eksik', alt: 'Eksikler aşağıda', maddeler };
  if (sari) return { renk: 'sari', baslik: 'Test ortamı hazırlanıyor', alt: 'Eksikler aşağıda', maddeler };
  return { renk: 'yesil', baslik: 'Test ortamı hazır', alt: 'Güvenlik testleri için hazır (sonraki aşama)', maddeler };
}

/* ==========================================================================
   YAPI KARŞILAŞTIRMASI — gerçek veritabanı ↔ TEST
   Aynı yapı SQL'i (SEC_YAPI_SQL) iki tarafta çalışır, çıktılar burada
   nesne nesne eşleştirilir. Hangi tarafın doğru olduğuna Studio karar vermez.
   Nizam'ın TEST'e koyduğu kendi parçaları (işaret tablosu, nizam_* fonksiyon
   ve tetikleyicileri) karşılaştırmaya girmez.
   ========================================================================== */

const SEC_YAPI_TUR = {
  kural: 'RLS kuralı', rls: 'RLS durumu', yetki: 'Tablo yetkisi', kyetki: 'Kolon yetkisi',
  fonk: 'Fonksiyon', tetik: 'Tetikleyici', auth: 'Giriş tetikleyicisi', tablo: 'Tablo',
  kolon: 'Kolon', kisit: 'Kısıt', gorunum: 'Görünüm', tip: 'Tip', eklenti: 'Eklenti',
};
const SEC_YAPI_SIRA = Object.keys(SEC_YAPI_TUR);   // güvenliği ilgilendirenler önce

const secNizamMi = ad => /^nizam_/i.test(String(ad || ''));
const secNorm = x => String(x === null || x === undefined ? '' : x).replace(/\s+/g, ' ').trim();
const secYetkiMetni = l => (l || []).map(y => y.rol + ':' + y.yetki).sort().join(', ');

/* Yapıyı "anahtar → {tur, ad, tanim}" haritasına çevirir. */
function secYapiParcalar(yapi) {
  const m = new Map();
  const ekle = (tur, ad, tanim) => m.set(tur + ':' + ad, { tur, ad, tanim: secNorm(tanim) });
  (yapi.tablolar || []).forEach(t => {
    if (secNizamMi(t.ad)) return;
    ekle('tablo', t.ad, 'var');
    ekle('rls', t.ad, (t.rls ? 'açık' : 'kapalı') + (t.rls_zorunlu ? ' · zorunlu' : ''));
    ekle('yetki', t.ad, t.yetki_varsayilan && !(t.yetkiler || []).length ? 'varsayılan' : secYetkiMetni(t.yetkiler));
    (t.kolonlar || []).forEach(k => {
      ekle('kolon', t.ad + '.' + k.ad, [k.tip, k.bos_olabilir ? 'boş olabilir' : 'boş olamaz',
        k.varsayilan ? 'varsayılan ' + k.varsayilan : '', k.kimlik ? 'kimlik ' + k.kimlik : '',
        k.uretilmis ? 'hesaplanan' : ''].filter(Boolean).join(' · '));
      if ((k.yetkiler || []).length) ekle('kyetki', t.ad + '.' + k.ad, secYetkiMetni(k.yetkiler));
    });
    (t.kisitlar || []).forEach(k => ekle('kisit', t.ad + '.' + k.ad, k.tanim));
    (t.politikalar || []).forEach(p => ekle('kural', t.ad + '.' + p.ad,
      [p.islem, p.kisitlayici ? 'restrictive' : 'permissive', 'roller: ' + (p.roller || []).slice().sort().join(','),
       'using: ' + (p.using || '—'), 'check: ' + (p.check || '—')].join(' · ')));
    (t.tetikleyiciler || []).forEach(x => { if (!secNizamMi(x.ad)) ekle('tetik', t.ad + '.' + x.ad, x.tanim); });
  });
  (yapi.fonksiyonlar || []).forEach(f => {
    if (secNizamMi(f.ad)) return;
    ekle('fonk', f.ad + '(' + f.imza + ')', f.tanim + ' · anon:' + (f.anon ? 'evet' : 'hayır') + ' · authenticated:' + (f.authenticated ? 'evet' : 'hayır'));
  });
  (yapi.gorunumler || []).forEach(g => ekle('gorunum', g.ad, g.tanim + ' · ' + (g.secenekler || []).join(',') + ' · ' + secYetkiMetni(g.yetkiler)));
  (yapi.tipler || []).forEach(x => ekle('tip', x.ad, (x.degerler || []).join(', ')));
  (yapi.auth_tetikleyiciler || []).forEach(x => { if (!secNizamMi(x.ad)) ekle('auth', x.ad, x.tanim); });
  (yapi.eklentiler || []).forEach(x => ekle('eklenti', x.ad, x.sema));
  return m;
}

function secYapiKarsilastir(uretim, test) {
  const u = secYapiParcalar(uretim), t = secYapiParcalar(test);
  const sadeceTest = [], sadeceUretim = [], farkli = [];
  t.forEach((v, k) => { if (!u.has(k)) sadeceTest.push(v); else if (u.get(k).tanim !== v.tanim) farkli.push({ tur: v.tur, ad: v.ad, uretim: u.get(k).tanim, test: v.tanim }); });
  u.forEach((v, k) => { if (!t.has(k)) sadeceUretim.push(v); });
  const sirala = l => l.sort((a, b) => SEC_YAPI_SIRA.indexOf(a.tur) - SEC_YAPI_SIRA.indexOf(b.tur) || a.ad.localeCompare(b.ad));
  return { sadeceTest: sirala(sadeceTest), sadeceUretim: sirala(sadeceUretim), farkli: sirala(farkli) };
}

/* Fark ekranı (Test Ortamı sekmesinin altında). */
function secYapiFarkHtml(projeId, uretimTarihi) {
  const f = SEC_TEST.yapiFark[projeId];
  if (!f) return '';
  const r = f.sonuc;
  const toplam = r.sadeceTest.length + r.sadeceUretim.length + r.farkli.length;
  const tarih = `<p class="sec-t-ipucu">Gerçek veritabanı yapısı: ${esc(secTarih(uretimTarihi) || '?')} · TEST yapısı: ${esc(secTarih(f.tarih))}
    · Gerçek tarafta göç uyguladıysan Erişim Kuralları → 1. adım → Yenile.</p>`;
  if (!toplam) {
    return `<h3 class="sec-bas">Yapı karşılaştırması</h3>
      <div class="sec-t-durum"><span class="sec-t-emoji">🟢</span>
        <span class="sec-t-durum-yz"><b>Yapılar aynı</b><i>TEST'teki test sonuçları gerçek veritabanı için de geçerli.</i></span></div>${tarih}`;
  }
  const satir = x => `<div class="sec-t-li"><span>${esc(SEC_YAPI_TUR[x.tur] || x.tur)}</span><span><code>${esc(x.ad)}</code></span></div>`;
  const grup = (baslik, alt, liste, fn) => liste.length ? `
    <div class="sec-y-grup"><b>${baslik} (${liste.length})</b><i>${alt}</i>
      <div class="sec-t-liste">${liste.map(fn).join('')}</div></div>` : '';
  const farkSatir = x => `<details class="sec-y-fark"><summary>${esc(SEC_YAPI_TUR[x.tur] || x.tur)} · <code>${esc(x.ad)}</code></summary>
      <div><small>Gerçek veritabanı</small><pre>${esc(x.uretim)}</pre><small>TEST</small><pre>${esc(x.test)}</pre></div></details>`;
  return `<h3 class="sec-bas">Yapı karşılaştırması</h3>
    <div class="sec-t-durum"><span class="sec-t-emoji">🟡</span>
      <span class="sec-t-durum-yz"><b>${toplam} fark var</b><i>TEST'teki test sonuçları gerçek veritabanı için geçerli olmayabilir. Hangi tarafın doğru olduğuna sen karar ver.</i></span></div>
    ${grup('Yalnız TEST\'te', 'Düzeltme henüz gerçek veritabanına geçmemiş olabilir.', r.sadeceTest, satir)}
    ${grup('Yalnız gerçek veritabanında', 'TEST eski kalmış olabilir.', r.sadeceUretim, satir)}
    ${grup('İki tarafta farklı', 'Tanımları yan yana karşılaştır.', r.farkli, farkSatir)}
    ${tarih}`;
}

/* ==========================================================================
   EKRAN
   ========================================================================== */

function secTestEkran(projeId) {
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
  const yapi = k.yapi && Array.isArray(k.yapi.tablolar) ? k.yapi : null;
  const model = yapi && k.model && Array.isArray(k.model.tablolar) ? k.model : null;
  const ust = `
    <a class="tl-geri" href="#/security">${svg(ICON.chevron, 14)} Nizam Security</a>
    <div class="pj-tepe"><div class="pj-tepe-yz">
      <h1>${esc(basHarfleriBuyuk(projeAdi(p)))}</h1>
      <p>Test Ortamı · production'a dokunmadan, sentetik verilerle ayrı bir kopya</p>
    </div></div>
    ${secSekmeler(projeId, 'test')}`;

  if (!yapi || !model) {
    return ust + `<div class="card">${empty(ICON.gGuvenlik, 'Önce Erişim Kuralları',
      'Test ortamı, gerçek veritabanı yapısı ve güvenlik modeli hazır olunca kurulur.')}</div>`;
  }
  if (yapi.nizam_security !== SEC_YAPI_SURUM) {
    return ust + `<div class="card">${empty(ICON.gGuvenlik, 'Veritabanı yapısını yenile',
      'Yapı SQL\'i güncellendi (hesaplanan kolonlar, eklentiler, RLS kuralları). Erişim Kuralları → 1. adım → Yenile, sonra buraya dön.')}</div>`;
  }

  const o = SEC_TEST.kayit[projeId] || {};
  const uretimRef = secUretimRef(p);
  const durum = secTestDurum(projeId, yapi, model, o.test_ref ? o : null);
  const kontrol = o.kontrol || null;
  const kisiler = o.kullanicilar || [];
  const goster = !!SEC_TEST.goster[projeId];
  const mesgul = !!SEC_TEST.mesgul[projeId];
  const kuralSay = yapi.tablolar.reduce((n, t) => n + (t.politikalar || []).length, 0);

  const dug = (yazi, eylem, ek = '', ana = false, kapali = false) =>
    `<button class="sec-dug${ana ? ' ana' : ''}" type="button" data-eylem="${eylem}" data-id="${esc(projeId)}" ${ek}
       ${kapali ? 'disabled' : ''}>${esc(yazi)}</button>`;
  const sat = (sol, sag, cls = '') => `<div class="sec-t-sat"><span>${sol}</span><span class="${cls}">${sag}</span></div>`;
  const kart = (no, bitti, baslik, rozet, govde, dugmeler) => `
    <div class="sec-t-kart${bitti ? ' bitti' : ''}">
      <div class="sec-t-ku"><span class="sec-no">${no}</span><b>${esc(baslik)}</b><em>${rozet}</em></div>
      ${govde}
      <div class="sec-t-dg">${dugmeler}</div>
    </div>`;

  const bagli = !!o.test_ref;
  const ayri = bagli && uretimRef && o.test_ref !== uretimRef;

  /* Kart durumları */
  const kt = {};
  (kontrol ? kontrol.tablolar : []).forEach(t => { kt[t.ad] = t; });
  const kuruldu = !!(kontrol && kontrol.isaret === projeId && yapi.tablolar.every(t => kt[t.ad]
    && kt[t.ad].politika >= (t.politikalar || []).length));
  const olusan = kisiler.filter(x => x.kimlik).length;
  const kisiTamam = kisiler.length > 0 && olusan === kisiler.length;
  const veriVar = !!(kontrol && model.tablolar.some(t => kt[t.ad] && kt[t.ad].satir > 0));

  const kart1 = kart(1, bagli, 'Test Supabase projesi', bagli ? '✓ Bağlandı' : 'Bağlanmadı',
    bagli ? sat('Adres', `<code>${esc(secKisalt(o.test_ref, 4, 4))}.supabase.co</code>`)
          + sat('Anahtar', `<code>${esc(secKisalt(o.test_anahtar, 15, 2))}</code>`)
          + sat('Production ile aynı mı?', ayri ? 'Hayır ✓' : 'Kontrol edilemedi', ayri ? 'sec-yesil' : 'sec-kirmizi')
      : `<p class="sec-t-not">Supabase'de bu iş için <b>ayrı, boş bir proje</b> aç. Adresini ve
         publishable/anon anahtarını buraya gir. service_role anahtarı istenmez.</p>`,
    dug(bagli ? 'Değiştir' : 'Bağla', 'sec-t-bagla', '', !bagli));

  const kart2 = kart(2, kuruldu, 'Yapı + güvenlik kuralları', kuruldu ? '✓ Kuruldu' : (o.kurulum_tarihi ? 'SQL kopyalandı' : 'Bekliyor'),
    sat('Tablolar', yapi.tablolar.length)
    + sat('RLS kuralları (policy)', kuralSay)
    + sat('Kuralların kullandığı fonksiyonlar', (yapi.fonksiyonlar || []).length)
    + ((yapi.gorunumler || []).length ? sat('Görünümler', yapi.gorunumler.length) : '')
    + `<p class="sec-t-not">Sabit test veritabanı: kurulum içindeki her şeyi siler ve bu projeyi kurar.
       Başka bir proje yüklüyse onun yapısı ve test kullanıcıları da silinir.</p>`,
    dug('SQL\'i kopyala', 'sec-t-kurulum', '', false, !bagli)
    + `<span class="sec-t-ipucu">TEST projesinin SQL Editor'ünde çalıştır</span>`);

  const kisiSatir = kisiler.map(x => sat(esc(x.etiket) + (x.kimlik ? ' <i class="sec-yesil">✓</i>' : ''),
    `<code>${esc(x.eposta)}</code>${goster ? `<br><code class="sec-sifre">${esc(x.sifre)}</code>` : ''}`)).join('');
  const kart3 = kart(3, kisiTamam, 'Test kullanıcıları', kisiler.length ? (kisiTamam ? '✓ ' : '') + olusan + ' / ' + kisiler.length : 'Bekliyor',
    `<div class="sec-t-uyari">📧 Test projesinde <b>Authentication → Sign In / Providers → Email</b>:
       <b>"Confirm email"</b> kapalı, <b>"Allow new users to sign up"</b> açık olmalı.
       Yoksa hesaplar açılamaz.</div>`
    + (kisiSatir || `<p class="sec-t-not">Modeldeki rollere göre: tam yetkili rollere 1, kısıtlı rollere 2 kişi (A ve B).</p>`),
    (kisiTamam ? '' : dug(mesgul ? 'Oluşturuluyor…' : 'Kullanıcıları oluştur', 'sec-t-kisiler', '', true, !bagli || mesgul))
    + (kisiler.length ? dug(goster ? 'Şifreleri gizle' : 'Şifreleri göster', 'sec-t-sifre') : '')
    + (kisiler.length ? dug('Yeniden oluştur', 'sec-t-yeniden', '', false, mesgul) : ''));

  const kart4 = kart(4, veriVar, 'Sentetik test verisi', veriVar ? '✓ Yüklendi' : (o.veri_sql ? 'SQL hazır' : 'Bekliyor'),
    sat('Claude, modele göre en az veriyi yazar', '')
    + sat('Örnek: A\'nın kaydı · B\'nin kaydı · Şube 1 / Şube 2', ''),
    dug('Prompt', 'sec-t-veri-prompt', '', true, !kisiTamam)
    + dug('SQL yapıştır → kopyala', 'sec-t-veri', '', false, !kisiTamam)
    + (o.veri_sql ? dug('Tekrar kopyala', 'sec-t-veri-kopya') : ''));

  const yf = SEC_TEST.yapiFark[projeId];
  const yfSay = yf ? yf.sonuc.sadeceTest.length + yf.sonuc.sadeceUretim.length + yf.sonuc.farkli.length : null;
  const kart5 = kart(5, yfSay === 0, 'Yapı karşılaştırması',
    yfSay === null ? 'Bekliyor' : yfSay ? '🟡 ' + yfSay + ' fark' : '✓ Aynı',
    `<p class="sec-t-not">Erişim Kuralları'ndaki <b>aynı yapı SQL'ini</b> bu kez TEST projesinde çalıştır,
       sonucu yapıştır. Studio gerçek veritabanının yapısıyla karşılaştırır (RLS kuralları, yetkiler,
       fonksiyonlar, tetikleyiciler, tablolar). Yalnız okur.</p>`,
    dug('Yapı SQL\'ini kopyala', 'sec-t-yapi-kopya', '', false, !bagli)
    + dug('TEST yapısını yapıştır', 'sec-t-yapi', '', !yf, !bagli)
    + `<span class="sec-t-ipucu">TEST projesinin SQL Editor'ünde çalıştır</span>`);

  const liste = durum.maddeler.map(m => `
    <div class="sec-t-li"><span class="${m.ok ? 'sec-yesil' : 'sec-kirmizi'}">${m.ok ? '✓' : '✕'}</span>
      <span>${esc(m.metin)}</span><small>${esc(m.ek)}</small></div>`).join('');
  const emoji = { yesil: '🟢', sari: '🟡', kirmizi: '🔴' }[durum.renk];

  return ust + `
    <div class="sec-t-durum">
      <span class="sec-t-emoji">${emoji}</span>
      <span class="sec-t-durum-yz"><b>${esc(durum.baslik)}</b><i>${esc(durum.alt)}</i></span>
      ${bagli ? `<span class="sec-t-kalkan ${ayri ? '' : 'kotu'}">🛡️ ${ayri ? 'Production\'dan ayrı' : 'Production bilinmiyor'}:
        <b>${esc(secKisalt(uretimRef || '?', 4, 4))}</b> ≠ <b>${esc(secKisalt(o.test_ref, 4, 4))}</b></span>` : ''}
    </div>
    <div class="sec-t-izgara">${kart1}${kart2}${kart3}${kart4}${kart5}</div>
    <h3 class="sec-bas">Durum kontrolü</h3>
    <div class="sec-t-liste">${liste}</div>
    <div class="sec-t-dg">
      ${dug('Kontrol SQL\'ini kopyala', 'sec-t-kontrol-kopya', '', false, !bagli)}
      ${dug('Sonucu yapıştır', 'sec-t-kontrol', '', false, !bagli)}
    </div>
    <p class="sec-t-ipucu alt">${o.kontrol_tarihi ? 'Son kontrol: ' + esc(secTarih(o.kontrol_tarihi)) + ' · ' : ''}Kontrol SQL'i yalnız okur.</p>
    ${secYapiFarkHtml(projeId, k.yapi_tarihi)}`;
}

/* ==========================================================================
   EYLEMLER (data-eylem="sec-t-…")
   ========================================================================== */

function secTestBaglaPenceresi(projeId) {
  const o = SEC_TEST.kayit[projeId] || {};
  modalAc(`
    ${modalBaslik(ICON.gGuvenlik, 'Test Supabase projesi', 'Production\'dan AYRI, boş bir proje. service_role anahtarı istenmez.')}
    <label class="field"><span>Proje adresi</span>
      <input type="url" id="sec-t-url" placeholder="https://xxxx.supabase.co" value="${esc(o.test_url || '')}" autocomplete="off"></label>
    <label class="field"><span>Publishable / anon anahtarı</span>
      <input type="text" id="sec-t-anahtar" placeholder="sb_publishable_…" value="${esc(o.test_anahtar || '')}" autocomplete="off"></label>
    <div class="sec-hata" id="sec-hata" hidden></div>
    <div class="modal-alt">
      <button class="btn btn-ghost" data-m="iptal" type="button">Vazgeç</button>
      <button class="btn btn-primary" data-m="tamam" type="button"><span>Bağla</span></button>
    </div>`, kutu => {
    const hata = $('#sec-hata', kutu);
    const goster = m => { hata.hidden = false; hata.textContent = m; };
    $('[data-m="iptal"]', kutu).addEventListener('click', () => modalKapat());
    $('[data-m="tamam"]', kutu).addEventListener('click', async () => {
      const url = $('#sec-t-url', kutu).value.trim().replace(/\/+$/, '');
      const anahtar = $('#sec-t-anahtar', kutu).value.trim();
      const p = DB.proje(projeId);
      const testRef = secRef(url);
      const uretimRef = secUretimRef(p);
      const studioRef = secRef((typeof SUPABASE !== 'undefined' && SUPABASE.url) || '');
      if (!testRef) return goster('Adres https://<proje>.supabase.co biçiminde olmalı.');
      if (!uretimRef) return goster('Bu projenin production Supabase adresi Studio\'da kayıtlı değil. Karşılaştırma yapılamadığı için bağlantı engellendi — önce projenin Supabase bağlantısını gir.');
      if (testRef === uretimRef) return goster('⛔ Bu adres PRODUCTION\'ın kendisi. Test ortamı production olamaz — işlem durduruldu.');
      if (studioRef && testRef === studioRef) return goster('⛔ Bu adres Nizam Studio\'nun kendi veritabanı. Test ortamı olamaz.');
      const ah = secTestAnahtarHatasi(anahtar, testRef);
      if (ah) return goster(ah);
      const degisti = o.test_ref && o.test_ref !== testRef;
      const alan = { test_url: 'https://' + testRef + '.supabase.co', test_anahtar: anahtar,
        test_ref: testRef, uretim_ref: uretimRef };
      if (!o.test_ref || degisti) {
        Object.assign(alan, { kullanicilar: [], kontrol: null, kontrol_tarihi: null, kurulum_tarihi: null });
      }
      try {
        await SEC_TEST_VERI.kaydet(projeId, alan);
        modalKapat();
        toast(degisti ? 'Test projesi değişti — kullanıcılar ve kontrol sıfırlandı.' : 'Test projesi bağlandı.', 'basari');
        render();
      } catch (h) { goster(h.message); }
    });
  });
}

async function secTestKisileriOlustur(projeId, yeniden) {
  const k = SEC.kayit[projeId] || {};
  let o = SEC_TEST.kayit[projeId];
  if (!o || !o.test_ref || !k.model) return;
  /* Bağlıyken production ile karşılaştırmayı her seferinde yeniden yap. */
  const uretimRef = secUretimRef(DB.proje(projeId));
  if (!uretimRef || uretimRef === o.test_ref) { toast('Test projesi production\'dan ayrı değil — durduruldu.', 'hata'); return; }

  let kisiler = o.kullanicilar || [];
  if (yeniden || !kisiler.length) {
    kisiler = secTestKisiPlani(k.model, secKod());
    o = await SEC_TEST_VERI.kaydet(projeId, { kullanicilar: kisiler, kontrol: null, kontrol_tarihi: null });
  }
  SEC_TEST.mesgul[projeId] = true; render();
  let dogrulama = false, hata = '';
  try {
    for (const kisi of kisiler) {
      if (kisi.kimlik) continue;
      const r = await secTestKayitOl(o, kisi);
      if (r.kimlik) { kisi.kimlik = r.kimlik; continue; }
      if (r.dogrulama) { dogrulama = true; break; }
      hata = r.hata; break;
    }
    await SEC_TEST_VERI.kaydet(projeId, { kullanicilar: kisiler });
  } catch (h) { hata = h.message; }
  SEC_TEST.mesgul[projeId] = false; render();
  if (dogrulama) toast('Test projesinde e-posta doğrulaması AÇIK. "Confirm email"i kapat, sonra "Yeniden oluştur"a bas.', 'hata');
  else if (hata) toast(hata, 'hata');
  else toast('Test kullanıcıları oluşturuldu.', 'basari');
}

async function secTestEylem(e, el) {
  const projeId = el.dataset.id;
  const p = DB.proje(projeId);
  const k = SEC.kayit[projeId] || {};
  const o = SEC_TEST.kayit[projeId] || {};
  const kopyala = async (metin, ok) => {
    const sonuc = await panoyaKopyala(metin);
    toast(sonuc ? ok : 'Kopyalanamadı.', sonuc ? 'basari' : 'hata');
    return sonuc;
  };
  /* Kopyalamadan önce production ayrımını yeniden doğrula. */
  const ayriMi = () => {
    const u = secUretimRef(p);
    if (!o.test_ref || !u || u === o.test_ref) { toast('Test projesi production\'dan ayrı değil — durduruldu.', 'hata'); return false; }
    return true;
  };

  if (e === 'sec-t-bagla') { secTestBaglaPenceresi(projeId); return true; }

  if (e === 'sec-t-yapi-kopya') {
    await kopyala(SEC_YAPI_SQL, 'Yapı SQL\'i kopyalandı — bu kez TEST projesinin SQL Editor\'ünde çalıştır.');
    return true;
  }

  if (e === 'sec-t-yapi') {
    secYapistirPenceresi({
      baslik: 'TEST yapısı',
      aciklama: 'Yapı SQL\'inin TEST projesindeki çıktısını yapıştır. Gerçek veritabanının yapısıyla karşılaştırılır; hiçbir yere yazılmaz.',
      yerTutucu: '{"nizam_security":"yapi-3","tablolar":[…]}',
      dogrula: async metin => {
        const r = secYapiOku(metin);
        if (r.hata) return r;
        if (r.yapi.nizam_security !== SEC_YAPI_SURUM) return { hata: 'Eski yapı SQL\'inin çıktısı. "Yapı SQL\'ini kopyala" ile yenisini al.' };
        /* TEST'te Nizam işaret tablosu olur; yoksa büyük ihtimalle gerçek veritabanının çıktısı yapıştırıldı. */
        if (!r.yapi.tablolar.some(t => t.ad === 'nizam_test_ortami')) {
          return { hata: 'Bu çıktıda Nizam test işareti yok — gerçek veritabanının çıktısı olabilir. SQL\'i TEST projesinde çalıştır.' };
        }
        SEC_TEST.yapiFark[projeId] = { sonuc: secYapiKarsilastir(k.yapi, r.yapi), tarih: new Date().toISOString() };
        const f = SEC_TEST.yapiFark[projeId].sonuc;
        const n = f.sadeceTest.length + f.sadeceUretim.length + f.farkli.length;
        toast(n ? n + ' fark bulundu.' : 'Yapılar aynı.', n ? 'hata' : 'basari');
        render();
        return null;
      },
    });
    return true;
  }

  if (e === 'sec-t-kurulum') {
    if (!ayriMi() || !k.yapi) return true;
    /* Koruma: TEST'te gerçek veritabanına geçmemiş değişiklik varsa kurulum onları siler. */
    const yf = SEC_TEST.yapiFark[projeId];
    const kayip = yf ? yf.sonuc.sadeceTest.length + yf.sonuc.farkli.length : 0;
    if (kayip) {
      const evet = await metinSor({ baslik: 'TEST\'te geçmemiş değişiklikler var',
        aciklama: 'Son karşılaştırmaya göre TEST\'te gerçek veritabanında olmayan ya da farklı ' + kayip
          + ' şey var (aşağıdaki Yapı karşılaştırması). Kurulum TEST\'i gerçek veritabanına göre baştan kurar ve bunları SİLER. '
          + 'Önce bu düzeltmeleri gerçek veritabanına uygula. Yine de kurmak için SİL yaz.',
        yerTutucu: 'SİL', buton: 'Yine de kur' });
      if (!evet || evet.trim().toLocaleUpperCase('tr') !== 'SİL') return true;
    }
    const ortam = Object.assign({}, o, { uretim_ref: secUretimRef(p) });
    if (await kopyala(secTestKurulumSql(k.yapi, projeId, ortam), 'Kurulum SQL\'i kopyalandı — TEST projesinin SQL Editor\'ünde çalıştır.')) {
      SEC_TEST.yapiFark[projeId] = null;   // kurulumdan sonra karşılaştırma eskidi
      try { await SEC_TEST_VERI.devret(o.test_ref, projeId); } catch (h) {}
      try { await SEC_TEST_VERI.kaydet(projeId, { kurulum_tarihi: new Date().toISOString() }); render(); } catch (h) {}
    }
    return true;
  }

  if (e === 'sec-t-kisiler') { await secTestKisileriOlustur(projeId, false); return true; }

  if (e === 'sec-t-yeniden') {
    const evet = await metinSor({ baslik: 'Test kullanıcılarını yeniden oluştur',
      aciklama: 'Yeni e-posta ve şifrelerle hesaplar açılır. Eski test hesapları test projesinde kalır (silmek istersen Supabase panelinden). Onaylamak için EVET yaz.',
      yerTutucu: 'EVET', buton: 'Yeniden oluştur' });
    if (!evet || evet.trim().toUpperCase() !== 'EVET') return true;
    await secTestKisileriOlustur(projeId, true);
    return true;
  }

  if (e === 'sec-t-sifre') { SEC_TEST.goster[projeId] = !SEC_TEST.goster[projeId]; render(); return true; }

  if (e === 'sec-t-veri-prompt') {
    if (!k.yapi || !k.model) return true;
    await kopyala(secTestVeriPrompt(p, k.yapi, k.model, o.kullanicilar || []),
      'Prompt kopyalandı — Claude\'a yapıştır, verdiği SQL\'i 4. adıma yapıştır.');
    return true;
  }

  if (e === 'sec-t-veri') {
    if (!ayriMi()) return true;
    secYapistirPenceresi({
      baslik: 'Sentetik test verisi',
      aciklama: 'Claude\'un verdiği SQL\'i yapıştır. Nizam onu güvenlik kilidinin arkasına koyup panoya kopyalar.',
      yerTutucu: 'insert into public.subeler …',
      dogrula: async metin => {
        const r = secTestVeriOku(metin);
        if (r.hata) return r;
        try {
          await SEC_TEST_VERI.kaydet(projeId, { veri_sql: r.sql, veri_tarihi: new Date().toISOString() });
        } catch (h) { return { hata: h.message }; }
        await kopyala(secTestVeriSar(r.sql, projeId, o), 'Veri SQL\'i kopyalandı — TEST projesinin SQL Editor\'ünde çalıştır.');
        render();
        return null;
      },
    });
    return true;
  }

  if (e === 'sec-t-veri-kopya') {
    if (!ayriMi() || !o.veri_sql) return true;
    await kopyala(secTestVeriSar(o.veri_sql, projeId, o), 'Veri SQL\'i kopyalandı — TEST projesinin SQL Editor\'ünde çalıştır.');
    return true;
  }

  if (e === 'sec-t-kontrol-kopya') {
    await kopyala(secTestKontrolSql(o.kullanicilar || []), 'Kontrol SQL\'i kopyalandı — TEST projesinde çalıştır.');
    return true;
  }

  if (e === 'sec-t-kontrol') {
    secYapistirPenceresi({
      baslik: 'Durum kontrolü',
      aciklama: 'Kontrol SQL\'inin test projesindeki çıktısını yapıştır.',
      yerTutucu: '{"nizam_kontrol":"1", …}',
      dogrula: async metin => {
        const r = secTestKontrolOku(metin);
        if (r.hata) return r;
        try {
          await SEC_TEST_VERI.kaydet(projeId, { kontrol: r.kontrol, kontrol_tarihi: new Date().toISOString() });
        } catch (h) { return { hata: h.message }; }
        toast('Durum güncellendi.', 'basari');
        render();
        return null;
      },
    });
    return true;
  }
  return false;
}
