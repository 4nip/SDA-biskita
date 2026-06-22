# ============================================================
# UNIT TEST — Sistem Navigasi Biskita Trans Depok (Python)
# ============================================================

import time
from data import DATA_HALTE, DATA_EDGE
from algorithms import (
    halteMap, adj, bfs, dijkstra, hitung_jarak, LinkedStack,
    merge_sort, bst_search, bst_prefix
)

def jalankan_test():
    results = []
    output_lines = []

    def log(text, cls=''):
        # Simple HTML-like spans that the frontend can render
        if cls:
            output_lines.append(f'<span class="{cls}">{text}</span>')
        else:
            output_lines.append(text)

    def section(judul):
        bar = '━' * 50
        log(f'\n{bar}\n  {judul}\n{bar}', 'test-section')

    def test(nama, cond):
        ok = bool(cond)
        results.append(ok)
        status = '✅ PASS' if ok else '❌ FAIL'
        cls = 'test-pass' if ok else 'test-fail'
        log(f'  {status}  {nama}', cls)

    # Skenario 1: Graf
    section('SKENARIO 1: Graf & Adjacency List')
    test('Graf memiliki 50 halte', len(halteMap) == 50)
    test('Halte 1 memiliki tetangga', len(adj.get(1, [])) > 0)
    
    # Edge 1-2 dua arah
    edge_1_2_ok = False
    if 1 in adj and 2 in adj:
        has_1_to_2 = any(nid == 2 for nid, _ in adj[1])
        has_2_to_1 = any(nid == 1 for nid, _ in adj[2])
        edge_1_2_ok = has_1_to_2 and has_2_to_1
    test('Edge 1-2 dua arah', edge_1_2_ok)
    test('Jumlah edge minimal 50', len(DATA_EDGE) >= 50)

    # Skenario 2: BFS
    section('SKENARIO 2: BFS — Rute Halte Tersedikit')
    r14 = bfs(1, 4)
    test('BFS 1→4 menemukan rute', r14['path'] is not None)
    test('BFS 1→4 node pertama = 1', r14['path'] and r14['path'][0] == 1)
    test('BFS 1→4 node terakhir = 4', r14['path'] and r14['path'][-1] == 4)
    test('BFS menghasilkan jarak > 0', r14['jarak'] is not None and r14['jarak'] > 0)
    test('Waktu komputasi BFS tercatat', r14['ms'] is not None and r14['ms'] >= 0)
    
    r13b = bfs(1, 3)
    test('BFS 1→3 menemukan rute', r13b['path'] is not None)
    
    rxb = bfs(1, 999)
    test('BFS halte tidak ada → null', rxb['path'] is None)

    # Skenario 3: Dijkstra
    section('SKENARIO 3: Dijkstra — Rute Jarak Terpendek')
    d13 = dijkstra(1, 3)
    test('Dijkstra 1→3 menemukan rute', d13['path'] is not None)
    test('Dijkstra 1→3 jarak < 5 km', d13['jarak'] is not None and d13['jarak'] < 5.0)
    
    d15 = dijkstra(1, 5)
    b15 = bfs(1, 5)
    test('Dijkstra jarak ≤ BFS jarak (1→5)',
         d15['jarak'] is not None and b15['jarak'] is not None and d15['jarak'] <= b15['jarak'] + 0.001)
    test('Waktu komputasi Dijkstra tercatat', d13['ms'] is not None)
    
    dxd = dijkstra(1, 999)
    test('Dijkstra halte tidak ada → null', dxd['path'] is None)

    # Skenario 4: Stack
    section('SKENARIO 4: Stack — Riwayat Pencarian')
    test_stack = LinkedStack(max_size=20)
    test('Stack dapat diakses', isinstance(test_stack, LinkedStack))
    test('Stack size ≤ MAX_SIZE (20)', test_stack.size <= 20)
    
    dummy = {
        "metode": 'BFS', "asal": 'TestA', "tujuan": 'TestB',
        "path": [1, 2], "pathNama": ['A', 'B'], "jarak": 1.2,
        "ms": 0.1, "transit": 0, "timestamp": '2026-01-01'
    }
    test_stack.push(dummy)
    test('Stack bertambah setelah push', test_stack.head.val['tujuan'] == 'TestB')
    test_stack.pop()
    test('Stack berkurang setelah pop', test_stack.size == 0)
    
    empty_test = test_stack.pop()
    test('Pop dari stack kosong → null', empty_test is None)

    # Skenario 5: BST
    section('SKENARIO 5: BST — Pencarian Halte')
    test('BST search "Saladin" ditemukan', bst_search('Saladin') is not None)
    test('BST search nama tepat benar', bst_search('Saladin') and bst_search('Saladin')['nama'] == 'Saladin')
    test('BST search tidak ada → null', bst_search('XYZ') is None)
    
    inorder = sorted([n for _, n, _, _ in DATA_HALTE])
    test('Halte bisa diurutkan alphabetical', inorder[0] <= inorder[-1])
    
    ci = bst_prefix('ci')
    test('Prefix "ci" menemukan ≥2 halte (Cisalak, Cinere)', len(ci) >= 2)

    # Skenario 6: Merge Sort
    section('SKENARIO 6: Merge Sort — Pengurutan Halte')
    hl = [{"id": row[0], "nama": row[1], "zona": row[2], "fasilitas": row[3]} for row in DATA_HALTE]
    sn = merge_sort(hl, key_func=lambda h: h['nama'])
    si = merge_sort(hl, key_func=lambda h: h['id'])
    sz = merge_sort(hl, key_func=lambda h: h['zona'])
    
    test('Sort by nama ascending', sn[0]['nama'] <= sn[-1]['nama'])
    test('Sort by ID ascending', si[0]['id'] < si[-1]['id'])
    test('Sort by zona ascending', sz[0]['zona'] <= sz[-1]['zona'])
    test('Sort tidak mengubah array asli', hl[0]['nama'] == DATA_HALTE[0][1])
    test('Sort list kosong → []', len(merge_sort([], key_func=lambda h: h['nama'])) == 0)
    test('Sort list 1 elemen berjalan', len(merge_sort([hl[0]], key_func=lambda h: h['nama'])) == 1)

    # Skenario 7: Graf Lengkap
    section('SKENARIO 7: Graf Lengkap Biskita (50 Halte)')
    test('Graf Biskita memiliki 50 halte', len(halteMap) == 50)
    bfs_res = bfs(1, 13)
    test('BFS Terminal Depok Baru → Polsek Sukmajaya II berhasil', bfs_res['path'] is not None)
    dijk_res = dijkstra(1, 13)
    test('Dijkstra Terminal Depok Baru → Polsek Sukmajaya II berhasil', dijk_res['path'] is not None)
    test('Dijkstra jarak ≤ BFS jarak (Depok Baru→Polsek Sukmajaya II)',
         dijk_res['jarak'] is not None and bfs_res['jarak'] is not None and dijk_res['jarak'] <= bfs_res['jarak'] + 0.001)
    
    kukusan_bst = bst_search('Saladin')
    test('BST cari "Saladin" di sistem lengkap',
         kukusan_bst is not None and kukusan_bst['nama'] == 'Saladin')
    
    sorted_50 = merge_sort(hl, key_func=lambda h: h['nama'])
    all_sorted = True
    for i in range(1, len(sorted_50)):
        if sorted_50[i - 1]['nama'] > sorted_50[i]['nama']:
            all_sorted = False
            break
    test('Merge Sort 50 halte terurut nama', all_sorted)
    
    info = halteMap.get(1)
    test('Info halte Terminal Depok Baru tersedia', info is not None and 'Terminal Terpadu Depok Baru' in info['nama'])

    # Skenario 8: Performa
    section('SKENARIO 8: Uji Performa Algoritma (100 iterasi)')
    N = 100
    tb = 0.0
    td = 0.0
    for _ in range(N):
        tb += bfs(1, 20).get('ms') or 0.0
        td += dijkstra(1, 20).get('ms') or 0.0
    avgB = tb / N
    avgD = td / N
    log(f'\n  Rata-rata BFS      : {avgB:.4f} ms\n  Rata-rata Dijkstra : {avgD:.4f} ms', 'test-section')
    test('BFS selesai < 5ms rata-rata', avgB < 5.0)
    test('Dijkstra selesai < 5ms rata-rata', avgD < 5.0)

    # Ringkasan
    total = len(results)
    passed = sum(1 for r in results if r)
    failed = total - passed
    
    log(f'\n{"━" * 50}\n  RINGKASAN: {passed}/{total} test lulus | {failed} gagal\n{"━" * 50}', 'test-section')
    if failed == 0:
        log('  🎉 Semua pengujian berhasil!\n', 'test-pass')
    else:
        log(f'  ⚠️  {failed} pengujian gagal.\n', 'test-fail')

    return '\n'.join(output_lines)

if __name__ == '__main__':
    print(jalankan_test())
