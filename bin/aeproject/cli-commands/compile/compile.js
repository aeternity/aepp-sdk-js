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
import { printError, print } from '../../../utils/print'
const utils = require('../../utils.js');
const readFile = require('../../../utils/helpers').readFile;
const { spawn } = require('promisify-child-process');

async function compileAndPrint(file){
    print('\r')
    
    try{
        let client = await utils.getClient();
        let code = readFile(file)
        let contract = await client.contractCompile(code.toString());

        print(`Contract '${file} has been succeffully compiled'`)
        print(`Contract bytecode: ${contract.bytecode}`)
    } catch(error){
        printError(`Contract '${file} has not been compiled'`)
        printError(`reason: ${error.response.data.reason}`)
    }

    print('\r')
}

async function run(path) {
    print('===== Compiling contracts =====');

    if (path.includes('.aes')) {
        compileAndPrint(path)
    } else {
        const files = await utils.getFiles(`${process.cwd()}/${path}/`, `.*\.(aes)`);

        files.forEach(async (file) => {
            compileAndPrint(file)
        });
    } 
}

module.exports = {
  run
}