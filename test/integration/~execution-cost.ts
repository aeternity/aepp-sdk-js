import { before, describe, it } from 'mocha';
import { expect } from 'chai';
import {
  addTransactionHandler, getSdk, networkId, url,
} from '.';
import {
  AeSdk, Node, buildTxHash, poll, Tag, unpackTx, getTransactionSignerAddress, buildTx, Encoded,
  getExecutionCost, getExecutionCostBySignedTx, getExecutionCostUsingNode,
} from '../../src';
import { pause } from '../../src/utils/other';

const node = new Node(url);
interface TxAndCost { tx: Encoded.Transaction; cost: bigint }
const sentTxPromises: Array<Promise<TxAndCost | undefined>> = [];

addTransactionHandler((tx: Encoded.Transaction) => sentTxPromises.push((async () => {
  const { tag } = unpackTx(tx, Tag.SignedTx).encodedTx;
  let cost = 0n;
  if (tag === Tag.ChannelSettleTx) cost = await getExecutionCostUsingNode(tx, node);
  try {
    await pause(1000);
    await poll(buildTxHash(tx), { onNode: node });
  } catch (error) {
    return undefined;
  }
  if (tag !== Tag.ChannelSettleTx) {
    cost = await getExecutionCostUsingNode(tx, node, { isMined: true });
  }
  return { tx, cost };
})()));

describe('Execution cost', () => {
  let aeSdk: AeSdk;

  before(async () => {
    aeSdk = await getSdk(1);
  });

  it('calculates execution cost for spend tx', async () => {
    const { rawTx } = await aeSdk.spend(100, aeSdk.address);
    const expectedCost = 16660000000000n;
    expect(getExecutionCostBySignedTx(rawTx, networkId)).to.equal(expectedCost);
    expect(getExecutionCost(buildTx(unpackTx(rawTx, Tag.SignedTx).encodedTx)))
      .to.equal(expectedCost);
    expect(await getExecutionCostUsingNode(rawTx, node)).to.equal(expectedCost);
  });

  it('predict balance change for transaction made before in tests', async () => {
    async function getBalance(
      address: Encoded.AccountAddress,
      hash: string,
    ): Promise<bigint> {
      return BigInt(
        await aeSdk.getBalance(
          address,
          { hash: hash as Encoded.KeyBlockHash | Encoded.MicroBlockHash },
        ),
      );
    }

    const sentTransactions = (await Promise.all(sentTxPromises))
      .filter((a): a is TxAndCost => a != null);

    const checkedTags = new Set<Tag>();
    await Promise.all(
      sentTransactions.map(async ({ tx, cost }) => {
        const txHash = buildTxHash(tx);
        const params = unpackTx(tx, Tag.SignedTx).encodedTx;

        const signer = getTransactionSignerAddress(tx);
        const { blockHash } = await aeSdk.api.getTransactionByHash(txHash);
        const { prevHash } = await aeSdk.api.getMicroBlockHeaderByHash(blockHash);
        const balanceBefore = await getBalance(signer, prevHash);
        const balanceAfter = await getBalance(signer, blockHash);
        const balanceDiff = balanceBefore - cost - balanceAfter;

        if (
          params.tag === Tag.PayingForTx
          && [Tag.ContractCreateTx, Tag.ContractCallTx].includes(params.tx.encodedTx.tag)
        ) {
          expect(balanceDiff).to.be.satisfy((b: bigint) => b < 0n);
        } else if (params.tag === Tag.ContractCallTx) {
          // Can't detect AENS.claim in contract call
          // TODO: remove after solving https://github.com/aeternity/aeternity/issues/4088
          if (balanceDiff === 20000000000000000000n) return;
          // Can't detect Oracle.respond reward in contract call
          if (balanceDiff === -501000n) return;
          expect(balanceDiff).to.be.equal(0n);
        } else {
          expect(balanceDiff).to.be.equal(0n);
        }

        checkedTags.add(unpackTx(tx, Tag.SignedTx).encodedTx.tag);
      }),
    );

    const formatTags = (arr: Tag[]): string[] => arr.sort((a, b) => a - b).map((t) => Tag[t]);
    expect(formatTags(Array.from(checkedTags))).to.be.eql(formatTags([
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
      Tag.OracleResponseTx,
      Tag.GaAttachTx,
      Tag.GaMetaTx,
      Tag.PayingForTx,
    ]));
    expect(sentTransactions.length).to.be.greaterThanOrEqual(134);
  });
});
