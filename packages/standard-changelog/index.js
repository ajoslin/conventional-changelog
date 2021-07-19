'use strict'

const conventionalChangelogCore = require('conventional-changelog-core')
const angular = require('conventional-changelog-angular')
const fs = require('fs')
const chalk = require('chalk')
const figures = require('figures')
const sprintf = require('sprintf-js').sprintf

function conventionalChangelog (options, context, gitRawCommitsOpts, parserOpts, writerOpts) {
  options = options || {}
  options.config = angular
  return conventionalChangelogCore(options, context, gitRawCommitsOpts, parserOpts, writerOpts)
}

conventionalChangelog.createIfMissing = function (infile) {
  try {
    fs.accessSync(infile, fs.F_OK)
  } catch (err) {
    if (err.code === 'ENOENT') {
      conventionalChangelog.checkpoint('created %s', [infile])
      fs.writeFileSync(infile, '\n', 'utf-8')
    }
  }
}

conventionalChangelog.checkpoint = function (msg, args) {
  console.info(chalk.green(figures.tick) + ' ' + sprintf(msg, args.map(function (arg) {
    return chalk.bold(arg)
  })))
}

module.exports = conventionalChangelog
