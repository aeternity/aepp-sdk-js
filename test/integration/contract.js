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

import { describe, it, before } from 'mocha'
import { configure, plan, ready } from './'

const identityContract = `
contract Identity =
  type state = ()
  function main(x : int) = x
`

const stateContract = `
contract StateContract =
  record state = { value: string }
  public function init(value) : state = { value = value }
  public function retrieve() = state.value
`

const callIdentityExample = `
contract StateContract =
  function main : int => int
  function __call() = main(42)
`

const identityContractByteCode = 'cb_PrYsBBtixiciNyCyavZheKqeu4ADSKyu8jftRmVstB58vKJfTjEJbgJYgqZpvWxgyWk94RuJLnAeFJi4WcC4bQwdZHZZrsktCyjoWW6RXFCF6xPa1g5EDZtau3TZtzA7d5z5ZG8gzSCaDD8fPyBx8C6wfzDgE5w9j5waTHD1bQqtMXFXZ4MPrY6K5oi7afEBqLEeDzAeSWABaDYvJsysunTRsiztpGy4jUbkV7bh7v9mtVTMkNiv9Vf9EocF3rDjMy1abRgsxJrSV9MhTo3xRAmRbDQb3hDD6H4NRFLY5ghVDAVxcCHDQgfJGKSjqBZPB2qMsCRESDjywU2gxwmi9e164ysK2UcLuxSUXzPMk6mDhFQiDt29StpwmE5Py3U3BDvEA8mtp7Bv7e6YyshHgWAc26d4PLQkKr5hx7RcYucQtSrVh47sHTzBHCaFP5k4RGzGdrme4v8npsLKggcGU5TgPfLbAQUR8kCQRZr8XFn7p59foAxw4SM6xEtvNuXqpA8fPh96D8So7bJVJ2Zn7cTfABgPPf4ADEWAxwnbgtGzzDqzHhuU4PbXAFZLZZo2xy22dEHRcvvrJqVjTuwyz2EMQcBAsjRynf4TaUehnBCEAmViasikh11yEwwsoSj8usarRurfaT2AvRMx7hv6nK8GrdbSQUyLJk2RRdrpNorYhpyHhBeBj69HTVZTTY87F4c92PndQPXm51HuHetd7fgFxbVZTy1nTgANM16qJJVgAk9xjLVoRncP6Eveh8SHuxCbXR5EqxsMFMZExrEFgeFDF7Z7n4DKwiVFjG5MyWJNYQFn5NCUhapY1PLjecPU4p5k5nLd1BVyZpL5MqtRhFcwmK4RMT73koTvgj5GAb5WocPEntZgPKnPkr8EGzj9ZMwMwd8AkaEwqtocmHhxeqGRjjRsZjEACD3LRoPYEaU17ydBpKxiVWqytADkgC1bHtZmfKPqdTQAjvpWpgy2BDDwMBjs7sFVMsV44vi47oLep9pgAt5ofoZmaEm4jbdnnvKQq9owQ5QE4o2WHuKVLBCnfHALT4dpyWtpJVq5ajpjUADCEyZqhwoW1rmnaT9MjM7Zt6ohTc8tM2zrCPVu6a7XbqmgZjz69wKza65t78AWow7t1Ry4yhegRJ6SiPtTn3wYRhKHSJc7z4iRz7WnnuLyZXLd63pp6jvF8XtDT4gjt2fdGEvgdX9jdDimdbXhkmScXbNk4gbwzvzZheKwknhhgTpMnopG9Y5zrMj62v4Py9YsYJkqW1Hs1kfeTRGiwxF2KmPP3ysTUQ1PE6oTRSwLsZVbVGxjhmtTyR4Fa4U9Cr1yBfUtSKy1kntPCKyx3TfouKy44V4tCLRdZGyr2rfuzw6k9ppP2Uh9MnDnt'

plan(1000000000)

describe.skip('Contract', function () {
  configure(this)

  let contract
  let bytecode
  let deployed

  before(async function () {
    contract = await ready(this)
  })

  describe('precompiled bytecode', () => {
    it.skip('can be invoked', async () => {
      const result = await contract.contractCallStatic(identityContractByteCode, 'sophia', 'main', { args: '(42)' })
      return result.decode('int').should.eventually.become({
        type: 'word',
        value: 42
      })
    })

    it.skip('can be invoked using type-check', async () => {
      const result = await contract.contractCallStatic(identityContractByteCode, 'sophia', 'main', { call: callIdentityExample  })
      return result.decode('int').should.eventually.become({
        type: 'word',
        value: 42
      })
    })

    it('can be deployed', async () => {
      return contract.contractDeploy(identityContractByteCode, 'sophia').should.eventually.have.property('address')
    })
  })

  it('compiles Sophia code', async () => {
    bytecode = await contract.contractCompile(identityContract)
    return bytecode.should.have.property('bytecode')
  })

  it.skip('invokes function against compiled code', async () => {
    const result = await bytecode.call('main', { args: '42' })
    return result.decode('int').should.eventually.become({
      type: 'word',
      value: 42
    })
  })

  it.skip('invokes function with type-check against compiled code', async () => {
    const result = await bytecode.call('main', { call: callIdentityExample })
    return result.decode('int').should.eventually.become({
      type: 'word',
      value: 42
    })
  })

  it('deploys compiled contracts', async () => {
    deployed = await bytecode.deploy()
    return deployed.should.have.property('address')
  })

  it('calls deployed contracts', async () => {
    const result = await deployed.call('main', { args: '42' })
    return result.decode('int').should.eventually.become({
      type: 'word',
      value: 42
    })
  })

  it('type-check call deployed contracts', async () => {
    const result = await deployed.call('main', { call: callIdentityExample })
    return result.decode('int').should.eventually.become({
      type: 'word',
      value: 42
    })
  })

  it('initializes contract state', async () => {
    const data = `"Hello World!"`
    return contract.contractCompile(stateContract)
      .then(bytecode => bytecode.deploy({ initState: data }))
      .then(deployed => deployed.call('retrieve'))
      .then(result => result.decode('string'))
      .catch(e => { console.log(e); throw e })
      .should.eventually.become({
        type: 'string',
        value: 'Hello World!'
      })
  })
})
