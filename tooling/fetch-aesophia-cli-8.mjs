import { createHash } from 'crypto';
import { dirname } from 'path';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';

const path = './bin/aesophia_cli_8';
const hash = 'HWWFD9mdaW/7n1cc3dDZzE01JKSVFHSIPC9DPeCTpAh3QZMpdGI1TTGI0ZpZfK1dC/Hexvs/1o6My60v6a7m4Q==';

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
    'https://github.com/aeternity/aepp-calldata-js/raw/3d98ab7ac8180f080753c8ab2046ad7291054132/bin/aesophia_cli',
  );
  const body = Buffer.from(await request.arrayBuffer());
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
  ensureBinaryCorrect();
}
