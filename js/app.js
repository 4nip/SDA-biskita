// ============================================================
// APP — UI Controller (Client-side, no backend required)
// Works on static hosting like Vercel
// ============================================================

let currentAlgo = 'bfs';
let halteSort = 'nama';
let halteQuery = '';

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  initGraf();
  initBST();
  buildSelects();
  renderHalteList();
  updateStackBadge();
});

// ---- Tab Switching ----
function switchTab(tab) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  if (tab === 'halte') renderHalteList();
  if (tab === 'riwayat') renderRiwayat();
}

// ---- Algo Selection ----
function selectAlgo(algo) {
  currentAlgo = algo;
  document.querySelectorAll('.algo-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.algo-card-full').forEach(c => c.classList.remove('selected'));

  if (algo === 'keduanya') {
    document.getElementById('algo-keduanya').classList.add('selected');
  } else {
    document.getElementById('algo-' + algo).classList.add('selected');
  }
}

// ---- Build Selects ----
function buildSelects() {
  if (!DATA_HALTE || !DATA_HALTE.length) return;
  const sorted = DATA_HALTE.slice().sort((a, b) => a[0] - b[0]);
  ['sel-asal', 'sel-tujuan'].forEach((selId, i) => {
    const sel = document.getElementById(selId);
    sel.innerHTML = '';
    sorted.forEach(([hid, nama]) => {
      const opt = document.createElement('option');
      opt.value = hid;
      opt.textContent = `${String(hid).padStart(2, '0')}. ${nama}`;
      sel.appendChild(opt);
    });
    sel.value = i === 0 ? 1 : 13;
  });
}

// ---- Cari Rute ----
function cariRute() {
  const asal = +document.getElementById('sel-asal').value;
  const tujuan = +document.getElementById('sel-tujuan').value;
  const area = document.getElementById('result-area');

  if (asal === tujuan) {
    area.innerHTML = `<div class="result-box error"><div class="result-error-msg">⚠ Halte asal dan tujuan tidak boleh sama.</div></div>`;
    return;
  }

  const btn = document.getElementById('btn-cari');
  btn.disabled = true;
  btn.textContent = 'Memproses...';

  try {
    if (currentAlgo === 'bfs' || currentAlgo === 'dijkstra') {
      const res = currentAlgo === 'bfs' ? bfs(asal, tujuan) : dijkstra(asal, tujuan);
      const r = makeResult(res, currentAlgo === 'bfs' ? 'BFS — Halte Tersedikit' : 'Dijkstra — Jarak Terpendek', asal, tujuan);
      historyStack.push(r);
      area.innerHTML = buildResultBox(r, currentAlgo);
    } else {
      // Bandingkan Keduanya
      const resBfs = bfs(asal, tujuan);
      const rBfs = makeResult(resBfs, 'BFS — Halte Tersedikit', asal, tujuan);
      historyStack.push(rBfs);

      const resDijkstra = dijkstra(asal, tujuan);
      const rDijkstra = makeResult(resDijkstra, 'Dijkstra — Jarak Terpendek', asal, tujuan);
      historyStack.push(rDijkstra);

      let compareNote = '';
      if (rBfs.path && rDijkstra.path) {
        const selisih = Math.abs(rBfs.jarak - rDijkstra.jarak).toFixed(2);
        if (rDijkstra.jarak < rBfs.jarak)
          compareNote = `Dijkstra lebih hemat <strong>${selisih} km</strong> dibanding BFS.`;
        else if (rBfs.jarak < rDijkstra.jarak)
          compareNote = `BFS menghasilkan jarak lebih pendek pada rute ini.`;
        else
          compareNote = `Kedua algoritma menghasilkan jarak yang sama: <strong>${rDijkstra.jarak} km</strong>.`;
      }

      area.innerHTML = `
        <div class="compare-grid">
          ${buildResultBox(rBfs, 'bfs')}
          ${buildResultBox(rDijkstra, 'dijkstra')}
        </div>
        ${compareNote ? `<div class="compare-note">${compareNote}</div>` : ''}
      `;
    }
  } catch (err) {
    console.error("Gagal cari rute:", err);
    area.innerHTML = `<div class="result-box error"><div class="result-error-msg">⚠ Terjadi kesalahan saat mencari rute.</div></div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = '🔍  Cari Rute';
    updateStackBadge();
  }
}

function makeResult(r, metode, asal, tujuan) {
  const now = new Date();
  const timestamp = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}, ${String(now.getHours()).padStart(2,'0')}.${String(now.getMinutes()).padStart(2,'0')}.${String(now.getSeconds()).padStart(2,'0')}`;

  if (!r.path) {
    return {
      metode,
      path: null,
      pathNama: [],
      jarak: null,
      ms: r.ms,
      transit: 0,
      asal: halteMap[asal] ? halteMap[asal].nama : "Tidak diketahui",
      tujuan: halteMap[tujuan] ? halteMap[tujuan].nama : "Tidak diketahui",
      timestamp
    };
  }

  return {
    metode,
    path: r.path,
    pathNama: r.path.map(hid => halteMap[hid].nama),
    jarak: r.jarak,
    ms: r.ms,
    transit: r.path.length >= 2 ? r.path.length - 2 : 0,
    asal: halteMap[asal].nama,
    tujuan: halteMap[tujuan].nama,
    timestamp
  };
}

function buildResultBox(r, cls) {
  if (!r.path) {
    return `<div class="result-box error">
      <div class="result-method">${r.metode}</div>
      <div class="result-error-msg">Rute tidak ditemukan.</div>
    </div>`;
  }
  const pills = r.pathNama.map((n, i) => {
    const c = i === 0 ? 'start' : i === r.pathNama.length - 1 ? 'end' : '';
    return `<span class="halte-pill ${c}">${n}</span>${i < r.pathNama.length - 1 ? '<span class="arrow-sep">→</span>' : ''}`;
  }).join('');

  return `<div class="result-box ${cls}">
    <div class="result-method">${r.metode}</div>
    <div class="result-route">${pills}</div>
    <div class="result-stats">
      <div class="stat-item">
        <div class="stat-val">${r.jarak} <span class="stat-unit">km</span></div>
        <div class="stat-lbl">Total jarak</div>
      </div>
      <div class="stat-item">
        <div class="stat-val">${r.path.length}</div>
        <div class="stat-lbl">Halte dilewati</div>
      </div>
      <div class="stat-item">
        <div class="stat-val">${r.transit}</div>
        <div class="stat-lbl">Halte transit</div>
      </div>
      <div class="stat-item">
        <div class="stat-val">${r.ms} <span class="stat-unit">ms</span></div>
        <div class="stat-lbl">Komputasi</div>
      </div>
    </div>
  </div>`;
}

// ---- Daftar Halte ----
function filterHalte() {
  halteQuery = document.getElementById('search-halte').value.toLowerCase();
  renderHalteList();
}

function sortHalte(by, el) {
  halteSort = by;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderHalteList();
}

function renderHalteList() {
  const container = document.getElementById('halte-list');

  // Convert to list of dicts
  let list = DATA_HALTE.map(([id, nama, zona, fasilitas]) => ({ id, nama, zona, fasilitas }));

  // Filter by query using BST prefix search
  if (halteQuery) {
    list = bstInstance.prefixSearch(halteQuery);
  }

  // Sort using merge sort
  if (halteSort === 'nama') {
    list = mergeSort(list, h => h.nama);
  } else if (halteSort === 'id') {
    list = mergeSort(list, h => h.id);
  } else if (halteSort === 'zona') {
    list = mergeSort(list, h => h.zona + h.nama);
  }

  if (!list.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>Tidak ada halte yang cocok.</p></div>`;
    return;
  }

  container.innerHTML = list.map(h => `
    <div class="halte-item" onclick="toggleHalteDetail(${h.id}, this)">
      <div class="halte-num">${h.id}</div>
      <div class="halte-info">
        <div class="halte-name">${h.nama}</div>
        <div class="halte-fasilitas">${h.fasilitas.join(', ') || '—'}</div>
      </div>
      <span class="zona-badge z-${h.zona}">Zona ${h.zona}</span>
      <span class="chevron">›</span>
    </div>
    <div class="halte-detail" id="detail-${h.id}" style="display:none;">
      <div class="detail-grid">
        <div class="detail-col">
          <div class="detail-label">Fasilitas</div>
          <div class="detail-tags">${h.fasilitas.map(f => `<span class="fasilitas-tag">${f}</span>`).join('') || '—'}</div>
        </div>
        <div class="detail-col">
          <div class="detail-label">Terhubung ke</div>
          <div class="tetangga-list">
            ${(adj[h.id] || []).map(([nid, d]) => `
              <div class="tetangga-row">
                <span>${halteMap[nid] ? halteMap[nid].nama : 'Tidak diketahui'}</span>
                <span class="tetangga-dist">${d} km</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function toggleHalteDetail(id, el) {
  const detail = document.getElementById('detail-' + id);
  const chevron = el.querySelector('.chevron');
  if (!detail) return;
  const isOpen = detail.style.display !== 'none';
  detail.style.display = isOpen ? 'none' : 'block';
  chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
}

// ---- Riwayat ----
function renderRiwayat() {
  const container = document.getElementById('riwayat-list');
  updateStackBadge();
  const stack = historyStack.toList();

  if (!stack.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>Belum ada riwayat pencarian.<br>Cari rute terlebih dahulu.</p></div>`;
    return;
  }

  container.innerHTML = stack.map((r, i) => `
    <div class="history-item ${i === 0 ? 'latest' : ''}">
      <div class="history-top">
        <span class="history-badge ${r.metode.startsWith('BFS') ? 'hb-bfs' : 'hb-dijk'}">${r.metode.startsWith('BFS') ? 'BFS' : 'Dijkstra'}</span>
        ${i === 0 ? '<span class="latest-badge">Terbaru</span>' : ''}
        <span class="history-time">${r.timestamp}</span>
      </div>
      <div class="history-route">${r.asal} <span>→</span> ${r.tujuan}</div>
      <div class="history-stats">
        <span>📍 ${r.jarak} km</span>
        <span>🚏 ${r.path.length} halte</span>
        <span>⏱ ${r.ms} ms</span>
      </div>
    </div>
  `).join('');
}

function hapusRiwayatTerakhir() {
  const removed = historyStack.pop();
  if (!removed) {
    showToast('Riwayat sudah kosong.');
    return;
  }
  showToast(`Dihapus: ${removed.asal} → ${removed.tujuan}`);
  renderRiwayat();
}

function hapusSemuaRiwayat() {
  const stack = historyStack.toList();
  if (!stack.length) { showToast('Riwayat sudah kosong.'); return; }
  if (confirm('Hapus semua riwayat pencarian?')) {
    historyStack.clear();
    renderRiwayat();
    showToast('Semua riwayat berhasil dihapus.');
  }
}

function updateStackBadge() {
  const badge = document.getElementById('stack-badge');
  if (badge) {
    badge.textContent = historyStack.size || '';
  }
}

// ---- Toast ----
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}
