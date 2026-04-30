# Dagon MPI Service

Microservicio Python que paraleliza las métricas del leaderboard usando `mpi4py`.
Se añadió como parte de la materia **Programación Distribuida y Paralela**.

## ¿Qué paraleliza?

Dado un arreglo de usuarios `[{ nombre, xp, misionesResueltas, ... }]`:

1. **Rank 0** lee el JSON y lo reparte con `comm.scatter` entre N procesos.
2. Cada rank calcula sobre su fragmento: `xp_sum`, `misiones_sum`, `xp_max`, y una distribución por título RPG.
3. Se consolidan totales con `comm.reduce` (SUM y MAX) y se recolectan tiempos por rank con `comm.gather`.
4. Rank 0 imprime / guarda el JSON final con promedios globales, top-5 y un desglose por rank del tiempo gastado (`elapsed_ms`) y tiempo de espera en la barrera (`wait_ms`).

## Requisitos

```bash
brew install open-mpi
python -m pip install -r requirements.txt
```

Con Docker instalado, no necesitas Open MPI ni `mpi4py` en tu sistema local:

```bash
docker compose up --build
```

## Correr el servicio HTTP

```bash
./run_mpi.sh           # default: 4 procesos, puerto 5001
DAGON_MPI_PROCS=8 PORT=5050 ./run_mpi.sh
```

Endpoints:

- `GET /` o `GET /health` → `{"ok": true, "procs": 4}`
- `POST /analytics` con `{"usuarios": [...]}` → estadísticas paralelas.

## Correr solo el script MPI

```bash
echo '[{"nombre":"a","xp":120,"misionesResueltas":3}]' | mpirun -np 4 python analytics_mpi.py
# o
mpirun -np 4 python analytics_mpi.py input.json salida.json
```

## Integración con Spring Boot

`AnalyticsController.java` toma el ranking de `LeaderboardService` y lo reenvía
al servicio MPI con `RestTemplate`. El frontend consume `/api/analytics/mpi`
desde la vista `/leaderboard` y lo pinta como un panel educativo del ranking.

En local no necesitas configurar nada extra porque el backend usa:

```properties
dagon.mpi.url=${DAGON_MPI_URL:http://127.0.0.1:5001}
```

## Deploy en Railway

Vercel debe seguir sirviendo solo el frontend. Para MPI crea un segundo servicio
en Railway usando este directorio (`mpi_service`) como root; Railway detectara el
`Dockerfile`, instalara Open MPI y levantara `server.py`.

Configuracion recomendada del servicio Railway:

- Root Directory: `/mpi_service`
- Config File: `/mpi_service/railway.toml`
- Builder: Dockerfile
- Healthcheck Path: `/health`

Variables recomendadas del servicio MPI:

```bash
PORT=5001
DAGON_MPI_PROCS=4
DAGON_MPIRUN=mpirun
```

Luego configura el backend Railway con:

```bash
DAGON_MPI_URL=https://<tu-servicio-mpi>.up.railway.app
```

El ranking no depende de que MPI este online. Si el servicio cae, el backend
devuelve `ok=false` y la vista mantiene la lista visible con estado offline.
