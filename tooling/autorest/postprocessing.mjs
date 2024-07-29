import fs from 'fs';

const nodeBigIntPropertyNames = [
  'balance', 'queryFee', 'fee', 'amount', 'nameFee', 'channelAmount',
  'initiatorAmount', 'responderAmount', 'channelReserve', 'initiatorAmountFinal',
  'responderAmountFinal', 'gasPrice', 'minGasPrice', 'deposit',
];

const name = process.argv.at(-1);
await Promise.all([
  (async () => {
    const path = `./src/apis/${name}/${name}.ts`;
    let content = await fs.promises.readFile(path, { encoding: 'utf-8' });
    content = content.replace(/ {2}\$host: string;/, '  readonly $host: string;');

    if (name === 'node') {
      content = `import { createSerializer } from "../../utils/autorest";\n${content}`;
      content = content.replace('coreClient.createSerializer', 'createSerializer');
    }

    await fs.promises.writeFile(path, content);
  })(),
  ...name === 'node' ? [(async () => {
    const path = `./src/apis/${name}/models/index.ts`;
    let content = await fs.promises.readFile(path, { encoding: 'utf-8' });
    nodeBigIntPropertyNames.forEach((property) => {
      content = content.replaceAll(new RegExp(`(${property}[?]?:) number`, 'g'), '$1 bigint');
    });
    /* eslint-disable no-template-curly-in-string */
    content = content.replaceAll(/(txHash\??:) string/g, '$1 `th_${string}`');
    content = content.replaceAll(/(bytecode\??:) string/g, '$1 `cb_${string}`');
    /* eslint-enable no-template-curly-in-string */
    content = content.replaceAll('topics: number[]', 'topics: bigint[]');
    await fs.promises.writeFile(path, content);
  })(), (async () => {
    const path = `./src/apis/${name}/models/mappers.ts`;
    let content = await fs.promises.readFile(path, { encoding: 'utf-8' });
    nodeBigIntPropertyNames.forEach((property) => {
      content = content.replace(
        new RegExp(
          `${property}: \\{`
          + '(\\s+constraints: \\{.+?\\},)?'
          + '(\\s+serializedName: "\\w+",)'
          + '(\\s+required: true,)?'
          + '(\\s+type: \\{)'
          + '(\\s+)name: "Number",',
          'mgs',
        ),
        `${property}: {$1$2$3$4`
        + '$5// @ts-expect-error we are extending autorest with BigInt support'
        + '$5name: "BigInt",',
      );
    });
    content = content.replace(
      /topics: (.+?name: "Sequence".+?)(\s+)name: "Number",/mgs,
      'topics: $1'
      + '$2// @ts-expect-error we are extending autorest with BigInt support'
      + '$2name: "BigInt",',
    );
    await fs.promises.writeFile(path, content);
  })()] : [],
]);
