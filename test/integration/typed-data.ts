import { describe, it } from 'mocha';
import { expect } from 'chai';
import canonicalize from 'canonicalize';
import { TypeResolver, ContractByteArrayEncoder } from '@aeternity/aepp-calldata';
import { AeSdk, Contract, decode, Encoded, hashDomain, hashJson, hashTypedData } from '../../src';
import { Domain } from '../../src/utils/typed-data';
import { getSdk } from '.';
import { indent } from '../utils';

describe('typed data', () => {
  describe('hashJson', () => {
    it('hashes json', () => {
      expect(hashJson({ a: 'test', b: 42 }).toString('base64')).to.eql(
        'EE0l7gg3Xv9K4szSHhK2g24mx5ck1MJHHVCLJscZyEA=',
      );
    });

    it('gets the same hash if keys ordered differently', () => {
      expect(hashJson({ b: 42, a: 'test' })).to.eql(hashJson({ a: 'test', b: 42 }));
    });
  });

  const plainAci = 'int';
  const plainData = 'cb_VNLOFXc=';

  const recordAci = {
    record: [
      { name: 'operation', type: 'string' },
      { name: 'parameter', type: 'int' },
    ],
  } as const;
  const recordData = 'cb_KxF0ZXN0VANAuWU=';

  const domain: Domain = {
    name: 'Test app',
    version: 2,
    networkId: 'ae_dev',
    contractAddress: 'ct_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E',
  };

  describe('hashDomain', () => {
    it('hashes', async () => {
      expect(hashDomain(domain).toString('base64')).to.equal(
        '9EfEJsyqTDJMZU0m/t4zXxwUj2Md8bJd1txMjeB7F2k=',
      );
    });
  });

  describe('hashTypedData', () => {
    it('hashes int', async () => {
      const hash = hashTypedData(plainData, plainAci, domain);
      expect(hash.toString('base64')).to.equal('iGXwY/cT39iSJ6xDCVK9E4WLJzSgggWO2HGUBU/8ZrE=');
    });

    it('hashes record', async () => {
      const hash = hashTypedData(recordData, recordAci, domain);
      expect(hash.toString('base64')).to.equal('T8b2qGpS0d3vEN99ile+ZNZG4FujxaRnXTgsH+sZj8Q=');
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
      contract = await Contract.initialize({
        ...aeSdk.getContext(),
        sourceCode: indent`
          include "String.aes"
          include "Option.aes"

          contract VerifyTypedDataSignature =
            record domain = { name: option(string),
                              version: option(int),
                              networkId: option(string),
                              contractAddress: option(VerifyTypedDataSignature) }

            entrypoint getDomain(): domain = // kind of EIP-5267
              { name = Some("Test app"),
                version = Some(2),
                networkId = Some("ae_dev"), // better \`Chain.network_id\`, but would complicate testing
                contractAddress = Some(Address.to_contract(Contract.address)) }

            entrypoint getDomainHash() = Crypto.blake2b(getDomain())

            record typedData = { operation: string, parameter: int }

            entrypoint getTypedData(parameter: int): typedData =
              { operation = "test", parameter = parameter }

            entrypoint hashTypedData(parameter: int): hash =
              let typeHash = Crypto.blake2b("${typeJson}")
              let dataHash = Crypto.blake2b(getTypedData(parameter))
              let payload = Bytes.concat(getDomainHash(), Bytes.concat(typeHash, dataHash))
              Crypto.blake2b(Bytes.concat(#1a00, payload))

            entrypoint verify(parameter: int, pub: address, sig: signature): bool =
              require(parameter > 40 && parameter < 50, "Invalid parameter")
              Crypto.verify_sig(hashTypedData(parameter), pub, sig)`,
      });
      await contract.$deploy([]);
      domain.contractAddress = contract.$options.address;
    });

    it('gets domain', async () => {
      expect((await contract.getDomain()).decodedResult).to.eql({ ...domain, version: 2n });
    });

    it('calculates domain hash', async () => {
      const domainHash = Buffer.from((await contract.getDomainHash()).decodedResult);
      expect(domainHash).to.eql(hashDomain(domain));
    });

    const recordType = new TypeResolver().resolveType(recordAci, {});

    it('calculates typed data hash', async () => {
      const data = new ContractByteArrayEncoder().encodeWithType(
        { operation: 'test', parameter: 43 },
        recordType,
      );
      const typedDataHash = Buffer.from((await contract.hashTypedData(43)).decodedResult);
      expect(typedDataHash).to.eql(hashTypedData(data, recordAci, domain));
    });

    it('verifies signature', async () => {
      const data = new ContractByteArrayEncoder().encodeWithType(
        { operation: 'test', parameter: 45 },
        recordType,
      );
      const signature = await aeSdk.signTypedData(data, recordAci, domain);
      const signatureDecoded = decode(signature);

      expect((await contract.verify(46, aeSdk.address, signatureDecoded)).decodedResult).to.equal(
        false,
      );
      expect((await contract.verify(45, aeSdk.address, signatureDecoded)).decodedResult).to.equal(
        true,
      );
    });
  });
});
