/**
 * Browser helper functions
 */
import { NoBrowserFoundError } from '../errors'

export const getBrowserAPI = (force = false) => {
  const { chrome, browser } = window
  // Chrome, Opera support
  if (typeof chrome !== 'undefined' && chrome === Object(chrome)) return chrome
  // Firefox support
  if (typeof browser !== 'undefined' && browser === Object(browser)) return browser
  if (!force) throw new NoBrowserFoundError()
  return {}
}
