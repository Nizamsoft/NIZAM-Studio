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

  async denetimOlustur({ hedefId, manifestId, matris, sonuclar, ozet, olusturan }) {
    yazmaKontrol();
    /* `no` hedef içinde artan — son numaranın bir fazlası. */
    const { data: sonuncu } = await AUTH.db.from('guvenlik_denetimleri')
      .select('no').eq('hedef_id', hedefId).order('no', { ascending: false }).limit(1);
    const no = (sonuncu && sonuncu.length ? sonuncu[0].no : 0) + 1;
    const { data, error } = await AUTH.db.from('guvenlik_denetimleri')
      .insert({ hedef_id: hedefId, manifest_id: manifestId || null, no,
                matris: matris || [], sonuclar: sonuclar || [], ozet: ozet || {},
                olusturan: olusturan || (AUTH.user && AUTH.user.id) || null }).select('*');
    if (error) throw new Error(veriHatasi(error));
    if (!data || !data.length) throw new Error('Denetim kaydedilemedi.');
    return data[0];
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
