// ============================================================
// APP — UI Controller (Backend integrated)
// Communicates with Python Flask Backend
// ============================================================

let currentAlgo = 'bfs';
let halteSort = 'nama';
let halteQuery = '';
let halteMap = {};
let adj = {};

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  await fetchInitData();
  buildSelects();
  renderHalteList();
  updateStackBadge();
});

async function fetchInitData() {
  try {
    const res = await fetch('/api/init');
    const data = await res.json();
    window.DATA_HALTE = data.DATA_HALTE;
    halteMap = data.halteMap;
    adj = data.adj;
  } catch(e) {
    console.error("Gagal load init data", e);
  }
}

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
  if (!window.DATA_HALTE || !window.DATA_HALTE.length) return;
  const sorted = window.DATA_HALTE.slice().sort((a, b) => a[0] - b[0]);
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
async function cariRute() {
  const asal = document.getElementById('sel-asal').value;
  const tujuan = document.getElementById('sel-tujuan').value;
  const area = document.getElementById('result-area');

  if (asal === tujuan) {
    area.innerHTML = `<div class="result-box error"><div class="result-error-msg">⚠ Halte asal dan tujuan tidak boleh sama.</div></div>`;
    return;
  }

  const btn = document.getElementById('btn-cari');
  btn.disabled = true;
  btn.textContent = 'Memproses...';

  try {
    const res = await fetch(`/api/rute?asal=${asal}&tujuan=${tujuan}&algo=${currentAlgo}`);
    const data = await res.json();

    if (res.ok) {
      if (currentAlgo === 'keduanya') {
        const rBfs = data.bfs;
        const rDijkstra = data.dijkstra;

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
        await fetch('/api/riwayat', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(rBfs) });
        await fetch('/api/riwayat', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(rDijkstra) });
      } else {
        area.innerHTML = buildResultBox(data, currentAlgo);
        await fetch('/api/riwayat', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
      }
    } else {
       area.innerHTML = `<div class="result-box error"><div class="result-error-msg">⚠ ${data.error || 'Terjadi kesalahan.'}</div></div>`;
    }
  } catch (err) {
    console.error("Gagal cari rute:", err);
    area.innerHTML = `<div class="result-box error"><div class="result-error-msg">⚠ Terjadi kesalahan komunikasi dengan server.</div></div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = '🔍  Cari Rute';
    updateStackBadge();
  }
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
  halteQuery = document.getElementById('search-halte').value;
  renderHalteList();
}

function sortHalte(by, el) {
  halteSort = by;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderHalteList();
}

async function renderHalteList() {
  const container = document.getElementById('halte-list');
  try {
    const res = await fetch(`/api/halte?query=${encodeURIComponent(halteQuery)}&sort=${halteSort}`);
    const list = await res.json();

    if (!list.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>Tidak ada halte yang cocok.</p></div>`;
      return;
    }

    container.innerHTML = list.map(h => `
      <div class="halte-item" onclick="toggleHalteDetail('${h.id}', this)">
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
  } catch(e) {
      console.error(e);
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠</div><p>Gagal memuat halte.</p></div>`;
  }
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
async function renderRiwayat() {
  const container = document.getElementById('riwayat-list');
  try {
    const res = await fetch('/api/riwayat');
    const stack = await res.json();
    updateStackBadge();

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
  } catch(e) {
      console.error(e);
  }
}

async function hapusRiwayatTerakhir() {
  try {
    const res = await fetch('/api/riwayat?action=pop', { method: 'DELETE' });
    const data = await res.json();
    if (!data.removed) {
      showToast('Riwayat sudah kosong.');
      return;
    }
    showToast(`Dihapus: ${data.removed.asal} → ${data.removed.tujuan}`);
    renderRiwayat();
  } catch(e) {}
}

async function hapusSemuaRiwayat() {
  if (confirm('Hapus semua riwayat pencarian?')) {
    try {
      await fetch('/api/riwayat?action=clear', { method: 'DELETE' });
      renderRiwayat();
      showToast('Semua riwayat berhasil dihapus.');
    } catch(e) {}
  }
}

async function updateStackBadge() {
  const badge = document.getElementById('stack-badge');
  if (badge) {
    try {
      const res = await fetch('/api/riwayat');
      const stack = await res.json();
      badge.textContent = stack.length || '';
    } catch(e){}
  }
}

// ---- Unit Test ----
async function jalankanTest() {
  const out = document.getElementById('test-output');
  out.innerHTML = 'Menjalankan unit test di backend...';
  try {
    const res = await fetch('/api/test');
    const data = await res.json();
    out.innerHTML = data.output;
  } catch(e) {
    out.innerHTML = '<div class="test-fail">❌ Gagal menghubungi server atau menjalankan test.</div>';
  }
}

// ---- Toast ----
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}
