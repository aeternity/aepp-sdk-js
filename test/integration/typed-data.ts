import { describe, it } from 'mocha';
import { expect } from 'chai';
import canonicalize from 'canonicalize';
import {
  AeSdk, Contract, decode, Encoded, encodeFateValue, decodeFateValue,
  hashDomain, hashJson, hashTypedData,
} from '../../src';
import { Domain } from '../../src/utils/typed-data';
import { getSdk } from '.';

describe('typed data', () => {
  describe('hashJson', () => {
    it('hashes json', () => {
      expect(hashJson({ a: 'test', b: 42 }).toString('base64')).to.be.eql('EE0l7gg3Xv9K4szSHhK2g24mx5ck1MJHHVCLJscZyEA=');
    });

    it('gets the same hash if keys ordered differently', () => {
      expect(hashJson({ b: 42, a: 'test' })).to.be.eql(hashJson({ a: 'test', b: 42 }));
    });
  });

  const plainAci = 'int';
  const plainDataDecoded = 42n;
  const plainData = 'cb_VNLOFXc=';

  const recordAci = {
    record: [
      { name: 'operation', type: 'string' },
      { name: 'parameter', type: 'int' },
    ],
  } as const;
  const recordDataDecoded = {
    operation: 'test',
    parameter: 42n,
  };
  const recordData = 'cb_KxF0ZXN0VANAuWU=';

  describe('encodeFateValue', () => {
    it('encodes plain value', () => {
      expect(encodeFateValue(plainDataDecoded, plainAci)).to.be.equal(plainData);
    });

    it('encodes record value', () => {
      expect(encodeFateValue(recordDataDecoded, recordAci)).to.be.equal(recordData);
    });
  });

  describe('decodeFateValue', () => {
    it('decodes plain value', () => {
      expect(decodeFateValue(plainData, plainAci)).to.be.eql(plainDataDecoded);
    });

    it('decodes record value', () => {
      expect(decodeFateValue(recordData, recordAci)).to.be.eql(recordDataDecoded);
    });
  });

  const domain: Domain = {
    name: 'Test app',
    version: 2,
    networkId: 'ae_devnet',
    contractAddress: 'ct_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E',
  };

  describe('hashDomain', () => {
    it('hashes', async () => {
      expect(hashDomain(domain).toString('base64')).to.be.equal('h3MNXZ4vY96Ill3Q8tEFkX4hPEC2BO2uc6OkPSCYvCY=');
    });
  });

  describe('hashTypedData', () => {
    it('hashes int', async () => {
      const hash = hashTypedData(plainData, plainAci, domain);
      expect(hash.toString('base64')).to.be.equal('dx3qpMQlMMijJAWfbecuoqsKDESjXZ0XoOfy7WIpRO0=');
    });

    it('hashes record', async () => {
      const hash = hashTypedData(recordData, recordAci, domain);
      expect(hash.toString('base64')).to.be.equal('WagBbUVTNJ+q/PUYUJbOno+pNM5Z1XNvdIZ4cLjiTwU=');
    });
  });

  describe('with contract', () => {
    let aeSdk: AeSdk;
    let contract: Contract<{
      getDomain: () => Domain & { version: bigint };
      getDomainHash: () => Uint8Array;
      hashTypedData: (parameter: number) => Uint8Array;
      verify: (parameter: number, pub: Encoded.AccountAddress, sig: Uint8Array) => boolean;
    }>;

    before(async () => {
      aeSdk = await getSdk();
      const typeJson = (canonicalize(recordAci) ?? '').replaceAll('"', '\\"');
      contract = await aeSdk.initializeContract({
        sourceCode: ''
          + '\ninclude "String.aes"'
          + '\ninclude "Option.aes"'
          + '\n'
          + '\ncontract VerifyTypedDataSignature ='
          + '\n  record domain = { name: option(string),'
          + '\n                    version: option(int),'
          + '\n                    networkId: option(string),'
          + '\n                    contractAddress: option(VerifyTypedDataSignature) }'
          + '\n'
          + '\n  entrypoint getDomain(): domain =' // kind of EIP-5267
          + '\n    { name = Some("Test app"),'
          + '\n      version = Some(2),'
          // TODO: don't hardcode network id after solving https://github.com/aeternity/aesophia/issues/461
          + '\n      networkId = Some("ae_devnet"),'
          + '\n      contractAddress = Some(Address.to_contract(Contract.address)) }'
          + '\n'
          + '\n  entrypoint getDomainHash() = Crypto.blake2b(getDomain())'
          + '\n'
          + '\n  record typedData = { operation: string, parameter: int }'
          + '\n'
          + '\n  entrypoint getTypedData(parameter: int): typedData ='
          + '\n    { operation = "test", parameter = parameter }'
          + '\n'
          + '\n  entrypoint hashTypedData(parameter: int): hash ='
          + `\n    let typeHash = Crypto.blake2b("${typeJson}")`
          + '\n    let dataHash = Crypto.blake2b(getTypedData(parameter))'
          + '\n    Crypto.blake2b(Bytes.concat(getDomainHash(), Bytes.concat(typeHash, dataHash)))'
          + '\n'
          + '\n  entrypoint verify(parameter: int, pub: address, sig: signature): bool ='
          + '\n    require(parameter > 40 && parameter < 50, "Invalid parameter")'
          + '\n    Crypto.verify_sig(hashTypedData(parameter), pub, sig)',
      });
      await contract.$deploy([]);
      domain.contractAddress = contract.$options.address;
    });

    it('gets domain', async () => {
      expect((await contract.getDomain()).decodedResult).to.be.eql({ ...domain, version: 2n });
    });

    it('calculates domain hash', async () => {
      const domainHash = Buffer.from((await contract.getDomainHash()).decodedResult);
      expect(domainHash).to.be.eql(hashDomain(domain));
    });

    it('calculates typed data hash', async () => {
      const data = encodeFateValue({ operation: 'test', parameter: 43 }, recordAci);
      const typedDataHash = Buffer.from((await contract.hashTypedData(43)).decodedResult);
      expect(typedDataHash).to.be.eql(hashTypedData(data, recordAci, domain));
    });

    it('verifies signature', async () => {
      const data = encodeFateValue({ operation: 'test', parameter: 45 }, recordAci);
      const signature = await aeSdk.signTypedData(data, recordAci, domain);
      const signatureDecoded = decode(signature);

      expect((await contract.verify(46, aeSdk.address, signatureDecoded)).decodedResult)
        .to.be.equal(false);
      expect((await contract.verify(45, aeSdk.address, signatureDecoded)).decodedResult)
        .to.be.equal(true);
    });
  });
});
