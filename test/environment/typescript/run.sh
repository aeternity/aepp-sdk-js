#!/bin/bash
set -e

# revisit --ignore-scripts after solving https://github.com/npm/cli/issues/4202
sed -i '' 's/"prepare"/"rem-prepare"/g' ../../../package.json

for i in {9..1}
do
  echo "Try typescript@4.$i"
  npm i "typescript@4.$i" -D --no-audit
  npx tsc
done

sed -i '' 's/"rem-prepare"/"prepare"/g' ../../../package.json
