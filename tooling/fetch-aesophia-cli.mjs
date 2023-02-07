import { createHash } from 'crypto';
import { dirname } from 'path';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';

const path = './bin/aesophia_cli';
const hash = 'BqnxuwwjV5q+4nmnkB7Ksa6lR2wwFaCVT2Mq3Y5xJ6rgp5GiwQL3At0Sqi2Z573PXYw0JTXNsglA7R1SyuahVQ==';

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
    'https://github.com/aeternity/aesophia_cli/releases/download/v7.1.0/aesophia_cli',
  );
  const body = Buffer.from(await request.arrayBuffer());
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
  ensureBinaryCorrect();
}
