#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT=3333
URL="http://localhost:${PORT}"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found. Keremflix needs Node.js to run."
  echo "Opening the Node.js download page if possible..."
  case "$(uname -s)" in
    Darwin) open "https://nodejs.org/en/download" 2>/dev/null || true ;;
    Linux*) xdg-open "https://nodejs.org/en/download" 2>/dev/null || sensible-browser "https://nodejs.org/en/download" 2>/dev/null || true ;;
  esac
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm was not found. Reinstall Node.js from https://nodejs.org/ (npm is included)."
  exit 1
fi

port_in_use() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$PORT" -sTCP:LISTEN -Pn >/dev/null 2>&1
    return $?
  fi
  if command -v ss >/dev/null 2>&1; then
    ss -lnpt 2>/dev/null | grep -qE ":${PORT}([^0-9]|$)"
    return $?
  fi
  return 1
}

if port_in_use; then
  echo "Port ${PORT} is already in use. Close the other program or stop any existing Keremflix session."
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies (first run may take a minute)..."
  npm install --no-fund --no-audit --loglevel=error
fi

npm run dev:launch &
DEV_PID=$!

cleanup() {
  kill "$DEV_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

probe_url() {
  local u="$1"
  if command -v curl >/dev/null 2>&1; then
    curl -sSf "$u" >/dev/null 2>&1
  elif command -v wget >/dev/null 2>&1; then
    wget -q --spider "$u" >/dev/null 2>&1
  else
    return 1
  fi
}

n=0
until probe_url "${URL}/"; do
  n=$((n + 1))
  if [[ $n -ge 120 ]]; then
    echo "Timed out waiting for Keremflix at ${URL}"
    exit 1
  fi
  sleep 1
done

case "$(uname -s)" in
  Darwin) open "$URL" ;;
  Linux*) xdg-open "$URL" 2>/dev/null || sensible-browser "$URL" 2>/dev/null || true ;;
  *)      echo "Open ${URL} in your browser." ;;
esac

wait "$DEV_PID"
