// db_connect.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Path to SSL certificate (ca.pem)
const caPath = path.join(__dirname, 'CERT', 'ca.pem');

// Make sure the file exists
if (!fs.existsSync(caPath)) {
  console.error('❌ CA certificate not found at:', caPath);
  process.exit(1);
}

const db = mysql.createPool({
  host: 'mysql-71ed2b0-hallhub-1.g.aivencloud.com', // your Aiven host
  port: 28592,                                        // your Aiven port
  user: 'avnadmin',                                   // your DB user
  password: 'AVNS_FnvYhizl3z5Xkya3Tr4',              // your DB password
  database: 'defaultdb',                              // your DB name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    ca: fs.readFileSync(caPath)
  }
});

module.exports = db;
