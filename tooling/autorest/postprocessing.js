import fs from 'fs';

const nodeBigIntPropertyNames = [
  'balance',
  'queryFee',
  'fee',
  'amount',
  'nameFee',
  'highestBid',
  'channelAmount',
  'initiatorAmount',
  'responderAmount',
  'channelReserve',
  'initiatorAmountFinal',
  'responderAmountFinal',
  'gasPrice',
  'minGasPrice',
  'deposit',
  'subunitsPerUnit',
];

const middlewareBigIntPropertyNames = [
  // oracles/<id>/responses
  'fee',
  'amount',
  // oracles/<id>
  'queryFee',
  // deltastats
  'blockReward',
  'devReward',
  'lockedInAuctions',
  'burnedInAuctions',
  'lockedInChannels',
  // totalstats
  'sumBlockReward',
  'sumDevReward',
  'totalTokenSupply',
  // minerstats
  'totalReward',
  // aex9
  'eventSupply',
  'initialSupply',
  // contracts/{id}
  'deposit',
  'gasPrice',
  // names
  'nameFee',
  // dex/swaps
  'amount0In',
  'amount0Out',
  'amount1In',
  'amount1Out',
  'fromAmount',
  'toAmount',
  // channels
  'channelReserve',
  'initiatorAmount',
  'responderAmount',
];

function toTsType(types) {
  const tsTypes = types.split(',').map((type) => {
    if (type.length === 2) return `\`${type}_\${string}\``;
    // eslint-disable-next-line no-template-curly-in-string
    if (type === 'name') return '`${string}.chain`';
    return type;
  });
  return tsTypes.join(' | ');
}

const module = process.argv.at(-1);

await Promise.all(
  ['models/index', 'models/mappers', 'models/parameters', 'index', module].map(async (name) => {
    const path = `./src/apis/${module}/${name}.ts`;
    let content;
    try {
      content = await fs.promises.readFile(path, { encoding: 'utf-8' });
    } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }

    if (name === module) {
      content = content.replace(/ {2}\$host: string;/, '  readonly $host: string;');

      if (module === 'node' || module === 'middleware') {
        content = `import { createSerializer } from "../../utils/autorest.js";\n${content}`;
        content = content.replace('coreClient.createSerializer', 'createSerializer');
      }

      if (module === 'middleware') {
        const operationSpecNames = [
          ...content.matchAll(/const (\w+OperationSpec): coreClient\.OperationSpec = {/g),
        ].map(([, nm]) => nm);
        content = `${content}\nexport const operationSpecs = [\n  ${operationSpecNames.join(',\n  ')},\n] as const;\n`;

        const parts = content.split('__sdk__');
        content = parts.shift();
        while (parts.length) {
          const idx = content.lastIndexOf('@param ') + '@param '.length;
          const name = content.slice(idx, idx + content.slice(idx).indexOf(' '));
          const types = parts.shift();
          const needle = `${name}: string`;
          const replaceIdx = parts.findIndex((part) => part.includes(needle));
          parts[replaceIdx] = parts[replaceIdx].replace(needle, `${name}: ${toTsType(types)}`);
          content += parts.shift();
        }
      }
    }

    if (module === 'node' || module === 'middleware') {
      if (name === 'models/index') {
        (module === 'node' ? nodeBigIntPropertyNames : middlewareBigIntPropertyNames).forEach(
          (property) => {
            content = content.replaceAll(new RegExp(`(${property}[?]?:) number`, 'g'), '$1 bigint');
          },
        );

        if (module === 'node') {
          /* eslint-disable no-template-curly-in-string */
          content = content.replaceAll(/(txHash\??:) string/g, '$1 `th_${string}`');
          content = content.replaceAll(/(bytecode\??:) string/g, '$1 `cb_${string}`');
          /* eslint-enable no-template-curly-in-string */
          content = content.replaceAll('topics: number[]', 'topics: bigint[]');
        }

        if (module === 'middleware') {
          content = `import { MiddlewarePage } from "../../../utils/MiddlewarePage.js";\n${content}`;
          content = content.replace(/export interface PaginatedResponse {.*?}\n\n/gs, '');
          content = content.replace(
            /extends PaginatedResponse,(\s+)(\w+) {}/gs,
            'extends $2,$1PaginatedResponse {}',
          );
          const responseRe = /export interface (\w+)\s+extends (\w+),\s+PaginatedResponse {}/s;
          while (content.match(responseRe)) {
            const [response, responseTypeName, dataTypeName] = content.match(responseRe);
            const regExp = new RegExp(
              String.raw`export interface ${dataTypeName} {\s+data: (\w+)\[\];\s+}\n\n`,
              's',
            );
            const match = content.match(regExp);
            if (match == null) throw new Error(`Can't find interface ${dataTypeName}`);
            const [, arrayItemTypeName] = match;
            content = content.replace(new RegExp(regExp, 'g'), '');
            content = content.replace(response, '');
            content = content.replace(responseTypeName, `MiddlewarePage<${arrayItemTypeName}>`);
          }
          if (content.includes('PaginatedResponse')) {
            throw new Error('Not all PaginatedResponse instances removed');
          }

          const parts = content.split('__sdk__');
          content = parts.shift();
          while (parts.length) {
            const types = parts.shift();
            content += parts.shift().replace(': string', `: ${toTsType(types)}`);
          }
        }
      }

      if (name === 'models/mappers') {
        (module === 'node' ? nodeBigIntPropertyNames : middlewareBigIntPropertyNames).forEach(
          (property) => {
            content = content.replace(
              new RegExp(
                `${property}: \\{` +
                  '(\\s+constraints: \\{.+?\\},)?' +
                  '(\\s+serializedName: "\\w+",)' +
                  '(\\s+required: true,)?' +
                  '(\\s+type: \\{)' +
                  '(\\s+)name: "Number",',
                'mgs',
              ),
              `${property}: {$1$2$3$4` +
                '$5// @ts-expect-error we are extending autorest with BigInt support' +
                '$5name: "BigInt",',
            );
          },
        );

        if (module === 'node') {
          content = content.replace(
            /topics: (.+?name: "Sequence".+?)(\s+)name: "Number",/gms,
            'topics: $1' +
              '$2// @ts-expect-error we are extending autorest with BigInt support' +
              '$2name: "BigInt",',
          );
        }
      }
    }

    await fs.promises.writeFile(path, content);
  }),
);
