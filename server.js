const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./config/database');
const app = express();
const port = 3000;

// ======================================
// 1. MIDDLEWARE & KONFIGURASI
// ======================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'kunci_rahasia_dan_panjang_anda_yang_sangat_kuat_12345',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// ======================================
// 2. FUNGSI JAVASCRIPT CLIENT-SIDE
// ======================================
const getClientJs = () => {
    return `
        // Toggle Side Cart
        function toggleCart() {
            const cart = document.getElementById('side-cart');
            cart.classList.toggle('open');
        }

        // Tambah ke Keranjang
        function addToCart(id, name, price) {
            let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
            
            // Cek apakah produk sudah ada
            const existingItem = cartItems.find(item => item.id === id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cartItems.push({ id, name, price, quantity: 1 });
            }
            
            localStorage.setItem('cart', JSON.stringify(cartItems));
            updateCartDisplay();
            showNotification(name + ' ditambahkan ke keranjang!');
        }

        // Update tampilan keranjang
        function updateCartDisplay() {
            const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
            const cartContainer = document.getElementById('cart-items');
            const badge = document.getElementById('cart-badge');
            
            badge.textContent = cartItems.length;
            badge.style.display = cartItems.length > 0 ? 'block' : 'none';
            
            cartContainer.innerHTML = '';
            
            if (cartItems.length === 0) {
                cartContainer.innerHTML = '<p style="text-align: center; color: #999;">Keranjang kosong</p>';
                return;
            }
            
            cartItems.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = \`
                    <strong>\${item.name}</strong>
                    <p>Rp \${item.price.toLocaleString('id-ID')} x \${item.quantity}</p>
                    <div class="quantity-controls">
                        <button class="quantity-btn btn-minus" onclick="changeQuantity('\${item.id}', -1)">-</button>
                        <span class="quantity-display">\${item.quantity}</span>
                        <button class="quantity-btn btn-plus" onclick="changeQuantity('\${item.id}', 1)">+</button>
                        <button class="btn-delete" onclick="removeFromCart('\${item.id}')">🗑</button>
                    </div>
                \`;
                cartContainer.appendChild(itemEl);
            });
        }

        // Ubah jumlah item
        function changeQuantity(id, change) {
            let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
            const item = cartItems.find(item => item.id === id);
            
            if (item) {
                item.quantity += change;
                if (item.quantity <= 0) {
                    cartItems = cartItems.filter(item => item.id !== id);
                }
            }
            
            localStorage.setItem('cart', JSON.stringify(cartItems));
            updateCartDisplay();
        }

        // Hapus dari keranjang
        function removeFromCart(id) {
            let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
            cartItems = cartItems.filter(item => item.id !== id);
            localStorage.setItem('cart', JSON.stringify(cartItems));
            updateCartDisplay();
            showNotification('Produk dihapus dari keranjang');
        }

        // Checkout
        function checkoutToTransaksi() {
            const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
            if (cartItems.length === 0) {
                showNotification('Keranjang Anda kosong!');
                return;
            }
            
            // Kirim data ke server
            fetch('/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ items: cartItems })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    localStorage.removeItem('cart');
                    window.location.href = '/transaksi';
                }
            })
            .catch(err => console.error('Error:', err));
        }

        // Notifikasi Toast
        function showNotification(message) {
            const toast = document.getElementById('notification-toast');
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }

        // Jalankan saat halaman dimuat
        document.addEventListener('DOMContentLoaded', () => {
            updateCartDisplay();
        });
    `;
};

// ======================================
// 3. ROUTING
// ======================================

// 🏠 Route Home (index.ejs)
app.get('/', async (req, res) => {
    try {
        // Ambil data produk dari database
        const query = 'SELECT * FROM produk LIMIT 10';
        const [products] = await db.query(query);

        // Jika database kosong atau error, gunakan data dummy
        const productList = products && products.length > 0 ? products : [
            { id: 'P001', name: 'Ayam Katsu Original', imagePath: 'katsu.png', price: 28000 },
            { id: 'P002', name: 'Ayam Katsu Spicy', imagePath: 'katsu-spicy.png', price: 30000 },
            { id: 'P003', name: 'Beef Katsu', imagePath: 'beef-katsu.png', price: 35000 }
        ];

        res.render('index', {
            title: 'Rice Katsu - Nasi Ayam Katsu Terbaik',
            products: productList,
            isLoggedIn: req.session.user ? true : false,
            user: req.session.user || null,
            clientJs: getClientJs()
        });
    } catch (error) {
        console.error('Error di halaman home:', error);
        
        // Jika ada error database, tetap tampilkan data dummy
        const dummyProducts = [
            { id: '01', name: 'RICE BOWL CHICKEN KATSU', imagePath: 'katsu.png', price: 12000 },
                    ];

        res.render('index', {
            title: 'Rice Katsu',
            products: dummyProducts,
            isLoggedIn: false,
            user: null,
            clientJs: getClientJs()
        });
    }
});

// 🛒 Route Cart (Halaman Keranjang Penuh)
app.get('/cart', (req, res) => {
    res.render('cart', {
        title: 'Keranjang Belanja - Rice Katsu',
        isLoggedIn: req.session.user ? true : false,
        user: req.session.user || null,
        clientJs: getClientJs()
    });
});

// 🔑 Route Login (GET - Tampilan Form)
app.get('/login', (req, res) => {
    res.render('login', {
        title: 'Login - Rice Katsu',
        message: ''
    });
});

// 🔑 Route Login (POST - Proses Autentikasi)
app.post('/login_submit', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validasi input
        if (!email || !password) {
            return res.render('login', {
                title: 'Login - Rice Katsu',
                message: 'Email dan password harus diisi!'
            });
        }

        // Cari user di database
        const query = 'SELECT * FROM user WHERE email = ?';
        const [users] = await db.query(query, [email]);

        if (users.length === 0) {
            return res.render('login', {
                title: 'Login - Rice Katsu',
                message: 'Email tidak ditemukan!'
            });
        }

        const user = users[0];

        // TODO: Implementasi password hashing (gunakan bcrypt)
        if (user.password !== password) {
            return res.render('login', {
                title: 'Login - Rice Katsu',
                message: 'Password salah!'
            });
        }

        // Set session
        req.session.user = {
            id: user.id,
            email: user.email,
            nama: user.nama,
            role: user.role
        };

        res.redirect('/');
    } catch (error) {
        console.error('Error login:', error);
        res.render('login', {
            title: 'Login - Rice Katsu',
            message: 'Terjadi kesalahan server!'
        });
    }
});

// ✍ Route Register (GET - Tampilan Form)
app.get('/register', (req, res) => {
    res.render('register', {
        title: 'Daftar - Rice Katsu',
        message: ''
    });
});

// ✍ Route Register (POST - Proses Pendaftaran)
app.post('/register_submit', async (req, res) => {
    try {
        const { nama, email, password, confirmPassword } = req.body;

        // Validasi input
        if (!nama || !email || !password || !confirmPassword) {
            return res.render('register', {
                title: 'Daftar - Rice Katsu',
                message: 'Semua field harus diisi!'
            });
        }

        if (password !== confirmPassword) {
            return res.render('register', {
                title: 'Daftar - Rice Katsu',
                message: 'Password tidak cocok!'
            });
        }

        // Cek apakah email sudah terdaftar
        const checkQuery = 'SELECT * FROM user WHERE email = ?';
        const [existingUsers] = await db.query(checkQuery, [email]);

        if (existingUsers.length > 0) {
            return res.render('register', {
                title: 'Daftar - Rice Katsu',
                message: 'Email sudah terdaftar!'
            });
        }

        // Insert user baru
        const insertQuery = 'INSERT INTO user (nama, email, password, role) VALUES (?, ?, ?, ?)';
        await db.query(insertQuery, [nama, email, password, 'user']);

        res.render('register', {
            title: 'Daftar - Rice Katsu',
            message: 'Pendaftaran berhasil! Silahkan login.'
        });
    } catch (error) {
        console.error('Error register:', error);
        res.render('register', {
            title: 'Daftar - Rice Katsu',
            message: 'Terjadi kesalahan server!'
        });
    }
});



// 🛒 Route Checkout
app.post('/checkout', async (req, res) => {

     try {
        // const { nama, email, password, confirmPassword } = req.body;
        const data = req.body;



        // // Validasi input
        // if (!nama || !email || !password || !confirmPassword) {
        //     return res.render('register', {
        //         title: 'Daftar - Rice Katsu',
        //         message: 'Semua field harus diisi!'
        //     });
        // }

        // if (password !== confirmPassword) {
        //     return res.render('register', {
        //         title: 'Daftar - Rice Katsu',
        //         message: 'Password tidak cocok!'
        //     });
        // }

        

        // Insert user baru
        const insertQuery = "INSERT INTO transaksi (id_pembeli, harga_produk, jumlah_produk, total, status_produk, nama_produk ) VALUES (?, ?, ?, ?, ?, ?)";
        await db.query(insertQuery, [data.idPembeli, data.harga, data.jumlah, data.total, 'pending', data.produk]);

        res.json({ success: true, message: 'Checkout berhasil!' });
    } catch (error) {
        console.error('Error register:', error);
        res.render('register', {
            title: 'Daftar - Rice Katsu',
            message: 'Terjadi kesalahan server!'
        });
    }
    // res.json({ success: true });
});

// 📋 Route Transaksi (Halaman Konfirmasi Pesanan)
app.get('/transaksi', (req, res) => {
    try {
        res.render('transaksi', {
            title: 'Konfirmasi Transaksi - Rice Katsu',
            isLoggedIn: req.session.user ? true : false,
            user: req.session.user || null,
            clientJs: getClientJs()
        });
    } catch (error) {
        console.error('Error di halaman transaksi:', error);
        res.redirect('/');
    }
});

// 🚪 Route Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// ======================================
// 4. ERROR HANDLING
// ======================================
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Terjadi kesalahan server!');
});

// ======================================
// 5. START SERVER
// ======================================
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});