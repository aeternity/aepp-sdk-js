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

import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { getSdk } from './index';
import {
  AeSdk,
  commitmentHash, oracleQueryId, decode, encode,
  ORACLE_TTL_TYPES, TX_TYPE, AE_AMOUNT_FORMATS,
} from '../../src';
import { EncodedData } from '../../src/utils/encoder';

const nonce = 1;
const nameTtl = 1;
const clientTtl = 1;
const amount = 0;
const senderId: EncodedData<'ak'> = 'ak_2iBPH7HUz3cSDVEUWiHg76MZJ6tZooVNBmmxcgVK6VV8KAE688';
const recipientId: EncodedData<'ak'> = 'ak_2iBPH7HUz3cSDVEUWiHg76MZJ6tZooVNBmmxcgVK6VV8KAE688';
const name = 'test123test.chain';
const nameId = 'nm_2sFnPHi5ziAqhdApSpRBsYdomCahtmk3YGNZKYUTtUNpVSMccC';
const nameFee = '1000000000000000000000';
const pointers = [{ key: 'account_pubkey', id: senderId }];

// Oracle
const queryFormat = '{\'city\': str}';
const responseFormat = '{\'tmp\': num}';
const queryFee = 30000;
const oracleTtl = { oracleTtlType: ORACLE_TTL_TYPES.delta, oracleTtlValue: 500 };
const responseTtl = { responseTtlType: ORACLE_TTL_TYPES.delta, responseTtlValue: 100 };
const queryTtl = { queryTtlType: ORACLE_TTL_TYPES.delta, queryTtlValue: 100 };
const query = '{\'city\': \'Berlin\'}';
const queryResponse = '{\'tmp\': 101}';

// Contract test data
const contractSource = `
contract Identity =
  entrypoint getArg(x : int) = x
`;
const gasLimit = 5e6;

// Name
const nameSalt = 4204563566073083;
const commitmentId = commitmentHash(name, nameSalt);

describe('Transaction', () => {
  let aeSdk: AeSdk;
  const address = 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR';
  const oracleId = encode(decode(address), 'ok');
  let contract: any;

  before(async () => {
    aeSdk = await getSdk(0);
    contract = await aeSdk.getContractInstance({ source: contractSource });
  });

  it('build spend tx using denomination amount', async () => {
    const params = {
      senderId, recipientId, nonce, payload: 'test',
    };
    const spendAe = await aeSdk.buildTx(
      TX_TYPE.spend,
      { ...params, amount: 1, denomination: AE_AMOUNT_FORMATS.AE },
    );
    const spendAettos = await aeSdk.buildTx(TX_TYPE.spend, { ...params, amount: 1e18 });
    spendAe.should.be.equal(spendAettos);
  });

  const contractId = 'ct_TCQVoset7Y4qEyV5tgEAJAqa2Foz8J1EXqoGpq3fB6dWH5roe';
  const transactions: Array<[string, string, () => Promise<string>]> = [[
    'spend',
    'tx_+F0MAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ChAeEyuPHdt6BOY7f6lkeaVLvFJaUxp/G8DOSSEhkDBn+wiBvBbWdOyAAAhg9e1n8oAAABhHRlc3QLK3OW',
    async () => aeSdk.buildTx(TX_TYPE.spend, {
      senderId, recipientId, nonce, payload: 'test', amount: 2, denomination: AE_AMOUNT_FORMATS.AE,
    }),
  ], [
    'name pre-claim',
    'tx_+E8hAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABoQOvDVCf43V7alNbsUvTarXaCf7rjtWX36YLS4+JTa4jn4YPHaUyOAAAxRZ6Sg==',
    async () => aeSdk.buildTx(TX_TYPE.namePreClaim, {
      accountId: senderId, nonce, commitmentId,
    }),
  ], [
    'name claim',
    'tx_+FEgAqEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABkXRlc3QxMjN0ZXN0LmNoYWluhw7wBz3KlPuJNjXJrcXeoAAAhg8m9WHIAABl9JBX',
    async () => aeSdk.buildTx(TX_TYPE.nameClaim, {
      accountId: senderId, nonce, name, nameSalt, nameFee,
    }),
  ], [
    'name update',
    'tx_+IQiAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABoQL1zlEz+3+D5h4MF9POub3zp5zJ2fj6VUWGMNOhCyMYPAHy8Y5hY2NvdW50X3B1YmtleaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABhhAUch6gAADR52s+',
    async () => aeSdk.buildTx(TX_TYPE.nameUpdate, {
      accountId: senderId, nonce, nameId, nameTtl, pointers, clientTtl,
    }),
  ], [
    'name revoke',
    'tx_+E8jAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABoQL1zlEz+3+D5h4MF9POub3zp5zJ2fj6VUWGMNOhCyMYPIYPHaUyOAAA94BVgw==',
    async () => aeSdk.buildTx(TX_TYPE.nameRevoke, { accountId: senderId, nonce, nameId }),
  ], [
    'name transfer',
    'tx_+HEkAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ABoQL1zlEz+3+D5h4MF9POub3zp5zJ2fj6VUWGMNOhCyMYPKEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7CGD7v4WsgAAL1d+NM=',
    async () => aeSdk.buildTx(TX_TYPE.nameTransfer, {
      accountId: senderId, nonce, nameId, recipientId,
    }),
  ], [
    'contract create',
    'tx_+LAqAaEB1c8IQA6YgiLybrSwLI+JB3RXRnIRpubZVe23B0nGozsBuGr4aEYDoKEijZbj/w2AeiWwAbldusME5pm3ZgPuomnZ3TbUbYgrwLg7nv5E1kQfADcANwAaDoI/AQM//oB4IJIANwEHBwEBAJgvAhFE1kQfEWluaXQRgHggkhlnZXRBcmeCLwCFNi4xLjAAgwcAA4ZHcyzkwAAAAACDTEtAhDuaygCHKxFE1kQfPxOlnVo=',
    async () => aeSdk.buildTx(TX_TYPE.contractCreate, {
      nonce,
      ownerId: address,
      code: await contract.compile(),
      amount,
      gasLimit,
      callData: contract.calldata.encode('Identity', 'init', []),
    }),
  ], [
    'contract call',
    'tx_+GMrAaEB1c8IQA6YgiLybrSwLI+JB3RXRnIRpubZVe23B0nGozsBoQU7e5ChtHAGM1Nh0MVEV74SbrYb1b5FQ3WBd7OBpwALyQOGpYvVcSgAAACDTEtAhDuaygCIKxGAeCCSGwT8YkzY',
    async () => aeSdk.buildTx(TX_TYPE.contractCall, {
      nonce,
      callerId: address,
      contractId,
      amount,
      gasLimit,
      callData: contract.calldata.encode('Identity', 'getArg', [2]),
    }),
  ], [
    'oracle register',
    'tx_+FAWAaEB1c8IQA6YgiLybrSwLI+JB3RXRnIRpubZVe23B0nGozsBjXsnY2l0eSc6IHN0cn2Meyd0bXAnOiBudW19gnUwAIIB9IYPN7jqmAAAAGsRIcw=',
    async () => aeSdk.buildTx(TX_TYPE.oracleRegister, {
      nonce, accountId: address, queryFormat, responseFormat, queryFee, ...oracleTtl,
    }),
  ], [
    'oracle extend',
    'tx_8RkBoQTVzwhADpiCIvJutLAsj4kHdFdGchGm5tlV7bcHScajOwEAggH0hg6itfGYAADwE/X7',
    async () => aeSdk.buildTx(TX_TYPE.oracleExtend, {
      nonce, oracleId, callerId: address, ...oracleTtl,
    }),
  ], [
    'oracle post query',
    'tx_+GkXAaEB1c8IQA6YgiLybrSwLI+JB3RXRnIRpubZVe23B0nGozsBoQTVzwhADpiCIvJutLAsj4kHdFdGchGm5tlV7bcHScajO5J7J2NpdHknOiAnQmVybGluJ32CdTAAZABkhg+bJBmGAAAtn7nr',
    async () => aeSdk.buildTx(TX_TYPE.oracleQuery, {
      nonce, oracleId, ...responseTtl, query, ...queryTtl, queryFee, senderId: address,
    }),
  ], [
    'oracle respond query',
    'tx_+F0YAaEE1c8IQA6YgiLybrSwLI+JB3RXRnIRpubZVe23B0nGozsBoClgM30zCmbxGvUfzRbIZXGzOT8KCzYAUMRdnxbBX2Q9jHsndG1wJzogMTAxfQBkhg9jQvwmAADfRUs7',
    async () => aeSdk.buildTx(TX_TYPE.oracleResponse, {
      nonce,
      oracleId,
      callerId: address,
      ...responseTtl,
      queryId: oracleQueryId(address, nonce, oracleId),
      response: queryResponse,
    }),
  ]];

  transactions.forEach(([txName, expected, getter]) => it(`build of ${txName} transaction`, async () => {
    expect(await getter()).to.be.equal(expected);
  }));
});
