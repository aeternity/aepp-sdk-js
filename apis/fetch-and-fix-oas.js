const fs = require('fs')
const path = require('path')
const fetch = require('cross-fetch')

const fetchJson = async url => await (await fetch(url)).json()

const writeJson = (json, fileName) => {
  const output = path.resolve(process.cwd(), fileName)
  fs.writeFileSync(output, Buffer.from(JSON.stringify(json, null, 2)))
}

(async () => {
  const nodeApi = await fetchJson('https://mainnet.aeternity.io/api?oas3')

  const t = nodeApi.paths['/accounts/{pubkey}/transactions/pending'].get.responses
  t[404].content['application/json'].schema = t[400].content['application/json'].schema

  if (nodeApi.servers[0].url !== '/v3') {
    throw new Error(`Unexpected value in swagger file: ${$doc.servers[0].url}`)
  }
  delete nodeApi.servers

  writeJson(nodeApi, './node.json')
})().catch(error => {
  console.error(error)
  process.exit(1)
})
