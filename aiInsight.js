// aiInsight.js
window.AIInsight = {
    _anomalyNarasiCache: null,
    _anomalyNarasiPending: false,
    async callGroqAPI(promptText) {
        const response = await fetch('groq-proxy.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptText })
        });
        const data = await response.json();
        if (data.error) {
            let errorMsg = data.error;
            if (data.raw && data.raw.error && data.raw.error.message) {
                errorMsg += ": " + data.raw.error.message;
            }
            throw new Error(errorMsg);
        }
        return data.result;
    },

    getPageContext(pageId, dataArray) {
        const totalSales = dataArray.reduce((sum, d) => sum + d.Sales, 0);
        const totalProfit = dataArray.reduce((sum, d) => sum + d.Profit, 0);
        const margin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0;

        if (pageId === 'page-1') {
            // Overview: monthly trend, subcategory
            const monthMap = {};
            dataArray.forEach(d => {
                if (!d.OrderDateParsed || isNaN(d.OrderDateParsed)) return;
                const key = d.OrderDateParsed.toISOString().substring(0, 7);
                monthMap[key] = (monthMap[key] || 0) + d.Sales;
            });
            const months = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0]));
            const bestMonth = months.length ? months.reduce((a, b) => b[1] > a[1] ? b : a) : ['N/A', 0];
            const subCatMap = {};
            dataArray.forEach(d => {
                if (d.SubCategory) subCatMap[d.SubCategory] = (subCatMap[d.SubCategory] || 0) + d.Sales;
            });
            const topSubCat = Object.entries(subCatMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]).join(', ');
            return {
                topic: 'ringkasan performa bisnis keseluruhan (Overview)',
                data: `Total Penjualan: Rp ${(totalSales/1000000).toFixed(1)}Jt, Total Profit: Rp ${(totalProfit/1000000).toFixed(1)}Jt, Profit Margin: ${margin}%, Bulan Terbaik: ${bestMonth[0]} (Rp ${(bestMonth[1]/1000000).toFixed(1)}Jt), Sub-Kategori Terlaris: ${topSubCat}.`
            };

        } else if (pageId === 'page-2') {
            // Product Performance: products by profit, discount impact
            const prodProfitMap = {};
            const prodSalesMap = {};
            dataArray.forEach(d => {
                if (!d.ProductName) return;
                prodProfitMap[d.ProductName] = (prodProfitMap[d.ProductName] || 0) + d.Profit;
                prodSalesMap[d.ProductName] = (prodSalesMap[d.ProductName] || 0) + d.Sales;
            });
            const sortedByProfit = Object.entries(prodProfitMap).sort((a, b) => b[1] - a[1]);
            const top3Profit = sortedByProfit.slice(0, 3).map(([n, v]) => `${n.substring(0,20)} (Rp ${(v/1000000).toFixed(1)}Jt)`).join('; ');
            const bottom3Profit = sortedByProfit.slice(-3).reverse().map(([n, v]) => `${n.substring(0,20)} (Rp ${(v/1000).toFixed(0)}rb)`).join('; ');
            const catMap = {};
            dataArray.forEach(d => {
                if (d.Category) catMap[d.Category] = (catMap[d.Category] || 0) + d.Sales;
            });
            const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([n, v]) => `${n}: Rp ${(v/1000000).toFixed(1)}Jt`).join('; ');
            const avgDiscount = dataArray.length > 0 ? (dataArray.reduce((s, d) => s + d.Discount, 0) / dataArray.length * 100).toFixed(1) : 0;
            return {
                topic: 'performa produk (Product Performance) - analisis profitabilitas produk, dampak diskon, dan distribusi kategori',
                data: `3 Produk Profit Tertinggi: ${top3Profit}. 3 Produk Rugi Terbesar: ${bottom3Profit}. Distribusi Kategori: ${topCat}. Rata-rata Diskon: ${avgDiscount}%. Profit Margin Keseluruhan: ${margin}%.`
            };

        } else if (pageId === 'page-3') {
            // Customer Insights: top customers, segments
            const custMap = {};
            dataArray.forEach(d => {
                if (!d.CustomerName) return;
                if (!custMap[d.CustomerName]) custMap[d.CustomerName] = { sales: 0, profit: 0, txn: 0 };
                custMap[d.CustomerName].sales += d.Sales;
                custMap[d.CustomerName].profit += d.Profit;
                custMap[d.CustomerName].txn += 1;
            });
            const topCust = Object.entries(custMap).sort((a, b) => b[1].sales - a[1].sales).slice(0, 3)
                .map(([n, v]) => `${n} (Sales: Rp ${(v.sales/1000000).toFixed(1)}Jt, ${v.txn} transaksi)`).join('; ');
            const segMap = {};
            dataArray.forEach(d => {
                if (d.Segment) segMap[d.Segment] = (segMap[d.Segment] || 0) + d.Sales;
            });
            const segBreakdown = Object.entries(segMap).sort((a, b) => b[1] - a[1])
                .map(([n, v]) => `${n}: Rp ${(v/1000000).toFixed(1)}Jt`).join('; ');
            const totalCust = Object.keys(custMap).length;
            return {
                topic: 'Customer Insights - analisis pelanggan terbaik, segmentasi pelanggan, dan loyalitas',
                data: `Total Pelanggan Unik: ${totalCust}. 3 Pelanggan Teratas (by Sales): ${topCust}. Distribusi Segmen: ${segBreakdown}. Total Penjualan: Rp ${(totalSales/1000000).toFixed(1)}Jt.`
            };

        } else if (pageId === 'page-4') {
            // Regional Mapping: provinces, regions
            const provMap = {};
            const regMap = {};
            dataArray.forEach(d => {
                const prov = d.Province || 'Unknown';
                const reg = d.Region || 'Unknown';
                provMap[prov] = (provMap[prov] || 0) + d.Sales;
                regMap[reg] = (regMap[reg] || 0) + d.Sales;
            });
            const top5Prov = Object.entries(provMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
                .map(([n, v]) => `${n}: Rp ${(v/1000000).toFixed(1)}Jt`).join('; ');
            const topReg = Object.entries(regMap).sort((a, b) => b[1] - a[1])
                .map(([n, v]) => `${n}: Rp ${(v/1000000).toFixed(1)}Jt`).join('; ');
            return {
                topic: 'Regional Mapping - analisis penjualan per wilayah/provinsi, kekuatan geografis, dan potensi ekspansi regional',
                data: `Top 5 Provinsi: ${top5Prov}. Distribusi Regional: ${topReg}. Total Penjualan Nasional: Rp ${(totalSales/1000000).toFixed(1)}Jt, Profit Margin: ${margin}%.`
            };
        }

        return {
            topic: 'performa bisnis',
            data: `Total Penjualan: Rp ${(totalSales/1000000).toFixed(1)}Jt, Profit: Rp ${(totalProfit/1000000).toFixed(1)}Jt, Margin: ${margin}%.`
        };
    },

    async generatePageInsight(pageId, dataArray) {
        const insightBox = document.getElementById(`insight-${pageId}`);
        if (!insightBox) return;

        if (dataArray.length === 0) {
            insightBox.innerHTML = "No data available for insights.";
            return;
        }

        const ctx = this.getPageContext(pageId, dataArray);
        const promptContext = `Kamu adalah analis bisnis senior. Halaman yang sedang dianalisis: "${ctx.topic}".
Data aktual:
${ctx.data}

Tugasmu: Berikan TEPAT 3 item analisis dengan komposisi:
1. Satu "insight" (temuan kunci paling penting dari data)
2. Satu "insight" (temuan kunci kedua yang berbeda dari yang pertama)
3. Satu "rekomendasi" (langkah aksi konkret yang bisa langsung dilakukan manajemen)

Output WAJIB berupa raw JSON array of 3 objects. Setiap object wajib punya kunci:
- "type": isi dengan string "insight" atau "rekomendasi"
- "title": judul singkat max 5 kata (relevan topik halaman ini)
- "desc": isi konkret max 25 kata, sebut angka dari data jika ada

DILARANG menulis kalimat pembuka/penutup. DILARANG memakai markdown. OUTPUT HANYA JSON ARRAY.`;

        insightBox.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Analyzing data...</div>';

        try {
            let result = await this.callGroqAPI(promptContext);
            result = result.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            result = result.replace(/```json/gi, '').replace(/```/g, '').trim();
            
            const match = result.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (match) result = match[0];
            
            // Bersihkan karakter kontrol yang bisa merusak JSON.parse
            result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
            
            let parsedData;
            try {
                parsedData = JSON.parse(result);
            } catch (parseErr) {
                // Fallback: coba perbaiki kutip tunggal -> kutip ganda
                const fixed = result.replace(/'/g, '"').replace(/(\w)"(\w)/g, "$1'$2");
                parsedData = JSON.parse(fixed);
            }

            
            const boxesHtml = parsedData.map(item => {
                const isRec = item.type === 'rekomendasi';
                const accentColor = isRec ? '#10b981' : '#fbbf24';
                const icon = isRec ? 'fa-lightbulb' : 'fa-bolt';
                const label = isRec ? 'Rekomendasi' : 'Insight';
                return `
                <div class="glass-card" style="padding: 12px 16px; margin-bottom: 12px; border-left: 3px solid ${accentColor};">
                    <span style="font-size: 0.75rem; font-weight: 700; color: ${accentColor}; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid ${icon}"></i>${label}: ${item.title}
                    </span>
                    <p style="font-size: 0.875rem; margin-top: 6px; line-height: 1.5; color: #f8fafc;">
                        ${item.desc}
                    </p>
                </div>`;
            }).join('');
            
            insightBox.innerHTML = boxesHtml;
        } catch (error) {
            console.error('Groq API Error:', error);
            if(window.StoryEngine) {
                const localStory = window.StoryEngine.generateStory(dataArray, pageId);
                const boxesHtml = localStory.map((item) => {
                    const isRec = item.type === 'rekomendasi';
                    const accentColor = isRec ? '#10b981' : '#fbbf24';
                    const icon = isRec ? 'fa-lightbulb' : 'fa-bolt';
                    const label = isRec ? 'Rekomendasi' : 'Insight';
                    return `
                    <div class="glass-card" style="padding: 12px 16px; margin-bottom: 12px; border-left: 3px solid ${accentColor};">
                        <span style="font-size: 0.75rem; font-weight: 700; color: ${accentColor}; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                            <i class="fa-solid ${icon}"></i>${label}: ${item.title}
                        </span>
                        <p style="font-size: 0.875rem; margin-top: 6px; line-height: 1.5; color: #f8fafc;">${item.desc}</p>
                    </div>`;
                }).join('');
                insightBox.innerHTML = boxesHtml;
            } else {
                insightBox.innerHTML = `<div class="insight-item-box">Failed to load AI insights. ${error.message}</div>`;
            }
        }
    },

    async generatePageStory(pageId, dataArray) {
        const storyBox = document.getElementById(`story-${pageId}`);
        if (!storyBox) return;

        if (dataArray.length === 0) {
            storyBox.classList.add('hidden');
            return;
        }

        // Tampilkan box
        storyBox.classList.remove('hidden');
        storyBox.innerHTML = '<p class="story-text"><i class="fa-solid fa-spinner fa-spin"></i> Memuat narasi cerdas AI...</p>';

        const ctx = this.getPageContext(pageId, dataArray);
        const promptContext = `Kamu adalah analis bisnis senior yang sedang menceritakan temuan dari halaman "${ctx.topic}".
Data aktual:
${ctx.data}

Tulis narasi storytelling SINGKAT (2-3 kalimat) dalam Bahasa Indonesia yang elegan dan profesional.
Narasi HARUS berfokus pada topik "${ctx.topic}" dan menyebut angka-angka konkret dari data di atas.
Jangan pakai format list/poin. Langsung berupa paragraf naratif.
PERINGATAN KERAS: JANGAN TULIS PROSES BERPIKIR. Jangan tulis kata pengantar seperti "Tentu" atau "Baiklah". Langsung cerita.`;

        try {
            let result = await this.callGroqAPI(promptContext);
            result = result.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            // Hapus kata pengantar jika masih ada
            result = result.replace(/^(Tentu|Baiklah|Berikut|Okay|Sure|Certainly)[^.!?]*[.!?]\s*/i, '').trim();
            
            storyBox.innerHTML = `<p class="story-text">${result.replace(/\n/g, '<br>')}</p>`;
        } catch (error) {
            console.error('Story API Error:', error);
            // Fallback ke narasi lokal yang sudah dibuat dari data riil
            if (window.StoryEngine && window.StoryEngine.generateLocalNarrative) {
                const localNarrative = window.StoryEngine.generateLocalNarrative(dataArray, pageId);
                storyBox.innerHTML = `<p class="story-text">${localNarrative}</p>`;
            } else {
                storyBox.classList.add('hidden');
            }
        }
    },

    async handleInPageChat(pageId) {
        const inputEl = document.getElementById(`chat-input-${pageId}`);
        const logEl = document.getElementById(`chat-log-${pageId}`);
        const text = inputEl.value.trim();
        if(!text) return;

        inputEl.value = '';
        logEl.innerHTML += `<div class="chat-message user-message">${text}</div>`;
        logEl.scrollTop = logEl.scrollHeight;

        try {
            const promptContext = `User bertanya: "${text}". Jawab sebagai asisten bisnis ahli secara ringkas (max 3 kalimat).
PERINGATAN KERAS: JANGAN TULIS PROSES BERPIKIR ANDA. Jangan menuliskan kata pengantar. Langsung berikan jawaban akhir.`;
            let result = await this.callGroqAPI(promptContext);
            result = result.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            logEl.innerHTML += `<div class="chat-message ai-message">${result.replace(/\n/g, '<br>')}</div>`;
        } catch (error) {
            logEl.innerHTML += `<div class="chat-message ai-message" style="color:red;">Error: ${error.message}</div>`;
        }
        logEl.scrollTop = logEl.scrollHeight;
    },

    async generateAnomalyNarrative(anomalyData) {
        const narasiBox = document.getElementById('anomaly-narasi-content');
        if (!narasiBox) return;

        // Gunakan cache jika narasi sudah pernah di-generate (hindari rate limit)
        if (this._anomalyNarasiCache) {
            narasiBox.innerHTML = this._anomalyNarasiCache;
            return;
        }

        // Hindari multiple request bersamaan
        if (this._anomalyNarasiPending) return;
        this._anomalyNarasiPending = true;

        narasiBox.innerHTML = '<span class="a-loading"><i class="fa-solid fa-spinner fa-spin"></i> AI sedang menganalisa anomali...</span>';

        try {
            const { momAnomalies = [], marginAnomalies = [] } = anomalyData;

            const momSummary = momAnomalies.slice(0, 3).map(a =>
                `Revenue ${a.month} naik ${a.momPct.toFixed(0)}% MoM`).join('; ');
            const marginSummary = marginAnomalies.slice(0, 3).map(a =>
                `${a.name}: margin ${a.margin.toFixed(1)}%, Z-score ${a.zscore.toFixed(2)}`).join('; ');

            const promptContext = `Berikan analisis langsung dan tajam mengenai anomali bisnis berikut.
PERINGATAN KERAS: JANGAN TULIS PROSES BERPIKIR ANDA. Jangan gunakan kata pengantar seperti "Okay", "Let's analyze", dsb. Langsung cetak poin 1, 2, dan 3.

Data Anomali:
- Revenue: ${momSummary || 'Normal'}
- Profit Margin: ${marginSummary || 'Normal'}

Format respon wajib:
1. **Analisis**: (Poin singkat inti anomali)
2. **Penyebab Utama**: (Asumsi tajam penyebab anomali)
3. **Rekomendasi**: (Langkah perbaikan langsung)`;

            let result = await this.callGroqAPI(promptContext);
            
            // Hapus blok <think>...</think> yang sering dihasilkan model reasoning
            result = result.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            
            // Pertahanan ekstra: Jika AI masih menuliskan proses berpikir (rambling) sebelum poin "1.", potong teksnya
            const pointOneIndex = result.indexOf('1.');
            if (pointOneIndex > 0) {
                result = result.substring(pointOneIndex);
            }

            // Format teks dengan markdown bold sederhana
            result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            
            const html = `<p class="a-narasi-text">${result.replace(/\n/g, '<br>')}</p>`;
            this._anomalyNarasiCache = html;
            narasiBox.innerHTML = html;
        } catch (error) {
            console.error('Anomaly Narrative Error:', error);
            const errMsg = error.message || 'Unknown error';
            narasiBox.innerHTML = `<p class="a-narasi-text" style="color:#94a3b8;">Gagal memuat narasi AI: ${errMsg}. Periksa koneksi ke Groq API atau coba refresh halaman.</p>`;
        } finally {
            this._anomalyNarasiPending = false;
        }
    },

    async generateNarrativeTitles(pageId, dataArray) {
        const ctx = this.getPageContext(pageId, dataArray);
        
        const chartIds = [];
        if (pageId === 'page-1') {
            chartIds.push('monthly-trend', 'subcategory');
        } else if (pageId === 'page-2') {
            chartIds.push('scatter-discount', 'top-profit', 'category');
        } else if (pageId === 'page-3') {
            chartIds.push('customers', 'segment');
        } else if (pageId === 'page-4') {
            chartIds.push('province');
        }

        // Set titles to loading state
        chartIds.forEach(id => {
            const el = document.getElementById(`title-${id}`);
            if (el) el.innerHTML = `<span style="font-size:0.85rem; font-weight:400; color:#94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat judul naratif AI...</span>`;
        });

        // Local Fallback Data Generator
        const getLocalTitle = (id) => {
            const totalSales = dataArray.reduce((sum, d) => sum + d.Sales, 0);
            const totalProfit = dataArray.reduce((sum, d) => sum + d.Profit, 0);
            const margin = totalSales > 0 ? (totalProfit / totalSales * 100) : 0;

            if (id === 'monthly-trend') {
                return `Tren Bulanan Stabil dengan Margin Keuntungan ${margin.toFixed(1)}%`;
            }
            if (id === 'subcategory') {
                const subCatMap = {};
                dataArray.forEach(d => { if (d.SubCategory) subCatMap[d.SubCategory] = (subCatMap[d.SubCategory] || 0) + d.Sales; });
                const sorted = Object.entries(subCatMap).sort((a, b) => b[1] - a[1]);
                return sorted[0] ? `SubKategori ${sorted[0][0]} Memimpin Penjualan` : `Top 10 SubKategori Produk`;
            }
            if (id === 'scatter-discount') {
                const avgDiscount = dataArray.length > 0 ? (dataArray.reduce((s, d) => s + d.Discount, 0) / dataArray.length * 100).toFixed(1) : 0;
                return `Pola Korelasi Diskon Rata-rata ${avgDiscount}% vs Profit`;
            }
            if (id === 'top-profit') {
                const prodMap = {};
                dataArray.forEach(d => { if (d.ProductName) prodMap[d.ProductName] = (prodMap[d.ProductName] || 0) + d.Profit; });
                const sorted = Object.entries(prodMap).sort((a, b) => b[1] - a[1]);
                return sorted[0] ? `Profit Terbesar Disumbang oleh ${sorted[0][0].substring(0, 25)}...` : `Most Profitable Products`;
            }
            if (id === 'category') {
                const catMap = {};
                dataArray.forEach(d => { if (d.Category) catMap[d.Category] = (catMap[d.Category] || 0) + d.Sales; });
                const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
                return sorted[0] ? `${sorted[0][0]} Mendominasi Penjualan Nasional` : `Category Distribution`;
            }
            if (id === 'customers') {
                const custMap = {};
                dataArray.forEach(d => { if (d.CustomerName) custMap[d.CustomerName] = (custMap[d.CustomerName] || 0) + d.Sales; });
                const sorted = Object.entries(custMap).sort((a, b) => b[1] - a[1]);
                return sorted[0] ? `${sorted[0][0]} Adalah Kontributor Revenue Terbesar` : `Top 10 Active Customers`;
            }
            if (id === 'segment') {
                const segMap = {};
                dataArray.forEach(d => { if (d.Segment) segMap[d.Segment] = (segMap[d.Segment] || 0) + d.Sales; });
                const sorted = Object.entries(segMap).sort((a, b) => b[1] - a[1]);
                return sorted[0] ? `Segmen ${sorted[0][0]} Kuasai Pangsa Pasar Utama` : `Customer Segment Distribution`;
            }
            if (id === 'province') {
                const provMap = {};
                dataArray.forEach(d => { if (d.Province) provMap[d.Province] = (provMap[d.Province] || 0) + d.Sales; });
                const sorted = Object.entries(provMap).sort((a, b) => b[1] - a[1]);
                return sorted[0] ? `Penjualan Tertinggi Dicatat di Provinsi ${sorted[0][0]}` : `Top 5 Provinces`;
            }
            return 'Visualisasi Analitik';
        };

        try {
            const chartPrompt = chartIds.map(id => `"${id}"`).join(', ');
            const promptContext = `Kamu adalah analis data senior. Halaman: "${ctx.topic}".
Ringkasan Data:
${ctx.data}

Buatlah TEPAT judul naratif (active narrative titles) untuk chart berikut: [${chartPrompt}].
Setiap judul harus singkat (max 7 kata), menggunakan kalimat aktif yang mencerminkan fakta data (contoh: "Desember Catat Lonjakan Revenue 112%" atau "Aksesoris Mendominasi Penjualan Nasional").
Jangan gunakan judul generik/deskriptif.

Output harus berupa raw JSON object tanpa pembuka/penutup/markdown. Format:
{
  ${chartIds.map(id => `"${id}": "judul naratif untuk ${id}"`).join(',\n  ')}
}`;

            let result = await this.callGroqAPI(promptContext);
            result = result.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            result = result.replace(/```json/gi, '').replace(/```/g, '').trim();
            
            const match = result.match(/\{[\s\S]*\}/);
            if (match) result = match[0];
            
            const parsedData = JSON.parse(result);
            chartIds.forEach(id => {
                const el = document.getElementById(`title-${id}`);
                if (el && parsedData[id]) {
                    el.textContent = parsedData[id];
                } else if (el) {
                    el.textContent = getLocalTitle(id);
                }
            });
        } catch (error) {
            console.warn('Gagal memuat judul naratif AI, beralih ke lokal:', error);
            chartIds.forEach(id => {
                const el = document.getElementById(`title-${id}`);
                if (el) el.textContent = getLocalTitle(id);
            });
        }
    }
};

// Also attach event listeners for "Enter" key on chat inputs globally
document.addEventListener('DOMContentLoaded', () => {
    ['page-1', 'page-2', 'page-3', 'page-4'].forEach(pageId => {
        const inputEl = document.getElementById(`chat-input-${pageId}`);
        if(inputEl) {
            inputEl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    window.AIInsight.handleInPageChat(pageId);
                }
            });
        }
    });
});
