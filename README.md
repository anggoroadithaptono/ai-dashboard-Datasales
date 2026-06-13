# 📊 Dashboard AI Sales — DAVIS B

Dashboard interaktif berbasis web untuk analisis data penjualan yang dilengkapi dengan **kecerdasan buatan (AI)** via Groq API. Dashboard ini mampu membaca data secara real-time, mendeteksi anomali otomatis, dan memberikan narasi serta rekomendasi bisnis langsung di dalam antarmuka.

---

## ✨ Fitur Utama

### 🏠 Home — Overview
- KPI ringkasan: **Total Sales, Total Profit, Profit Margin, Items Sold, Total Customers, Total Orders**
- Grafik **Monthly Sales Trend** dengan deteksi anomali visual (titik merah = anomali)
- Grafik **Top 10 Sub-Category** by Sales
- Panel **Anomali Otomatis** dengan 2 tab: *Data Anomali* & *Narasi AI*
- Panel **Ask AI** — chat langsung dengan AI Business Analyst

### 📦 Product Performance
- Scatter plot **Discount vs Profit** untuk melihat dampak diskon
- Bar chart **Most Profitable Products** & **Products with Loss**
- Doughnut chart **Category Distribution**
- AI Insights & Ask AI panel

### 👥 Customer Insights
- Tabel **Top 10 Active Customers** by Sales & Profit
- Pie chart **Customer Segment Distribution**
- AI Insights & Ask AI panel

### 🌏 Regional Mapping
- **GeoChart** (Google Charts) — peta kepadatan penjualan per wilayah
- **D3.js SVG Bar Chart** — Top 5 Provinsi by Sales
- AI Insights & Ask AI panel

### 🧾 Transaction Detail
- Tabel transaksi lengkap dengan **live search** & pagination
- Export data ke **CSV**

### 📊 Tableau Dashboard
- Embed langsung visualisasi dari **Tableau Public**

---

## 🤖 Fitur AI

Setiap halaman memiliki 3 lapisan AI:

| Fitur | Deskripsi |
|---|---|
| **AI Narrative Story** | Narasi otomatis 2-3 kalimat berdasarkan data halaman aktif |
| **AI Insights & Rekomendasi** | 3 poin analisis: 2 insight + 1 rekomendasi aksi konkret |
| **AI Anomaly Narrative** | Analisis tajam anomali revenue & profit margin yang terdeteksi |
| **AI Chart Titles** | Judul grafik dinamis yang mencerminkan fakta data aktual |
| **Ask AI (Chat)** | Tanya langsung ke AI sebagai Business Analyst virtual |

---

## 🚨 Deteksi Anomali Otomatis

Sistem berjalan di background menggunakan **Vanilla JavaScript** murni:
- Deteksi **lonjakan MoM (Month-over-Month) Revenue** ≥ 100%
- Deteksi **anomali Profit Margin** per Sub-Kategori via **Z-Score** (threshold > 1.4)

---

## 🛠️ Teknologi

| Layer | Teknologi |
|---|---|
| **Frontend** | HTML5, CSS3 (Glassmorphism Dark Theme), Vanilla JavaScript |
| **Charting** | Chart.js, D3.js v7, Google Charts (GeoChart) |
| **AI / LLM** | Groq API — model `qwen/qwen3-32b` via PHP Proxy |
| **Data Source** | MySQL (XAMPP) dengan fallback CSV via PapaParse |
| **Backend** | PHP (XAMPP/Apache) |

---

## 🚀 Cara Menjalankan Lokal

> ⚠️ Wajib menggunakan **XAMPP** karena project menggunakan PHP backend dan MySQL.

**1.** Clone repository ini ke folder `htdocs` XAMPP:
```bash
git clone https://github.com/anggoroadithaptono/ai-dashboard-Datasales.git
```

**2.** Buat file `config.secret.php` di dalam folder project (tidak ter-push ke GitHub):
```php
<?php
define('GROQ_API_KEY', 'your_groq_api_key_here');
```

**3.** Jalankan **Apache & MySQL** di XAMPP Control Panel.

**4.** Buka browser dan akses:
```
http://localhost/davis/davis/index.html
```

---

## 🔑 Global Filters

Dashboard mendukung filter yang berlaku untuk semua halaman secara bersamaan:
- **Start Date / End Date** — filter rentang waktu transaksi
- **Region** — filter per wilayah
- **Category / Sub-Category** — filter per kategori produk
- **Segment** — filter per segmen pelanggan

---

## 👤 Identitas Pembuat

| | |
|---|---|
| **Nama** | Anggoro Adit Haptono |
| **NPM** | 23082010006 |
| **Mata Kuliah** | EAS DAVIS B |