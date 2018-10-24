require = require('esm')(module /*, options */ ) // use to handle es6 import/export

import {
  printError,
  print
} from '../../../utils/print'
const utils = require('../../utils.js');
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
const contractTemplateFile = 'Identity.aes';
const contractFileDestination = `${contractsDir}/Identity.aes`;
const artifactsDirectory = `${__dirname}/artifacts/`;

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
  const fileSource = `${artifactsDirectory}/package.json`;
  utils.copyFileOrDir(fileSource, "./package.json")
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
  const fileSource = `${artifactsDirectory}/${contractTemplateFile}`;
  utils.createIfExistsFolder(contractsDir);
  utils.copyFileOrDir(fileSource, contractFileDestination)
}

const setupTests = () => {
  print(`===== Creating tests directory =====`);
  const fileSource = `${artifactsDirectory}/${testTemplateFile}`;
  utils.createIfExistsFolder(testDir, "Creating tests file structure");
  utils.copyFileOrDir(fileSource, testFileDestination)
}

const setupDeploy = () => {
  print(`===== Creating deploy directory =====`);
  const fileSource = `${artifactsDirectory}/${deployTemplateFile}`;
  utils.createIfExistsFolder(deployDir, "Creating deploy directory file structure");
  utils.copyFileOrDir(fileSource, deployFileDestination)
}

const setupDocker = () => {
  print(`===== Creating docker directory =====`);
  const fileSourceDir = `${artifactsDirectory}/${dockerTemplateDir}`;
  const copyOptions = {
    overwrite: true
  }

  const fileSourceYml = `${artifactsDirectory}/${dockerYmlFile}`;
  utils.copyFileOrDir(fileSourceYml, dockerYmlFileDestination, copyOptions)
  utils.copyFileOrDir(fileSourceDir, dockerFilesDestination, copyOptions)
}

module.exports = {
  run
}
