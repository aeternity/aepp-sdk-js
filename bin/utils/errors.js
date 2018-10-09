/*
* ISC License (ISC)
* Copyright (c) 2018 aeternity developers
*
*  Permission to use, copy, modify, and/or distribute this software for any
                                                                        *  purpose with or without fee is hereby granted, provided that the above
*  copyright notice and this permission notice appear in all copies.
*
*  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
*  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
*  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
*  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
*  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
*  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
*  PERFORMANCE OF THIS SOFTWARE.
*/

// #ERROR HANDLERS
import { printError, print } from './print'
import { isExecCommand } from './cli'

// `API` errors logger
export function logApiError (error) { printError(`API ERROR: ${error}`) }

// `API` errors handler
export async function handleApiError (fn) {
  try {
    return await fn()
  } catch (e) {
    // console.log(e)
    const response = e.response
    logApiError(response && response.data ? response.data.reason : e)
    process.exit(1)
  }
}

// `COMMANDER` unknown commands handler
export function unknownCommandHandler (program) {
  return (execCommands = []) => {
    const cmd = program.args[0]

    if (isExecCommand(cmd, execCommands)) return

    print('Invalid command: %s\nSee --help for a list of available commands.', cmd)
    program.help()
  }
}
