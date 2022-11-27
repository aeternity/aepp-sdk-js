import { copyFileSync, appendFileSync } from 'fs';
import { spawnSync } from 'child_process';

const run = (...args) => {
  const { error } = spawnSync('npx', args, { stdio: 'inherit', shell: true });
  if (error) throw error;
};

console.log('Generating types for typescript@4.2');
run('downlevel-dts', 'es', 'types-legacy/ts4.2', '--to=4.2');
copyFileSync('tooling/downlevel/globals-ts4.2.d.ts', 'types-legacy/ts4.2/globals.d.ts');
appendFileSync('types-legacy/ts4.2/index.d.ts', 'import \'./globals\';\n');

console.log('Generating types for typescript@4.5');
run('downlevel-dts', 'es', 'types-legacy/ts4.5', '--to=4.5');
