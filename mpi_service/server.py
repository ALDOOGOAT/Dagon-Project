"""
HTTP wrapper del servicio MPI.

Spring Boot envía un POST /analytics con JSON `{"usuarios": [...]}`.
Este server toma los datos, los guarda en un archivo temporal, y lanza
`mpirun -np N python analytics_mpi.py input.json output.json`.
Al terminar, devuelve el JSON generado por rank 0.

La razón de separar HTTP de MPI es que mpi4py debe correrse con `mpirun`
(no importable directamente desde un Flask request handler sin ceremonia).
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from flask import Flask, jsonify, request


app = Flask(__name__)

SCRIPT = Path(__file__).parent / "analytics_mpi.py"
MPI_PROCS = int(os.environ.get("DAGON_MPI_PROCS", "4"))
MPIRUN = os.environ.get("DAGON_MPIRUN", "mpirun")


@app.get("/")
@app.get("/health")
def health():
    return jsonify({"ok": True, "procs": MPI_PROCS})


@app.post("/analytics")
def analytics():
    body = request.get_json(silent=True) or {}
    usuarios = body.get("usuarios", [])
    if not isinstance(usuarios, list):
        return jsonify({"error": "payload.usuarios debe ser una lista"}), 400

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        in_file = tmp_path / "in.json"
        out_file = tmp_path / "out.json"
        in_file.write_text(json.dumps(usuarios, ensure_ascii=False), encoding="utf-8")

        cmd = [
            MPIRUN, "-np", str(MPI_PROCS),
            "--oversubscribe",  # permite correr en laptops con <4 cores fisicos
            sys.executable, str(SCRIPT), str(in_file), str(out_file),
        ]
        t0 = time.time()
        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=30, check=False
            )
        except FileNotFoundError:
            return jsonify({
                "error": "mpirun no encontrado. Instala Open MPI: brew install open-mpi",
            }), 500
        wall_ms = (time.time() - t0) * 1000.0

        if result.returncode != 0:
            return jsonify({
                "error": "mpirun fallo",
                "stderr": result.stderr[-500:],
                "stdout": result.stdout[-500:],
            }), 500

        if not out_file.exists():
            return jsonify({"error": "analytics_mpi.py no genero salida"}), 500

        data = json.loads(out_file.read_text(encoding="utf-8"))
        data["wall_ms"] = round(wall_ms, 2)
        return jsonify(data)


if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "5001"))
    app.run(host=host, port=port, debug=False)
