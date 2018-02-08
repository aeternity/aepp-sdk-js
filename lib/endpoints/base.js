

async function getBlockHeight(client) {
  const result = await client.get('top')
  console.log(`current block height ${result.data.height}`)
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

module.exports = {
  getBlockHeight,
  waitForBlock,
  waitNBlocks
}
