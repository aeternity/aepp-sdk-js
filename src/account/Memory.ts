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
import { Tag } from '../tx/builder/constants';

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
