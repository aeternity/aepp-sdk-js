
require('@babel/polyfill')

const EpochHtmlClient = require('../index')

let clientAccount2 = new EpochHtmlClient('localhost', 3023, 3123, null, false)

let localClient1 = new EpochHtmlClient('localhost', 3013, 3113, null, false)
let localClient3 = new EpochHtmlClient('localhost', 3033, 3133, null, false)

const ACCOUNT1 = 'ak$3iABijXLcdH17i6EDv84qkVKacKHCVwkGJ1bC9svzmfWmHxmXkD6qCeY6ewp4QJHjE4tMjuNstBobq8PXcZfg6vmz8fijM'
const ACCOUNT2 = 'ak$3XpVuN8nVHmgSCtZGXtpzkiS2DufNDjWs9PdY2wxhDtMfeAGfJp8GfDMhH7rou2B2RVWcNhQtrVFNsRdvDsecsrLYHyuA2'
const ACCOUNT3 = 'ak$3Xz1iHhC3wbySq1K4B6pEXjT1rbi5p6CzCta5FjxDMCUiMPaWyPXhnUqGu7HqqwanbYqwhCVpL9WCCFGqSP6ngMgwth3Nd'

const aensLifecycle = async (domain) => {
  let claimedDomain = await clientAccount2.aens.query(domain)

  let nameHash
  if (claimedDomain) {
    nameHash = claimedDomain['name_hash']
    console.log(`${domain} has already been registered: ${JSON.stringify(claimedDomain)}`)
  } else {
    nameHash = await clientAccount2.aens.fullClaim(domain, 1, 1)
  }

  let updatedNameHash = await clientAccount2.aens.update(ACCOUNT3, nameHash)
  console.log(`${updatedNameHash} has been updated!`)
  await clientAccount2.base.waitNBlocks(1)

  let aensData = await clientAccount2.aens.query(domain)
  if (aensData) {
    console.log(`Updated AENS ${JSON.stringify(aensData)}`)
  }

  let currentBalance = await clientAccount2.account.balance(ACCOUNT2)
  console.log(`Current balance is ${currentBalance}`)
  let success = await localClient1.base.spend(domain, 1, 1)
  console.log(`Current spent ${success}`)
  await clientAccount2.base.waitNBlocks(1)
  // currentBalance = await clientAccount2.account.balance(ACCOUNT2)
  // console.log(`After receiving the balance is ${currentBalance}`)


  await clientAccount2.aens.transfer(nameHash, ACCOUNT1, 1)
  await clientAccount2.base.waitNBlocks(1)
  let transferedData = await clientAccount2.aens.query(domain)
  if (transferedData) {
    console.log(`Domain data now has pointer address ${JSON.parse(transferedData.pointers)['account_key']}`)
  }

  await clientAccount2.aens.revoke(nameHash, 1)
  // The
  await clientAccount2.base.waitNBlocks(1)

  return true
}

aensLifecycle('tillkolter.aet').then(
  (claimedDomain) => {
    console.log(claimedDomain ? 'finished with success': 'something went wrong')
  }
).catch((error) => console.log(error))
