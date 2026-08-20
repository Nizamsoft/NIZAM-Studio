# NIZAM | Studio

Nizam Soft'un yazılım üretim yönetim sistemi.

Müşteri talebini → yapılandırılmış göreve → AI promptuna → koda → sürüme çeviren,
bağlamı kendisi taşıyan bir iç araç.

> Bu bir no-code app builder değil. Üretim **sürecini** yönetir.

## Ne yapar

- Müşteri projelerini `Proje → Modül → Sayfa → Görev` düzeninde tutar
- Her iş için bağlamı dolu, hazır bir AI geliştirme promptu üretir
- Ekipte kimin ne yaptığını, neyin geciktiğini gösterir
- GitHub'daki gerçek durumu okuyup görevleri kendiliğinden ilerletir
- Sürüm notlarını tamamlanan görevlerden otomatik yazar

## Teknoloji

Vanilla JS SPA · Supabase · PWA — kurulum, paket ve derleme gerektirmez.

## Yerelde çalıştırma

```bash
python3 -m http.server 8080
# tarayıcıda: http://localhost:8080
```

## Durum

| Aşama | İçerik | Durum |
|---|---|---|
| Adım 0 | İskelet, tema, açılış, menü | ✅ |
| Adım 1 | Supabase kurulumu ve giriş | ✅ |
| Adım 2 | Projeler, modül ve sayfa ağacı | — |
| Adım 3 | Görevler, durumlar, atama | — |
| Adım 4 | Prompt motoru ve kimlik dosyası | — |
| Adım 5 | GitHub okuma ve sürüm notları | — |

Proje kuralları ve mimari kararlar: [CLAUDE.md](CLAUDE.md)
