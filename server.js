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
      id: user.id_user,
      email: user.email,
      name: user.name,
      role: user.role,
      address: user.address,
    };

    res.redirect("/");
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

// 🛒 Route Checkout
app.post("/checkout", async (req, res) => {
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
    const insertQuery =
      "INSERT INTO transaksi (id_pembeli, harga_produk, jumlah_produk, total, status_produk, nama_produk ) VALUES (?, ?, ?, ?, ?, ?)";
    await db.query(insertQuery, [
      data.idPembeli,
      data.harga,
      data.jumlah,
      data.total,
      "pending",
      data.produk,
    ]);

    res.json({ success: true, message: "Checkout berhasil!" });
  } catch (error) {
    console.error("Error register:", error);
    res.render("register", {
      message: "Terjadi kesalahan server!",
    });
  }
  // res.json({ success: true });
});

// 🚪 Route Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.get("/admin", async (req, res) => {
  const query = "SELECT * FROM products";
  const [products] = await db.query(query);

  res.render("admin", {
    title: "Admin Dashboard - Rice Katsu",
    // isLoggedIn: req.session.user ? true : false,
    // user: req.session.user || null,
    // clientJs: getClientJs()
  });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).send("Terjadi kesalahan server!");
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
