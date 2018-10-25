#!/usr/bin/env node

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
'use strict'

require = require('esm')(module /*, options */ ) // use to handle es6 import/export

const program = require('commander')
const commands = require('./commands')

const setupVersion = () => {
  program.version("0.0.1")
}

const setupDefaultHandler = () => {
  program.on('command:*', () => {
    program.help();
  })
}

const setupCommands = () => {
  commands.initCommands(program);
}

const parseParams = () => {
  program.parse(process.argv)
}

const presentHelpIfNeeded = () => {
  if (!program.args.length) program.help();
}

const run = () => {
  setupVersion();
  setupDefaultHandler();
  setupCommands();
  parseParams();
  presentHelpIfNeeded();
}

run();
