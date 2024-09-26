console.log('Emitter running');

async function fetchNode(port, path) {
  const response = await fetch(`http://node:${port}/${path}`);
  if (response.status !== 200) throw new Error(`Unexpected response status: ${response.status}`);
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

let createKeyBlocks = 0;

async function emitMicroBlock() {
  const { transactions } = await fetchNode(3113, 'v3/debug/transactions/pending');
  if (transactions.length === 0) return;
  await fetchNode(3313, 'emit_mb');
  createKeyBlocks = 5;
}

async function emitKeyBlock() {
  if (createKeyBlocks === 0) return;
  await fetchNode(3313, 'emit_kb');
  createKeyBlocks -= 1;
}

function runInInterval(cb, delay) {
  let timeout;
  const handler = async () => {
    await cb();
    timeout = setTimeout(handler, delay);
  };
  handler();
  return () => clearTimeout(timeout);
}

const cancelMicroBlock = runInInterval(emitMicroBlock, 300);
const cancelKeyBlock = runInInterval(emitKeyBlock, 1000);

['SIGINT', 'SIGTERM'].forEach((event) =>
  process.on(event, () => {
    cancelMicroBlock();
    cancelKeyBlock();
  }),
);
