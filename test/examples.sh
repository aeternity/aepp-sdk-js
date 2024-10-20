#!/bin/bash
set -e

echo Run environment/node.cjs
./test/environment/node.cjs
echo Run environment/node.js
./test/environment/node.js
echo Run environment/node.ts
./test/environment/node.ts
echo Run environment/node-unhandled-exception.js
./test/environment/node-unhandled-exception.js
echo Run environment/name-claim-queue.js
./test/environment/name-claim-queue.js

echo Check typescript
cd ./test/environment/typescript/
./run.sh
cd ../../..

run_node_example () {
  echo Run $1
  cat ./examples/node/$1 | sed -e "s|@aeternity/aepp-sdk|./es/index.js|" | node --input-type=module
}

run_node_example account-generalized.js
run_node_example contract-interaction.js
run_node_example paying-for-contract-call-tx.js
run_node_example paying-for-spend-tx.js
run_node_example transfer-ae.js
run_node_example dry-run-using-debug-endpoint.js
run_node_example oracle.js

# TODO: revisit --ignore-scripts after solving https://github.com/npm/cli/issues/4202
perl -i -pe 's/"prepare"/"rem-prepare"/g' package.json

echo Build vue-cli-4-autorest test
cd ./test/environment/vue-cli-4-autorest
npm i
NODE_OPTIONS=--openssl-legacy-provider npm run build
cd ../../..

perl -i -pe 's/"rem-prepare"/"prepare"/g' package.json

./docs/build-assets.sh
