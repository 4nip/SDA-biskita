# ============================================================
# STRUKTUR DATA & ALGORITMA
# Graf, BFS, Dijkstra, Stack, BST, Merge Sort
# ============================================================

import time
import heapq
from collections import deque
from data import DATA_HALTE, DATA_EDGE

# ---- Build Graf ----
halteMap = {}
adj = {}

def init_graf():
    global halteMap, adj
    halteMap.clear()
    adj.clear()
    for row in DATA_HALTE:
        hid, nama, zona, fas = row
        halteMap[hid] = {
            "id": hid,
            "nama": nama,
            "zona": zona,
            "fasilitas": fas
        }
        adj[hid] = []
    
    for a, b, d in DATA_EDGE:
        adj[a].append((b, d))
        adj[b].append((a, d))

# Run initialization once on import
init_graf()

# ---- BFS: Rute Halte Tersedikit ----
def bfs(asal, tujuan):
    asal, tujuan = int(asal), int(tujuan)
    if asal not in halteMap or tujuan not in halteMap:
        return {"path": None, "jarak": None, "ms": None}
    
    t0 = time.perf_counter()
    visited = {asal}
    queue = deque([(asal, [asal])])
    
    while queue:
        curr, path = queue.popleft()
        if curr == tujuan:
            ms = (time.perf_counter() - t0) * 1000
            return {
                "path": path,
                "jarak": hitung_jarak(path),
                "ms": round(ms, 4)
            }
        for nid, _ in adj[curr]:
            if nid not in visited:
                visited.add(nid)
                queue.append((nid, path + [nid]))
                
    return {"path": None, "jarak": None, "ms": None}

# ---- Dijkstra: Rute Jarak Terpendek ----
def dijkstra(asal, tujuan):
    asal, tujuan = int(asal), int(tujuan)
    if asal not in halteMap or tujuan not in halteMap:
        return {"path": None, "jarak": None, "ms": None}
    
    t0 = time.perf_counter()
    dist = {hid: float('inf') for hid in halteMap}
    prev = {hid: None for hid in halteMap}
    dist[asal] = 0.0
    
    heap = [(0.0, asal)]
    while heap:
        d, curr = heapq.heappop(heap)
        if d > dist[curr]:
            continue
        if curr == tujuan:
            break
        for nid, w in adj[curr]:
            alt = dist[curr] + w
            if alt < dist[nid]:
                dist[nid] = alt
                prev[nid] = curr
                heapq.heappush(heap, (alt, nid))
                
    ms = (time.perf_counter() - t0) * 1000
    if dist[tujuan] == float('inf'):
        return {"path": None, "jarak": None, "ms": None}
        
    path = []
    node = tujuan
    while node is not None:
        path.insert(0, node)
        node = prev[node]
        
    return {
        "path": path,
        "jarak": round(dist[tujuan], 2),
        "ms": round(ms, 4)
    }

def hitung_jarak(path):
    total = 0.0
    for i in range(len(path) - 1):
        curr = path[i]
        nxt = path[i+1]
        for nid, d in adj[curr]:
            if nid == nxt:
                total += d
                break
    return round(total, 2)

# ---- Stack berbasis Linked List ----
class StackNode:
    def __init__(self, val):
        self.val = val
        self.next = None

class LinkedStack:
    def __init__(self, max_size=20):
        self.head = None
        self.size = 0
        self.max_size = max_size

    def push(self, val):
        node = StackNode(val)
        node.next = self.head
        self.head = node
        self.size += 1
        if self.size > self.max_size:
            # Remove the oldest (last) node
            curr = self.head
            while curr.next and curr.next.next:
                curr = curr.next
            if curr.next:
                curr.next = None
            self.size -= 1

    def pop(self):
        if self.head is None:
            return None
        val = self.head.val
        self.head = self.head.next
        self.size -= 1
        return val

    def to_list(self):
        res = []
        curr = self.head
        while curr:
            res.append(curr.val)
            curr = curr.next
        return res

    def clear(self):
        self.head = None
        self.size = 0

# Shared stack instance for the API search history
history_stack = LinkedStack(max_size=20)

# ---- Merge Sort ----
def merge_sort(arr, key_func=None):
    if key_func is None:
        key_func = lambda x: x
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    L = merge_sort(arr[:mid], key_func)
    R = merge_sort(arr[mid:], key_func)
    
    res = []
    i = j = 0
    while i < len(L) and j < len(R):
        if key_func(L[i]) <= key_func(R[j]):
            res.append(L[i])
            i += 1
        else:
            res.append(R[j])
            j += 1
    res.extend(L[i:])
    res.extend(R[j:])
    return res

# ---- BST (Binary Search Tree) ----
class BSTNode:
    def __init__(self, key, val):
        self.key = key.lower()
        self.val = val
        self.left = None
        self.right = None

class BST:
    def __init__(self):
        self.root = None

    def insert(self, key, val):
        self.root = self._insert(self.root, key, val)

    def _insert(self, root, key, val):
        if root is None:
            return BSTNode(key, val)
        if key.lower() < root.key:
            root.left = self._insert(root.left, key, val)
        else:
            root.right = self._insert(root.right, key, val)
        return root

    def search(self, key):
        return self._search(self.root, key.lower())

    def _search(self, root, key):
        if root is None:
            return None
        if root.key == key:
            return root.val
        if key < root.key:
            return self._search(root.left, key)
        return self._search(root.right, key)

    def prefix_search(self, prefix):
        res = []
        self._prefix_search(self.root, prefix.lower(), res)
        return res

    def _prefix_search(self, root, prefix, res):
        if root is None:
            return
        self._prefix_search(root.left, prefix, res)
        if root.key.startswith(prefix):
            res.append(root.val)
        self._prefix_search(root.right, prefix, res)

# Initialize BST with Biskita halts
bst_instance = BST()
for hid, nama, zona, fas in DATA_HALTE:
    halt_info = {"id": hid, "nama": nama, "zona": zona, "fasilitas": fas}
    bst_instance.insert(nama, halt_info)

def bst_search(nama):
    return bst_instance.search(nama)

def bst_prefix(prefix):
    return bst_instance.prefix_search(prefix)
