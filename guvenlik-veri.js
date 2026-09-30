/* ==========================================================================
   NIZAM | Security — Veri erişim katmanı (Faz 1)

   Studio'nun kendi Supabase'indeki güvenlik tablolarıyla konuşan TEK yer.
   Yalnız veri okur/yazar; ekran, motor ya da manifest üretimi burada YOK
   (sonraki fazlar). Yazma işlemleri yönetici ister (yazmaKontrol, data.js).

   index.html'de auth.js/data.js'ten sonra, app.js'ten önce yükleniyor.
   Tablolar: sql/36-guvenlik-tablolari.sql.
   ========================================================================== */

'use strict';

const GUVENLIK_VERI = {

  /* ---------- Hedefler ---------- */

  async hedefleriGetir() {
    if (!AUTH.bagli) return [];
    const { data, error } = await AUTH.db.from('guvenlik_hedefleri')
      .select('*').order('guncellendi', { ascending: false });
    if (error) throw new Error(veriHatasi(error));
    return data || [];
  },

  async hedefGetir(id) {
    if (!AUTH.bagli) return null;
    const { data, error } = await AUTH.db.from('guvenlik_hedefleri')
      .select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(veriHatasi(error));
    return data || null;
  },

  async hedefOlustur(alanlar) {
    yazmaKontrol();
    const { data, error } = await AUTH.db.from('guvenlik_hedefleri')
      .insert(alanlar || {}).select('*');
    if (error) throw new Error(veriHatasi(error));
    if (!data || !data.length) throw new Error('Hedef oluşturulamadı.');
    return data[0];
  },

  async hedefGuncelle(id, alanlar) {
    yazmaKontrol();
    const govde = Object.assign({}, alanlar, { guncellendi: new Date().toISOString() });
    const { data, error } = await AUTH.db.from('guvenlik_hedefleri')
      .update(govde).eq('id', id).select('id');
    if (error) throw new Error(veriHatasi(error));
    if (!data || !data.length) throw new Error('Hedef güncellenemedi.');
    return true;
  },

  /* Son manifest ya da son denetim referansını günceller — ikisi de
     opsiyonel, yalnız verilen alan yazılır. */
  async hedefReferansYaz(id, { manifestId, denetimId } = {}) {
    const alanlar = {};
    if (manifestId !== undefined) alanlar.son_manifest_id = manifestId;
    if (denetimId !== undefined) alanlar.son_denetim_id = denetimId;
    if (!Object.keys(alanlar).length) return true;
    return this.hedefGuncelle(id, alanlar);
  },

  /* Bir NIZAM projesi için hedef bul; YOKSA oluşturmaz (yalnız okur).
     Proje durağı / Final durumu bunu kullanır — sessizce hedef açmamak için. */
  async hedefProjeBul(projeId) {
    if (!AUTH.bagli) return null;
    const { data, error } = await AUTH.db.from('guvenlik_hedefleri')
      .select('*').eq('proje_id', projeId).limit(1);
    if (error) throw new Error(veriHatasi(error));
    return (data && data.length) ? data[0] : null;
  },

  /* Bir NIZAM projesi için hedef bul; yoksa oluştur. Hedefler projelere
     bağlı (Faz 1 kararı), her projenin en fazla bir hedefi olur. */
  async hedefProjeIcin(projeId, ad) {
    if (!AUTH.bagli) return null;
    const { data, error } = await AUTH.db.from('guvenlik_hedefleri')
      .select('*').eq('proje_id', projeId).limit(1);
    if (error) throw new Error(veriHatasi(error));
    if (data && data.length) return data[0];
    return this.hedefOlustur({ ad: ad || '', proje_id: projeId });
  },

  /* ---------- Manifest (immutable) ---------- */

  async manifestOlustur({ hedefId, commit, surum, govde }) {
    yazmaKontrol();
    const { data, error } = await AUTH.db.from('guvenlik_manifestleri')
      .insert({ hedef_id: hedefId, commit: commit || '',
                manifest_surumu: surum || GUVENLIK_MANIFEST_SURUMU,
                govde: govde || {} }).select('*');
    if (error) throw new Error(veriHatasi(error));
    if (!data || !data.length) throw new Error('Manifest kaydedilemedi.');
    return data[0];
  },

  async manifestGetir(id) {
    if (!AUTH.bagli) return null;
    const { data, error } = await AUTH.db.from('guvenlik_manifestleri')
      .select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(veriHatasi(error));
    return data || null;
  },

  async manifestGecmisi(hedefId) {
    if (!AUTH.bagli) return [];
    const { data, error } = await AUTH.db.from('guvenlik_manifestleri')
      .select('id, commit, manifest_surumu, olusturuldu')
      .eq('hedef_id', hedefId).order('olusturuldu', { ascending: false });
    if (error) throw new Error(veriHatasi(error));
    return data || [];
  },

  /* ---------- Denetim (immutable) ---------- */

  async denetimOlustur({ hedefId, manifestId, matris, sonuclar, ozet }) {
    yazmaKontrol();
    /* `no` yarış-güvenli olsun diye DB fonksiyonu (advisory lock) üzerinden
       yazılır — bkz. sql/37. Fonksiyon yoksa (SQL çalıştırılmadıysa) güvenli
       yedeğe düşer: max+1, unique çakışırsa bir kez daha dener. */
    const { data, error } = await AUTH.db.rpc('guvenlik_denetim_kaydet', {
      p_hedef: hedefId, p_manifest: manifestId || null,
      p_matris: matris || [], p_sonuclar: sonuclar || [], p_ozet: ozet || {} });
    if (!error && data) return Array.isArray(data) ? data[0] : data;
    /* Yedek yol — yalnız RPC bulunamadığında. */
    for (let deneme = 0; deneme < 3; deneme++) {
      const { data: sonuncu } = await AUTH.db.from('guvenlik_denetimleri')
        .select('no').eq('hedef_id', hedefId).order('no', { ascending: false }).limit(1);
      const no = (sonuncu && sonuncu.length ? sonuncu[0].no : 0) + 1;
      const r = await AUTH.db.from('guvenlik_denetimleri')
        .insert({ hedef_id: hedefId, manifest_id: manifestId || null, no,
                  matris: matris || [], sonuclar: sonuclar || [], ozet: ozet || {},
                  olusturan: (AUTH.user && AUTH.user.id) || null }).select('*');
      if (!r.error && r.data && r.data.length) return r.data[0];
      if (r.error && !/duplicate|unique/i.test(r.error.message || '')) throw new Error(veriHatasi(r.error));
    }
    throw new Error('Denetim kaydedilemedi (numara çakışması sürüyor).');
  },

  async denetimGetir(id) {
    if (!AUTH.bagli) return null;
    const { data, error } = await AUTH.db.from('guvenlik_denetimleri')
      .select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(veriHatasi(error));
    return data || null;
  },

  async denetimGecmisi(hedefId) {
    if (!AUTH.bagli) return [];
    const { data, error } = await AUTH.db.from('guvenlik_denetimleri')
      .select('id, no, ozet, olusturuldu').eq('hedef_id', hedefId)
      .order('no', { ascending: false });
    if (error) throw new Error(veriHatasi(error));
    return data || [];
  },

  /* ---------- Bulgular (izlenir) ---------- */

  async bulgulariGetir(hedefId) {
    if (!AUTH.bagli) return [];
    const { data, error } = await AUTH.db.from('guvenlik_bulgulari')
      .select('*').eq('hedef_id', hedefId).order('son_gorulme', { ascending: false });
    if (error) throw new Error(veriHatasi(error));
    return data || [];
  },

  async bulguGetir(hedefId, imza) {
    if (!AUTH.bagli) return null;
    const { data, error } = await AUTH.db.from('guvenlik_bulgulari')
      .select('*').eq('hedef_id', hedefId).eq('imza', imza).maybeSingle();
    if (error) throw new Error(veriHatasi(error));
    return data || null;
  },

  async bulguOlustur(alanlar) {
    yazmaKontrol();
    const { data, error } = await AUTH.db.from('guvenlik_bulgulari')
      .insert(alanlar || {}).select('*');
    if (error) throw new Error(veriHatasi(error));
    if (!data || !data.length) throw new Error('Bulgu oluşturulamadı.');
    return data[0];
  },

  async bulguGuncelle(id, alanlar) {
    yazmaKontrol();
    const govde = Object.assign({}, alanlar, { son_gorulme: new Date().toISOString() });
    const { data, error } = await AUTH.db.from('guvenlik_bulgulari')
      .update(govde).eq('id', id).select('id');
    if (error) throw new Error(veriHatasi(error));
    if (!data || !data.length) throw new Error('Bulgu güncellenemedi.');
    return true;
  },

  /* ---------- Kararlar ---------- */

  async kararlariGetir(hedefId, imza) {
    if (!AUTH.bagli) return [];
    let q = AUTH.db.from('guvenlik_kararlari').select('*').eq('hedef_id', hedefId);
    if (imza) q = q.eq('bulgu_imzasi', imza);
    const { data, error } = await q.order('verildi', { ascending: false });
    if (error) throw new Error(veriHatasi(error));
    return data || [];
  },

  /* Bir denetimin ACIK bulgularını izle: yeni imza → ekle, mevcut → güncelle.
     Kanıt/HTTP/tarih imzaya girmez; imza hedef_id:kategori:varlik:islem:kapsam.
     Bu denetimde artık ACIK olmayan (önceden açık) bulgular "kapandi" yapılır. */
  async bulgulariIsle(hedefId, denetimId, acikBulgular) {
    yazmaKontrol();
    const mevcut = await this.bulgulariGetir(hedefId);
    const mevcutHarita = {};
    for (const b of mevcut) mevcutHarita[b.imza] = b;
    const buTur = new Set();
    for (const f of acikBulgular) {
      buTur.add(f.imza);
      const eski = mevcutHarita[f.imza];
      if (eski) {
        await this.bulguGuncelle(eski.id, { son_denetim_id: denetimId,
          son_durum: 'ACIK', duzeltme_durumu: 'acik', onem: f.onem || eski.onem,
          baslik: f.baslik || eski.baslik });
      } else {
        await this.bulguOlustur({ hedef_id: hedefId, imza: f.imza,
          kategori: f.kategori || '', onem: f.onem || '', baslik: f.baslik || '',
          ilk_denetim_id: denetimId, son_denetim_id: denetimId,
          son_durum: 'ACIK', duzeltme_durumu: 'acik' });
      }
    }
    /* Önceden ACIK olup bu denetimde görünmeyenler kapanmış olabilir. */
    for (const b of mevcut) {
      if (b.son_durum === 'ACIK' && !buTur.has(b.imza)) {
        await this.bulguGuncelle(b.id, { son_denetim_id: denetimId, son_durum: 'KAPALI',
          duzeltme_durumu: 'kapandi' });
      }
    }
  },

  async kararOlustur({ hedefId, imza, karar, gerekce, gecerliCommit }) {
    yazmaKontrol();
    const { data, error } = await AUTH.db.from('guvenlik_kararlari')
      .insert({ hedef_id: hedefId, bulgu_imzasi: imza, karar: karar || 'bilerek',
                gerekce: gerekce || '', veren: (AUTH.user && AUTH.user.id) || null,
                gecerli_commit: gecerliCommit || '' }).select('*');
    if (error) throw new Error(veriHatasi(error));
    if (!data || !data.length) throw new Error('Karar kaydedilemedi.');
    return data[0];
  },
};
