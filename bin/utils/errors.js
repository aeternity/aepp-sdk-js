// ERROR HANDLERS
import { printError, print } from './print'
import { isExecCommand } from './cli'

export function logApiError (error) { printError(`API ERROR: ${error}`) }

export async function handleApiError (fn) {
  try {
    return await fn()
  } catch (e) {
    console.log(e)
    const response = e.response
    logApiError(response && response.data ? response.data.reason : e)
    process.exit(1)
  }
}

export function unknownCommandHandler (program) {
  return (execCommands = []) => {
    const cmd = program.args[0]

    if (isExecCommand(cmd, execCommands)) return

    print('Invalid command: %s\nSee --help for a list of available commands.', cmd)
    program.help()
  }
}
