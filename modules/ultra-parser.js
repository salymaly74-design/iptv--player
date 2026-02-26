// ==========================================
// ULTRA PARSER MODULE (M3U & Xtream)
// Taşıyapıştır (Plug & Play) Modülü
// ==========================================

const UltraParser = {
    // Grupları sıralarken öncelik verilecek kelimeler
    priority: ["ULUSAL", "YERLI", "YERLİ", "TR", "TÜRK", "TURK", "SPOR", "BELGESEL"],

    /**
     * Ham (Raw) M3U içeriğini parse eder ve JS Objesine dönüştürür.
     * @param {string} text - İndirilen ham m3u listesi
     * @returns {Object} { channels: [...], groupMap: {...} } 
     */
    parseM3U(text) {
        const channels = [];
        const groupMap = {};
        let name = "KANAL", group = "GENEL";

        text.split("\n").forEach(line => {
            line = line.trim();
            if (line.startsWith("#EXTINF")) {
                const parts = line.split(",");
                name = parts.pop().trim();
                const groupMatch = line.match(/group-title="(.*?)"/i);
                group = groupMatch ? groupMatch[1].toUpperCase() : "GENEL";
            } else if (line.startsWith("http")) {
                const channelObj = { name, group, url: line };
                channels.push(channelObj);

                if (!groupMap[group]) groupMap[group] = [];
                groupMap[group].push(channelObj);
            }
        });

        return { channels, groupMap };
    },

    /**
     * Xtream API Canlı Yayın/Kategori Verisini M3U formatındaki gibi JS Objesine dönüştürür
     * @param {Array} streams - get_live_streams işleminden dönen dizi
     * @param {Array} categories - get_live_categories işleminden dönen dizi
     * @param {string} server - Sunucu ana URL (örn: http://server.com:8080)
     * @param {string} user - XTream Kullanıcı Adı
     * @param {string} pass - XTream Şifre
     * @returns {Object} { channels: [...], groupMap: {...} } 
     */
    parseXtream(streams, categories, server, user, pass) {
        const groupMap = {};
        const catMap = {};
        const channels = [];

        // Önce Kategorileri Hash Map'a Atalım (Performans İçin)
        if (Array.isArray(categories)) {
            categories.forEach(c => catMap[c.category_id] = c.category_name);
        }

        if (Array.isArray(streams)) {
            streams.forEach(s => {
                const groupName = catMap[s.category_id] || "DİĞER";
                const streamLink = `${server}/live/${user}/${pass}/${s.stream_id}.ts`;

                const channelObj = { name: s.name, group: groupName, url: streamLink };
                channels.push(channelObj);

                if (!groupMap[groupName]) groupMap[groupName] = [];
                groupMap[groupName].push(channelObj);
            });
        }

        return { channels, groupMap };
    },

    /**
     * Kategorileri önem/tür bazında mantıksal olarak sıralar. (Priority mantığına göre)
     * @param {Object} groupMap - Gruplanmış kanallar sözlüğü/objesi
     * @returns {Array} Sıralanmış kategori isimleri dizisi
     */
    getSortedGroups(groupMap) {
        return Object.keys(groupMap).sort((a, b) => {
            const A = a.toUpperCase();
            const B = b.toUpperCase();

            let idxA = this.priority.findIndex(p => A.includes(p));
            let idxB = this.priority.findIndex(p => B.includes(p));

            if (idxA === -1) idxA = 999;
            if (idxB === -1) idxB = 999;
            if (idxA !== idxB) return idxA - idxB;

            return A.localeCompare(B);
        });
    },

    /**
     * İşaretlenen (seçili) kanalları alır ve tarayıcı üzerinde .m3u dosyası olarak indirtir.
     * @param {Array} selectedChannels - {group, name, url} içeren objeler dizisi
     * @param {string} exportedFileName - İndirilecek dosyanın adı (örn: "KendiListem.m3u")
     */
    exportSelectedToM3U(selectedChannels, exportedFileName = "Ultra_Export.m3u") {
        if (!selectedChannels || selectedChannels.length === 0) {
            console.warn("Dışa aktarılacak seçili kanal yok.");
            return false;
        }

        let m3uContent = "#EXTM3U\n";
        selectedChannels.forEach(ch => {
            m3uContent += `#EXTINF:-1 group-title="${ch.group}",${ch.name}\n${ch.url}\n`;
        });

        const blob = new Blob([m3uContent], { type: "text/plain" });
        const linkElem = document.createElement("a");
        linkElem.href = URL.createObjectURL(blob);
        linkElem.download = exportedFileName;
        document.body.appendChild(linkElem);
        linkElem.click();
        document.body.removeChild(linkElem);
        URL.revokeObjectURL(linkElem.href);
        return true; // Başarılı
    }
};

// Modül Desteği: Sadece HTML içerisinde değil, Node.js veya Electron üzerinde Require ile de çağırılabilir.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UltraParser;
} else if (typeof window !== 'undefined') {
    window.UltraParser = UltraParser;
}
