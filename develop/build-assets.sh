#!/bin/bash
set -e

[ ! -d "node_modules" ] && npm i
npm run docs:examples
npm run docs:api

# TODO: revisit --ignore-scripts after solving https://github.com/npm/cli/issues/4202
perl -i -pe 's/"prepare"/"rem-prepare"/g' package.json
mkdir -p docs/examples/browser

echo Build example aepp
cd ./examples/browser/aepp
npm i
VUE_APP_WALLET_URL=../wallet-iframe/ PUBLIC_PATH=./ npm run build
rm -rf ../../../docs/examples/browser/aepp
mv dist/ ../../../docs/examples/browser/aepp

echo Build example wallet-iframe
cd ../wallet-iframe
npm i
VUE_APP_AEPP_URL=../aepp/ PUBLIC_PATH=./ npm run build
rm -rf ../../../docs/examples/browser/wallet-iframe
mv dist/ ../../../docs/examples/browser/wallet-iframe

echo Build example wallet-web-extension
cd ../wallet-web-extension
npm i
NODE_OPTIONS=--openssl-legacy-provider npm run build
mv artifacts/wallet-web-extension-v0.1.0-production.zip ../../../docs/examples/browser/wallet-web-extension.zip

cd ../../..
perl -i -pe 's/"rem-prepare"/"prepare"/g' package.json
