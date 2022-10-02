#!/usr/bin/env node
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid-singleton';
// eslint-disable-next-line import/extensions
import run from './main.mjs';

const transport = await TransportNodeHid.default.create();
await run(transport);
