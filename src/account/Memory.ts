import nacl from 'tweetnacl';
import AccountBase from './Base';
import { hash, messageToHash, messagePrefixLength } from '../utils/crypto';
import { ArgumentError } from '../utils/errors';
import { decode, encode, Encoded, Encoding } from '../utils/encoder';
import { concatBuffers } from '../utils/other';
import { hashTypedData, AciValue } from '../utils/typed-data';
import { buildTx } from '../tx/builder';
import { Tag } from '../tx/builder/constants';

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async sign(data: string | Uint8Array, options?: any): Promise<Uint8Array> {
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
    const signature = await this.sign(dHash, options);
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
    const signature = await this.sign(payload);
    return encode(signature, Encoding.Signature);
  }
}
