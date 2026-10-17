#!/bin/zsh
# yourbook server 啟動腳本：建置 Expo web + Rust 後端，並啟動伺服器
set -e
cd "$(dirname "$0")"

echo "==> Building Expo web..."
(cd app && npx expo export --platform web)

echo "==> Building Rust server..."
(cd server && cargo build)

echo "==> Stopping old server (if any)..."
pkill -f yourbook-server 2>/dev/null || true
sleep 1

echo "==> Starting server at http://localhost:3000"
(cd server && exec cargo run)
