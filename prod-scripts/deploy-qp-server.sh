#!/bin/bash

set -xe

echo "==> Updating code"

cd /home/ubuntu/web-apps/quiz-peers

git fetch origin
git checkout prod
git reset --hard origin/prod

echo "==> Installing dependencies"

/usr/bin/npm install

echo "==> Building"

/usr/bin/npm run server:build

echo "==> Restarting server"

if pm2 describe quiz-peers > /dev/null; then
    pm2 restart quiz-peers
else
    pm2 start npm --name quiz-peers -- run server:start
fi

echo "==> Done!"