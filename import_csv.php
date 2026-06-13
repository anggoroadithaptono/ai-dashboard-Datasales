<?php
set_time_limit(300); // 5 minutes limit
header('Content-Type: text/html; charset=utf-8');

echo '<html><head><title>Import CSV to MySQL</title>';
echo '<style>
    body { font-family: "Inter", sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px; }
    .card { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border-radius: 12px; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 30px rgba(0,0,0,0.5); }
    h2 { color: #8b5cf6; margin-top: 0; }
    .success { color: #10b981; font-weight: bold; }
    .error { color: #ef4444; font-weight: bold; }
    .info { color: #3b82f6; }
    pre { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; overflow-x: auto; color: #a7f3d0; }
    .btn { display: inline-block; background: #6366f1; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 20px; font-weight: 600; transition: background 0.2s; }
    .btn:hover { background: #4f46e5; }
</style></head><body>';

echo '<div class="card">';
echo '<h2>⚙️ MySQL CSV Importer</h2>';

// Load config
require_once 'db_config.php';

echo '<p class="info">Memeriksa struktur database...</p>';

// Create table if not exists
$tableSql = "CREATE TABLE IF NOT EXISTS `sales` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `SalesOrderID` INT NULL,
    `OrderDate` DATETIME NULL,
    `ShipDate` DATETIME NULL,
    `ShipMethod` VARCHAR(100) NULL,
    `CustomerID` INT NULL,
    `CustomerName` VARCHAR(255) NULL,
    `Segment` VARCHAR(100) NULL,
    `CountryRegion` VARCHAR(100) NULL,
    `City` VARCHAR(100) NULL,
    `Province` VARCHAR(100) NULL,
    `PostalCode` VARCHAR(50) NULL,
    `Territory` VARCHAR(100) NULL,
    `ProductName` VARCHAR(255) NULL,
    `SubCategory` VARCHAR(100) NULL,
    `Category` VARCHAR(100) NULL,
    `Qty` INT NULL,
    `UnitPrice` DECIMAL(15,4) NULL,
    `Sales` DECIMAL(15,4) NULL,
    `Discount` DECIMAL(5,4) NULL,
    `ProductCost` DECIMAL(15,4) NULL,
    `TotalCost` DECIMAL(15,4) NULL,
    `Profit` DECIMAL(15,4) NULL
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;";

if (!$conn->query($tableSql)) {
    echo '<p class="error">Gagal membuat tabel: ' . $conn->error . '</p>';
    echo '</div></body></html>';
    exit;
}

echo '<p class="success">✓ Tabel `sales` siap digunakan.</p>';

// Check if table already has data
$checkQuery = $conn->query("SELECT COUNT(*) AS total FROM `sales`");
$row = $checkQuery->fetch_assoc();
if ($row['total'] > 0) {
    echo '<p class="success">✓ Database sudah memiliki data (' . number_format($row['total']) . ' baris).</p>';
    echo '<p>Anda tidak perlu mengimpor ulang kecuali ingin mengosongkan tabel dahulu.</p>';
    echo '<a href="import_csv.php?action=truncate" class="btn" style="background:#ef4444;">Kosongkan & Impor Ulang</a> ';
    echo '<a href="index.html" class="btn">Buka Dashboard</a>';
    echo '</div></body></html>';
    
    // Check if truncate action requested
    if (isset($_GET['action']) && $_GET['action'] === 'truncate') {
        $conn->query("TRUNCATE TABLE `sales`");
        header("Location: import_csv.php");
        exit;
    }
    exit;
}

$csvFile = 'Sales_BY_Category_202606040914-1.csv';
if (!file_exists($csvFile)) {
    echo '<p class="error">Gagal: File CSV `' . $csvFile . '` tidak ditemukan di direktori ini.</p>';
    echo '</div></body></html>';
    exit;
}

echo '<p class="info">Membuka file CSV dan mengimpor data ke MySQL...</p>';

if (($handle = fopen($csvFile, "r")) !== FALSE) {
    // Read header row
    $header = fgetcsv($handle, 10000, ",");
    
    // Prepare INSERT statement
    $stmt = $conn->prepare("INSERT INTO `sales` (
        SalesOrderID, OrderDate, ShipDate, ShipMethod, CustomerID, CustomerName, Segment,
        CountryRegion, City, Province, PostalCode, Territory, ProductName, SubCategory,
        Category, Qty, UnitPrice, Sales, Discount, ProductCost, TotalCost, Profit
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    if (!$stmt) {
        echo '<p class="error">Gagal menyiapkan prepared statement: ' . $conn->error . '</p>';
        echo '</div></body></html>';
        fclose($handle);
        exit;
    }

    // Begin Transaction for super fast insertions
    $conn->begin_transaction();
    
    $count = 0;
    while (($data = fgetcsv($handle, 10000, ",")) !== FALSE) {
        // Map columns to correct types
        $salesOrderID = (int)$data[0];
        $orderDate = !empty($data[1]) ? $data[1] : null;
        $shipDate = !empty($data[2]) ? $data[2] : null;
        $shipMethod = $data[3];
        $customerID = (int)$data[4];
        $customerName = $data[5];
        $segment = $data[6];
        $countryRegion = $data[7];
        $city = $data[8];
        $province = $data[9];
        $postalCode = $data[10];
        $territory = $data[11];
        $productName = $data[12];
        $subCategory = $data[13];
        $category = $data[14];
        $qty = (int)$data[15];
        $unitPrice = (float)$data[16];
        $sales = (float)$data[17];
        $discount = (float)$data[18];
        $productCost = (float)$data[19];
        $totalCost = (float)$data[20];
        $profit = (float)$data[21];
        
        $stmt->bind_param(
            "isssissssssssssidddddd",
            $salesOrderID, $orderDate, $shipDate, $shipMethod, $customerID, $customerName, $segment,
            $countryRegion, $city, $province, $postalCode, $territory, $productName, $subCategory,
            $category, $qty, $unitPrice, $sales, $discount, $productCost, $totalCost, $profit
        );
        
        $stmt->execute();
        $count++;
    }
    
    // Commit transaction
    $conn->commit();
    fclose($handle);
    $stmt->close();
    
    echo '<p class="success">✓ Berhasil mengimpor ' . number_format($count) . ' baris data ke database `davis_sales`!</p>';
    echo '<a href="index.html" class="btn">Buka Dashboard</a>';
} else {
    echo '<p class="error">Gagal membaca file CSV.</p>';
}

$conn->close();
echo '</div></body></html>';
?>
