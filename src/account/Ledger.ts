import type Transport from '@ledgerhq/hw-transport';
import AccountBase from './Base';
import { ArgumentError, NotImplementedError } from '../utils/errors';
import { decode, Encoded } from '../utils/encoder';
import { buildTx } from '../tx/builder';
import { Tag } from '../tx/builder/constants';

export const CLA = 0xe0;
export const GET_ADDRESS = 0x02;
export const SIGN_TRANSACTION = 0x04;
export const GET_APP_CONFIGURATION = 0x06;
export const SIGN_PERSONAL_MESSAGE = 0x08;

/**
 * Ledger wallet account class
 */
export default class AccountLedger extends AccountBase {
  readonly transport: Transport;

  override readonly address: Encoded.AccountAddress;

  readonly index: number;

  /**
   * @param transport - Connection to Ledger to use
   * @param index - Index of account
   * @param address - Address of account
   */
  constructor(transport: Transport, index: number, address: Encoded.AccountAddress) {
    super();
    this.transport = transport;
    this.index = index;
    this.address = address;
    const scrambleKey = 'w0w';
    transport.decorateAppAPIMethods(this, ['signTransaction', 'signMessage'], scrambleKey);
  }

  // eslint-disable-next-line class-methods-use-this
  override async sign(): Promise<Uint8Array> {
    throw new NotImplementedError('RAW signing using Ledger HW');
  }

  // eslint-disable-next-line class-methods-use-this
  override async signTypedData(): Promise<Encoded.Signature> {
    throw new NotImplementedError('Typed data signing using Ledger HW');
  }

  // eslint-disable-next-line class-methods-use-this
  override async signDelegationToContract(): Promise<Encoded.Signature> {
    throw new NotImplementedError('signing delegation to contract using Ledger HW');
  }

  // eslint-disable-next-line class-methods-use-this
  override async signNameDelegationToContract(): Promise<Encoded.Signature> {
    throw new NotImplementedError('signing delegation to contract using Ledger HW');
  }

  // eslint-disable-next-line class-methods-use-this
  override async signOracleQueryDelegationToContract(): Promise<Encoded.Signature> {
    throw new NotImplementedError('signing delegation to contract using Ledger HW');
  }

  override async signTransaction(
    tx: Encoded.Transaction,
    { innerTx, networkId }: { innerTx?: boolean; networkId?: string } = {},
  ): Promise<Encoded.Transaction> {
    if (innerTx != null) throw new NotImplementedError('innerTx option in AccountLedger');
    if (networkId == null) throw new ArgumentError('networkId', 'provided', networkId);

    const rawTx = decode(tx);
    let offset = 0;
    const headerLength = 4 + 1 + 4;
    const networkIdBuffer = Buffer.from(networkId);
    const toSend = [];
    while (offset !== rawTx.length) {
      const maxChunkSize = offset === 0 ? 150 - headerLength - networkIdBuffer.length : 150;
      const chunkSize = offset + maxChunkSize > rawTx.length
        ? rawTx.length - offset : maxChunkSize;
      const buffer = Buffer.alloc(
        offset === 0 ? headerLength + networkIdBuffer.length + chunkSize : chunkSize,
      );
      if (offset === 0) {
        let bufferOffset = buffer.writeUInt32BE(this.index, 0);
        bufferOffset = buffer.writeUInt32BE(rawTx.length, bufferOffset);
        bufferOffset = buffer.writeUInt8(networkIdBuffer.length, bufferOffset);
        bufferOffset += networkIdBuffer.copy(
          buffer,
          bufferOffset,
          0,
          networkIdBuffer.length,
        );
        rawTx.copy(buffer, bufferOffset, 0, 150 - bufferOffset);
      } else {
        rawTx.copy(buffer, 0, offset, offset + chunkSize);
      }
      toSend.push(buffer);
      offset += chunkSize;
    }
    const response = await toSend.reduce(
      async (previous, data, i) => {
        await previous;
        return this.transport.send(
          CLA,
          SIGN_TRANSACTION,
          i === 0 ? 0x00 : 0x80,
          0x00,
          data,
        );
      },
      Promise.resolve(Buffer.alloc(0)),
    );
    const signatures = [response.subarray(0, 64)];

    return buildTx({ tag: Tag.SignedTx, encodedTx: rawTx, signatures });
  }

  override async signMessage(messageStr: string): Promise<Uint8Array> {
    let offset = 0;
    const message = Buffer.from(messageStr);
    const toSend = [];
    while (offset !== message.length) {
      const maxChunkSize = offset === 0 ? 150 - 4 - 4 : 150;
      const chunkSize = offset + maxChunkSize > message.length
        ? message.length - offset : maxChunkSize;
      const buffer = Buffer.alloc(offset === 0 ? 4 + 4 + chunkSize : chunkSize);
      if (offset === 0) {
        buffer.writeUInt32BE(this.index, 0);
        buffer.writeUInt32BE(message.length, 4);
        message.copy(buffer, 4 + 4, offset, offset + chunkSize);
      } else {
        message.copy(buffer, 0, offset, offset + chunkSize);
      }
      toSend.push(buffer);
      offset += chunkSize;
    }
    const response = await toSend.reduce(
      async (previous, data, i) => {
        await previous;
        return this.transport.send(
          CLA,
          SIGN_PERSONAL_MESSAGE,
          i === 0 ? 0x00 : 0x80,
          0x00,
          data,
        );
      },
      Promise.resolve(Buffer.alloc(0)),
    );
    return response.subarray(0, 64);
  }
}
