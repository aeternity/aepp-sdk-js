/**
 * @category transaction builder
 * @see {@link https://github.com/aeternity/protocol/blob/master/node/api/api_encoding.md}
 * @see {@link https://github.com/aeternity/aeserialization/blob/eb68fe331bd476910394966b7f5ede7a74d37e35/src/aeser_api_encoder.erl#L205-L230}
 */
export enum Encoding {
  KeyBlockHash = 'kh',
  MicroBlockHash = 'mh',
  BlockPofHash = 'bf',
  BlockTxHash = 'bx',
  BlockStateHash = 'bs',
  Channel = 'ch',
  ContractAddress = 'ct',
  ContractBytearray = 'cb',
  ContractStoreKey = 'ck',
  ContractStoreValue = 'cv',
  Transaction = 'tx',
  TxHash = 'th',
  OracleAddress = 'ok',
  OracleQuery = 'ov',
  OracleQueryId = 'oq',
  OracleResponse = 'or',
  AccountAddress = 'ak',
  Signature = 'sg',
  Commitment = 'cm',
  PeerPubkey = 'pp',
  Name = 'nm',
  State = 'st',
  Poi = 'pi',
  StateTrees = 'ss',
  CallStateTree = 'cs',
  Bytearray = 'ba',
}

export type KeyBlockHash = `${Encoding.KeyBlockHash}_${string}`;
export type MicroBlockHash = `${Encoding.MicroBlockHash}_${string}`;
export type BlockPofHash = `${Encoding.BlockPofHash}_${string}`;
export type BlockTxHash = `${Encoding.BlockTxHash}_${string}`;
export type BlockStateHash = `${Encoding.BlockStateHash}_${string}`;
export type Channel = `${Encoding.Channel}_${string}`;
export type ContractAddress = `${Encoding.ContractAddress}_${string}`;
export type ContractBytearray = `${Encoding.ContractBytearray}_${string}`;
export type ContractStoreKey = `${Encoding.ContractStoreKey}_${string}`;
export type ContractStoreValue = `${Encoding.ContractStoreValue}_${string}`;
export type Transaction = `${Encoding.Transaction}_${string}`;
export type TxHash = `${Encoding.TxHash}_${string}`;
export type OracleAddress = `${Encoding.OracleAddress}_${string}`;
export type OracleQuery = `${Encoding.OracleQuery}_${string}`;
export type OracleQueryId = `${Encoding.OracleQueryId}_${string}`;
export type OracleResponse = `${Encoding.OracleResponse}_${string}`;
export type AccountAddress = `${Encoding.AccountAddress}_${string}`;
export type Signature = `${Encoding.Signature}_${string}`;
export type Commitment = `${Encoding.Commitment}_${string}`;
export type PeerPubkey = `${Encoding.PeerPubkey}_${string}`;
export type Name = `${Encoding.Name}_${string}`;
export type State = `${Encoding.State}_${string}`;
export type Poi = `${Encoding.Poi}_${string}`;
export type StateTrees = `${Encoding.StateTrees}_${string}`;
export type CallStateTree = `${Encoding.CallStateTree}_${string}`;
export type Bytearray = `${Encoding.Bytearray}_${string}`;

export type Generic<Type extends Encoding> = `${Type}_${string}`;
export type Any = `${Encoding}_${string}`;
