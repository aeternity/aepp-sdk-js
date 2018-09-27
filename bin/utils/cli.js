import * as R from 'ramda'

import Cli from '../../es/ae/cli'

export function getCmdFromArguments (args) {
  return R.merge(
    R.last(args),
    R.last(args).parent
  )
}

export async function initClient (url, keypair, internalUrl) {
  return await Cli({ url, process, keypair, internalUrl })
}

export function initExecCommands (program) {
  return (cmds) => cmds.forEach(({ name, desc }) => program.command(name, desc))
}

export function isExecCommand (cmd, commands) {
  return commands.find(({ name }) => cmd === name)
}