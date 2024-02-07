import { createHash } from 'crypto';
import { dirname } from 'path';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';

const path = './bin/aesophia_cli_8';
const hash = 'Xm+NIrI8S/u/mL4d5ZPcGJ+L+i3DfyKfvRY3iEXY+Or8dN8dGzupWcxlD2CJ3I2SRg/EzPwWIYPZCREC4RSgXA==';

function ensureBinaryCorrect() {
  const buffer = readFileSync(path);
  const h = createHash('sha512').update(buffer).digest('base64');
  if (h !== hash) throw new Error('Wrong hash');
}

try {
  ensureBinaryCorrect();
} catch {
  console.log('Fetching aesophia_cli_8');
  const request = await fetch(
    'https://github.com/aeternity/aesophia_cli/releases/download/v8.0.0-rc1/aesophia_cli',
  );
  const body = Buffer.from(await request.arrayBuffer());
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
  ensureBinaryCorrect();
}
