#!/bin/bash

set -e

echo "==> Updating code"

cd /home/ubuntu/web-apps/quiz-peers

git fetch origin
git checkout prod
git pull origin prod

echo "==> Installing dependencies"

npm install

echo "==> Building"

npm run server:build

echo "==> Restarting server"

if pm2 describe quiz-peers > /dev/null; then
    pm2 restart quiz-peers
else
    pm2 start npm --name quiz-peers -- run server:start
fi

echo "==> Done!"