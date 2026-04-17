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
    actual = RPG_TITLES[0][1]
    for umbral, nombre in RPG_TITLES:
        if xp >= umbral:
            actual = nombre
    return actual


def procesar_fragmento(usuarios: list[dict]) -> dict:
    """Corre en cada rank sobre su fragmento scattered."""
    if not usuarios:
        return {
            "count": 0,
            "xp_sum": 0,
            "misiones_sum": 0,
            "xp_max": 0,
            "distribucion": {},
        }

    xp_sum = sum(int(u.get("xp", 0)) for u in usuarios)
    misiones_sum = sum(int(u.get("misionesResueltas", 0)) for u in usuarios)
    xp_max = max(int(u.get("xp", 0)) for u in usuarios)

    distribucion: dict[str, int] = {}
    for u in usuarios:
        t = titulo_por_xp(int(u.get("xp", 0)))
        distribucion[t] = distribucion.get(t, 0) + 1

    return {
        "count": len(usuarios),
        "xp_sum": xp_sum,
        "misiones_sum": misiones_sum,
        "xp_max": xp_max,
        "distribucion": distribucion,
    }


def dividir_en_chunks(lista: list, n: int) -> list[list]:
    """Split balanceado: reparte el resto entre los primeros chunks."""
    k, m = divmod(len(lista), n)
    return [
        lista[i * k + min(i, m):(i + 1) * k + min(i + 1, m)]
        for i in range(n)
    ]


def main() -> None:
    comm = MPI.COMM_WORLD
    rank = comm.Get_rank()
    size = comm.Get_size()

    input_path = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else None

    if rank == 0:
        if input_path and input_path.exists():
            usuarios = json.loads(input_path.read_text(encoding="utf-8"))
        else:
            usuarios = json.loads(sys.stdin.read() or "[]")
        if not isinstance(usuarios, list):
            usuarios = usuarios.get("usuarios", [])
        chunks = dividir_en_chunks(usuarios, size)
    else:
        chunks = None

    t_scatter = MPI.Wtime()
    mi_fragmento = comm.scatter(chunks, root=0)
    t_compute_start = MPI.Wtime()

    parcial = procesar_fragmento(mi_fragmento)
    parcial["rank"] = rank
    parcial["elapsed_ms"] = (MPI.Wtime() - t_compute_start) * 1000.0
    parcial["wait_ms"] = (t_compute_start - t_scatter) * 1000.0

    parciales = comm.gather(parcial, root=0)

    total_count = comm.reduce(parcial["count"], op=MPI.SUM, root=0)
    total_xp = comm.reduce(parcial["xp_sum"], op=MPI.SUM, root=0)
    total_misiones = comm.reduce(parcial["misiones_sum"], op=MPI.SUM, root=0)
    xp_maximo = comm.reduce(parcial["xp_max"], op=MPI.MAX, root=0)

    if rank == 0:
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

        promedio_xp = (total_xp / total_count) if total_count else 0.0
        promedio_misiones = (total_misiones / total_count) if total_count else 0.0

        # top-N lo recalcula rank 0 sobre la lista original (cheap)
        usuarios_input = json.loads(input_path.read_text(encoding="utf-8")) if input_path and input_path.exists() else []
        if isinstance(usuarios_input, dict):
            usuarios_input = usuarios_input.get("usuarios", [])
        top5 = sorted(usuarios_input, key=lambda u: int(u.get("xp", 0)), reverse=True)[:5]

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
        if output_path:
            output_path.write_text(payload, encoding="utf-8")
        else:
            sys.stdout.write(payload)


if __name__ == "__main__":
    main()
