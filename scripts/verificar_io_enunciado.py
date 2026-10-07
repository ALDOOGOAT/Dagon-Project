#!/usr/bin/env python3
"""Aceptación HTTP local: texto → modelo → solvers reales. No modifica la BD."""
import json
import math
import sys
from pathlib import Path
import subprocess
import urllib.error
import urllib.request

BASE = 'http://127.0.0.1:18080/api'
ROOT = Path(__file__).resolve().parent.parent


def request(path, body=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(BASE + path, headers=headers,
        data=None if body is None else json.dumps(body).encode())
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        content = error.read().decode()
        try:
            return error.code, json.loads(content)
        except json.JSONDecodeError:
            return error.code, content


def check(condition, message):
    if not condition:
        raise AssertionError(message)
    print('OK:', message)


def solve(model):
    result = subprocess.run(['node', str(ROOT / 'scripts/io_resolver_modelo.cjs')],
        input=json.dumps(model), text=True, capture_output=True, timeout=20)
    check(result.returncode == 0, 'adaptador acepta modelo HTTP: ' + model['tipo'])
    return json.loads(result.stdout)


def main():
    status, _ = request('/io/interpretar', {'enunciado': 'Problema de prueba sin sesión.'})
    check(status in (401, 403), 'interpretación requiere sesión')
    status, session = request('/usuarios/login', {'email': 'demo.io@dagon.test', 'passwordHash': 'DemoIO2026!'})
    check(status == 200 and 'token' in session, 'sesión de demo local')
    token = session['token']
    for body in ({'enunciado': 'corto'}, {'enunciado': 5}, {'enunciado': 'x' * 12001}):
        status, _ = request('/io/interpretar', body, token)
        check(status == 400, 'entrada inválida rechazada')
    casos = [
        ('pl', 'Una fábrica produce mesas y sillas. Cada mesa aporta una ganancia de 3 euros y cada silla de 5 euros. Se pueden fabricar como máximo 4 mesas y 6 sillas. Cada mesa consume 3 horas de acabado y cada silla 2 horas; hay 18 horas de acabado disponibles. ¿Cuántas mesas y sillas debe producir para maximizar la ganancia? Las cantidades son continuas y no negativas.', 'Valor objetivo Z', 36),
        ('inventarios', 'La demanda anual es de 10000 unidades, el costo por pedido es de 50 pesos y el costo de mantener una unidad al año es de 25 pesos. Calcular el lote económico.', 'Cantidad de pedido', 200),
        ('colas', 'Llegan 4 clientes por hora y se atienden 6 clientes por hora en un servidor. Las llegadas son Poisson y los tiempos de servicio exponenciales.', 'L', 2),
    ]
    for tipo, texto, metrica, esperado in casos:
        status, response = request('/io/interpretar', {'enunciado': texto}, token)
        check(status == 200 and response['estado'] == 'listo', 'interpretación completa ' + tipo)
        check(response['modelo']['tipo'] == tipo and response['modelo']['variables'], 'variables con significado ' + tipo)
        check(all(e['texto'] in texto for e in response['modelo']['evidencias']), 'evidencia literal ' + tipo)
        solved = solve(response['modelo'])
        value = next(m['valor'] for m in solved['metricas'] if m['etiqueta'] == metrica)
        check(math.isclose(value, esperado, rel_tol=1e-8), 'resultado independiente ' + tipo)
        check(solved['pasos'] and solved['grafico'], 'procedimiento y gráfica ' + tipo)
        if tipo == 'pl':
            check(solved['resultado']['x'] == {'x1': 2, 'x2': 6}, 'decisión óptima mesas/sillas (2,6)')
        if tipo == 'colas':
            check(math.isclose(solved['resultado']['W'], .5), 'tiempo medio 0.5 horas')
    incompletos = [
        'Quiero calcular el lote económico, la demanda anual es de 10000 unidades.',
        'Una fábrica produce mesas y sillas y quiere maximizar sus beneficios.',
        'Llegan 4 clientes por hora y se atienden 6 clientes por minuto en un servidor.',
        'Una fábrica produce mesas y sillas. Las variables deben ser enteras para maximizar la ganancia.',
    ]
    for texto in incompletos:
        status, response = request('/io/interpretar', {'enunciado': texto}, token)
        check(status == 200 and response['estado'] != 'listo' and response['modelo'] is None,
              'datos faltantes/alcance: sin solución fabricada')
    for esperado, objetivo, restricciones in [
        ('no_acotado', 'max z=x1+x2', ['x1,x2>=0']),
        ('infactible', 'max z=x1+x2', ['x1<=1', 'x1>=2', 'x1,x2>=0']),
    ]:
        modelo = {'tipo': 'pl', 'metodo': 'simplex', 'variables': [],
                  'datos': {'objetivo': objetivo, 'restricciones': restricciones}}
        texto = 'Analiza este modelo explícito continuo: ' + json.dumps(modelo)
        status, response = request('/io/interpretar', {'enunciado': texto}, token)
        check(status == 200 and response['estado'] == 'listo', 'extracción modelo explícito ' + esperado)
        solved = solve(response['modelo'])
        check(solved['estado'] == esperado, 'estado matemático honesto ' + esperado)
    estructurados = [
        ('transporte', 'vogel', {'costos': [[2, 4], [3, 1]], 'oferta': [20, 30], 'demanda': [25, 25]}, 'Costo óptimo', 80),
        ('asignacion', 'hungaro', {'matriz': [[1, 8], [8, 2]], 'objetivo': 'min'}, 'Costo total', 3),
        ('redes', 'cpm', {'actividades': [{'id': 'A', 'predecesoras': [], 'duracion': 3},
            {'id': 'B', 'predecesoras': ['A'], 'duracion': 5}]}, 'Duración del proyecto', 8),
        ('markov', 'discreto', {'P': [[.8, .2], [.3, .7]], 'inicial': [1, 0], 'n': 2}, 'Estado 1 después de 2 pasos', .7),
        ('noLineal', 'dorada', {'f': '(x-2)^2', 'a': 0, 'b': 5, 'objetivo': 'min'}, 'x', 2),
    ]
    for tipo, metodo, datos, metrica, esperado in estructurados:
        modelo = {'tipo': tipo, 'metodo': metodo, 'variables': [], 'datos': datos}
        texto = 'Resolver este modelo explícito con sus datos completos: ' + json.dumps(modelo)
        status, response = request('/io/interpretar', {'enunciado': texto}, token)
        check(status == 200 and response['estado'] == 'listo', 'contrato ejecutable ' + tipo)
        solved = solve(response['modelo'])
        value = next(m['valor'] for m in solved['metricas'] if m['etiqueta'] == metrica)
        check(math.isclose(value, esperado, rel_tol=1e-5, abs_tol=1e-5), 'solver real ' + tipo)
    if '--con-ia' in sys.argv:
        texto = ('Una empresa distribuye productos desde dos almacenes. El almacén A dispone de 15 unidades '
                 'y el B de 25 unidades. El destino Norte necesita 20 unidades y el Sur 20 unidades. '
                 'Los costos por unidad son: A a Norte 6 pesos, A a Sur 2 pesos, B a Norte 1 peso, '
                 'B a Sur 5 pesos. Minimizar el costo de transporte, enviando toda la oferta y '
                 'satisfaciendo exactamente la demanda. Las cantidades son continuas y no negativas.')
        status, response = request('/io/interpretar', {'enunciado': texto}, token)
        check(status == 200 and response['estado'] == 'listo' and response['fuente'] != 'local',
              'enunciado general interpretado por proveedor IA real')
        check(response['modelo']['datos']['costos'] == [[6, 2], [1, 5]], 'IA conserva coeficientes del texto')
        check(response['modelo']['variables'] and all(e['texto'] in texto for e in response['modelo']['evidencias']),
              'IA entrega variables con significado y evidencia literal')
        solved = solve(response['modelo'])
        check(math.isclose(solved['resultado']['optimo']['costo'], 75), 'IA → solver transporte: costo óptimo 75')
    print('Aceptación local completada: API autenticada y solvers reales. No prueba navegador/GPU.')


if __name__ == '__main__':
    main()
