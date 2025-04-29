/**
 * @category contract
 */
export enum CallReturnType {
  Ok = 0,
  Error = 1,
  Revert = 2,
}

/**
 * @category entry builder
 */
export enum EntryTag {
  Account = 10,
  Oracle = 20,
  // OracleQuery = 21,
  Name = 30,
  // NameCommitment = 31,
  // NameAuction = 37,
  Contract = 40,
  ContractCall = 41,
  ChannelOffChainUpdateTransfer = 570,
  ChannelOffChainUpdateDeposit = 571,
  ChannelOffChainUpdateWithdraw = 572,
  ChannelOffChainUpdateCreateContract = 573,
  ChannelOffChainUpdateCallContract = 574,
  // ChannelOffChainUpdateMeta = 576,
  Channel = 58,
  TreesPoi = 60,
  // TreesDb = 61,
  StateTrees = 62,
  Mtree = 63,
  MtreeValue = 64,
  ContractsMtree = 621,
  CallsMtree = 622,
  ChannelsMtree = 623,
  NameserviceMtree = 624,
  OraclesMtree = 625,
  AccountsMtree = 626,
  // CompilerSophia = 70,
  GaMetaTxAuthData = 810,
}
