#!/usr/bin/env node
/* eslint-disable import/extensions */
import { Node, CompilerHttp } from '../../es/index.mjs';
import { pause } from '../../es/utils/other.mjs';
/* eslint-enable import/extensions */

const invalidUrl = 'https://404.aeternity.io';
const compiler = new CompilerHttp(invalidUrl);
const node = new Node(invalidUrl);

await pause(2000);

const message1 = await compiler.version().catch((error) => error.message);
const message2 = await node.getStatus().catch((error) => error.message);
if (message1 !== message2 || message2 !== 'getaddrinfo ENOTFOUND 404.aeternity.io') {
  throw new Error('Invalid exception');
}

console.log('Failure of version check doesn\'t emit unhandled exception');
