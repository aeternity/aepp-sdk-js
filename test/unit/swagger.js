import '../'
import { describe, it } from 'mocha'
import { expect } from 'chai'
import { stub } from 'sinon'
import http from 'http'
import genSwaggerClient from '../../src/utils/swagger'

describe('genSwaggerClient', function () {
  it('converts operationId in snake case to pascal', async () => {
    const client = await genSwaggerClient('http://example.com', {
      spec: { paths: { '/test': { get: { operationId: 'get_test' } } } }
    })
    expect(client.api.getTest).to.be.a('function')
  })

  it('accepts optional parameter in path', async () => {
    let promise
    stub(http, 'request').callsFake((request) => {
      promise = Promise.resolve()
        .then(() => expect(request.path).to.be.equal('/test/test-hash'))
      return {
        on: () => {},
        end: () => {}
      }
    })
    const client = await genSwaggerClient('http://example.com', {
      spec: {
        paths: {
          '/test/{hash}': {
            get: {
              operationId: 'getTest',
              parameters: [{ name: 'hash', in: 'path', required: false }]
            }
          }
        }
      }
    })
    client.api.getTest({ hash: 'test-hash' })
    await promise
    http.request.restore()
  })
})
