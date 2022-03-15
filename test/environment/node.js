const { Node, Universal, MemoryAccount } = require('../../dist/aepp-sdk')

const contractSource = `
contract Test =
 entrypoint getArg(x : map(string, int)) = x
`;

(async () => {
  const node = await Node({ url: 'https://testnet.aeternity.io' })
  const aeSdk = await Universal({
    nodes: [{ name: 'testnet', instance: node }],
    compilerUrl: 'https://compiler.aepps.com',
    accounts: [MemoryAccount({
      keypair: {
        publicKey: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR',
        secretKey: 'bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b'
      }
    })]
  })

  console.log('Height:', await aeSdk.height())
  console.log('Instanceof works correctly for nodes pool', aeSdk.pool instanceof Map)

  const contract = await aeSdk.getContractInstance({ source: contractSource })
  const deployInfo = await contract.deploy()
  console.log('Contract deployed at', deployInfo.address)
  const map = new Map([['foo', 42], ['bar', 43]])
  const { decodedResult } = await contract.methods.getArg(map)
  console.log('Call result', decodedResult)
  console.log('Instanceof works correctly for returned map', decodedResult instanceof Map)
})()
