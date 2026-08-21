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
  kisilerHepsi: [],
  sablonlar: [],
  sektorler: [],
  /* Logolar private kovada; adres her oturumda yeniden üretilir. */
  logoAdres: {},
  standartlar: [],
  gorevStandart: [],

  yuklendi: false,
  hata: null,

  /* ---------- Canlı bağlantı ----------
     Başka biri bir şey değiştirdiğinde ekran kendiliğinden tazelenir.
     Peş peşe gelen değişiklikler tek tazelemede toplanır ki boşuna yüklenmesin. */

  kanal: null,
  _tazeleZaman: null,

  canliBasla(tazele) {
    if (!AUTH.bagli || this.kanal) return;

    const tetikle = () => {
      clearTimeout(this._tazeleZaman);
      this._tazeleZaman = setTimeout(tazele, 350);
    };

    try {
      this.kanal = AUTH.db.channel('studio')
        .on('postgres_changes', { event: '*', schema: 'public' }, tetikle)
        .subscribe();
    } catch (e) {
      this.kanal = null;   /* realtime yoksa uygulama yine çalışır */
    }
  },

  canliDur() {
    clearTimeout(this._tazeleZaman);
    if (!this.kanal) return;
    try { AUTH.db.removeChannel(this.kanal); } catch (e) {}
    this.kanal = null;
  },

  /* ---------- Yedekleme ----------
     Tek kaynak: aşağıdaki liste. Yeni tablo eklenince buraya bir satır eklenir. */

  KOLEKSIYONLAR: ['projeler', 'moduller', 'sayfalar', 'gorevler', 'hareketler', 'standartlar', 'gorevStandart'],

  yedekAl() {
    const veri = {};
    this.KOLEKSIYONLAR.forEach(k => { veri[k] = this[k]; });
    return JSON.stringify({
      imza: 'nizam-studio-yedek',
      surum: APP.version,
      tarih: new Date().toISOString(),
      veri,
    }, null, 2);
  },

  /* Yedeği okur ve doğrular. Yazma yapmaz — ne olduğunu söyler. */
  yedekOku(metin) {
    let paket;
    try { paket = JSON.parse(metin); }
    catch (e) { throw new Error('Dosya okunamadı. Geçerli bir yedek dosyası değil.'); }

    if (!paket || paket.imza !== 'nizam-studio-yedek')
      throw new Error('Bu dosya NIZAM Studio yedeği değil.');
    if (!paket.veri)
      throw new Error('Yedek boş görünüyor.');

    const sayim = {};
    this.KOLEKSIYONLAR.forEach(k => { sayim[k] = (paket.veri[k] || []).length; });
    return { surum: paket.surum, tarih: paket.tarih, sayim };
  },

  /* ---------- Okuma ---------- */

  async yukle() {
    this.hata = null;

    if (!AUTH.bagli) {                      // demo modu — veri yok
      this.projeler = []; this.moduller = []; this.sayfalar = [];
      this.gorevler = []; this.hareketler = []; this.kisiler = []; this.kisilerHepsi = [];
      this.sablonlar = []; this.sektorler = [];
      this.standartlar = []; this.gorevStandart = [];
      this.yuklendi = true;
      return;
    }

    try {
      const [p, m, s, g, h, k, st, gs, ms, sk] = await Promise.all([
        AUTH.db.from('projects').select('*').eq('arsiv', false).order('sira').order('olusturuldu'),
        AUTH.db.from('modules').select('*').order('sira'),
        AUTH.db.from('pages').select('*').order('sira'),
        AUTH.db.from('tasks').select('*').order('no', { ascending: false }),
        AUTH.db.from('task_events').select('*').order('olusturuldu'),
        AUTH.db.from('profiles').select('id, ad, rol, aktif, foto'),
        AUTH.db.from('standards').select('*').eq('aktif', true).order('sira'),
        AUTH.db.from('task_standards').select('*'),
        AUTH.db.from('module_templates').select('*').eq('aktif', true).order('sira'),
        AUTH.db.from('sectors').select('*').eq('aktif', true).order('sira'),
      ]);

      const ilkHata = p.error || m.error || s.error || g.error || h.error || st.error || gs.error;
      if (ilkHata) throw ilkHata;

      this.projeler   = p.data || [];
      this.moduller   = m.data || [];
      this.sayfalar   = s.data || [];
      this.gorevler   = g.data || [];
      this.hareketler = h.data || [];
      /* kisiler = görev atanabilecekler (yalnız aktif).
         kisilerHepsi = ekip ekranı için pasifler dâhil herkes. */
      this.kisilerHepsi = (k.data || []).slice()
        .sort((a, b) => String(a.ad || '').localeCompare(String(b.ad || ''), 'tr'));
      this.kisiler      = this.kisilerHepsi.filter(x => x.aktif);
      this.standartlar  = st.data || [];
      this.gorevStandart = gs.data || [];
      /* Tablo henüz kurulmamışsa hata verme — koddaki hazır liste devreye girer. */
      this.sablonlar     = (ms && !ms.error && ms.data) ? ms.data : [];
      /* sectors tablosu henüz kurulmamışsa hata verme — liste boş kalır. */
      this.sektorler     = (sk && !sk.error && sk.data) ? sk.data : [];
      this.yuklendi     = true;
      await this.logolariTazele();
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
  async projeOlustur({ firma, renk, platform, veri, moduller, ek }) {
    yazmaKontrol();

    const temel = { firma: firma.trim(), renk, platform, veri, olusturan: AUTH.user.id };

    /* Yeni alanlar (sektör, yetkili, dil, tarihler) ancak SQL çalıştırıldıktan
       sonra var. Sütun yoksa Supabase hata verir; o durumda alanları düşürüp
       projeyi yine de kuruyoruz — sihirbaz SQL beklemek zorunda kalmasın. */
    let proje = null, error = null;
    for (const govde of [Object.assign({}, temel, ek || {}), temel]) {
      const sonuc = await AUTH.db.from('projects').insert(govde).select().single();
      if (!sonuc.error) { proje = sonuc.data; error = null; break; }
      error = sonuc.error;
      if (!/column .* does not exist|Could not find the/i.test(error.message || '')) break;
    }
    if (!proje) throw new Error(veriHatasi(error));

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

  /* Standartları gruplara böler. Sıra config.js'teki STANDART_GRUPLARI'dır;
     orada olmayan bir grup adı sona eklenir. Boş gruplar listelenmez. */
  standartGruplari() {
    const kova = new Map();
    this.standartlar.forEach(st => {
      const g = (st.grup || VARSAYILAN_GRUP).trim() || VARSAYILAN_GRUP;
      if (!kova.has(g)) kova.set(g, []);
      kova.get(g).push(st);
    });

    /* Hem gruplar hem grup içi alfabetik — Türkçe sıraya göre
       (ç, ğ, ı, ö, ş, ü yerli yerinde). */
    const tr = (x, y) => x.localeCompare(y, 'tr');

    return [...kova.entries()]
      .map(([ad, liste]) => ({ ad, liste: liste.slice().sort((x, y) => tr(x.ad, y.ad)) }))
      .sort((a, b) => tr(a.ad, b.ad));
  },

  /* Modül şablonları yalnızca veritabanından gelir.
     Eskiden liste boşalınca koddaki hazır listeye düşüyordu; sildiğin
     şablonlar bir sonraki açılışta geri geliyordu. */
  modulSablonlari() {
    return this.sablonlar;
  },

  async sektorKaydet(id, alanlar) {
    yazmaKontrol();
    const q = id
      ? AUTH.db.from('sectors').update(alanlar).eq('id', id)
      : AUTH.db.from('sectors')
          .insert(Object.assign({ sira: this.sektorler.length + 1 }, alanlar));
    const { data, error } = await q.select('id');
    if (error) throw new Error(sektorHatasi(error));
    if (!data || !data.length) throw new Error(sektorHatasi({}));
    await this.yukle();
  },

  async sektorSil(id) {
    yazmaKontrol();
    const { error } = await AUTH.db.from('sectors').update({ aktif: false }).eq('id', id);
    if (error) throw new Error(sektorHatasi(error));
    await this.yukle();
  },

  async sablonKaydet(id, alanlar) {
    yazmaKontrol();
    const q = id
      ? AUTH.db.from('module_templates').update(alanlar).eq('id', id)
      : AUTH.db.from('module_templates')
          .insert(Object.assign({ sira: this.sablonlar.length + 1 }, alanlar));
    const { error } = await q;
    if (error) throw new Error(veriHatasi(error));
    await this.yukle();
  },

  async sablonSil(id) {
    yazmaKontrol();
    const { error } = await AUTH.db.from('module_templates').update({ aktif: false }).eq('id', id);
    if (error) throw new Error(veriHatasi(error));
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

  /* Yapıştırılan kayıtları yazar. Aynı adda standart varsa üzerine yazar,
     yoksa ekler. Tek tek gider ki hangisinin patladığı belli olsun. */
  async standartlarIceAktar(kayitlar) {
    yazmaKontrol();
    let eklenen = 0, guncellenen = 0;

    for (const k of kayitlar) {
      const mevcut = this.standartlar.find(st => st.ad === k.ad);
      const alanlar = { ad: k.ad, grup: k.grup, ozet: k.ozet, tarif: k.tarif };

      const { error } = mevcut
        ? await AUTH.db.from('standards').update(alanlar).eq('id', mevcut.id)
        : await AUTH.db.from('standards')
            .insert(Object.assign({ sira: this.standartlar.length + eklenen + 1 }, alanlar));

      if (error) throw new Error(`"${k.ad}" yazılamadı — ${veriHatasi(error)}`);
      mevcut ? guncellenen++ : eklenen++;
    }

    await this.yukle();
    return { eklenen, guncellenen };
  },

  /* Kullanıcı kendi adını değiştirebilir. Rol değişmez — o yöneticinin işi. */
  async adKaydet(ad) {
    if (!AUTH.db || !AUTH.user) throw new Error('Oturum yok.');

    /* .select() şart: güncelleme kuralı yoksa Supabase hata vermez, sessizce
       hiçbir satıra dokunmaz. Dönen satırı saymazsak "kaydedildi" der ve
       hiçbir şey değişmez. */
    const { data, error } = await AUTH.db
      .from('profiles').update({ ad }).eq('id', AUTH.user.id).select('ad');

    if (error) throw new Error(veriHatasi(error));
    if (!data || !data.length) {
      throw new Error('Ad yazılamadı — sql/08-profil-ad.sql dosyasını Supabase\'de çalıştır.');
    }
    await AUTH.profilOku();
  },

  /* Fotoğrafı kovaya koyar, adresini profile yazar.
     Dosya adı kullanıcının kimliği — kural bunu şart koşuyor, kimse
     başkasının fotoğrafının üstüne yazamıyor. */
  async fotoYukle(dosya) {
    if (!AUTH.db || !AUTH.user) throw new Error('Oturum yok.');
    if (!/^image\//.test(dosya.type)) throw new Error('Yalnızca resim yükleyebilirsin.');
    if (dosya.size > 4 * 1024 * 1024) throw new Error('Dosya 4 MB\'ı geçmesin.');

    const uzanti = (dosya.name.split('.').pop() || 'jpg').toLowerCase().slice(0, 5);
    const yol = AUTH.user.id + '.' + uzanti;

    const yukle = await AUTH.db.storage.from('avatarlar')
      .upload(yol, dosya, { upsert: true, contentType: dosya.type });
    if (yukle.error) throw new Error(depoHatasi(yukle.error));

    const { data } = AUTH.db.storage.from('avatarlar').getPublicUrl(yol);
    /* Tarayıcı eski fotoğrafı önbellekte tutmasın diye zaman damgası ekleniyor. */
    const adres = data.publicUrl + '?t=' + Date.now();

    const sonuc = await AUTH.db.from('profiles')
      .update({ foto: adres }).eq('id', AUTH.user.id).select('foto');
    if (sonuc.error) throw new Error(veriHatasi(sonuc.error));
    if (!sonuc.data || !sonuc.data.length) {
      throw new Error('Adres profile yazılamadı — sql/08-profil-ad.sql çalıştırılmamış olabilir.');
    }
    await AUTH.profilOku();
  },

  /* Ekip: bir kişinin adını, rolünü, aktifliğini değiştirir.
     Neyin değişebileceğine veritabanındaki kilit karar veriyor. */
  async kisiKaydet(id, alanlar) {
    yazmaKontrol();
    const { data, error } = await AUTH.db
      .from('profiles').update(alanlar).eq('id', id).select('id');
    if (error) throw new Error(veriHatasi(error));
    if (!data || !data.length) {
      throw new Error('Değişiklik yazılamadı — sql/10-ekip.sql çalıştırılmamış olabilir.');
    }
    await this.yukle();
  },

  /* Kullanıcı açma sunucuda yapılır: gizli anahtar tarayıcıya konamaz. */
  async kullaniciEkle({ mail, ad, rol, sifre }) {
    yazmaKontrol();
    const { data, error } = await AUTH.db.functions.invoke('kullanici-ekle', {
      body: { mail, ad, rol, sifre },
    });

    if (error) {
      /* Fonksiyonun kendi Türkçe mesajı gövdede geliyor; onu göstermeye çalış. */
      let mesaj = '';
      try { mesaj = (await error.context.json()).hata; } catch (_) {}
      if (!mesaj && /Failed to send|fetch/i.test(error.message || '')) {
        mesaj = 'kullanici-ekle fonksiyonu bulunamadı — Supabase → Edge Functions\'dan kur.';
      }
      throw new Error(mesaj || error.message || 'Kullanıcı açılamadı.');
    }
    if (data && data.hata) throw new Error(data.hata);

    await this.yukle();
  },

  /* ---------- Firma logosu ve paleti ---------- */

  /* Private kovada dosyanın kendisi adresle açılmaz; her oturum için
     süreli (imzalı) adres üretiliyor. Hepsi tek çağrıda alınıyor. */
  async logolariTazele() {
    this.logoAdres = {};
    if (!AUTH.db) return;

    const yollar = this.projeler.map(p => p.logo).filter(Boolean);
    if (!yollar.length) { this.resimleriIsit(); return; }

    const { data, error } = await AUTH.db.storage
      .from('logolar').createSignedUrls(yollar, 3600);
    if (error || !data) return;

    data.forEach(x => {
      if (!x.signedUrl) return;
      const p = this.projeler.find(pr => pr.logo === x.path);
      if (p) this.logoAdres[p.id] = x.signedUrl;
    });

    this.resimleriIsit();
  },

  /* Resimleri açılışta arka planda indirir — tarayıcının önbelleğine girsinler.
     Projeye girildiğinde indirme beklenmez, logo anında görünür.
     Beklemiyoruz: indirme sürerken uygulama açılmaya devam ediyor. */
  resimleriIsit() {
    /* Yalnızca proje logoları. Ekip fotoğrafları da eklenince tarayıcının
       eşzamanlı indirme sırası doluyor ve senin kendi fotoğrafın arkada
       kalıyordu — ekip fotoğrafları zaten Ekip ekranında yükleniyor. */
    Object.values(this.logoAdres).forEach(adres => { new Image().src = adres; });
  },

  async logoYukle(projeId, dosya) {
    yazmaKontrol();
    if (!/^image\//.test(dosya.type)) throw new Error('Yalnızca resim yükleyebilirsin.');
    if (dosya.size > 4 * 1024 * 1024) throw new Error('Dosya 4 MB\'ı geçmesin.');

    const uzanti = (dosya.name.split('.').pop() || 'png').toLowerCase().slice(0, 5);
    const yol = projeId + '.' + uzanti;

    const yukle = await AUTH.db.storage.from('logolar')
      .upload(yol, dosya, { upsert: true, contentType: dosya.type });
    if (yukle.error) throw new Error(depoHatasi(yukle.error, 'logolar'));

    const { error } = await AUTH.db.from('projects').update({ logo: yol }).eq('id', projeId);
    if (error) throw new Error(veriHatasi(error));
    await this.yukle();
  },

  async logoSil(projeId) {
    yazmaKontrol();
    const p = this.proje(projeId);
    if (p && p.logo) await AUTH.db.storage.from('logolar').remove([p.logo]);
    const { error } = await AUTH.db.from('projects').update({ logo: null }).eq('id', projeId);
    if (error) throw new Error(veriHatasi(error));
    await this.yukle();
  },

  async paletKaydet(projeId, palet) {
    yazmaKontrol();
    const { data, error } = await AUTH.db
      .from('projects').update({ palet }).eq('id', projeId).select('id');
    if (error) throw new Error(veriHatasi(error));
    if (!data || !data.length) {
      throw new Error('Palet yazılamadı — sql/11-marka.sql çalıştırılmamış olabilir.');
    }
    await this.yukle();
  },

  async fotoSil() {
    if (!AUTH.db || !AUTH.user) throw new Error('Oturum yok.');
    const sonuc = await AUTH.db.from('profiles')
      .update({ foto: null }).eq('id', AUTH.user.id).select('id');
    if (sonuc.error) throw new Error(veriHatasi(sonuc.error));
    await AUTH.profilOku();
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

/* Depo hatalarını Türkçeye çevirir — çıplak İngilizce mesaj gösterme. */
/* sectors tablosu henüz kurulmamışsa açık söyle. */
function sektorHatasi(e) {
  const m = (e && e.message) || '';
  if (/relation .*sectors.* does not exist|Could not find the table/i.test(m)) {
    return 'Sektör listesi için sql/13-sektor.sql dosyasını Supabase\'de çalıştır.';
  }
  return veriHatasi(e);
}

function depoHatasi(e, kova = 'avatarlar') {
  const m = (e && e.message) || '';
  const sql = kova === 'logolar' ? 'sql/11-marka.sql' : 'sql/09-foto.sql';
  if (/bucket not found/i.test(m))                 return kova + ' kovası yok — Supabase → Storage\'den oluştur.';
  if (/policy|row-level|not authorized/i.test(m))  return 'Yükleme izni yok — ' + sql + ' dosyasını çalıştır.';
  if (/payload too large|exceeded/i.test(m))       return 'Dosya çok büyük.';
  return m || 'Fotoğraf yüklenemedi.';
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
