const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
const assert = chai.assert;
const execute = require('./../utils.js').execute;
const cleanUp = require("./utils").cleanUp
const expectedCompileResult = "cb_8TfnaSmi7HKCLz4oeoMuyPzGoWbCWMGHKcokE815juzWq8L15xENS435GHB1sYMLkBMee5n9xVUKokfsDqqhdhekX6dFn2Xi7uQ9wGaQ5F92osUnPbfJhKpsjEKSdc44CucTJciKAGUBoZDqtPma6GbtnyC2y1scMJHV3rjvtz3qjCeSiryd8LiKZpdkhKa6V6x51rv9b57CLFLSTiLJQFPAfSwJmTgavoJJJRBmcfVYMDqfwA7gQwiQSM3481YbpZMXqQQCvaufVGDDNT9khvn8wTR1ynsmceNh1vY4H8isUQ6njou4X1mhPHoaMWiw61kHWGkanasbv7NpYrT2P6FZFqbRfm5jPzocrspSaWacXPfDp8XXv9LGoQ4wsZPWjdu26e5kHohnuCRxWb9csGjpfVB3ZXUG65XEiEDYXzvkFW4Z8DVx9S3zpU57fuWRpdphbrt4LxfzWqmLSNUpcSwjpZX8Q4jiNj6N6bU23FddzsLgHapAss3i4KYD184XXAze4KUSqyT1818UfEJB8M7LeYzcZetoFvfVN8aPHdSsLiuEUJu1zXyzTmSEGrP5d1p26AV7b"

let expectedResult1 = "SampleContract.1.aes has been successfully compiled"
let expectedResult2 = "SampleContract.2.aes has been successfully compiled"
let expectedResult3 = "SampleContract.3.aes has been successfully compiled"
let executeOptions = { cwd : process.cwd() + "/bin/aeproject/test"};
chai.use(chaiAsPromised);

describe('Aeproject', () => {
	before(async () => {
		await cleanUp()
		await execute("init", [], executeOptions)
		await execute("epoch", ['--start', `--dir=${executeOptions.cwd}`])
	})

	describe('Compile', () => {
		it('Should compile contract successfully with specif contract path', async () => {
			let result = await execute("compile", ["--path", "./contracts/SampleContract.aes"])
		
			assert.include(result, expectedCompileResult)
		})

		it('Should compile contract successfully without path', async () => {
			let result = await execute("compile", [], executeOptions)

			assert.include(result, expectedCompileResult)
		})

		it('Should compile multiple contracts successfully with path', async () => {
			let result = await execute("compile", ["--path", "./multipleContractsFolder"], executeOptions)

			assert.include(result, expectedResult1)
			assert.include(result, expectedResult2)
			assert.include(result, expectedResult3)
		})
	})
	
	after(async () => {
		await execute("epoch", ['--stop', `--dir=${executeOptions.cwd}`])
		await cleanUp()
	})
})