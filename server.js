const express = require("express");
const session = require("express-session");
const logger = require("morgan");
const path = require("path");
const db = require("./config/database");
const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "ricekatsu_secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// Middleware untuk cek admin
function isAdmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  if (req.session.user.role !== "admin") {
    return res.status(403).send("Akses ditolak! Anda bukan admin.");
  }
  next();
}

app.get("/", async (req, res) => {
  try {
    const query = "SELECT * FROM products";
    const [products] = await db.query(query);

    res.render("index", {
      title: "Rice Katsu - Nasi Ayam Katsu Terbaik",
      products: products,
      isLoggedIn: req.session.user ? true : false,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error di halaman home:", error);
    res.send("Terjadi kesalahan server! harap check console log");
  }
});

// 🔑 Route Login (GET - Tampilan Form)
app.get("/login", (req, res) => {
  res.render("login", {
    title: "Login - Rice Katsu",
    message: "",
  });
});

// 🔑 Route Login (POST - Proses Autentikasi)
app.post("/login_submit", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render("login", {
        message: "Email dan password harus diisi!",
      });
    }

    const query = "SELECT * FROM users WHERE email = ?";
    const [users] = await db.query(query, [email]);

    if (users.length === 0) {
      return res.render("login", {
        message: "Email tidak ditemukan!",
      });
    }

    const user = users[0];

    console.log(user);

    if (user.password !== password) {
      return res.render("login", {
        message: "Password salah!",
      });
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      address: user.address,
    };

    if(user.role == "admin"){
      res.redirect("/admin");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error("Error login:", error);
    res.render("login", {
      message: "Terjadi kesalahan server!",
    });
  }
});

app.get('/check', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }

});

app.get("/register", (req, res) => {
  res.render("register", {
    message: "",
  });
});

app.post("/register_submit", async (req, res) => {
  try {
    const { email, password, confirmPassword, address } = req.body;

    if (!email || !password || !confirmPassword || !address) {
      return res.render("register", {
        title: "Daftar - Rice Katsu",
        message: "Semua field harus diisi!",
      });
    }

    if (password !== confirmPassword) {
      return res.render("register", {
        title: "Daftar - Rice Katsu",
        message: "Password tidak cocok!",
      });
    }

    const checkQuery = "SELECT * FROM users WHERE email = ?";
    const [existingUsers] = await db.query(checkQuery, [email]);

    if (existingUsers.length > 0) {
      return res.render("register", {
        title: "Daftar - Rice Katsu",
        message: "Email sudah terdaftar!",
      });
    }

    const insertQuery =
      "INSERT INTO users (email, password, role, address) VALUES (?, ?, ?, ?)";
    await db.query(insertQuery, [email, password, "user", address]);

    res.render("login", {
      message: "Pendaftaran berhasil! Silahkan login.",
    });
  } catch (error) {
    console.error("Error register:", error);
    res.render("register", {
      message: "Terjadi kesalahan server!",
    });
  }
});

// 🚪 Route Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// 🛒 Route Checkout
app.post("/checkout", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Tidak ada produk yang dipesan." });
    }

    if(!req.session.user){
      return res.status(401).json({ success: false, message: "Silahkan login terlebih dahulu untuk melakukan checkout." });
    }

    // Ambil id pembeli dari session jika login
    const idPembeli = req.session.user ? req.session.user.id : null;
    const orderTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderStatus = "pending";
    const orderDate = new Date();

    // Insert ke tabel orders
    const orderInsertQuery = "INSERT INTO orders (id_user, tanggal, total, status) VALUES (?, ?, ?, ?)";
    const [orderResult] = await db.query(orderInsertQuery, [idPembeli, orderDate, orderTotal, orderStatus]);
    // Ambil order_id (MySQL: insertId)
    const orderId = orderResult.insertId;

    let successCount = 0;
    for (const item of items) {
      const total = item.price * item.quantity;
      // Insert ke tabel transaksi (order_items), relasikan dengan order_id
      const itemInsertQuery =
        "INSERT INTO order_items (order_id, id_user, harga_produk, jumlah_produk, total, status_produk, nama_produk ) VALUES (?, ?, ?, ?, ?, ?, ?)";
      await db.query(itemInsertQuery, [
        orderId,
        idPembeli,
        item.price,
        item.quantity,
        total,
        "pending",
        item.name,
      ]);
      successCount++;
    }
    res.json({ success: true, orderId: orderId, message: `Checkout berhasil! Order #${orderId} dibuat dengan ${successCount} produk.` });
  } catch (error) {
    console.error("Error checkout:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server!" });
  }
});

// Route detail transaksi
app.get("/transaksi/:id", async (req, res) => {
  const orderId = req.params.id;
  try {
    // Ambil detail order
    const [orderRows] = await db.query("SELECT * FROM orders WHERE id= ?", [orderId]);
    if (orderRows.length === 0) {
      return res.status(404).send("Transaksi tidak ditemukan");
    }
    const order = orderRows[0];

    // Ambil produk yang dipesan
    const [items] = await db.query("SELECT * FROM order_items WHERE order_id = ?", [orderId]);

    res.render("transaksi", {
      title: `Detail Transaksi #${orderId}`,
      order,
      items,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error detail transaksi:", error);
    res.status(500).send("Terjadi kesalahan server!");
  }
});

// ========== ADMIN ROUTES ==========

// Dashboard Admin
app.get("/admin", isAdmin, async (req, res) => {
  try {
    res.render("admin", {
      title: "Admin Dashboard - Rice Katsu",
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error admin dashboard:", error);
    res.status(500).send("Terjadi kesalahan server!");
  }
});

// API: Get all orders for admin with date filter
app.get("/api/admin/orders", isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT o.*, u.email as user_email 
      FROM orders o 
      LEFT JOIN users u ON o.id_user = u.id 
    `;
    const params = [];
    
    if (startDate && endDate) {
      query += ` WHERE DATE(o.tanggal) BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ` WHERE DATE(o.tanggal) >= ?`;
      params.push(startDate);
    } else if (endDate) {
      query += ` WHERE DATE(o.tanggal) <= ?`;
      params.push(endDate);
    }
    
    query += ` ORDER BY o.tanggal DESC`;
    
    const [orders] = await db.query(query, params);
    res.json({ success: true, orders });
  } catch (error) {
    console.error("Error get orders:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server!" });
  }
});

// API: Get order detail for admin
app.get("/api/admin/orders/:id", isAdmin, async (req, res) => {
  try {
    const orderId = req.params.id;
    const [orderRows] = await db.query(`
      SELECT o.*, u.email as user_email, u.address as user_address 
      FROM orders o 
      LEFT JOIN users u ON o.id_user = u.id 
      WHERE o.id = ?
    `, [orderId]);
    
    if (orderRows.length === 0) {
      return res.status(404).json({ success: false, message: "Order tidak ditemukan" });
    }
    
    const [items] = await db.query("SELECT * FROM order_items WHERE order_id = ?", [orderId]);
    
    res.json({ success: true, order: orderRows[0], items });
  } catch (error) {
    console.error("Error get order detail:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server!" });
  }
});

// API: Update order status
app.put("/api/admin/orders/:id/status", isAdmin, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    
    await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);
    
    res.json({ success: true, message: "Status order berhasil diupdate!" });
  } catch (error) {
    console.error("Error update order status:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server!" });
  }
});

// API: Get all products for admin
app.get("/api/admin/products", isAdmin, async (req, res) => {
  try {
    const [products] = await db.query("SELECT * FROM products ORDER BY id DESC");
    res.json({ success: true, products });
  } catch (error) {
    console.error("Error get products:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server!" });
  }
});

// API: Add product
app.post("/api/admin/products", isAdmin, async (req, res) => {
  try {
    const { name, price, description } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ success: false, message: "Nama dan harga produk harus diisi!" });
    }
    
    const [result] = await db.query(
      "INSERT INTO products (name, price, description) VALUES (?, ?, ?)",
      [name, price, description || ""]
    );
    
    res.json({ success: true, message: "Produk berhasil ditambahkan!", productId: result.insertId });
  } catch (error) {
    console.error("Error add product:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server!" });
  }
});

// API: Update product
app.put("/api/admin/products/:id", isAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, price, description } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ success: false, message: "Nama dan harga produk harus diisi!" });
    }
    
    await db.query(
      "UPDATE products SET name = ?, price = ?, description = ? WHERE id = ?",
      [name, price, description || "", productId]
    );
    
    res.json({ success: true, message: "Produk berhasil diupdate!" });
  } catch (error) {
    console.error("Error update product:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server!" });
  }
});

// API: Delete product
app.delete("/api/admin/products/:id", isAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    await db.query("DELETE FROM products WHERE id = ?", [productId]);
    
    res.json({ success: true, message: "Produk berhasil dihapus!" });
  } catch (error) {
    console.error("Error delete product:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server!" });
  }
});

// API: Get sales report
app.get("/api/admin/reports/sales", isAdmin, async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    
    let dateFilter = "";
    let groupBy = "";
    let dateFormat = "";
    const params = [];
    
    if (period === "day") {
      dateFormat = "DATE(o.tanggal)";
      groupBy = "DATE(o.tanggal)";
      if (startDate && endDate) {
        dateFilter = "WHERE DATE(o.tanggal) BETWEEN ? AND ?";
        params.push(startDate, endDate);
      }
    } else if (period === "week") {
      dateFormat = "YEARWEEK(o.tanggal, 1)";
      groupBy = "YEARWEEK(o.tanggal, 1)";
      if (startDate && endDate) {
        dateFilter = "WHERE DATE(o.tanggal) BETWEEN ? AND ?";
        params.push(startDate, endDate);
      }
    } else if (period === "month") {
      dateFormat = "DATE_FORMAT(o.tanggal, '%Y-%m')";
      groupBy = "DATE_FORMAT(o.tanggal, '%Y-%m')";
      if (startDate && endDate) {
        dateFilter = "WHERE DATE(o.tanggal) BETWEEN ? AND ?";
        params.push(startDate, endDate);
      }
    } else if (period === "year") {
      dateFormat = "YEAR(o.tanggal)";
      groupBy = "YEAR(o.tanggal)";
      if (startDate && endDate) {
        dateFilter = "WHERE DATE(o.tanggal) BETWEEN ? AND ?";
        params.push(startDate, endDate);
      }
    } else if (period === "custom" && startDate && endDate) {
      dateFormat = "DATE(o.tanggal)";
      groupBy = "DATE(o.tanggal)";
      dateFilter = "WHERE DATE(o.tanggal) BETWEEN ? AND ?";
      params.push(startDate, endDate);
    } else {
      // Default: all time by day
      dateFormat = "DATE(o.tanggal)";
      groupBy = "DATE(o.tanggal)";
    }
    
    const query = `
      SELECT 
        ${dateFormat} as period,
        COUNT(o.id) as total_orders,
        SUM(o.total) as total_revenue,
        AVG(o.total) as avg_order_value,
        COUNT(DISTINCT o.id_user) as unique_customers
      FROM orders o
      ${dateFilter}
      GROUP BY ${groupBy}
      ORDER BY period DESC
    `;
    
    const [results] = await db.query(query, params);
    
    // Calculate summary
    const summary = {
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      uniqueCustomers: 0
    };
    
    results.forEach(row => {
      summary.totalOrders += row.total_orders;
      summary.totalRevenue += parseFloat(row.total_revenue);
    });
    
    if (results.length > 0) {
      summary.avgOrderValue = summary.totalRevenue / summary.totalOrders;
    }
    
    res.json({ success: true, reports: results, summary });
  } catch (error) {
    console.error("Error get sales report:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server!" });
  }
});

// API: Get top products
app.get("/api/admin/reports/top-products", isAdmin, async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    let dateFilter = "";
    const params = [];
    
    if (startDate && endDate) {
      dateFilter = "WHERE DATE(o.tanggal) BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }
    
    params.push(parseInt(limit));
    
    const query = `
      SELECT 
        oi.nama_produk,
        SUM(oi.jumlah_produk) as total_quantity,
        SUM(oi.total) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      ${dateFilter}
      GROUP BY oi.nama_produk
      ORDER BY total_revenue DESC
      LIMIT ?
    `;
    
    const [results] = await db.query(query, params);
    
    res.json({ success: true, products: results });
  } catch (error) {
    console.error("Error get top products:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server!" });
  }
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).send("Terjadi kesalahan server!");
});

// Handler 404
app.use((req, res) => {
  res.status(404).render("404", {
    title: "404 - Halaman Tidak Ditemukan"
  });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
