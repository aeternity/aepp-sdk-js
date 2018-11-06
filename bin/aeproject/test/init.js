const chai = require('chai');
const chaiFiles = require('chai-files');
const fs = require('fs-extra')
const assert = chai.assert;
const execute = require('./../utils.js').execute;

let executeOptions = { cwd : process.cwd() + "/bin/aeproject/test/"};
let expect = chai.expect;
let file = chaiFiles.file;
let dir = chaiFiles.dir;

let filesAndfoldersToRemove = [
	'node_modules',
	'deploy',
	'docker',
	'test',
	'contracts/Identity.aes',
	'package.json',
	'package-lock.json',
	'docker-compose.yml'
]
chai.use(chaiFiles);


describe('Aeproject Epoch', () => {
	after(async () => {
		filesAndfoldersToRemove.forEach((e) => {
			try{
				fs.removeSync(executeOptions.cwd + e); 
			} catch(e){

			}
		})
	})


	it('Should init project successfully', async () => {
		let result = await execute("init", [], executeOptions)

		expect(file('./package.json')).to.exist;
		expect(file('./package-lock.json')).to.exist;
		expect(file('./docker-compose.yml')).to.exist;
		expect(file(executeOptions.cwd + '/test/example.js')).to.exist;
		expect(file(executeOptions.cwd + '/deploy/deploy.js')).to.exist;
		expect(file(executeOptions.cwd + '/contracts/Identity.aes')).to.exist;
		expect(dir('node_modules')).to.not.be.empty;
		expect(file(executeOptions.cwd + 'docker/entrypoint.sh')).to.exist;
		expect(file(executeOptions.cwd + 'docker/epoch_node1_mean16.yaml')).to.exist;
		expect(file(executeOptions.cwd + 'docker/epoch_node2_mean16.yaml')).to.exist;
		expect(file(executeOptions.cwd + 'docker/epoch_node3_mean16.yaml')).to.exist;
		expect(file(executeOptions.cwd + 'docker/healthcheck.sh')).to.exist;
		expect(file(executeOptions.cwd + 'docker/nginx-cors.conf')).to.exist;
		expect(file(executeOptions.cwd + 'docker/nginx-default.conf')).to.exist;
		expect(file(executeOptions.cwd + 'docker/nginx-ws.conf')).to.exist;
		expect(dir('docker/keys')).to.not.be.empty;
	})
})