# NIZAM | Studio — Proje Kuralları

## ⛔ EN ÖNEMLİ KURAL: Onaysız kod YOK
- Kod yazmadan ÖNCE ne yapacağımı **çok basit ve kısa** anlat.
- Kullanıcı **açıkça "onaylıyorum / tamam / yap / başla"** demeden **kod yazma, dosya değiştirme, commit/push yapma.**
- Emin değilsen sor. Varsayımla ilerleme.
- Tasarım değişikliklerinde önce mockup görseli sun.

## Nasıl konuşulacak
- **Sade ve anlaşılır konuş.** Gündelik dil kullan, teknik terimden kaçın.
  Terim şartsa yanına tek cümle açıklama koy.
- **Emoji kullan.** Samimi bir ton, kuru rapor değil.
- **Kısa yaz.** Varsayılan: birkaç cümle. Uzun anlatım isteniyorsa kullanıcı ister.
- Yaptığın işi madde madde döküp anlatma. Ne değişti, tek satır.
- Gerekçe sorulmadıkça gerekçe yazma.
- Tablo ve liste ancak gerçekten karşılaştırma varsa.
- Sorular tek seferde ve toplu sorulur.
- Adım adım bir iş anlatıyorsan **numaralı ve tek satırlık** yaz;
  her adımın altına paragraf açma.

## Kullanım uyarısı
İstenen iş çok kullanım yiyecekse **başlamadan önce söyle** ve daha ucuz
bir yol öner. Kullanıcı kotasını görmüyor; sonradan "bu pahalıydı" demek
geç oluyor.

Pahalı olan işler: çok sayıda ekran görüntüsü, birkaç mockup, binlerce
satırlık dosyayı baştan yazmak, aynı işi birden çok kez denemek, uzun
oturumu daha da uzatmak.

Şöyle söyle: *"Bu şu kadar iş — istersen şöyle daha ucuz yaparız."*
Sonra kullanıcı seçsin. Kendi başına ucuz olanı seçip işi kırpma.

## Proje nedir
Nizam Soft'un müşteriye özel yazılım üretme sürecini yöneten iç sistem.
Müşteri talebi → yapılandırılmış görev → AI promptu → kod → test → sürüm.

**Bu bir no-code app builder DEĞİL.** Süreç yönetim sistemi.

## Teknoloji
- Vanilla JS SPA — derleme yok, paket yok
- Supabase (veri + giriş + realtime + dosya) — *Adım 1'de bağlanacak*
- PWA — mobil ve masaüstü
- Dal: `main`

## Hiyerarşi
```
Proje → Modül → Sayfa → Görev
```
Kaçış kapısı: görev sayfaya bağlanamıyorsa modüle veya doğrudan projeye bağlanır.
Her projede otomatik bir **Proje Geneli** kovası bulunur.

## Görev durumları (4 tane, artırma)
```
Yapılacak → Geliştiriliyor → Kontrolde → Tamamlandı
```
- "Kontrolde" = yöneticinin (Nizam) onayını bekliyor. Müşteri sisteme girmez.
- Revize ayrı durum değil: Kontrolde'den Geliştiriliyor'a geri düşme + not.

## İlerleme yüzdesi
**Asla elle girilmez.** Her zaman hesaplanır: bitmiş görev / toplam görev.

## Roller (2 tane)
- **Yönetici** — her şeyi görür, onaylar
- **Geliştirici** — sadece kendine atananları görür

## Görev numarası
`NS-142` biçiminde. Prompt, AI'a commit mesajının başına `[NS-142]` yazmasını söyler.
Studio bu etiketi GitHub'da arayarak görevi kendiliğinden "Kontrolde"ye çeker.

## Proje Kimlik Dosyası
Her müşteri reposunun içinde Studio'nun ürettiği bir kimlik dosyası bulunur.
- AI'ın bağlam kaynağıdır (hangi kapıdan girerse girsin bulur)
- Studio'nun doğruluk kaynağıdır (sayfaların mevcut özellikleri buradan okunur)
- AI her işten sonra bu dosyayı güncellemekle yükümlüdür

## Akış
```
Studio görev + prompt üretir
   → geliştirici promptu kopyalar
   → Claude Code (web) reposunu açıp yapıştırır
   → Claude kodu yazar, kimlik dosyasını günceller, GitHub'a gönderir
   → Studio [NS-x] etiketini görür, görevi Kontrolde'ye çeker
   → Nizam onaylar → sürüm notuna yazılır → yüzde güncellenir
```

## Tasarım dili
**Beyaz, gri, kırmızı.** Üçü de logodan geliyor; dördüncü renk yok.
Editoryal düzen: serif başlık, ince çizgi, gölgesiz kart.

| Rol | Renk |
|---|---|
| Zemin | `#ffffff` — krem/kağıt değil, düz beyaz |
| Kart | `#ffffff` (zeminden çizgiyle ayrılır) |
| Gri yüzey (ikon kutusu, yuva) | `#f2f2f4` · `#f6f6f8` |
| Çizgi | `#ededf0` → `#d6d6db` |
| Metin | `#26262a` / soft `#56565c` / silik `#9a9aa2` |
| Grafit (logonun metali) | `#4a4a50` |
| Kırmızı (dolgu) | `#e5342a` |
| Kırmızı (yazı) | `#b4231b` — beyaz üstünde `#e5342a` okunmuyor |

**Kırmızı sadece:** logo, ana buton, aktif menü, kart üst şeridi, "Acil".
İkon kutuları **gri**, kırmızı tintli değil. İlerleme çubukları nötr.
Sıcak ton (krem, altın, kağıt dokusu) kullanma — denendi, paletin dışında
kalıyor.

Kurallar:
- **Gölge yok.** Kart zeminden ince çizgiyle ayrılır. Gölge yalnız gerçekten
  yüzen şeyde (pencere, açılır menü) ve orada da çok yumuşak.
- **Cam parıltısı yok.** Koyu temadan kalan beyaz ışık huzmeleri kapatıldı
  (style.css sonundaki editoryal katman).
- **Köşeler ölçülü:** 8px. Hap biçimi yalnız rozet ve avatar.
- Fotoğraf sınırlı bir blok olarak kullanılır, sayfanın zemini olarak değil.

Yazı tipleri: başlık **serif** (`--yazi-baslik`, Georgia ailesi) ·
etiket/sayı **Space Grotesk** (`--yazi-etiket`) · gövde sistem sans ·
kod monospace.
Durum renkleri (beyaz zeminde): Yapılacak `#83838b` · Geliştiriliyor `#b8801a` ·
Kontrolde `#2f62c4` · Tamamlandı `#2f7d5c`.

Görseller **tek klasörde**: `gorseller/`. Dosya adları sabit, kod adıyla arar;
dosya yoksa uygulama sade bir zemine düşer, çökmez. Liste: `gorseller/OKU.md`.

## Ekran kontrolü (görünüşü değiştiren her işte)
Tasarım değişikliği **iki ekran boyunda** denenir, tek boyda değil:
- **390 × 700** (kısa telefon) — alt çubuğun altında içerik kalmamalı,
  sayfa kaydırılabilmeli. Çoğu hata burada çıkıyor.
- **1440 × 900** (masaüstü) — yan menü ve geniş ızgara.

Kaydırma kapalıysa (`overflow: hidden`) içerik sığmadığı anda ulaşılamaz
hâle gelir; panelde tam bu oldu. Sığmıyorsa kaydırmayı aç, kırpma.

## Her değişiklikte yapılacaklar
1. `config.js` içindeki `APP.version` güncelle
2. `CHANGELOG.md` — en yeni üstte
3. `index.html` içindeki `?v=` numaralarını güncelle
4. `sw.js` içindeki `CACHE` adını güncelle
5. commit → push (`main`)

## İstenmeyenler
- Aşırı teknik görünüm · GitHub kopyası · Jira karmaşıklığı
- Uzun formlar · kullanıcıya prompt yazdırmak
- Güncellemeleri tek karmaşık listede tutmak
- AI'ın bağlamını her seferinde kullanıcıya tekrar yazdırmak
