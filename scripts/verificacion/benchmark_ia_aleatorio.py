"""Benchmark (uso: python3 benchmark_ia_aleatorio.py SEMILLA PAUSA_S [generadores]; requiere networkx y node; crea un usuario e2e.browser.* en el backend de BASE): problemas aleatorios -> API de produccion (IA) -> solvers del frontend -> comparacion
contra una verdad independiente (fuerza bruta / networkx / formula cerrada). No usa los solvers del proyecto como verdad."""
import itertools, json, math, random, subprocess, sys, time, urllib.request, urllib.error
import networkx as nx

SEED = int(sys.argv[1]) if len(sys.argv) > 1 else 1
PAUSA = float(sys.argv[2]) if len(sys.argv) > 2 else 12
BASE = 'https://backend-production-87aac.up.railway.app/api'
ROOT = '/home/aldo/Descargas/Dagon_Project/Dagon-Project'
rnd = random.Random(SEED)


def api(path, body=None, token=None):
    h = {'Content-Type': 'application/json'}
    if token:
        h['Authorization'] = 'Bearer ' + token
    r = urllib.request.Request(BASE + path, data=None if body is None else json.dumps(body).encode(), headers=h)
    try:
        with urllib.request.urlopen(r, timeout=90) as x:
            return x.status, json.load(x)
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {}


def resolver(modelo):
    p = subprocess.run(['node', ROOT + '/scripts/io_resolver_modelo.cjs'], input=json.dumps(modelo), text=True, capture_output=True, timeout=60)
    return (json.loads(p.stdout), None) if p.returncode == 0 else (None, p.stderr.strip()[:160])


# ---------- generadores: (texto, verdad, extractor del resultado del solver, descripcion) ----------
def p_entera():
    p1, p2 = rnd.randint(3, 9), rnd.randint(3, 9)
    a11, a12, a21, a22 = (rnd.randint(1, 6) for _ in range(4))
    b1, b2 = rnd.randint(18, 40), rnd.randint(18, 40)
    texto = (f"Un taller fabrica dos productos, A y B. Cada unidad de A deja una utilidad de {p1} pesos y cada unidad de B de {p2} pesos. "
             f"Cada unidad de A usa {a11} horas de máquina y cada unidad de B usa {a12} horas; hay {b1} horas de máquina disponibles. "
             f"Cada unidad de A usa {a21} kilos de material y cada unidad de B {a22} kilos; hay {b2} kilos de material disponibles. "
             "Solo se pueden fabricar unidades completas (cantidades enteras). Maximiza la utilidad total.")
    mejor = max(p1 * x + p2 * y for x in range(0, 60) for y in range(0, 60) if a11 * x + a12 * y <= b1 and a21 * x + a22 * y <= b2)
    return texto, mejor, lambda s: s['resultado']['z'], 'PL entera'


def p_continua():
    p1, p2 = rnd.randint(3, 9), rnd.randint(3, 9)
    a11, a12, a21, a22 = (rnd.randint(1, 6) for _ in range(4))
    b1, b2 = rnd.randint(18, 40), rnd.randint(18, 40)
    texto = (f"Una fábrica produce mesas y sillas. Cada mesa deja una ganancia de {p1} pesos y cada silla de {p2} pesos. "
             f"Cada mesa usa {a11} horas de carpintería y cada silla {a12} horas; hay {b1} horas de carpintería disponibles. "
             f"Cada mesa usa {a21} horas de pintura y cada silla {a22} horas; hay {b2} horas de pintura disponibles. "
             "Las cantidades pueden ser fraccionarias (continuas). Maximiza la ganancia.")
    rectas = [(a11, a12, b1), (a21, a22, b2), (1, 0, 0), (0, 1, 0)]
    mejor = 0
    for (c1, c2, c3), (d1, d2, d3) in itertools.combinations(rectas, 2):
        det = c1 * d2 - c2 * d1
        if abs(det) < 1e-12:
            continue
        x, y = (c3 * d2 - c2 * d3) / det, (c1 * d3 - c3 * d1) / det
        if x >= -1e-9 and y >= -1e-9 and a11 * x + a12 * y <= b1 + 1e-9 and a21 * x + a22 * y <= b2 + 1e-9:
            mejor = max(mejor, p1 * x + p2 * y)
    return texto, mejor, lambda s: s['resultado']['z'], 'PL continua'


def p_mochila():
    n = 5
    v = [rnd.randint(4, 15) for _ in range(n)]
    w = [rnd.randint(2, 9) for _ in range(n)]
    cap = sum(w) // 2 + rnd.randint(0, 2)
    texto = (f"Una empresa evalúa {n} proyectos y cada uno se acepta completo o se rechaza (decisión de sí o no). "
             f"Los beneficios son {', '.join(map(str, v[:-1]))} y {v[-1]} millones; los costos son {', '.join(map(str, w[:-1]))} y {w[-1]} millones. "
             f"El presupuesto es de {cap} millones. ¿Qué proyectos elegir para maximizar el beneficio?")
    mejor = max(sum(v[i] for i in range(n) if m >> i & 1) for m in range(1 << n) if sum(w[i] for i in range(n) if m >> i & 1) <= cap)
    return texto, mejor, lambda s: s['resultado']['z'], 'PL binaria'


def p_transporte():
    while True:
        s = [rnd.randint(8, 16) for _ in range(2)]
        d = [rnd.randint(3, 10) for _ in range(2)]
        d.append(sum(s) - sum(d))
        if d[2] > 0:
            break
    c = [[rnd.randint(2, 12) for _ in range(3)] for _ in range(2)]
    texto = (f"Dos plantas ofrecen {s[0]} y {s[1]} toneladas. Tres ciudades demandan {d[0]}, {d[1]} y {d[2]} toneladas. "
             f"Los costos de envío por tonelada desde la planta 1 son {c[0][0]}, {c[0][1]} y {c[0][2]} hacia las ciudades 1, 2 y 3; "
             f"desde la planta 2 son {c[1][0]}, {c[1][1]} y {c[1][2]}. Minimiza el costo total de transporte.")
    mejor = 10 ** 9
    for x0 in range(s[0] + 1):
        for x1 in range(s[0] - x0 + 1):
            x2 = s[0] - x0 - x1
            y = [d[0] - x0, d[1] - x1, d[2] - x2]
            if min(y) < 0:
                continue
            mejor = min(mejor, sum(c[0][j] * [x0, x1, x2][j] + c[1][j] * y[j] for j in range(3)))
    return texto, mejor, lambda s: s['resultado']['optimo']['costo'], 'Transporte'


def p_asignacion():
    n = 4
    m = [[rnd.randint(5, 30) for _ in range(n)] for _ in range(n)]
    filas = '; '.join(f"el trabajador {i + 1} cuesta {', '.join(map(str, m[i][:-1]))} y {m[i][-1]} en las tareas 1 a 4" for i in range(n))
    texto = f"Cuatro trabajadores deben asignarse uno a cada una de cuatro tareas. Los costos en pesos son: {filas}. Minimiza el costo total de la asignación."
    mejor = min(sum(m[i][p[i]] for i in range(n)) for p in itertools.permutations(range(n)))
    return texto, mejor, lambda s: s['resultado']['total'], 'Asignación'


def red_aleatoria(n, extra):
    nombres = 'ABCDEFGH'[:n]
    aristas = {}
    for i in range(1, n):
        j = rnd.randrange(i)
        aristas[(nombres[j], nombres[i])] = rnd.randint(2, 12)
    while len(aristas) < n - 1 + extra:
        a, b = rnd.sample(range(n), 2)
        a, b = sorted((a, b))
        aristas.setdefault((nombres[a], nombres[b]), rnd.randint(2, 12))
    return nombres, aristas


def p_ruta():
    nombres, ar = red_aleatoria(6, 4)
    g = nx.Graph()
    for (a, b), w in ar.items():
        g.add_edge(a, b, weight=w)
    lista = ', '.join(f"{a}-{b} {w}" for (a, b), w in ar.items())
    texto = f"En una red de caminos de doble sentido las distancias en km son: {lista}. ¿Cuál es la distancia más corta de {nombres[0]} a {nombres[-1]}?"
    return texto, nx.dijkstra_path_length(g, nombres[0], nombres[-1]), lambda s: s['resultado']['distancia'], 'Ruta más corta'


def p_mst():
    nombres, ar = red_aleatoria(5, 3)
    g = nx.Graph()
    for (a, b), w in ar.items():
        g.add_edge(a, b, weight=w)
    lista = ', '.join(f"{a}-{b} {w}" for (a, b), w in ar.items())
    texto = f"Se quieren conectar cinco oficinas ({', '.join(nombres)}) con cable. Los tramos posibles y su longitud en metros son: {lista}. Encuentra la menor longitud total de cable que conecta todas las oficinas (árbol de expansión mínima)."
    return texto, sum(d['weight'] for _, _, d in nx.minimum_spanning_edges(g, data=True)), lambda s: s['resultado']['total'], 'Árbol mínimo'


def p_flujo():
    g = nx.DiGraph()
    caps = {('S', 'A'): rnd.randint(5, 15), ('S', 'B'): rnd.randint(5, 15), ('A', 'B'): rnd.randint(1, 8),
            ('A', 'T'): rnd.randint(4, 12), ('B', 'T'): rnd.randint(4, 12), ('B', 'A'): rnd.randint(1, 5)}
    for (a, b), c in caps.items():
        g.add_edge(a, b, capacity=c)
    lista = ', '.join(f"{a}->{b} {c}" for (a, b), c in caps.items())
    texto = f"Una red de tuberías dirigida tiene capacidades en litros por segundo: {lista}. ¿Cuál es el flujo máximo de S a T?"
    return texto, nx.maximum_flow_value(g, 'S', 'T'), lambda s: s['resultado']['flujoMaximo'], 'Flujo máximo'


def p_eoq():
    D, S, H = rnd.randint(2000, 20000), rnd.randint(20, 120), rnd.randint(2, 15)
    texto = f"La demanda anual es de {D} unidades, el costo por pedido es de {S} pesos y el costo de mantener una unidad en inventario por año es de {H} pesos. Calcula el lote económico de pedido."
    return texto, math.sqrt(2 * D * S / H), lambda s: s['resultado']['Q'], 'EOQ'


def p_mm1():
    mu = rnd.randint(8, 20)
    lam = rnd.randint(3, mu - 2)
    texto = f"A una ventanilla llegan {lam} clientes por hora y el único cajero atiende {mu} clientes por hora. Calcula el número promedio de clientes en el sistema."
    return texto, lam / (mu - lam), lambda s: s['resultado']['L'], 'Cola M/M/1'


def p_riesgo():
    nombres = ['Ampliar', 'Mantener', 'Vender']
    pagos = [[rnd.randint(-20, 60) for _ in range(3)] for _ in range(3)]
    a = rnd.randint(1, 5)
    b = rnd.randint(1, 5)
    c = 10 - a - b if 10 - a - b >= 1 else 1
    tot = a + b + c
    pr = [round(a / tot, 4), round(b / tot, 4)]
    pr.append(round(1 - sum(pr), 4))
    ve = [sum(p * q for p, q in zip(f, pr)) for f in pagos]
    mejor = max(range(3), key=lambda i: ve[i])
    filas = '; '.join(f"{nombres[i]} paga {pagos[i][0]}, {pagos[i][1]} y {pagos[i][2]}" for i in range(3))
    texto = (f"Un inversionista elige entre ampliar, mantener o vender. Las ganancias en miles de pesos según la economía (crece, estable, recesión) son: {filas}. "
             f"Las probabilidades de crece, estable y recesión son {pr[0]}, {pr[1]} y {pr[2]}. ¿Qué alternativa maximiza la ganancia esperada y cuál es ese valor?")
    return texto, ve[mejor], lambda s: s['resultado']['valorEsperado'], 'Decisión bajo riesgo'


def p_juego():
    while True:
        a, b, c, d = (rnd.randint(-5, 9) for _ in range(4))
        maximin = max(min(a, b), min(c, d))
        minimax = min(max(a, c), max(b, d))
        if maximin != minimax and (a + d - b - c) != 0:
            break
    valor = (a * d - b * c) / (a + d - b - c)
    texto = (f"Dos empresas compiten en un juego de suma cero. La matriz de ganancias de la empresa A (filas) contra B (columnas) es: "
             f"si A usa la estrategia 1 gana {a} contra la estrategia 1 de B y {b} contra la estrategia 2 de B; "
             f"si A usa la estrategia 2 gana {c} contra la estrategia 1 de B y {d} contra la estrategia 2 de B. Encuentra el valor del juego.")
    return texto, valor, lambda s: s['resultado']['valor'], 'Juego suma cero'


def p_cuadratica():
    a, b = rnd.randint(2, 9), rnd.randint(2, 9)
    c = rnd.randint(1, a + b - 1)
    texto = f"Minimizar (x - {a})^2 + (y - {b})^2 sujeto a x + y <= {c}, con x >= 0 e y >= 0."
    f = lambda x, y: (x - a) ** 2 + (y - b) ** 2
    t = (a + b - c) / 2
    cand = [(c, 0), (0, c), (0, 0)]
    if a - t >= 0 and b - t >= 0:
        cand.append((a - t, b - t))
    mejor = min(f(x, y) for x, y in cand if x + y <= c + 1e-9)
    return texto, mejor, lambda s: s['resultado']['z'], 'Cuadrática'


GENERADORES = [p_entera, p_continua, p_mochila, p_transporte, p_asignacion, p_ruta, p_mst, p_flujo, p_eoq, p_mm1, p_riesgo, p_juego, p_cuadratica]
if len(sys.argv) > 3:
    GENERADORES = [globals()[n] for n in sys.argv[3].split(',')]

st, s = api('/usuarios/registro', {'nombre': 'E2E Benchmark', 'email': f'e2e.browser.ia{rnd.randrange(16**6):06x}@example.com', 'password': 'E2eBench2026!qZ9'})
assert st == 200, (st, s)
tok = s['token']
filas = []
for i, gen in enumerate(GENERADORES):
    texto, verdad, extraer, nombre = gen()
    registro = {'tipo': nombre, 'verdad': round(verdad, 6)}
    for intento in range(2):
        if i or intento:
            time.sleep(PAUSA)
        t0 = time.time()
        code, r = api('/io/interpretar', {'enunciado': texto}, tok)
        registro.update(http=code, estado=r.get('estado'), fuente=r.get('fuente'), seg=round(time.time() - t0, 1))
        if r.get('estado') == 'listo':
            break
    if r.get('estado') != 'listo':
        registro.update(resultado='NO_MODELADO', detalle=(r.get('preguntas') or [r.get('resumen')])[:1])
    else:
        m = r['modelo']
        registro.update(modelo=f"{m['tipo']}/{m['metodo']}")
        sol, err = resolver(m)
        if sol is None:
            registro.update(resultado='SOLVER_ERROR', detalle=err)
        else:
            try:
                obtenido = extraer(sol)
                ok = abs(obtenido - verdad) <= 1e-4 * max(1, abs(verdad))
                registro.update(obtenido=round(obtenido, 6), resultado='OK' if ok else 'INCORRECTO')
            except Exception as e:
                registro.update(resultado='FORMA_INESPERADA', detalle=repr(e)[:100])
    filas.append(registro)
    print(json.dumps(registro, ensure_ascii=False), flush=True)

ok = sum(f['resultado'] == 'OK' for f in filas)
print(f"\nSEED {SEED}: {ok}/{len(filas)} correctos")
for f in filas:
    if f['resultado'] != 'OK':
        print('FALLO:', f['tipo'], f['resultado'], f.get('detalle', ''))
