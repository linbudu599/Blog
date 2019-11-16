#!/usr/bin/env sh 

set -e

npm run build

cd src/dist 

git init
git add .
git commit -m 'update docs'

git push  -f git@github.com:linbudu599/linbudu599.github.io.git