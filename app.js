// app.js
let rawData = [];
let filteredData = [];
let charts = {};
let currentPage = 'page-1';
let detectedAnomaly = null;

const formatCurrency = (val) => {
    if (Math.abs(val) >= 1000000) {
        const millions = val / 1000000;
        return 'Rp ' + millions.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' Jt';
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
};
const formatNumber = (val) => new Intl.NumberFormat('id-ID').format(val);

document.addEventListener('DOMContentLoaded', () => {
    setupTabSwitching();
    loadDashboardData();
    
    // Initialize Google Charts
    if (typeof google !== 'undefined') {
        google.charts.load('current', {
            'packages':['geochart'],
        });
        google.charts.setOnLoadCallback(() => {
            window.isGoogleChartsReady = true;
            if (filteredData && filteredData.length > 0) {
                renderAll();
            }
        });
    }
});

function setupTabSwitching() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.page-view');

    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            navBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');

            const targetId = e.currentTarget.getAttribute('data-target');
            sections.forEach(sec => sec.classList.add('hidden'));
            document.getElementById(targetId).classList.remove('hidden');

            currentPage = targetId;

            Object.values(charts).forEach(chart => chart.resize());

            if (window.AIInsight) {
                window.AIInsight.generatePageInsight(targetId, filteredData);
                if (window.AIInsight.generatePageStory) {
                    window.AIInsight.generatePageStory(targetId, filteredData);
                }
                if (window.AIInsight.generateNarrativeTitles) {
                    window.AIInsight.generateNarrativeTitles(targetId, filteredData);
                }
            }
        });
    });

    document.getElementById('filter-start-date').addEventListener('change', applyFilters);
    document.getElementById('filter-end-date').addEventListener('change', applyFilters);
    document.getElementById('filter-region').addEventListener('change', applyFilters);
    document.getElementById('filter-category').addEventListener('change', () => {
        updateSubCategoryFilter();
        applyFilters();
    });
    document.getElementById('filter-subcategory').addEventListener('change', applyFilters);
    document.getElementById('filter-segment').addEventListener('change', applyFilters);

    document.getElementById('live-search').addEventListener('input', () => { currentTablePage = 1; renderTransactionTable(); });
    document.getElementById('btn-prev').addEventListener('click', () => changePage(-1));
    document.getElementById('btn-next').addEventListener('click', () => changePage(1));
    document.getElementById('btn-export').addEventListener('click', exportToCSV);
}

function setupAnomalyTabs() {
    const tabs = document.querySelectorAll('.a-tab');
    tabs.forEach(tab => {
        // Remove old listeners by cloning
        const fresh = tab.cloneNode(true);
        tab.parentNode.replaceChild(fresh, tab);
    });
    document.querySelectorAll('.a-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.a-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.a-tab-content').forEach(c => c.classList.add('hidden'));
            const targetId = tab.getAttribute('data-atab');
            document.getElementById(targetId)?.classList.remove('hidden');
        });
    });
}

function loadDashboardData() {
    console.log("Mencoba memuat data dari MySQL...");
    fetch("get_sales.php")
        .then(response => {
            if (!response.ok) {
                throw new Error("Respon server MySQL tidak sukses: " + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error("Data MySQL kosong atau tidak valid.");
            }
            console.log("Berhasil memuat data dari MySQL (" + data.length + " baris).");
            processRawData(data);
        })
        .catch(error => {
            console.warn("Gagal memuat dari MySQL, beralih ke file CSV lokal. Detail:", error.message);
            loadCSVData();
        });
}

function processRawData(data) {
    rawData = data.map(row => {
        let dDate = row['OrderDate'] || row['Order Date'];
        return {
            ...row,
            OrderDateParsed: new Date(dDate),
            Sales: Number(row.Sales) || 0,
            Profit: Number(row.Profit) || 0,
            Quantity: Number(row.Qty || row.Quantity) || 0,
            Discount: Number(row.Discount) || 0,
            Region: row.CountryRegion || row.Region || 'Unknown',
            CustomerName: row.CustomerName || row['Customer Name'] || 'Unknown',
            ProductName: row.ProductName || row['Product Name'] || 'Unknown',
            SubCategory: row.SubCategory || row['Sub-Category'] || 'Unknown',
            Province: row.StateProvince || row.Province || 'Unknown'
        };
    });

    populateFilters();
    filteredData = [...rawData];
    renderAll();
}

function showLoadError(message) {
    const storyBox = document.getElementById('story-page-1');
    if (storyBox) {
        storyBox.classList.remove('hidden');
        storyBox.innerHTML = `<p class="story-text" style="color: #ef4444;"><i class="fa-solid fa-circle-exclamation"></i> ${message}</p>`;
    }
    const insightBox = document.getElementById('insight-page-1');
    if (insightBox) {
        insightBox.innerHTML = `<div style="color: #ef4444; padding: 12px; border: 1px dashed rgba(239, 68, 68, 0.3); border-radius: 8px;">Gagal memuat insight karena data kosong.</div>`;
    }
}

function loadCSVData() {
    console.log("Memuat data dari CSV lokal...");
    Papa.parse("Sales_BY_Category_202606040914-1.csv", {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function (results) {
            if (!results.data || results.data.length === 0 || (!results.data[0]['Category'] && !results.data[0]['SalesOrderID'])) {
                console.error("Format data CSV tidak valid atau file tidak ditemukan.");
                showLoadError("Gagal memuat data: File CSV tidak ditemukan atau formatnya salah. Pastikan file 'Sales_BY_Category_202606040914-1.csv' sudah di-upload ke server.");
                return;
            }

            rawData = results.data.map(row => {
                let dDate = row['OrderDate'] || row['Order Date'];
                return {
                    ...row,
                    OrderDateParsed: new Date(dDate),
                    Sales: Number(row.Sales) || 0,
                    Profit: Number(row.Profit) || 0,
                    Quantity: Number(row.Qty || row.Quantity) || 0,
                    Discount: Number(row.Discount) || 0,
                    Region: row.CountryRegion || row.Region || 'Unknown',
                    CustomerName: row.CustomerName || row['Customer Name'] || 'Unknown',
                    ProductName: row.ProductName || row['Product Name'] || 'Unknown',
                    SubCategory: row.SubCategory || row['Sub-Category'] || 'Unknown',
                    Province: row.StateProvince || row.Province || 'Unknown'
                };
            });

            populateFilters();
            filteredData = [...rawData];
            renderAll();
        },
        error: function (error) {
            console.error("Gagal membaca file CSV:", error);
            showLoadError("Gagal memuat data dari file CSV lokal. Detail: " + (error.message || error));
        }
    });
}

function populateFilters() {
    // Region
    const regions = [...new Set(rawData.map(d => d.Region).filter(Boolean))].sort();
    const regionSelect = document.getElementById('filter-region');
    regionSelect.innerHTML = '<option value="All">All Regions</option>';
    regions.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r;
        opt.textContent = r;
        regionSelect.appendChild(opt);
    });

    // Category
    const categories = [...new Set(rawData.map(d => d.Category).filter(Boolean))].sort();
    const categorySelect = document.getElementById('filter-category');
    categorySelect.innerHTML = '<option value="All">All Categories</option>';
    categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        categorySelect.appendChild(opt);
    });

    // SubCategory
    updateSubCategoryFilter();

    // Segment
    const segments = [...new Set(rawData.map(d => d.Segment).filter(Boolean))].sort();
    const segmentSelect = document.getElementById('filter-segment');
    segmentSelect.innerHTML = '<option value="All">All Segments</option>';
    segments.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        segmentSelect.appendChild(opt);
    });

    const dates = rawData.map(d => d.OrderDateParsed).filter(d => !isNaN(d));
    if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates)).toISOString().split('T')[0];
        const maxDate = new Date(Math.max(...dates)).toISOString().split('T')[0];
        document.getElementById('filter-start-date').value = minDate;
        document.getElementById('filter-end-date').value = maxDate;
    }
}

function updateSubCategoryFilter() {
    const categoryVal = document.getElementById('filter-category').value;
    const subCategorySelect = document.getElementById('filter-subcategory');
    if (!subCategorySelect) return;

    subCategorySelect.innerHTML = '<option value="All">All SubCategories</option>';

    let availableSubCats = [];
    if (categoryVal === 'All') {
        availableSubCats = [...new Set(rawData.map(d => d.SubCategory).filter(Boolean))].sort();
    } else {
        availableSubCats = [...new Set(
            rawData.filter(d => d.Category === categoryVal)
                   .map(d => d.SubCategory)
                   .filter(Boolean)
        )].sort();
    }

    availableSubCats.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.textContent = sub;
        subCategorySelect.appendChild(opt);
    });
}

function applyFilters() {
    const startDate = new Date(document.getElementById('filter-start-date').value);
    const endDate = new Date(document.getElementById('filter-end-date').value);
    const region = document.getElementById('filter-region').value;
    const category = document.getElementById('filter-category').value;
    const subcategory = document.getElementById('filter-subcategory').value;
    const segment = document.getElementById('filter-segment').value;

    filteredData = rawData.filter(d => {
        const dDate = d.OrderDateParsed;
        const passDate = (!isNaN(startDate) ? dDate >= startDate : true) &&
            (!isNaN(endDate) ? dDate <= endDate : true);
        const passRegion = region === 'All' || d.Region === region;
        const passCategory = category === 'All' || d.Category === category;
        const passSubCategory = subcategory === 'All' || d.SubCategory === subcategory;
        const passSegment = segment === 'All' || d.Segment === segment;

        return passDate && passRegion && passCategory && passSubCategory && passSegment;
    });

    // Reset cache narasi anomali karena data berubah
    if (window.AIInsight) {
        window.AIInsight._anomalyNarasiCache = null;
        window.AIInsight._pageInsightCache = {};
        window.AIInsight._pageStoryCache = {};
        window.AIInsight._queue = []; // batalkan antrian lama
    }

    renderAll();
}

function renderAll() {
    renderKPIs();
    renderPage1Charts();
    renderPage2Charts();
    renderPage3Charts();
    renderPage4Charts();
    renderTransactionTable();

    if (window.AIInsight) {
        window.AIInsight.generatePageInsight(currentPage, filteredData);
        if (window.AIInsight.generatePageStory) {
            window.AIInsight.generatePageStory(currentPage, filteredData);
        }
        if (window.AIInsight.generateNarrativeTitles) {
            window.AIInsight.generateNarrativeTitles(currentPage, filteredData);
        }
    }
}

function renderKPIs() {
    const totalSales = filteredData.reduce((sum, d) => sum + d.Sales, 0);
    const totalProfit = filteredData.reduce((sum, d) => sum + d.Profit, 0);
    const totalQty = filteredData.reduce((sum, d) => sum + d.Quantity, 0);
    const margin = totalSales > 0 ? (totalProfit / totalSales * 100) : 0;

    // Total Customers (unique names)
    const uniqueCustomers = new Set();
    // Total Orders (unique order IDs)
    const uniqueOrders = new Set();

    filteredData.forEach(d => {
        if (d.CustomerName && d.CustomerName !== 'Unknown' && d.CustomerName !== '') {
            uniqueCustomers.add(d.CustomerName);
        }
        const orderId = d.SalesOrderID || d.OrderID || d['Order ID'];
        if (orderId) {
            uniqueOrders.add(orderId);
        }
    });

    document.getElementById('kpi-sales').textContent = formatCurrency(totalSales);
    document.getElementById('kpi-profit').textContent = formatCurrency(totalProfit);
    document.getElementById('kpi-margin').textContent = margin.toFixed(2) + '%';
    document.getElementById('kpi-qty').textContent = formatNumber(totalQty);
    document.getElementById('kpi-customers').textContent = formatNumber(uniqueCustomers.size);
    document.getElementById('kpi-orders').textContent = formatNumber(uniqueOrders.size);
}

function createOrUpdateChart(chartId, config) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (charts[chartId]) {
        charts[chartId].destroy();
    }
    charts[chartId] = new Chart(ctx, config);
}

function renderPage1Charts() {
    // Monthly Trend
    const monthlyData = {};
    filteredData.forEach(d => {
        if (isNaN(d.OrderDateParsed)) return;
        const monthYear = d.OrderDateParsed.toISOString().substring(0, 7);
        monthlyData[monthYear] = (monthlyData[monthYear] || 0) + d.Sales;
    });

    const labelsMonthly = Object.keys(monthlyData).sort();
    const dataMonthly = labelsMonthly.map(k => monthlyData[k]);

    // Anomaly Detection via AnomalyDetector Module
    const { pointColors, pointRadii, momAnomalies, marginAnomalies } = 
        window.AnomalyDetector.detect(filteredData, labelsMonthly, dataMonthly);

    // === Render Card ===
    const anomalyCard = document.getElementById('anomaly-card');
    const anomalyListEl = document.getElementById('anomaly-list');
    const anomalyBadge = document.getElementById('anomaly-count-badge');
    const totalAnomalies = momAnomalies.length + marginAnomalies.length;

    if (totalAnomalies > 0) {
        if (anomalyCard) anomalyCard.classList.remove('hidden');
        if (anomalyBadge) anomalyBadge.textContent = `${totalAnomalies} anomali`;
        detectedAnomaly = momAnomalies[0] || null;

        if (anomalyListEl) {
            const marginHtml = marginAnomalies.map(a => {
                const dir = a.zscore < 0 ? 'jauh di bawah rata-rata' : 'jauh di atas rata-rata';
                return `<div class="anomaly-list-item">
                    <span class="a-dot dot-orange"></span>
                    <div class="a-item-body">
                        <div class="a-item-title">Profit Margin Anomali: ${a.name}</div>
                        <div class="a-item-meta">margin ${a.margin.toFixed(1)}% &nbsp;|&nbsp; Z-score ${a.zscore.toFixed(2)} &nbsp;|&nbsp; ${dir}</div>
                    </div>
                </div>`;
            }).join('');

            const momHtml = momAnomalies.map(a => `<div class="anomaly-list-item">
                    <span class="a-dot dot-red"></span>
                    <div class="a-item-body">
                        <div class="a-item-title">Revenue Naik Drastis: ${a.month}</div>
                        <div class="a-item-meta">${a.momPct.toFixed(1)}% MoM &nbsp;|&nbsp; ${formatCurrency(a.sales)} vs ${formatCurrency(a.prevSales)} bulan lalu</div>
                    </div>
                </div>`).join('');

            anomalyListEl.innerHTML = marginHtml + momHtml;
        }

        // Setup tab switching (idempotent)
        setupAnomalyTabs();

        // Trigger AI narasi
        if (window.AIInsight) {
            window.AIInsight.generateAnomalyNarrative({ momAnomalies, marginAnomalies });
        }
    } else {
        if (anomalyCard) anomalyCard.classList.add('hidden');
        detectedAnomaly = null;
    }

    createOrUpdateChart('chart-monthly-trend', {
        type: 'line',
        data: {
            labels: labelsMonthly,
            datasets: [{
                label: 'Sales',
                data: dataMonthly,
                borderColor: 'rgba(168, 85, 247, 0.8)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: pointColors,
                pointRadius: pointRadii
            }]
        },
        options: { scales: { x: { grid: gridConfig }, y: { grid: gridConfig } } }
    });

    // SubCategory
    const subCatData = {};
    filteredData.forEach(d => {
        if (d.SubCategory) subCatData[d.SubCategory] = (subCatData[d.SubCategory] || 0) + d.Sales;
    });
    const subCatSorted = Object.entries(subCatData).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // Color anomalous subcategories semantically (red for negative zscore, orange for positive)
    const subCatColors = subCatSorted.map(([name]) => {
        const anomaly = marginAnomalies.find(a => a.name === name);
        if (anomaly) {
            return anomaly.zscore < 0 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(249, 115, 22, 0.7)';
        }
        return 'rgba(6, 182, 212, 0.6)';
    });

    createOrUpdateChart('chart-subcategory', {
        type: 'bar',
        data: {
            labels: subCatSorted.map(x => x[0]),
            datasets: [{
                label: 'Sales',
                data: subCatSorted.map(x => x[1]),
                backgroundColor: subCatColors,
                borderRadius: 4
            }]
        },
        options: { scales: { x: { grid: gridConfig }, y: { grid: gridConfig } } }
    });
}

function renderPage2Charts() {
    const scatterData = filteredData.map(d => ({
        x: d.Discount,
        y: d.Profit,
        r: 5
    }));
    createOrUpdateChart('chart-scatter-discount', {
        type: 'bubble',
        data: {
            datasets: [{
                label: 'Discount vs Profit',
                data: scatterData,
                backgroundColor: 'rgba(236, 72, 153, 0.4)'
            }]
        },
        options: { scales: { x: { title: { display: true, text: 'Discount' }, grid: gridConfig }, y: { title: { display: true, text: 'Profit' }, grid: gridConfig } } }
    });

    const prodData = {};
    filteredData.forEach(d => {
        if (d.ProductName) prodData[d.ProductName] = (prodData[d.ProductName] || 0) + d.Profit;
    });
    const sortedProds = Object.entries(prodData).sort((a, b) => b[1] - a[1]);
    const top5 = sortedProds.slice(0, 5);
    const bottom5 = sortedProds.slice(-5).reverse();

    createOrUpdateChart('chart-top-profit', {
        type: 'bar',
        data: {
            labels: top5.map(x => x[0].substring(0, 15) + '...'),
            datasets: [{ label: 'Profit', data: top5.map(x => x[1]), backgroundColor: 'rgba(16, 185, 129, 0.6)', borderRadius: 4 }]
        },
        options: { indexAxis: 'y', scales: { x: { grid: gridConfig }, y: { grid: gridConfig } } }
    });

    createOrUpdateChart('chart-bottom-profit', {
        type: 'bar',
        data: {
            labels: bottom5.map(x => x[0].substring(0, 15) + '...'),
            datasets: [{ label: 'Loss', data: bottom5.map(x => x[1]), backgroundColor: 'rgba(239, 68, 68, 0.6)', borderRadius: 4 }]
        },
        options: { indexAxis: 'y', scales: { x: { grid: gridConfig }, y: { grid: gridConfig } } }
    });

    const catData = {};
    filteredData.forEach(d => {
        if (d.Category) catData[d.Category] = (catData[d.Category] || 0) + d.Sales;
    });
    createOrUpdateChart('chart-category', {
        type: 'doughnut',
        data: {
            labels: Object.keys(catData),
            datasets: [{
                data: Object.values(catData),
                backgroundColor: ['rgba(6,182,212,0.6)', 'rgba(168,85,247,0.6)', 'rgba(236,72,153,0.6)'],
                borderWidth: 0
            }]
        },
        options: { cutout: '65%' }
    });
}

function renderPage3Charts() {
    const custData = {};
    filteredData.forEach(d => {
        if (d.CustomerName) {
            if (!custData[d.CustomerName]) custData[d.CustomerName] = { sales: 0, profit: 0 };
            custData[d.CustomerName].sales += d.Sales;
            custData[d.CustomerName].profit += d.Profit;
        }
    });
    const topCust = Object.entries(custData).sort((a, b) => b[1].sales - a[1].sales).slice(0, 10);
    const tbody = document.getElementById('top-customer-table');
    if (tbody) {
        tbody.innerHTML = '';
        topCust.forEach(([name, data]) => {
            tbody.innerHTML += `<tr><td>${name}</td><td>${formatCurrency(data.sales)}</td><td>${formatCurrency(data.profit)}</td></tr>`;
        });
    }

    const segData = {};
    filteredData.forEach(d => {
        if (d.Segment) segData[d.Segment] = (segData[d.Segment] || 0) + d.Sales;
    });
    createOrUpdateChart('chart-segment-pie', {
        type: 'pie',
        data: {
            labels: Object.keys(segData),
            datasets: [{
                data: Object.values(segData),
                backgroundColor: ['rgba(6,182,212,0.6)', 'rgba(168,85,247,0.6)', 'rgba(236,72,153,0.6)'],
                borderWidth: 0
            }]
        }
    });
}

function renderPage4Charts() {
    const regData = {};
    filteredData.forEach(d => {
        if (d.Region) regData[d.Region] = (regData[d.Region] || 0) + d.Sales;
    });
    // === Google Charts GeoChart for Sales Density ===
    if (window.isGoogleChartsReady && document.getElementById('chart-region-map')) {
        const dataMap = [['Region', 'Sales']];
        Object.entries(regData).forEach(([region, sales]) => {
            dataMap.push([region, sales]);
        });
        
        const dataTable = google.visualization.arrayToDataTable(dataMap);
        const options = {
            backgroundColor: 'transparent',
            colorAxis: {colors: ['#3b82f6', '#8b5cf6', '#ec4899']}, // Matching theme
            datalessRegionColor: 'rgba(255, 255, 255, 0.05)',
            defaultColor: 'rgba(255, 255, 255, 0.2)',
            keepAspectRatio: true,
            tooltip: {textStyle: {color: '#1e293b'}, showColorCode: true}
        };
        
        const chart = new google.visualization.GeoChart(document.getElementById('chart-region-map'));
        chart.draw(dataTable, options);
    }

    const provData = {};
    filteredData.forEach(d => {
        if (d.Province) provData[d.Province] = (provData[d.Province] || 0) + d.Sales;
    });
    const provSorted = Object.entries(provData).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // D3.js Native Bar Chart Implementation
    const container = document.getElementById('d3-chart-province');
    if (!container) return;
    container.innerHTML = ''; // Clear previous chart

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 180;
    const margin = { top: 15, right: 15, bottom: 35, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    if (provSorted.length === 0) {
        container.innerHTML = '<div style="color:#64748b; font-size:0.85rem; padding: 20px; text-align:center;">No regional data available.</div>';
        return;
    }

    const svg = d3.select(container)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Gradient definitions
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
        .attr('id', 'd3-bar-gradient')
        .attr('x1', '0%')
        .attr('y1', '100%')
        .attr('x2', '0%')
        .attr('y2', '0%');
    gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', 'rgba(139, 92, 246, 0.15)');
    gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'rgba(168, 85, 247, 0.7)');

    // Scales
    const x = d3.scaleBand()
        .domain(provSorted.map(d => d[0]))
        .range([0, chartWidth])
        .padding(0.35);

    const y = d3.scaleLinear()
        .domain([0, d3.max(provSorted, d => d[1]) * 1.1])
        .range([chartHeight, 0]);

    // Format utility for Y Axis
    const formatY = (val) => {
        if (val >= 1000000) return 'Rp ' + (val / 1000000).toFixed(1) + 'Jt';
        if (val >= 1000) return 'Rp ' + (val / 1000).toFixed(0) + 'rb';
        return 'Rp ' + val;
    };

    // Gridlines (Horizontal)
    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y)
            .tickSize(-chartWidth)
            .tickFormat('')
            .ticks(4)
        )
        .selectAll('.tick line')
        .attr('stroke', 'rgba(255, 255, 255, 0.08)');

    // Bottom Axis
    svg.append('g')
        .attr('transform', `translate(0, ${chartHeight})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('fill', '#cbd5e1')
        .style('font-family', "'Inter', sans-serif")
        .style('font-size', '9px')
        .attr('dy', '8px');

    // Left Axis
    svg.append('g')
        .call(d3.axisLeft(y).ticks(4).tickFormat(formatY))
        .selectAll('text')
        .attr('fill', '#cbd5e1')
        .style('font-family', "'Inter', sans-serif")
        .style('font-size', '9px');

    // Style the axes borders
    svg.selectAll('.domain').attr('stroke', 'rgba(255, 255, 255, 0.15)');
    svg.selectAll('.tick line').attr('stroke', 'rgba(255, 255, 255, 0.12)');

    // Draw Bars with load transition
    svg.selectAll('.bar')
        .data(provSorted)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d[0]))
        .attr('width', x.bandwidth())
        .attr('y', chartHeight)
        .attr('height', 0)
        .attr('fill', 'url(#d3-bar-gradient)')
        .attr('rx', 4)
        .attr('ry', 4)
        .style('cursor', 'pointer')
        .transition()
        .duration(800)
        .attr('y', d => y(d[1]))
        .attr('height', d => chartHeight - y(d[1]));

    // Interactive behaviors
    svg.selectAll('.bar')
        .on('mouseover', function() {
            d3.select(this)
                .transition()
                .duration(150)
                .attr('fill', 'rgba(168, 85, 247, 0.95)');
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(150)
                .attr('fill', 'url(#d3-bar-gradient)');
        })
        .append('title')
        .text(d => `${d[0]}: ${formatCurrency(d[1])}`);
}

let currentTablePage = 1;
const rowsPerPage = 25;

function renderTransactionTable() {
    const search = document.getElementById('live-search').value.toLowerCase();
    const tableData = filteredData.filter(d => {
        const custMatch = d.CustomerName && d.CustomerName.toLowerCase().includes(search);
        const prodMatch = d.ProductName && d.ProductName.toLowerCase().includes(search);
        return custMatch || prodMatch;
    });

    const totalPages = Math.ceil(tableData.length / rowsPerPage);
    if (currentTablePage > totalPages) currentTablePage = totalPages || 1;
    if (currentTablePage < 1) currentTablePage = 1;

    document.getElementById('page-info').textContent = `Page ${currentTablePage} of ${totalPages || 1}`;

    const startIdx = (currentTablePage - 1) * rowsPerPage;
    const endIdx = startIdx + rowsPerPage;
    const pageData = tableData.slice(startIdx, endIdx);

    const tbody = document.getElementById('transaction-table');
    if (tbody) {
        tbody.innerHTML = '';
        pageData.forEach(d => {
            let orderDateStr = '';
            if (d.OrderDateParsed && !isNaN(d.OrderDateParsed)) {
                orderDateStr = d.OrderDateParsed.toISOString().split('T')[0];
            } else {
                orderDateStr = d.OrderDate || d['Order Date'] || '';
            }
            tbody.innerHTML += `
                <tr>
                    <td>${d.SalesOrderID || d.OrderID || d['Order ID'] || ''}</td>
                    <td>${orderDateStr}</td>
                    <td>${d.CustomerName}</td>
                    <td>${d.ProductName ? d.ProductName.substring(0, 30) + '...' : ''}</td>
                    <td>${formatCurrency(d.Sales)}</td>
                    <td>${formatCurrency(d.Profit)}</td>
                </tr>
            `;
        });
    }
}

function changePage(dir) {
    currentTablePage += dir;
    renderTransactionTable();
}

function exportToCSV() {
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "exported_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
