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

const jsdoc2md = require('jsdoc-to-markdown')
const fs = require('fs')
const path = require('path')
const R = require('ramda')

const config = require(`${__dirname}/.jsdoc2md.json`)

const outputDir = `${__dirname}/docs`
const prefix = /^@aeternity\/aepp-sdk\/es\//
const templateData = jsdoc2md.getTemplateDataSync(config)

function createDirs (path) {
  const paths = path.split(/\//).slice(1, -1)
    .reduce((acc, e) => acc.concat([`${R.last(acc)}/${e}`]), ['']).slice(1)

  R.forEach(dir => {
    try {
      fs.openSync(dir, 'r')
    } catch (e) {
      fs.mkdirSync(dir)
    }
  }, paths)
}

const modules = templateData
  .filter(R.propEq('kind', 'module'))
  .map(({ name }) => {
    return { name, out: `api/${name.replace(prefix, '')}` }
  })

R.forEachObjIndexed(({ name, out }) => {
  const template = `{{#module name="${name}"}}{{>docs}}{{/module}}`
  console.log(`rendering ${name}`)
  const dest = path.resolve(outputDir, `${out}.md`)
  const output = jsdoc2md.renderSync({
    data: templateData,
    template,
    partial: [
      'tooling/docs/header.hbs',
      'tooling/docs/link.hbs',
      'tooling/docs/customTags.hbs'
    ]
  })
  createDirs(dest)
  fs.writeFileSync(dest, output)
}, modules)

const output = jsdoc2md.renderSync({
  data: modules,
  template: '{{>toc}}',
  partial: ['tooling/docs/toc.hbs']
})

fs.writeFileSync(path.resolve(outputDir, 'api.md'), output)
