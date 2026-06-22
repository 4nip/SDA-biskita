// ============================================================
// UNIT TEST — Sistem Navigasi Biskita Trans Depok (Client-side)
// ============================================================

function jalankanTest() {
  const out = document.getElementById('test-output');
  out.innerHTML = 'Menjalankan unit test...';

  const results = [];
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      results.push(`<div class="test-pass">✅ ${testName}</div>`);
      passed++;
    } else {
      results.push(`<div class="test-fail">❌ ${testName}</div>`);
      failed++;
    }
  }

  // Test 1: Graf terbangun dengan benar
  assert(Object.keys(halteMap).length === 50, "Test 1 — Graf: 50 halte terdaftar di halteMap");

  // Test 2: Adjacency list terbangun
  let totalEdges = 0;
  for (const hid in adj) totalEdges += adj[hid].length;
  assert(totalEdges === 100, "Test 2 — Graf: 100 koneksi di adjacency list (50 edge × 2 arah)");

  // Test 3: BFS menemukan rute
  const bfsRes = bfs(1, 13);
  assert(bfsRes.path !== null && bfsRes.path[0] === 1 && bfsRes.path[bfsRes.path.length - 1] === 13,
    "Test 3 — BFS: Rute ditemukan dari halte 1 ke 13");

  // Test 4: Dijkstra menemukan rute
  const dijkRes = dijkstra(1, 26);
  assert(dijkRes.path !== null && dijkRes.path[0] === 1 && dijkRes.path[dijkRes.path.length - 1] === 26,
    "Test 4 — Dijkstra: Rute ditemukan dari halte 1 ke 26");

  // Test 5: Stack push & pop
  const testStack = new LinkedStack(5);
  testStack.push("a");
  testStack.push("b");
  testStack.push("c");
  assert(testStack.pop() === "c" && testStack.size === 2,
    "Test 5 — Stack: Push 3 item, pop mengembalikan item terakhir (LIFO)");

  // Test 6: BST search
  const bstRes = bstInstance.search("Saladin");
  assert(bstRes !== null && bstRes.id === 2,
    'Test 6 — BST: Pencarian "Saladin" menemukan halte ID 2');

  // Test 7: Merge Sort
  const unsorted = [{ nama: "C" }, { nama: "A" }, { nama: "B" }];
  const sorted = mergeSort(unsorted, x => x.nama);
  assert(sorted[0].nama === "A" && sorted[1].nama === "B" && sorted[2].nama === "C",
    "Test 7 — Merge Sort: Array terurut dengan benar");

  // Test 8: Performa BFS < 50ms
  const t0 = performance.now();
  bfs(1, 50);
  const elapsed = performance.now() - t0;
  assert(elapsed < 50, `Test 8 — Performa: BFS selesai dalam ${elapsed.toFixed(2)}ms (< 50ms)`);

  const summary = `<div class="test-summary" style="margin-top:12px; font-weight:600;">Hasil: ${passed} lulus, ${failed} gagal dari ${passed + failed} test</div>`;
  out.innerHTML = results.join('') + summary;
}
