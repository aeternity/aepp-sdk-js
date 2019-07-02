/* eslint-disable no-undef */
export const getBrowserAPI = () => {
  if (chrome && chrome.runtime) return chrome
  if (browser && browser.runtime) return browser
  throw new Error('Browser is not detected')
}
