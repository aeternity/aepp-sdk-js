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
  print,
  createIfExistsFolder,
  copyFileOrDir,
} from '../../utils.js'
const {
  spawn
} = require('promisify-child-process');

const testDir = './test';
const testTemplateFile = 'exampleTests.js';
const testFileDestination = `${testDir}/example.js`;

const deployDir = './deploy';
const deployTemplateFile = 'deployTemplate.js';
const deployFileDestination = `${deployDir}/deploy.js`;

const contractsDir = './contracts';
const contractTemplateFile = 'ExampleContract.aes';
const contractFileDestination = `${contractsDir}/ExampleContract.aes`;
const artifactsDir = `${__dirname}/artifacts`;

const dockerDir = './docker';
const dockerTemplateDir = 'docker';
const dockerFilesDestination = `${dockerDir}`;

const dockerYmlFile = 'docker-compose.yml'
const dockerYmlFileDestination = './docker-compose.yml'

async function run() {
  try {
    print('===== Initializing aeproject =====');

    await installLibraries()

    print(`===== Creating project file & dir structure =====`);

    setupContracts();
    setupTests();
    setupDeploy();
    setupDocker();

    print('===== Aeproject was successfully initialized! =====');

  } catch (e) {
    printError(e.message)
    console.error(e);
  }
}

const installLibraries = async () => {
  const fileSource = `${artifactsDir}/package.json`;
  copyFileOrDir(fileSource, "./package.json")
  await installAeppSDK();
}

const installAeppSDK = async () => {
  print('===== Installing aepp-sdk =====');

  const sdkInstallProcess = spawn('npm', ['install', '@aeternity/aepp-sdk'], {});

  sdkInstallProcess.stdout.on('data', (data) => {
    print(`${data}`);
  });
  
  sdkInstallProcess.stderr.on('data', (data) => {
    print(`WARN: ${data}`);
  });

  await sdkInstallProcess;
}

const setupContracts = () => {
  print(`===== Creating contracts directory =====`);
  const fileSource = `${artifactsDir}/${contractTemplateFile}`;
  createIfExistsFolder(contractsDir);
  copyFileOrDir(fileSource, contractFileDestination)
}

const setupTests = () => {
  print(`===== Creating tests directory =====`);
  const fileSource = `${artifactsDir}/${testTemplateFile}`;
  createIfExistsFolder(testDir, "Creating tests file structure");
  copyFileOrDir(fileSource, testFileDestination)
}

const setupDeploy = () => {
  print(`===== Creating deploy directory =====`);
  const fileSource = `${artifactsDir}/${deployTemplateFile}`;
  createIfExistsFolder(deployDir, "Creating deploy directory file structure");
  copyFileOrDir(fileSource, deployFileDestination)
}

const setupDocker = () => {
  print(`===== Creating docker directory =====`);
  const dockerFilesSource = `${artifactsDir}/${dockerTemplateDir}`;
  const copyOptions = {
    overwrite: true
  }

  const dockerYmlFileSource = `${artifactsDir}/${dockerYmlFile}`;
  copyFileOrDir(dockerYmlFileSource, dockerYmlFileDestination, copyOptions)
  copyFileOrDir(dockerFilesSource, dockerFilesDestination, copyOptions)
}

module.exports = {
  run
}
