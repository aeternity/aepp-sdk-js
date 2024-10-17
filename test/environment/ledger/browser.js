import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
// eslint-disable-next-line import/extensions
import run from './main.js';

document.body.innerHTML = `
  Open developer console
  <button id="run">Run</button>
`;
document.getElementById('run').addEventListener('click', async () => {
  const transport = await TransportWebUSB.create();
  await run(transport);
});
