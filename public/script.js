// ================ SLIDE CART PANEL ==================
function toggleCart() {
    document.getElementById("side-cart").classList.toggle("open");
}

// ================ DATA PRODUK ==================
const product = [
    {
        id: "1",
        name: "Rice Bowl Chicken Katsu",
        image: "katsu.png",
        price: 12000
    }
];

// ================ KERANJANG ====================
let cart = [];

// Simpan ke LocalStorage
function saveCart() {
    localStorage.setItem("cartData", JSON.stringify(cart));
}

// Ambil dari LocalStorage
function loadCart() {
    const saved = localStorage.getItem("cartData");
    cart = saved ? JSON.parse(saved) : [];
}

// ================ BADGE JUMLAH ==================
function updateBadge() {
    const badge = document.getElementById("cart-badge");
    if (!badge) return;

    const totalQty = cart.reduce((a, b) => a + b.quantity, 0);

    if (totalQty > 0) {
        badge.style.display = "block";
        badge.innerText = totalQty;
    } else {
        badge.style.display = "none";
        badge.innerText = "0";
    }
}

// ================ TAMPILKAN PRODUK ==================
const divContainer = document.getElementById("product-list");

// if (divContainer) {
//     product.forEach(data => {
//         const card = document.createElement("div");
//         card.className = "product-card";
//         card.innerHTML = `
//             <img src="${data.image}" alt="${data.name}">
//             <h1 class="name">${data.name}</h1>
//             <h3 class="price">Harga: Rp ${data.price.toLocaleString()}</h3>
//             <button class="btn-keranjang" onclick="tambahkeranjang('${data.id}')">
//                 Masukan Keranjang
//             </button>
//         `;
//         divContainer.append(card);
//     });
// }

// ================ AREA KERANJANG ====================
const cartContainer = document.getElementById("cart-items");

function tambahkeranjang(data) {
    // console.log(id)
    // const produk = product.find(p => p.id === id);
    const cek = cart.find(item => item.id === data.id);

    const produk = {
        id: data.id,
        name :data.name,
        price : data.price,
        quantity : data.quantity,
    }

    console.log(produk);
    
    
    if (cek) {
        
        cek.quantity++;
        console.log(cek);
    } else {
        console.log({ ...produk, quantity: 1 })
        cart.push({ ...produk, quantity: 1 });
    }

    saveCart();
    updateKeranjang();
    updateBadge();
}

function updateKeranjang() {
    if (!cartContainer) return;

    cartContainer.innerHTML = "";

    if (cart.length === 0) {
        cartContainer.innerHTML = "<p>Keranjang kosong</p>";
        return;
    }

    
    cart.forEach(item => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "cart-item";
        itemDiv.innerHTML = `
            <h4>${item.name}</h4>
            <p>Rp ${item.price} x ${item.quantity}</p>
            <p>Total: Rp ${(item.price * item.quantity).toLocaleString()}</p>

            <button class="quantity-btn btn-minus" onclick="kurangiQty('${item.id}')">-</button>
            <button class="quantity-btn btn-plus" onclick="tambahQty('${item.id}')">+</button>
            <button class="btn-delete" onclick="hapusItem('${item.id}')">🗑</button>
        `;
        cartContainer.appendChild(itemDiv);
    });

    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const totalDiv = document.createElement("div");
    totalDiv.style.marginTop = "10px";
    totalDiv.style.fontWeight = "bold";
    totalDiv.innerText = `Total Pesanan: Rp ${total.toLocaleString()}`;
    cartContainer.appendChild(totalDiv);

    saveCart();
}

function tambahQty(id) {
    const item = cart.find(p => p.id === id);
    item.quantity++;
    saveCart();
    updateKeranjang();
    updateBadge();
}

function kurangiQty(id) {
    const index = cart.findIndex(p => p.id === id);

    if (cart[index].quantity > 1) {
        cart[index].quantity--;
    } else {
        cart.splice(index, 1);
    }

    saveCart();
    updateKeranjang();
    updateBadge();
}

function hapusItem(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateKeranjang();
    updateBadge();
}

// ================ PINDAH TRANSAKSI ==================
function checkoutToTransaksi() {
    if (cart.length === 0) {
        alert("Keranjang masih kosong!");
        return;
    }

    // Hitung jumlah dan total
    const jumlah = cart.reduce((a, b) => a + b.quantity, 0);
    const total = cart.reduce((a, b) => a + (b.price * b.quantity), 0);

    // Simpan ke LocalStorage untuk transaksi
    localStorage.setItem("transaksiJumlah", jumlah);
    localStorage.setItem("transaksiTotal", total);

    // Pindah ke halaman transaksi
    window.location.href = "transaksi.html";
}

// ================ LOAD AWAL ====================
loadCart();
updateKeranjang();
updateBadge();

// ================ Notifikasi ===================
window.onload = function () {
    if (localStorage.getItem("loginSuccess") === "true") {
        showToast("✔ Login berhasil — Selamat berbelanja!");
        localStorage.removeItem("loginSuccess");
    }
};

function showToast(msg) {
    let div = document.createElement("div");
    div.className = "notification";
    div.innerText = msg;
    document.body.appendChild(div);

    setTimeout(() => {
        div.remove();
    }, 3000);
}
