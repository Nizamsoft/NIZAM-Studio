# Template kapak görselleri

Templateler listesinde her kartın solunda çıkan laptop görselleri burada
duruyor. Kullanıcı yükleme yapmıyor; template ayarlarından bunlardan birini
**seçiyor**. Arka plan rengi görselde değil, uygulamada — ayrı seçiliyor.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `muhasebe.webp` | Muhasebe ekranı |
| `stok.webp` | Stok ekranı |
| `restaurant.webp` | Restoran ekranı |

Uygulamanın okuduğu dosyalar bunlar. Yüklediğin büyük PNG'ler `kaynak/`
klasöründe duruyor — gerekirse oradan yeniden üretilir.

WebP tercih edildi çünkü aynı görsel PNG olarak 320–430 KB, WebP olarak
32–51 KB. Gözle fark yok, indirme on kat hafif.

## Kurallar

1. **Şeffaf arka plan** — sadece laptop; renk uygulamada seçiliyor.
2. **900 × 600 px** (3:2). Büyük PNG at, küçültme ve WebP'ye çevirme bizde.
3. Üçünde de laptop **aynı boyutta ve aynı yerde** dursun; kartlar alt alta
   gelince zıplamasın.
4. Kenarlarda az da olsa boşluk kalsın, laptop kadraja yapışmasın.

## Yeni görsel eklemek

Dosyayı buraya at, sonra `config.js` içindeki `KAPAK_GORSELLERI` listesine bir
satır ekle. Uygulamada başka hiçbir yere dokunmak gerekmiyor.
