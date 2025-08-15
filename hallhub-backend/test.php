<?php
include 'db_connect.php';

$sql = "SELECT * FROM student_info"; // example table
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()){
        echo "Student: " . $row['Name'] . " - Department: " . $row['Department'] . "<br>";
    }
} else {
    echo "No data found";
}
?>
