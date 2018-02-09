
require('@babel/polyfill')

const {spend, getBlockHeight, waitNBlocks} = require('../lib/endpoints/base')
const aens = require('../lib/endpoints/aens')
const account = require('../lib/endpoints/account')

const EpochHtmlClient = require('../index')

let localClient = new EpochHtmlClient('localhost', 3023, null, false)
let internalClient = new EpochHtmlClient('localhost', 3123, null, false)

let localClient1 = new EpochHtmlClient('localhost', 3013, null, false)
let internalClient1 = new EpochHtmlClient('localhost', 3113, null, false)
let localClient3 = new EpochHtmlClient('localhost', 3033, null, false)
let internalClient3 = new EpochHtmlClient('localhost', 3133, null, false)

const ACCOUNT1 = 'ak$3iABijXLcdH17i6EDv84qkVKacKHCVwkGJ1bC9svzmfWmHxmXkD6qCeY6ewp4QJHjE4tMjuNstBobq8PXcZfg6vmz8fijM'
const ACCOUNT2 = 'ak$3XpVuN8nVHmgSCtZGXtpzkiS2DufNDjWs9PdY2wxhDtMfeAGfJp8GfDMhH7rou2B2RVWcNhQtrVFNsRdvDsecsrLYHyuA2'
const ACCOUNT3 = 'ak$3Xz1iHhC3wbySq1K4B6pEXjT1rbi5p6CzCta5FjxDMCUiMPaWyPXhnUqGu7HqqwanbYqwhCVpL9WCCFGqSP6ngMgwth3Nd'

getBlockHeight(localClient).then(
  (height) => console.log(`height: ${height}`)
).catch(
  (error) => console.log(error)
)

const fullClaim = async (domain, externalClient = localClient, internalClient = internalClient) => {
  let salt = 12345
  let commitment = await aens.getCommitmentHash(externalClient, domain, salt)
  console.log(`Commitment ${commitment}`)
  let preClaimedCommitment = await aens.preClaim(internalClient, commitment, 1)
  console.log(`Preclaimed ${preClaimedCommitment}`)
  await waitNBlocks(localClient, 1)

  let nameHash = await aens.claim(internalClient, domain, salt, 1)
  console.log(`Name Hash ${nameHash}`)
  let provingName = await aens.query(localClient, domain)
  if (provingName) {
    console.log(`${domain} is mine! Data: ${JSON.stringify(provingName)}`)
  }

  return nameHash
}


const aensLifecycle = async (domain) => {
  let claimedDomain = await aens.query(localClient, domain)

  let nameHash

  if (claimedDomain) {
    nameHash = claimedDomain['name_hash']
    console.log(`${domain} has already been registered: ${JSON.stringify(claimedDomain)}`)
  } else {
    nameHash = await fullClaim(domain, localClient, internalClient)
  }

  let updatedNameHash = await aens.update(internalClient, ACCOUNT3, nameHash)
  console.log(`${updatedNameHash} has been updated!`)

  let aensData = await aens.query(localClient, domain)
  if (aensData) {
    console.log(`Updated AENS ${JSON.stringify(aensData)}`)
  }

  // TRANSFERING TOKENS TO NS DOES NOT WORK ???!!!!
  // let currentBalance = await account.balance(internalClient, ACCOUNT2)
  // console.log(`Current balance is ${currentBalance}`)
  // let success = await spend(internalClient1, domain, 1, 1)
  // console.log(`Current spent ${success}`)
  // await waitNBlocks(client, 1)
  //
  // currentBalance = await account.balance(internalClient, ACCOUNT2)
  // console.log(`After receiving the balance is ${currentBalance}`)

  let transferedHash = await aens.transfer(internalClient, nameHash, ACCOUNT1, 1)
  await waitNBlocks(localClient, 1)
  let transferedData = await aens.query(localClient, domain)
  if (transferedData) {
    console.log(`Domain data now has pointer address ${JSON.parse(transferedData.pointers)['account_key']}`)
  }

  let revokedNameHash = await aens.revoke(internalClient, nameHash, 1)
  console.log(`Revoked hash: ${revokedNameHash}`)
  await waitNBlocks(localClient, 1)

  let otherNameHash = await fullClaim(domain, localClient1, internalClient1)
  console.log(`Claimed by another account`)

  // let nsData = await aens.query(localClient, domain)
  // console.log(`Data after revoking: ${JSON.stringify(nsData)}`)
  //
  // let someOtherNsData = await aens.query(localClient, domain)
  // console.log(`Some other data after revoking: ${JSON.stringify(someOtherNsData)}`)

  return true
}

aensLifecycle('tillkolter.aet').then(
  (claimedDomain) => {
    console.log(claimedDomain ? 'finished with success': 'something went wrong')
  }
).catch((error) => console.log(error))
