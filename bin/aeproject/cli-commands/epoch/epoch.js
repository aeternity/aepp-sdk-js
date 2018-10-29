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
require = require('esm')(module /*, options */ ) // use to handle es6 import/export

import {
  printError,
  print
} from '../../../utils/print'
const utils = require('../../utils.js');
const {
  spawn
} = require('promisify-child-process');

async function run(option) {
    console.log(option)
  try {
    print('===== Starting epoch =====');

    // const sdkInstallProcess = spawn('npm', ['install', '@aeternity/aepp-sdk'], {});

    // sdkInstallProcess.stdout.on('data', (data) => {
    //     print(`${data}`);
    // });

    // sdkInstallProcess.stderr.on('data', (data) => {
    //     print(`WARN: ${data}`);
    // });

    print('===== Epoch was successfully started! =====');

  } catch (e) {
    printError(e.message)
    console.error(e);
  }
}

module.exports = {
  run
}
