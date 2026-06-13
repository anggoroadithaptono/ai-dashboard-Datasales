<?php
// get_sales.php
error_reporting(0);       // Jangan tampilkan PHP warnings ke output
ini_set('display_errors', 0);
ob_start();               // Buffer output agar warning tidak merusak JSON

header('Content-Type: application/json; charset=utf-8');

require_once 'db_config.php';

ob_clean(); // Bersihkan buffer sebelum output JSON


// Select columns needed by dashboard to optimize response size
$query = "SELECT 
            SalesOrderID, 
            OrderDate, 
            CustomerName, 
            Segment, 
            CountryRegion, 
            Province, 
            ProductName, 
            SubCategory, 
            Category, 
            Qty, 
            UnitPrice, 
            Sales, 
            Discount, 
            Profit 
          FROM `sales` 
          ORDER BY OrderDate ASC";

$result = $conn->query($query);

if (!$result) {
    echo json_encode(["error" => "Gagal mengambil data: " . $conn->error]);
    $conn->close();
    exit;
}

$data = [];
while ($row = $result->fetch_assoc()) {
    // Cast types correctly
    $row['SalesOrderID'] = (int)$row['SalesOrderID'];
    $row['Qty'] = (int)$row['Qty'];
    $row['UnitPrice'] = (float)$row['UnitPrice'];
    $row['Sales'] = (float)$row['Sales'];
    $row['Discount'] = (float)$row['Discount'];
    $row['Profit'] = (float)$row['Profit'];
    $data[] = $row;
}

echo json_encode($data);

$conn->close();
?>
