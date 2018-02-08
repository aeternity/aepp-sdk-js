
require('@babel/polyfill')

const {getBlockHeight, waitNBlocks} = require('../lib/endpoints/base')
const aens = require('../lib/endpoints/aens')

const EpochHtmlClient = require('../index')

let localClient = new EpochHtmlClient('localhost', 3003, null, false)
let internalClient = new EpochHtmlClient('localhost', 3103, null, false)


const ACCOUNT = 'ak$3XpVuN8nVHmgSCtZGXtpzkiS2DufNDjWs9PdY2wxhDtMfeAGfJp8GfDMhH7rou2B2RVWcNhQtrVFNsRdvDsecsrLYHyuA2'

getBlockHeight(localClient).then(
  (height) => console.log(`height: ${height}`)
).catch(
  (error) => console.log(error)
)

const aensLifecycle = async (domain) => {
  let claimedDomain = await aens.query(localClient, domain)
  if (claimedDomain) {
    console.log(`${domain} has already been registered`)
  }

  let salt = 12345
  let commitment = await aens.getCommitmentHash(localClient, domain, salt)
  console.log(`Commitment ${commitment}`)
  let preClaimedCommitment = await aens.preClaim(internalClient, commitment, 1)
  console.log(`Preclaimed ${preClaimedCommitment}`)
  let blockHeight = await waitNBlocks(localClient, 1)
  let nameHash = await aens.claim(internalClient, domain, salt, 1)
  console.log(`Name Hash ${nameHash}`)
  let provingName = await aens.query(localClient, domain)
  if (provingName) {
    console.log(`${domain} is mine! Data: ${JSON.stringify(provingName)}`)
  }

  let updatedNameHash = await aens.update(internalClient, ACCOUNT, nameHash)
  console.log(`${updatedNameHash} has been updated!`)

  let aensData = await aens.query(localClient, domain)
  if (aensData) {
    console.log(`Updated AENS ${JSON.stringify(aensData)}`)
  }

  return claimedDomain + ',' + preClaimedCommitment
}

aensLifecycle('tillkolter.aet').then(
  (claimedDomain) => {
    console.log('finished')
  }
).catch((error) => console.log(error))
