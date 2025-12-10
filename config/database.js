// config/database.js

const mysql = require('mysql2/promise');

// Membuat connection pool
const pool = mysql.createPool({
  host:"localhost",
  user: "root",
  password: "",
  database: "db_ritsu",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Uji koneksi (opsional tapi sangat direkomendasikan)
pool.getConnection()
  .then(connection => {
    console.log('Berhasil terhubung ke database!');
    connection.release(); // Melepas koneksi kembali ke pool
  })
  .catch(err => {
    console.error('Gagal terhubung ke database:', err);
  });

// Ekspor pool agar bisa digunakan di file lain
module.exports = pool;