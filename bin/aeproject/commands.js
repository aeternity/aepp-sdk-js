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
const compile = require('./cli-commands/compile/compile.js');
const init = require('./cli-commands/init/init.js');
const testConfig = require('./cli-commands/test/test.js');
const epoch = require('./cli-commands/epoch/epoch.js');
const utils = require('../utils/index')


const addInitOption = (program) => {
  program
    .command('init')
    .description('Initialize aepp project')
    .action(async () => {
      await init.run();
    })
}

const addCompileOption = (program) => {
  program
    .command('compile')
    .option('--path [compile path]', 'Path to contract files', './contracts')
    .description('Compile contracts')
    .action(async (option) => {
      await compile.run(option.path);
    })
    
const addTestOption = (program) => {
  program
    .command('test')
    .description('Running the tests')
    .option('--path [tests path]', 'Path to test files', './test')
    .action(async (options) => {
      await testConfig.run(options.path);
    })
}

const addEpochOption = (program) => {
  program
    .command('epoch')
    .description('Running the epoch. Without any argument epoch will be runned with --start argument')
    .option('--stop', 'Stop the epoch')
    .option('--start', 'Start the epoch')
    .action(async (options) => {
      await epoch.run(options);
    })
}


const initCommands = (program) => {
  addInitOption(program);
  addCompileOption(program);
  addTestOption(program);
  addEpochOption(program);
}

module.exports = {
  initCommands
}
