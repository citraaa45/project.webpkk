// ===================== DATA PRODUK =====================
const product = [
    { id: "1", name: "Rice Bowl Chicken Katsu", image: "katsu.png", price: 12000 }
];

// ===================== KERANJANG =====================
let cart = [];

function saveCart() {
    localStorage.setItem("cartData", JSON.stringify(cart));
}
function loadCart() {
    cart = JSON.parse(localStorage.getItem("cartData")) || [];
}

// ===================== TAMPIL PRODUK =====================
const list = document.getElementById("product-list");

if (list) {
    product.forEach(p => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <h3>${p.name}</h3>
            <p>Harga: Rp ${p.price.toLocaleString()}</p>
            <button onclick="addCart('${p.id}')">Tambah ke Keranjang</button>
        `;
        list.appendChild(card);
    });
}

// ===================== FUNGSI KERANJANG =====================
const cartArea = document.getElementById("cart-items");

function addCart(id) {
    const p = product.find(x => x.id === id);
    const cek = cart.find(x => x.id === id);

    if (cek) cek.quantity++;
    else cart.push({ ...p, quantity: 1 });

    saveCart();
    showCart();
}

function showCart() {
    if (!cartArea) return;

    cartArea.innerHTML = "";

    if (cart.length === 0) {
        cartArea.innerHTML = "<p>Keranjang kosong</p>";
        return;
    }

    cart.forEach(item => {
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <h4>${item.name}</h4>
            <p>Rp ${item.price.toLocaleString()} x ${item.quantity}</p>
            <button class="btn-minus" onclick="minusQty('${item.id}')">-</button>
            <button class="btn-plus" onclick="plusQty('${item.id}')">+</button>
            <button class="btn-delete" onclick="deleteItem('${item.id}')">Hapus</button>
        `;
        cartArea.appendChild(div);
    });

    saveCart();
}

function plusQty(id) {
    const x = cart.find(i => i.id === id);
    x.quantity++;
    saveCart();
    showCart();
}

function minusQty(id) {
    const index = cart.findIndex(i => i.id === id);

    if (cart[index].quantity > 1) cart[index].quantity--;
    else cart.splice(index, 1);

    saveCart();
    showCart();
}

function deleteItem(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    showCart();
}

// ===================== PINDAH KE TRANSAKSI =====================
function goTransaksi() {
    window.location.href = "transaksi.html";
}

// ===================== LOAD =====================
loadCart();
showCart();