<?php
$host = "localhost";      // usually localhost
$user = "root";           // your MySQL username
$pass = "adib@1234";               // your MySQL password
$dbname = "my_db";        // your database name

// Create connection
$conn = new mysqli($host, $user, $pass, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
// echo "Connected successfully";
?>
