import '..';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { createHttpHeaders, RestError } from '@azure/core-rest-pipeline';
import { Node } from '../../src';

/** A node replying the same status and body to every request, without touching the network */
function genNodeReplying(status: number, body: unknown, headers: Record<string, string>): Node {
  return new Node('http://localhost', {
    retryCount: 0,
    httpClient: {
      sendRequest: async (request) => ({
        request,
        status,
        headers: createHttpHeaders({ 'content-type': 'application/json', ...headers }),
        bodyAsText: JSON.stringify(body),
      }),
    },
  });
}

describe('Node client', () => {
  // the api client is generated from an openapi document that documents this response on every
  // endpoint. A response an operation declares is a successful one unless it is marked as an
  // error, and a `$ref`-ed response (this one is) ignores the keys next to `$ref` — so marking it
  // needs the reference to be inlined first, see `tooling/autorest/node.yaml`
  it('throws when node replies that it is unavailable', async () => {
    const node = genNodeReplying(503, { reason: 'Node is syncing' }, { 'retry-after': '7' });
    await expect(node.getTopHeader()).to.be.rejectedWith(RestError, 'Node is syncing');
  });

  it('throws when node replies with an error', async () => {
    const node = genNodeReplying(404, { reason: 'Block not found' }, {});
    await expect(node.getTopHeader()).to.be.rejectedWith(RestError, 'Block not found');
  });

  // the protocol parameters are read by the transaction builder to price a transaction, so the
  // deserialization of this response decides the fee. Tested through the api client and not
  // against a hand-written object: the `oneOf` collapse in `tooling/autorest/node.yaml` and the
  // bigint mapping in `tooling/autorest/postprocessing.js` only exist in the generated client, and
  // a regression in either of them is invisible to a test that starts from the converted shape
  it('deserializes protocol parameters and node settings', async () => {
    const consensusParameters = {
      version: 6,
      effective_at_height: 0,
      // node reports every aettos amount as a decimal string, see `tooling/autorest/node.yaml`
      minimum_gas_price: '1000000000',
      gas_per_byte: 20,
      store_byte_gas: 20,
      tx_base_gas: { SpendTx: 15000, PayingForTx: 3000 },
      contract_tx_base_gas: [{ tx_type: 'ContractCallTx', abi_version: 3, tx_base_gas: 180000 }],
      state_gas_per_block: { OracleQueryTx: { part: 32000, whole: 175200 } },
      name_claim_fees: ['570288700000000000000', '352457800000000000000'],
      name_auction_timeouts: [{ length: 1, bid_timeout: 2400, bid_extension: 120 }],
      name_claim_bid_increment: 5,
      name_max_length_starting_auction: 12,
      name_claim_max_expiration: 180000,
      name_registrars: ['chain'],
      name_preclaim_expiration: 300,
      name_claim_preclaim_delta: 1,
      name_protection_period: 2400,
      name_claim_locked_fee: '0',
      allowed_contract_versions: [{ vm_version: 8, abi_version: 3 }],
      allowed_oracle_abi_versions: [0, 3],
    };
    const node = genNodeReplying(
      200,
      {
        // this body answers every request, including the `getStatus` of the version check
        node_version: '7.3.0',
        network_id: 'ae_uat',
        current_protocol_version: 6,
        locked_coins_holder_account: 'ak_11111111111111111111111111111111273Yts',
        expected_block_mine_rate: 180000,
        micro_block_cycle: 3000,
        protocols: [consensusParameters],
        // the node policy settings are a separate endpoint, this body answers it as well
        min_miner_gas_price: '1000000000',
        max_auth_fun_gas: 50000,
        mempool_tx_ttl: 256,
        mempool_nonce_offset: 5,
        dry_run_gas_limit: 6000000,
        block_gas_limit: 6000000,
      },
      {},
    );

    const { currentProtocolVersion, protocols } = await node.getProtocolParameters();
    expect(currentProtocolVersion).to.equal(6);
    const nodeSettings = await node.getNodeSettings();
    // the values a fee is counted from — a coin amount is a bigint, a gas amount a number
    expect(nodeSettings.minMinerGasPrice).to.equal(1000000000n);
    expect(nodeSettings.maxAuthFunGas).to.equal(50000);
    expect(nodeSettings.blockGasLimit).to.equal(6000000);
    const [protocol] = protocols;
    expect(protocol.minimumGasPrice).to.equal(1000000000n);
    expect(protocol.gasPerByte).to.equal(20);
    expect(protocol.txBaseGas).to.eql({ SpendTx: 15000, PayingForTx: 3000 });
    // `allOf` of a `$ref`-ed base, flattened by a directive — without it the entry comes out empty
    expect(protocol.contractTxBaseGas).to.eql([
      { txType: 'ContractCallTx', abiVersion: 3, txBaseGas: 180000 },
    ]);
    expect(protocol.stateGasPerBlock).to.eql({ OracleQueryTx: { part: 32000, whole: 175200 } });
    // a coin amount above `Number.MAX_SAFE_INTEGER`, it is wrong unless it is a bigint
    expect(protocol.nameClaimFees).to.eql([570288700000000000000n, 352457800000000000000n]);
    expect(protocol.nameClaimLockedFee).to.equal(0n);
  });
});
