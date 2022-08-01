#!/bin/bash
set -e

echo Run environment/node.js
./test/environment/node.js
echo Run environment/node.mjs
./test/environment/node.mjs
echo Run environment/node.ts
./test/environment/node.ts

run_node_example () {
  echo Run $1
  cat ./examples/node/$1 | sed -e "s|@aeternity/aepp-sdk|./dist/aepp-sdk.js|" | node
}

run_node_example contract-interaction.js
run_node_example paying-for-contract-call-tx.js
run_node_example paying-for-spend-tx.js
run_node_example transfer-ae.js

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
