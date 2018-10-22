const program = require('commander')

require = require('esm')(module/*, options*/) //use to handle es6 import/export
const utils = require('./../utils/index')
const { Initializer } = require('./commands')

program
  .option('-s, --scaffold', 'Scaffolding of contract and test.js')

program
  .command('init')
  .description('Init ae project')
  .action(async (...arguments) => await Initializer.run(utils.cli.getCmdFromArguments(arguments)))  