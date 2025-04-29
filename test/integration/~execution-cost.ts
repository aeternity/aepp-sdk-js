import { before, describe, it } from 'mocha';
import { expect } from 'chai';
import { addTransactionHandler, getSdk, networkId, url } from '.';
import {
  AeSdk,
  Node,
  buildTxHash,
  poll,
  Tag,
  unpackTx,
  getTransactionSignerAddress,
  buildTx,
  Encoded,
  getExecutionCost,
  getExecutionCostBySignedTx,
  getExecutionCostUsingNode,
} from '../../src';
import { pause } from '../../src/utils/other';

const node = new Node(url);
interface TxDetails {
  tx: Encoded.Transaction;
  cost: bigint;
  blockHash: Encoded.MicroBlockHash;
}
const sentTxPromises: Array<Promise<TxDetails | undefined>> = [];

addTransactionHandler((tx: Encoded.Transaction) =>
  sentTxPromises.push(
    (async () => {
      const { tag } = unpackTx(tx, Tag.SignedTx).encodedTx;
      let cost = 0n;
      if (tag === Tag.ChannelSettleTx) cost = await getExecutionCostUsingNode(tx, node);
      let blockHash: Encoded.MicroBlockHash;
      try {
        await pause(1000);
        blockHash = (await poll(buildTxHash(tx), { onNode: node }))
          .blockHash as Encoded.MicroBlockHash;
      } catch (error) {
        return undefined;
      }
      if (tag !== Tag.ChannelSettleTx) {
        cost = await getExecutionCostUsingNode(tx, node, { isMined: true });
      }
      return { tx, cost, blockHash };
    })(),
  ),
);

describe('Execution cost', () => {
  let aeSdk: AeSdk;

  before(async () => {
    aeSdk = await getSdk(1);
  });

  it('calculates execution cost for spend tx', async () => {
    const { rawTx } = await aeSdk.spend(100, aeSdk.address, { ttl: 0 });
    const expectedCost = 16660000000000n + 100n;
    expect(getExecutionCostBySignedTx(rawTx, networkId)).to.equal(expectedCost);
    expect(getExecutionCost(buildTx(unpackTx(rawTx, Tag.SignedTx).encodedTx))).to.equal(
      expectedCost,
    );
    expect(await getExecutionCostUsingNode(rawTx, node)).to.equal(expectedCost);
  });

  it('predict balance change for transaction made before in tests', async () => {
    async function getBalance(address: Encoded.AccountAddress, hash: string): Promise<bigint> {
      return BigInt(
        await aeSdk.getBalance(address, {
          hash: hash as Encoded.KeyBlockHash | Encoded.MicroBlockHash,
        }),
      );
    }

    const sentTransactions = (await Promise.all(sentTxPromises))
      .filter((tx): tx is TxDetails => tx != null)
      .filter((tx, i, arr) => arr.filter((el) => el.blockHash === tx.blockHash).length === 1);

    const checkedTags = new Set<Tag>();
    await Promise.all(
      sentTransactions.map(async ({ tx, cost, blockHash }) => {
        const params = unpackTx(tx, Tag.SignedTx).encodedTx;

        const signer = getTransactionSignerAddress(tx);
        const { prevHash } = await aeSdk.api.getMicroBlockHeaderByHash(blockHash);
        const balanceBefore = await getBalance(signer, prevHash);
        const balanceAfter = await getBalance(signer, blockHash);
        const balanceDiff = balanceBefore - cost - balanceAfter;

        if (
          params.tag === Tag.PayingForTx &&
          [Tag.ContractCreateTx, Tag.ContractCallTx].includes(params.tx.encodedTx.tag)
        ) {
          expect(balanceDiff).to.satisfy((b: bigint) => b < 0n);
        } else if (params.tag === Tag.ContractCallTx) {
          // Can't detect AENS.claim in contract call
          // TODO: remove after solving https://github.com/aeternity/aeternity/issues/4088
          if (balanceDiff === 500000000000001n) return;
          // Can't detect Oracle.respond reward in contract call
          if (balanceDiff === -501000n) return;
          expect(balanceDiff).to.equal(0n);
        } else if (params.tag === Tag.SpendTx && params.senderId === params.recipientId) {
          expect(balanceDiff).to.equal(BigInt(-params.amount));
        } else {
          expect(balanceDiff).to.equal(0n);
        }

        checkedTags.add(unpackTx(tx, Tag.SignedTx).encodedTx.tag);
      }),
    );

    const formatTags = (arr: Tag[]): string[] => arr.sort((a, b) => a - b).map((t) => Tag[t]);
    expect(formatTags(Array.from(checkedTags))).to.eql(
      formatTags([
        Tag.SpendTx,
        Tag.NamePreclaimTx,
        Tag.NameClaimTx,
        Tag.ContractCreateTx,
        Tag.ContractCallTx,
        Tag.NameUpdateTx,
        Tag.NameTransferTx,
        Tag.NameRevokeTx,
        Tag.ChannelCloseSoloTx,
        Tag.ChannelSlashTx,
        Tag.ChannelSettleTx,
        Tag.OracleRegisterTx,
        Tag.OracleExtendTx,
        Tag.OracleQueryTx,
        Tag.OracleRespondTx,
        Tag.GaAttachTx,
        Tag.GaMetaTx,
        Tag.PayingForTx,
      ]),
    );
    expect(sentTransactions.length).to.be.greaterThanOrEqual(134);
  }).timeout(16000);
});
