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
import * as R from 'ramda'

import Cli from '../../es/ae/cli'

export function getCmdFromArguments (args) {
  return R.merge(
    R.head(args),
    R.head(args).parent
  )
}

export async function initClient ({ host: url, keypair, internalUrl, force: forceCompatibility }) {
  return await Cli({ url, process, keypair, internalUrl, forceCompatibility })
}

export function initExecCommands (program) {
  return (cmds) => cmds.forEach(({ name, desc }) => program.command(name, desc))
}

export function isExecCommand (cmd, commands) {
  return commands.find(({ name }) => cmd === name)
}
