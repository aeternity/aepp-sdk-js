class Account {


  constructor(epochClient) {
    this.BASE_ENDPOINT = 'account'
    this.client = epochClient
  }

  async balance(pubKey) {
    let {data} = await client.get (`${this.BASE_ENDPOINT}/balance/${pubKey}`, false)
    return data.balance
  }

}

module.exports = Account
