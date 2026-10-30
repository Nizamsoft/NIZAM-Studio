# İş kaydı kuralı — claude.ai hesap tercihlerine yapıştırılır

Bu metin **claude.ai → Ayarlar → Profil → "Claude hangi tercihleri dikkate
almalı?"** kutusuna (mevcut tercihlerin altına) yapıştırılır. Böylece hesapta
hangi depoda çalışılırsa çalışılsın geçerli olur. Kayıtlar Studio'da
Panel › Son Hareketler'de görünür.

Ön koşullar (tek sefer):
1. Supabase'de `sql/52-is-kayitlari.sql` çalıştırılmış olmalı.
2. `supabase/functions/is-kaydi` fonksiyonu kurulmuş olmalı (dosyanın başında adımlar).
3. Claude Code ortamlarının ağ ayarında `whkjkaxsojkdwcehgiwj.supabase.co`
   "Allowed domains" listesine eklenmiş olmalı.

Yapıştırmadan önce `<ERISIM_KODU>` yerine `config.js` içindeki
`RAPOR.anahtar` değerini yaz (hata bildirimlerinin kullandığı kodun aynısı).

Aşağıdaki çizginin altını kopyala:

---

İŞ KAYDI (NIZAM Studio): Bu hesabı birden çok kişi kullanıyor.
1. Oturumun ilk mesajında kullanıcı adını yazmadıysa, bir dosyayı değiştirmeden önce bir kez "Adın ne?" diye sor. Cevabı bütün oturum boyunca kullan.
2. Bir iş bitip değişiklik GitHub'a gönderildiğinde (push), aynı turda Studio'ya tek satır iş kaydı gönder. Hiçbir dosya değişmediyse (yalnız soru, plan, inceleme) kayıt gönderme.
3. Gönderme komutu:
curl -sS -m 15 -X POST https://whkjkaxsojkdwcehgiwj.supabase.co/functions/v1/is-kaydi -H "Content-Type: application/json" -H "x-rapor-anahtari: <ERISIM_KODU>" -d '<JSON>'
JSON alanları: "kullanici" (adı soyadı), "program" (depodaki CLAUDE.md/NIZAM.md'deki firma ya da ürün adı; NIZAM-Studio deposu için "Studio"), "is" (geçmiş zamanlı tek cümle, en çok 80 karakter, teknik terim yok, kullanıcının adı yok; örnek: "Alt menüyü yüzen, hafif saydam bir hap yaptı"), "detay" (2-5 kısa madde, sade Türkçe: ne değişti, neden), "repo" (sahip/depo), "commit" (son commit'in kısa kimliği), "oturum" (biliniyorsa Claude oturum adresi).
4. Gönderim başarısız olursa kullanıcıya bir kez kısaca söyle (çoğu zaman sebep: ortamın ağ ayarında whkjkaxsojkdwcehgiwj.supabase.co izinli değil), işi durdurma.
