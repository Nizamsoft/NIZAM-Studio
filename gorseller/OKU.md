# gorseller/ — uygulamanın bütün görselleri burada

Bu klasör **tek klasör** olarak tutuluyor: ChatGPT'den çıkan her PNG doğrudan
buraya atılır, alt klasör açmaya gerek yok. Dosya adları aşağıdaki listeyle
**birebir aynı** olmalı — kod dosyayı adıyla arıyor.

Kural: PNG yoksa uygulama çökmez, o görselin yerine sade bir zemin çıkar.
Yani görselleri sırayla ekleyebilirsin, acelesi yok.

---

## 1. öncelik — tema ve Panel için gerekli

| Dosya adı | Ne? | Ölçü |
|---|---|---|
| `panel-ofis.png` | Panel'in tepesindeki geniş ofis fotoğrafı | 2400 × 1400 |
| `giris-ofis.png` | Giriş ekranının zemini (dikey) | 1600 × 2400 |
| `kagit-doku.png` | Kağıt dokusu, döşenebilir, saydam zeminli | 800 × 800 |

## 2. öncelik — sayfa kuşakları (her sayfanın tepesindeki ince şerit)

| Dosya adı | Sayfa | Ölçü |
|---|---|---|
| `kusak-projeler.png` | Projeler | 2400 × 600 |
| `kusak-gorevler.png` | Görevler | 2400 × 600 |
| `kusak-ekip.png` | Ekip | 2400 × 600 |
| `kusak-standartlar.png` | Nizam Standartları | 2400 × 600 |
| `kusak-ayarlar.png` | Ayarlar | 2400 × 600 |

## 3. öncelik — boş durum çizimleri (liste boşken çıkan resim)

| Dosya adı | Nerede | Ölçü |
|---|---|---|
| `bos-projeler.png` | Hiç proje yokken | 1200 × 900 |
| `bos-gorevler.png` | Açık iş yokken | 1200 × 900 |
| `bos-ekip.png` | Ekip boşken | 1200 × 900 |
| `bos-standartlar.png` | Standart yokken | 1200 × 900 |
| `bos-sablonlar.png` | Şablon yokken | 1200 × 900 |

Hepsi **saydam zeminli PNG** olacak (kağıt rengi görselin içine gömülmesin).

---

## Ortak görsel dil — her promptun sonuna ekle

> Editoryal, sakin, kağıt hissinde. Sıcak kırık beyaz (#F2EFE9) ve mürekkep
> siyahı (#14120F) hâkim; tek vurgu rengi Nizam kırmızısı (#E5342A) ve yalnız
> çok küçük bir alanda görünüyor. Parlak, neon, degradeli, çizgi film gibi
> hiçbir şey yok. Yazılım/danışmanlık dünyasına ait; bitki, yaprak, wellness,
> maskot, stok fotoğraf klişesi yok.

## Sonradan istersek

`serif.woff2` — başlıklar için Playfair Display benzeri bir serif yazı tipi.
Konursa başlıklar otomatik ona geçer; yoksa sistemin Georgia'sı kullanılır.
