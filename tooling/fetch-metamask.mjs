import { writeFileSync } from 'fs';
import { resolve } from 'path';
import extractZip from 'extract-zip';
// eslint-disable-next-line import/extensions
import restoreFile from './restore-file.mjs';

const path = './test/assets/metamask.zip';
const hash =
  'syt/OJLdXM1al3TdG7s/xXRYFj0mTZ6UDrK/+KzTmvLxhfQdIO8/82MQbep2CR67Gwz8wRaM1TZzpK3dyqjNSg==';

await restoreFile(path, hash, async () => {
  const request = await fetch(
    'https://github.com/MetaMask/metamask-extension/releases/download/v12.3.1/metamask-chrome-12.3.1.zip',
  );
  const body = Buffer.from(await request.arrayBuffer());
  writeFileSync(path, body);
  await extractZip(path, { dir: resolve(path).split('.')[0] });
});
