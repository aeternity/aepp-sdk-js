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
require = require('esm')(module /*, options */) // use to handle es6 import/export

import {
  printError,
  print
} from '../../../utils/print'
const utils = require('../../utils.js');
const { spawn } = require('promisify-child-process');
const dockerCLI = require('docker-cli-js');
const docker = new dockerCLI.Docker();

async function dockerPs(){
  let running = false

  await docker.command('ps', function (err, data) {
    data.containerList.forEach(function (container) {
      if (container.image.startsWith("aeternity") && container.status.indexOf("healthy") != -1) {
        running = true;
      }
    })
  });

  return running;
}

async function run(option) {
  
  try {
    var sdkInstallProcess;
    let running = await dockerPs();

    if (option.stop) {
      if(running){
        print('===== Stopping epoch =====');
      
        sdkInstallProcess = await spawn('docker-compose', ['down', '-v'], {});
  
        print('===== Epoch was successfully stopped! =====');
      } else {
        print('===== Epoch is not running! =====');
      }
    } else {
      if(!running){
        print('===== Starting epoch =====');

        sdkInstallProcess = spawn('docker-compose', ['up', '-d'], {});
        
        while(!(await dockerPs())){
          process.stdout.write(".");
          utils.sleep(1000);
        }
  
        print('\n\r===== Epoch was successfully started! =====');
      } else {
        print('===== Epoch already started and healthy started! =====');
      }
    }
  } catch (e) {
    printError(e.message)
    console.error(e);
  }
}

module.exports = {
  run
}
