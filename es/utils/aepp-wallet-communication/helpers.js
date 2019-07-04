/* eslint-disable no-undef */
import { METHODS } from './schema'

export const getBrowserAPI = () => {
  if (chrome && chrome.runtime) return chrome
  if (browser && browser.runtime) return browser
  throw new Error('Browser is not detected')
}

export const getWindow = () => {
  if (!window) throw new Error('Browser is not detected')
  return window
}

export const message = (method, params) => ({ method, params })

export const responseMessage = (id, method, { error, result } = {}) => ({ id, method, ...(error ? { error } : { result }) })

export const sendWalletInfo = (postFn, walletInfo) => postFn(message(METHODS.wallet.readyToConnect, walletInfo))
