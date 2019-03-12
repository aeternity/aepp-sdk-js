export const IDENTITY_METHODS = {
  broadcast: 'ae:broadcast',
  walletDetail: 'ae:walletDetail',
  registerRequest: 'ae:registerProvider'
}

export const SDK_METHODS = {
  sign: 'ae:sign',
  ready: 'ae:sdkReady',
  registerProvider: 'ae:registrationComplete',
  deregisterProvider: 'ae:deregister'
}

export const decryptMsg = ({ params }) => {
  // @TODO Implement encryption
  return params
}

export function encryptMsg ({ params }) {
  // @TODO Implement encryption
  return params
}
