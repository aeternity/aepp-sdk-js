import { createHash } from 'crypto';
import { dirname } from 'path';
import { readFileSync, mkdirSync } from 'fs';

function ensureFileHash(path, hash) {
  const buffer = readFileSync(path);
  const h = createHash('sha512').update(buffer).digest('base64');
  if (h !== hash) throw new Error(`Wrong hash ${h}`);
}

export default async function restoreFile(path, hash, cb) {
  try {
    ensureFileHash(path, hash);
  } catch {
    console.info(`Restoring ${path}`);
    mkdirSync(dirname(path), { recursive: true });
    await cb();
    ensureFileHash(path, hash);
  }
}
