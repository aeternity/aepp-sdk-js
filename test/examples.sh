#!/bin/bash
set -e

echo Run environment/node.js
./test/environment/node.js
echo Run environment/node.mjs
./test/environment/node.mjs
echo Run environment/node.ts
./test/environment/node.ts

echo Check typescript
cd ./test/environment/typescript/
./run.sh
cd ../../..

run_node_example () {
  echo Run $1
  cat ./examples/node/$1 | sed -e "s|@aeternity/aepp-sdk|./es/index.mjs|" | node --input-type=module
}

run_node_example contract-interaction.mjs
run_node_example paying-for-contract-call-tx.mjs
run_node_example paying-for-spend-tx.mjs
run_node_example transfer-ae.mjs

echo Build example aepp
cd ./examples/browser/aepp
npm i
npm run build

echo Build example wallet-iframe
cd ../wallet-iframe
npm i
npm run build

echo Build example wallet-web-extension
cd ../wallet-web-extension
npm i
npm run build
