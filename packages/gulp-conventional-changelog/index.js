'use strict'

const addStream = require('add-stream')
const concat = require('concat-stream')
const conventionalChangelog = require('conventional-changelog')
const PluginError = require('plugin-error')
const fancyLog = require('fancy-log')
const through = require('through2')

module.exports = function (opts, context, gitRawCommitsOpts, parserOpts, writerOpts) {
  opts = Object.assign({
    // TODO: remove this when gulp get's a real logger with levels
    verbose: process.argv.indexOf('--verbose') !== -1
  }, opts)

  if (opts.verbose) {
    opts.debug = fancyLog
  }

  return through.obj(function (file, enc, cb) {
    if (file.isNull()) {
      cb(null, file)
      return
    }

    const stream = conventionalChangelog(opts, context, gitRawCommitsOpts, parserOpts, writerOpts)
      .on('error', function (err) {
        cb(new PluginError('gulp-conventional-changelog', err))
      })

    if (file.isStream()) {
      if (opts.releaseCount === 0) {
        file.contents = stream
      } else if (opts.append) {
        file.contents = file.contents
          .pipe(addStream(stream))
      } else {
        file.contents = stream
          .pipe(addStream(file.contents))
      }

      cb(null, file)
      return
    }

    stream
      .pipe(concat({
        encoding: 'buffer'
      }, function (data) {
        if (opts.releaseCount === 0) {
          file.contents = data
        } else if (opts.append) {
          file.contents = Buffer.concat([file.contents, data])
        } else {
          file.contents = Buffer.concat([data, file.contents])
        }

        cb(null, file)
      }))
  })
}
