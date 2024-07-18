import fs from 'fs';

const name = process.argv.at(-1);
const path = `./src/apis/${name}/${name}.ts`;
let content = await fs.promises.readFile(path, { encoding: 'utf-8' });
content = content.replace(/ {2}\$host: string;/, '  readonly $host: string;');
await fs.promises.writeFile(path, content);
