#!/bin/bash
set -ex

node ./fetch-and-fix-oas.js
npx npx autorest autorest-node.yaml --output-artifact:code-model-v4
node ./fix-types-in-generated.js
