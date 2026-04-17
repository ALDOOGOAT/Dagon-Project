#!/usr/bin/env bash
# Lanza el microservicio MPI de Dagon en el puerto 5001.
# Pre-requisitos: open-mpi instalado (brew install open-mpi) y pip install -r requirements.txt
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v mpirun >/dev/null 2>&1; then
  echo "[Dagon-MPI] mpirun no encontrado. Instala Open MPI: brew install open-mpi" >&2
  exit 1
fi

export DAGON_MPI_PROCS="${DAGON_MPI_PROCS:-4}"
export PORT="${PORT:-5001}"

echo "[Dagon-MPI] Iniciando servidor HTTP en :${PORT} (procs=${DAGON_MPI_PROCS})"
exec python server.py
