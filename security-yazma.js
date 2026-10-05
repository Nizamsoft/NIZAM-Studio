/* ==========================================================================
   NIZAM Security — Güvenlik Testleri: YAZMA (INSERT / UPDATE / DELETE)

   Okuma testleriyle aynı kişiler: test kullanıcıları GERÇEK Supabase girişi
   yapar (secOkumaGiris), giriş yapmamış ziyaretçi yalnız herkese açık
   anahtarla istek atar. Sahte JWT yok, rol taklidi yok.

   Beklenen davranış Erişim Kuralları modelinden gelir:
     ekle → INSERT · degistir → UPDATE · sil → DELETE
   kolon izni + satır kuralı (tum / kendi / şube / şart) birlikte.

   Karar HTTP durumuna göre değil, VERİNİN GERÇEKTEN DEĞİŞİP DEĞİŞMEDİĞİNE
   göre verilir. Bunu test projesine bir kez kurulan yardımcı fonksiyon
   (nizam_yazma_yardimci) bağımsız olarak okur; aynı yardımcı test kaydını
   temizler ve eski değeri geri yükler:
     - INSERT: oluşan kayıt hemen silinir.
     - UPDATE: mevcut test kaydı değiştirilir, eski değer geri yazılır.
     - DELETE: önce kaydın sentetik bir kopyası açılır, silme onda denenir;
       kopya kalırsa silinir. Mevcut test verisi silinmez.

   Production kilitleri (okuma testleriyle aynı):
     - Başlamadan: test ref ≠ production ref ≠ Studio ref (secUretimAyriMi).
     - Her istek yalnız https://<test_ref>.supabase.co adresine (secOkumaTaban).
     - Giriş biletinin yayıncısı test projesi değilse durur (secOkumaGiris).
     - Yardımcı SQL'i secKilitSql ile başlar; fonksiyon her çağrıda Nizam
       test işaretini ve çağıranın test hesabı olduğunu yeniden denetler.
     - Filtresiz UPDATE / DELETE isteği hiç gönderilmez.

   Sonuçlar YALNIZ BELLEKTE. Okuma testinin koduna dokunmaz; sonuç listesi
   Güvenlik Testleri ekranında okuma sonuçlarıyla birlikte gösterilir.
   index.html'de security-okuma.js'ten sonra.
   ========================================================================== */

'use strict';

const SEC_YARDIMCI = 'nizam_yazma_yardimci';
const SEC_YARDIMCI_SURUM = '3';   // 2: anahtarlar sınırsız · 3: ekle_grup / sil_grup (tek işlemde birden fazla kayıt)
const SEC_YAZMA = { sonuc: {}, ilerleme: {}, calisiyor: {} };
/* Değişmesi yetki yükseltmesi demek olan kolonlar (varsa önce bunlar denenir). */
const SEC_AD_KOLON = /^(ad|adi|isim|unvan|baslik|name|title|kod|kodu|no|numara)$|_(ad|adi|isim|unvan|baslik|kod|kodu|no)$/i;
const SEC_GUVENLIK_KOLON = /^(role|rol|roller|layer|seviye|katman|yetki|branch|branch_id|sube|sube_id|şube_id|auth_id|user_id|kullanici_id|status|durum)$/i;

/* ==========================================================================
   YARDIMCI SQL — test projesine bir kez kurulur
   ========================================================================== */

function secYardimciSql(projeId, ortam) {
  const epostalar = (ortam.kullanicilar || []).map(k => secQl(String(k.eposta || '').toLowerCase())).join(', ') || "''";
  return `-- NIZAM Security · Yazma testi yardımcısı
-- YALNIZ TEST PROJESİNDE çalıştır: ${ortam.test_ref}.supabase.co
-- Tek bir fonksiyon kurar (tablo yok). Yazma testlerinde sonucu bağımsız okur,
-- test kaydını siler ve eski değeri geri yükler. Yalnız Nizam test hesapları çağırabilir.
-- Nizam test ortamı işareti yoksa (production gibi) kendini durdurur.
begin;
${secKilitSql(projeId, false)}

create or replace function public.${SEC_YARDIMCI}(p_islem text, p_tablo text default null, p_veri jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $nizam_yardimci$
declare
  v_proje text;
  v_kosul jsonb := coalesce(p_veri -> 'kosul', '{}'::jsonb);
  v_satir jsonb := coalesce(p_veri -> 'satir', '{}'::jsonb);
  v_kol   text;
  v_n     bigint;
  v_sonuc jsonb;
  v_oge   jsonb;
  v_t     text;
  v_r     jsonb;
begin
  -- 1) Yalnız bu projenin Nizam test ortamı
  if to_regclass('public.nizam_test_ortami') is null then
    raise exception 'NIZAM: burası Nizam test ortamı değil';
  end if;
  execute 'select proje_id from public.nizam_test_ortami where anahtar = ''nizam''' into v_proje;
  if v_proje is distinct from ${secQl(projeId)} then
    raise exception 'NIZAM: bu test ortamı başka bir projeye ait';
  end if;
  -- 2) Yalnız Nizam test hesapları
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> all (array[${epostalar}]) then
    raise exception 'NIZAM: yalnız Nizam test hesapları kullanabilir — yardımcı SQL''ini yeniden çalıştır';
  end if;
  if p_islem = 'surum' then
    return jsonb_build_object('nizam_yardimci', '${SEC_YARDIMCI_SURUM}', 'proje', v_proje,
      'bypass', (select r.rolsuper or r.rolbypassrls from pg_roles r where r.rolname = current_user));
  end if;
  -- Grup: birden fazla kaydı TEK işlemde ekler/siler. Ertelenmiş (DEFERRABLE) kurallar
  -- (ör. fiş denk olmalı, irsaliye en az bir satır) işlem sonunda bir kez denetlenir.
  if p_islem in ('ekle_grup', 'sil_grup') then
    v_sonuc := '[]'::jsonb;
    for v_oge in select value from jsonb_array_elements(coalesce(p_veri -> 'grup', '[]'::jsonb)) loop
      v_t := v_oge ->> 'tablo';
      if v_t is null or v_t = 'nizam_test_ortami' or not exists (
          select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname = v_t and c.relkind in ('r', 'p')) then
        raise exception 'NIZAM: tablo bulunamadı: %', v_t;
      end if;
      if p_islem = 'ekle_grup' then
        v_satir := coalesce(v_oge -> 'satir', '{}'::jsonb);
        select string_agg(quote_ident(k), ', ') into v_kol from jsonb_object_keys(v_satir) k;
        if v_kol is null then raise exception 'NIZAM: boş kayıt'; end if;
        execute format('insert into public.%I as t (%s) select %s from jsonb_populate_record(null::public.%I, $1) returning to_jsonb(t)',
          v_t, v_kol, v_kol, v_t) into v_r using v_satir;
        v_sonuc := v_sonuc || jsonb_build_array(jsonb_build_object('tablo', v_t, 'satir', v_r));
      else
        v_kosul := coalesce(v_oge -> 'kosul', '{}'::jsonb);
        if jsonb_typeof(v_kosul) <> 'object' or v_kosul = '{}'::jsonb then
          raise exception 'NIZAM: koşulsuz yazma reddedildi';
        end if;
        execute format('select count(*) from public.%I t where to_jsonb(t) @> $1', v_t) into v_n using v_kosul;
        if v_n > 1 then raise exception 'NIZAM: koşul birden fazla kayda uyuyor — reddedildi'; end if;
        execute format('delete from public.%I t where to_jsonb(t) @> $1', v_t) using v_kosul;
        v_sonuc := v_sonuc || jsonb_build_array(v_n);
      end if;
    end loop;
    return v_sonuc;
  end if;

  -- 3) Yalnız public şemadaki gerçek tablolar
  if p_tablo is null or p_tablo = 'nizam_test_ortami' or not exists (
      select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = p_tablo and c.relkind in ('r', 'p')) then
    raise exception 'NIZAM: tablo bulunamadı: %', p_tablo;
  end if;

  if p_islem = 'oku' then
    execute format('select coalesce(jsonb_agg(to_jsonb(x)), ''[]''::jsonb) from (select * from public.%I t where to_jsonb(t) @> $1 limit 200) x', p_tablo)
      into v_sonuc using v_kosul;
    return v_sonuc;
  end if;

  if p_islem = 'anahtarlar' then
    execute format('select coalesce(jsonb_agg(a.k), ''[]''::jsonb) from public.%I t'
      || ' cross join lateral (select jsonb_object_agg(e, to_jsonb(t) -> e) k from jsonb_array_elements_text($1) e) a', p_tablo)
      into v_sonuc using coalesce(p_veri -> 'pk', '[]'::jsonb);
    return v_sonuc;
  end if;

  if p_islem = 'ekle' then
    select string_agg(quote_ident(k), ', ') into v_kol from jsonb_object_keys(v_satir) k;
    if v_kol is null then raise exception 'NIZAM: boş kayıt'; end if;
    execute format('insert into public.%I as t (%s) select %s from jsonb_populate_record(null::public.%I, $1) returning to_jsonb(t)',
      p_tablo, v_kol, v_kol, p_tablo) into v_sonuc using v_satir;
    return v_sonuc;
  end if;

  if p_islem in ('sil', 'geri') then
    -- Koşulsuz ya da birden fazla kayda uyan yazma reddedilir.
    if jsonb_typeof(v_kosul) <> 'object' or v_kosul = '{}'::jsonb then
      raise exception 'NIZAM: koşulsuz yazma reddedildi';
    end if;
    execute format('select count(*) from public.%I t where to_jsonb(t) @> $1', p_tablo) into v_n using v_kosul;
    if v_n > 1 then raise exception 'NIZAM: koşul birden fazla kayda uyuyor — reddedildi'; end if;
    if v_n = 0 then return '0'::jsonb; end if;
    if p_islem = 'sil' then
      execute format('delete from public.%I t where to_jsonb(t) @> $1', p_tablo) using v_kosul;
      return '1'::jsonb;
    end if;
    select string_agg(format('%I = r.%I', k, k), ', ') into v_kol from jsonb_object_keys(v_satir) k;
    if v_kol is null then return '0'::jsonb; end if;
    execute format('update public.%I t set %s from jsonb_populate_record(null::public.%I, $2) r where to_jsonb(t) @> $1',
      p_tablo, v_kol, p_tablo) using v_kosul, v_satir;
    return '1'::jsonb;
  end if;

  raise exception 'NIZAM: bilinmeyen işlem %', p_islem;
end
$nizam_yardimci$;

revoke all on function public.${SEC_YARDIMCI}(text, text, jsonb) from public, anon;
grant execute on function public.${SEC_YARDIMCI}(text, text, jsonb) to authenticated;
commit;
notify pgrst, 'reload schema';
select 'NIZAM: Yazma testi yardımcısı kuruldu.' as sonuc;`;
}

/* ==========================================================================
   İSTEKLER — yalnız test projesi
   ========================================================================== */

async function secYardimci(o, jeton, islem, tablo, veri) {
  const r = await fetch(secOkumaTaban(o) + '/rest/v1/rpc/' + SEC_YARDIMCI, {
    method: 'POST',
    headers: { apikey: o.test_anahtar, Authorization: 'Bearer ' + jeton,
      'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ p_islem: islem, p_tablo: tablo || null, p_veri: veri || {} }),
  });
  let j = null;
  try { j = await r.json(); } catch (h) {}
  if (r.ok) return j;
  if (r.status === 404 || (j && j.code === 'PGRST202')) {
    throw new Error('Yazma testi yardımcısı test projesinde kurulu değil — "Yardımcı SQL\'i kopyala" ile kur.');
  }
  throw new Error('Yardımcı: ' + String((j && (j.message || j.code)) || ('HTTP ' + r.status)));
}

/* Test edilen kişinin yazma isteği. jeton yoksa giriş yapmamış ziyaretçi. */
async function secYazIstek(o, jeton, yontem, yol, govde) {
  if (yontem !== 'POST' && !/\?.+=(eq|in)\./.test(yol)) throw new Error('Filtresiz yazma isteği engellendi.');
  const r = await fetch(secOkumaTaban(o) + '/rest/v1/' + yol, {
    method: yontem,
    headers: Object.assign({ apikey: o.test_anahtar, 'Content-Type': 'application/json',
      Accept: 'application/json', Prefer: 'return=minimal' }, jeton ? { Authorization: 'Bearer ' + jeton } : {}),
    body: govde === undefined ? undefined : JSON.stringify(govde),
  });
  let j = null;
  try { j = await r.json(); } catch (h) {}
  return { ok: r.ok, durum: r.status, kod: String((j && j.code) || ''),
    mesaj: r.ok ? '' : String((j && (j.message || j.hint)) || ('HTTP ' + r.status)) };
}

const secAyni = (a, b) => JSON.stringify(a === undefined ? null : a) === JSON.stringify(b === undefined ? null : b);
const secHataKisa = c => (c.mesaj ? (c.kod ? c.kod + ': ' : '') + c.mesaj.slice(0, 140) : '');

/* Hata türü: yalnız yetki reddi bir şey kanıtlar; ötekilerde yetki hiç denenmemiştir.
   yok · red (yetki) · kisit (23xxx: NOT NULL, UNIQUE, FK, CHECK) · kural (P0001: uygulamanın kendi kuralı) · veri */
function secHataTur(c) {
  if (!c || (!c.kod && !c.mesaj)) return 'yok';
  if (c.kod === '42501' || /row-level security|permission denied/i.test(c.mesaj) || c.durum === 401 || c.durum === 403) return 'red';
  if (/^23/.test(c.kod)) return 'kisit';
  /* Yetki kontrolü yapan tetikleyici (ör. "en üst katman yetkisi ister") bir yetki reddidir. */
  if (c.kod === 'P0001') return /yetki/i.test(c.mesaj) ? 'red' : 'kural';
  return 'veri';
}
const SEC_HATA_AD = { kisit: 'kısıt hatası', kural: 'uygulama kuralı reddetti', veri: 'veri/istek hatası' };
const secTekrarDene = c => ['kisit', 'kural', 'veri'].includes(secHataTur(c));   // başka değerle yeniden denenebilir

/* Ortak karar. Asıl ölçü: veri gerçekten değişti mi. */
function secKarar(cevap, degisti, bek, evet, hayir) {
  if (degisti) return { gercek: evet, sonuc: bek ? 'gecti' : 'acik' };
  const tur = secHataTur(cevap), h = secHataKisa(cevap);
  if (tur === 'yok' || tur === 'red') {
    return bek
      ? { gercek: hayir + ' — erişim fazla kısıtlı' + (h ? ' (' + h + ')' : ''), sonuc: 'edilemedi' }
      : { gercek: hayir + (h ? ' (' + h + ')' : ''), sonuc: 'gecti' };
  }
  /* Programın kendi kuralı (P0001, yetki dışı mesaj) işlemi durdurdu: işlem gerçekleşmedi.
     Güvenlik açısından sonuç doğru → 🟢, sebep kartta yazılı. Yalnız P0001; kısıt ve
     veri hataları testin yanlış değerinden de çıkabilir, onlar 🟡 kalır. */
  if (tur === 'kural') {
    return { gercek: hayir + (bek ? ' · programın kuralı: ' + h : ' · programın kuralı engelledi (' + h + ')'), sonuc: 'gecti' };
  }
  return { gercek: hayir + ' · ' + SEC_HATA_AD[tur] + ', yetki denenemedi (' + h + ')', sonuc: 'edilemedi' };
}

function secPkKosul(b, x) {
  const k = {};
  b.pk.forEach(c => {
    if (x[c] === null || x[c] === undefined) throw new Error('Kaydın kimliği boş.');
    k[c] = x[c];
  });
  return k;
}
const secPkFiltre = (b, x) => b.pk.map(c => encodeURIComponent(secKolonAdi(c)) + '=eq.' + encodeURIComponent(String(x[c]))).join('&');

/* ==========================================================================
   KAYIT HAZIRLAMA
   ========================================================================== */

/* Okuma haritasıyla aynı biçim: k (kimlik), s (sahip), g (şube), v (şart kolonları). */
function secYazSatir(x, b) {
  const s = v => (v === null || v === undefined ? null : typeof v === 'object' ? JSON.stringify(v) : String(v));
  const v = {};
  (b.sart || []).forEach(c => { v[c] = s(x[c]); });
  return { k: b.pk ? b.pk.map(c => s(x[c])).join('|') : null,
    s: b.sahip ? s(x[b.sahip]) : null, g: b.sube ? s(x[b.sube]) : null, v, x };
}

/* Veritabanının kendisinin doldurduğu kolonlar gönderilmez. */
const secAtla = k => k.uretilmis === 's' || k.kimlik === 'a' || (k.pk && !!(k.varsayilan || k.kimlik));
const secZorunlu = k => !secAtla(k) && !k.bos_olabilir && !k.varsayilan && !k.kimlik;
const secRastgele = () => Math.random().toString(36).slice(2, 8);
const secTip = k => String((k && k.tip) || '').toLowerCase();
const secMetinTip = t => /char|text|citext/.test(t);
const secSayiTip = t => /int|numeric|decimal|real|double|float|money/.test(t);

/* Benzersizlik grupları: birincil anahtar + her UNIQUE kısıtı (kolon listesi). */
function secAnahtarGruplari(bt) {
  const gruplar = [];
  const pk = bt.kolonlar.filter(k => k.pk).map(k => k.ad);
  if (pk.length) gruplar.push(pk);
  (bt.kisitlar || []).forEach(k => {
    const m = /^\s*UNIQUE\s*(?:NULLS\s+NOT\s+DISTINCT\s*)?\(([^)]*)\)/i.exec(k.tanim || '');
    if (m) gruplar.push(m[1].split(',').map(c => c.trim().replace(/^"|"$/g, '')));
  });
  return gruplar;
}

const secKacis = x => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/* Kolon adını CHECK metninde arayan parça: (kolon), "kolon", (kolon)::text … */
const secKolonDesen = ad => '\\(*"?' + secKacis(ad) + '"?\\)*(?:::[a-z ]+(?:\\[\\])?)?\\)*';
const secCheckler = (cx, ad) => (cx.bt.kisitlar || []).map(x => x.tanim || '')
  .filter(t => /^\s*CHECK/i.test(t) && new RegExp('(^|[^a-z0-9_])"?' + secKacis(ad) + '"?([^a-z0-9_]|$)', 'i').test(t));

/* Kolonun kabul ettiği değerler: enum tipi ya da CHECK'teki izinli liste
   (kolon = ANY (ARRAY['a','b']) — IN (...) de böyle görünür). Yoksa null.
   Başka sabitler (ör. btrim(x) <> '') izinli değer DEĞİLDİR. */
function secIzinliDegerler(cx, k) {
  const tip = secTip(k).replace(/^public\./, '').replace(/"/g, '');
  if (cx.tipler && cx.tipler[tip]) return cx.tipler[tip].slice();
  const re = new RegExp('(?:^|[^a-z0-9_])' + secKolonDesen(k.ad) + '\\s*=\\s*ANY\\s*\\(+\\s*ARRAY\\s*\\[([^\\]]*)\\]', 'gi');
  const out = [];
  secCheckler(cx, k.ad).forEach(t => {
    for (const m of t.matchAll(re)) {
      for (const d of m[1].matchAll(/'((?:[^']|'')*)'/g)) {
        let v = d[1].replace(/''/g, "'");
        if (secSayiTip(secTip(k)) && Number.isFinite(Number(v))) v = Number(v);
        if (!out.some(o => secAyni(o, v))) out.push(v);
      }
    }
  });
  return out.length ? out : null;
}

/* Sayı kolonunun CHECK aralığı (ör. gun >= 1 AND gun <= 31): {min, max}. */
function secAralik(cx, k) {
  let min = -Infinity, max = Infinity;
  const re = new RegExp('(?:^|[^a-z0-9_])' + secKolonDesen(k.ad) + '\\s*(>=|>|<=|<)\\s*\\(*\'?(-?\\d+(?:\\.\\d+)?)', 'gi');
  secCheckler(cx, k.ad).forEach(t => {
    for (const m of t.matchAll(re)) {
      const n = Number(m[2]);
      if (m[1] === '>=') min = Math.max(min, n); else if (m[1] === '>') min = Math.max(min, n + 1);
      else if (m[1] === '<=') max = Math.min(max, n); else max = Math.min(max, n - 1);
    }
  });
  return { min, max };
}

/* Metin kolonunun en fazla uzunluğu: varchar(n) ya da CHECK length(x) <= n. */
function secUzunluk(cx, k) {
  const m = /character varying\((\d+)\)|varchar\((\d+)\)|character\((\d+)\)/.exec(secTip(k));
  let n = m ? Number(m[1] || m[2] || m[3]) : Infinity;
  const re = new RegExp('(?:char_length|length)\\s*\\(+\\s*' + secKolonDesen(k.ad) + '\\s*\\)*\\s*(<=|<)\\s*\\(*(\\d+)', 'gi');
  secCheckler(cx, k.ad).forEach(t => {
    for (const x of t.matchAll(re)) n = Math.min(n, Number(x[2]) - (x[1] === '<' ? 1 : 0));
  });
  return n;
}

/* Metne ek: boş olmayan, uzunluk sınırına sığan. */
function secMetinEk(cx, k, simdi) {
  const ek = ' (test ' + secRastgele().slice(0, 4) + ')';
  const kok = simdi === null || simdi === undefined || String(simdi).trim() === '' || k.pk ? 'nizam-test' : String(simdi);
  const n = secUzunluk(cx, k);
  if (n === Infinity) return kok + ek;
  const kisa = 't' + secRastgele().slice(0, 5);
  return n >= kok.length + ek.length ? kok + ek : n >= kisa.length ? (kok.slice(0, n - kisa.length) + kisa) : secRastgele().slice(0, Math.max(1, n));
}

/* Tipe göre üretilen, şimdikinden farklı değerler (kısıtlara uyacak biçimde). */
function secUretilenler(cx, k, simdi) {
  const tip = secTip(k);
  const izinli = secIzinliDegerler(cx, k);
  if (izinli) return izinli;
  if (/\[\]$/.test(tip)) return [];
  if (/uuid/.test(tip)) return [crypto.randomUUID()];
  if (secMetinTip(tip)) return [secMetinEk(cx, k, simdi)];
  if (secSayiTip(tip)) {
    const { min, max } = secAralik(cx, k);
    const kullanilan = new Set(cx.ornek.map(s => Number(s.x[k.ad])).filter(Number.isFinite));
    const tam = /int/.test(tip);
    const n = Number(simdi);
    const out = [];
    const ekle = v => { if (v >= min && v <= max && !(Number.isFinite(n) && v === n) && !out.includes(v)) out.push(v); };
    /* Önce mevcut en küçük ile en büyük değerin ARASINDA, kullanılmayan bir değer.
       Yetki fonksiyonu tablodaki max/min'e bakabilir (ör. ns_ust_katman_mi:
       seviye = max(seviye)); sentetik kopya o sınırı değiştirmemeli. */
    const dizi = [...kullanilan].sort((a, b) => a - b);
    for (let i = dizi.length - 1; i > 0 && out.length < 2; i--) {
      const [a, b] = [dizi[i - 1], dizi[i]];
      const v = tam ? Math.floor((a + b) / 2) : (a + b) / 2;
      if (v > a && v < b) ekle(v);
    }
    if (out.length) return out;
    if (dizi.length) cx.sinirNot = k.ad;      // arada boş yer yok: sınır değişebilir
    if (Number.isFinite(min) || Number.isFinite(max)) {
      /* Aralık içinde: önce tabloda geçmeyen, sonra mevcut değerin bir yanı. */
      const alt = Number.isFinite(min) ? min : (Number.isFinite(max) ? max - 1000 : 0);
      const ust = Number.isFinite(max) ? max : alt + 1000;
      for (let v = alt; v <= ust && out.length < 2; v += 1) if (!kullanilan.has(v)) ekle(v);
      if (Number.isFinite(n)) { ekle(n + 1); ekle(n - 1); }
      ekle(alt);
    } else {
      const enBuyuk = Math.max(0, ...[...kullanilan]);
      ekle((tam ? Math.floor(enBuyuk) : enBuyuk) + 1 + Math.floor(Math.random() * 1000));
    }
    return out;
  }
  if (/bool/.test(tip)) return [!simdi];
  if (/^date$|timestamp/.test(tip)) {
    let d = new Date(simdi || Date.now());
    if (isNaN(d.getTime())) d = new Date();
    d = new Date(d.getTime() + (1 + Math.floor(Math.random() * 300)) * 86400000);
    return [/^date$/.test(tip) ? d.toISOString().slice(0, 10) : d.toISOString()];
  }
  if (/json/.test(tip)) {
    const isaret = { nizam_test: secRastgele() };
    return [simdi && typeof simdi === 'object' && !Array.isArray(simdi) ? Object.assign({}, simdi, isaret) : isaret];
  }
  return [];
}

/* Kimlik / benzersiz kolon için yeni değer adayları. Bağlı kolonda bağlı tablonun
   değerleri (tabloda henüz geçmeyenler önce). */
function secYeniAdaylar(cx, k, eski) {
  const fk = cx.fk[k.ad];
  if (!fk) return secUretilenler(cx, k, eski).filter(v => !secAyni(v, eski));
  const kullanilan = new Set(cx.ornek.map(s => JSON.stringify(s.x[k.ad])));
  return fk.filter(v => !kullanilan.has(JSON.stringify(v))).concat(fk.filter(v => kullanilan.has(JSON.stringify(v))))
    .filter(v => !secAyni(v, eski));
}

/* Bir kaynak kayıttan yeni, sentetik bir kayıt. Her benzersizlik grubu (kimlik,
   UNIQUE) tabloda zaten varsa grubun YALNIZ BİR kolonu değiştirilir; sahip, şube ve
   şart kolonları (hedefin kapsamı) en son seçenektir. Gerekirse iki kolon birden. */
function secTaslak(cx, x) {
  const t = {};
  const kol = {};
  cx.bt.kolonlar.forEach(k => {
    kol[k.ad] = k;
    if (!secAtla(k) && k.ad in x) t[k.ad] = x[k.ad];
  });
  const korunan = new Set([cx.b.sahip, cx.b.sube].concat(cx.b.sart || []).filter(Boolean));
  /* Ad / unvan / kod gibi kolonlara ek: uygulamanın "aynı ad iki kez olmaz" kuralına takılmasın. */
  cx.bt.kolonlar.forEach(k => {
    if (!(k.ad in t) || k.pk || korunan.has(k.ad) || cx.fk[k.ad] || !SEC_AD_KOLON.test(k.ad)) return;
    if (!secMetinTip(secTip(k)) || secIzinliDegerler(cx, k) || t[k.ad] === null || t[k.ad] === undefined) return;
    t[k.ad] = secMetinEk(cx, k, t[k.ad]);
  });
  const puan = c => (korunan.has(c) ? 8 : 0) + (cx.fk[c] ? 2 : 0) + (secIzinliDegerler(cx, kol[c]) ? 1 : 0);
  for (const grup of secAnahtarGruplari(cx.bt)) {
    /* Bileşik anahtarın varsayılanlı parçası da kopyaya girer; yoksa veritabanı aynı
       varsayılanla doldurur ve anahtar çakışır (ör. hesap_kisayollari (yer, hesap_id)). */
    if (grup.length > 1) {
      grup.forEach(c => {
        if (!(c in t) && c in x && kol[c] && kol[c].uretilmis !== 's' && kol[c].kimlik !== 'a') t[c] = x[c];
      });
    }
    if (grup.some(c => !(c in t) || !kol[c])) continue;            // veritabanı dolduruyor
    if (grup.some(c => t[c] === null || t[c] === undefined)) continue; // boş değer çakışmaz
    const var_ = new Set(cx.ornek.map(s => JSON.stringify(grup.map(c => s.x[c]))));
    const bos = () => !var_.has(JSON.stringify(grup.map(c => t[c])));
    if (bos()) continue;
    const sirali = grup.slice().sort((a, b) => puan(a) - puan(b));
    let bulundu = false;
    for (const c of sirali) {
      const eski = t[c];
      for (const v of secYeniAdaylar(cx, kol[c], eski)) { t[c] = v; if (bos()) { bulundu = true; break; } }
      if (bulundu) break;
      t[c] = eski;
    }
    for (let i = 0; !bulundu && i < sirali.length; i++) {
      for (let j = i + 1; !bulundu && j < sirali.length; j++) {
        const [a, b] = [sirali[i], sirali[j]];
        const ea = t[a], eb = t[b];
        const la = [ea].concat(secYeniAdaylar(cx, kol[a], ea)).slice(0, 30);
        const lb = [eb].concat(secYeniAdaylar(cx, kol[b], eb)).slice(0, 30);
        for (const va of la) {
          for (const vb of lb) { t[a] = va; t[b] = vb; if (bos()) { bulundu = true; break; } }
          if (bulundu) break;
        }
        if (!bulundu) { t[a] = ea; t[b] = eb; }
      }
    }
  }
  return t;
}

/* Değiştirmek için aday değerler. Bağlı kolonda bağlı tablonun değerleri; enum/CHECK
   kolonunda yalnız kabul edilen değerler; yetki kolonunda önce başka kayıtların
   değeri (ör. başka bir rol), öteki kolonlarda önce üretilen değer. */
function secAdaylar(cx, c, simdi) {
  const out = [];
  const ekle = v => { if (v !== null && v !== undefined && !secAyni(v, simdi) && !out.some(o => secAyni(o, v))) out.push(v); };
  const k = cx.bt.kolonlar.find(x => x.ad === c) || { ad: c };
  if (cx.fk[c]) { secYeniAdaylar(cx, k, simdi).forEach(ekle); return out.slice(0, 4); }
  const izinli = secIzinliDegerler(cx, k);
  if (izinli) { izinli.forEach(ekle); return out.slice(0, 4); }
  const diger = () => cx.ornek.forEach(s => ekle(s.x[c]));
  if (SEC_GUVENLIK_KOLON.test(c)) { diger(); secUretilenler(cx, k, simdi).forEach(ekle); }
  else { secUretilenler(cx, k, simdi).forEach(ekle); diger(); }
  return out.slice(0, 4);
}

/* ==========================================================================
   KURAL → BEKLENTİ
   ========================================================================== */

/* rol null: giriş yapmamış kişi ve modelde Ziyaretçi rolü yok → her şey yasak. */
/* Modelde rol bu tabloya "fonksiyon_ile" yazıyorsa doğrudan tablo yazması beklenmez. */
const secFonksiyonIle = (m, rol) => !!(rol && m.yazma && m.yazma[rol] === 'fonksiyon_ile');

function secYazBek(m, kolon, rol, izin, satir, b, ben) {
  if (!rol || secFonksiyonIle(m, rol)) return { v: false };
  const c = m.kolonlar.find(x => x.ad === kolon);
  if (!c) return { v: null, neden: 'Modelde "' + kolon + '" kolonu için karar yok' };
  if (!(c.izin[rol] || []).includes(izin)) return { v: false };
  return secKapsar(c.satir[rol] || m.satir[rol], satir, b, ben);
}

function secSilBek(m, rol, satir, b, ben) {
  if (!rol || secFonksiyonIle(m, rol) || !m.kolonlar.some(c => (c.izin[rol] || []).includes('sil'))) return { v: false };
  return secKapsar(m.satir[rol], satir, b, ben);
}

/* Birden fazla kolon birlikte: biri yasaksa yasak, hepsi izinliyse izinli. */
function secBirlesik(liste) {
  if (liste.some(r => r.v === false)) return { v: false };
  const n = liste.find(r => r.v === null);
  return n || { v: true };
}

/* Okuma testindeki hedef seçimiyle aynı mantık. Kayıt yoksa INSERT/DELETE için
   sahip kolonu değiştirilmiş sentetik bir hedef üretilir (UPDATE'te 🟡). */
function secYazHedefler(cx) {
  const { m, b, rol, ben, esler } = cx;
  const satirlar = cx.ornek;
  const h = [];
  const kullan = new Set();
  const sec = (ad, bul, uret) => {
    const x = satirlar.find(s => !kullan.has(s.k) && bul(s)) || satirlar.find(bul);
    if (x) { kullan.add(x.k); h.push({ ad, satir: x }); return; }
    const u = uret && satirlar[0] ? uret(satirlar[0]) : null;
    h.push(u ? { ad, satir: u, sentetik: true } : { ad, yok: true });
  };
  const sahipli = (x, uid) => secYazSatir(Object.assign({}, x.x, { [b.sahip]: uid }), b);
  const kural = m.satir[rol];
  if (secKuralTur(kural) === 'sart') {
    sec('Şarta uyan kayıt', s => secKapsar(kural, s, b, ben).v === true);
    sec('Şarta uymayan kayıt', s => secKapsar(kural, s, b, ben).v === false);
    return h;
  }
  if (b.sahip && ben.uid) {
    sec('Kendi kaydı', s => s.s === ben.uid, x => sahipli(x, ben.uid));
    const es = Object.keys(esler).find(u => u !== ben.uid);
    const testKisisi = satirlar.some(s => s.s && s.s !== ben.uid && esler[s.s]);
    sec('Başka kullanıcının kaydı', s => s.s !== null && s.s !== ben.uid && (!testKisisi || !!esler[s.s]),
      es ? x => sahipli(x, es) : null);
  }
  const subeKurali = [kural].concat(m.kolonlar.map(c => c.satir[rol])).some(d => secKuralTur(d) === 'sube');
  if (b.sube && subeKurali) {
    if (!ben.sube) h.push({ ad: 'Başka şubenin kaydı', yok: true, neden: 'Kullanıcının şubesi veriden bulunamadı' });
    else {
      sec('Kendi şubesinin kaydı', s => s.g === ben.sube);
      sec('Başka şubenin kaydı', s => s.g !== null && s.g !== ben.sube);
    }
  }
  if (!h.length) sec('Bir kayıt', () => true);
  return h;
}

function secHedefAd(cx, ad, satir) {
  return /^Başka kullanıcının/.test(ad) && satir && cx.esler[satir.s] ? ad + ' · ' + cx.esler[satir.s] : ad;
}

/* ==========================================================================
   KÜME — tek başına geçerli olmayan kayıtlar
   Bazı tablolar tek satırı kabul etmez (ertelenmiş kural):
     kardes: aynı fişin bacakları birlikte (ör. borç = alacak) → aynı tabloda grup
     cocuk:  üst kayıt en az bir alt satırla (ör. irsaliye + kalemleri) → iki tablo
   Yardımcı bu kümeyi TEK işlemde açar ve siler (ekle_grup / sil_grup).
   ========================================================================== */

/* Alt tablo için hafif bağlam (aynı taslak/değer üreticileri). */
function secAltCx(cx, tablo) {
  const t = cx.tum;
  return { bt: t.yt[tablo], fk: t.fkler[tablo] || {}, ornek: t.ornek[tablo] || [], tipler: cx.tipler,
    b: { ad: tablo, sahip: null, sube: null, sart: [] } };
}

/* Üst kayda açıkça verilecek yeni kimlik (alt satırlar ona bağlanacak). */
function secAcikKimlik(cx, k) {
  const tip = secTip(k);
  if (k.kimlik === 'a' || k.uretilmis === 's') return undefined;
  if (/uuid/.test(tip)) return crypto.randomUUID();
  if (secMetinTip(tip)) return 'nizam-test-' + secRastgele();
  if (/int|numeric/.test(tip)) {
    const say = cx.ornek.map(s => Number(s.x[k.ad])).filter(Number.isFinite);
    return Math.floor(Math.max(0, ...say)) + 1000 + Math.floor(Math.random() * 100000);
  }
  return undefined;
}

/* Bir kaynak kayıttan küme planı: [{tablo, satir}] + bu tablonun taslakları. */
async function secKumePlani(cx, x, mod) {
  const { b, bt } = cx;
  if (mod === 'tek') return { mod, grup: [{ tablo: b.ad, satir: secTaslak(cx, x) }] };
  if (mod.indexOf('kardes:') === 0) {
    const f = mod.slice(7);
    if (x[f] === null || x[f] === undefined) return null;
    const kardes = cx.ornek.filter(s => secAyni(s.x[f], x[f])).map(s => s.x).slice(0, 20);
    if (kardes.length < 2) return null;
    return { mod, grup: kardes.map(k => ({ tablo: b.ad, satir: secTaslak(cx, k) })) };
  }
  /* cocuk: üst kayıt açık kimlikle, alt satırlar ona bağlı. */
  if (!b.pk || b.pk.length !== 1) return null;
  const pkK = bt.kolonlar.find(k => k.ad === b.pk[0]);
  const yeni = secAcikKimlik(cx, pkK);
  if (yeni === undefined) return null;
  const ust = secTaslak(cx, x);
  ust[pkK.ad] = yeni;
  const grup = [{ tablo: b.ad, satir: ust }];
  for (const t of Object.values(cx.tum.yt)) {
    for (const f of (t.iliskiler || [])) {
      if (f.hedef_tablo !== b.ad || f.hedef_kolon !== pkK.ad || !f.kolon || f.kolon.indexOf(',') >= 0) continue;
      const alt = await secYardimci(cx.o, cx.gozcu, 'oku', t.ad, { kosul: { [f.kolon]: x[pkK.ad] } });
      const acx = secAltCx(cx, t.ad);
      alt.slice(0, 10).forEach(a => {
        const s = secTaslak(acx, a);
        s[f.kolon] = yeni;
        grup.push({ tablo: t.ad, satir: s });
      });
    }
  }
  return grup.length > 1 ? { mod, grup } : null;
}

function secKumeModlari(cx) {
  const kardes = (cx.bt.iliskiler || []).map(f => f.kolon)
    .filter(c => c && c.indexOf(',') < 0 && !(cx.b.pk || []).includes(c));
  return ['tek'].concat(kardes.map(c => 'kardes:' + c), ['cocuk']);
}

/* Sentetik küme açar (yardımcıyla, tek işlemde). Tablonun çalışan modu önbelleğe
   alınır. Dönen: {mod, satirlar (bu tablonun yeni kayıtları), temizle} | {hata}. */
async function secKumeAc(cx, x) {
  const onbellek = cx.tum.mod[cx.b.ad];
  const modlar = onbellek ? [onbellek] : secKumeModlari(cx);
  let hata = '';
  for (const mod of modlar) {
    let plan;
    try { plan = await secKumePlani(cx, x, mod); } catch (e) { hata = e.message || String(e); continue; }
    if (!plan) continue;
    try {
      const r = await secYardimci(cx.o, cx.gozcu, 'ekle_grup', null, { grup: plan.grup });
      cx.tum.mod[cx.b.ad] = mod;
      const satirlar = r.filter(y => y.tablo === cx.b.ad).map(y => y.satir);
      /* Temizlik sırası: önce alt satırlar, sonra üst kayıt. */
      const temizle = r.slice().reverse().map(y => {
        const pk = y.tablo === cx.b.ad ? cx.b.pk : secPkKolonlari(cx.tum.yt[y.tablo]);
        return { tablo: y.tablo, kosul: pk && pk.length ? secPkKosul({ pk }, y.satir) : y.satir };
      });
      return { mod, satirlar, temizle, plan };
    } catch (e) {
      hata = e.message || String(e);
      if (onbellek) break;
    }
  }
  return { hata: hata || 'Uygun kayıt kümesi kurulamadı' };
}

const secPkKolonlari = bt => bt.kolonlar.filter(k => k.pk).map(k => k.ad);

async function secKumeTemizle(cx, temizle) {
  try { await secYardimci(cx.o, cx.gozcu, 'sil_grup', null, { grup: temizle }); return true; }
  catch (e) { return false; }
}

/* Tablonun küme modu (ekleme testi için; ilk seferde bir kez denenir ve temizlenir). */
async function secKumeModu(cx, x) {
  if (cx.tum.mod[cx.b.ad]) return cx.tum.mod[cx.b.ad];
  const k = await secKumeAc(cx, x);
  if (k.temizle) await secKumeTemizle(cx, k.temizle);
  return k.mod || 'tek';
}

/* ==========================================================================
   INSERT
   ========================================================================== */

/* Kişi kaydı (ya da aynı tablodaki kümeyi tek istekte) ekler; yeni kayıtlar
   yardımcıyla bağımsız bulunur, okunur ve hep birlikte silinir. */
async function secEkleDene(cx, govde) {
  const { o, b } = cx;
  const anahtar = async () => (await secYardimci(o, cx.gozcu, 'anahtarlar', b.ad, { pk: b.pk })).map(k => JSON.stringify(k));
  const once = new Set(await anahtar());
  const cevap = await secYazIstek(o, cx.jeton, 'POST', encodeURIComponent(b.ad), govde);
  const yeni = (await anahtar()).filter(k => !once.has(k)).map(k => JSON.parse(k));
  const satirlar = [];
  for (const k of yeni) satirlar.push(...await secYardimci(o, cx.gozcu, 'oku', b.ad, { kosul: k }));
  const temiz = !yeni.length || await secKumeTemizle(cx, yeni.map(k => ({ tablo: b.ad, kosul: k })));
  return { olustu: yeni.length > 0, satir: satirlar[0] || null, satirlar, cevap, temiz };
}

function secEkleKarar(r, bek, mod) {
  const k = secKarar(r.cevap, r.olustu, bek, '✅ Kayıt oluşturuldu', '❌ Kayıt oluşmadı');
  if (mod === 'cocuk' && !r.olustu && secHataTur(r.cevap) === 'kural') {
    k.gercek += ' · bu kayıt alt satırlarıyla birlikte açılır; tek başına eklenemez';
  }
  if (!r.temiz) k.gercek += ' · ⚠ test kaydı silinemedi';
  return Object.assign({ beklenen: bek ? '✅ Ekleyebilmeli' : '❌ Ekleyememeli' }, k);
}

async function secEkleTest(cx, h, ekle) {
  const { m, b, bt, rol, ben } = cx;
  /* Paket: tek kayıt ya da aynı fişin bacakları (kardes) — tek istekte gönderilir. */
  const mod = await secKumeModu(cx, h.satir.x);
  let taslaklar = [secTaslak(cx, h.satir.x)];
  if (mod.indexOf('kardes:') === 0) {
    const plan = await secKumePlani(cx, h.satir.x, mod);
    if (plan) taslaklar = plan.grup.map(g => g.satir);
  }
  const taslak = taslaklar[0];
  const sec = (kolonlar, ek) => {
    const l = taslaklar.map(t => { const o = {}; kolonlar.forEach(c => { o[c] = t[c]; }); return Object.assign(o, ek || {}); });
    return l.length === 1 ? l[0] : l;
  };
  const satir = secYazSatir(taslak, b);
  const kol = Object.keys(taslak);
  const bek = c => secYazBek(m, c, rol, 'ekle', satir, b, ben);
  const izinli = kol.filter(c => bek(c).v === true);
  const yasak = kol.filter(c => bek(c).v === false);
  const zorunlu = new Set(bt.kolonlar.filter(secZorunlu).map(k => k.ad));

  if (!izinli.length) {
    if (!yasak.length) return ekle({ tur: 'Satır', beklenen: '—', gercek: (bek(kol[0]) || {}).neden || 'Kural anlaşılamadı', sonuc: 'edilemedi' });
    return ekle(Object.assign({ tur: 'Satır' }, secEkleKarar(await secEkleDene(cx, sec(kol)), false, mod)));
  }

  /* Temel kayıt: zorunlu kolonlar + rolün ekleyebildiği kolonlar. */
  const temelKol = kol.filter(c => izinli.includes(c) || zorunlu.has(c));
  const tb = secBirlesik(temelKol.map(bek));
  if (tb.v === null) return ekle({ tur: 'Satır', beklenen: '—', gercek: tb.neden, sonuc: 'edilemedi' });
  const r = await secEkleDene(cx, sec(temelKol));
  const tk = secEkleKarar(r, tb.v, mod);
  if (taslaklar.length > 1) tk.gercek += ' · ' + taslaklar.length + ' bacak tek istekte';
  ekle(Object.assign({ tur: 'Satır' }, tk));
  if (tb.v !== true) return;

  /* Kolon testleri: rolün ekleyemediği her kolon tek tek, izinli temel kayda eklenerek. */
  for (const c of yasak.filter(c => !temelKol.includes(c))) {
    const kolon = { tur: 'Kolon', kolon: c, beklenen: '❌ Bu kolonu yazamamalı' };
    if (!r.olustu || !r.satir) { ekle(Object.assign(kolon, { gercek: 'Temel ekleme çalışmadığı için denenemedi', sonuc: 'edilemedi' })); continue; }
    const adaylar = secAdaylar(cx, c, r.satir[c]);
    if (!adaylar.length) { ekle(Object.assign(kolon, { gercek: 'Denenecek farklı bir değer bulunamadı', sonuc: 'edilemedi' })); continue; }
    let r2, deger;
    for (deger of adaylar) {
      r2 = await secEkleDene(cx, sec(temelKol, { [c]: deger }));
      if (r2.olustu || !secTekrarDene(r2.cevap)) break;
    }
    const not = r2.temiz ? '' : ' · ⚠ test kaydı silinemedi';
    if (r2.olustu && r2.satir) {
      const yazildi = r2.satirlar.some(y => secAyni(y[c], deger));
      ekle(Object.assign(kolon, { gercek: (yazildi ? '✅ Kolon yazıldı' : '❌ Kolon değeri tutulmadı (kayıt oluştu)') + not, sonuc: yazildi ? 'acik' : 'gecti' }));
    } else {
      const k = secEkleKarar(r2, false, mod);
      ekle(Object.assign(kolon, { gercek: k.gercek, sonuc: k.sonuc }));
    }
  }
}

/* ==========================================================================
   UPDATE
   ========================================================================== */

async function secDegistirDene(cx, h, c, bek, ekle, tur) {
  const { o, b } = cx;
  const kosul = secPkKosul(b, h.satir.x);
  const filtre = encodeURIComponent(b.ad) + '?' + secPkFiltre(b, h.satir.x);
  const oku = async () => (await secYardimci(o, cx.gozcu, 'oku', b.ad, { kosul }))[0] || null;
  const kayit = { tur, kolon: c, beklenen: bek ? '✅ Değiştirebilmeli' : '❌ Değiştirememeli' };

  const once = await oku();
  if (!once) return ekle(Object.assign(kayit, { gercek: 'Hedef kayıt bulunamadı', sonuc: 'edilemedi' }));
  const adaylar = secAdaylar(cx, c, once[c]);
  if (!adaylar.length) return ekle(Object.assign(kayit, { gercek: 'Denenecek farklı bir değer bulunamadı', sonuc: 'edilemedi' }));

  /* Ölçü: GÖNDERDİĞİMİZ değer yazıldı mı. Kolonu bir tetikleyici kendisi güncelliyorsa
     (ör. guncellendi = now()) değer değişse de bu kişinin yazması değildir. */
  let cevap, sonra, gonderilen;
  for (const deger of adaylar) {
    gonderilen = deger;
    cevap = await secYazIstek(o, cx.jeton, 'PATCH', filtre, { [c]: deger });
    sonra = await oku();
    if (!sonra || secAyni(sonra[c], deger) || !secTekrarDene(cevap)) break;   // kısıt/veri hatasında sıradaki değer
  }
  const yazildi = !!sonra && secAyni(sonra[c], gonderilen);
  const kendisi = !!sonra && !yazildi && !secAyni(sonra[c], once[c]);

  /* Eski değeri geri yükle (yalnız değişen ve yazılabilen kolonlar). */
  let not = '';
  if (sonra) {
    const yazilabilir = new Set(cx.bt.kolonlar.filter(k => !k.pk && k.uretilmis !== 's' && k.kimlik !== 'a').map(k => k.ad));
    const fark = {};
    Object.keys(once).forEach(k => { if (yazilabilir.has(k) && !secAyni(once[k], sonra[k])) fark[k] = once[k]; });
    if (Object.keys(fark).length) {
      try {
        await secYardimci(o, cx.gozcu, 'geri', b.ad, { kosul, satir: fark });
        const son = await oku();
        if (yazildi) not = son && secAyni(son[c], once[c]) ? ' · eski değer geri yüklendi' : ' · ⚠ eski değer geri yüklenemedi';
      } catch (h2) { if (yazildi) not = ' · ⚠ eski değer geri yüklenemedi'; }
    }
  }
  if (!sonra) return ekle(Object.assign(kayit, { gercek: 'Kayıt istekten sonra bulunamadı', sonuc: bek ? 'edilemedi' : 'acik' }));
  /* Otomatik kolon (her projede, ada bakmadan): izinli kolonda gönderilen değer
     yazılmadı ama kolon değişti → güncelleme gerçekleşti, değeri veritabanı kendisi
     yazıyor (ör. guncellendi = now()). Bu "fazla kısıtlı" değildir. */
  if (kendisi && bek) {
    return ekle(Object.assign(kayit, { sonuc: 'gecti',
      gercek: '✅ Kayıt güncellendi · otomatik kolon: değeri veritabanı kendisi yazıyor' + not }));
  }
  const k = secKarar(cevap, yazildi, bek, '✅ Değişti', '❌ Değişmedi');
  if (kendisi) k.gercek += ' (gönderilen değer yazılmadı; bu kolonu veritabanı kendisi güncelliyor)';
  return ekle(Object.assign(kayit, k, { gercek: k.gercek + not }));
}

async function secDegistirTest(cx, h, ekle) {
  const { m, b, bt, rol, ben } = cx;
  if (h.sentetik) return ekle({ tur: 'Satır', beklenen: '—', gercek: 'Bu hedefe uyan mevcut kayıt yok — test verisine ekle', sonuc: 'edilemedi' });
  const kol = bt.kolonlar.filter(k => !k.pk && k.uretilmis !== 's' && k.kimlik !== 'a').map(k => k.ad);
  const bek = c => secYazBek(m, c, rol, 'degistir', h.satir, b, ben);
  const izinli = kol.filter(c => bek(c).v === true);
  const yasak = kol.filter(c => bek(c).v === false);
  /* İzinli deneme için önce düz yazı/sayı kolonu, bağlı (fk) ve yetki kolonları sona;
     denenecek değeri olan ilk kolon seçilir. */
  const puan = c => {
    const t = secTip(bt.kolonlar.find(k => k.ad === c));
    return (SEC_GUVENLIK_KOLON.test(c) ? 4 : 0) + (cx.fk[c] ? 2 : 0) + (secMetinTip(t) || secSayiTip(t) || /bool/.test(t) ? 0 : 1);
  };
  const degerli = l => l.find(c => secAdaylar(cx, c, h.satir.x[c]).length) || l[0];
  const siradan = l => degerli(l.slice().sort((a, x) => puan(a) - puan(x)));
  const guvenlikOnce = l => degerli(l.filter(c => SEC_GUVENLIK_KOLON.test(c)).concat(l.filter(c => !SEC_GUVENLIK_KOLON.test(c))));

  if (!izinli.length && !yasak.length) {
    return ekle({ tur: 'Satır', beklenen: '—', gercek: kol.length ? bek(kol[0]).neden : 'Değiştirilebilecek kolon yok', sonuc: 'edilemedi' });
  }
  if (!izinli.length) return secDegistirDene(cx, h, guvenlikOnce(yasak), false, ekle, 'Satır');
  await secDegistirDene(cx, h, siradan(izinli), true, ekle, 'Satır');
  /* Kolon kısıtı: satırı değiştirebilen rolün değiştiremediği her kolon tek tek. */
  for (const c of yasak) await secDegistirDene(cx, h, c, false, ekle, 'Kolon');
}

/* ==========================================================================
   DELETE — her zaman sentetik kopyada
   ========================================================================== */

async function secSilTest(cx, h, ekle) {
  const { o, b, m, rol, ben } = cx;
  cx.sinirNot = null;
  const kume = await secKumeAc(cx, h.satir.x);
  if (kume.hata) return ekle({ tur: 'Satır', beklenen: '—', gercek: 'Silmek için sentetik kopya açılamadı: ' + kume.hata, sonuc: 'edilemedi' });
  const ana = kume.satirlar[0];
  const bek = secSilBek(m, rol, secYazSatir(ana, b), b, ben);
  try {
    if (bek.v === null) return ekle({ tur: 'Satır', beklenen: '—', gercek: bek.neden, sonuc: 'edilemedi' });
    /* Kardeş kümede bacakların hepsi tek istekte silinir (yoksa ertelenmiş kural reddeder). */
    let filtre;
    if (kume.satirlar.length > 1 && b.pk.length === 1) {
      const c = b.pk[0];
      filtre = encodeURIComponent(secKolonAdi(c)) + '=in.(' + kume.satirlar
        .map(y => encodeURIComponent('"' + String(y[c]).replace(/"/g, '\\"') + '"')).join(',') + ')';
    } else filtre = secPkFiltre(b, ana);
    const cevap = await secYazIstek(o, cx.jeton, 'DELETE', encodeURIComponent(b.ad) + '?' + filtre);
    let silindi = false;
    for (const y of (kume.satirlar.length > 1 && b.pk.length === 1 ? kume.satirlar : [ana])) {
      if (!(await secYardimci(o, cx.gozcu, 'oku', b.ad, { kosul: secPkKosul(b, y) })).length) silindi = true;
    }
    const k = secKarar(cevap, silindi, bek.v, '✅ Silindi', '❌ Silinmedi');
    if (kume.mod !== 'tek') k.gercek += ' · ' + (kume.mod === 'cocuk' ? 'alt satırlarıyla birlikte açılan kopya' : kume.satirlar.length + ' bacaklı kopya küme');
    if (cx.sinirNot) k.gercek += ' · not: kopya "' + cx.sinirNot + '" kolonunun en büyük/en küçük değerini değiştirmiş olabilir';
    return ekle(Object.assign({ tur: 'Satır', beklenen: bek.v ? '✅ Silebilmeli' : '❌ Silememeli' }, k));
  } finally {
    /* Kopya kaldıysa (tümü tek işlemde) sil. */
    if (!(await secKumeTemizle(cx, kume.temizle))) {
      ekle({ tur: 'Satır', beklenen: 'Test verisi temizlenmeli', gercek: '⚠ sentetik kopya silinemedi', sonuc: 'edilemedi' });
    }
  }
}

/* ==========================================================================
   ÇALIŞTIRICI
   ========================================================================== */

async function secYazTablo(cx, temel, sonuclar, ilerle) {
  const { b, bt } = cx;
  const islemler = ['INSERT', 'UPDATE', 'DELETE'];
  const hepsi = (hedef, neden) => islemler.forEach(islem => sonuclar.push(Object.assign({}, temel,
    { tablo: b.ad, islem, hedef, tur: 'Satır', kolon: '', beklenen: '—', gercek: neden, sonuc: 'edilemedi' })));
  if (!bt) return hepsi('—', 'Tablo yapıda yok');
  if (!b.pk) return hepsi('—', 'Tabloda birincil anahtar yok — kayıtlar eşleştirilemez');
  if (bt.rls_zorunlu && !cx.bypass) return hepsi('—', 'Tabloda RLS sahibine de zorunlu — yardımcı bağımsız okuyamaz');
  if (!cx.ornek.length) return hepsi('—', 'Tabloda test verisi yok');

  for (const h of secYazHedefler(cx)) {
    if (h.yok) { hepsi(h.ad, h.neden || 'Test verisinde uygun kayıt yok'); continue; }
    const hedef = secHedefAd(cx, h.ad, h.satir);
    for (const [islem, fn] of [['INSERT', secEkleTest], ['UPDATE', secDegistirTest], ['DELETE', secSilTest]]) {
      ilerle(islem, temel.kisi, b.ad);
      const fonk = secFonksiyonIle(cx.m, cx.rol);
      const ekle = x => {
        const y = Object.assign({}, temel, { tablo: b.ad, islem, hedef, kolon: '' }, x);
        if (fonk && /^❌/.test(y.beklenen || '')) y.beklenen += ' (doğrudan; bu rol fonksiyonla yazar)';
        sonuclar.push(y);
      };
      try { await fn(cx, h, ekle); }
      catch (e) { ekle({ tur: 'Satır', beklenen: '—', gercek: 'Test hatası: ' + (e.message || e), sonuc: 'edilemedi' }); }
    }
  }
}

async function secYazmaCalistir(projeId) {
  const p = DB.proje(projeId);
  const k = SEC.kayit[projeId] || {};
  const o = SEC_TEST.kayit[projeId] || {};
  const engel = secUretimAyriMi(p, o);
  if (engel) { toast(engel, 'hata'); return; }
  if (!k.yapi || !k.model) return;
  const kisiler = (o.kullanicilar || []).filter(x => x.eposta && x.sifre);
  if (!kisiler.length) { toast('Test kullanıcısı yok — önce Test Ortamı → 3. adım.', 'hata'); return; }

  const bilgiler = secOkumaTablolar(k.yapi, k.model);
  const yt = {};
  k.yapi.tablolar.forEach(t => { yt[t.ad] = t; });
  const sonuclar = [];
  /* Yüzde: biten (kişi × tablo) adımı / tümü. Hazırlık %0'da sayılır. */
  const adim = { n: 0, toplam: Math.max(1, (kisiler.length + 1) * bilgiler.length) };
  const ilerle = (islem, kisi, tablo) => {
    SEC_YAZMA.ilerleme[projeId] = { islem, kisi, tablo, yuzde: Math.min(99, Math.floor(100 * adim.n / adim.toplam)) };
    render();
  };
  SEC_YAZMA.calisiyor[projeId] = true;
  SEC_YAZMA.sonuc[projeId] = null;
  ilerle('Hazırlanıyor');

  try {
    const oturum = [];
    for (const kisi of kisiler) {
      ilerle('Giriş', kisi.etiket);
      const g = await secOkumaGiris(o, kisi);
      if (g.dur) { toast(g.dur, 'hata'); return; }
      oturum.push(Object.assign({ kisi }, g));
    }
    /* Gözcü: yardımcıyı çağıran test hesabı (yalnız kontrol ve temizlik için). */
    const gozcu = (oturum.find(x => x.jeton) || {}).jeton;
    if (!gozcu) { toast('Hiçbir test kullanıcısı giriş yapamadı.', 'hata'); return; }
    const surum = await secYardimci(o, gozcu, 'surum');
    if (!surum || surum.nizam_yardimci !== SEC_YARDIMCI_SURUM || surum.proje !== projeId) {
      toast('Yardımcı güncel değil ya da başka projeye ait — yardımcı SQL\'ini yeniden çalıştır.', 'hata');
      return;
    }

    /* Mevcut test kayıtları (yardımcı okur, RLS'ten bağımsız). */
    const ornek = {};
    for (const { b } of bilgiler) {
      ilerle('Test verisi okunuyor', '', b.ad);
      ornek[b.ad] = b.pk && yt[b.ad] ? (await secYardimci(o, gozcu, 'oku', b.ad, { kosul: {} })).map(x => secYazSatir(x, b)) : [];
    }
    /* Başka tabloya bağlı kolonların geçerli değerleri (bağlı tablodan, yardımcıyla). */
    const fkler = {}, hedefOku = {};
    for (const { b } of bilgiler) {
      fkler[b.ad] = {};
      for (const f of ((yt[b.ad] || {}).iliskiler || [])) {
        if (!f.kolon || !f.hedef_kolon || !yt[f.hedef_tablo]) continue;
        if (!(f.hedef_tablo in hedefOku)) {
          ilerle('Bağlı tablolar okunuyor', '', f.hedef_tablo);
          try { hedefOku[f.hedef_tablo] = await secYardimci(o, gozcu, 'oku', f.hedef_tablo, { kosul: {} }); }
          catch (h) { hedefOku[f.hedef_tablo] = []; }
        }
        const degerler = [];
        hedefOku[f.hedef_tablo].forEach(r => {
          const v = r[f.hedef_kolon];
          if (v !== null && v !== undefined && !degerler.some(d => secAyni(d, v))) degerler.push(v);
        });
        if (degerler.length) fkler[b.ad][f.kolon] = degerler;
      }
    }
    const harita = { tablolar: {} };
    Object.keys(ornek).forEach(t => { harita.tablolar[t] = ornek[t]; });
    const esler = {};
    oturum.forEach(x => { if (x.uid) { esler[x.uid] = x.kisi.etiket; x.sube = secKisiSube(harita, bilgiler, x.uid); } });

    const tipler = {};
    (k.yapi.tipler || []).forEach(t => { tipler[String(t.ad).toLowerCase()] = t.degerler; });
    const ortak = { o, gozcu, esler, tipler, bypass: !!surum.bypass, tum: { yt, fkler, ornek: {}, mod: {} } };
    Object.keys(ornek).forEach(t => { ortak.tum.ornek[t] = ornek[t]; });
    for (const os of oturum) {
      const temel = { kisi: os.kisi.etiket, rol: os.kisi.rol };
      if (!os.jeton) {
        sonuclar.push(Object.assign({}, temel, { tablo: '—', islem: 'Giriş', hedef: 'Giriş', tur: 'Giriş', kolon: '',
          beklenen: 'Giriş yapabilmeli', gercek: os.hata, sonuc: 'edilemedi' }));
        adim.n += bilgiler.length;
        continue;
      }
      for (const { m, b } of bilgiler) {
        await secYazTablo(Object.assign({}, ortak, { jeton: os.jeton, m, b, bt: yt[b.ad], fk: fkler[b.ad] || {}, rol: os.kisi.rol,
          ben: { uid: os.uid, sube: os.sube }, ornek: ornek[b.ad] }), temel, sonuclar, ilerle);
        adim.n++;
      }
    }

    /* Giriş yapmamış ziyaretçi: oturum yok, yalnız herkese açık anahtar.
       Modelde Ziyaretçi rolü varsa onun kurallarıyla, yoksa her şey yasak. */
    const ziyaretciRol = k.model.roller.includes(SEC_ZIYARETCI_ROL) ? SEC_ZIYARETCI_ROL : null;
    const anonJeton = /^eyJ/.test(o.test_anahtar || '') ? o.test_anahtar : null;
    const ziyaretci = { kisi: SEC_ZIYARETCI, rol: ziyaretciRol || 'Dış erişim' };
    for (const { m, b } of bilgiler) {
      const bz = Object.assign({}, b, { sahip: null, sube: null });   // "kendi"/şube yok
      await secYazTablo(Object.assign({}, ortak, { jeton: anonJeton, m, b: bz, bt: yt[b.ad], fk: fkler[b.ad] || {}, rol: ziyaretciRol,
        ben: { uid: null, sube: null }, ornek: (ornek[b.ad] || []).map(s => secYazSatir(s.x, bz)) }), ziyaretci, sonuclar, ilerle);
      adim.n++;
    }

    SEC_YAZMA.sonuc[projeId] = { liste: sonuclar, tarih: new Date().toISOString() };
    const acik = sonuclar.filter(x => x.sonuc === 'acik').length;
    toast(acik ? acik + ' yazma açığı bulundu.' : 'Yazma testi bitti.', acik ? 'hata' : 'basari');
  } catch (h) {
    toast('Yazma testi durdu: ' + (h.message || h), 'hata');
  } finally {
    SEC_YAZMA.calisiyor[projeId] = false;
    SEC_YAZMA.ilerleme[projeId] = null;
    render();
  }
}

/* ==========================================================================
   EKRAN — Güvenlik Testleri sayfasındaki 3. kart
   ========================================================================== */

function secYazmaKart(projeId, engel) {
  const calisiyor = !!SEC_YAZMA.calisiyor[projeId];
  const mesgul = calisiyor || !!SEC_OKUMA.calisiyor[projeId];
  const il = SEC_YAZMA.ilerleme[projeId];
  const s = SEC_YAZMA.sonuc[projeId];
  const dug = (yazi, eylem, ana, kapali) =>
    `<button class="sec-dug${ana ? ' ana' : ''}" type="button" data-eylem="${eylem}" data-id="${esc(projeId)}"
       ${kapali ? 'disabled' : ''}>${esc(yazi)}</button>`;
  return `
    <div class="sec-t-kart sec-y-kart${s ? ' bitti' : ''}">
      <div class="sec-t-ku"><span class="sec-no">3</span><b>Yazma testleri</b>
        <em>${s ? '✓ ' + s.liste.length + ' test' : 'INSERT · UPDATE · DELETE'}</em></div>
      <p class="sec-t-not">Aynı test kullanıcıları ve giriş yapmamış ziyaretçi kayıt eklemeyi, değiştirmeyi ve
        silmeyi dener. Sonucu test projesine bir kez kurulan küçük bir yardımcı bağımsız olarak okur:
        eklenen kayıt silinir, değişen değer geri yüklenir, silme sentetik bir kopyada denenir.</p>
      <div class="sec-t-dg">
        ${dug('Yardımcı SQL\'i kopyala', 'sec-o-y-sql', false, !!engel)}
        ${dug(calisiyor ? 'Yazma testi çalışıyor…' : 'Yazma testini başlat', 'sec-o-y-baslat', true, mesgul || !!engel)}
        <span class="sec-t-ipucu">Yardımcıyı bir kez TEST projesinin SQL Editor'ünde çalıştır</span>
      </div>
      ${calisiyor && il ? secIlerlemeCubugu(il.yuzde, il.islem, il.kisi, il.tablo) : ''}
    </div>`;
}

async function secYazmaEylem(e, el) {
  const projeId = el.dataset.id;
  const p = DB.proje(projeId);
  const k = SEC.kayit[projeId] || {};
  const o = SEC_TEST.kayit[projeId] || {};
  const engel = secUretimAyriMi(p, o);
  if (engel) { toast(engel, 'hata'); return true; }
  if (!k.yapi || !k.model) return true;

  if (e === 'sec-o-y-sql') {
    const ok = await panoyaKopyala(secYardimciSql(projeId, o));
    toast(ok ? 'Yardımcı SQL\'i kopyalandı — TEST projesinin SQL Editor\'ünde çalıştır.' : 'Kopyalanamadı.', ok ? 'basari' : 'hata');
    return true;
  }
  if (e === 'sec-o-y-rapor') {
    const r = secHataRaporu(projeId);
    if (!r.sayi) { toast('Bildirilecek 🔴 ya da 🟡 sonuç yok.', 'basari'); return true; }
    const ok = await panoyaKopyala(r.metin);
    toast(ok ? r.sayi + ' bulgu kopyalandı — projenin Claude sohbetine yapıştır.' : 'Kopyalanamadı.', ok ? 'basari' : 'hata');
    return true;
  }
  if (e === 'sec-o-y-baslat') {
    if (SEC_YAZMA.calisiyor[projeId] || SEC_OKUMA.calisiyor[projeId]) return true;
    await secYazmaCalistir(projeId);
    return true;
  }
  return false;
}

/* ==========================================================================
   ORTAK: ilerleme çubuğu · hata raporu (okuma ekranı da kullanır)
   ========================================================================== */

function secIlerlemeCubugu(yuzde, ne, kisi, tablo) {
  const y = Math.max(0, Math.min(100, Number(yuzde) || 0));
  return `
    <div class="sec-ilerleme-kutu">
      <div class="sec-ilerleme-ust"><b>%${y}</b><span>${esc([kisi, tablo, ne].filter(Boolean).join(' · '))}</span></div>
      <div class="sec-ilerleme" role="progressbar" aria-valuenow="${y}" aria-valuemin="0" aria-valuemax="100"><i style="width:${y}%"></i></div>
    </div>`;
}

/* 🔴 ve 🟡 sonuçlar → projenin Claude sohbetine yapıştırılacak mesaj.
   Aynı bulgu birden fazla kişide çıkmışsa tek satırda birleşir. */
function secHataRaporu(projeId) {
  const p = DB.proje(projeId);
  const o = SEC_TEST.kayit[projeId] || {};
  const s = SEC_OKUMA.sonuc[projeId], y = SEC_YAZMA.sonuc[projeId];
  const liste = [].concat(s ? s.liste : [], y ? y.liste : []);
  const kisitli = x => /erişim fazla kısıtlı/.test(x.gercek || '');
  const gruplar = [
    ['🔴 Güvenlik açıkları', 'Kurala göre YASAK ama veritabanı izin verdi.', liste.filter(x => x.sonuc === 'acik')],
    ['🟡 Fazla kısıtlı', 'Kurala göre İZİNLİ ama veritabanı reddetti. Ya kural ya veritabanı yanlış.', liste.filter(x => x.sonuc === 'edilemedi' && kisitli(x))],
    ['🟡 Test edilemedi', 'Test bu işlemi deneyemedi (kısıt, uygulama kuralı, eksik test verisi…).', liste.filter(x => x.sonuc === 'edilemedi' && !kisitli(x))],
  ];
  const satirlar = l => {
    const bir = new Map();
    l.forEach(x => {
      const ad = x.tablo + (x.kolon && !/ kolon$/.test(x.kolon) ? '.' + x.kolon : '') + (/ kolon$/.test(x.kolon || '') ? ' (' + x.kolon + ')' : '');
      const anahtar = [x.tablo, x.islem || 'SELECT', ad, x.hedef, x.beklenen, x.gercek].join('¦');
      if (!bir.has(anahtar)) bir.set(anahtar, { x, ad, kisiler: [] });
      const e = bir.get(anahtar);
      const kim = x.kisi + (x.rol && x.rol !== x.kisi ? ' (' + x.rol + ')' : '');
      if (!e.kisiler.includes(kim)) e.kisiler.push(kim);
    });
    const tablolar = new Map();
    bir.forEach(e => {
      if (!tablolar.has(e.x.tablo)) tablolar.set(e.x.tablo, []);
      tablolar.get(e.x.tablo).push(`- ${e.x.islem || 'SELECT'} · \`${e.ad}\` · ${e.x.hedef} · ${e.kisiler.join(', ')}\n  Beklenen: ${e.x.beklenen} · Gerçek: ${e.x.gercek}`);
    });
    const out = [];
    tablolar.forEach((l2, t) => { out.push('### ' + t, ...l2, ''); });
    return out;
  };
  const m = [];
  m.push('# NIZAM Security — Güvenlik testi bulguları');
  m.push('');
  m.push('Proje: ' + (p ? projeAdi(p) : projeId));
  m.push('Tarih: ' + new Date().toLocaleString('tr-TR'));
  m.push('');
  m.push('Bu bulgular Nizam Studio\'nun TEST Supabase projesinde (' + (o.test_ref || '?') + ') yaptığı gerçek testlerden geldi.');
  m.push('Test kullanıcıları kendi e-posta/şifreleriyle gerçek giriş yaptı; giriş yapmamış ziyaretçi yalnız herkese açık anahtarla denendi.');
  m.push('"Beklenen" davranış Studio\'daki Erişim Kuralları modelinden geliyor. Karar, verinin gerçekten değişip değişmediğine göre verildi.');
  m.push('');
  m.push('## Ne yapmanı istiyorum');
  m.push('1. Önce her grup için sebebi bul ve kısa bir düzeltme planı anlat (hangi RLS kuralı, yetki ya da tetikleyici).');
  m.push('2. Onayımı almadan kod, SQL, migration ya da RLS değişikliği YAPMA.');
  m.push('3. Production veritabanına dokunma.');
  m.push('4. "Fazla kısıtlı" olanlarda kural mı veritabanı mı yanlış, bana sor.');
  m.push('5. "Test edilemedi" olanlarda gerekiyorsa test verisi önerisi yap; bunlar açık değildir.');
  m.push('');
  m.push('Özet: ' + gruplar.map(g => g[0] + ' ' + g[2].length).join(' · '));
  m.push('');
  gruplar.forEach(([bas, ac, l]) => {
    if (!l.length) return;
    m.push('## ' + bas + ' (' + l.length + ')');
    m.push(ac);
    m.push('');
    m.push(...satirlar(l));
  });
  return { metin: m.join('\n'), sayi: gruplar.reduce((n, g) => n + g[2].length, 0) };
}
