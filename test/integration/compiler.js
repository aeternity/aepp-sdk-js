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
import { compilerUrl, configure } from './'
import * as R from 'ramda'
import Compiler from '../../es/contract/compiler/compiler'
import CompilerPool from '../../es/contract/compiler-pool'

const identityContract = `
contract Identity =
  entrypoint main(x : int) = x
`
const encodedNumberSix = 'cb_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaKNdnK'

describe('Compiler', function () {
  configure(this)

  let compiler

  before(async function () {
    compiler = await Compiler({ compilerUrl })
  })
  describe('Compiler API', async () => {
    it('compile', async () => {
      const code = await compiler.compileContractAPI(identityContract)
      const prefix = code.slice(0, 2)
      const isString = typeof code === 'string'
      prefix.should.be.equal('cb')
      isString.should.be.equal(true)
    })
    it('get contract ACI', async () => {
      const aci = await compiler.contractGetACI(identityContract)
      aci.should.have.property('interface')
    })
    it('encode call-data', async () => {
      const encoded = await compiler.contractEncodeCallDataAPI(identityContract, 'init', [])
      const prefix = encoded.slice(0, 2)
      const isString = typeof encoded === 'string'
      prefix.should.be.equal('cb')
      isString.should.be.equal(true)
    })
    it('decode call-data', async () => {
      return compiler.contractDecodeCallResultAPI(identityContract, 'main', encodedNumberSix, 'ok').should.eventually.become(6)
    })
    it('Use invalid compiler url', async () => {
      try {
        const cloned = R.clone(compiler)
        await cloned.setCompilerUrl('https://compiler.aepps.comas')
      } catch (e) {
        e.message.should.be.equal('Compiler do not respond')
      }
    })
  })
  describe('Compiler Pool', async () => {
    let compilers
    let pool
    before(async () => {
      compilers = await Promise.all([
        Compiler({ compilerUrl }),
        Compiler({ compilerUrl })
      ])
      pool = await CompilerPool({
        compilerUrl,
        compilers: compilers.map((instance, i) => ({ name: `compiler_${i}`, instance }))
      })
    })
    it('Can get compilers', async () => {
      pool.getCompilersInPool().length.should.be.equal(3)
    })
    it('Can get current compiler info', async () => {
      return pool.getCompilerInfo().should.be.deep.equal({
        name: 'default',
        version: '3.2.0',
        compilerUrl: 'http://localhost:3080'
      })
    })
    it('Can change compiler', async () => {
      const unactiveCompilers = pool.getCompilersInPool().filter(({ name }) => name !== pool.selectedCompiler.name)
      pool.selectCompiler(unactiveCompilers[0].name)
      pool.getCompilerInfo().name.should.be.equal(unactiveCompilers[0].name)
    })
    it('Can add compiler', async () => {
      const newCompiler = await Compiler({ compilerUrl })
      pool.addCompiler('compiler_2', newCompiler)
      pool.getCompilersInPool().length.should.be.equal(4)
    })
    it('Try to use empty pool', async () => {
      const pool = await CompilerPool({})
      try {
        await pool.contractDecodeCallResultAPI()
      } catch (e) {
        e.message.should.be.equal('Compiler is not connected')
      }
    })
  })
})
