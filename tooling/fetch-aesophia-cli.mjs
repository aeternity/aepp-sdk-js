import { writeFileSync } from 'fs';
// eslint-disable-next-line import/extensions
import restoreFile from './restore-file.mjs';

const path = './bin/aesophia_cli';
const hash = 'ynvJbaxHYRwuEGUWkLGrRiF2G33Dxdly8rgSMLI2wZ82uPC/L0+MqLSeZ5JDSY4X+BEPIjpeQjY9E+0m2IdGxQ==';

await restoreFile(path, hash, async () => {
  const request = await fetch(
    'https://github.com/aeternity/aesophia_cli/releases/download/v7.4.1/aesophia_cli',
  );
  const body = Buffer.from(await request.arrayBuffer());
  writeFileSync(path, body);
});
