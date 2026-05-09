"""
Dagon - Servicio de analytics paralelo con MPI (mpi4py).

Contexto académico:
-------------------
Este script forma parte de la materia de Programacion Distribuida y Paralela.
Se lanza con `mpirun -np N python analytics_mpi.py [input.json] [output.json]`
y divide el procesamiento del ranking de usuarios entre N procesos usando
el comunicador MPI.COMM_WORLD.

Pipeline:
    1) Rank 0 lee los datos (json de entrada o stdin).
    2) Rank 0 hace `scatter` de los usuarios entre todos los ranks.
    3) Cada rank calcula agregados parciales sobre su fragmento.
    4) Se usa `reduce` (MPI.SUM) para consolidar totales.
    5) Rank 0 escribe el JSON final con:
         - numero de procesos usados
         - tiempo por rank
         - promedios globales, top-N, distribución por titulo RPG

El servicio HTTP (server.py) levanta este script bajo demanda.
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

from mpi4py import MPI


RPG_TITLES = [
    (0,    "Novato del SELECT"),
    (100,  "Explorador de Tablas"),
    (300,  "Guerrero de los JOINs"),
    (600,  "Caballero de Datos"),
    (1000, "Maestro Arquitecto SQL"),
]


def titulo_por_xp(xp: int) -> str:
    """
    Devuelve el titulo RPG que corresponde a una cantidad de XP.

    La lista `RPG_TITLES` esta ordenada de menor a mayor umbral. Por eso el
    recorrido va actualizando `actual` cada vez que la XP alcanza un nuevo
    umbral; al final queda guardado el titulo mas alto que el usuario logro.

    Args:
        xp: Experiencia acumulada del usuario.

    Returns:
        Nombre del titulo RPG asociado al mayor umbral alcanzado.
    """
    # Titulo base: cubre tambien el caso en que `xp` sea menor que el primer
    # umbral configurado.
    actual = RPG_TITLES[0][1]

    # Se conserva el ultimo titulo cuyo umbral fue alcanzado por la XP.
    for umbral, nombre in RPG_TITLES:
        if xp >= umbral:
            actual = nombre

    return actual


def procesar_fragmento(usuarios: list[dict]) -> dict:
    """
    Calcula las metricas locales de un fragmento de usuarios.

    Esta funcion se ejecuta en cada proceso MPI despues del `scatter`. Cada
    rank recibe solo una parte de la lista completa, calcula sus acumulados y
    devuelve un diccionario "parcial" que luego rank 0 consolida con `gather`
    y `reduce`.

    Args:
        usuarios: Sublista de usuarios asignada al rank actual. Cada usuario
            se espera como diccionario con campos como `xp` y
            `misionesResueltas`.

    Returns:
        Diccionario con conteos, sumas, maximos y distribucion local por
        titulo RPG. Las claves estan pensadas para poder combinarse entre
        procesos con operaciones MPI simples.
    """
    # Si hay mas procesos que usuarios, algunos ranks pueden recibir una lista
    # vacia. Regresamos valores neutros para que las reducciones MPI sigan
    # funcionando sin casos especiales.
    if not usuarios:
        return {
            "count": 0,
            "xp_sum": 0,
            "misiones_sum": 0,
            "xp_max": 0,
            "distribucion": {},
        }

    # Acumulados numericos locales. `get(..., 0)` hace que usuarios incompletos
    # no rompan el procesamiento y se traten como valores cero.
    xp_sum = sum(int(u.get("xp", 0)) for u in usuarios)
    misiones_sum = sum(int(u.get("misionesResueltas", 0)) for u in usuarios)
    xp_max = max(int(u.get("xp", 0)) for u in usuarios)

    # Histograma local: cuenta cuantos usuarios del fragmento caen en cada
    # titulo RPG segun su XP.
    distribucion: dict[str, int] = {}
    for u in usuarios:
        t = titulo_por_xp(int(u.get("xp", 0)))
        distribucion[t] = distribucion.get(t, 0) + 1

    # El resultado queda en una forma compacta y facil de sumar/combinar en
    # rank 0.
    return {
        "count": len(usuarios),
        "xp_sum": xp_sum,
        "misiones_sum": misiones_sum,
        "xp_max": xp_max,
        "distribucion": distribucion,
    }


def dividir_en_chunks(lista: list, n: int) -> list[list]:
    """
    Divide una lista en `n` fragmentos lo mas balanceados posible.

    Se usa antes de `comm.scatter(...)` para entregar un fragmento a cada rank.
    Cuando la division no es exacta, los elementos sobrantes se asignan a los
    primeros chunks; asi la diferencia de tamanio entre chunks es como maximo 1.

    Args:
        lista: Lista original de elementos a repartir.
        n: Cantidad de fragmentos a crear, normalmente igual al numero de
            procesos MPI (`size`).

    Returns:
        Lista con `n` sublistas, listas para ser enviadas con `scatter`.
    """
    # `k` es el tamanio minimo de cada chunk y `m` es el numero de chunks que
    # reciben un elemento extra.
    k, m = divmod(len(lista), n)

    # Los indices compensan los elementos extra ya repartidos en chunks previos
    # mediante `min(i, m)`.
    return [
        lista[i * k + min(i, m):(i + 1) * k + min(i + 1, m)]
        for i in range(n)
    ]


def main() -> None:
    """
    Punto de entrada del script de analytics paralelo.

    Coordina todo el pipeline MPI:
      1. Inicializa el comunicador global y detecta `rank`/`size`.
      2. Hace que rank 0 lea la entrada JSON.
      3. Divide los usuarios y distribuye fragments con `scatter`.
      4. Ejecuta el calculo local en cada rank.
      5. Recolecta parciales y reduce totales globales.
      6. En rank 0 arma el JSON final y lo escribe a archivo o stdout.

    No retorna ningun valor porque su salida principal es el payload JSON
    generado para el servicio HTTP o para la linea de comandos.
    """
    # Comunicador global de MPI. Todos los procesos lanzados por `mpirun`
    # participan aqui.
    comm = MPI.COMM_WORLD
    rank = comm.Get_rank()
    size = comm.Get_size()

    # Argumentos opcionales:
    #   argv[1] -> JSON de entrada.
    #   argv[2] -> archivo de salida.
    # Si no hay entrada por archivo, rank 0 intenta leer desde stdin.
    input_path = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else None

    if rank == 0:
        # Solo rank 0 toca la entrada para evitar lecturas duplicadas o
        # carreras sobre stdin/archivo. Despues reparte el trabajo.
        if input_path and input_path.exists():
            usuarios = json.loads(input_path.read_text(encoding="utf-8"))
        else:
            usuarios = json.loads(sys.stdin.read() or "[]")

        # Acepta dos formatos de entrada:
        #   - una lista directa de usuarios
        #   - un objeto con clave "usuarios"
        if not isinstance(usuarios, list):
            usuarios = usuarios.get("usuarios", [])

        chunks = dividir_en_chunks(usuarios, size)
    else:
        # Los demas ranks no necesitan conocer la lista completa; solo esperan
        # su fragmento por MPI.
        chunks = None

    # Medimos por separado el tiempo de espera/distribucion y el tiempo real de
    # computo local para reportarlo en `por_rank`.
    t_scatter = MPI.Wtime()
    mi_fragmento = comm.scatter(chunks, root=0)
    t_compute_start = MPI.Wtime()

    # Cada rank calcula sus metricas locales sobre el fragmento recibido.
    parcial = procesar_fragmento(mi_fragmento)
    parcial["rank"] = rank
    parcial["elapsed_ms"] = (MPI.Wtime() - t_compute_start) * 1000.0
    parcial["wait_ms"] = (t_compute_start - t_scatter) * 1000.0

    # `gather` trae a rank 0 los diccionarios completos para datos no triviales
    # como la distribucion por titulo y los tiempos por rank.
    parciales = comm.gather(parcial, root=0)

    # `reduce` consolida campos numericos usando operaciones MPI eficientes.
    # En los ranks distintos de 0 estas variables quedan como None, porque el
    # resultado final vive solamente en `root=0`.
    total_count = comm.reduce(parcial["count"], op=MPI.SUM, root=0)
    total_xp = comm.reduce(parcial["xp_sum"], op=MPI.SUM, root=0)
    total_misiones = comm.reduce(parcial["misiones_sum"], op=MPI.SUM, root=0)
    xp_maximo = comm.reduce(parcial["xp_max"], op=MPI.MAX, root=0)

    if rank == 0:
        # Fusiona las distribuciones locales y arma el resumen de rendimiento
        # por proceso.
        distribucion_global: dict[str, int] = {}
        por_rank = []
        for p in parciales:
            for titulo, cuenta in p["distribucion"].items():
                distribucion_global[titulo] = distribucion_global.get(titulo, 0) + cuenta
            por_rank.append({
                "rank": p["rank"],
                "usuarios": p["count"],
                "elapsed_ms": round(p["elapsed_ms"], 3),
                "wait_ms": round(p["wait_ms"], 3),
            })

        # Promedios globales protegidos contra division por cero cuando la
        # entrada no contiene usuarios.
        promedio_xp = (total_xp / total_count) if total_count else 0.0
        promedio_misiones = (total_misiones / total_count) if total_count else 0.0

        # Top-N lo recalcula rank 0 sobre la lista original. Es barato frente al
        # resto del pipeline y evita transferir listas ordenadas desde cada rank.
        usuarios_input = json.loads(input_path.read_text(encoding="utf-8")) if input_path and input_path.exists() else []
        if isinstance(usuarios_input, dict):
            usuarios_input = usuarios_input.get("usuarios", [])
        top5 = sorted(usuarios_input, key=lambda u: int(u.get("xp", 0)), reverse=True)[:5]

        # Payload final consumido por el servicio HTTP o escrito a stdout cuando
        # se ejecuta desde consola.
        salida = {
            "mpi": {
                "procesos": size,
                "implementacion": MPI.Get_library_version().strip(),
                "por_rank": por_rank,
            },
            "totales": {
                "usuarios": total_count,
                "xp_sum": total_xp,
                "misiones_sum": total_misiones,
                "xp_max": xp_maximo,
            },
            "promedios": {
                "xp": round(promedio_xp, 2),
                "misiones": round(promedio_misiones, 2),
            },
            "distribucion_titulos": distribucion_global,
            "top5": [
                {
                    "nombre": u.get("nombre", "?"),
                    "xp": int(u.get("xp", 0)),
                    "misionesResueltas": int(u.get("misionesResueltas", 0)),
                }
                for u in top5
            ],
            "generado_en": time.strftime("%Y-%m-%dT%H:%M:%S"),
        }

        payload = json.dumps(salida, ensure_ascii=False, indent=2)

        # Si se recibio ruta de salida, se persiste en archivo; si no, se imprime
        # para permitir uso por pipes o captura desde otro proceso.
        if output_path:
            output_path.write_text(payload, encoding="utf-8")
        else:
            sys.stdout.write(payload)


if __name__ == "__main__":
    main()
