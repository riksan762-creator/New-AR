/* ============================================================
   AR FASHION — Shared Data Layer
   All storage is localStorage-based. Keys prefixed with "arf_"
   ============================================================ */

const ARF = {
  KEYS: {
    PRODUCTS: 'arf_products',
    USERS: 'arf_users',
    ORDERS: 'arf_orders',
    SESSION: 'arf_session',
    ADMIN_SESSION: 'arf_admin_session',
    CART: 'arf_cart',
    SEEDED: 'arf_seeded_v1'
  },

  fmtRupiah(n) {
    return 'Rp ' + Math.round(n).toLocaleString('id-ID');
  },

  uid(prefix) {
    return (prefix || 'ID') + '-' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random()*900+100);
  },

  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : (fallback ?? null);
    } catch (e) { return fallback ?? null; }
  },

  write(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },

  /* ---------------- SEED ---------------- */
  seed() {
    if (localStorage.getItem(this.KEYS.SEEDED)) return;

    const swatch = (bg, fg, text) =>
      `https://placehold.co/600x760/${bg}/${fg}?text=${encodeURIComponent(text)}&font=raleway`;

    const products = [
      {
        id: this.uid('PRD'), name: 'Pashmina Ceruty Diamond', category: 'Pashmina',
        price: 89000, stock: 42, sizes: ['All Size'], colors: ['Dusty Rose','Ivory','Sage','Mocha'],
        images: [swatch('4A2338','F3E9DC','Pashmina+Ceruty')],
        desc: 'Pashmina ceruty diamond dengan jatuhan lembut dan adem, cocok untuk harian maupun acara formal.',
        featured: true, rating: 4.8, sold: 312
      },
      {
        id: this.uid('PRD'), name: 'Hijab Segi Empat Voal Premium', category: 'Segi Empat',
        price: 65000, stock: 58, sizes: ['110x110 cm'], colors: ['Maroon','Navy','Cream','Black'],
        images: [swatch('B98B4E','2B1A22','Voal+Premium')],
        desc: 'Voal premium ringan, tidak menerawang, dengan finishing jahit rapi di setiap sisi.',
        featured: true, rating: 4.7, sold: 540
      },
      {
        id: this.uid('PRD'), name: 'Bergo Instan Syar\'i 2 Layer', category: 'Bergo',
        price: 75000, stock: 30, sizes: ['M','L','XL'], colors: ['Black','Olive','Dusty Rose'],
        images: [swatch('C98B93','2B1A22','Bergo+Instan')],
        desc: 'Bergo instan dua layer, praktis dipakai tanpa peniti, cocok untuk aktivitas sehari-hari.',
        featured: true, rating: 4.6, sold: 201
      },
      {
        id: this.uid('PRD'), name: 'Pashmina Silk Satin', category: 'Pashmina',
        price: 110000, stock: 25, sizes: ['All Size'], colors: ['Champagne','Emerald','Wine'],
        images: [swatch('2B1A22','B98B4E','Silk+Satin')],
        desc: 'Bahan silk satin mengkilap elegan, pilihan tepat untuk acara spesial dan pesta.',
        featured: false, rating: 4.9, sold: 178
      },
      {
        id: this.uid('PRD'), name: 'Hijab Segi Empat Katun Ceruty', category: 'Segi Empat',
        price: 55000, stock: 70, sizes: ['110x110 cm'], colors: ['Terracotta','Mustard','Grey'],
        images: [swatch('F3E9DC','4A2338','Katun+Ceruty')],
        desc: 'Katun ceruty adem dan menyerap keringat, ideal untuk pemakaian harian di iklim tropis.',
        featured: false, rating: 4.5, sold: 402
      },
      {
        id: this.uid('PRD'), name: 'Bergo Rajut Serut', category: 'Bergo',
        price: 68000, stock: 20, sizes: ['All Size'], colors: ['Black','Brown'],
        images: [swatch('4A2338','C98B93','Bergo+Rajut')],
        desc: 'Bergo rajut dengan serut belakang, memberi bentuk wajah yang rapi dan modis.',
        featured: false, rating: 4.4, sold: 95
      },
      {
        id: this.uid('PRD'), name: 'Inner Ninja Antem Premium', category: 'Aksesoris',
        price: 25000, stock: 100, sizes: ['All Size'], colors: ['Black','White','Beige'],
        images: [swatch('B98B4E','F3E9DC','Inner+Ninja')],
        desc: 'Inner ninja anti tembus pandang, bahan lembut menyerap keringat.',
        featured: false, rating: 4.6, sold: 620
      },
      {
        id: this.uid('PRD'), name: 'Peniti Hijab Set Magnet', category: 'Aksesoris',
        price: 18000, stock: 150, sizes: ['-'], colors: ['Gold','Silver'],
        images: [swatch('2B1A22','B98B4E','Peniti+Magnet')],
        desc: 'Set peniti magnet anti karat, aman untuk bahan hijab tipis sekalipun.',
        featured: false, rating: 4.3, sold: 288
      }
    ];

    const users = [
      {
        id: this.uid('USR'), name: 'Admin AR Fashion', email: 'admin@arfashion.id',
        password: 'admin123', role: 'admin', createdAt: new Date().toISOString()
      },
      {
        id: this.uid('USR'), name: 'Sun (Demo Customer)', email: 'demo@arfashion.id',
        password: 'demo123', role: 'customer', phone: '081234567890',
        address: 'Jl. Melati No. 12, Bandung, Jawa Barat', createdAt: new Date().toISOString()
      }
    ];

    this.write(this.KEYS.PRODUCTS, products);
    this.write(this.KEYS.USERS, users);
    this.write(this.KEYS.ORDERS, []);
    localStorage.setItem(this.KEYS.SEEDED, '1');
  },

  /* ---------------- PRODUCTS ---------------- */
  getProducts() { return this.read(this.KEYS.PRODUCTS, []); },
  saveProducts(list) { this.write(this.KEYS.PRODUCTS, list); },
  addProduct(p) {
    const list = this.getProducts();
    p.id = this.uid('PRD');
    p.rating = p.rating || 5.0;
    p.sold = p.sold || 0;
    list.unshift(p);
    this.saveProducts(list);
    return p;
  },
  updateProduct(id, patch) {
    const list = this.getProducts();
    const idx = list.findIndex(x => x.id === id);
    if (idx > -1) { list[idx] = { ...list[idx], ...patch }; this.saveProducts(list); }
  },
  deleteProduct(id) {
    this.saveProducts(this.getProducts().filter(x => x.id !== id));
  },

  /* ---------------- USERS ---------------- */
  getUsers() { return this.read(this.KEYS.USERS, []); },
  saveUsers(list) { this.write(this.KEYS.USERS, list); },
  findUserByEmail(email) {
    return this.getUsers().find(u => u.email.toLowerCase() === String(email).toLowerCase());
  },
  registerUser({ name, email, password, phone }) {
    if (this.findUserByEmail(email)) return { error: 'Email sudah terdaftar.' };
    const user = { id: this.uid('USR'), name, email, password, phone: phone || '', address: '', role: 'customer', createdAt: new Date().toISOString() };
    const list = this.getUsers(); list.push(user); this.saveUsers(list);
    return { user };
  },
  loginCustomer(email, password) {
    const u = this.findUserByEmail(email);
    if (!u || u.password !== password || u.role !== 'customer') return { error: 'Email atau kata sandi salah.' };
    this.write(this.KEYS.SESSION, { userId: u.id });
    return { user: u };
  },
  loginAdmin(email, password) {
    const u = this.findUserByEmail(email);
    if (!u || u.password !== password || u.role !== 'admin') return { error: 'Email atau kata sandi salah, atau bukan akun admin.' };
    this.write(this.KEYS.ADMIN_SESSION, { userId: u.id });
    return { user: u };
  },
  currentCustomer() {
    const s = this.read(this.KEYS.SESSION, null);
    if (!s) return null;
    return this.getUsers().find(u => u.id === s.userId) || null;
  },
  currentAdmin() {
    const s = this.read(this.KEYS.ADMIN_SESSION, null);
    if (!s) return null;
    return this.getUsers().find(u => u.id === s.userId) || null;
  },
  logoutCustomer() { localStorage.removeItem(this.KEYS.SESSION); },
  logoutAdmin() { localStorage.removeItem(this.KEYS.ADMIN_SESSION); },

  /* ---------------- CART ---------------- */
  getCart() { return this.read(this.KEYS.CART, []); },
  saveCart(cart) { this.write(this.KEYS.CART, cart); },
  addToCart(item) {
    const cart = this.getCart();
    const existing = cart.find(c => c.productId === item.productId && c.size === item.size && c.color === item.color);
    if (existing) existing.qty += item.qty;
    else cart.push(item);
    this.saveCart(cart);
    return cart;
  },
  cartCount() { return this.getCart().reduce((s, c) => s + c.qty, 0); },
  cartTotal() { return this.getCart().reduce((s, c) => s + c.qty * c.price, 0); },
  clearCart() { this.saveCart([]); },

  /* ---------------- ORDERS ---------------- */
  getOrders() { return this.read(this.KEYS.ORDERS, []); },
  saveOrders(list) { this.write(this.KEYS.ORDERS, list); },
  createOrder(order) {
    const list = this.getOrders();
    order.id = this.uid('ORD');
    order.status = 'Menunggu Pembayaran';
    order.createdAt = new Date().toISOString();
    list.unshift(order);
    this.saveOrders(list);
    return order;
  },
  updateOrderStatus(id, status) {
    const list = this.getOrders();
    const idx = list.findIndex(o => o.id === id);
    if (idx > -1) { list[idx].status = status; this.saveOrders(list); }
  },
  ordersForUser(userId) {
    return this.getOrders().filter(o => o.userId === userId);
  }
};

ARF.seed();
