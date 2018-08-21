import Cli from '../ae/cli'

export async function initClient(url) {
  return await Cli({ url, process });
}

export function printBlock(block) {
  console.log(`
Block hash____________________ ${block.hash}
Block height__________________ ${block.height}
State hash____________________ ${block.stateHash}
Miner_________________________ ${block.miner}
Time__________________________ ${new Date(block.time)}
Previous block hash___________ ${block.prevHash}
Transactions__________________ 0
  `);
}