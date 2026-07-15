/* ============================================================
   AR FASHION — Admin Panel Logic
   ============================================================ */
(function(){
  let currentPage = 'dashboard';
  let editingProductId = null;
  let tempImage = null;

  function toast(msg){
    const wrap = document.getElementById('toastWrap');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(()=>el.remove(), 300); }, 2600);
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
          <div class="admin-brand" style="color:var(--plum); margin-bottom:4px;">AR <span style="color:var(--gold);">Fashion</span></div>
          <div style="font-size:12.5px; letter-spacing:1.5px; text-transform:uppercase; color:#8a7a83; margin-bottom:26px;">Admin Panel</div>
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
    // Enter key submit
    document.getElementById('adminPassword').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('adminLoginBtn').click();
    });
  }

  /* ---------------- SHELL ---------------- */
  function renderShell(){
    const admin = ARF.currentAdmin();
    document.getElementById('app').innerHTML = `
      <div class="admin-shell">
        <aside class="admin-sidebar">
          <div class="admin-brand">AR <span>Fashion</span></div>
          <div class="admin-role">Admin Panel</div>
          <nav class="admin-nav">
            <button data-page="dashboard">📊 Dashboard</button>
            <button data-page="products">👗 Produk</button>
            <button data-page="orders">📦 Pesanan</button>
            <button data-page="users">👥 Pengguna</button>
          </nav>
          <div style="margin-top:auto; padding-top:20px; border-top:1px solid rgba(255,255,255,.1);">
            <div style="font-size:13px; opacity:.8; margin-bottom:10px;">${admin.name}</div>
            <button class="btn btn-outline btn-sm btn-block" id="adminLogout" style="border-color:rgba(251,247,241,.4); color:var(--cream);">Keluar</button>
          </div>
        </aside>
        <main class="admin-main" id="mainContent"></main>
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
    if (currentPage === 'dashboard') renderDashboard();
    else if (currentPage === 'products') renderProducts();
    else if (currentPage === 'orders') renderOrders();
    else if (currentPage === 'users') renderUsers();
  }

  /* ---------------- DASHBOARD ---------------- */
  function renderDashboard(){
    const products = ARF.getProducts();
    const orders = ARF.getOrders();
    const users = ARF.getUsers().filter(u => u.role === 'customer');
    const revenue = orders.filter(o => !o.status.includes('Batal')).reduce((s,o) => s + o.total, 0);

    document.getElementById('mainContent').innerHTML = `
      <div class="admin-topbar">
        <h2>Dashboard</h2>
      </div>
      <div class="stat-grid">
        <div class="stat-card"><div class="label">Total Produk</div><div class="value">${products.length}</div></div>
        <div class="stat-card"><div class="label">Total Pesanan</div><div class="value">${orders.length}</div></div>
        <div class="stat-card"><div class="label">Pendapatan</div><div class="value" style="font-size:19px;">${ARF.fmtRupiah(revenue)}</div></div>
        <div class="stat-card"><div class="label">Pelanggan Terdaftar</div><div class="value">${users.length}</div></div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Pesanan Terbaru</h3></div>
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
    const products = ARF.getProducts();
    document.getElementById('mainContent').innerHTML = `
      <div class="admin-topbar">
        <h2>Produk</h2>
        <button class="btn btn-gold" id="addProductBtn">+ Tambah Produk</button>
      </div>
      <div class="panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Gambar</th><th>Nama</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Unggulan</th><th>Aksi</th></tr></thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td><img class="t-thumb" src="${p.images[0]}" alt="${p.name}"></td>
                  <td>${p.name}</td>
                  <td>${p.category}</td>
                  <td class="mono">${ARF.fmtRupiah(p.price)}</td>
                  <td>${p.stock}</td>
                  <td>${p.featured ? '<span class="pill pill-success">Ya</span>' : '<span class="pill pill-warn">Tidak</span>'}</td>
                  <td>
                    <div class="row-actions">
                      <button class="icon-action" data-edit="${p.id}" title="Edit">✏️</button>
                      <button class="icon-action" data-delete="${p.id}" title="Hapus">🗑️</button>
                    </div>
                  </td>
                </tr>`).join('') || `<tr><td colspan="7" style="text-align:center; color:#8a7a83; padding:24px;">Belum ada produk. Klik "Tambah Produk" untuk mulai.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;
    document.getElementById('addProductBtn').onclick = () => openProductForm(null);
    document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openProductForm(b.dataset.edit));
    document.querySelectorAll('[data-delete]').forEach(b => b.onclick = () => {
      if (confirm('Hapus produk ini? Tindakan tidak bisa dibatalkan.')){
        ARF.deleteProduct(b.dataset.delete);
        toast('Produk dihapus');
        renderProducts();
      }
    });
  }

  function openProductForm(id){
    editingProductId = id;
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
              <input type="text" id="pfImageUrl" placeholder="atau tempel URL gambar di sini" value="${p ? '' : ''}">
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
    const orders = ARF.getOrders();
    const statuses = ['Menunggu Pembayaran','Diproses','Dikirim','Selesai','Dibatalkan'];
    document.getElementById('mainContent').innerHTML = `
      <div class="admin-topbar"><h2>Pesanan</h2></div>
      <div class="panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Kode</th><th>Pelanggan</th><th>Produk</th><th>Total</th><th>Pembayaran</th><th>Status</th><th>Tanggal</th></tr></thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td class="mono">${o.id}</td>
                  <td>${o.receiver ? o.receiver.name : '-'}<br><span style="font-size:11.5px; color:#8a7a83;">${o.receiver ? o.receiver.phone : ''}</span></td>
                  <td>${o.items.map(i=>i.name+' x'+i.qty).join('<br>')}</td>
                  <td class="mono">${ARF.fmtRupiah(o.total)}</td>
                  <td>${paymentLabel(o.payment)}</td>
                  <td>
                    <select data-status="${o.id}" style="padding:6px 10px; border-radius:8px; border:1px solid rgba(43,26,34,.2); font-size:12.5px;">
                      ${statuses.map(s => `<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}
                    </select>
                  </td>
                  <td>${formatDate(o.createdAt)}</td>
                </tr>`).join('') || `<tr><td colspan="7" style="text-align:center; color:#8a7a83; padding:24px;">Belum ada pesanan masuk.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;
    document.querySelectorAll('[data-status]').forEach(sel => {
      sel.addEventListener('change', () => {
        ARF.updateOrderStatus(sel.dataset.status, sel.value);
        toast('Status pesanan diperbarui');
        renderDashboard.cache = null;
      });
    });
  }

  function paymentLabel(p){
    return { transfer:'Transfer Bank', ewallet:'E-Wallet', cod:'COD' }[p] || p || '-';
  }

  /* ---------------- USERS ---------------- */
  function renderUsers(){
    const users = ARF.getUsers().filter(u => u.role === 'customer');
    document.getElementById('mainContent').innerHTML = `
      <div class="admin-topbar"><h2>Pengguna</h2></div>
      <div class="panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Nama</th><th>Email</th><th>No. HP</th><th>Terdaftar</th></tr></thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td>${u.name}</td>
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

  render();
})();
