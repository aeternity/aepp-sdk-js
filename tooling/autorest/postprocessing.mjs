import fs from 'fs';

const nodeBigIntPropertyNames = [
  'balance', 'queryFee', 'fee', 'amount', 'nameFee', 'channelAmount',
  'initiatorAmount', 'responderAmount', 'channelReserve', 'initiatorAmountFinal',
  'responderAmountFinal', 'gasPrice', 'minGasPrice', 'deposit',
];

const middlewareBigIntPropertyNames = [
  'fee', 'amount', // oracles/<id>/responses
  'queryFee', // oracles/<id>
  'blockReward', 'devReward', 'lockedInAuctions', 'burnedInAuctions', 'lockedInChannels', // deltastats
  'sumBlockReward', 'sumDevReward', 'totalTokenSupply', // totalstats
  'totalReward', // minerstats
  'eventSupply', 'initialSupply', // aex9
  'deposit', 'gasPrice', // contracts/{id}
  'nameFee', // names
  'amount0In', 'amount0Out', 'amount1In', 'amount1Out', 'fromAmount', 'toAmount', // dex/swaps
  'channelReserve', 'initiatorAmount', 'responderAmount', // channels
];

const name = process.argv.at(-1);
await Promise.all([
  (async () => {
    const path = `./src/apis/${name}/${name}.ts`;
    let content = await fs.promises.readFile(path, { encoding: 'utf-8' });
    content = content.replace(/ {2}\$host: string;/, '  readonly $host: string;');

    if (name === 'node' || name === 'middleware') {
      content = `import { createSerializer } from "../../utils/autorest";\n${content}`;
      content = content.replace('coreClient.createSerializer', 'createSerializer');
    }

    if (name === 'middleware') {
      const operationSpecNames = [
        ...content
          .matchAll(/const (\w+OperationSpec): coreClient\.OperationSpec = {/g),
      ].map(([, nm]) => nm);
      content = `${content}\nexport const operationSpecs = [\n  ${operationSpecNames.join(',\n  ')},\n] as const;\n`;
    }

    await fs.promises.writeFile(path, content);
  })(),
  ...name === 'node' || name === 'middleware' ? [(async () => {
    const path = `./src/apis/${name}/models/index.ts`;
    let content = await fs.promises.readFile(path, { encoding: 'utf-8' });

    (name === 'node' ? nodeBigIntPropertyNames : middlewareBigIntPropertyNames)
      .forEach((property) => {
        content = content.replaceAll(new RegExp(`(${property}[?]?:) number`, 'g'), '$1 bigint');
      });

    if (name === 'node') {
      /* eslint-disable no-template-curly-in-string */
      content = content.replaceAll(/(txHash\??:) string/g, '$1 `th_${string}`');
      content = content.replaceAll(/(bytecode\??:) string/g, '$1 `cb_${string}`');
      /* eslint-enable no-template-curly-in-string */
      content = content.replaceAll('topics: number[]', 'topics: bigint[]');
    }

    await fs.promises.writeFile(path, content);
  })(), (async () => {
    const path = `./src/apis/${name}/models/mappers.ts`;
    let content = await fs.promises.readFile(path, { encoding: 'utf-8' });

    (name === 'node' ? nodeBigIntPropertyNames : middlewareBigIntPropertyNames)
      .forEach((property) => {
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

    if (name === 'node') {
      content = content.replace(
        /topics: (.+?name: "Sequence".+?)(\s+)name: "Number",/mgs,
        'topics: $1'
        + '$2// @ts-expect-error we are extending autorest with BigInt support'
        + '$2name: "BigInt",',
      );
    }

    await fs.promises.writeFile(path, content);
  })()] : [],
]);
