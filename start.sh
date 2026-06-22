#!/usr/bin/env bash
# RT (Roundtable) – backend + frontend. Run from repo root: ./start.sh
# Local ports: backend 5001, web 4202.
set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

API_PORT=5001
WEB_PORT=4202

free_port_unix() {
  local port="$1"
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  Stopping process(es) on port $port: $pids"
    kill $pids 2>/dev/null || true
    sleep 1
    pids=$(lsof -ti:"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
      kill -9 $pids 2>/dev/null || true
    fi
    return 0
  fi
  return 1
}

free_port_windows() {
  local port="$1"
  local pids
  pids=$(netstat -ano 2>/dev/null | awk -v p=":$port" '$1=="TCP" && $2 ~ p"$" && $4=="LISTENING" {print $5}' | tr -d '\r' | sort -u)
  if [ -n "$pids" ]; then
    echo "  Stopping Windows process(es) on port $port: $pids"
    for pid in $pids; do
      taskkill //PID "$pid" //F >/dev/null 2>&1 || true
    done
    return 0
  fi
  return 1
}

echo "=== Freeing ports $API_PORT (API) and $WEB_PORT (web) ==="
freed=0
for port in "$API_PORT" "$WEB_PORT"; do
  if command -v lsof >/dev/null 2>&1; then
    free_port_unix "$port" && freed=1
  else
    free_port_windows "$port" && freed=1
  fi
done
[ "$freed" = 1 ] && sleep 2

if ! command -v dotnet >/dev/null 2>&1; then
  echo "Error: dotnet not found on PATH."
  exit 127
fi
NPM="npm"
command -v npm >/dev/null 2>&1 || NPM="npm.cmd"
if ! command -v "$NPM" >/dev/null 2>&1; then
  echo "Error: npm not found on PATH."
  exit 127
fi

FRONTEND_DIR="$REPO_ROOT/src/Roundtable.Frontend"
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "=== npm install (first run) ==="
  ( cd "$FRONTEND_DIR" && "$NPM" install )
fi

echo "=== Starting backend (http://127.0.0.1:$API_PORT) and frontend (http://localhost:$WEB_PORT) ==="
trap 'kill 0' EXIT
( cd "$REPO_ROOT/src/Roundtable.Backend" && dotnet run ) &
( cd "$FRONTEND_DIR" && "$NPM" start -- --port "$WEB_PORT" ) &
wait
