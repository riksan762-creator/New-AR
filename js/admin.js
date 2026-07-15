/* ============================================================
   AR FASHION — Admin Panel Logic (v2, refined UI)
   ============================================================ */
(function(){
  let currentPage = 'dashboard';
  let tempImage = null;
  let productSearch = '';
  let productCatFilter = 'Semua';
  let orderSearch = '';
  let orderStatusFilter = 'Semua';

  function toast(msg){
    const wrap = document.getElementById('toastWrap');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(()=>el.remove(), 300); }, 2600);
  }

  function initials(name){
    return (name || '?').trim().split(/\s+/).slice(0,2).map(w => w[0]).join('').toUpperCase();
  }

  function render(){
    const admin = ARF.currentAdmin();
    if (!admin) renderLogin();
    else renderShell();
  }

  /* ---------------- LOGIN ---------------- */
  function renderLogin(){
    document.getElementById('app').innerHTML = `
      <div class="login-shell">
        <div class="login-card">
          <div class="sidebar-logo-row" style="margin-bottom:18px;">
            <div class="sidebar-logo-mark">AR</div>
            <div>
              <div style="font-family:var(--font-display); font-weight:700; font-size:19px; color:var(--plum); line-height:1.1;">AR Fashion</div>
              <div style="font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#8a7a83;">Admin Panel</div>
            </div>
          </div>
          <div id="loginError"></div>
          <div class="field"><label>Email</label><input type="email" id="adminEmail" placeholder="admin@arfashion.id"></div>
          <div class="field"><label>Kata Sandi</label><input type="password" id="adminPassword" placeholder="••••••••"></div>
          <button class="btn btn-primary btn-block" id="adminLoginBtn">Masuk ke Admin</button>
          <div class="demo-hint">
            <b>Akun Demo Admin:</b><br>
            admin@arfashion.id / admin123
          </div>
          <p class="form-note"><a href="index.html" style="color:var(--plum); font-weight:700;">← Kembali ke Toko</a></p>
        </div>
      </div>`;
    document.getElementById('adminLoginBtn').onclick = () => {
      const email = document.getElementById('adminEmail').value.trim();
      const pass = document.getElementById('adminPassword').value;
      const res = ARF.loginAdmin(email, pass);
      if (res.error){
        document.getElementById('loginError').innerHTML = `<div class="form-error">${res.error}</div>`;
      } else {
        toast('Login berhasil, selamat datang!');
        render();
      }
    };
    document.getElementById('adminPassword').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('adminLoginBtn').click();
    });
  }

  /* ---------------- SHELL ---------------- */
  const NAV = [
    { key:'dashboard', label:'Dashboard', icon:'📊' },
    { key:'products', label:'Produk', icon:'👗' },
    { key:'orders', label:'Pesanan', icon:'📦' },
    { key:'users', label:'Pengguna', icon:'👥' },
  ];

  function renderShell(){
    const admin = ARF.currentAdmin();
    document.getElementById('app').innerHTML = `
      <div class="admin-shell">
        <aside class="admin-sidebar">
          <div class="sidebar-logo-row">
            <div class="sidebar-logo-mark">AR</div>
            <div>
              <div class="admin-brand" style="font-size:18px; margin:0;">Fashion</div>
              <div class="admin-role" style="margin:0;">Admin Panel</div>
            </div>
          </div>
          <div class="nav-section-label">Menu</div>
          <nav class="admin-nav">
            ${NAV.map(n => `<button data-page="${n.key}"><span class="nav-ic">${n.icon}</span> ${n.label}</button>`).join('')}
          </nav>
          <div class="sidebar-user-card">
            <div class="avatar">${initials(admin.name)}</div>
            <div style="min-width:0;">
              <div style="font-size:13px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${admin.name}</div>
              <div style="font-size:11px; opacity:.6;">Administrator</div>
            </div>
          </div>
          <button class="btn btn-outline btn-sm btn-block" id="adminLogout" style="border-color:rgba(251,247,241,.4); color:var(--cream);">↪ Keluar</button>
        </aside>
        <div class="admin-main">
          <div class="admin-topbar">
            <button class="topbar-menu-btn">☰</button>
            <div class="topbar-search"><input type="text" placeholder="Cari produk, pesanan, pengguna..."></div>
            <div class="topbar-actions">
              <button class="topbar-icon-btn">🔔<span class="topbar-dot"></span></button>
              <div class="avatar avatar-sm topbar-avatar">${initials(admin.name)}</div>
            </div>
          </div>
          <div class="main-scroll" id="mainContent"></div>
        </div>
      </div>`;
    document.querySelectorAll('.admin-nav button').forEach(b => {
      b.addEventListener('click', () => { currentPage = b.dataset.page; renderMain(); });
    });
    document.getElementById('adminLogout').addEventListener('click', () => {
      ARF.logoutAdmin(); render();
    });
    renderMain();
  }

  function renderMain(){
    document.querySelectorAll('.admin-nav button').forEach(b => b.classList.toggle('active', b.dataset.page === currentPage));
    closeAllDropdowns();
    if (currentPage === 'dashboard') renderDashboard();
    else if (currentPage === 'products') renderProducts();
    else if (currentPage === 'orders') renderOrders();
    else if (currentPage === 'users') renderUsers();
  }

  /* ---------------- Reusable: ellipsis dropdown ---------------- */
  function closeAllDropdowns(){
    document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) closeAllDropdowns();
  });

  function bindDropdown(triggerEl){
    triggerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = triggerEl.nextElementSibling;
      const isOpen = menu.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) menu.classList.add('open');
    });
  }

  function dropdownMenuHtml(id, items){
    return `<div class="dropdown-menu" id="${id}">
      ${items.map((it, i) => it.divider ? '<div class="dropdown-divider"></div>' :
        `<button class="dropdown-item ${it.danger?'danger':''}" data-action="${id}-${i}">${it.icon||''} ${it.label}</button>`).join('')}
    </div>`;
  }

  /* ---------------- DASHBOARD ---------------- */
  function renderDashboard(){
    const products = ARF.getProducts();
    const orders = ARF.getOrders();
    const users = ARF.getUsers().filter(u => u.role === 'customer');
    const revenue = orders.filter(o => !o.status.includes('Batal')).reduce((s,o) => s + o.total, 0);
    const lowStock = products.filter(p => p.stock <= 15).length;

    document.getElementById('mainContent').innerHTML = `
      <div class="page-topbar">
        <div class="page-topbar-top">
          <div>
            <h2>Dashboard</h2>
            <div class="page-subtitle">Ringkasan performa toko AR Fashion hari ini</div>
          </div>
        </div>
      </div>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-card-top"><div class="stat-icon ic-plum">👗</div><span class="stat-trend">Total</span></div>
          <div class="label">Total Produk</div>
          <div class="value">${products.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-top"><div class="stat-icon ic-gold">📦</div><span class="stat-trend">${orders.length} pesanan</span></div>
          <div class="label">Total Pesanan</div>
          <div class="value">${orders.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-top"><div class="stat-icon ic-success">💰</div><span class="stat-trend">Bersih</span></div>
          <div class="label">Pendapatan</div>
          <div class="value" style="font-size:19px;">${ARF.fmtRupiah(revenue)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-top"><div class="stat-icon ic-rose">👥</div><span class="stat-trend">Terdaftar</span></div>
          <div class="label">Pelanggan</div>
          <div class="value">${users.length}</div>
        </div>
      </div>
      ${lowStock ? `<div class="form-error" style="margin-bottom:20px;">⚠️ ${lowStock} produk stoknya menipis (≤15). Cek halaman Produk untuk restock.</div>` : ''}
      <div class="panel">
        <div class="panel-head"><h3>Pesanan Terbaru</h3><button class="btn btn-ghost btn-sm" id="goOrders">Lihat semua →</button></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Kode</th><th>Pelanggan</th><th>Total</th><th>Status</th><th>Tanggal</th></tr></thead>
            <tbody>
              ${orders.slice(0,6).map(o => `
                <tr>
                  <td class="mono">${o.id}</td>
                  <td>${o.receiver ? o.receiver.name : '-'}</td>
                  <td class="mono">${ARF.fmtRupiah(o.total)}</td>
                  <td><span class="pill ${statusPill(o.status)}">${o.status}</span></td>
                  <td>${formatDate(o.createdAt)}</td>
                </tr>`).join('') || `<tr><td colspan="5" style="text-align:center; color:#8a7a83; padding:24px;">Belum ada pesanan.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;
    document.getElementById('goOrders').onclick = () => { currentPage = 'orders'; renderMain(); };
  }

  function statusPill(status){
    if (status.includes('Selesai')) return 'pill-success';
    if (status.includes('Batal')) return 'pill-danger';
    if (status.includes('Dikirim') || status.includes('Diproses')) return 'pill-info';
    return 'pill-warn';
  }

  function formatDate(iso){
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' });
  }

  /* ---------------- PRODUCTS ---------------- */
  function renderProducts(){
    const all = ARF.getProducts();
    const cats = ['Semua', ...new Set(all.map(p => p.category))];
    const products = all.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
      const matchCat = productCatFilter === 'Semua' || p.category === productCatFilter;
      return matchSearch && matchCat;
    });

    document.getElementById('mainContent').innerHTML = `
      <div class="page-topbar">
        <div class="page-topbar-top">
          <div>
            <h2>Produk</h2>
            <div class="page-subtitle">${all.length} produk terdaftar di katalog</div>
          </div>
          <button class="btn btn-gold" id="addProductBtn">+ Tambah Produk</button>
        </div>
        <div class="toolbar-row">
          <div class="search-box"><input type="text" id="productSearchInput" placeholder="Cari nama produk..." value="${productSearch}"></div>
          <select class="filter-select" id="productCatFilter">
            ${cats.map(c => `<option value="${c}" ${c===productCatFilter?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Unggulan</th><th></th></tr></thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                      <img class="t-thumb" src="${p.images[0]}" alt="${p.name}">
                      <div>
                        <div class="cell-name">${p.name}</div>
                        <div class="cell-sub">${p.sold || 0} terjual · ★ ${p.rating || 5.0}</div>
                      </div>
                    </div>
                  </td>
                  <td>${p.category}</td>
                  <td class="mono">${ARF.fmtRupiah(p.price)}</td>
                  <td>${p.stock <= 15 ? `<span class="pill pill-danger">${p.stock} sisa</span>` : p.stock}</td>
                  <td>${p.featured ? '<span class="pill pill-success">Ya</span>' : '<span class="pill pill-warn">Tidak</span>'}</td>
                  <td>
                    <div class="dropdown">
                      <button class="ellipsis-btn" data-trigger="prod-${p.id}">⋯</button>
                      ${dropdownMenuHtml('prod-'+p.id, [
                        { label:'Edit Produk', icon:'✏️' },
                        { label: p.featured ? 'Hapus dari Unggulan' : 'Jadikan Unggulan', icon:'⭐' },
                        { divider:true },
                        { label:'Hapus Produk', icon:'🗑️', danger:true }
                      ])}
                    </div>
                  </td>
                </tr>`).join('') || `<tr><td colspan="6" style="text-align:center; color:#8a7a83; padding:24px;">Tidak ada produk yang cocok.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;

    document.getElementById('addProductBtn').onclick = () => openProductForm(null);
    document.getElementById('productSearchInput').oninput = (e) => { productSearch = e.target.value; renderProducts(); };
    document.getElementById('productCatFilter').onchange = (e) => { productCatFilter = e.target.value; renderProducts(); };

    products.forEach(p => {
      const trigger = document.querySelector(`[data-trigger="prod-${p.id}"]`);
      bindDropdown(trigger);
      const menu = document.getElementById('prod-'+p.id);
      menu.querySelectorAll('.dropdown-item').forEach((btn, i) => {
        btn.onclick = () => {
          closeAllDropdowns();
          if (i === 0) openProductForm(p.id);
          else if (i === 1) { ARF.updateProduct(p.id, { featured: !p.featured }); toast(p.featured ? 'Dihapus dari unggulan' : 'Ditambahkan ke unggulan'); renderProducts(); }
          else if (i === 2) {
            if (confirm(`Hapus "${p.name}"? Tindakan tidak bisa dibatalkan.`)){
              ARF.deleteProduct(p.id); toast('Produk dihapus'); renderProducts();
            }
          }
        };
      });
    });
  }

  function openProductForm(id){
    const p = id ? ARF.getProducts().find(x => x.id === id) : null;
    tempImage = p ? p.images[0] : null;
    const modal = document.getElementById('productFormModal');
    modal.innerHTML = `
      <div class="modal-head"><h3>${p ? 'Edit Produk' : 'Tambah Produk Baru'}</h3><button class="modal-close" id="pfClose">✕</button></div>
      <div class="modal-body">
        <div id="pfError"></div>
        <div class="field">
          <label>Gambar Produk</label>
          <div style="display:flex; gap:14px; align-items:center; margin-bottom:8px;">
            <img id="pfImagePreview" src="${tempImage || 'https://placehold.co/200x260/4A2338/F3E9DC?text=Preview'}" style="width:80px; height:104px; object-fit:cover; border-radius:8px; border:1px solid rgba(43,26,34,.15);">
            <div style="flex:1;">
              <input type="file" id="pfImageFile" accept="image/*" style="margin-bottom:8px; font-size:12.5px;">
              <input type="text" id="pfImageUrl" placeholder="atau tempel URL gambar di sini">
            </div>
          </div>
        </div>
        <div class="field"><label>Nama Produk</label><input id="pfName" value="${p ? p.name : ''}" placeholder="Contoh: Pashmina Ceruty Diamond"></div>
        <div class="field-row">
          <div class="field"><label>Kategori</label><input id="pfCategory" value="${p ? p.category : ''}" placeholder="Pashmina / Segi Empat / Bergo / Aksesoris"></div>
          <div class="field"><label>Harga (Rp)</label><input type="number" id="pfPrice" value="${p ? p.price : ''}" placeholder="65000"></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Stok</label><input type="number" id="pfStock" value="${p ? p.stock : ''}" placeholder="50"></div>
          <div class="field"><label>Ukuran (pisahkan koma)</label><input id="pfSizes" value="${p ? p.sizes.join(', ') : ''}" placeholder="All Size, M, L"></div>
        </div>
        <div class="field"><label>Warna (pisahkan koma)</label><input id="pfColors" value="${p ? p.colors.join(', ') : ''}" placeholder="Black, Navy, Cream"></div>
        <div class="field"><label>Deskripsi</label><textarea id="pfDesc" placeholder="Ceritakan bahan, keunggulan, dan cara pakai...">${p ? p.desc : ''}</textarea></div>
        <div class="field" style="display:flex; align-items:center; gap:8px;">
          <input type="checkbox" id="pfFeatured" style="width:auto;" ${p && p.featured ? 'checked':''}>
          <label style="margin:0;">Tampilkan sebagai produk unggulan</label>
        </div>
        <button class="btn btn-primary btn-block" id="pfSubmit">${p ? 'Simpan Perubahan' : 'Tambah Produk'}</button>
      </div>`;
    document.getElementById('pfClose').onclick = () => closeOverlay('productFormOverlay');
    document.getElementById('pfImageFile').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        tempImage = ev.target.result;
        document.getElementById('pfImagePreview').src = tempImage;
        document.getElementById('pfImageUrl').value = '';
      };
      reader.readAsDataURL(file);
    });
    document.getElementById('pfImageUrl').addEventListener('input', (e) => {
      if (e.target.value.trim()){
        tempImage = e.target.value.trim();
        document.getElementById('pfImagePreview').src = tempImage;
      }
    });
    document.getElementById('pfSubmit').onclick = () => saveProductForm(p);
    openOverlay('productFormOverlay');
  }

  function saveProductForm(existing){
    const name = document.getElementById('pfName').value.trim();
    const category = document.getElementById('pfCategory').value.trim();
    const price = Number(document.getElementById('pfPrice').value);
    const stock = Number(document.getElementById('pfStock').value);
    const sizes = document.getElementById('pfSizes').value.split(',').map(s=>s.trim()).filter(Boolean);
    const colors = document.getElementById('pfColors').value.split(',').map(s=>s.trim()).filter(Boolean);
    const desc = document.getElementById('pfDesc').value.trim();
    const featured = document.getElementById('pfFeatured').checked;

    if (!name || !category || !price || !stock || !sizes.length || !colors.length){
      document.getElementById('pfError').innerHTML = `<div class="form-error">Lengkapi semua kolom wajib (nama, kategori, harga, stok, ukuran, warna).</div>`;
      return;
    }
    const image = tempImage || 'https://placehold.co/600x760/4A2338/F3E9DC?text=' + encodeURIComponent(name);
    const payload = { name, category, price, stock, sizes, colors, desc, featured, images: [image] };

    if (existing){
      ARF.updateProduct(existing.id, payload);
      toast('Produk berhasil diperbarui');
    } else {
      ARF.addProduct(payload);
      toast('Produk berhasil ditambahkan');
    }
    closeOverlay('productFormOverlay');
    renderProducts();
  }

  /* ---------------- ORDERS ---------------- */
  function renderOrders(){
    const all = ARF.getOrders();
    const statuses = ['Menunggu Pembayaran','Diproses','Dikirim','Selesai','Dibatalkan'];
    const orders = all.filter(o => {
      const name = (o.receiver ? o.receiver.name : '').toLowerCase();
      const matchSearch = name.includes(orderSearch.toLowerCase()) || o.id.toLowerCase().includes(orderSearch.toLowerCase());
      const matchStatus = orderStatusFilter === 'Semua' || o.status === orderStatusFilter;
      return matchSearch && matchStatus;
    });

    document.getElementById('mainContent').innerHTML = `
      <div class="page-topbar">
        <div class="page-topbar-top">
          <div>
            <h2>Pesanan</h2>
            <div class="page-subtitle">${all.length} total pesanan masuk</div>
          </div>
        </div>
        <div class="toolbar-row">
          <div class="search-box"><input type="text" id="orderSearchInput" placeholder="Cari kode / nama pelanggan..." value="${orderSearch}"></div>
          <select class="filter-select" id="orderStatusFilter">
            <option value="Semua" ${orderStatusFilter==='Semua'?'selected':''}>Semua Status</option>
            ${statuses.map(s => `<option value="${s}" ${s===orderStatusFilter?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Kode</th><th>Pelanggan</th><th>Produk</th><th>Total</th><th>Pembayaran</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td class="mono">${o.id}</td>
                  <td><div class="cell-name">${o.receiver ? o.receiver.name : '-'}</div><div class="cell-sub">${o.receiver ? o.receiver.phone : ''}</div></td>
                  <td class="cell-sub" style="max-width:180px;">${o.items.map(i=>i.name+' ×'+i.qty).join(', ')}</td>
                  <td class="mono">${ARF.fmtRupiah(o.total)}</td>
                  <td>${paymentLabel(o.payment)}</td>
                  <td>
                    <select data-status="${o.id}" style="padding:6px 10px; border-radius:8px; border:1px solid rgba(43,26,34,.2); font-size:12.5px;">
                      ${statuses.map(s => `<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}
                    </select>
                  </td>
                  <td>
                    <div class="dropdown">
                      <button class="ellipsis-btn" data-trigger="ord-${o.id}">⋯</button>
                      ${dropdownMenuHtml('ord-'+o.id, [
                        { label:'Lihat Detail', icon:'👁️' },
                        { divider:true },
                        { label:'Hapus Pesanan', icon:'🗑️', danger:true }
                      ])}
                    </div>
                  </td>
                </tr>`).join('') || `<tr><td colspan="7" style="text-align:center; color:#8a7a83; padding:24px;">Tidak ada pesanan yang cocok.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;

    document.getElementById('orderSearchInput').oninput = (e) => { orderSearch = e.target.value; renderOrders(); };
    document.getElementById('orderStatusFilter').onchange = (e) => { orderStatusFilter = e.target.value; renderOrders(); };
    document.querySelectorAll('[data-status]').forEach(sel => {
      sel.addEventListener('change', () => {
        ARF.updateOrderStatus(sel.dataset.status, sel.value);
        toast('Status pesanan diperbarui');
      });
    });
    orders.forEach(o => {
      const trigger = document.querySelector(`[data-trigger="ord-${o.id}"]`);
      bindDropdown(trigger);
      const menu = document.getElementById('ord-'+o.id);
      menu.querySelectorAll('.dropdown-item').forEach((btn, i) => {
        btn.onclick = () => {
          closeAllDropdowns();
          if (i === 0) openOrderDetail(o.id);
          else if (i === 1) {
            if (confirm(`Hapus pesanan ${o.id}? Tindakan tidak bisa dibatalkan.`)){
              ARF.saveOrders(ARF.getOrders().filter(x => x.id !== o.id));
              toast('Pesanan dihapus');
              renderOrders();
            }
          }
        };
      });
    });
  }

  function openOrderDetail(id){
    const o = ARF.getOrders().find(x => x.id === id);
    if (!o) return;
    const steps = ['Menunggu Pembayaran','Diproses','Dikirim','Selesai'];
    const cancelled = o.status === 'Dibatalkan';
    const currentIdx = steps.indexOf(o.status);
    const modal = document.getElementById('orderDetailModal');
    modal.innerHTML = `
      <div class="modal-head"><h3>Detail Pesanan</h3><button class="modal-close" id="odClose">✕</button></div>
      <div class="modal-body">
        <div class="od-head-row">
          <div>
            <div class="mono" style="font-weight:700; font-size:16px;">${o.id}</div>
            <div class="cell-sub">${formatDate(o.createdAt)}</div>
          </div>
          <span class="pill ${statusPill(o.status)}" style="font-size:13px;">${o.status}</span>
        </div>

        ${!cancelled ? `
        <div class="timeline">
          ${steps.map((s, i) => `
            <div class="timeline-step ${i <= currentIdx ? 'done':''}">
              <div class="dot"></div>
              <div class="lbl">${s}</div>
            </div>`).join('')}
        </div>` : ''}

        <div class="od-info-grid">
          <div>
            <div class="od-block-label">Penerima</div>
            <div style="font-size:14px; font-weight:600;">${o.receiver ? o.receiver.name : '-'}</div>
            <div style="font-size:13px; color:#6b5560;">${o.receiver ? o.receiver.phone : ''}</div>
            <div style="font-size:13px; color:#6b5560; margin-top:4px;">${o.receiver ? o.receiver.address : ''}</div>
          </div>
          <div>
            <div class="od-block-label">Pembayaran</div>
            <div style="font-size:14px; font-weight:600;">${paymentLabel(o.payment)}</div>
            <div class="od-block-label" style="margin-top:14px;">Ongkos Kirim</div>
            <div style="font-size:14px;">${ARF.fmtRupiah(o.shipping || 0)}</div>
          </div>
        </div>

        <div class="od-block-label">Produk Dipesan</div>
        ${o.items.map(i => `
          <div class="od-item-row">
            <img src="${i.image}" alt="${i.name}">
            <div style="flex:1;">
              <div class="cell-name">${i.name}</div>
              <div class="cell-sub">${i.size || ''} · ${i.color || ''} · x${i.qty}</div>
            </div>
            <div class="mono" style="font-weight:700;">${ARF.fmtRupiah(i.price * i.qty)}</div>
          </div>`).join('')}

        <div style="display:flex; justify-content:space-between; padding-top:14px; font-weight:700; font-size:16px;">
          <span>Total</span><span class="mono">${ARF.fmtRupiah(o.total)}</span>
        </div>
      </div>`;
    document.getElementById('odClose').onclick = () => closeOverlay('orderDetailOverlay');
    openOverlay('orderDetailOverlay');
  }

  function paymentLabel(p){
    return { transfer:'Transfer Bank', ewallet:'E-Wallet', cod:'Bayar di Tempat (COD)' }[p] || p || '-';
  }

  /* ---------------- USERS ---------------- */
  function renderUsers(){
    const users = ARF.getUsers().filter(u => u.role === 'customer');
    document.getElementById('mainContent').innerHTML = `
      <div class="page-topbar">
        <div class="page-topbar-top">
          <div>
            <h2>Pengguna</h2>
            <div class="page-subtitle">${users.length} pelanggan terdaftar</div>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Nama</th><th>Email</th><th>No. HP</th><th>Terdaftar</th></tr></thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td><div style="display:flex; align-items:center; gap:10px;"><div class="avatar avatar-sm">${initials(u.name)}</div><span class="cell-name">${u.name}</span></div></td>
                  <td>${u.email}</td>
                  <td>${u.phone || '-'}</td>
                  <td>${formatDate(u.createdAt)}</td>
                </tr>`).join('') || `<tr><td colspan="4" style="text-align:center; color:#8a7a83; padding:24px;">Belum ada pengguna terdaftar.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  /* ---------------- Overlay helpers ---------------- */
  function openOverlay(id){ document.getElementById(id).classList.add('open'); document.body.style.overflow='hidden'; }
  function closeOverlay(id){ document.getElementById(id).classList.remove('open'); document.body.style.overflow=''; }
  document.getElementById('productFormOverlay').addEventListener('click', (e) => { if (e.target.id === 'productFormOverlay') closeOverlay('productFormOverlay'); });
  document.getElementById('orderDetailOverlay').addEventListener('click', (e) => { if (e.target.id === 'orderDetailOverlay') closeOverlay('orderDetailOverlay'); });

  render();
})();
