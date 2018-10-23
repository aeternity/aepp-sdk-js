require = require('esm')(module/*, options */) // use to handle es6 import/export

import { printError, print } from '../../../utils/print'
const utils = require('../../utils.js');
const { spawn } = require('promisify-child-process');

const testDir = './test';
const testFileDestination = `${testDir}/exampleTest.js`;

const contractsDir = './contracts';
const contractFileDestination = `${contractsDir}/LimeFactory.aes`;
const libraryDirectory = __dirname;

async function run() {
  try {
    print('===== Initializing aeproject =====');

    await installLibraries()

    print(`===== Creating project file & dir structure =====`);

    setupContracts();
    setupTests();
    //TODO create & copy deployment files

    print('===== Aeproject was successfully initialized! =====');

  } catch (e) {
    printError(e.message)
    console.error(e);
  }
}

const installLibraries = async () => {
  utils.copyFile("package.json", "./package.json", libraryDirectory)
  await installAeppSDK();
}

const installAeppSDK = async () => {
  print('===== Installing aepp-sdk =====');

  const sdkInstallProcess = spawn('npm', ['install', '@aeternity/aepp-sdk'], {});

  sdkInstallProcess.stdout.on('data', (data) => {
    console.log(`${data}`);
  });

  sdkInstallProcess.stderr.on('data', (data) => {
    console.log(`WARN: ${data}`);
  });

  await sdkInstallProcess;
}

const setupContracts = () => {
  print(`===== Creating contracts directory =====`);
  utils.createIfExistsFolder(contractsDir);
  utils.copyFile("Identity.aes", contractFileDestination, libraryDirectory)
}

const setupTests = () => {
  print(`===== Creating tests directory =====`);
  utils.createIfExistsFolder(testDir, "Creating tests file structure");
  // util.copyFile("example.js", testFileDestination, libraryDirectory)
}

module.exports = {
  run
}