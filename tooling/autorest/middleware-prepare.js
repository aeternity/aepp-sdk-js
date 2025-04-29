import { spawnSync } from 'child_process';
// eslint-disable-next-line import/extensions
import restoreFile from '../restore-file.js';

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
  'tScz0PvHjtFBNNF7xW8AgnGcwnilGnbXvtU5NtnA1i1cxHT04ClElshOHRo5QkX/r3IddJA4rPGF9ZMElIGamA==';

await restoreFile(name, hash, () => {
  const version = '1.97.1';
  const id = run(true, 'docker', 'create', `davidyuk/temp:mdw-dev-mode-${version}-oas-fix`);
  const openapi = `/home/aeternity/node/lib/ae_mdw-${version}/priv/static/swagger/swagger_v3.json`;
  run(false, 'docker', 'cp', `${id}:${openapi}`, name);
  run(false, 'docker', 'rm', '-v', id);
});
