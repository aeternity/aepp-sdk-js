#!/usr/bin/env node
// todo
//
// todo
/*
 * todo
 */
'use strict'

const program = require('commander')
require = require('esm')(module/*, options */) // use to handle es6 import/export

const utils = require('./../utils/index')
require('./aeproject-cli-init')

const EXECUTABLE_CMD = [
  { name: 'test', desc: 'Scaffold initial project.' }
]

utils
 .cli
 .initExecCommands(program)(EXECUTABLE_CMD)

program
  .version("0.0.1")

program.on('command:*', () => utils.errors.unknownCommandHandler(program)(EXECUTABLE_CMD))
program.parse(process.argv)