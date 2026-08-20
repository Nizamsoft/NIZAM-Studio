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
  gorevler: [],
  hareketler: [],
  kisiler: [],
  standartlar: [],
  gorevStandart: [],

  yuklendi: false,
  hata: null,

  /* ---------- Okuma ---------- */

  async yukle() {
    this.hata = null;

    if (!AUTH.bagli) {                      // demo modu — veri yok
      this.projeler = []; this.moduller = []; this.sayfalar = [];
      this.gorevler = []; this.hareketler = []; this.kisiler = [];
      this.standartlar = []; this.gorevStandart = [];
      this.yuklendi = true;
      return;
    }

    try {
      const [p, m, s, g, h, k, st, gs] = await Promise.all([
        AUTH.db.from('projects').select('*').eq('arsiv', false).order('sira').order('olusturuldu'),
        AUTH.db.from('modules').select('*').order('sira'),
        AUTH.db.from('pages').select('*').order('sira'),
        AUTH.db.from('tasks').select('*').order('no', { ascending: false }),
        AUTH.db.from('task_events').select('*').order('olusturuldu'),
        AUTH.db.from('profiles').select('id, ad, rol, aktif'),
        AUTH.db.from('standards').select('*').eq('aktif', true).order('sira'),
        AUTH.db.from('task_standards').select('*'),
      ]);

      const ilkHata = p.error || m.error || s.error || g.error || h.error || st.error || gs.error;
      if (ilkHata) throw ilkHata;

      this.projeler   = p.data || [];
      this.moduller   = m.data || [];
      this.sayfalar   = s.data || [];
      this.gorevler   = g.data || [];
      this.hareketler = h.data || [];
      this.kisiler      = (k.data || []).filter(x => x.aktif);
      this.standartlar  = st.data || [];
      this.gorevStandart = gs.data || [];
      this.yuklendi     = true;
    } catch (e) {
      this.hata = veriHatasi(e);
      this.yuklendi = false;
      throw new Error(this.hata);
    }
  },

  proje(id)        { return this.projeler.find(p => p.id === id) || null; },
  modulleri(pid)   { return this.moduller.filter(m => m.proje_id === pid).sort(siraya); },
  sayfalari(mid)   { return this.sayfalar.filter(s => s.modul_id === mid).sort(siraya); },

  gorevleri(sec = {}) {
    return this.gorevler.filter(g =>
      (sec.proje ? g.proje_id === sec.proje : true) &&
      (sec.modul ? g.modul_id === sec.modul : true) &&
      (sec.sayfa ? g.sayfa_id === sec.sayfa : true) &&
      (sec.kisi  ? g.atanan   === sec.kisi  : true) &&
      (sec.durum ? g.durum    === sec.durum : true)
    );
  },

  gorev(id)     { return this.gorevler.find(g => g.id === id) || null; },
  hareketleri(gid) { return this.hareketler.filter(h => h.gorev_id === gid); },

  /* Yüzde her zaman hesaplanır, asla elle girilmez. */
  ilerleme(gorevler) {
    const bitmis = gorevler.filter(g => g.durum === 'tamamlandi').length;
    return {
      gorev: gorevler.length,
      bitmis,
      yuzde: gorevler.length ? Math.round(bitmis / gorevler.length * 100) : 0,
    };
  },

  /* Bir projenin sayıları */
  sayim(pid) {
    const moduller = this.modulleri(pid);
    const modulIds = moduller.map(m => m.id);
    return Object.assign({
      modul: moduller.filter(m => !m.genel).length,
      sayfa: this.sayfalar.filter(s => modulIds.includes(s.modul_id)).length,
    }, this.ilerleme(this.gorevleri({ proje: pid })));
  },

  /* Modül sayıları — detay ekranındaki satırlar için */
  modulSayim(mid) {
    return Object.assign(
      { sayfa: this.sayfalari(mid).length },
      this.ilerleme(this.gorevleri({ modul: mid })));
  },

  sayfaSayim(sid) { return this.ilerleme(this.gorevleri({ sayfa: sid })); },

  standart(id) { return this.standartlar.find(s => s.id === id) || null; },

  /* Bir göreve bağlı standartlar — prompt bunları içine alır */
  gorevinStandartlari(gorevId) {
    return this.gorevStandart
      .filter(x => x.gorev_id === gorevId)
      .map(x => this.standart(x.standart_id))
      .filter(Boolean)
      .sort(function (a, b) { return a.sira - b.sira; });
  },

  /* Bir standart kaç projede kullanılıyor */
  standartKullanimi(standartId) {
    const gorevIds = this.gorevStandart.filter(x => x.standart_id === standartId).map(x => x.gorev_id);
    const projeler = new Set();
    gorevIds.forEach(gid => {
      const g = this.gorev(gid);
      if (g) projeler.add(g.proje_id);
    });
    return projeler.size;
  },

  kisi(id) {
    if (!id) return null;
    return this.kisiler.find(k => k.id === id) || null;
  },

  kisiAdi(id) {
    const k = this.kisi(id);
    if (k && k.ad) return k.ad;
    if (id && AUTH.user && id === AUTH.user.id) return AUTH.ad;
    return id ? 'Bilinmeyen' : 'Atanmadı';
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

  /* ---------- Görevler ---------- */

  async gorevOlustur({ proje_id, modul_id, sayfa_id, baslik, aciklama, oncelik, atanan, standartlar }) {
    yazmaKontrol();

    const { data, error } = await AUTH.db.from('tasks').insert({
      proje_id,
      modul_id: modul_id || null,
      sayfa_id: sayfa_id || null,
      baslik: baslik.trim(),
      aciklama: (aciklama || '').trim(),
      oncelik: oncelik || 'normal',
      atanan: atanan || null,
      olusturan: AUTH.user.id,
    }).select().single();
    if (error) throw new Error(veriHatasi(error));

    if (standartlar && standartlar.length) {
      const kayitlar = standartlar.map(sid => ({ gorev_id: data.id, standart_id: sid }));
      const { error: sHata } = await AUTH.db.from('task_standards').insert(kayitlar);
      if (sHata) throw new Error(veriHatasi(sHata));
    }

    await this.hareketEkle(data.id, 'olusturuldu');
    if (atanan) await this.hareketEkle(data.id, 'atandi', DB.kisiAdi(atanan));

    await this.yukle();
    return data.id;
  },

  async gorevGuncelle(id, alanlar) {
    const { error } = await AUTH.db.from('tasks').update(alanlar).eq('id', id);
    if (error) throw new Error(veriHatasi(error));
    await this.yukle();
  },

  /* Durum değişimi hep buradan geçer; hareket kaydı kendiliğinden düşer. */
  async durumDegistir(id, yeniDurum, notu = '') {
    const gorev = this.gorev(id);
    if (!gorev) throw new Error('Görev bulunamadı.');

    const tip = {
      gelistiriliyor: gorev.durum === 'kontrolde' ? 'revize' : 'baslandi',
      kontrolde:      'kontrole',
      tamamlandi:     'onaylandi',
      yapilacak:      'geri',
    }[yeniDurum];

    const { error } = await AUTH.db.from('tasks').update({ durum: yeniDurum }).eq('id', id);
    if (error) throw new Error(veriHatasi(error));

    await this.hareketEkle(id, tip, notu);
    await this.yukle();
  },

  async hareketEkle(gorevId, tip, notu = '') {
    const { error } = await AUTH.db.from('task_events').insert({
      gorev_id: gorevId, tip, notu, kim: AUTH.user ? AUTH.user.id : null,
    });
    if (error) throw new Error(veriHatasi(error));
  },

  /* Bir görevin standart bağlarını topluca yaz */
  async gorevStandartYaz(gorevId, standartIdler) {
    yazmaKontrol();

    const sil = await AUTH.db.from('task_standards').delete().eq('gorev_id', gorevId);
    if (sil.error) throw new Error(veriHatasi(sil.error));

    if (standartIdler.length) {
      const kayitlar = standartIdler.map(sid => ({ gorev_id: gorevId, standart_id: sid }));
      const { error } = await AUTH.db.from('task_standards').insert(kayitlar);
      if (error) throw new Error(veriHatasi(error));
    }
    await this.yukle();
  },

  async standartKaydet(id, alanlar) {
    yazmaKontrol();
    const q = id
      ? AUTH.db.from('standards').update(alanlar).eq('id', id)
      : AUTH.db.from('standards').insert(Object.assign({ sira: this.standartlar.length + 1 }, alanlar));
    const { error } = await q;
    if (error) throw new Error(veriHatasi(error));
    await this.yukle();
  },

  async standartSil(id) {
    yazmaKontrol();
    const { error } = await AUTH.db.from('standards').update({ aktif: false }).eq('id', id);
    if (error) throw new Error(veriHatasi(error));
    await this.yukle();
  },

  async gorevSil(id) {
    yazmaKontrol();
    const { error } = await AUTH.db.from('tasks').delete().eq('id', id);
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
  if (m.includes('bu görev sana atanmamış'))
    return 'Bu görev sana atanmamış.';
  if (m.includes('yalnızca yönetici'))
    return 'Bu durumu yalnızca yönetici verebilir.';

  return 'Veri işlemi başarısız oldu. Tekrar dene.';
}
