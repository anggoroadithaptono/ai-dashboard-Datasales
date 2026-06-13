// anomalyDetector.js
window.AnomalyDetector = {
    /**
     * Mendeteksi anomali pada data penjualan bulanan dan margin sub-kategori.
     * @param {Array} filteredData - Data transaksi yang sudah terfilter
     * @param {Array} labelsMonthly - Label bulan (YYYY-MM)
     * @param {Array} dataMonthly - Nilai sales per bulan
     * @returns {Object} Hasil analisis anomali
     */
    detect(filteredData, labelsMonthly, dataMonthly) {
        // === 1. Deteksi Batas Tren Bulanan (Z-Score/Standard Deviation threshold) ===
        const mean = dataMonthly.reduce((a, b) => a + b, 0) / (dataMonthly.length || 1);
        const stdDev = Math.sqrt(dataMonthly.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (dataMonthly.length || 1));
        const threshold = mean + (2 * stdDev);

        const pointColors = dataMonthly.map((val) => {
            if (val > threshold && val > 0) {
                return '#ef4444'; // Merah untuk anomali lonjakan tren
            }
            return 'rgba(168, 85, 247, 1)'; // Ungu standar
        });

        const pointRadii = dataMonthly.map(val => val > threshold ? 8 : 4);

        // === 2. MoM (Month-over-Month) Revenue Spikes (Kenaikan >= 100%) ===
        const momAnomalies = [];
        for (let i = 1; i < labelsMonthly.length; i++) {
            const prev = dataMonthly[i - 1];
            const curr = dataMonthly[i];
            if (prev > 0) {
                const momPct = ((curr - prev) / prev * 100);
                if (momPct >= 100) {
                    momAnomalies.push({ month: labelsMonthly[i], sales: curr, prevSales: prev, momPct });
                }
            }
        }
        momAnomalies.sort((a, b) => b.momPct - a.momPct);

        // === 3. Profit Margin Anomalies by Sub-Category (Z-Score > 1.4) ===
        const subCatMap = {};
        filteredData.forEach(d => {
            if (!d.SubCategory) return;
            if (!subCatMap[d.SubCategory]) subCatMap[d.SubCategory] = { sales: 0, profit: 0 };
            subCatMap[d.SubCategory].sales += d.Sales;
            subCatMap[d.SubCategory].profit += d.Profit;
        });

        const catMargins = Object.entries(subCatMap)
            .filter(([, v]) => v.sales > 0)
            .map(([name, v]) => ({ name, margin: (v.profit / v.sales) * 100 }));

        const mVals = catMargins.map(c => c.margin);
        const mMean = mVals.reduce((a, b) => a + b, 0) / (mVals.length || 1);
        const mStd = Math.sqrt(mVals.reduce((s, n) => s + Math.pow(n - mMean, 2), 0) / (mVals.length || 1));

        const marginAnomalies = catMargins
            .map(c => ({ ...c, zscore: mStd > 0 ? (c.margin - mMean) / mStd : 0 }))
            .filter(c => Math.abs(c.zscore) > 1.4)
            .sort((a, b) => a.zscore - b.zscore);

        return {
            pointColors,
            pointRadii,
            momAnomalies,
            marginAnomalies
        };
    }
};
