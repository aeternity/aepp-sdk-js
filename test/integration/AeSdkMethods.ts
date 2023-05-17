import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { getSdk, url, compilerUrl } from '.';
import { assertNotNull } from '../utils';
import {
  AeSdkMethods, Node, CompilerHttp, AccountBase,
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
    const contract = await aeSdkMethods.initializeContract({
      sourceCode: ''
      + 'contract Identity =\n'
      + '  entrypoint getArg(x : int) = x',
    });
    expect(contract.$options.onAccount?.address).to.be.eql(accounts[0].address);
    [, aeSdkMethods._options.onAccount] = accounts;
    expect(contract.$options.onAccount?.address).to.be.eql(accounts[1].address);
  });
});
