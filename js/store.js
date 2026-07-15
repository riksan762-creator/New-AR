/* ============================================================
   AR FASHION — Storefront Logic
   ============================================================ */
(function(){
  let activeCategory = 'Semua';
  let currentProduct = null; // for detail modal
  let pdSelection = { size: null, color: null, qty: 1 };
  let checkoutStep = 1;
  let checkoutData = { name:'', phone:'', address:'', payment:'transfer' };

  /* ---------- Toast ---------- */
  function toast(msg){
    const wrap = document.getElementById('toastWrap');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(()=>el.remove(), 300); }, 2600);
  }

  /* ---------- Card renderer ---------- */
  function productCard(p){
    return `
      <div class="product-card" data-id="${p.id}">
        <div class="product-thumb">
          ${p.featured ? '<span class="product-badge">Unggulan</span>' : ''}
          <img src="${p.images[0]}" alt="${p.name}">
          <button class="product-quick" data-quick="${p.id}" title="Tambah ke keranjang">+</button>
        </div>
        <div class="product-info">
          <div class="product-cat">${p.category}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-meta">
            <span class="product-price">${ARF.fmtRupiah(p.price)}</span>
            <span class="product-rating">★ ${p.rating} · ${p.sold} terjual</span>
          </div>
        </div>
      </div>`;
  }

  function renderFeatured(){
    const products = ARF.getProducts().filter(p => p.featured);
    document.getElementById('featuredGrid').innerHTML = products.map(productCard).join('') ||
      '<div class="empty-state">Belum ada produk unggulan.</div>';
  }

  function renderChips(){
    const cats = ['Semua', ...new Set(ARF.getProducts().map(p => p.category))];
    document.getElementById('chipRow').innerHTML = cats.map(c =>
      `<button class="chip ${c === activeCategory ? 'active' : ''}" data-cat="${c}">${c}</button>`
    ).join('');
  }

  function renderCatalog(){
    const all = ARF.getProducts();
    const filtered = activeCategory === 'Semua' ? all : all.filter(p => p.category === activeCategory);
    document.getElementById('catalogGrid').innerHTML = filtered.map(productCard).join('') ||
      '<div class="empty-state"><div class="em-icon">🧕</div>Belum ada produk di kategori ini.</div>';
  }

  function bindCardEvents(){
    document.querySelectorAll('[data-id]').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-quick]')) return;
        openProductModal(card.dataset.id);
      });
    });
    document.querySelectorAll('[data-quick]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = ARF.getProducts().find(x => x.id === btn.dataset.quick);
        if (!p) return;
        ARF.addToCart({ productId:p.id, name:p.name, price:p.price, image:p.images[0], size:p.sizes[0], color:p.colors[0], qty:1 });
        updateCartBadge();
        toast(`${p.name} ditambahkan ke keranjang`);
      });
    });
  }

  function refreshAll(){
    renderFeatured();
    renderChips();
    renderCatalog();
    bindCardEvents();
    bindChipEvents();
    updateCartBadge();
  }

  function bindChipEvents(){
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        activeCategory = chip.dataset.cat;
        renderChips(); renderCatalog(); bindCardEvents(); bindChipEvents();
      });
    });
  }

  /* ---------- Product Detail Modal ---------- */
  function openProductModal(id){
    const p = ARF.getProducts().find(x => x.id === id);
    if (!p) return;
    currentProduct = p;
    pdSelection = { size: p.sizes[0], color: p.colors[0], qty: 1 };
    document.getElementById('productModal').innerHTML = `
      <div class="modal-head">
        <h3>${p.name}</h3>
        <button class="modal-close" id="pdClose">✕</button>
      </div>
      <div class="modal-body pd-grid">
        <div class="pd-image"><img src="${p.images[0]}" alt="${p.name}"></div>
        <div>
          <div class="product-cat">${p.category}</div>
          <div class="product-price" style="font-size:22px; margin:8px 0;">${ARF.fmtRupiah(p.price)}</div>
          <p style="font-size:14px; color:#6b5560; line-height:1.6;">${p.desc}</p>
          <div style="font-size:13px; color:#8a7a83;">Stok tersedia: ${p.stock}</div>

          <div class="option-label">Ukuran</div>
          <div class="option-row" id="pdSizes">
            ${p.sizes.map(s => `<button class="opt-btn ${s===pdSelection.size?'active':''}" data-size="${s}">${s}</button>`).join('')}
          </div>

          <div class="option-label">Warna</div>
          <div class="option-row" id="pdColors">
            ${p.colors.map(c => `<button class="opt-btn ${c===pdSelection.color?'active':''}" data-color="${c}">${c}</button>`).join('')}
          </div>

          <div class="qty-row">
            <div class="qty-control">
              <button id="qtyMinus">–</button>
              <input type="text" id="qtyInput" value="1" readonly>
              <button id="qtyPlus">+</button>
            </div>
            <button class="btn btn-primary" id="pdAddCart" style="flex:1;">Tambah ke Keranjang</button>
          </div>
        </div>
      </div>`;
    openOverlay('productOverlay');

    document.getElementById('pdClose').onclick = () => closeOverlay('productOverlay');
    document.querySelectorAll('#pdSizes [data-size]').forEach(b => b.onclick = () => {
      pdSelection.size = b.dataset.size;
      document.querySelectorAll('#pdSizes .opt-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    });
    document.querySelectorAll('#pdColors [data-color]').forEach(b => b.onclick = () => {
      pdSelection.color = b.dataset.color;
      document.querySelectorAll('#pdColors .opt-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    });
    document.getElementById('qtyMinus').onclick = () => {
      pdSelection.qty = Math.max(1, pdSelection.qty - 1);
      document.getElementById('qtyInput').value = pdSelection.qty;
    };
    document.getElementById('qtyPlus').onclick = () => {
      pdSelection.qty = Math.min(p.stock, pdSelection.qty + 1);
      document.getElementById('qtyInput').value = pdSelection.qty;
    };
    document.getElementById('pdAddCart').onclick = () => {
      ARF.addToCart({ productId:p.id, name:p.name, price:p.price, image:p.images[0], size:pdSelection.size, color:pdSelection.color, qty:pdSelection.qty });
      updateCartBadge();
      toast(`${p.name} ditambahkan ke keranjang`);
      closeOverlay('productOverlay');
    };
  }

  /* ---------- Cart Drawer ---------- */
  function renderCart(){
    const cart = ARF.getCart();
    const wrap = document.getElementById('cartItemsWrap');
    if (!cart.length){
      wrap.innerHTML = `<div class="cart-empty"><div style="font-size:34px; margin-bottom:8px;">🛍️</div>Keranjang kamu masih kosong.</div>`;
    } else {
      wrap.innerHTML = cart.map((c, i) => `
        <div class="cart-item">
          <img src="${c.image}" alt="${c.name}">
          <div class="cart-item-info">
            <div class="name">${c.name}</div>
            <div class="opts">${c.size} · ${c.color}</div>
            <div class="cart-item-controls">
              <div class="qty-control">
                <button data-dec="${i}">–</button>
                <input type="text" value="${c.qty}" readonly>
                <button data-inc="${i}">+</button>
              </div>
              <span class="mono" style="font-weight:700; font-size:13.5px;">${ARF.fmtRupiah(c.price * c.qty)}</span>
            </div>
            <a href="#" class="remove-link" data-remove="${i}">Hapus</a>
          </div>
        </div>`).join('');
    }
    document.getElementById('cartSubtotal').textContent = ARF.fmtRupiah(ARF.cartTotal());
    wrap.querySelectorAll('[data-inc]').forEach(b => b.onclick = () => {
      const cart = ARF.getCart(); cart[b.dataset.inc].qty++; ARF.saveCart(cart); renderCart(); updateCartBadge();
    });
    wrap.querySelectorAll('[data-dec]').forEach(b => b.onclick = () => {
      const cart = ARF.getCart(); cart[b.dataset.dec].qty = Math.max(1, cart[b.dataset.dec].qty - 1); ARF.saveCart(cart); renderCart(); updateCartBadge();
    });
    wrap.querySelectorAll('[data-remove]').forEach(b => b.onclick = (e) => {
      e.preventDefault();
      const cart = ARF.getCart(); cart.splice(b.dataset.remove, 1); ARF.saveCart(cart); renderCart(); updateCartBadge();
    });
  }

  function updateCartBadge(){
    document.getElementById('cartCount').textContent = ARF.cartCount();
  }

  /* ---------- Overlay helpers ---------- */
  function openOverlay(id){ document.getElementById(id).classList.add('open'); document.body.style.overflow='hidden'; }
  function closeOverlay(id){ document.getElementById(id).classList.remove('open'); document.body.style.overflow=''; }

  /* ---------- Auth Modal ---------- */
  function renderAuthModal(){
    const user = ARF.currentCustomer();
    const modal = document.getElementById('authModal');
    if (user){
      const orders = ARF.ordersForUser(user.id);
      modal.innerHTML = `
        <div class="modal-head"><h3>Akun Saya</h3><button class="modal-close" id="authClose">✕</button></div>
        <div class="modal-body">
          <div style="margin-bottom:20px;">
            <div style="font-weight:700; font-size:16px;">${user.name}</div>
            <div style="font-size:13px; color:#8a7a83;">${user.email}</div>
          </div>
          <div class="option-label">Riwayat Pesanan</div>
          ${orders.length ? orders.map(o => `
            <div style="border:1px solid rgba(43,26,34,.1); border-radius:10px; padding:12px 14px; margin-bottom:10px;">
              <div style="display:flex; justify-content:space-between; font-size:13px;">
                <span class="mono">${o.id}</span>
                <span class="pill ${statusPill(o.status)}">${o.status}</span>
              </div>
              <div style="font-size:13px; margin-top:6px; color:#6b5560;">${o.items.length} produk · ${ARF.fmtRupiah(o.total)}</div>
            </div>
          `).join('') : '<div style="font-size:13.5px; color:#8a7a83;">Belum ada pesanan.</div>'}
          <button class="btn btn-outline btn-block" id="logoutBtn" style="margin-top:16px;">Keluar</button>
        </div>`;
      document.getElementById('logoutBtn').onclick = () => { ARF.logoutCustomer(); renderAuthModal(); toast('Berhasil keluar'); };
    } else {
      modal.innerHTML = `
        <div class="modal-head"><h3 id="authTitle">Masuk ke Akun</h3><button class="modal-close" id="authClose">✕</button></div>
        <div class="modal-body">
          <div id="authError"></div>
          <div id="authFormWrap"></div>
          <div class="demo-hint">
            <b>Akun Demo:</b><br>
            Pelanggan: demo@arfashion.id / demo123<br>
            Admin: buka <a href="admin.html" style="text-decoration:underline; color:var(--plum);">admin.html</a> — admin@arfashion.id / admin123
          </div>
        </div>`;
      renderLoginForm();
    }
    document.getElementById('authClose').onclick = () => closeOverlay('authOverlay');
  }

  function statusPill(status){
    if (status.includes('Selesai')) return 'pill-success';
    if (status.includes('Batal')) return 'pill-danger';
    if (status.includes('Dikirim') || status.includes('Diproses')) return 'pill-info';
    return 'pill-warn';
  }

  function renderLoginForm(){
    document.getElementById('authTitle').textContent = 'Masuk ke Akun';
    document.getElementById('authFormWrap').innerHTML = `
      <div class="field"><label>Email</label><input type="email" id="loginEmail" placeholder="nama@email.com"></div>
      <div class="field"><label>Kata Sandi</label><input type="password" id="loginPassword" placeholder="••••••••"></div>
      <button class="btn btn-primary btn-block" id="loginSubmit">Masuk</button>
      <p class="form-note">Belum punya akun? <a href="#" id="toRegister" style="color:var(--plum); font-weight:700;">Daftar di sini</a></p>`;
    document.getElementById('toRegister').onclick = (e) => { e.preventDefault(); renderRegisterForm(); };
    document.getElementById('loginSubmit').onclick = () => {
      const email = document.getElementById('loginEmail').value.trim();
      const pass = document.getElementById('loginPassword').value;
      const res = ARF.loginCustomer(email, pass);
      if (res.error) showAuthError(res.error);
      else { toast(`Selamat datang, ${res.user.name.split(' ')[0]}!`); renderAuthModal(); }
    };
  }

  function renderRegisterForm(){
    document.getElementById('authTitle').textContent = 'Buat Akun Baru';
    document.getElementById('authFormWrap').innerHTML = `
      <div class="field"><label>Nama Lengkap</label><input type="text" id="regName" placeholder="Nama kamu"></div>
      <div class="field"><label>Email</label><input type="email" id="regEmail" placeholder="nama@email.com"></div>
      <div class="field"><label>No. HP</label><input type="text" id="regPhone" placeholder="0812xxxxxxx"></div>
      <div class="field"><label>Kata Sandi</label><input type="password" id="regPassword" placeholder="Minimal 6 karakter"></div>
      <button class="btn btn-primary btn-block" id="regSubmit">Daftar</button>
      <p class="form-note">Sudah punya akun? <a href="#" id="toLogin" style="color:var(--plum); font-weight:700;">Masuk di sini</a></p>`;
    document.getElementById('toLogin').onclick = (e) => { e.preventDefault(); renderLoginForm(); };
    document.getElementById('regSubmit').onclick = () => {
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const phone = document.getElementById('regPhone').value.trim();
      const password = document.getElementById('regPassword').value;
      if (!name || !email || password.length < 6) return showAuthError('Lengkapi form dengan benar. Kata sandi minimal 6 karakter.');
      const res = ARF.registerUser({ name, email, password, phone });
      if (res.error) showAuthError(res.error);
      else {
        ARF.loginCustomer(email, password);
        toast('Akun berhasil dibuat!');
        renderAuthModal();
      }
    };
  }

  function showAuthError(msg){
    document.getElementById('authError').innerHTML = `<div class="form-error">${msg}</div>`;
  }

  /* ---------- Checkout Flow ---------- */
  function openCheckout(){
    if (!ARF.getCart().length) { toast('Keranjang masih kosong'); return; }
    if (!ARF.currentCustomer()){
      closeOverlay('cartOverlay');
      renderAuthModal();
      openOverlay('authOverlay');
      toast('Masuk dulu untuk checkout ya');
      return;
    }
    checkoutStep = 1;
    const user = ARF.currentCustomer();
    checkoutData = { name: user.name, phone: user.phone || '', address: user.address || '', payment: 'transfer' };
    closeOverlay('cartOverlay');
    renderCheckout();
    openOverlay('checkoutOverlay');
  }

  function stepsHtml(){
    const labels = ['Alamat', 'Pembayaran', 'Konfirmasi'];
    return `<div class="steps-row">` + labels.map((l, i) => {
      const n = i + 1;
      const dot = `<div class="step-dot ${checkoutStep >= n ? 'active':''}">${n}</div>`;
      const line = i < labels.length - 1 ? `<div class="step-line ${checkoutStep > n ? 'active':''}"></div>` : '';
      return dot + line;
    }).join('') + `</div>`;
  }

  function renderCheckout(){
    const modal = document.getElementById('checkoutModal');
    if (checkoutStep === 1){
      modal.innerHTML = `
        <div class="modal-head"><h3>Checkout</h3><button class="modal-close" id="coClose">✕</button></div>
        <div class="modal-body">
          ${stepsHtml()}
          <div id="coError"></div>
          <div class="field"><label>Nama Penerima</label><input id="coName" value="${checkoutData.name}"></div>
          <div class="field"><label>No. HP</label><input id="coPhone" value="${checkoutData.phone}"></div>
          <div class="field"><label>Alamat Lengkap</label><textarea id="coAddress" placeholder="Nama jalan, no rumah, kota, kode pos">${checkoutData.address}</textarea></div>
          <button class="btn btn-primary btn-block" id="coNext1">Lanjut ke Pembayaran</button>
        </div>`;
      document.getElementById('coNext1').onclick = () => {
        const name = document.getElementById('coName').value.trim();
        const phone = document.getElementById('coPhone').value.trim();
        const address = document.getElementById('coAddress').value.trim();
        if (!name || !phone || !address){
          document.getElementById('coError').innerHTML = `<div class="form-error">Lengkapi semua data alamat pengiriman.</div>`;
          return;
        }
        checkoutData = { ...checkoutData, name, phone, address };
        checkoutStep = 2;
        renderCheckout();
      };
    } else if (checkoutStep === 2){
      const cart = ARF.getCart();
      const subtotal = ARF.cartTotal();
      const shipping = 12000;
      modal.innerHTML = `
        <div class="modal-head"><h3>Checkout</h3><button class="modal-close" id="coClose">✕</button></div>
        <div class="modal-body">
          ${stepsHtml()}
          <div class="option-label">Metode Pembayaran</div>
          <label class="pay-option"><input type="radio" name="pay" value="transfer" checked> <div><b>Transfer Bank</b><div style="font-size:12px; color:#8a7a83;">BCA / Mandiri / BNI</div></div></label>
          <label class="pay-option"><input type="radio" name="pay" value="ewallet"> <div><b>E-Wallet</b><div style="font-size:12px; color:#8a7a83;">GoPay / OVO / DANA</div></div></label>
          <label class="pay-option"><input type="radio" name="pay" value="cod"> <div><b>Bayar di Tempat (COD)</b><div style="font-size:12px; color:#8a7a83;">Bayar saat barang sampai</div></div></label>

          <div class="option-label" style="margin-top:20px;">Ringkasan Pesanan</div>
          <div style="border:1px solid rgba(43,26,34,.1); border-radius:10px; padding:14px;">
            ${cart.map(c => `<div class="order-summary-line"><span>${c.name} x${c.qty}</span><span class="mono">${ARF.fmtRupiah(c.price*c.qty)}</span></div>`).join('')}
            <hr style="border:none; border-top:1px solid rgba(43,26,34,.1); margin:8px 0;">
            <div class="order-summary-line"><span>Subtotal</span><span class="mono">${ARF.fmtRupiah(subtotal)}</span></div>
            <div class="order-summary-line"><span>Ongkos Kirim</span><span class="mono">${ARF.fmtRupiah(shipping)}</span></div>
            <div class="order-summary-line" style="font-weight:700; font-size:16px;"><span>Total</span><span class="mono">${ARF.fmtRupiah(subtotal+shipping)}</span></div>
          </div>
          <div style="display:flex; gap:10px; margin-top:18px;">
            <button class="btn btn-outline" id="coBack" style="flex:1;">Kembali</button>
            <button class="btn btn-primary" id="coNext2" style="flex:2;">Buat Pesanan</button>
          </div>
        </div>`;
      document.getElementById('coBack').onclick = () => { checkoutStep = 1; renderCheckout(); };
      document.getElementById('coNext2').onclick = () => {
        const payment = modal.querySelector('input[name="pay"]:checked').value;
        checkoutData.payment = payment;
        const user = ARF.currentCustomer();
        const order = ARF.createOrder({
          userId: user.id,
          items: cart.map(c => ({ productId:c.productId, name:c.name, qty:c.qty, price:c.price, image:c.image, size:c.size, color:c.color })),
          total: subtotal + shipping,
          shipping,
          payment,
          receiver: { name: checkoutData.name, phone: checkoutData.phone, address: checkoutData.address }
        });
        ARF.clearCart();
        updateCartBadge();
        checkoutStep = 3;
        renderCheckout(order);
      };
    } else if (checkoutStep === 3){
      const order = arguments[1] || {};
      modal.innerHTML = `
        <div class="modal-head"><h3>Checkout</h3><button class="modal-close" id="coClose">✕</button></div>
        <div class="modal-body">
          ${stepsHtml()}
          <div class="confirm-box">
            <div class="confirm-icon">✅</div>
            <h3 style="margin-bottom:6px;">Pesanan Berhasil Dibuat!</h3>
            <p style="color:#6b5560; font-size:14px;">Terima kasih, ${order.receiver ? order.receiver.name : ''}. Simpan kode pesanan berikut untuk pelacakan.</p>
            <div class="order-code">${order.id || ''}</div>
            <p style="font-size:13.5px; color:#8a7a83;">Total pembayaran: <b class="mono">${ARF.fmtRupiah(order.total || 0)}</b><br>Metode: ${paymentLabel(order.payment)}</p>
            <button class="btn btn-primary btn-block" id="coFinish" style="margin-top:18px;">Selesai</button>
          </div>
        </div>`;
      document.getElementById('coFinish').onclick = () => closeOverlay('checkoutOverlay');
    }
    const closeBtn = document.getElementById('coClose');
    if (closeBtn) closeBtn.onclick = () => closeOverlay('checkoutOverlay');
  }

  function paymentLabel(p){
    return { transfer:'Transfer Bank', ewallet:'E-Wallet', cod:'Bayar di Tempat (COD)' }[p] || p;
  }

  /* ---------- Wire up global buttons ---------- */
  document.getElementById('cartBtn').addEventListener('click', () => { renderCart(); openOverlayDrawer(); });
  document.getElementById('closeCart').addEventListener('click', closeDrawer);
  document.getElementById('cartOverlay').addEventListener('click', (e) => { if (e.target.id === 'cartOverlay') closeDrawer(); });
  document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
  document.getElementById('accountBtn').addEventListener('click', () => { renderAuthModal(); openOverlay('authOverlay'); });
  document.getElementById('footerAccountLink').addEventListener('click', (e) => { e.preventDefault(); renderAuthModal(); openOverlay('authOverlay'); });
  document.getElementById('productOverlay').addEventListener('click', (e) => { if (e.target.id === 'productOverlay') closeOverlay('productOverlay'); });
  document.getElementById('authOverlay').addEventListener('click', (e) => { if (e.target.id === 'authOverlay') closeOverlay('authOverlay'); });
  document.getElementById('checkoutOverlay').addEventListener('click', (e) => { if (e.target.id === 'checkoutOverlay') closeOverlay('checkoutOverlay'); });
  document.getElementById('mobileToggle').addEventListener('click', () => {
    const nav = document.getElementById('mobileNav');
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
  });

  function openOverlayDrawer(){ document.getElementById('cartOverlay').classList.add('open'); document.body.style.overflow='hidden'; }
  function closeDrawer(){ document.getElementById('cartOverlay').classList.remove('open'); document.body.style.overflow=''; }

  refreshAll();
})();
