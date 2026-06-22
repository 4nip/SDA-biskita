# 🚌 Biskita Trans Depok — Sistem Navigasi

Aplikasi web interaktif untuk navigasi rute **Biskita Trans Depok** yang dibangun sebagai proyek akhir mata kuliah **Struktur Data & Algoritma**.

---

## Cara Menjalankan

1. Ekstrak file ZIP
2. Buka folder `biskita/` di Visual Studio Code
3. Buka file `index.html`
4. Klik **"Open with Live Server"** (ekstensi Live Server VS Code)  
   — atau klik kanan → *Open in Default Browser*

> Tidak perlu install apapun. Semua berjalan di browser, tanpa backend.

---

## Struktur Folder

```
biskita/
├── index.html          ← Halaman utama
├── css/
│   └── style.css       ← Semua styling
└── js/
    ├── data.js         ← Data 25 halte & 32 edge
    ├── algorithms.js   ← Graf, BFS, Dijkstra, Stack, BST, Merge Sort
    ├── app.js          ← Controller UI
    └── test.js         ← Unit test (8 skenario)
```

---

## Fitur & Algoritma

| Fitur | Algoritma / Struktur Data | Kompleksitas |
|---|---|---|
| Cari rute halte tersedikit | BFS (Breadth-First Search) | O(V + E) |
| Cari rute jarak terpendek | Dijkstra (min-heap) | O((V+E) log V) |
| Riwayat pencarian | Stack berbasis Linked List | Push/Pop O(1) |
| Pencarian halte | BST (Binary Search Tree) | O(log n) rata-rata |
| Pengurutan halte | Merge Sort | O(n log n) |
| Representasi jaringan | Graf Adjacency List | — |

---

## Data Jaringan

- **25 Halte** — dibagi dalam 6 zona (A s/d F)
- **32 Edge** — koneksi dua arah berbobot (jarak km)
- Halte: Terminal Depok, Margonda, UI, Kukusan, Beji, Grand Depok City, Cibinong, Cinere, dll.

---

## Unit Test

Tab **Unit Test** menjalankan 8 skenario pengujian langsung di browser:

1. Graf & Adjacency List
2. BFS — Rute Halte Tersedikit
3. Dijkstra — Rute Jarak Terpendek
4. Stack — Riwayat Pencarian
5. BST — Pencarian Halte
6. Merge Sort — Pengurutan
7. Graf Lengkap 25 Halte
8. Performa Algoritma (100 iterasi)

---

*Proyek Akhir — Struktur Data & Algoritma*
