# ULTRA PRO - MODÜL KÜTÜPHANESİ

Bu dizindeki modüller; istediğiniz herhangi bir HTML web sayfasına, Node.js projesine veya Electron uygulamasına "AL-YAPIŞTIR-ÇALIŞTIR" mantığıyla eklenebilmesi için birbirinden bağımsız ve izole olarak hazırlanmıştır.

## 1. `ultra-parser.js` (M3U & XTREAM Parçalama ve İndirme Motoru)

Kullanım Amacı: Verilen herhangi bir m3u formatındaki texti veya Xtream API json dosyasını alır, kanalları ayıklar, gruplandırır ve istenenleri `.m3u` dosyası olarak bilgisayara indirir.

### Nasıl Kullanılır?
HTML içine şu satırı ekleyin:
```html
<script src="modules/ultra-parser.js"></script>
```

Kullanacağınız komutlar:
```javascript
// A. Dümdüz M3U Metni Parçalamak
const veri = UltraParser.parseM3U(m3uIcerikMetni);
console.log(veri.channels); // Tüm Kanallar Arrayi
console.log(veri.groupMap); // Kategorilere ayrılmış Kanallar Objesi

// B. Seçili Kanalları Bilgisayara İndirtmek
UltraParser.exportSelectedToM3U(secilenKanallarArrayi, "BenimListem.m3u");
```

---

## 2. `ultra-engine.js` (Hibrit Video Oynatma Motoru)

Kullanım Amacı: M3U8 veya TS uzantılı IPTV yayınlarını tarayıcıda sorunsuz çalıştırmak. HLS hata verirse TS'e, TS hata verirse Native'e otomatik geçiş yapan yapay zeka destekli oynatıcıdır. Ayrıca yeni eklenen Görüntü (Renk, Parlaklık vb) ayarlama özelliğini de destekler.

### Nasıl Kullanılır?
Önce HLS.js ve MPEGTS.js kütüphanelerini, ardından modülümüzü HTML'ye ekleyin:
```html
<script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mpegts.js@1.7.3/dist/mpegts.min.js"></script>
<script src="modules/ultra-engine.js"></script>

<!-- Kullanacağınız HTML Video Etiketi -->
<video id="benim_videom" controls></video>
```

Kullanacağınız komutlar:
```javascript
// 1. Motoru elementin ID'si ile başlat
const engine = new UltraPlayerEngine("benim_videom");

// 2. Play komutunu çalıştır
engine.play("http://ornek_yayinsitesi.com/yayinim.m3u8");

// 3. Videoyu Durdurmak
engine.stop();

// 4. Renk/Görüntü Efektleri Uygulamak (Yeni Özellik!)
engine.applyFilters({
    brightness: 110,  // Parlaklık %
    contrast: 150,    // Kontrast %
    saturation: 100,  // Renk / Doygunluk %
    hue: 0            // Renk Tonu (Derece)
});

// 5. Renk ayarlarını sıfırlamak
engine.resetFilters();
```
