class Base {
  constructor(epochClient) {
    this.client = epochClient
  }

  async getBlockHeight() {
    const result = await this.client.get ('top')
    return result.data.height
  }

  async waitForBlock(height, intervalTimeout = 5000) {
    return await new Promise (
      (resolve, reject) => {
        let interval = setInterval (async () => {
          let currentHeight = await this.getBlockHeight ()
          if (currentHeight >= height) {
            clearInterval (interval)
            resolve (currentHeight)
          }
        }, intervalTimeout)
      }
    )
  }

  async waitNBlocks(delta) {
    let currentHeight = await this.getBlockHeight ()
    let resultBlock = await this.waitForBlock (currentHeight + delta)
    return resultBlock
  }

  async spend(recipient, amount, fee) {
    let success
    try {
      const result = await client.post ('spend-tx', {
        'recipient_pubkey': recipient,
        amount,
        fee
      })
      success = true
      if (result.data === {}) success = true
    } catch (e) {
      console.error (e)
      success = false
    }
    if (success) {
      return amount
    } else {
      throw `Could not transfer ${amount}`
    }
  }

}


module.exports = Base