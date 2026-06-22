// ============================================================
// UNIT TEST — Sistem Navigasi Biskita Trans Depok (Python test client)
// ============================================================

async function jalankanTest() {
  const out = document.getElementById('test-output');
  out.innerHTML = 'Menjalankan unit test di Python Backend...';
  
  try {
    const res = await fetch('/api/test', { method: 'POST' });
    if (!res.ok) {
      throw new Error(`Server returned status: ${res.status}`);
    }
    const data = await res.json();
    out.innerHTML = data.output;
  } catch (err) {
    console.error("Gagal menjalankan test:", err);
    out.innerHTML = '<span class="test-fail">❌ Gagal menghubungi Python backend untuk menjalankan pengujian.</span>';
  }
}
