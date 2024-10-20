import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { getSdk } from '.';
import { assertNotNull, ensureInstanceOf, indent } from '../utils';
import { AeSdkMethods, AccountBase, MemoryAccount, Contract } from '../../src';

describe('AeSdkMethods', () => {
  let accounts: AccountBase[];
  let aeSdkMethods: AeSdkMethods;

  before(async () => {
    const sdk = await getSdk(2);
    accounts = Object.values(sdk.accounts);
    aeSdkMethods = new AeSdkMethods({
      onAccount: accounts[0],
      onNode: sdk.api,
      onCompiler: sdk.compilerApi,
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
      sourceCode: indent`
        contract Identity =
          entrypoint getArg(x : int) = x`,
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
    ensureInstanceOf(options.onAccount, MemoryAccount);
    expect(data).to.eql({
      onAccount: {
        address: options.onAccount.address,
        secretKey: options.onAccount.secretKey,
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
            {
              policy: { name: 'formDataPolicy' },
              options: { beforePolicies: ['multipartPolicy'] },
            },
            { policy: { name: 'multipartPolicy' }, options: { afterPhase: 'Deserialize' } },
            { policy: { name: 'tracingPolicy' }, options: { afterPhase: 'Retry' } },
            { policy: { name: 'redirectPolicy' }, options: { afterPhase: 'Retry' } },
            { policy: { name: 'logPolicy' }, options: { afterPhase: 'Sign' } },
            { policy: { name: 'serializationPolicy' }, options: { phase: 'Serialize' } },
            { policy: { name: 'deserializationPolicy' }, options: { phase: 'Deserialize' } },
            { policy: { name: 'version-check' }, options: {} },
            { policy: { name: 'request-queues' }, options: {} },
            { policy: { name: 'combine-get-requests' }, options: {} },
            { policy: { name: 'retry-on-failure' }, options: {} },
            { policy: { name: 'error-formatter' }, options: {} },
            { policy: { name: 'parse-big-int' }, options: { phase: 'Deserialize' } },
          ],
          _orderedPolicies: [
            { name: 'serializationPolicy' },
            { name: 'proxyPolicy' },
            { name: 'decompressResponsePolicy' },
            { name: 'formDataPolicy' },
            { name: 'version-check' },
            { name: 'request-queues' },
            { name: 'combine-get-requests' },
            { name: 'retry-on-failure' },
            { name: 'error-formatter' },
            { name: 'deserializationPolicy' },
            { name: 'parse-big-int' },
            { name: 'multipartPolicy' },
            { name: 'tracingPolicy' },
            { name: 'redirectPolicy' },
            { name: 'logPolicy' },
          ],
        },
        $host: data.onNode.$host,
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
              {
                policy: { name: 'formDataPolicy' },
                options: { beforePolicies: ['multipartPolicy'] },
              },
              { policy: { name: 'multipartPolicy' }, options: { afterPhase: 'Deserialize' } },
              { policy: { name: 'defaultRetryPolicy' }, options: { phase: 'Retry' } },
              { policy: { name: 'tracingPolicy' }, options: { afterPhase: 'Retry' } },
              { policy: { name: 'redirectPolicy' }, options: { afterPhase: 'Retry' } },
              { policy: { name: 'logPolicy' }, options: { afterPhase: 'Sign' } },
              { policy: { name: 'serializationPolicy' }, options: { phase: 'Serialize' } },
              { policy: { name: 'deserializationPolicy' }, options: { phase: 'Deserialize' } },
              { policy: { name: 'version-check' }, options: {} },
              { policy: { name: 'error-formatter' }, options: {} },
            ],
            _orderedPolicies: [
              { name: 'serializationPolicy' },
              { name: 'proxyPolicy' },
              { name: 'decompressResponsePolicy' },
              { name: 'formDataPolicy' },
              { name: 'version-check' },
              { name: 'error-formatter' },
              { name: 'deserializationPolicy' },
              { name: 'multipartPolicy' },
              { name: 'defaultRetryPolicy' },
              { name: 'tracingPolicy' },
              { name: 'redirectPolicy' },
              { name: 'logPolicy' },
            ],
          },
          $host: data.onCompiler.api.$host,
        },
      },
    });
  });
});
