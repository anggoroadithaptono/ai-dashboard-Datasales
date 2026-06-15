<?php
// get_sales.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}
header('Content-Type: application/json; charset=utf-8');

require_once 'db_config.php';

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
