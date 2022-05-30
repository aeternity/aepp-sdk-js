import { EncodedData } from '../../encoder'
import { METHODS, WALLET_TYPE } from '../schema'

export interface WalletInfo {
  id: string
  name: string
  networkId: string
  origin: string
  type: WALLET_TYPE
}

export interface Accounts {
  connected: { [pub: EncodedData<'ak'>]: {} }
  current: { [pub: EncodedData<'ak'>]: {} }
}

export interface Node {
  name: string
  url: string
}

export interface Network {
  networkId: string
  node?: Node
}

type Icons = Array<{ src: string, sizes?: string, type?: string, purpose?: string }>

export interface WalletApi {
  [METHODS.connect]: (
    p: { name: string, icons?: Icons, version: 1, connectNode: boolean }
  ) => WalletInfo & { node?: Node }

  [METHODS.closeConnection]: (p: any) => void

  [METHODS.subscribeAddress]: (
    p: { type: 'connected' | 'current', value: 'subscribe' | 'unsubscribe' }
  ) => { subscription: Array<'subscribe' | 'unsubscribe'>, address: Accounts }

  [METHODS.address]: () => Array<EncodedData<'ak'>>

  [METHODS.sign]: ((
    p: { tx: EncodedData<'tx'>, onAccount: EncodedData<'ak'>, returnSigned: false }
  ) => { transactionHash: EncodedData<'th'> }) & ((
    p: { tx: EncodedData<'tx'>, onAccount: EncodedData<'ak'>, returnSigned: true }
  ) => { signedTransaction: EncodedData<'tx'> })

  [METHODS.signMessage]: (
    p: { message: string, onAccount: EncodedData<'ak'> }
  ) => { signature: string }
}

export interface AeppApi {
  [METHODS.updateAddress]: (a: Accounts) => void
  [METHODS.updateNetwork]: (a: Network) => void
  [METHODS.readyToConnect]: (w: WalletInfo) => void
  [METHODS.closeConnection]: (p: any) => void
}
