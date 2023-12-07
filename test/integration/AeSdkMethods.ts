import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { getSdk, url, compilerUrl } from '.';
import { assertNotNull } from '../utils';
import {
  AeSdkMethods, Node, CompilerHttp, AccountBase, Contract,
} from '../../src';

describe('AeSdkMethods', () => {
  let accounts: AccountBase[];
  let aeSdkMethods: AeSdkMethods;

  before(async () => {
    accounts = Object.values((await getSdk(2)).accounts);
    aeSdkMethods = new AeSdkMethods({
      onAccount: accounts[0],
      onNode: new Node(url),
      onCompiler: new CompilerHttp(compilerUrl),
    });
  });

  it('spend coins', async () => {
    const { tx } = await aeSdkMethods.spend(1, accounts[1].address);
    assertNotNull(tx);
    expect(tx.senderId).to.equal(accounts[0].address);
    expect(tx.recipientId).to.equal(accounts[1].address);
  });

  it('created contract remains connected to sdk', async () => {
    const contract = await Contract.initialize({
      ...aeSdkMethods.getContext(),
      sourceCode: ''
      + 'contract Identity =\n'
      + '  entrypoint getArg(x : int) = x',
    });
    expect(contract.$options.onAccount?.address).to.be.eql(accounts[0].address);
    [, aeSdkMethods._options.onAccount] = accounts;
    expect(contract.$options.onAccount?.address).to.be.eql(accounts[1].address);
  });

  it('converts context to JSON', () => {
    const options = aeSdkMethods.getContext();
    const data = JSON.parse(JSON.stringify(options));
    data.onNode._httpClient = '<removed>';
    data.onCompiler.api._httpClient = '<removed>';
    expect(data).to.eql({
      onAccount: {
        address: options.onAccount.address,
      },
      onNode: {
        _requestContentType: 'application/json; charset=utf-8',
        _endpoint: '{$host}',
        _allowInsecureConnection: true,
        _httpClient: '<removed>',
        pipeline: {
          _policies: [
            { policy: { name: 'proxyPolicy' }, options: {} },
            { policy: { name: 'decompressResponsePolicy' }, options: {} },
            { policy: { name: 'formDataPolicy' }, options: {} },
            { policy: { name: 'userAgentPolicy' }, options: {} },
            { policy: { name: 'setClientRequestIdPolicy' }, options: {} },
            { policy: { name: 'defaultRetryPolicy' }, options: { phase: 'Retry' } },
            { policy: { name: 'tracingPolicy' }, options: { afterPhase: 'Retry' } },
            { policy: { name: 'redirectPolicy' }, options: { afterPhase: 'Retry' } },
            { policy: { name: 'logPolicy' }, options: { afterPhase: 'Sign' } },
            { policy: { name: 'serializationPolicy' }, options: { phase: 'Serialize' } },
            { policy: { name: 'deserializationPolicy' }, options: { phase: 'Deserialize' } },
            { policy: { name: 'request-queues' }, options: {} },
            { policy: { name: 'combine-get-requests' }, options: {} },
            { policy: { name: 'retry-on-failure' }, options: {} },
            { policy: { name: 'error-formatter' }, options: {} },
            { policy: { name: 'version-check' }, options: {} },
          ],
          _orderedPolicies: [
            { name: 'serializationPolicy' },
            { name: 'proxyPolicy' },
            { name: 'decompressResponsePolicy' },
            { name: 'formDataPolicy' },
            { name: 'userAgentPolicy' },
            { name: 'setClientRequestIdPolicy' },
            { name: 'request-queues' },
            { name: 'combine-get-requests' },
            { name: 'retry-on-failure' },
            { name: 'error-formatter' },
            { name: 'version-check' },
            { name: 'deserializationPolicy' },
            { name: 'defaultRetryPolicy' },
            { name: 'tracingPolicy' },
            { name: 'redirectPolicy' },
            { name: 'logPolicy' },
          ],
        },
        $host: 'http://localhost:3013',
        intAsString: true,
      },
      onCompiler: {
        api: {
          _requestContentType: 'application/json; charset=utf-8',
          _endpoint: '{$host}',
          _allowInsecureConnection: true,
          _httpClient: '<removed>',
          pipeline: {
            _policies: [
              { policy: { name: 'proxyPolicy' }, options: {} },
              { policy: { name: 'decompressResponsePolicy' }, options: {} },
              { policy: { name: 'formDataPolicy' }, options: {} },
              { policy: { name: 'userAgentPolicy' }, options: {} },
              { policy: { name: 'setClientRequestIdPolicy' }, options: {} },
              { policy: { name: 'defaultRetryPolicy' }, options: { phase: 'Retry' } },
              { policy: { name: 'tracingPolicy' }, options: { afterPhase: 'Retry' } },
              { policy: { name: 'redirectPolicy' }, options: { afterPhase: 'Retry' } },
              { policy: { name: 'logPolicy' }, options: { afterPhase: 'Sign' } },
              { policy: { name: 'serializationPolicy' }, options: { phase: 'Serialize' } },
              { policy: { name: 'deserializationPolicy' }, options: { phase: 'Deserialize' } },
              { policy: { name: 'error-formatter' }, options: {} },
              { policy: { name: 'version-check' }, options: {} },
            ],
            _orderedPolicies: [
              { name: 'serializationPolicy' },
              { name: 'proxyPolicy' },
              { name: 'decompressResponsePolicy' },
              { name: 'formDataPolicy' },
              { name: 'userAgentPolicy' },
              { name: 'setClientRequestIdPolicy' },
              { name: 'error-formatter' },
              { name: 'version-check' },
              { name: 'deserializationPolicy' },
              { name: 'defaultRetryPolicy' },
              { name: 'tracingPolicy' },
              { name: 'redirectPolicy' },
              { name: 'logPolicy' },
            ],
          },
          $host: 'http://localhost:3080',
        },
      },
    });
  });
});
