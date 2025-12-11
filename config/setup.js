const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Konfigurasi koneksi database
const dbConfig = {
  host: 'localhost',
  user: 'root', 
  password: '',
  multipleStatements: true 
};

async function setupDatabase() {
  try {
    const sqlFilePath = path.join(__dirname, '../db_ritsu.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    const connection = await mysql.createConnection(dbConfig);

    await connection.query(sql);

    for (let index = 0; index < 20; index++) {
        console.log('');
    }
    console.log('==============[DI BACA YA!]==========================');
    console.log('Database berhasil di-setup!');
    console.log('Silahkan kamu dapat menjalankan server menggunakan npm start');
    await connection.end();
  } catch (err) {
    console.error('Gagal setup database:', err);
  }
}

setupDatabase();