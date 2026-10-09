#!/usr/bin/env python3
"""Aceptación HTTP de POST /api/io/resolver: el servidor interpreta y resuelve. No modifica la BD salvo la caché de modelos.

Uso: backend local en el puerto 18080 con la BD de verificar_io_local.py (usuario demo.io@dagon.test).
  python3 scripts/verificar_io_resolver.py [--base URL] [--email E --password P]
"""
import json
import math
import sys
import time
import urllib.error
import urllib.request

ARGS = dict(zip(sys.argv[1::2], sys.argv[2::2]))
BASE = ARGS.get('--base', 'http://127.0.0.1:18080/api')
EMAIL = ARGS.get('--email', 'demo.io@dagon.test')
PASSWORD = ARGS.get('--password', 'DemoIO2026!')
fallos = []


def request(path, body=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(BASE + path, headers=headers, data=None if body is None else json.dumps(body).encode())
    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        content = error.read().decode()
        try:
            return error.code, json.loads(content)
        except json.JSONDecodeError:
            return error.code, content


def check(condition, message):
    print(('OK:   ' if condition else 'FALLA:'), message)
    if not condition:
        fallos.append(message)


def ruta(obj, camino):
    for parte in camino.split('.'):
        obj = obj[int(parte)] if isinstance(obj, list) else obj.get(parte) if isinstance(obj, dict) else None
    return obj


def cerca(a, b, tol=1e-4):
    return isinstance(a, (int, float)) and math.isclose(a, b, rel_tol=tol, abs_tol=tol)


MODELOS = [
    ('PL Wyndor', {'tipo': 'pl', 'metodo': 'simplex', 'datos': {'objetivo': 'max z=3x1+5x2', 'restricciones': ['x1<=4', '2x2<=12', '3x1+2x2<=18', 'x1,x2>=0']}}, 'z', 36),
    ('PL dieta (artificiales)', {'tipo': 'pl', 'metodo': 'simplex', 'datos': {'objetivo': 'min z=2x1+3x2', 'restricciones': ['x1+x2>=4', 'x1+3x2>=6', 'x1,x2>=0']}}, 'z', 9),
    ('Branch & bound', {'tipo': 'pl', 'metodo': 'branch_bound', 'datos': {'objetivo': 'max z=5x1+8x2', 'restricciones': ['x1+x2<=6', '5x1+9x2<=45', 'x1,x2>=0'], 'enteras': ['x1', 'x2']}}, 'z', 40),
    ('Mochila binaria', {'tipo': 'pl', 'metodo': 'branch_bound', 'datos': {'objetivo': 'max z=14x1+10x2+15x3', 'restricciones': ['9x1+6x2+2x3<=14', 'x1,x2,x3>=0'], 'binarias': ['x1', 'x2', 'x3']}}, 'z', 29),
    ('Cuadrática Hillier', {'tipo': 'cuadratica', 'metodo': 'kkt', 'datos': {'objetivo': 'max z=15x1+30x2+4x1*x2-2x1^2-4x2^2', 'restricciones': ['x1+2x2<=30', 'x1,x2>=0']}}, 'z', 270),
    ('Transporte Winston', {'tipo': 'transporte', 'metodo': 'vogel', 'datos': {'costos': [[8, 6, 10, 9], [9, 12, 13, 7], [14, 9, 16, 5]], 'oferta': [35, 50, 40], 'demanda': [45, 20, 30, 30]}}, 'optimo.costo', 1020),
    ('Asignación húngaro', {'tipo': 'asignacion', 'metodo': 'hungaro', 'datos': {'matriz': [[15, 13, 14, 17], [11, 12, 15, 13], [13, 12, 10, 11], [15, 17, 14, 16]], 'objetivo': 'min'}}, 'total', 49),
    ('CPM', {'tipo': 'redes', 'metodo': 'cpm', 'datos': {'actividades': [{'id': 'A', 'predecesoras': [], 'duracion': 3}, {'id': 'B', 'predecesoras': ['A'], 'duracion': 4}, {'id': 'C', 'predecesoras': ['A'], 'duracion': 2}, {'id': 'D', 'predecesoras': ['B'], 'duracion': 5}, {'id': 'E', 'predecesoras': ['C'], 'duracion': 3}, {'id': 'F', 'predecesoras': ['D', 'E'], 'duracion': 2}]}}, 'duracion', 14),
    ('Flujo máximo', {'tipo': 'grafos', 'metodo': 'flujo_maximo', 'datos': {'aristas': [{'origen': o, 'destino': d, 'valor': v} for o, d, v in [('s', 'v1', 16), ('s', 'v2', 13), ('v2', 'v1', 4), ('v1', 'v3', 12), ('v3', 'v2', 9), ('v2', 'v4', 14), ('v4', 'v3', 7), ('v3', 't', 20), ('v4', 't', 4)]], 'origen': 's', 'destino': 't'}}, 'flujoMaximo', 23),
    ('EOQ', {'tipo': 'inventarios', 'metodo': 'eoq', 'datos': {'D': 1000, 'S': 10, 'H': 0.5}}, 'Q', 200),
    ('M/M/1', {'tipo': 'colas', 'metodo': 'mm1', 'datos': {'lambda': 2, 'mu': 3}}, 'L', 2),
    ('Markov', {'tipo': 'markov', 'metodo': 'discreto', 'datos': {'P': [[0.9, 0.1], [0.2, 0.8]], 'inicial': [1, 0], 'n': 3}}, 'estacionaria.0', 2 / 3),
    ('Newton', {'tipo': 'noLineal', 'metodo': 'newton', 'datos': {'f': 'x^3-6*x^2+9*x+1', 'x0': 4}}, 'x', 3),
    ('Decisión con riesgo', {'tipo': 'decisiones', 'metodo': 'riesgo', 'datos': {'pagos': [[200000, -180000], [100000, -20000], [0, 0]], 'probabilidades': [0.5, 0.5], 'objetivo': 'max'}}, 'veip', 60000),
    ('Juego suma cero', {'tipo': 'juegos', 'metodo': 'suma_cero', 'datos': {'pagos': [[3, -1], [-2, 1]]}}, 'valor', 1 / 7),
]

# (nombre, enunciado, tipo esperado, camino en resultado, valor esperado)
ENUNCIADOS = [
    ('Mesas y sillas', 'Una fábrica produce mesas y sillas. Cada mesa aporta una ganancia de 3 euros y cada silla de 5 euros. Se pueden fabricar como máximo 4 mesas y 6 sillas. Cada mesa consume 3 horas de acabado y cada silla 2 horas; hay 18 horas de acabado disponibles. ¿Cuántas mesas y sillas debe producir para maximizar la ganancia? Las cantidades son continuas y no negativas.', 'pl', 'z', 36),
    ('Cafetería', 'Una cafetería vende Frappuccinos y Lattes. Cada Frappuccino genera una utilidad de $50 y requiere 4 onzas de jarabe y 2 de café; cada Latte genera $30 y requiere 3 onzas de jarabe y 1 de café. El inventario diario está limitado a 120 onzas de jarabe y 50 de café. ¿Cuántos de cada uno maximizan la utilidad?', 'pl', 'z', 1350),
    ('Lote económico', 'La demanda anual es de 10000 unidades, el costo por pedido es de 50 pesos y el costo de mantener una unidad al año es de 25 pesos. Calcular el lote económico.', 'inventarios', 'Q', 200),
    ('Cola de un servidor', 'Llegan 4 clientes por hora y se atienden 6 clientes por hora en un servidor. Las llegadas son Poisson y los tiempos de servicio exponenciales.', 'colas', 'L', 2),
    ('Selección de proyectos', 'Una empresa evalúa 3 proyectos y cada uno se acepta completo o se rechaza (decisión de sí o no). Los beneficios son 14, 10 y 15 millones; los costos son 9, 6 y 2 millones. El presupuesto es de 14 millones. ¿Qué proyectos elegir para maximizar el beneficio?', 'pl', 'z', 29),
    ('Transporte en texto', 'Una empresa distribuye productos desde dos almacenes. El almacén A dispone de 15 unidades y el B de 25 unidades. El destino Norte necesita 20 unidades y el Sur 20 unidades. Los costos por unidad son: A a Norte 6 pesos, A a Sur 2 pesos, B a Norte 1 peso, B a Sur 5 pesos. Minimizar el costo de transporte.', 'transporte', 'optimo.costo', 75),
]


def main():
    status, _ = request('/io/resolver', {'enunciado': 'Problema de prueba sin sesión para resolver.'})
    check(status in (401, 403), 'resolver requiere sesión')
    status, sesion = request('/usuarios/login', {'email': EMAIL, 'passwordHash': PASSWORD})
    if status != 200 or 'token' not in sesion:
        print('No se pudo iniciar sesión:', status)
        sys.exit(2)
    token = sesion['token']
    for body in ({'enunciado': 'corto'}, {'enunciado': 5}, {}):
        status, _ = request('/io/resolver', body, token)
        check(status == 400, 'entrada inválida rechazada con 400: ' + json.dumps(body)[:40])
    status, r = request('/io/resolver', {'modelo': {'tipo': 'colas', 'metodo': 'mm1', 'datos': {'lambda': 5, 'mu': 4}}}, token)
    check(status == 200 and r['solucion'] is None and r['estado'] != 'listo', 'modelo inválido (cola inestable) sin solución fabricada')
    status, r = request('/io/resolver', {'modelo': {'tipo': 'pl', 'metodo': 'simplex', 'datos': {'objetivo': 'max z=x1+x2', 'restricciones': ['x1+x2<=2', 'x1+x2>=5', 'x1,x2>=0']}}}, token)
    check(status == 200 and r['solucion'] and r['solucion']['estado'] == 'infactible', 'PL infactible: estado honesto')
    for nombre, modelo, camino, esperado in MODELOS:
        inicio = time.time()
        status, r = request('/io/resolver', {'modelo': modelo}, token)
        valor = ruta(r['solucion']['resultado'], camino) if status == 200 and r.get('solucion') else None
        check(cerca(valor, esperado), f'modelo {nombre}: {camino}={valor} (esperado {esperado:g}) en {time.time() - inicio:.2f}s')
    for nombre, texto, tipo, camino, esperado in ENUNCIADOS:
        inicio = time.time()
        status, r = request('/io/resolver', {'enunciado': texto}, token)
        ok = status == 200 and r.get('estado') == 'listo' and r.get('solucion') and r['modelo']['tipo'] == tipo
        valor = ruta(r['solucion']['resultado'], camino) if ok else None
        detalle = f"fuente={r.get('fuente')} " if isinstance(r, dict) else ''
        if not ok and isinstance(r, dict):
            detalle += f"estado={r.get('estado')} preguntas={r.get('preguntas')} error={r.get('errorSolucion')}"
        check(ok and cerca(valor, esperado), f'enunciado {nombre}: {camino}={valor} (esperado {esperado:g}) {detalle} {time.time() - inicio:.1f}s')
    print(f'\n{len(fallos)} fallos.' if fallos else '\nAceptación /io/resolver completada.')
    sys.exit(1 if fallos else 0)


if __name__ == '__main__':
    main()
