# Template kapak görselleri

Templateler listesinde her kartın solunda çıkan laptop görselleri burada
duruyor. Kullanıcı yükleme yapmıyor; template ayarlarından bunlardan birini
**seçiyor**. Arka plan rengi görselde değil, uygulamada — ayrı seçiliyor.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `muhasebe.png` | Muhasebe ekranı |
| `stok.png` | Stok ekranı |
| `restaurant.png` | Restoran ekranı |

Adlar birebir böyle olmalı: küçük harf, Türkçe karakter yok, `.png`.

## Kurallar

1. **Şeffaf PNG** — sadece laptop, arka plan yok.
2. **1200 × 900 px** civarı, 4:3 oranında.
3. Üçünde de laptop **aynı boyutta ve aynı yerde** dursun; kartlar alt alta
   gelince zıplamasın.
4. Kenarlarda az da olsa boşluk kalsın, laptop kadraja yapışmasın.
5. Her dosya **200 KB'ın altında** olsun — uygulama açılışta indiriyor.

## Yeni görsel eklemek

Dosyayı buraya at, sonra `config.js` içindeki `KAPAK_GORSELLERI` listesine bir
satır ekle. Uygulamada başka hiçbir yere dokunmak gerekmiyor.
