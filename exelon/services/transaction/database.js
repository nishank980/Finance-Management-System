const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST || 'transaction-db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: 'transaction_db',
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = db;