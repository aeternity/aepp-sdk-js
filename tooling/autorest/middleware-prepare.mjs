import { spawnSync } from 'child_process';
// eslint-disable-next-line import/extensions
import restoreFile from '../restore-file.mjs';

const run = (getOutput, command, ...args) => {
  const { error, stdout, stderr, status } = spawnSync(command, args, {
    shell: true,
    ...(!getOutput && { stdio: 'inherit' }),
  });
  if (error) throw error;
  if (status) {
    if (getOutput) console.error(stderr?.toString().trimEnd());
    process.exit(status);
  }
  return stdout?.toString().trimEnd();
};

const name = './tooling/autorest/middleware-openapi.yaml';
const hash =
  'wDJxbpq5cVHFbcb8+KhLu0Hut6nU2bItGmjPZmyO/lm5Wipb+DMZOrfrp20HkLEhl2SPz1TxBy/mKFLZZ0xDag==';

await restoreFile(name, hash, () => {
  const version = '1.81.0';
  const id = run(true, 'docker', 'create', `aeternity/ae_mdw:${version}`);
  const openapi = `/home/aeternity/node/lib/ae_mdw-${version}/priv/static/swagger/swagger_v3.json`;
  run(false, 'docker', 'cp', `${id}:${openapi}`, name);
  run(false, 'docker', 'rm', '-v', id);
});
