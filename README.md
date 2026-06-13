# Dashboard AI Sales 📊🤖

Dashboard interaktif berbasis web untuk menganalisis data penjualan secara visual dengan dukungan kecerdasan buatan (AI) untuk menghasilkan *insight*, rekomendasi bisnis, narasi performa, serta tanya-jawab dinamis (*Prompt Center*). 

Proyek ini dirancang sebagai aplikasi satu halaman (*Single Page Application* - SPA) dengan tampilan modern berbasis tema **Glassmorphism**.

---

## 👤 Detail Pengembang
* **Nama:** Anggoro Adit Haptono
* **NIM:** 23082010006
* **Tugas/Proyek:** Dashboard AI Sales & Business Intelligence

---

## 🚀 Fitur Utama

### 1. Multi-Halaman Interaktif (SPA)
Dashboard dibagi menjadi 6 halaman navigasi utama tanpa *reload*:
* **Home (Overview):** Menampilkan ringkasan KPI (Total Sales, Profit, Qty, AOV), tren penjualan bulanan, deteksi anomali otomatis, serta analisis narasi AI.
* **Product Performance:** Menganalisis korelasi diskon terhadap keuntungan (Scatter Chart), produk paling menguntungkan (*Most Profitable*), produk paling merugi (*Products with Loss*), dan distribusi kategori.
* **Customer Insights:** Menampilkan daftar 10 pelanggan teratas berdasarkan kontribusi penjualan dan distribusi segmen pelanggan.
* **Regional Mapping:** Visualisasi kepadatan penjualan regional menggunakan peta dunia interaktif (**Google GeoChart**) dan grafik 5 provinsi dengan penjualan teratas.
* **Transaction Detail:** Tabel detail data penjualan lengkap yang mendukung fitur pencarian *live*, paginasi, dan ekspor data langsung ke format **CSV**.
* **Tableau Dashboard:** Halaman integrasi / penyematan (*embedded iframe*) untuk dashboard analitik Tableau di masa mendatang.

### 2. Integrasi Kecerdasan Buatan (AI Insights & Prompt Center)
* **Dynamic Insights & Recommendations:** Menggunakan API Groq dengan model **Qwen/Qwen3-32b** untuk membaca metrik performa aktual di setiap halaman secara dinamis dan menghasilkan 2 Insight Utama dan 1 Rekomendasi Aksi Nyata.
* **Storytelling Narrative:** AI menyusun 2-3 kalimat narasi bisnis berbahasa Indonesia yang elegan untuk merangkum performa data pada halaman aktif.
* **Ask AI / Prompt Center:** Pengguna dapat mengajukan pertanyaan langsung seputar data pada halaman bersangkutan melalui kolom chat yang disediakan di bagian bawah halaman.
* **Local Fallback Engine:** Jika API Key Groq tidak valid, kuota habis, atau koneksi terputus, sistem akan mengaktifkan **`storyEngine.js`** secara otomatis sebagai *fallback* untuk menghasilkan narasi bisnis berdasarkan aturan analitis lokal yang akurat.

### 3. Deteksi Anomali Bisnis Otomatis
Sistem memproses tren data bulanan dan mendeteksi anomali menggunakan metodologi statistik:
* **Lonjakan Pendapatan MoM (*Month-over-Month*):** Mendeteksi kenaikan penjualan bulanan yang drastis (di atas 100%).
* **Anomali Margin Profit Sub-Kategori:** Menggunakan analisis standar deviasi (**Z-Score**) untuk mendeteksi sub-kategori produk yang memiliki margin profit menyimpang drastis dari rata-rata (Z-Score > 1.4).
* **Narasi Anomali AI:** AI secara khusus menyusun analisis penyebab serta rekomendasi penanganan terhadap anomali yang ditemukan.

---

## 🛠️ Stack Teknologi

### Frontend
* **HTML5:** Struktur semantik untuk tata letak dashboard modern.
* **Vanilla CSS3:** Desain responsif kustom dengan efek Glassmorphism (blending, blur, drop shadow, neon gradient, custom scrollbar).
* **JavaScript (ES6+):** Logika manipulasi data, integrasi grafik, filter global, paginasi, ekspor file, dan komunikasi API.

### Pihak Ketiga (Melalui CDN)
* [Chart.js](https://www.chartjs.org/) - Visualisasi grafik garis, batang, doughnut, pie, dan scatter/bubble.
* [Google Charts (GeoChart)](https://developers.google.com/chart/interactive/docs/gallery/geochart) - Peta persebaran geografis regional.
* [PapaParse](https://www.papaparse.com/) - Parser CSV client-side yang sangat cepat untuk memuat dataset lokal secara dinamis.
* [FontAwesome v6.4.0](https://fontawesome.com/) - Kumpulan ikon antarmuka dashboard.
* [Google Fonts (Inter)](https://fonts.google.com/) - Font utama untuk tipografi premium.

### Backend & API Proxy
* **PHP (Hypertext Preprocessor):** Digunakan sebagai *proxy server* untuk mem-bypass masalah CORS saat frontend melakukan *request* ke Groq API, sekaligus menyembunyikan API Key dari sisi klien.
* **Groq Cloud API:** Layanan LLM cepat (menggunakan model `qwen/qwen3-32b`).

---

## 📁 Struktur File Proyek

```bash
davis/
│
├── index.html            # Struktur halaman utama dan container SPA
├── style.css             # Tema desain Glassmorphism dan layouting responsif
├── app.js                # Logika utama (parsing data, render KPI, inisialisasi Chart.js)
├── config.js             # Konfigurasi global Chart.js & API Key Groq
├── aiInsight.js          # Pengelola pengiriman prompt ke API & penataan UI AI
├── storyEngine.js        # Mesin logika analitik & narasi lokal (fallback)
├── groq-proxy.php        # Skrip proxy PHP untuk menghubungkan frontend ke API Groq
│
├── Sales_BY_Category_202606040914-1.csv   # Dataset utama penjualan
└── assets/               # Direktori untuk file gambar dan aset pendukung
```

---

## 💻 Cara Menjalankan Proyek Secara Lokal

### Prasyarat
Untuk menjalankan visualisasi data dasar, Anda hanya memerlukan browser. Namun, untuk mengaktifkan fitur **AI Insights & Prompt Center** (karena membutuhkan proxy PHP), Anda memerlukan server lokal dengan dukungan PHP seperti **Laragon** atau **PHP CLI**.

---

### Opsi A: Menjalankan Menggunakan Laragon (Sangat Direkomendasikan)
Laragon mempermudah pengelolaan server PHP dan MySQL secara visual di Windows.

1. **Pindahkan Folder Proyek:** 
   Pindahkan folder `davis` ke direktori root web milik Laragon, biasanya berada di:
   `C:\laragon\www\davis`
2. **Jalankan Laragon:**
   Buka aplikasi Laragon, lalu klik tombol **"Start All"** untuk menjalankan web server Apache dan database MySQL.
3. **Akses Dashboard:**
   Buka browser Anda dan ketik salah satu alamat berikut:
   * `http://localhost/davis`
   * `http://davis.test` (jika fitur auto-virtualhost Laragon aktif)

---

### Opsi B: Menjalankan Menggunakan PHP CLI (Alternatif Terminal)
1. Buka terminal atau command prompt (cmd/PowerShell) di folder proyek `c:\davis\davis`.
2. Jalankan perintah server internal PHP:
   ```bash
   php -S localhost:8000
   ```
3. Buka browser Anda dan akses `http://localhost:8000`.

---

### Langkah Selanjutnya: Konfigurasi API Key Groq
1. Buka berkas [config.js](file:///c:/davis/davis/config.js) dan pastikan konfigurasi dasar telah sesuai.
2. Buka berkas [groq-proxy.php](file:///c:/davis/davis/groq-proxy.php) pada baris 18:
   ```php
   $apiKey = "gsk_YOUR_API_KEY_HERE";
   ```
   Ganti nilai variabel `$apiKey` dengan kunci API Groq Anda yang aktif.

---

## 🗄️ Konfigurasi & Migrasi Database MySQL (XAMPP)

Aplikasi ini sekarang mendukung pemuatan data dinamis langsung dari **MySQL database**. Namun, jika server database mati atau belum diimpor, aplikasi memiliki **mekanisme fallback otomatis** yang akan memuat file CSV lokal sebagai cadangan agar dashboard tidak rusak.

### Langkah 1: Atur Koneksi Database
Buka file [db_config.php](file:///c:/davis/davis/db_config.php). Konfigurasi default diatur agar cocok dengan setelan bawaan XAMPP di Windows:
* **Host:** `localhost`
* **Username:** `root`
* **Password:** `""` (kosong)
* **Database Name:** `davis_sales` (Akan dibuat otomatis jika belum ada)

### Langkah 2: Impor Data Secara Otomatis
Kami telah menyediakan skrip migrasi otomatis agar Anda tidak perlu mengimpor file CSV berukuran besar secara manual melalui phpMyAdmin.
1. Pastikan modul **Apache** dan **MySQL** di XAMPP Control Panel Anda sudah di-**Start**.
2. Buka browser dan ketik alamat berikut:
   ```text
   http://localhost/davis/import_csv.php
   ```
3. Skrip PHP akan secara otomatis:
   * Membuat database `davis_sales` di MySQL Anda.
   * Membuat tabel `sales` dengan struktur kolom yang sesuai.
   * Mengimpor seluruh data (18.000+ baris) secara super cepat menggunakan transaksi MySQL (biasanya selesai dalam waktu kurang dari 2 detik).
4. Setelah berhasil, klik tombol **"Buka Dashboard"** yang muncul di halaman tersebut.

### Langkah 3: Cara Kerja Integrasi
* Saat halaman dashboard dimuat, [app.js](file:///c:/davis/davis/app.js) akan memanggil file backend [get_sales.php](file:///c:/davis/davis/get_sales.php) via API `fetch()`.
* [get_sales.php](file:///c:/davis/davis/get_sales.php) akan mengambil data dari MySQL dan mengirimkannya ke frontend sebagai JSON.
* Jika database MySQL mati, tidak ada, atau terjadi error jaringan, console browser akan menampilkan peringatan dan sistem akan secara **otomatis melakukan fallback ke parsing CSV lokal** agar visualisasi grafik tetap berjalan dengan lancar.

---

## ⚠️ Catatan Penting Keamanan & Performa
* **API Key Exposure:** Secara ideal, API Key tidak boleh ditaruh pada file JavaScript di sisi client (`config.js`). Sistem ini menggunakan `groq-proxy.php` sebagai perantara untuk menjaga agar kunci API tidak terekspos secara publik di tab Network browser pengguna saat melakukan request.
* **CORS Policy:** Karena Groq API tidak mengizinkan request langsung dari origin browser lokal (`localhost` atau `null`), pastikan server PHP aktif agar `groq-proxy.php` dapat berfungsi memfasilitasi request backend-to-backend.
* **SQL Injection & Prepared Statements:** Skrip pengimporan data menggunakan *Prepared Statements* MySQLi demi alasan performa tinggi dan keamanan transfer data.

---

## 🧠 Refleksi Konseptual (EAS Pertemuan 19)

### 1. Sinergi Business Intelligence (BI) & Artificial Intelligence (AI)
Dashboard konvensional (seperti Tableau dan grafik standar) sangat andal dalam menyajikan fakta historis secara visual (*"apa yang terjadi"*). Namun, pengambil keputusan sering kali harus menganalisis grafik tersebut secara manual untuk menarik kesimpulan. 

Dengan mengintegrasikan **AI (Groq Cloud / Qwen-32b)** langsung ke dalam alur kerja visualisasi, DAVIS melangkah lebih jauh dengan menyajikan analisis deskriptif dan preskriptif secara instan (*"mengapa itu terjadi"* dan *"apa yang harus dilakukan"*). AI bertindak sebagai analis pendamping yang secara otomatis menghasilkan **Judul Naratif** grafik secara dinamis dan memberikan rekomendasi operasional konkret berdasarkan konteks data halaman yang aktif.

### 2. Logika Deteksi Anomali Berbasis Statistik (Z-Score & MoM)
Deteksi anomali pada DAVIS tidak bersifat spekulatif, melainkan didasarkan pada perhitungan statistik terprogram pada berkas [anomalyDetector.js](file:///c:/xampp/htdocs/davis/davis/anomalyDetector.js):
* **Z-Score Margin Keuntungan:** Mengukur seberapa jauh profit margin dari suatu sub-kategori menyimpang dari rata-rata populasi. Batas deviasi diatur pada **Z-Score > 1.4** atau **Z-Score < -1.4** (mewakili ambang batas penyimpangan drastis). Sub-kategori yang terdeteksi anomali langsung diwarnai merah (anomali negatif) atau oranye (anomali positif) secara otomatis pada grafik bar sub-kategori.
* **Month-over-Month (MoM) Revenue Spike:** Mengidentifikasi pertumbuhan penjualan bulanan yang melompat $\ge 100\%$ dibanding bulan sebelumnya untuk melihat pola musiman ekstrem.
* **AI Alert Translation:** Data numerik hasil deteksi anomali dikirimkan ke model LLM untuk diterjemahkan menjadi analisis penyebab potensial dan rekomendasi penanganan di tab *Narasi AI*.

### 3. Alur Data Storytelling SCR (Situation-Complication-Resolution)
DAVIS dirancang mengikuti kerangka cerita data **SCR** yang ketat untuk memastikan visualisasi mudah dipahami oleh pengguna awam sekalipun:
* **Situation (SITUATION):** Ditandai dengan warna hijau/emerald. Terdiri dari KPI Banner dan grafik tren besar yang memberikan gambaran umum keadaan bisnis saat ini.
* **Complication (COMPLICATION):** Ditandai dengan warna merah/oranye. Menyoroti masalah, produk yang merugi (*Products with Loss*), dan kartu daftar anomali bisnis terdeteksi.
* **Resolution (RESOLUTION):** Ditandai dengan warna biru/cyan. Merupakan panel tindakan yang memuat rekomendasi aksi bisnis nyata dari AI serta kolom *Prompt Center* untuk tanya-jawab interaktif.

### 4. Perbandingan D3.js vs Chart.js
* **D3.js (Digunakan pada Grafik Top 5 Provinsi):** D3 (*Data-Driven Documents*) memanipulasi DOM secara langsung menggunakan elemen vektor SVG. D3 memberikan fleksibilitas tanpa batas dalam kustomisasi grafik, transisi mikro-interaksi, dan manipulasi elemen visual yang terikat langsung pada data.
* **Chart.js (Digunakan pada Tren Bulanan, Diskon, Kategori, Segmen):** Chart.js menggunakan elemen HTML5 Canvas yang merender piksel secara cepat. Sangat efektif untuk visualisasi standar dengan performa render tinggi, namun opsi manipulasi elemen individualnya lebih terbatas dibanding D3.js SVG.

#   a i - d a s h b o a r d - D a t a s a l e s  
 #   a i - d a s h b o a r d - D a t a s a l e s  
 