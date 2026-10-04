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

const SEC_YAPI_SURUM  = 'yapi-1';
const SEC_MODEL_SURUM = 1;
const SEC_IZINLER = ['oku', 'ekle', 'degistir', 'sil'];
const SEC_IZIN_AD = { oku: 'Oku', ekle: 'Ekle', degistir: 'Değiştir', sil: 'Sil' };
/* Bilinen satır kuralları; bunların dışındaki metin olduğu gibi gösterilir
   (ör. "Kendi şubesinin satırları"). */
const SEC_SATIR_AD = { tum: 'Tüm satırlar', kendi: 'Kendi satırı', yok: 'Hiçbiri' };

/* ---------- Gerçek yapıyı okuyan SQL ----------
   Yalnız sistem kataloğunu okur (pg_class, pg_attribute, pg_constraint).
   Hiçbir tablonun SATIRINA dokunmaz; müşteri verisi, şifre, token çıkmaz. */
const SEC_YAPI_SQL = `-- NIZAM Security · Veritabanı yapısı
-- Yalnız YAPIYI okur: tablo, kolon, tip, birincil anahtar, ilişki, RLS.
-- Hiçbir satır verisi okunmaz. Çıkan tek hücreyi kopyala, Nizam'a yapıştır.
select json_build_object(
  'nizam_security', '${SEC_YAPI_SURUM}',
  'tablolar', coalesce((select json_agg(t order by t.ad) from (
    select c.relname as ad,
      c.relrowsecurity as rls,
      coalesce((select json_agg(json_build_object(
          'ad', a.attname,
          'tip', format_type(a.atttypid, a.atttypmod),
          'bos_olabilir', not a.attnotnull,
          'pk', exists(select 1 from pg_constraint k
                       where k.conrelid = c.oid and k.contype = 'p' and a.attnum = any(k.conkey))
        ) order by a.attnum)
        from pg_attribute a
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
        where f.conrelid = c.oid and f.contype = 'f'), '[]'::json) as iliskiler
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
  ) t), '[]'::json)
) as yapi;`;

/* ---------- Ekran durumu ---------- */
const SEC = {
  liste: null,        // [{proje_id, yapi_tarihi, model_tarihi}] — liste ekranı
  kayit: {},          // projeId → tam satır (null = kayıt yok)
  yukleniyor: {},
};

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

/* ---------- Yapı okuyucu ---------- */
function secYapiOku(metin) {
  if (secGizliVar(metin)) return { hata: 'Çıktıda gizli bir anahtar ya da şifre var gibi görünüyor — kabul edilmedi.' };
  const r = secJsonAl(metin, 'yapi');
  if (r.hata) return r;
  const j = r.json;
  if (j.nizam_security !== SEC_YAPI_SURUM) {
    return { hata: 'Bu, Nizam Security yapı SQL\'inin çıktısı değil. Buradaki SQL\'i kopyalayıp çalıştır.' };
  }
  if (!Array.isArray(j.tablolar)) return { hata: 'Tablo listesi bulunamadı.' };
  const tablolar = [];
  for (const t of j.tablolar) {
    if (!t || typeof t.ad !== 'string' || !t.ad) return { hata: 'Adı olmayan bir tablo var.' };
    const kolonlar = (Array.isArray(t.kolonlar) ? t.kolonlar : []).map(k => ({
      ad: String(k.ad || ''), tip: String(k.tip || ''),
      bos_olabilir: !!k.bos_olabilir, pk: !!k.pk,
    })).filter(k => k.ad);
    const iliskiler = (Array.isArray(t.iliskiler) ? t.iliskiler : []).map(f => ({
      kolon: String(f.kolon || ''), hedef_tablo: String(f.hedef_tablo || ''),
      hedef_kolon: String(f.hedef_kolon || ''),
    }));
    tablolar.push({ ad: t.ad, rls: !!t.rls, kolonlar, iliskiler });
  }
  return { yapi: { nizam_security: SEC_YAPI_SURUM, tablolar } };
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

  const satirOku = (s, yer) => {
    const out = {};
    if (s === undefined || s === null) return out;
    if (typeof s !== 'object' || Array.isArray(s)) { hatalar.push(yer + ': satır erişimi nesne olmalı.'); return out; }
    for (const [rol, deger] of Object.entries(s)) {
      if (!rolVar.has(rol)) { hatalar.push(yer + ': tanımsız rol "' + rol + '".'); continue; }
      const d = String(deger || '').trim();
      if (!d || d.length > 80) { hatalar.push(yer + ': "' + rol + '" satır erişimi boş ya da çok uzun.'); continue; }
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
      kolonlar.push({ ad: kad, izin, satir: satirOku(k.satir, ad + '.' + kad) });
    }
    tablolar.push({ ad, sahip_kolon: sahip || undefined, satir: satirOku(t.satir, ad), kolonlar });
  }

  if (hatalar.length) {
    return { hata: 'Model gerçek veritabanı yapısıyla uyuşmuyor:', ayrinti: hatalar.slice(0, 20) };
  }
  if (!tablolar.length) return { hata: 'Modelde hiç tablo yok.' };
  return { model: { surum: SEC_MODEL_SURUM, proje: projeId, roller, tablolar } };
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
  s.push('5. Log, ayar gibi yardımcı tabloları tek soruda topluca geç.');
  s.push('6. Bitince kısa bir özet göster, onayımı al, sonra JSON\'u ver.');
  s.push('');
  s.push('## Son çıktı');
  s.push('Son mesajında yalnız tek bir ```json bloğu ver. Biçim:');
  s.push('```json');
  s.push(JSON.stringify(ornek, null, 2));
  s.push('```');
  s.push('- `surum`: her zaman 1. `proje`: aynen "' + p.id + '".');
  s.push('- `roller`: rol adları. Bütün izin ve satır kuralları bu adlarla yazılır.');
  s.push('- `izin`: her rol için `oku`, `ekle`, `degistir`, `sil` listesinin alt kümesi. Boş liste = hiçbir yetki yok.');
  s.push('- `sil` = o satırı silebilme yetkisi. Bir rol tabloda satır silebiliyorsa o tablonun bütün kolonlarında `sil` yaz.');
  s.push('- Tablodaki `satir`: her rolün varsayılan satır erişimi. Değerler: `tum` (tüm satırlar), `kendi` (kendi satırı), `yok` (hiçbiri)');
  s.push('  ya da kısa bir açıklama (ör. "Kendi şubesinin satırları", "Tüm ürünler").');
  s.push('- Kolondaki `satir`: YALNIZ o kolon varsayılandan farklıysa yaz (ör. isim herkese açık, maaş yalnız kendi satırında). Gereksiz yere her kolona yazma.');
  s.push('- `sahip_kolon`: "kendi satırı" kuralı varsa satırı kullanıcıya bağlayan kolon; yoksa yazma.');
  s.push('- Gerçek yapıdaki her tabloyu ve her kolonu yaz; karar verilmeyen bir şey kalırsa bana sor.');
  s.push('');
  s.push('## Gerçek veritabanı yapısı (SQL Editor çıktısı)');
  s.push('```json');
  s.push(JSON.stringify(yapi));
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
  const id = rota().id;
  return id ? secProjeEkran(id) : secListeEkran();
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

/* ---------- Proje → Erişim Kuralları ---------- */
function secProjeEkran(projeId) {
  const p = DB.proje(projeId);
  if (!p) return `<div class="card">${empty(ICON.uyari, 'Proje bulunamadı', '')}</div>`;
  if (SEC.kayit[projeId] === undefined) {
    secYukle('kayit-' + projeId, async () => { SEC.kayit[projeId] = await SEC_VERI.getir(projeId); });
    return iskeletler(3);
  }
  const k = SEC.kayit[projeId] || {};
  const yapi = k.yapi && Array.isArray(k.yapi.tablolar) ? k.yapi : null;
  const model = yapi && k.model && Array.isArray(k.model.tablolar) ? k.model : null;

  const adim = (no, bitti, baslik, alt, dugme, eylem, kapali) => `
    <div class="sec-adim${bitti ? ' bitti' : ''}">
      <span class="sec-no">${no}</span>
      <span class="sec-adim-yz"><b>${esc(baslik)}</b><i>${esc(alt)}</i></span>
      <button class="sec-dug" type="button" data-eylem="${eylem}" data-id="${esc(projeId)}"
              ${kapali ? 'disabled' : ''}>${esc(dugme)}</button>
    </div>`;

  const adimlar = `<div class="sec-adimlar">
    ${adim(1, !!yapi, 'Veritabanı yapısı',
        yapi ? yapi.tablolar.length + ' tablo · ' + secTarih(k.yapi_tarihi) : 'SQL Editor\'den al',
        yapi ? 'Yenile' : 'Başla', 'sec-yapi', false)}
    ${adim(2, !!model, 'Claude ile görüşme',
        yapi ? 'Promptu kopyala, Claude\'a yapıştır' : 'Önce yapıyı al',
        'Prompt', 'sec-prompt', !yapi)}
    ${adim(3, !!model, 'Güvenlik modeli',
        model ? model.roller.length + ' rol · ' + secTarih(k.model_tarihi) : 'Claude\'un JSON\'unu yapıştır',
        'JSON yapıştır', 'sec-model', !yapi)}
  </div>`;

  let govde;
  if (!yapi) {
    govde = `<div class="card">${empty(ICON.gGuvenlik, 'Önce veritabanı yapısı',
      '1. adımdaki SQL\'i projenin Supabase SQL Editor\'ünde çalıştır, çıktıyı buraya yapıştır.')}</div>`;
  } else if (!model) {
    govde = `<div class="card">${empty(ICON.gGuvenlik, 'Güvenlik modeli bekleniyor',
      'Promptu Claude\'a ver, soruları cevapla, verdiği JSON\'u 3. adıma yapıştır.')}</div>`;
  } else {
    govde = secKurallar(yapi, model);
  }

  return `
    <a class="tl-geri" href="#/security">${svg(ICON.chevron, 14)} Nizam Security</a>
    <div class="pj-tepe"><div class="pj-tepe-yz">
      <h1>${esc(basHarfleriBuyuk(projeAdi(p)))}</h1>
      <p>Erişim Kuralları · olması istenen güvenlik davranışı</p>
    </div></div>
    ${adimlar}
    ${govde}`;
}

function secSatirAd(d) {
  if (!d) return '—';
  return SEC_SATIR_AD[d] || d;
}

/* Gerçek yapı + istenen model → tablo kartları. Yapının sırası esas. */
function secKurallar(yapi, model) {
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

  const kartlar = yapi.tablolar.filter(t => mTablo[t.ad]).map(t => secTabloKarti(t, mTablo[t.ad], roller)).join('');
  const kararsiz = yapi.tablolar.filter(t => !mTablo[t.ad]).map(t => t.ad);

  return `
    ${kayip.length ? `<div class="sec-uyari">⚠️ Modelde var ama veritabanında artık yok:
      ${kayip.map(x => `<code>${esc(x)}</code>`).join(' ')} — Claude ile modeli güncelle.</div>` : ''}
    <h3 class="sec-bas">Erişim kuralları</h3>
    ${kartlar}
    ${kararsiz.length ? `<div class="sec-kararsiz"><b>Karar verilmemiş tablolar:</b>
      ${kararsiz.map(x => `<code>${esc(x)}</code>`).join(' ')}</div>` : ''}
    <div class="sec-not">
      <span>RLS rozeti = veritabanının şu anki durumu</span>
      <span>✓ / ✕ = olması istenen</span>
      <span>↳ = kolon için farklı satır kuralı</span>
      <span>Sil = ilgili satırı silebilme yetkisi</span>
    </div>`;
}

function secTabloKarti(t, m, roller) {
  const mKolon = {};
  m.kolonlar.forEach(c => { mKolon[c.ad] = c; });
  const fk = {};
  t.iliskiler.forEach(f => { if (f.kolon && f.kolon.indexOf(',') < 0) fk[f.kolon] = f.hedef_tablo; });
  const n = roller.length;

  const kolonlar = '<colgroup><col class="sec-ck">'
    + roller.map(() => '<col><col><col><col><col class="sec-cs">').join('') + '</colgroup>';
  const ust = `<tr class="sec-g1"><th class="sec-k"></th>${roller.map(r =>
    `<th colspan="5" class="sec-ay">${esc(r)}</th>`).join('')}</tr>`;
  const ust2 = `<tr class="sec-g2"><th class="sec-k">Kolon</th>${roller.map(() =>
    SEC_IZINLER.map((x, i) => `<th${i === 0 ? ' class="sec-ay"' : ''}>${SEC_IZIN_AD[x]}</th>`).join('')
    + '<th class="sec-sa">Satır</th>').join('')}</tr>`;
  const varsayilan = `<tr class="sec-var"><td class="sec-k">Varsayılan satır erişimi</td>${roller.map(r =>
    `<td colspan="5" class="sec-ay sec-sa">${esc(secSatirAd(m.satir[r]))}</td>`).join('')}</tr>`;

  const satirlar = t.kolonlar.map(c => {
    const etiket = [c.tip, c.pk ? 'PK' : '', fk[c.ad] ? '→ ' + fk[c.ad] : ''].filter(Boolean).join(' · ');
    const bas = `<td class="sec-k" title="${esc(c.ad + (etiket ? ' · ' + etiket : ''))}"><code>${esc(c.ad)}</code><small>${esc(etiket)}</small></td>`;
    const mc = mKolon[c.ad];
    if (!mc) {
      return `<tr>${bas}${roller.map(() =>
        `<td colspan="5" class="sec-ay sec-yok">— karar verilmedi</td>`).join('')}</tr>`;
    }
    return `<tr>${bas}${roller.map(r => {
      const izin = mc.izin[r];
      const hucre = SEC_IZINLER.map((x, i) => {
        const var_ = !!(izin && izin.includes(x));
        return `<td class="${i === 0 ? 'sec-ay ' : ''}${var_ ? 'sec-e' : 'sec-h'}"
                    title="${esc(r + ' · ' + SEC_IZIN_AD[x])}">${var_ ? '✓' : '✕'}</td>`;
      }).join('');
      const fark = mc.satir[r];
      const sa = fark
        ? `<td class="sec-sa fark" title="${esc(secSatirAd(fark))}">↳ ${esc(secSatirAd(fark))}</td>`
        : `<td class="sec-sa" title="${esc(secSatirAd(m.satir[r]))}">${esc(secSatirAd(m.satir[r]))}</td>`;
      return hucre + sa;
    }).join('')}</tr>`;
  }).join('');

  return `
    <div class="sec-kart">
      <div class="sec-ku">
        <h2>${esc(t.ad)}</h2>
        <span class="sec-rozet">${t.rls ? '🟢 RLS: Açık' : '🔴 RLS: Kapalı'}</span>
        ${m.sahip_kolon ? `<span class="sec-sahip">kendi satırı: <code>${esc(m.sahip_kolon)}</code></span>` : ''}
        <span class="sec-say">${t.kolonlar.length} kolon</span>
      </div>
      <div class="sec-kaydir" style="--sec-rol:${n}">
        <table class="sec-tablo">${kolonlar}${ust}${ust2}${varsayilan}${satirlar}</table>
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
