# AENS Usage

This guide describe the basic operation on [AENS name](https://github.com/aeternity/protocol/blob/master/AENS.md) using [Aeternity JS SDK](https://github.com/aeternity/aepp-sdk-js)
 
## Main Flow

  - Pre-claim name (broadcast `pre-claim` transaction with random `salt`)
      ```js
      const sdkInstance = await Universal({ ... }) // Init Universal instance
    
      const name = 'sometube.chain'
      
      const preclaim = await sdkInstance.aensPreclaim(name, { ttl, fee, nonce })
      // {
      //   ...transactionResult,
      //   salt,
      //   commitmentId
      // } 
      ```
     >After transaction was included, you have a `300` blocks to broadcast `claim` transaction with
     the same `salt` and signed with the same private key as `pre-claim`

  - Claim name (broadcast `claim` transaction which include the `salt` of `pre-claim`)  
      Here we have two possible scenario:
       - `Name length` <= 12: start name `auction`
       - `Name length` > 12: name is claimed without `auction`
      ```js
      const salt = preclaim.salt // salt from pre-claim transaction
      const options = { ttl, fee, nonce, nameFee, onAccount } // optional: overriding default
    
      // In case of starting the auction `nameFee` will be the starting bid
      // The minimum `nameFee` will be generate by sdk if is not provided in options
      const claim = await sdkInstance.aensClaim(name, salt, options)
      
      
      // In case of auction you may need to place a bid to already started auction
      // Currently sdk can't generate the `bid fee` automatically
      // as it's depend on last bid
      import { computeBidFee, computeAuctionEndBlock } from '@aeternity/aepp-sdk/es/tx/builder/helpers'
      
      const startFee = claim.nameFee // start bid
      const increment = 0.05 // 5%

      const nameFee = computeBidFee(name, startFee, increment)
      const bid = await sdkInstance.bid(name, nameFee, options)
    
      console.log(`BID STARTED AT ${bid.blockHeight} WILL END AT ${computeAuctionEndBlock(name, bid.blockHeight)}`)
      ```
       
  - Update name  
Using `aens-update` transaction you can update the name `pointers` and extend name `ttl`
    ```js
    const pointersArray = ['ak_asd23dasdas...,', 'ct_asdf34fasdasd...']
    const nameObject = await sdkInstance.aensQuery(name)
    
    await sdkInstance.aensUpdate(name, pointersArray, options)
    // or
    await nameObject.update(pointersArray, options)
    ```
   
  - Transfer
  - Revoke
