#!/bin/bash
set -e

echo Run environment/node.js
./test/environment/node.js
echo Run environment/node.mjs
./test/environment/node.mjs
echo Run environment/node.ts
./test/environment/node.ts
echo Run environment/node-unhandled-exception.mjs
./test/environment/node-unhandled-exception.mjs
echo Run environment/name-claim-queue.mjs
./test/environment/name-claim-queue.mjs

echo Check typescript
cd ./test/environment/typescript/
./run.sh
cd ../../..

run_node_example () {
  echo Run $1
  cat ./examples/node/$1 | sed -e "s|@aeternity/aepp-sdk|./es/index.mjs|" | node --input-type=module
}

run_node_example account-generalized.mjs
run_node_example contract-interaction.mjs
run_node_example paying-for-contract-call-tx.mjs
run_node_example paying-for-spend-tx.mjs
run_node_example transfer-ae.mjs

# TODO: revisit --ignore-scripts after solving https://github.com/npm/cli/issues/4202
perl -i -pe 's/"prepare"/"rem-prepare"/g' package.json

echo Build vue-cli-4-autorest test
cd ./test/environment/vue-cli-4-autorest
npm i
NODE_OPTIONS=--openssl-legacy-provider npm run build
cd ../../..

perl -i -pe 's/"rem-prepare"/"prepare"/g' package.json

./docs/build-assets.sh
