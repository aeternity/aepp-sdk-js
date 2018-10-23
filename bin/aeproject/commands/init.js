import { printError, print } from './../../utils/print'
require = require('esm')(module/*, options */) // use to handle es6 import/export
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs')

const testDir = './test';
const testFileDestination = `${testDir}/exampleTest.js`;

const contractsDir = './contracts';
const contractFileDestination = `${contractsDir}/LimeFactory.aes`;

async function run (options) {
  const { scaffold } = options
  const libraryDirectory = __dirname;
  
  try{
    print('===== Initializing aeproject =====');
    copyFile("package.json", "./package.json", libraryDirectory)
    
		const { stdout, stderr } = await exec('npm install @aeternity/aepp-sdk');
    print(stdout);

		createFolder(contractsDir, "Creating contracts file structure");
    copyFile("LimeFactory.aes", contractFileDestination, libraryDirectory)
    
    createFolder(testDir, "Creating tests file structure");
    copyFile("example.js", testFileDestination, libraryDirectory)
    
    //TODO create & copy deployment files
    
		print('Aeproject was successfully initialized!');
      
  } catch (e) {
    printError(e.message)
  }
}

export const Initializer = {
  run
}

const createFolder = (dir, message) => {
  print(`===== ${message} =====`);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
}

const copyFile = (file, dir, libraryDirectory) => {
  if (fs.existsSync(testFileDestination)) {
		throw new Error(`${file} already exists in ${dir} directory. You've probably already initialized aeproject for this project.`);
	}

	const fileSource = `${libraryDirectory}/${file}`;

	fs.copyFileSync(fileSource, dir);
}