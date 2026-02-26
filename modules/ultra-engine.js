// ==========================================
// ULTRA PLAYER ENGINE
// Taşıyapıştır (Plug & Play) Hibrit Video Modülü
// ==========================================

// Bağımlılıklar:
// HTML içersinde çağırmanız gereken iki kütüphane: 
// <script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/mpegts.js@1.7.3/dist/mpegts.min.js"></script>

class UltraPlayerEngine {
    /**
     * @param {string} videoElementId - HTML'deki id="player" olan <video> etiketinin ID numarası.
     */
    constructor(videoElementId) {
        this.video = document.getElementById(videoElementId);
        if (!this.video) {
            throw new Error(`Belirtilen ID (${videoElementId}) ile bir video elementi bulunamadı.`);
        }
        this.hlsContext = null;
        this.tsContext = null;
        this.statusCallback = null;
    }

    /**
     * Oynatıcının durum değişikliklerini yakalayıp ekrana bastırmak için (Opsiyonel)
     * @param {Function} cb - (message: string) => void formatında geridönüş fonksiyonu
     */
    setStatusCallback(cb) {
        if (typeof cb === 'function') {
            this.statusCallback = cb;
        }
    }

    notify(msg) {
        if (this.statusCallback) this.statusCallback(msg);
        console.log(`[ULTRA_ENGINE] ${msg}`);
    }

    /**
     * Linki oynatmaya yarayan Ana Fonksiyon (Smart Loader)
     * @param {string} url - Oynatılacak yayın HTTP linki (*.m3u8, *.ts veya native dosya)
     */
    play(url) {
        if (!url || typeof url !== 'string') {
            this.notify("Uyarı: Oynatılacak bir URL bulunamadı.");
            return;
        }

        this.notify("⌛ LİNK ANALİZ EDİLİYOR...");

        // Önce Player'ı Sıfırlayalım (Çakışma Önleme)
        this.resetInternal();

        const lowerCaseUrl = url.toLowerCase();

        // Akıllı Yönlendirme
        if (lowerCaseUrl.includes(".m3u8") || lowerCaseUrl.includes("type=m3u8")) {
            this.tryHLS(url);
        } else {
            // Xtream TS formatları için ilk olarak MPEG-TS denenir.
            this.tryTS(url);
        }
    }

    /**
     * HLS (HTTP Live Streaming) Motorunu Çalıştır
     */
    tryHLS(url) {
        if (typeof Hls !== 'undefined' && Hls.isSupported()) {
            this.hlsContext = new Hls({
                manifestLoadingMaxRetry: 3,
                levelLoadingMaxRetry: 3,
                enableWorker: true
            });
            this.hlsContext.loadSource(url);
            this.hlsContext.attachMedia(this.video);

            this.hlsContext.on(Hls.Events.MANIFEST_PARSED, () => {
                this.notify("🟢 HLS MOTORU AKTİF");
                this.video.play().catch(e => console.warn("Otomatik oynatma tarayıcı tarafından engellendi."));
            });

            // HLS Başarısız olursa TS formatını deneyen özel kurtarıcı Blok
            this.hlsContext.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    this.notify("⚠️ HLS Hata Verdi, TS Motoruna Geçiliyor...");
                    this.hlsContext.destroy();
                    this.hlsContext = null;
                    this.tryTS(url);
                }
            });
        } else {
            this.notify("⚠️ HLS Desteklenmiyor, Yerel Oynatıcı Deneniyor...");
            this.video.src = url;
            this.video.play();
        }
    }

    /**
     * TS (MPEG Transport Stream) Motorunu Çalıştır
     */
    tryTS(url) {
        if (typeof mpegts !== 'undefined' && mpegts.getFeatureList().mseLivePlayback) {
            this.tsContext = mpegts.createPlayer({
                type: 'mpegts',
                url: url,
                isLive: true,
                cors: true
            });
            this.tsContext.attachMediaElement(this.video);
            this.tsContext.load();

            this.tsContext.play()
                .then(() => {
                    this.notify("🟢 TS MOTORU AKTİF");
                })
                .catch(() => {
                    this.notify("⚠️ TS Başarısız, Yerel Oynatıcı Deneniyor...");
                    this.tryNative(url);
                });

            this.tsContext.on(mpegts.Events.ERROR, () => {
                this.tryNative(url);
            });
        } else {
            this.notify("⚠️ TS Desteklenmiyor, Yerel Oynatıcı Deneniyor...");
            this.tryNative(url);
        }
    }

    /**
     * Tarayıcı Native (Sabit) Motorla Videoyu Oynatır
     */
    tryNative(url) {
        this.notify("⌛ YEREL (NATIVE) OYNATICI DENENİYOR...");
        this.video.src = url;

        this.video.play()
            .then(() => {
                this.notify("🟢 YEREL OYNATICI AKTİF");
            })
            .catch(() => {
                this.notify("❌ YAYIN KAYNAĞI BAĞLANTI HATASI! (Oynatılamıyor)");
            });
    }

    /**
     * Oynatıcıyı güvenli bir şekilde kapatır ve Hafıza Kaçağı (Memory Leak) temizliği yapar.
     */
    resetInternal() {
        if (this.hlsContext) {
            this.hlsContext.destroy();
            this.hlsContext = null;
        }

        if (this.tsContext) {
            this.tsContext.destroy();
            this.tsContext = null;
        }

        if (this.video) {
            this.video.pause();
            this.video.removeAttribute('src'); // Kaynağı boşaltır
            this.video.load();                 // Video Buffer'ı temizler
        }
    }

    /**
     * Dışarıdan tetiklenecek olan durdurma/sıfırlama butonu için komut.
     */
    stop() {
        this.resetInternal();
        this.notify("⏹ YAYIN DURDURULDU");
    }

    /**
     * Ek Özellikler: Görüntü Ayarlarını Düzenleme
     * @param {Object} props - { brightness: 100, contrast: 100, saturation: 100, hue: 0 }
     */
    applyFilters(props = {}) {
        const b = props.brightness ?? 100;
        const c = props.contrast ?? 100;
        const s = props.saturation ?? 100;
        const h = props.hue ?? 0;

        if (this.video) {
            this.video.style.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) hue-rotate(${h}deg)`;
        }
    }

    /**
     * Görüntü ayarlarını varsayılan orjinal(100) haline sıkıntısız getirir.
     */
    resetFilters() {
        if (this.video) {
            this.video.style.filter = "none";
        }
    }
}

// Modül Desteği Dışa Aktarımı
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UltraPlayerEngine;
} else if (typeof window !== 'undefined') {
    window.UltraPlayerEngine = UltraPlayerEngine;
}
