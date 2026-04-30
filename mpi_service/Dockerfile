FROM python:3.11-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    PORT=5001 \
    DAGON_MPI_PROCS=4 \
    DAGON_MPIRUN=mpirun

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libopenmpi-dev \
        openmpi-bin \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY analytics_mpi.py server.py ./

RUN useradd --create-home --shell /usr/sbin/nologin dagon
USER dagon

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:%s/health' % os.environ.get('PORT', '5001'), timeout=3)"

CMD ["python", "server.py"]
