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
import { TxTypeSchemasAsyncUnion } from './builder/schema';
import { Tag } from './builder/constants';
import { Encoded } from '../utils/encoder';
import { buildTx as syncBuildTx, getSchema } from './builder/index';

export type BuildTxOptions <TxType extends Tag, OmitFields extends string> =
  Omit<TxTypeSchemasAsyncUnion & { tag: TxType }, 'tag' | OmitFields>;

// TODO: find a better name or rearrange methods
/**
 * @category transaction builder
 */
export async function _buildTx(params: TxTypeSchemasAsyncUnion): Promise<Encoded.Transaction> {
  await Promise.all(
    getSchema(params.tag, params.version)
      .map(async ([key, field]) => {
        if (field.prepare == null) return;
        // @ts-expect-error the type of `params[key]` can't be determined accurately
        params[key] = await field.prepare(params[key], params, params);
      }),
  );

  // @ts-expect-error after preparation properties should be compatible with sync tx builder
  return syncBuildTx(params);
}
