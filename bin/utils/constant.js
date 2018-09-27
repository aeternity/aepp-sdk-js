//
// const CONFIG_PATH = './config'
//
// const DEFAULT_CONFIG = {}
//
// class AEConfig {
//   configs = []
//   constructor (){
//
//   }
//
//   validate(config) {}
//
//   removeConfig(configName) {}
//
//   createConfig(configName) {}
//
//   selectConfig(configName) {}
//
//   getConfigsFromFS() {}
// }
//
// const instance = new AEConfig(CONFIG_PATH)

// HAST TYPES
export const HASH_TYPES = {
  transaction: 'th',
  contract: 'ct',
  block: 'kh',
  micro_block: 'mh',
  signature: 'sg',
  account: 'ak',
  stateHash: 'bs'
}

// CONNECTION
export const EPOCH_URL = 'https://sdk-edgenet.aepps.com'
export const EPOCH_INTERNAL_URL = 'https://sdk-edgenet.aepps.com'
export const EPOCH_WEBSOCKET_URL = 'https://sdk-edgenet.aepps.com'

// CHAIN
export const PLAY_LIMIT = 10
export const PLAY_INTERVAL = 1000

// CONTRACT
export const CONTRACT_TTL = 50000
export const GAS = 40000000

// AENS
export const AENS_TX_TTL = 50000
export const NAME_TTL = 500

// ACCOUNT
export const ACCOUNT_TX_TTL = 50000

