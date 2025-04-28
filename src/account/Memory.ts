import nacl from 'tweetnacl';
import AccountBase from './Base.js';
import { hash, hashMessage, messagePrefixLength } from '../utils/crypto.js';
import { ArgumentError } from '../utils/errors.js';
import { decode, encode, Encoded, Encoding } from '../utils/encoder.js';
import { concatBuffers } from '../utils/other.js';
import { hashTypedData, AciValue } from '../utils/typed-data.js';
import { buildTx } from '../tx/builder/index.js';
import { Tag } from '../tx/builder/constants.js';

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
 * @category account
 */
export default class AccountMemory extends AccountBase {
  override readonly address: Encoded.AccountAddress;

  readonly #secretKeyDecoded: Uint8Array;

  /**
   * @param secretKey - Secret key
   */
  constructor(public readonly secretKey: Encoded.AccountSecretKey) {
    super();
    const keyPair = nacl.sign.keyPair.fromSeed(decode(secretKey));
    this.#secretKeyDecoded = keyPair.secretKey;
    this.address = encode(keyPair.publicKey, Encoding.AccountAddress);
  }

  /**
   * Generates a new AccountMemory using a random secret key
   */
  static generate(): AccountMemory {
    const secretKey = encode(nacl.randomBytes(32), Encoding.AccountSecretKey);
    return new AccountMemory(secretKey);
  }

  /**
   * @deprecated Use `unsafeSign` method instead
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async sign(data: string | Uint8Array, options?: any): Promise<Uint8Array> {
    return this.unsafeSign(data, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async unsafeSign(data: string | Uint8Array, options?: any): Promise<Uint8Array> {
    return nacl.sign.detached(Buffer.from(data), this.#secretKeyDecoded);
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

    const signatures = [await this.unsafeSign(txWithNetworkId, options)];
    return buildTx({ tag: Tag.SignedTx, encodedTx: rlpBinaryTx, signatures });
  }

  override async signMessage(message: string, options?: any): Promise<Uint8Array> {
    return this.unsafeSign(hashMessage(message), options);
  }

  override async signTypedData(
    data: Encoded.ContractBytearray,
    aci: AciValue,
    {
      name,
      version,
      networkId,
      contractAddress,
      ...options
    }: Parameters<AccountBase['signTypedData']>[2] = {},
  ): Promise<Encoded.Signature> {
    const dHash = hashTypedData(data, aci, {
      name,
      version,
      networkId,
      contractAddress,
    });
    const signature = await this.unsafeSign(dHash, options);
    return encode(signature, Encoding.Signature);
  }

  override async signDelegation(
    delegation: Encoded.Bytearray,
    { networkId }: { networkId?: string } = {},
  ): Promise<Encoded.Signature> {
    if (networkId == null) throw new ArgumentError('networkId', 'provided', networkId);
    const payload = concatBuffers([
      messagePrefixLength,
      new Uint8Array([1]),
      Buffer.from(networkId),
      decode(delegation),
    ]);
    const signature = await this.unsafeSign(payload);
    return encode(signature, Encoding.Signature);
  }
}
