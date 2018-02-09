

const BASE_ENDPOINT = 'account'

async function balance(client, pubKey) {
  let {data} = await client.get(`${BASE_ENDPOINT}/balance/${pubKey}`)
  return data.balance
}


module.exports = {
  balance
}
