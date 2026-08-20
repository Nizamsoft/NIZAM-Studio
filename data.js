/* ==========================================================================
   NIZAM | Studio — Veri katmanı
   Projeler, modüller ve sayfalar. Supabase ile konuşan tek yer burasıdır.
   Veri az olduğu için tamamı belleğe alınır, ekranlar bellekten çizilir.
   ========================================================================== */

'use strict';

const DB = {

  projeler: [],
  moduller: [],
  sayfalar: [],

  yuklendi: false,
  hata: null,

  /* ---------- Okuma ---------- */

  async yukle() {
    this.hata = null;

    if (!AUTH.bagli) {                      // demo modu — veri yok
      this.projeler = []; this.moduller = []; this.sayfalar = [];
      this.yuklendi = true;
      return;
    }

    try {
      const [p, m, s] = await Promise.all([
        AUTH.db.from('projects').select('*').eq('arsiv', false).order('sira').order('olusturuldu'),
        AUTH.db.from('modules').select('*').order('sira'),
        AUTH.db.from('pages').select('*').order('sira'),
      ]);

      const ilkHata = p.error || m.error || s.error;
      if (ilkHata) throw ilkHata;

      this.projeler = p.data || [];
      this.moduller = m.data || [];
      this.sayfalar = s.data || [];
      this.yuklendi = true;
    } catch (e) {
      this.hata = veriHatasi(e);
      this.yuklendi = false;
      throw new Error(this.hata);
    }
  },

  proje(id)        { return this.projeler.find(p => p.id === id) || null; },
  modulleri(pid)   { return this.moduller.filter(m => m.proje_id === pid).sort(siraya); },
  sayfalari(mid)   { return this.sayfalar.filter(s => s.modul_id === mid).sort(siraya); },

  /* Bir projenin sayıları. Görevler Adım 3'te gelecek — şimdilik sıfır.
     Yüzde her zaman hesaplanır, asla elle girilmez. */
  sayim(pid) {
    const moduller = this.modulleri(pid);
    const modulIds = moduller.map(m => m.id);
    const sayfa    = this.sayfalar.filter(s => modulIds.includes(s.modul_id)).length;

    const gorev = 0, bitmis = 0;
    return {
      modul:  moduller.filter(m => !m.genel).length,
      sayfa,
      gorev,
      bitmis,
      yuzde: gorev ? Math.round(bitmis / gorev * 100) : 0,
    };
  },

  /* Modül sayıları — detay ekranındaki satırlar için */
  modulSayim(mid) {
    const gorev = 0, bitmis = 0;
    return {
      sayfa: this.sayfalari(mid).length,
      gorev,
      bitmis,
      yuzde: gorev ? Math.round(bitmis / gorev * 100) : 0,
    };
  },

  /* ---------- Yazma ---------- */

  /* Sihirbazın sonucu. Proje + Proje Geneli kovası + seçilen modüller
     ve şablon sayfaları tek seferde kurulur. */
  async projeOlustur({ firma, renk, platform, veri, moduller }) {
    yazmaKontrol();

    const { data: proje, error } = await AUTH.db
      .from('projects')
      .insert({ firma: firma.trim(), renk, platform, veri, olusturan: AUTH.user.id })
      .select()
      .single();
    if (error) throw new Error(veriHatasi(error));

    /* Proje Geneli her zaman ilk sırada ve silinemez */
    const modulKayitlari = [{ proje_id: proje.id, ad: GENEL_MODUL, genel: true, sira: 0 }];
    moduller.forEach((m, i) => {
      modulKayitlari.push({ proje_id: proje.id, ad: m.ad, genel: false, sira: i + 1 });
    });

    const { data: kurulan, error: mHata } = await AUTH.db
      .from('modules').insert(modulKayitlari).select();
    if (mHata) throw new Error(veriHatasi(mHata));

    /* Şablon sayfaları */
    const sayfaKayitlari = [];
    kurulan.filter(k => !k.genel).forEach(k => {
      const sablon = moduller.find(m => m.ad === k.ad);
      (sablon && sablon.sayfalar || []).forEach((ad, i) => {
        sayfaKayitlari.push({ modul_id: k.id, ad, sira: i });
      });
    });

    if (sayfaKayitlari.length) {
      const { error: sHata } = await AUTH.db.from('pages').insert(sayfaKayitlari);
      if (sHata) throw new Error(veriHatasi(sHata));
    }

    await this.yukle();
    return proje.id;
  },

  async projeGuncelle(id, alanlar) {
    yazmaKontrol();
    const { error } = await AUTH.db.from('projects').update(alanlar).eq('id', id);
    if (error) throw new Error(veriHatasi(error));
    await this.yukle();
  },

  /* Silmiyoruz, arşive alıyoruz — geçmiş kaybolmasın */
  async projeArsivle(id) {
    yazmaKontrol();
    const { error } = await AUTH.db.from('projects').update({ arsiv: true }).eq('id', id);
    if (error) throw new Error(veriHatasi(error));
    await this.yukle();
  },

  async modulEkle(projeId, ad, sayfalar = []) {
    yazmaKontrol();
    const sira = this.modulleri(projeId).length;

    const { data, error } = await AUTH.db
      .from('modules').insert({ proje_id: projeId, ad: ad.trim(), sira }).select().single();
    if (error) throw new Error(veriHatasi(error));

    if (sayfalar.length) {
      const kayitlar = sayfalar.map((s, i) => ({ modul_id: data.id, ad: s, sira: i }));
      const { error: sHata } = await AUTH.db.from('pages').insert(kayitlar);
      if (sHata) throw new Error(veriHatasi(sHata));
    }

    await this.yukle();
    return data.id;
  },

  async modulSil(id) {
    yazmaKontrol();
    const { error } = await AUTH.db.from('modules').delete().eq('id', id);
    if (error) throw new Error(veriHatasi(error));
    await this.yukle();
  },

  async sayfaEkle(modulId, ad) {
    yazmaKontrol();
    const sira = this.sayfalari(modulId).length;
    const { error } = await AUTH.db
      .from('pages').insert({ modul_id: modulId, ad: ad.trim(), sira });
    if (error) throw new Error(veriHatasi(error));
    await this.yukle();
  },

  async sayfaSil(id) {
    yazmaKontrol();
    const { error } = await AUTH.db.from('pages').delete().eq('id', id);
    if (error) throw new Error(veriHatasi(error));
    await this.yukle();
  },

  async adDegistir(tablo, id, ad) {
    yazmaKontrol();
    const { error } = await AUTH.db.from(tablo).update({ ad: ad.trim() }).eq('id', id);
    if (error) throw new Error(veriHatasi(error));
    await this.yukle();
  },
};

/* ---------- Yardımcılar ---------- */

function siraya(a, b) {
  if (a.sira !== b.sira) return a.sira - b.sira;
  return (a.olusturuldu || '').localeCompare(b.olusturuldu || '');
}

function yazmaKontrol() {
  if (!AUTH.bagli)    throw new Error('Demo modunda kayıt yapılamaz.');
  if (!AUTH.yonetici) throw new Error('Bu işlem için yönetici olman gerekiyor.');
}

function veriHatasi(err) {
  const m = (err && (err.message || err.hint) || '').toLowerCase();

  if (m.includes('row-level security') || m.includes('violates row-level'))
    return 'Bu işlem için yetkin yok.';
  if (m.includes('does not exist') || m.includes('schema cache'))
    return 'Tablolar henüz kurulmamış. sql/03-projeler.sql dosyasını Supabase\'de çalıştır.';
  if (m.includes('failed to fetch') || m.includes('network'))
    return 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.';
  if (m.includes('duplicate key'))
    return 'Bu kayıt zaten var.';

  return 'Veri işlemi başarısız oldu. Tekrar dene.';
}
