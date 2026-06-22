# ============================================================
# BACKEND SERVER — Flask Application
# ============================================================

from flask import Flask, request, jsonify, send_from_directory
from datetime import datetime
from data import DATA_HALTE, DATA_EDGE
from algorithms import (
    halteMap, adj, bfs, dijkstra, history_stack,
    merge_sort, bst_search, bst_prefix
)

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/init')
def api_init():
    # Convert integer keys to strings for JSON compatibility
    halte_map_str = {str(k): v for k, v in halteMap.items()}
    adj_str = {str(k): v for k, v in adj.items()}
    return jsonify({
        "DATA_HALTE": DATA_HALTE,
        "DATA_EDGE": DATA_EDGE,
        "halteMap": halte_map_str,
        "adj": adj_str
    })

@app.route('/api/halte')
def api_halte():
    query = request.args.get('query', '').strip()
    sort_by = request.args.get('sort', 'nama').strip()
    
    # Convert to list of dicts for front-end rendering
    list_halte = [{"id": row[0], "nama": row[1], "zona": row[2], "fasilitas": row[3]} for row in DATA_HALTE]
    
    # Filter by query if present
    if query:
        # Use our BST prefix search
        list_halte = bst_prefix(query)
        
    # Sort
    if sort_by == 'nama':
        list_halte = merge_sort(list_halte, key_func=lambda h: h['nama'])
    elif sort_by == 'id':
        list_halte = merge_sort(list_halte, key_func=lambda h: h['id'])
    elif sort_by == 'zona':
        # Sort by zona then name to match original Javascript sorting behavior
        list_halte = merge_sort(list_halte, key_func=lambda h: h['zona'] + h['nama'])
        
    return jsonify(list_halte)

@app.route('/api/rute')
def api_rute():
    asal = request.args.get('asal')
    tujuan = request.args.get('tujuan')
    algo = request.args.get('algo', 'bfs')
    
    if not asal or not tujuan:
        return jsonify({"error": "Asal dan tujuan harus diisi"}), 400
        
    try:
        asal = int(asal)
        tujuan = int(tujuan)
    except ValueError:
        return jsonify({"error": "ID halte tidak valid"}), 400
        
    if asal == tujuan:
        return jsonify({"error": "Halte asal dan tujuan tidak boleh sama."}), 400

    if algo == 'bfs':
        res = bfs(asal, tujuan)
        res_formatted = make_result(res, 'BFS — Halte Tersedikit', asal, tujuan)
        return jsonify(res_formatted)
    elif algo == 'dijkstra':
        res = dijkstra(asal, tujuan)
        res_formatted = make_result(res, 'Dijkstra — Jarak Terpendek', asal, tujuan)
        return jsonify(res_formatted)
    elif algo == 'keduanya':
        res_bfs = bfs(asal, tujuan)
        res_bfs_formatted = make_result(res_bfs, 'BFS — Halte Tersedikit', asal, tujuan)
        
        res_dijkstra = dijkstra(asal, tujuan)
        res_dijkstra_formatted = make_result(res_dijkstra, 'Dijkstra — Jarak Terpendek', asal, tujuan)
        
        return jsonify({
            "bfs": res_bfs_formatted,
            "dijkstra": res_dijkstra_formatted
        })
    else:
        return jsonify({"error": "Algoritma tidak valid"}), 400

def make_result(r, metode, asal, tujuan):
    if r["path"] is None:
        return {
            "metode": metode,
            "path": None,
            "pathNama": [],
            "jarak": None,
            "ms": r["ms"],
            "transit": 0,
            "asal": halteMap[asal]["nama"] if asal in halteMap else "Tidak diketahui",
            "tujuan": halteMap[tujuan]["nama"] if tujuan in halteMap else "Tidak diketahui",
            "timestamp": datetime.now().strftime("%d/%m/%Y, %H.%M.%S")
        }
        
    return {
        "metode": metode,
        "path": r["path"],
        "pathNama": [halteMap[hid]["nama"] for hid in r["path"]],
        "jarak": r["jarak"],
        "ms": r["ms"],
        "transit": len(r["path"]) - 2 if len(r["path"]) >= 2 else 0,
        "asal": halteMap[asal]["nama"],
        "tujuan": halteMap[tujuan]["nama"],
        "timestamp": datetime.now().strftime("%d/%m/%Y, %H.%M.%S")
    }

@app.route('/api/riwayat', methods=['GET'])
def api_get_riwayat():
    return jsonify(history_stack.to_list())

@app.route('/api/riwayat', methods=['POST'])
def api_push_riwayat():
    data = request.json
    if data:
        history_stack.push(data)
    return jsonify({"success": True, "size": history_stack.size})

@app.route('/api/riwayat', methods=['DELETE'])
def api_delete_riwayat():
    action = request.args.get('action', 'pop')
    if action == 'pop':
        removed = history_stack.pop()
        return jsonify({"success": True, "removed": removed, "size": history_stack.size})
    elif action == 'clear':
        history_stack.clear()
        return jsonify({"success": True, "size": 0})
    return jsonify({"error": "Aksi tidak valid"}), 400

@app.route('/api/test', methods=['GET', 'POST'])
def api_run_test():
    from test_algo import jalankan_test
    output = jalankan_test()
    return jsonify({"output": output})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
