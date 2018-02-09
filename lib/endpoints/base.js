
async function getBlockHeight(client) {
  const result = await client.get('top')
  return result.data.height
}

const waitForBlock = async (client, height, timeout = 5000) => {
  return await new Promise(
    (resolve, reject) => {
      let interval = setInterval(async() => {
        let currentHeight = await getBlockHeight(client)
        if (currentHeight >= height) {
          clearInterval(interval)
          resolve(currentHeight)
        }
      }, timeout)
    }
  )
}

const waitNBlocks = async (client, delta) => {
  let currentHeight = await getBlockHeight(client)
  let resultBlock = await waitForBlock(client, currentHeight + delta)
  return resultBlock
}



async function spend(client, recipient, amount, fee) {
  let success
  try {
    const result = await client.post('spend-tx', {'recipient_pubkey': recipient, amount, fee})
    success = true
    if (result.data === {}) success = true
  } catch (e) {
    console.error(e)
    success = false
  }
  if (success) {
    return amount
  } else {
    throw `Could not transfer ${amount}`
  }
}


module.exports = {
  getBlockHeight,
  waitNBlocks,
  spend
}
