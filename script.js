// ================ SLIDE CART PANEL ==================
function toggleCart() {
    document.getElementById("side-cart").classList.toggle("open");
}

// ================ BADGE JUMLAH KERANJANG ==================
function updateBadge() {
    const badge = document.getElementById("cart-badge");
    const totalQty = cart.reduce((a, b) => a + b.quantity, 0);

    if (totalQty > 0) {
        badge.style.display = "block";
        badge.innerText = totalQty;
    } else {
        badge.style.display = "none";
        badge.innerText = "0";
    }
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


// ================ TAMPILKAN PRODUK ==================
const divContainer = document.getElementById("product-list");

if (divContainer) {
    product.forEach(function (data) {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <img src="${data.image}" alt="${data.name}">
            <h1>${data.name}</h1>
            <p>Harga: Rp ${data.price.toLocaleString()}</p>

            <button class="btn-keranjang" onclick="tambahkeranjang('${data.id}')">
                Simpan ke Keranjang
            </button>
        `;
        divContainer.append(card);
    });
}


// ================ AREA KERANJANG ====================
const cartContainer = document.getElementById("cart-items");

function tambahkeranjang(id) {
    const produk = product.find(p => p.id === id);
    const cek = cart.find(item => item.id === id);

    if (cek) {
        cek.quantity++;
    } else {
        cart.push({
            ...produk,
            quantity: 1
        });
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
            <p>Rp ${item.price.toLocaleString()} x ${item.quantity}</p>
            <p>Total: Rp ${(item.price * item.quantity).toLocaleString()}</p>

            <div>
                <button class="btn-minus" onclick="kurangiQty('${item.id}')">-</button>
                <button class="btn-plus" onclick="tambahQty('${item.id}')">+</button>
                <button class="btn-delete" onclick="hapusItem('${item.id}')">🗑️</button>            </div>
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

// ================ CHECKOUT WHATSAPP ====================
function CheckoutToWhatsapp() {
    let pesan = "Halo kak, saya mau pesan:\n";

    cart.forEach((item, index) => {
        pesan += `${index + 1}. ${item.name} x ${item.quantity}\n`;
    });

    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    pesan += `Total: Rp ${total.toLocaleString()}`;

    const encoded = encodeURIComponent(pesan);
    window.open(`https://wa.me/6289650022527?text=${encoded}`, "_blank");
}


// ================ LOAD AWAL ====================
loadCart();
updateKeranjang();
updateBadge();
