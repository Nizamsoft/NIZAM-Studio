# İş kaydı kuralı — claude.ai hesap tercihlerine yapıştırılır

Bu metin **claude.ai → Ayarlar → Profil → tercihler** kutusuna, mevcut
yazıların altına yapıştırılır. Hesaptaki her Claude Code sohbetinde (hangi
depoda çalışılırsa çalışılsın) geçerli olur. Kayıtlar Studio'da
Panel › Son Hareketler › Claude'da görünür.

Ön koşullar (tek sefer):
1. Studio'nun Supabase'inde `sql/54-is-kaydi-kapisi.sql` çalıştırılır.
2. Aynı dosyanın sonundaki ANAHTAR sorgusu çalıştırılır; çıkan anahtar
   aşağıdaki metinde `<ANAHTAR>` yerine yazılır.
3. Claude Code ortamlarının ağ ayarında (Network access → Allowed domains)
   `whkjkaxsojkdwcehgiwj.supabase.co` eklenir. Her ortamda bir kez.

Not: Kayıt yalnız Claude Code sohbetlerinden gönderilebilir (komut
çalıştırabildikleri için). claude.ai'daki düz sohbetler gönderemez.

Aşağıdaki çizginin altını kopyala:

---

İŞ KAYDI (NIZAM Studio): Bu hesabı birden çok kişi kullanıyor.
1. Sohbetin ilk mesajında kişi adını söylemediyse, bir dosyayı değiştirmeden önce bir kez "Adın ne?" diye sor ve bütün sohbet boyunca o adı kullan.
2. Bir İŞ bittiğinde Studio'ya tek satır iş kaydı gönder. İş: kod GitHub'a gönderildi (push); ya da SQL, belge (Word/PDF), görsel gibi bir dosya hazırlandı; ya da bir hata bulunup çözüldü. Yalnız soru-cevap, fikir alışverişi, plan veya inceleme için gönderme. Her mesaj için değil, iş başına bir kayıt.
3. Gönderme komutu (bash):
curl -sS -m 15 -X POST "https://whkjkaxsojkdwcehgiwj.supabase.co/rest/v1/rpc/is_kaydi_yaz" -H "apikey: sb_publishable_6qCgu1aJCmK9inF5xmaopg_PayG8KDP" -H "Content-Type: application/json" -d '{"p_anahtar":"<ANAHTAR>","p_kullanici":"…","p_program":"…","p_is":"…","p_detay":"…","p_uretilen":"…","p_repo":"…","p_commit":"…","p_oturum":"…"}'
Alanlar: p_kullanici = kişinin adı soyadı · p_program = depodaki CLAUDE.md/NIZAM.md'de yazan firma ya da ürün adı (NIZAM-Studio için "Studio"; depo yoksa işin ilgili olduğu firma) · p_is = geçmiş zamanlı tek cümle, en çok 80 karakter, teknik terim yok, kişinin adı yok (örnek: "Kübban'da yapılacaklar listesindeki izin hatasını düzeltti") · p_detay = 2-5 kısa madde, sade Türkçe; müşteri kişisel bilgisi, şifre, anahtar YAZMA · p_uretilen = üretilen dosyalar (örnek: "GK-32 SQL dosyası, Kurulum.docx"), yoksa boş · p_repo = sahip/depo, yoksa boş · p_commit = son commit'in kısa kimliği, yoksa boş · p_oturum = biliniyorsa bu sohbetin claude.ai adresi.
4. Gönderim başarısız olursa kişiye bir kez kısaca söyle (çoğu zaman sebep: ortamın ağ ayarında whkjkaxsojkdwcehgiwj.supabase.co izinli değil) ve işi durdurma.
