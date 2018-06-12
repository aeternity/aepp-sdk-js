// Example script to register AENS (æternity naming system) names. This examples assumes
// the 'classic' setup of 3 nodes on the same machines with their public interfaces exposed
// on ports 3013, 3023 and 3033.
const {AeternityClient} = require('../index.js')
const {HttpProvider} = AeternityClient.providers

let client1 = new AeternityClient(new HttpProvider('localhost', 3013, {secured: false}))
let client2 = new AeternityClient(new HttpProvider('localhost', 3023, {secured: false}))
let client3 = new AeternityClient(new HttpProvider('localhost', 3033, {secured: false}))

const aensLifecycle = async (domain) => {
  // First get the public keys for nodes 1 and 3
  let account1 = await client1.accounts.getPublicKey()
  let account3 = await client3.accounts.getPublicKey()

  // Then we get the balance for node 2
  let balance2
  try {
    balance2 = await client2.accounts.getBalance()
  } catch (e) {
    balance2 = 0
  }
  if (balance2 === 0) {
    // if node 2 has a balance of zero, give it 50 (paying a fee of 5, which seems a little high).
    await client1.base.spend(await client2.accounts.getPublicKey(), 50, 5)
    // wait for a block to be mined. Better would be to check that the transaction has been included in
    // a mined block.
    await client1.base.waitNBlocks(1)
  }

  // First step in registering a name--get the hash. We ought to generate it ourselves, but for the
  // purposes of this demo we're going to ask the node for the hash.
  let claimedDomain = await client2.aens.getName(domain)

  let nameHash
  if (claimedDomain) {
    nameHash = claimedDomain['name_hash']
    console.log(`${domain} has already been registered: ${JSON.stringify(claimedDomain)}`)
  } else {
    // Now we make the full claim.
    nameHash = await client2.aens.fullClaim(domain, 1, 1)
  }

  // Now we have the hash, we can update it so that it points to the public key of node 3
  let updatedNameHash = await client2.aens.update(account3, nameHash)
  console.log(`${updatedNameHash} has been updated!`)
  await client2.base.waitNBlocks(1)

  // And check that everything worked.
  let aensData = await client2.aens.getName(domain)
  if (aensData) {
    console.log(`Updated AENS ${JSON.stringify(aensData)}`)
  }

  let balance1
  let balance3

  try {
    balance1 = await client1.account.getBalance()
    balance3 = await client3.account.getBalance()
    console.log(`Current balances: AK 1 ${balance1}, AK3 ${balance3}`)
  } catch (error) {
    console.error(error)
  }

  // We send the tokens to the name, which of course now points to the address of node 3
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

  // Now give away the name to node 1's account.
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
    console.log(claimedDomain ? 'finished with success' : 'something went wrong')
  }
).catch((error) => console.log(error))
