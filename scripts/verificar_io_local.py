#!/usr/bin/env python3
"""Prueba real de IO contra un backend iniciado en 18080 y PostgreSQL local aislada.

Requiere dagon-io-seed-pg/dagon_io_retoma_20261005 con semillas 00-03.
Crea un alumno sintético y sus intentos. No imprime JWT ni respuestas esperadas.
"""
import concurrent.futures
import json
import subprocess
import time
import urllib.error
import urllib.request

BASE = 'http://127.0.0.1:18080/api'
CONTAINER = 'dagon-io-seed-pg'
DATABASE = 'dagon_io_retoma_20261005'


def sql(query):
    result = subprocess.run(
        ['docker', 'exec', CONTAINER, 'psql', '-U', 'postgres', '-d', DATABASE,
         '-At', '-v', 'ON_ERROR_STOP=1', '-c', query],
        check=True, text=True, capture_output=True)
    return result.stdout.strip()


def request(path, body=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(BASE + path, headers=headers,
                                 data=None if body is None else json.dumps(body).encode())
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
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


def main():
    # Comprobar ambas fuentes antes de crear datos. El proceso debe haberse
    # arrancado con import .env desactivado y URLs explícitas locales.
    check(sql('SELECT COUNT(*) FROM lms_core.materias') == '2', 'catálogo local SQL/IO')
    ids_sql = json.loads(sql("SELECT json_agg(id_curso ORDER BY id_curso) FROM lms_core.cursos WHERE materia_slug='sql'"))
    status, _ = request('/materias')
    check(status == 403 or status == 401, 'catálogo exige autenticación')
    email = 'io.retoma.' + str(time.time_ns()) + '@example.com'
    status, session = request('/usuarios/registro', {
        'nombre': 'Prueba local IO', 'email': email, 'password': 'LocalIo123456!'
    })
    check(status == 200 and 'token' in session, 'registro local y JWT')
    token = session['token']
    check(sql("SELECT COUNT(*) FROM lms_core.usuarios WHERE email='" + email + "'") == '1',
          'usuario creado en la base local aislada')
    status, _ = request('/usuarios/login-google', {'email': email}, token)
    check(status == 410, 'login-google desactivado (410)')
    status, materias = request('/materias', token=token)
    check(status == 200 and {m['slug'] for m in materias} == {'sql', 'io'}, 'materias autenticadas')
    status, cursos = request('/modulos?materia=io', token=token)
    check(status == 200 and len(cursos) == 2, 'dos cursos exclusivos de IO')
    modulos = [m for c in cursos for m in c['modulos']]
    check(len(modulos) == 15, '15 módulos de IO')
    locked = next(m for m in modulos if m['bloqueado'])
    status, _ = request('/exercises/' + str(locked['id_modulo']), token=token)
    check(status == 403, 'servidor rechaza módulo bloqueado antes de acumular XP')
    datos = json.loads(sql("SELECT json_agg(row_to_json(t)) FROM ("
        "SELECT e.id_ejercicio, e.id_modulo, e.dificultad, e.configuracion_extra->'respuestas' AS respuestas "
        "FROM lms_core.ejercicios_practicos e JOIN lms_core.modulos m USING(id_modulo) "
        "JOIN lms_core.cursos c USING(id_curso) WHERE c.materia_slug='io' "
        "ORDER BY c.id_curso,m.orden,e.orden) t"))
    check(len(datos) == 45, '45 misiones; reejecutar semilla no duplica contenido')
    by_modulo = {}
    for dato in datos:
        by_modulo.setdefault(dato['id_modulo'], []).append(dato)
    xp = 0
    for modulo_id, ejercicios in by_modulo.items():
        status, payload = request('/exercises/' + str(modulo_id), token=token)
        check(status == 200, 'módulo accesible ' + str(modulo_id))
        serialized = json.dumps(payload)
        check('"respuestas"' not in serialized and 'query_maestra' not in serialized,
              'DTO sin solución esperada ' + str(modulo_id))
        check(all(e['type'] == 'numerico' and e.get('campos') for e in payload['exercises']),
              'formulario NUMERICO ' + str(modulo_id))
        primero = ejercicios[0]
        status, fallo = request('/exercises/' + str(primero['id_ejercicio']) + '/validate',
                               {'query': '{"campo_ajeno":"incorrecto"}'}, token)
        check(status == 200 and not fallo['success'] and fallo['xp_gained'] == 0,
              'fallo no concede XP ' + str(modulo_id))
        for e in ejercicios:
            path = '/exercises/' + str(e['id_ejercicio']) + '/validate'
            body = {'query': json.dumps(e['respuestas'])}
            esperado = e['dificultad'] * 10
            if xp == 0:
                with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
                    envios = list(pool.map(lambda _: request(path, body, token), range(2)))
                check(all(s == 200 and r['success'] for s, r in envios)
                      and sorted(r['xp_gained'] for _, r in envios) == [0, esperado],
                      'dos envíos concurrentes conceden XP una sola vez')
                status, completados = request('/modulos/completados', token=token)
                check(status == 200 and modulo_id not in completados,
                      'un acierto no completa el módulo')
            else:
                status, acierto = request(path, body, token)
                check(status == 200 and acierto['success'] and acierto['xp_gained'] == esperado,
                      'misión correcta ' + str(e['id_ejercicio']))
            xp += esperado
            status, repetido = request(path, body, token)
            check(status == 200 and repetido['success'] and repetido['xp_gained'] == 0,
                  'repetición sin XP extra ' + str(e['id_ejercicio']))
    status, materias = request('/materias', token=token)
    io = next(m for m in materias if m['slug'] == 'io')
    check(status == 200 and io['xp'] == xp == 1350 and io['modulosCompletados'] == 15,
          'XP final 1350 y 15 módulos completos')
    status, ranking = request('/leaderboard?materia=io', token=token)
    check(status == 200, 'ranking por IO responde')
    status, cursos_sql = request('/modulos?materia=sql', token=token)
    check(status == 200 and sorted(c['id_curso'] for c in cursos_sql) == ids_sql and
          all(c['materia_slug'] == 'sql' for c in cursos_sql), 'SQL conserva todos sus cursos')
    check(next(m for m in materias if m['slug'] == 'sql')['xp'] == 0,
          'XP de IO no desbloquea SQL')
    for curso in cursos:
        status, certificado = request('/modulos/certificado/' + str(curso['id_curso']), token=token)
        check(status == 200, 'certificado IO disponible ' + str(curso['id_curso']))
    status, _ = request('/modulos/reset-sandbox', {}, token)
    check(status == 200, 'restauración de sandbox con rol backend limitado')
    primer_sql = json.loads(sql("SELECT row_to_json(t) FROM (SELECT e.id_ejercicio,e.id_modulo,e.query_maestra "
        "FROM lms_core.ejercicios_practicos e JOIN lms_core.modulos m USING(id_modulo) "
        "JOIN lms_core.cursos c USING(id_curso) WHERE c.materia_slug='sql' AND m.xp_requerida=0 "
        "AND e.query_maestra='SELECT * FROM aventureros;' ORDER BY e.id_ejercicio LIMIT 1) t"))
    status, _ = request('/exercises/' + str(primer_sql['id_modulo']), token=token)
    check(status == 200, 'lectura de misión SQL')
    status, validacion_sql = request('/exercises/' + str(primer_sql['id_ejercicio']) + '/validate',
                                    {'query': primer_sql['query_maestra']}, token)
    check(status == 200 and validacion_sql['success'], 'consulta SQL real correcta después de IO')
    print('Prueba IO real local completada. Sin conexión a Railway.')


if __name__ == '__main__':
    main()
