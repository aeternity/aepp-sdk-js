/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

import {describe, it, before} from 'mocha'
import {configure, ready, plan, BaseAe} from './'
import {generateKeyPair} from '../../es/utils/crypto'
import Channel from '../../es/channel/epoch'

plan(1000)

describe('Epoch Channel', function () {
  configure(this)

  let initiator
  let responder

  before(async function () {
    initiator = await ready(this)
    responder = await BaseAe()
    responder.setKeypair(generateKeyPair())
    await initiator.spend(100, await responder.address())
  })

  it('should open a channel', async () => {
    function waitForChannel (channel) {
      return new Promise(resolve =>
        channel.on('statusChanged', (status) => {
          if (status === 'open') {
            resolve()
          }
        })
      )
    }
    const sharedParams = {
      url: 'ws://proxy:3001',
      initiatorId: await initiator.address(),
      responderId: await responder.address(),
      pushAmount: 3,
      initiatorAmount: 10,
      responderAmount: 10,
      channelReserve: 2,
      ttl: 10000,
      host: 'localhost',
      port: 3001,
      lockPeriod: 10
    }
    const initiatorCh = await Channel({
      ...sharedParams,
      role: 'initiator',
      sign: async (tag, tx) => await initiator.signTransaction(tx)
    })
    const responderCh = await Channel({
      ...sharedParams,
      role: 'responder',
      sign: async (tag, tx) => await responder.signTransaction(tx)
    })
    return Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)])
  })
})