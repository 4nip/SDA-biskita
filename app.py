from flask import Flask, request, render_template, redirect, url_for
from datetime import datetime
from data import DATA_HALTE, DATA_EDGE
from algorithms import (
    halteMap, adj, bfs, dijkstra, history_stack,
    merge_sort, bst_prefix
)

app = Flask(__name__, static_url_path='/css', static_folder='css')

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

@app.route('/', methods=['GET', 'POST'])
def index():
    tab = request.args.get('tab', 'cari')
    
    # Common Data
    sorted_halte = sorted(DATA_HALTE, key=lambda x: x[0])
    stack_size = history_stack.size
    
    context = {
        'tab': tab,
        'DATA_HALTE': sorted_halte,
        'halteMap': halteMap,
        'adj': adj,
        'stack_size': stack_size,
    }
    
    if tab == 'cari':
        context['asal'] = request.form.get('asal', 1, type=int)
        context['tujuan'] = request.form.get('tujuan', 13, type=int)
        context['algo'] = request.form.get('algo', 'bfs')
        
        if request.method == 'POST':
            asal = context['asal']
            tujuan = context['tujuan']
            algo = context['algo']
            
            if asal == tujuan:
                context['error'] = "Halte asal dan tujuan tidak boleh sama."
            else:
                if algo == 'bfs':
                    res = bfs(asal, tujuan)
                    r = make_result(res, 'BFS — Halte Tersedikit', asal, tujuan)
                    history_stack.push(r)
                    context['result_single'] = r
                elif algo == 'dijkstra':
                    res = dijkstra(asal, tujuan)
                    r = make_result(res, 'Dijkstra — Jarak Terpendek', asal, tujuan)
                    history_stack.push(r)
                    context['result_single'] = r
                elif algo == 'keduanya':
                    res_bfs = bfs(asal, tujuan)
                    r_bfs = make_result(res_bfs, 'BFS — Halte Tersedikit', asal, tujuan)
                    history_stack.push(r_bfs)
                    
                    res_dijkstra = dijkstra(asal, tujuan)
                    r_dijkstra = make_result(res_dijkstra, 'Dijkstra — Jarak Terpendek', asal, tujuan)
                    history_stack.push(r_dijkstra)
                    
                    context['result_bfs'] = r_bfs
                    context['result_dijkstra'] = r_dijkstra
                    
                    if r_bfs['path'] and r_dijkstra['path']:
                        selisih = abs(r_bfs['jarak'] - r_dijkstra['jarak'])
                        if r_dijkstra['jarak'] < r_bfs['jarak']:
                            context['compare_note'] = f"Dijkstra lebih hemat {selisih:.2f} km dibanding BFS."
                        elif r_bfs['jarak'] < r_dijkstra['jarak']:
                            context['compare_note'] = "BFS menghasilkan jarak lebih pendek pada rute ini."
                        else:
                            context['compare_note'] = f"Kedua algoritma menghasilkan jarak yang sama: {r_dijkstra['jarak']} km."

    elif tab == 'halte':
        query = request.args.get('query', '').strip().lower()
        sort_by = request.args.get('sort', 'nama').strip()
        
        list_halte = [{"id": row[0], "nama": row[1], "zona": row[2], "fasilitas": row[3]} for row in DATA_HALTE]
        
        if query:
            list_halte = bst_prefix(query)
            
        if sort_by == 'nama':
            list_halte = merge_sort(list_halte, key_func=lambda h: h['nama'])
        elif sort_by == 'id':
            list_halte = merge_sort(list_halte, key_func=lambda h: h['id'])
        elif sort_by == 'zona':
            list_halte = merge_sort(list_halte, key_func=lambda h: h['zona'] + h['nama'])
            
        context['list_halte'] = list_halte
        context['query'] = query
        context['sort_by'] = sort_by

    elif tab == 'riwayat':
        action = request.args.get('action')
        if action == 'pop':
            history_stack.pop()
            return redirect(url_for('index', tab='riwayat'))
        elif action == 'clear':
            history_stack.clear()
            return redirect(url_for('index', tab='riwayat'))
            
        context['history'] = history_stack.to_list()
        context['stack_size'] = history_stack.size

    elif tab == 'test':
        if request.method == 'POST':
            from test_algo import jalankan_test
            context['test_output'] = jalankan_test()

    return render_template('index.html', **context)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
