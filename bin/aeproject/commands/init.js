import { printError, print } from './../../utils/print'

async function run (options) {
  const { scaffold } = options
  
  try {
      print(`${scaffold}`)
      
  } catch (e) {
    printError(e.message)
  }
}

export const Initializer = {
  run
}