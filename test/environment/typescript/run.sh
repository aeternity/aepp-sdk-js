#!/bin/bash
set -e

# TODO: revisit --ignore-scripts after solving https://github.com/npm/cli/issues/4202
perl -i -pe 's/"prepare"/"rem-prepare"/g' ../../../package.json

for i in 4.8 4.9 5.0 5.1 5.2 5.3 5.4 5.5
do
  echo "Try typescript@$i"
  npm i "typescript@$i" -D --no-audit
  npx tsc
done

perl -i -pe 's/"rem-prepare"/"prepare"/g' ../../../package.json
