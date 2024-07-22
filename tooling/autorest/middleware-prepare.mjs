import { spawnSync } from 'child_process';
// eslint-disable-next-line import/extensions
import restoreFile from '../restore-file.mjs';

const run = (getOutput, command, ...args) => {
  const {
    error, stdout, stderr, status,
  } = spawnSync(
    command,
    args,
    { shell: true, ...!getOutput && { stdio: 'inherit' } },
  );
  if (error) throw error;
  if (status) {
    if (getOutput) console.error(stderr?.toString().trimEnd());
    process.exit(status);
  }
  return stdout?.toString().trimEnd();
};

const name = './tooling/autorest/middleware-openapi.yaml';
const hash = 'kc8BgsSJdSmzj7y33IOBVT0wlcWy4gsG49fFMVUyZ08Alhee9LhCC98HaCYNIft95ZzFYVwNY+x++acnZMK0gw==';

await restoreFile(name, hash, () => {
  const version = '1.81.0';
  const id = run(true, 'docker', 'create', `aeternity/ae_mdw:${version}`);
  const openapi = `/home/aeternity/node/lib/ae_mdw-${version}/priv/static/swagger/swagger_v2.json`;
  run(false, 'docker', 'cp', `${id}:${openapi}`, name);
  run(false, 'docker', 'rm', '-v', id);
});
