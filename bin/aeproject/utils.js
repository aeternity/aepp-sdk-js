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
 
const fs = require('fs-extra')
const dir = require('node-dir');
const cli = require('./../utils/cli');
const handleApiError = require('./../utils/errors').handleApiError;


const config = {
  host: "http://localhost:3001/",
	internalHost: "http://localhost:3001/internal/",
	keyPair: {
		secretKey: 'bb9f0b01c8c9553cfbaf7ef81a50f977b1326801ebf7294d1c2cbccdedf27476e9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca',
		publicKey: 'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU'
  },
  nonce: 1
}

const { spawn } = require('promisify-child-process');
const createIfExistsFolder = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

const copyFileOrDir = (sourceFileOrDir, destinationFileOrDir, copyOptions = {}) => {
  if (fs.existsSync(`${destinationFileOrDir}`)) {
    throw new Error(`${destinationFileOrDir} already exists.`);
  }

  fs.copySync(sourceFileOrDir, destinationFileOrDir, copyOptions)
}

const getFiles = async function (directory, regex) {
   return new Promise((resolve, reject) => {
    dir.files(directory, (error, files) => {
      if (error) {
        reject(new Error(error));
         return;
      }

      files = files.filter(function (file) {
        return file.match(regex) != null;
      });
      resolve(files);
    });
  });
}

const getClient = async function(){
  let client;

  await handleApiError(async () => {
    client = await cli.initClient(
    {
      url: config.host, 
      keypair: config.keyPair, 
      internalUrl: config.internalHost,
      force: true
    })
  })

  return client;
}

const sleep = (ms) => {
  var start = Date.now();
  while (true) {
    var clock = (Date.now() - start);
    if (clock >= ms) break;
  }
}


const execute = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    let result = ''

    const child = spawn('aeproject', [command, ...args], options)
    
    child.stdin.setEncoding('utf-8')
    child.stdout.on('data', (data) => {
      result += (data.toString())
    })

    child.stderr.on('data', (data) => {
      reject(data)
    })

    child.on('close', (code) => {
      resolve(result)
    })
  })
}

module.exports = {
  createIfExistsFolder,
  copyFileOrDir,
  getFiles,
  getClient,
  sleep,
  execute
}
