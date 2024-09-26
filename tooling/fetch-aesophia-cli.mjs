import { writeFileSync } from 'fs';
// eslint-disable-next-line import/extensions
import restoreFile from './restore-file.mjs';

const path = './bin/aesophia_cli';
const hash =
  'RYAgt3BbPt4UlANdcOff68hca0p1q2dK+H1b5BSMNUl6+zb9JjoJIn2/MlMxJAF0WdpjJKlVTkocXY7pMVIzCg==';

await restoreFile(path, hash, async () => {
  const request = await fetch(
    'https://github.com/aeternity/aesophia_cli/releases/download/v8.0.0/aesophia_cli',
  );
  const body = Buffer.from(await request.arrayBuffer());
  writeFileSync(path, body);
});
