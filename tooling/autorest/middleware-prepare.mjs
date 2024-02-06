#!/usr/bin/env node

import { spawnSync } from 'child_process';
// eslint-disable-next-line import/extensions
import restoreFile from '../restore-file.mjs';

const run = (getOutput, command, ...args) => {
  const { error, stdout } = spawnSync(
    command,
    args,
    { shell: true, ...!getOutput && { stdio: 'inherit' } },
  );
  if (error) throw error;
  return stdout?.toString().trim();
};

const name = './tooling/autorest/middleware-openapi.yaml';
const hash = 'HQS7QRRVCTUwwvxXH7ABLc1+td/pRqYsW5yAVwsp/Tp8Ruzan2dvkUeXrdquonixp+vjl6u4YiBLC11pm8XmmA==';

await restoreFile(name, hash, () => {
  const version = '1.68.1';
  const id = run(true, 'docker', 'create', `aeternity/ae_mdw:${version}`);
  const openapi = `/home/aeternity/node/lib/ae_mdw-${version}/priv/static/swagger/swagger_v2.yaml`;
  run(false, 'docker', 'cp', `${id}:${openapi}`, name);
  run(false, 'docker', 'rm', '-v', id);
});
