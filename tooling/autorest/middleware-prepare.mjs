import { spawnSync } from 'child_process';

const run = (getOutput, command, ...args) => {
  const { error, stdout } = spawnSync(
    command,
    args,
    { shell: true, ...!getOutput && { stdio: 'inherit' } },
  );
  if (error) throw error;
  return stdout?.toString().trim();
};

const id = run(true, 'docker', 'create', 'aeternity/ae_mdw:1.51.0');
const openapi = '/home/aeternity/node/lib/ae_mdw-1.51.0/priv/static/swagger/swagger_v2.yaml';
run(false, 'docker', 'cp', `${id}:${openapi}`, './tooling/autorest/middleware-openapi.yaml');
run(false, 'docker', 'rm', '-v', id);
