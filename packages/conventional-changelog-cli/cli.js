#!/usr/bin/env node
'use strict'

const addStream = require('add-stream')
const conventionalChangelog = require('conventional-changelog')
const fs = require('fs')
const meow = require('meow')
const tempfile = require('tempfile')
const _ = require('lodash')
const resolve = require('path').resolve

const cli = meow(`
    Usage
      conventional-changelog

    Example
      conventional-changelog -i CHANGELOG.md --same-file

    Options
      -i, --infile              Read the CHANGELOG from this file

      -o, --outfile             Write the CHANGELOG to this file
                                If unspecified, it prints to stdout

      -s, --same-file           Outputting to the infile so you don't need to specify the same file as outfile

      -p, --preset              Name of the preset you want to use. Must be one of the following:
                                angular, atom, codemirror, ember, eslint, express, jquery, jscs or jshint

      -k, --pkg                 A filepath of where your package.json is located
                                Default is the closest package.json from cwd

      -a, --append              Should the newer release be appended to the older release
                                Default: false

      -r, --release-count       How many releases to be generated from the latest
                                If 0, the whole changelog will be regenerated and the outfile will be overwritten
                                Default: 1

      --skip-unstable           If given, unstable tags will be skipped, e.g., x.x.x-alpha.1, x.x.x-rc.2

      -u, --output-unreleased   Output unreleased changelog

      -v, --verbose             Verbose output. Use this for debugging
                                Default: false

      -n, --config              A filepath of your config script
                                Example of a config script: https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/conventional-changelog-cli/test/fixtures/config.js

      -c, --context             A filepath of a json that is used to define template variables
      -l, --lerna-package       Generate a changelog for a specific lerna package (:pkg-name@1.0.0)
      -t, --tag-prefix          Tag prefix to consider when reading the tags
      --tag-from                Tag to start reading from when reading the tags
      --commit-path             Generate a changelog scoped to a specific directory
`, {
  booleanDefault: undefined,
  flags: {
    infile: {
      alias: 'i',
      type: 'string'
    },
    outfile: {
      alias: 'o',
      type: 'string'
    },
    'same-file': {
      alias: 's',
      type: 'boolean'
    },
    preset: {
      alias: 'p',
      type: 'string'
    },
    pkg: {
      alias: 'k',
      type: 'string'
    },
    append: {
      alias: 'a',
      type: 'boolean'
    },
    'release-count': {
      alias: 'r',
      type: 'number'
    },
    'skip-unstable': {
      type: 'boolean'
    },
    'output-unreleased': {
      alias: 'u',
      type: 'boolean'
    },
    verbose: {
      alias: 'v',
      type: 'boolean'
    },
    config: {
      alias: 'n',
      type: 'string'
    },
    context: {
      alias: 'c',
      type: 'string'
    },
    'lerna-package': {
      alias: 'l',
      type: 'string'
    },
    'tag-prefix': {
      alias: 't',
      type: 'string'
    }
  }
})

let config
const flags = cli.flags
const infile = flags.infile
let outfile = flags.outfile
let sameFile = flags.sameFile
const append = flags.append
const releaseCount = flags.releaseCount
const skipUnstable = flags.skipUnstable

if (infile && infile === outfile) {
  sameFile = true
} else if (sameFile) {
  if (infile) {
    outfile = infile
  } else {
    console.error('infile must be provided if same-file flag presents.')
    process.exit(1)
  }
}

let options = _.omitBy({
  preset: flags.preset,
  pkg: {
    path: flags.pkg
  },
  append: append,
  releaseCount: releaseCount,
  skipUnstable: skipUnstable,
  outputUnreleased: flags.outputUnreleased,
  lernaPackage: flags.lernaPackage,
  tagPrefix: flags.tagPrefix
}, _.isUndefined)

if (flags.verbose) {
  options.debug = console.info.bind(console)
  options.warn = console.warn.bind(console)
}

let templateContext

let outStream

try {
  if (flags.context) {
    templateContext = require(resolve(process.cwd(), flags.context))
  }

  if (flags.config) {
    config = require(resolve(process.cwd(), flags.config))
    options.config = config
    options = _.merge(options, config.options)
  } else {
    config = {}
  }
} catch (err) {
  console.error('Failed to get file. ' + err)
  process.exit(1)
}

const gitRawCommitsOpts = _.merge({
  from: flags.tagFrom
}, config.gitRawCommitsOpts || {})
if (flags.commitPath) gitRawCommitsOpts.path = flags.commitPath

const changelogStream = conventionalChangelog(options, templateContext, gitRawCommitsOpts, config.parserOpts, config.writerOpts)
  .on('error', function (err) {
    if (flags.verbose) {
      console.error(err.stack)
    } else {
      console.error(err.toString())
    }
    process.exit(1)
  })

function noInputFile () {
  if (outfile) {
    outStream = fs.createWriteStream(outfile)
  } else {
    outStream = process.stdout
  }

  changelogStream
    .pipe(outStream)
}

if (infile && releaseCount !== 0) {
  const readStream = fs.createReadStream(infile)
    .on('error', function () {
      if (flags.verbose) {
        console.warn('infile does not exist.')
      }

      if (sameFile) {
        noInputFile()
      }
    })

  if (sameFile) {
    if (options.append) {
      changelogStream
        .pipe(fs.createWriteStream(outfile, {
          flags: 'a'
        }))
    } else {
      const tmp = tempfile()

      changelogStream
        .pipe(addStream(readStream))
        .pipe(fs.createWriteStream(tmp))
        .on('finish', function () {
          fs.createReadStream(tmp)
            .pipe(fs.createWriteStream(outfile))
        })
    }
  } else {
    if (outfile) {
      outStream = fs.createWriteStream(outfile)
    } else {
      outStream = process.stdout
    }

    let stream

    if (options.append) {
      stream = readStream
        .pipe(addStream(changelogStream))
    } else {
      stream = changelogStream
        .pipe(addStream(readStream))
    }

    stream
      .pipe(outStream)
  }
} else {
  noInputFile()
}
