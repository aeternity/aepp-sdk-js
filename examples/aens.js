const {AeternityClient} = require('../index.js')
const {HttpProvider} = AeternityClient.providers

let client1 = new AeternityClient(new HttpProvider('localhost', 3013, {secured: false}))
let client2 = new AeternityClient(new HttpProvider('localhost', 3023, {secured: false}))
let client3 = new AeternityClient(new HttpProvider('localhost', 3033, {secured: false}))

const aensLifecycle = async (domain) => {
  // get account pubkeys
  let account1 = await client1.accounts.getPublicKey()
  let account3 = await client3.accounts.getPublicKey()

  let balance2
  try {
    balance2 = await client2.accounts.getBalance()
  } catch (e) {
    balance2 = 0
  }
  if (balance2 === 0) {
    await client1.base.spend(await client2.accounts.getPublicKey(), 50, 5)
    await client1.base.waitNBlocks(1)
  }

  let claimedDomain = await client2.aens.getName(domain)

  let nameHash
  if (claimedDomain) {
    nameHash = claimedDomain['name_hash']
    console.log(`${domain} has already been registered: ${JSON.stringify(claimedDomain)}`)
  } else {
    nameHash = await client2.aens.fullClaim(domain, 1, 1)
  }

  let updatedNameHash = await client2.aens.update(account3, nameHash)
  console.log(`${updatedNameHash} has been updated!`)
  await client2.base.waitNBlocks(1)

  let aensData = await client2.aens.getName(domain)
  if (aensData) {
    console.log(`Updated AENS ${JSON.stringify(aensData)}`)
  }

  let balance1
  let balance3

  try {
    balance1 = await client1.account.getBalance ()
    balance3 = await client3.account.getBalance()
    console.log(`Current balances: AK 1 ${balance1}, AK3 ${balance3}`)
  } catch (error) {
    console.error(error)
  }

  let spentTokens = await client1.base.spend(domain, 1, 1)
  console.log(`Account 1 sent ${spentTokens} token to Domain of Account 3!`)
  await client2.base.waitNBlocks(1)

  try {
    balance1 = await client1.account.getBalance()
    balance3 = await client3.account.getBalance()
    console.log(`Balances after transfer: AK1 ${balance1}, AK3 ${balance3}`)
  } catch (error) {
    console.error(error)
  }

  await client2.aens.transfer(nameHash, account1, 1)
  await client2.base.waitNBlocks(1)
  let transferedData = await client2.aens.getName(domain)
  if (transferedData) {
    console.log(`Domain data now has pointer address ${JSON.parse(transferedData.pointers)['account_pubkey']}`)
  }

  await client2.aens.revoke(nameHash, 1)
  await client2.base.waitNBlocks(1)

  return true
}

aensLifecycle('aepps.aet').then(
  (claimedDomain) => {
    console.log(claimedDomain ? 'finished with success': 'something went wrong')
  }
).catch((error) => console.log(error))
