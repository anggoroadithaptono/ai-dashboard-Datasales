// storyEngine.js — fallback lokal jika Groq API tidak tersedia
window.StoryEngine = {

    generateStory: function(data, pageId) {
        if (!data || data.length === 0) return [];

        const totalSales = data.reduce((sum, d) => sum + d.Sales, 0);
        const totalProfit = data.reduce((sum, d) => sum + d.Profit, 0);
        const margin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

        const fmt = (val) => {
            if (Math.abs(val) >= 1000000) return 'Rp ' + (val / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' Jt';
            return 'Rp ' + (val / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 }) + ' Rb';
        };

        // Page 2: Product Performance
        if (pageId === 'page-2') {
            const prodMap = {};
            data.forEach(d => {
                if (!d.ProductName) return;
                if (!prodMap[d.ProductName]) prodMap[d.ProductName] = { sales: 0, profit: 0 };
                prodMap[d.ProductName].sales += d.Sales;
                prodMap[d.ProductName].profit += d.Profit;
            });
            const sorted = Object.entries(prodMap).sort((a, b) => b[1].profit - a[1].profit);
            const topProd = sorted[0] ? sorted[0][0].substring(0, 25) : '-';
            const topProfit = sorted[0] ? fmt(sorted[0][1].profit) : '-';
            const loserProd = sorted.length > 1 ? sorted[sorted.length - 1][0].substring(0, 25) : '-';
            const avgDisc = data.length > 0 ? (data.reduce((s, d) => s + d.Discount, 0) / data.length * 100).toFixed(1) : 0;
            return [
                { type: 'insight',      title: "Produk Paling Menguntungkan", desc: `${topProd} menghasilkan profit tertinggi sebesar ${topProfit} dari seluruh portofolio produk.` },
                { type: 'insight',      title: "Dampak Diskon Tinggi",         desc: `Rata-rata diskon ${avgDisc}% berpotensi menggerus profit margin — produk bermasalah perlu dievaluasi segera.` },
                { type: 'rekomendasi',  title: "Hentikan Produk Merugi",      desc: `Evaluasi dan hentikan atau repricing ${loserProd} yang terus mencatat kerugian untuk memperbaiki margin keseluruhan.` }
            ];
        }

        // Page 3: Customer Insights
        if (pageId === 'page-3') {
            const custMap = {};
            data.forEach(d => {
                if (!d.CustomerName) return;
                if (!custMap[d.CustomerName]) custMap[d.CustomerName] = { sales: 0, txn: 0 };
                custMap[d.CustomerName].sales += d.Sales;
                custMap[d.CustomerName].txn += 1;
            });
            const sorted = Object.entries(custMap).sort((a, b) => b[1].sales - a[1].sales);
            const topCust = sorted[0] ? sorted[0][0] : '-';
            const topCustSales = sorted[0] ? fmt(sorted[0][1].sales) : '-';
            const totalCust = Object.keys(custMap).length;
            const segMap = {};
            data.forEach(d => { if (d.Segment) segMap[d.Segment] = (segMap[d.Segment] || 0) + d.Sales; });
            const topSeg = Object.entries(segMap).sort((a, b) => b[1] - a[1])[0];
            return [
                { type: 'insight',     title: "Pelanggan Kontributor Utama", desc: `${topCust} adalah pelanggan dengan kontribusi penjualan tertinggi senilai ${topCustSales}.` },
                { type: 'insight',     title: "Basis Pelanggan Aktif",       desc: `Terdapat ${totalCust} pelanggan unik — konsentrasi revenue pada top 20% pelanggan berisiko jika mereka churn.` },
                { type: 'rekomendasi', title: "Perkuat Program Loyalitas",   desc: topSeg ? `Buat program loyalitas eksklusif untuk segmen "${topSeg[0]}" guna meningkatkan repeat purchase dan nilai lifetime pelanggan.` : 'Implementasikan program retensi pelanggan berbasis segmentasi untuk meningkatkan loyalitas.' }
            ];
        }

        // Page 4: Regional Mapping
        if (pageId === 'page-4') {
            const provMap = {};
            data.forEach(d => {
                const prov = d.Province || 'Unknown';
                provMap[prov] = (provMap[prov] || 0) + d.Sales;
            });
            const sortedProv = Object.entries(provMap).sort((a, b) => b[1] - a[1]);
            const topProv = sortedProv[0] ? sortedProv[0][0] : '-';
            const topProvSales = sortedProv[0] ? fmt(sortedProv[0][1]) : '-';
            const weakProv = sortedProv.length > 1 ? sortedProv[sortedProv.length - 1][0] : '-';
            const totalProv = sortedProv.length;
            return [
                { type: 'insight',     title: "Wilayah Penjualan Terkuat",  desc: `${topProv} memimpin penjualan regional dengan nilai ${topProvSales} — jadikan sebagai model best practice distribusi.` },
                { type: 'insight',     title: "Kesenjangan Antar Wilayah",  desc: `Penjualan tersebar di ${totalProv} provinsi dengan kesenjangan signifikan antara wilayah terkuat dan terlemah.` },
                { type: 'rekomendasi', title: "Ekspansi ke Wilayah Lemah",  desc: `Fokuskan kampanye dan penguatan distribusi di ${weakProv} — penetrasi pasar masih sangat rendah dan potensinya besar.` }
            ];
        }

        // Page 1: Overview (default)
        const monthMap = {};
        data.forEach(d => {
            if (!d.OrderDateParsed || isNaN(d.OrderDateParsed)) return;
            const key = d.OrderDateParsed.toISOString().substring(0, 7);
            monthMap[key] = (monthMap[key] || 0) + d.Sales;
        });
        const months = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0]));
        const bestMonth = months.length ? months.reduce((a, b) => b[1] > a[1] ? b : a) : null;

        return [
            { type: 'insight',     title: "Total Performa Bisnis",    desc: `Penjualan mencapai ${fmt(totalSales)} dengan profit ${fmt(totalProfit)} dan margin ${margin.toFixed(1)}%.` },
            bestMonth
                ? { type: 'insight', title: "Bulan Penjualan Terbaik", desc: `${bestMonth[0]} mencatat penjualan tertinggi sebesar ${fmt(bestMonth[1])} — identifikasi faktor pendorong untuk direplikasi.` }
                : { type: 'insight', title: "Tren Penjualan",           desc: `${months.length} bulan data tersedia — identifikasi pola musiman untuk mengoptimalkan strategi sepanjang tahun.` },
            margin > 15
                ? { type: 'rekomendasi', title: "Pertahankan Efisiensi",       desc: `Margin ${margin.toFixed(1)}% sudah sehat — fokus pada peningkatan volume penjualan tanpa mengorbankan efisiensi biaya.` }
                : { type: 'rekomendasi', title: "Perbaiki Struktur Biaya",     desc: `Margin ${margin.toFixed(1)}% masih rendah — audit ulang struktur diskon dan biaya operasional untuk mendongkrak profitabilitas.` }
        ];
    },

    generateLocalNarrative: function(data, pageId) {
        if (!data || data.length === 0) return 'Data tidak tersedia untuk dianalisis.';

        const fmt = (val) => {
            if (Math.abs(val) >= 1000000) return 'Rp ' + (val / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' Jt';
            return 'Rp ' + (val / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 }) + ' Rb';
        };

        const totalSales = data.reduce((s, d) => s + d.Sales, 0);
        const totalProfit = data.reduce((s, d) => s + d.Profit, 0);
        const margin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0;

        if (pageId === 'page-2') {
            const prodMap = {};
            data.forEach(d => {
                if (!d.ProductName) return;
                prodMap[d.ProductName] = (prodMap[d.ProductName] || 0) + d.Profit;
            });
            const sorted = Object.entries(prodMap).sort((a, b) => b[1] - a[1]);
            const topProd = sorted[0] ? sorted[0][0].substring(0, 30) : 'produk utama';
            const topVal = sorted[0] ? fmt(sorted[0][1]) : '-';
            const avgDisc = data.length > 0 ? (data.reduce((s, d) => s + d.Discount, 0) / data.length * 100).toFixed(1) : 0;
            return `Dari seluruh portofolio produk, <strong>${topProd}</strong> tampil sebagai bintang dengan kontribusi profit tertinggi sebesar ${topVal}. ` +
                `Namun, rata-rata diskon sebesar ${avgDisc}% menjadi catatan penting — kebijakan diskon yang terlalu agresif berisiko menggerus margin secara signifikan. ` +
                `Evaluasi menyeluruh terhadap produk-produk yang mencatat kerugian perlu segera dilakukan untuk menjaga kesehatan profitabilitas bisnis.`;
        }

        if (pageId === 'page-3') {
            const custMap = {};
            data.forEach(d => {
                if (!d.CustomerName) return;
                if (!custMap[d.CustomerName]) custMap[d.CustomerName] = { sales: 0, txn: 0 };
                custMap[d.CustomerName].sales += d.Sales;
                custMap[d.CustomerName].txn++;
            });
            const sorted = Object.entries(custMap).sort((a, b) => b[1].sales - a[1].sales);
            const topCust = sorted[0] ? sorted[0][0] : 'pelanggan utama';
            const topVal = sorted[0] ? fmt(sorted[0][1].sales) : '-';
            const totalCust = Object.keys(custMap).length;
            return `Basis pelanggan bisnis ini terdiri dari <strong>${totalCust} pelanggan aktif</strong>, dengan <strong>${topCust}</strong> sebagai kontributor revenue terbesar senilai ${topVal}. ` +
                `Konsentrasi pendapatan pada segelintir pelanggan teratas menuntut strategi retensi yang kuat — kehilangan satu pelanggan kunci dapat berdampak signifikan terhadap total penjualan. ` +
                `Program loyalitas dan personalisasi layanan menjadi kunci untuk mempertahankan momentum pertumbuhan pelanggan secara berkelanjutan.`;
        }

        if (pageId === 'page-4') {
            const provMap = {};
            data.forEach(d => {
                const prov = d.Province || 'Unknown';
                provMap[prov] = (provMap[prov] || 0) + d.Sales;
            });
            const sorted = Object.entries(provMap).sort((a, b) => b[1] - a[1]);
            const topProv = sorted[0] ? sorted[0][0] : 'wilayah utama';
            const topVal = sorted[0] ? fmt(sorted[0][1]) : '-';
            const totalProv = sorted.length;
            return `Peta penjualan menunjukkan dominasi yang jelas dari <strong>${topProv}</strong> dengan kontribusi ${topVal} terhadap total revenue nasional. ` +
                `Dengan jejak bisnis yang menjangkau <strong>${totalProv} provinsi</strong>, potensi ekspansi ke wilayah-wilayah berpenetrasi rendah masih sangat terbuka lebar. ` +
                `Strategi distribusi yang tepat sasaran dan penguatan jaringan lokal akan menjadi faktor kunci dalam mengakselerasi pertumbuhan regional secara merata.`;
        }

        // Page 1: Overview
        const monthMap = {};
        data.forEach(d => {
            if (!d.OrderDateParsed || isNaN(d.OrderDateParsed)) return;
            const key = d.OrderDateParsed.toISOString().substring(0, 7);
            monthMap[key] = (monthMap[key] || 0) + d.Sales;
        });
        const months = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0]));
        const bestMonth = months.length ? months.reduce((a, b) => b[1] > a[1] ? b : a) : null;
        return `Performa bisnis secara keseluruhan mencatat total penjualan sebesar <strong>${fmt(totalSales)}</strong> dengan profit bersih ${fmt(totalProfit)} dan margin ${margin}%. ` +
            (bestMonth ? `Puncak penjualan terjadi pada <strong>${bestMonth[0]}</strong> dengan nilai ${fmt(bestMonth[1])}, mencerminkan adanya momentum positif yang perlu dipertahankan. ` : '') +
            `Konsistensi performa di level ini membutuhkan strategi yang adaptif — mengoptimalkan sub-kategori terlaris sembari memperkuat lini produk yang masih under-performing.`;
    }
};
