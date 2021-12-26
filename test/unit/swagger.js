import '../'
import { describe, it } from 'mocha'
import { expect } from 'chai'
import genSwaggerClient from '../../src/utils/swagger'

describe('genSwaggerClient', function () {
  it('converts operationId in snake case to pascal', async () => {
    const client = await genSwaggerClient('http://example.com', {
      spec: { paths: { '/test': { get: { operationId: 'get_test' } } } }
    })
    expect(client.api.getTest).to.be.a('function')
  })
})
