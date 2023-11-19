import { createHash } from 'crypto';
import { dirname } from 'path';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';

const path = './bin/aesophia_cli_8';
const hash = 'tZdsd7XH1e4C10MIzM0TY0IFcpkPBZqZMPdJ1ln9GDVsgjVCCK86YKCK5KtKqQzhNKSXaE01ZjAfTEYOSV7uIg==';

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
    'https://github.com/aeternity/aesophia_cli/raw/df63ff9f4fdcfc437c90b90914fd1a7081d2bbbe/aesophia_cli',
  );
  const body = Buffer.from(await request.arrayBuffer());
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
  ensureBinaryCorrect();
}
