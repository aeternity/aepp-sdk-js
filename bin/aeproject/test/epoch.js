const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;
const execute = require('./../utils.js').execute;
let executeOptions = { cwd : process.cwd() + "/bin/aeproject/test/"};


xdescribe('Aeproject Epoch', () => {
	it('Should start epoch successfully', async () => {
		let result = await execute("epoch", [], executeOptions)

	})
})