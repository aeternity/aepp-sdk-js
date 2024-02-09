import { writeFileSync } from 'fs';
// eslint-disable-next-line import/extensions
import restoreFile from './restore-file.mjs';

const path = './bin/aesophia_cli_8';
const hash = 'Xm+NIrI8S/u/mL4d5ZPcGJ+L+i3DfyKfvRY3iEXY+Or8dN8dGzupWcxlD2CJ3I2SRg/EzPwWIYPZCREC4RSgXA==';

await restoreFile(path, hash, async () => {
  const request = await fetch(
    'https://github.com/aeternity/aesophia_cli/releases/download/v8.0.0-rc1/aesophia_cli',
  );
  const body = Buffer.from(await request.arrayBuffer());
  writeFileSync(path, body);
});
