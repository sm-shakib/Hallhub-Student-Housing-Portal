const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'mysql-71ed2b0-hallhub-1.g.aivencloud.com',
  user: 'avnadmin',
  password: 'AVNS_FnvYhizl3z5Xkya3Tr4',
  database: 'defaultdb',
});

connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to database.');
});

module.exports = connection;