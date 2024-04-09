import AccountBase from './Base';
import {
  generateKeyPairFromSecret, sign, generateKeyPair, hash, messageToHash, messagePrefixLength,
} from '../utils/crypto';
import { ArgumentError, UnexpectedTsError } from '../utils/errors';
import {
  decode, encode, Encoded, Encoding,
} from '../utils/encoder';
import { concatBuffers } from '../utils/other';
import { hashTypedData, AciValue } from '../utils/typed-data';
import { buildTx } from '../tx/builder';
import { Tag, AensName, ConsensusProtocolVersion } from '../tx/builder/constants';
import { produceNameId } from '../tx/builder/helpers';
import { DelegationTag } from '../tx/builder/delegation/schema';
import { packDelegation } from '../tx/builder/delegation';

const secretKeys = new WeakMap<AccountMemory, Uint8Array>();

export function getBufferToSign(
  transaction: Encoded.Transaction,
  networkId: string,
  innerTx: boolean,
): Uint8Array {
  const prefixes = [networkId];
  if (innerTx) prefixes.push('inner_tx');
  const rlpBinaryTx = decode(transaction);
  return concatBuffers([Buffer.from(prefixes.join('-')), hash(rlpBinaryTx)]);
}

/**
 * In-memory account class
 */
export default class AccountMemory extends AccountBase {
  override readonly address: Encoded.AccountAddress;

  /**
   * @param secretKey - Secret key
   */
  constructor(secretKey: string | Uint8Array) {
    super();
    secretKey = typeof secretKey === 'string' ? Buffer.from(secretKey, 'hex') : secretKey;
    if (secretKey.length !== 64) {
      throw new ArgumentError('secretKey', '64 bytes', secretKey.length);
    }
    secretKeys.set(this, secretKey);
    this.address = encode(
      generateKeyPairFromSecret(secretKey).publicKey,
      Encoding.AccountAddress,
    );
  }

  /**
   * Generates a new AccountMemory using a random secret key
   */
  static generate(): AccountMemory {
    return new AccountMemory(generateKeyPair().secretKey);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async sign(data: string | Uint8Array, options?: any): Promise<Uint8Array> {
    const secretKey = secretKeys.get(this);
    if (secretKey == null) throw new UnexpectedTsError();
    return sign(data, secretKey);
  }

  override async signTransaction(
    transaction: Encoded.Transaction,
    { innerTx, networkId, ...options }: { innerTx?: boolean; networkId?: string } = {},
  ): Promise<Encoded.Transaction> {
    if (networkId == null) {
      throw new ArgumentError('networkId', 'provided', networkId);
    }
    const rlpBinaryTx = decode(transaction);
    const txWithNetworkId = getBufferToSign(transaction, networkId, innerTx === true);

    const signatures = [await this.sign(txWithNetworkId, options)];
    return buildTx({ tag: Tag.SignedTx, encodedTx: rlpBinaryTx, signatures });
  }

  override async signMessage(message: string, options?: any): Promise<Uint8Array> {
    return this.sign(messageToHash(message), options);
  }

  override async signTypedData(
    data: Encoded.ContractBytearray,
    aci: AciValue,
    {
      name, version, networkId, contractAddress, ...options
    }: Parameters<AccountBase['signTypedData']>[2] = {},
  ): Promise<Encoded.Signature> {
    const dHash = hashTypedData(data, aci, {
      name, version, networkId, contractAddress,
    });
    const signature = await this.sign(dHash, options);
    return encode(signature, Encoding.Signature);
  }

  override async signDelegationToContract(
    contractAddress: Encoded.ContractAddress,
    { networkId, consensusProtocolVersion, isOracle }: {
      networkId?: string;
      consensusProtocolVersion?: ConsensusProtocolVersion;
      isOracle?: boolean;
    } = {},
  ): Promise<Encoded.Signature> {
    if (isOracle == null) {
      const protocol = (consensusProtocolVersion != null) ? ConsensusProtocolVersion[consensusProtocolVersion] : 'unknown';
      console.warn(`AccountMemory:signDelegationToContract: isOracle is not set. By default, sdk would generate an AENS preclaim delegation signature, but it won't be the same as the oracle delegation signature in Ceres (current protocol is ${protocol}).`);
    }
    if (consensusProtocolVersion === ConsensusProtocolVersion.Ceres) {
      const delegation = packDelegation({
        tag: isOracle === true ? DelegationTag.Oracle : DelegationTag.AensPreclaim,
        accountAddress: this.address,
        contractAddress,
      });
      return this.signDelegation(delegation, { networkId });
    }
    if (networkId == null) throw new ArgumentError('networkId', 'provided', networkId);
    const payload = concatBuffers([
      Buffer.from(networkId),
      decode(this.address),
      decode(contractAddress),
    ]);
    const signature = await this.sign(payload);
    return encode(signature, Encoding.Signature);
  }

  override async signNameDelegationToContract(
    contractAddress: Encoded.ContractAddress,
    name: AensName,
    { networkId, consensusProtocolVersion }: {
      networkId?: string;
      consensusProtocolVersion?: ConsensusProtocolVersion;
    } = {},
  ): Promise<Encoded.Signature> {
    if (consensusProtocolVersion === ConsensusProtocolVersion.Ceres) {
      const delegation = packDelegation({
        tag: DelegationTag.AensName, accountAddress: this.address, contractAddress, nameId: name,
      });
      return this.signDelegation(delegation, { networkId });
    }
    if (networkId == null) throw new ArgumentError('networkId', 'provided', networkId);
    const payload = concatBuffers([
      Buffer.from(networkId),
      decode(this.address),
      decode(produceNameId(name)),
      decode(contractAddress),
    ]);
    const signature = await this.sign(payload);
    return encode(signature, Encoding.Signature);
  }

  override async signAllNamesDelegationToContract(
    contractAddress: Encoded.ContractAddress,
    { networkId, consensusProtocolVersion }: {
      networkId?: string;
      consensusProtocolVersion?: ConsensusProtocolVersion;
    } = {},
  ): Promise<Encoded.Signature> {
    if (consensusProtocolVersion === ConsensusProtocolVersion.Ceres) {
      const delegation = packDelegation({
        tag: DelegationTag.AensWildcard, accountAddress: this.address, contractAddress,
      });
      return this.signDelegation(delegation, { networkId });
    }
    if (networkId == null) throw new ArgumentError('networkId', 'provided', networkId);
    const payload = concatBuffers([
      Buffer.from(networkId),
      decode(this.address),
      Buffer.from('AENS'),
      decode(contractAddress),
    ]);
    const signature = await this.sign(payload);
    return encode(signature, Encoding.Signature);
  }

  override async signOracleQueryDelegationToContract(
    contractAddress: Encoded.ContractAddress,
    oracleQueryId: Encoded.OracleQueryId,
    { networkId, consensusProtocolVersion }: {
      networkId?: string;
      consensusProtocolVersion?: ConsensusProtocolVersion;
    } = {},
  ): Promise<Encoded.Signature> {
    if (consensusProtocolVersion === ConsensusProtocolVersion.Ceres) {
      const delegation = packDelegation({
        tag: DelegationTag.OracleResponse, queryId: oracleQueryId, contractAddress,
      });
      return this.signDelegation(delegation, { networkId });
    }
    const oracleQueryIdDecoded = decode(oracleQueryId);
    const addressDecoded = decode(this.address);
    // TODO: remove after fixing https://github.com/aeternity/aesophia/issues/475
    if (oracleQueryIdDecoded.compare(addressDecoded) === 0) {
      throw new ArgumentError('oracleQueryId', 'not equal to account address', oracleQueryId);
    }
    if (networkId == null) throw new ArgumentError('networkId', 'provided', networkId);
    const payload = concatBuffers([
      Buffer.from(networkId),
      oracleQueryIdDecoded,
      decode(contractAddress),
    ]);
    const signature = await this.sign(payload);
    return encode(signature, Encoding.Signature);
  }

  override async signDelegation(
    delegation: Encoded.Bytearray,
    { networkId }: { networkId?: string } = {},
  ): Promise<Encoded.Signature> {
    if (networkId == null) throw new ArgumentError('networkId', 'provided', networkId);
    const payload = concatBuffers([
      messagePrefixLength, new Uint8Array([1]), Buffer.from(networkId), decode(delegation),
    ]);
    const signature = await this.sign(payload);
    return encode(signature, Encoding.Signature);
  }
}
