const fs = require('fs')
const path = require('path')

const bigNumberPropertyNames = [
  'balance', 'queryFee', 'fee', 'amount', 'nameSalt', 'nameFee', 'channelAmount',
  'initiatorAmount', 'responderAmount', 'channelReserve', 'initiatorAmountFinal',
  'responderAmountFinal', 'gasPrice', 'gas', 'deposit'
]
const typesFileName = path.resolve(process.cwd(), './node/models/index.ts')
const mappersFileName = path.resolve(process.cwd(), './node/models/mappers.ts')

let types = fs.readFileSync(typesFileName).toString()
types = types
  .replace(/time: string/g, 'time: Date')
  .replace(/topics: string\[]/g, 'topics: BigNumber[]')
types = [
  'import type BigNumber from "BigNumber.js";',
  types
].join('\n');
types = bigNumberPropertyNames.reduce(
  (acc, key) => acc.replace(
    new RegExp(`${key}: number`, 'g'),
    `${key}: BigNumber`
  ),
  types
)
fs.writeFileSync(typesFileName, Buffer.from(types))

let mappers = fs.readFileSync(mappersFileName).toString()
mappers = mappers.replace(
  /(time:[\s\w{,:"]+?name:) "String"/gm,
  '$1 "StringUnixTime"'
);
mappers = mappers.replace(
  /(topics:[\s\w{,:"]+?"Sequence"[\s\w{,:"]+?) "String"/gm,
  '$1 "BigNumber"'
);
mappers = mappers.replace(
  /name: "Number"/gm,
  'name: "StringNumber"'
);
mappers = bigNumberPropertyNames.reduce(
  (acc, key) => acc.replace(
    new RegExp(`(${key}:[\\s\\w{},:"]+?) "StringNumber"`, 'gm'),
    `$1 "BigNumber"`
  ),
  mappers
)
fs.writeFileSync(mappersFileName, Buffer.from(mappers));

[
  'models/index.ts',
  'models/mappers.ts',
  'models/parameters.ts',
  'nodeApi.ts',
  'nodeApiContext.ts',
].forEach(filePath => {
  const completeFilePath = path.resolve(process.cwd(), 'node', filePath)
  const file = fs.readFileSync(completeFilePath).toString()
    .replace(
      '@azure/core-client',
      `${'../'.repeat(filePath.split('/').length)}core-client`
    )
  fs.writeFileSync(completeFilePath, Buffer.from(file))
})
