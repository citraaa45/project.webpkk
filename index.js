const express = require('express')
const path = require ("path")
let ejs = require('ejs')
const app = express()
const port = 3000;
const db = require('./config/database'); // Impor koneksi database

app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
  // return res.send("hai");
  try {
    // Menjalankan kueri SQL
    const [rows] = await db.query('SELECT * FROM products');
    // return res.json(rows);
    res.render('home', {data : rows})
  } catch (error) {
    // Menangani error jika terjadi
    console.error('Error saat mengambil data produk:', error);
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data produk'
    });
  }
})

app.get('/login', (req, res) => {
  res.render('login')
})

app.get('/transaksi', (req, res) => {
  res.render('transaksi')
})

app.get('/data_produk', (req, res) => {
  res.render('admin/data_produk')
})

app.get('/tambah_produk', (req, res) => {
  res.render('admin/tambah_produk')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
