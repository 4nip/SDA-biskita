// ============================================================
// STRUKTUR DATA & ALGORITMA — Client-side JavaScript
// Graf, BFS, Dijkstra, Stack (Linked List), BST, Merge Sort
// ============================================================

// ---- Build Graf ----
const halteMap = {};
const adj = {};

function initGraf() {
  for (const [hid, nama, zona, fas] of DATA_HALTE) {
    halteMap[hid] = { id: hid, nama, zona, fasilitas: fas };
    adj[hid] = [];
  }
  for (const [a, b, d] of DATA_EDGE) {
    adj[a].push([b, d]);
    adj[b].push([a, d]);
  }
}

// ---- BFS: Rute Halte Tersedikit ----
function bfs(asal, tujuan) {
  if (!(asal in halteMap) || !(tujuan in halteMap))
    return { path: null, jarak: null, ms: null };

  const t0 = performance.now();
  const visited = new Set([asal]);
  const queue = [[asal, [asal]]];
  let head = 0;

  while (head < queue.length) {
    const [curr, path] = queue[head++];
    if (curr === tujuan) {
      const ms = performance.now() - t0;
      return { path, jarak: hitungJarak(path), ms: +ms.toFixed(4) };
    }
    for (const [nid] of adj[curr]) {
      if (!visited.has(nid)) {
        visited.add(nid);
        queue.push([nid, [...path, nid]]);
      }
    }
  }
  return { path: null, jarak: null, ms: null };
}

// ---- Dijkstra: Rute Jarak Terpendek ----
function dijkstra(asal, tujuan) {
  if (!(asal in halteMap) || !(tujuan in halteMap))
    return { path: null, jarak: null, ms: null };

  const t0 = performance.now();
  const dist = {};
  const prev = {};
  for (const hid in halteMap) {
    dist[hid] = Infinity;
    prev[hid] = null;
  }
  dist[asal] = 0;

  // Simple priority queue using sorted array
  const heap = [[0, asal]];
  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0]);
    const [d, curr] = heap.shift();
    if (d > dist[curr]) continue;
    if (curr === tujuan) break;
    for (const [nid, w] of adj[curr]) {
      const alt = dist[curr] + w;
      if (alt < dist[nid]) {
        dist[nid] = alt;
        prev[nid] = curr;
        heap.push([alt, nid]);
      }
    }
  }

  const ms = performance.now() - t0;
  if (dist[tujuan] === Infinity)
    return { path: null, jarak: null, ms: null };

  const path = [];
  let node = tujuan;
  while (node !== null) {
    path.unshift(node);
    node = prev[node];
  }

  return { path, jarak: +dist[tujuan].toFixed(2), ms: +ms.toFixed(4) };
}

function hitungJarak(path) {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const curr = path[i];
    const nxt = path[i + 1];
    for (const [nid, d] of adj[curr]) {
      if (nid === nxt) { total += d; break; }
    }
  }
  return +total.toFixed(2);
}

// ---- Stack berbasis Linked List ----
class StackNode {
  constructor(val) {
    this.val = val;
    this.next = null;
  }
}

class LinkedStack {
  constructor(maxSize = 20) {
    this.head = null;
    this.size = 0;
    this.maxSize = maxSize;
  }

  push(val) {
    const node = new StackNode(val);
    node.next = this.head;
    this.head = node;
    this.size++;
    if (this.size > this.maxSize) {
      let curr = this.head;
      while (curr.next && curr.next.next) curr = curr.next;
      if (curr.next) curr.next = null;
      this.size--;
    }
  }

  pop() {
    if (!this.head) return null;
    const val = this.head.val;
    this.head = this.head.next;
    this.size--;
    return val;
  }

  toList() {
    const res = [];
    let curr = this.head;
    while (curr) { res.push(curr.val); curr = curr.next; }
    return res;
  }

  clear() {
    this.head = null;
    this.size = 0;
  }
}

const historyStack = new LinkedStack(20);

// ---- Merge Sort ----
function mergeSort(arr, keyFunc = null) {
  if (!keyFunc) keyFunc = x => x;
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const L = mergeSort(arr.slice(0, mid), keyFunc);
  const R = mergeSort(arr.slice(mid), keyFunc);

  const res = [];
  let i = 0, j = 0;
  while (i < L.length && j < R.length) {
    if (keyFunc(L[i]) <= keyFunc(R[j])) res.push(L[i++]);
    else res.push(R[j++]);
  }
  while (i < L.length) res.push(L[i++]);
  while (j < R.length) res.push(R[j++]);
  return res;
}

// ---- BST (Binary Search Tree) ----
class BSTNode {
  constructor(key, val) {
    this.key = key.toLowerCase();
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

class BST {
  constructor() { this.root = null; }

  insert(key, val) {
    this.root = this._insert(this.root, key, val);
  }
  _insert(root, key, val) {
    if (!root) return new BSTNode(key, val);
    if (key.toLowerCase() < root.key) root.left = this._insert(root.left, key, val);
    else root.right = this._insert(root.right, key, val);
    return root;
  }

  search(key) {
    return this._search(this.root, key.toLowerCase());
  }
  _search(root, key) {
    if (!root) return null;
    if (root.key === key) return root.val;
    return key < root.key ? this._search(root.left, key) : this._search(root.right, key);
  }

  prefixSearch(prefix) {
    const res = [];
    this._prefixSearch(this.root, prefix.toLowerCase(), res);
    return res;
  }
  _prefixSearch(root, prefix, res) {
    if (!root) return;
    this._prefixSearch(root.left, prefix, res);
    if (root.key.startsWith(prefix)) res.push(root.val);
    this._prefixSearch(root.right, prefix, res);
  }
}

const bstInstance = new BST();
function initBST() {
  for (const [hid, nama, zona, fas] of DATA_HALTE) {
    bstInstance.insert(nama, { id: hid, nama, zona, fasilitas: fas });
  }
}
