/* ==========================================================================
   NIZAM | Studio — Oturum
   Tek sorumluluk: giriş, çıkış, oturumu hatırlama, rolü okuma.
   Supabase anahtarları boşsa demo moduna düşer (uygulama yine açılır).
   ========================================================================== */

'use strict';

const AUTH = {

  db:      null,   // Supabase istemcisi
  user:    null,   // giriş yapmış kullanıcı (auth kaydı)
  profile: null,   // { ad, rol, aktif }
  demo:    false,  // anahtar yoksa true

  /* ---------- Kurulum ---------- */

  init() {
    const hazir = SUPABASE.url && SUPABASE.key && typeof supabase !== 'undefined';
    if (!hazir) { this.demo = true; return; }

    this.db = supabase.createClient(SUPABASE.url, SUPABASE.key, {
      auth: {
        persistSession: true,       // sayfa yenilenince oturum kalsın
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'ns.auth',
      },
    });
  },

  get bagli() { return !this.demo && !!this.db; },

  /* ---------- Oturumu geri yükle ---------- */

  /* Sayfa açılışında çağrılır. Geçerli oturum varsa true döner. */
  async restore() {
    if (this.demo) return demoOturumVar();

    let veri;
    try {
      veri = await this.db.auth.getSession();
    } catch (e) {
      return false;                      // ağ yok — giriş ekranına düş
    }

    const oturum = veri.data && veri.data.session;
    if (!oturum) return false;

    this.user = oturum.user;
    const p = await this.profilOku();
    if (!p) { await this.signOut(); return false; }
    return true;
  },

  /* ---------- Giriş ---------- */

  /* Başarılıysa hiçbir şey döndürmez, başarısızsa Türkçe mesajla hata fırlatır. */
  async signIn(mail, sifre) {
    mail  = (mail  || '').trim();
    sifre = sifre || '';

    if (!mail)  throw new Error('E-posta adresini yaz.');
    if (!sifre) throw new Error('Şifreni yaz.');

    if (this.demo) { demoOturumAc(); return; }

    let sonuc;
    try {
      sonuc = await this.db.auth.signInWithPassword({ email: mail, password: sifre });
    } catch (e) {
      throw new Error('Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.');
    }

    if (sonuc.error) throw new Error(hataCevir(sonuc.error));

    this.user = sonuc.data.user;

    const p = await this.profilOku();
    if (!p) {
      await this.signOut();
      throw new Error('Bu hesabın Studio erişimi yok. Yöneticine başvur.');
    }
    if (p.aktif === false) {
      await this.signOut();
      throw new Error('Hesabın kapatılmış. Yöneticine başvur.');
    }
  },

  /* ---------- Çıkış ---------- */

  async signOut() {
    this.user = null;
    this.profile = null;
    if (this.demo) { demoOturumKapat(); return; }
    try { await this.db.auth.signOut(); } catch (e) {}
  },

  /* ---------- Profil ---------- */

  async profilOku() {
    if (this.demo || !this.user) { this.profile = demoProfil(); return this.profile; }

    let sonuc;
    try {
      sonuc = await this.db
        .from('profiles')
        .select('ad, rol, aktif, foto')
        .eq('id', this.user.id)
        .maybeSingle();
    } catch (e) {
      return null;
    }

    if (sonuc.error || !sonuc.data) return null;

    this.profile = sonuc.data;

    return this.profile;
  },

  /* ---------- Arayüzün sorduğu kısa bilgiler ---------- */

  get ad() {
    if (this.profile && this.profile.ad) return this.profile.ad;
    if (this.user && this.user.email)    return this.user.email.split('@')[0];
    return 'Kullanıcı';
  },

  get rol() { return (this.profile && this.profile.rol) || 'gelistirici'; },

  get rolAdi() { return this.rol === 'yonetici' ? 'Yönetici' : 'Geliştirici'; },

  get yonetici() { return this.rol === 'yonetici'; },

  get foto() { return (this.profile && this.profile.foto) || ''; },

  /* Pasif kullanıcı hiçbir veriye ulaşamaz (rolum() null döner);
     ekranı boş bırakmak yerine açıkça geri çeviriyoruz. */
  get pasif() { return !!(this.profile && this.profile.aktif === false); },

  get mail() { return (this.user && this.user.email) || '—'; },

  /* Ad soyaddan avatar baş harfleri: "Nizam Aydın" -> "NA" */
  get basHarfler() {
    const parcalar = this.ad.trim().split(/\s+/).filter(Boolean);
    if (!parcalar.length) return 'NS';
    if (parcalar.length === 1) return parcalar[0].slice(0, 2).toLocaleUpperCase('tr');
    return (parcalar[0][0] + parcalar[parcalar.length - 1][0]).toLocaleUpperCase('tr');
  },
};

/* ---------- Supabase hata mesajlarını Türkçeye çevir ---------- */

function hataCevir(err) {
  const m = (err && err.message || '').toLowerCase();

  if (m.includes('invalid login credentials')) return 'E-posta veya şifre hatalı.';
  if (m.includes('email not confirmed'))       return 'E-posta adresin henüz doğrulanmamış.';
  if (m.includes('user not found'))            return 'Böyle bir kullanıcı yok.';
  if (m.includes('too many requests') ||
      m.includes('rate limit'))                return 'Çok fazla deneme yapıldı. Biraz bekle.';
  if (m.includes('failed to fetch') ||
      m.includes('network'))                   return 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.';

  return 'Giriş yapılamadı. Tekrar dene.';
}

/* ---------- Demo modu (anahtarlar boşken) ---------- */

const DEMO_KEY = 'ns.demo';

function demoOturumAc()   { try { localStorage.setItem(DEMO_KEY, '1'); } catch (e) {} }
function demoOturumKapat(){ try { localStorage.removeItem(DEMO_KEY);   } catch (e) {} }
function demoOturumVar()  { try { return localStorage.getItem(DEMO_KEY) === '1'; } catch (e) { return false; } }
function demoProfil()     { return { ad: 'Demo Kullanıcı', rol: 'yonetici', aktif: true }; }
