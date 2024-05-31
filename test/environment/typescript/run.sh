#!/bin/bash
set -e

# TODO: revisit --ignore-scripts after solving https://github.com/npm/cli/issues/4202
perl -i -pe 's/"prepare"/"rem-prepare"/g' ../../../package.json

for i in {9..2}
do
  echo "Try typescript@4.$i"
  npm i "typescript@4.$i" -D --no-audit
  npx tsc
done

perl -i -pe 's/"rem-prepare"/"prepare"/g' ../../../package.json
