import { createHash } from 'crypto';
import { dirname } from 'path';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';

const path = './bin/aesophia_cli';
const hash = 'uzco6Jfvm/FAoU/QmGrT400RURzardrAJ8sW8CKRhPdGYsFK0DK64BfGRPBmvmJByztmWsn0xCktQ1g38zKQ6w==';

function ensureBinaryCorrect() {
  const buffer = readFileSync(path);
  const h = createHash('sha512').update(buffer).digest('base64');
  if (h !== hash) throw new Error('Wrong hash');
}

try {
  ensureBinaryCorrect();
} catch {
  console.log('Fetching aesophia_cli');
  const request = await fetch(
    'https://github.com/aeternity/aesophia_cli/releases/download/v7.0.1/aesophia_cli',
  );
  const body = Buffer.from(await request.arrayBuffer());
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
  ensureBinaryCorrect();
}
