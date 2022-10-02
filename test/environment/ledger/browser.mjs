import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
// eslint-disable-next-line import/extensions
import run from './main.mjs';

const transport = await TransportWebUSB.create();
document.write(`
  Open developer console
  <button id="run">Run</button>
`);
document.getElementById('run').addEventListener('click', run.bind(null, transport));
