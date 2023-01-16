/*
 * ISC License (ISC)
 * Copyright (c) 2022 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

/**
 * Transaction methods
 *
 * This is implementation of [Tx](api/tx.md) relays
 * the creation of transactions to {@link Node}.
 * These methods provide ability to create native transactions.
 */
import { TxParamsCommon, TxSchema, TxTypeSchemasAsync } from './builder/schema';
import { Tag } from './builder/constants';
import Node from '../Node';
import { Encoded } from '../utils/encoder';
import { buildTx as syncBuildTx, getSchema } from './builder/index';
import { Field } from './builder/field-types';

export type BuildTxOptions <TxType extends Tag, OmitFields extends string> =
  Omit<Parameters<typeof _buildTx<TxType>>[1], OmitFields>;

// TODO: find a better name or rearrange methods
/**
 * @category transaction builder
 */
export async function _buildTx<TxType extends Tag>(
  txType: TxType,
  _params: Omit<TxTypeSchemasAsync[TxType], 'tag'>,
): Promise<Encoded.Transaction> {
  // TODO: avoid this assertion
  const params = _params as unknown as TxParamsCommon & { onNode: Node };

  await Promise.all(
    getSchema(txType, params.version)
      .map(async ([key, field]: [keyof TxSchema, Field]) => {
        if (field.prepare == null) return;
        params[key] = await field.prepare(params[key], params, params);
      }),
  );

  return syncBuildTx({ ...params, tag: txType } as any);
}
