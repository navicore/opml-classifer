#!/usr/bin/env node

const program = require('commander')
const extract = require('./extract')
//const catagorize = require('./catagorize').process

program
  .version('1.0.0')
  .option('-c, --catagorize', 'catagorize opml input')
  .option('-f, --file [filepath]', 'process opml file')
  .option('-r, --readkey [readkey]', 'uclassify readkey')
  .parse(process.argv)

if (program.catagorize) {
  extract.handle(program.file, program.readkey)
}

