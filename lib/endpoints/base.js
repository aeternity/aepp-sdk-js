

async function getBlockHeight(client) {
  const result = await client.call('/v2/top')
  return result.data.height
}

module.exports = {
  getBlockHeight
}
