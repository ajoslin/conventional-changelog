'use strict'

const dargs = require('dargs')
const execFile = require('child_process').execFile
const split = require('split2')
const stream = require('stream')
const template = require('lodash/template')
const through = require('through2')

const DELIMITER = '------------------------ >8 ------------------------'

function normalizeExecOpts (execOpts) {
  execOpts = execOpts || {}
  execOpts.cwd = execOpts.cwd || process.cwd()
  return execOpts
}

function normalizeGitOpts (gitOpts) {
  gitOpts = gitOpts || {}
  gitOpts.format = gitOpts.format || '%B'
  gitOpts.from = gitOpts.from || ''
  gitOpts.to = gitOpts.to || 'HEAD'
  return gitOpts
}

function getGitArgs (gitOpts) {
  const gitFormat = template('--format=<%= format %>%n' + DELIMITER)(gitOpts)
  const gitFromTo = [gitOpts.from, gitOpts.to].filter(Boolean).join('..')

  const gitArgs = ['log', gitFormat, gitFromTo]

  // allow commits to focus on a single directory
  // this is useful for monorepos.
  if (gitOpts.path) {
    gitArgs.push('--', gitOpts.path)
  }

  return gitArgs.concat(dargs(gitOpts, {
    excludes: ['debug', 'from', 'to', 'format', 'path']
  }))
}

function gitRawCommits (rawGitOpts, rawExecOpts) {
  const readable = new stream.Readable()
  readable._read = function () {}

  const gitOpts = normalizeGitOpts(rawGitOpts)
  const execOpts = normalizeExecOpts(rawExecOpts)
  const args = getGitArgs(gitOpts)

  if (gitOpts.debug) {
    gitOpts.debug('Your git-log command is:\ngit ' + args.join(' '))
  }

  const child = execFile('git', args, {
    cwd: execOpts.cwd,
    maxBuffer: Infinity
  }, function (err) {
    if (err != null) {
      readable.emit('error', err)
    }

    readable.emit('close')
  })

  child.stdout
    .pipe(split(DELIMITER + '\n'))
    .pipe(through(function (chunk, enc, cb) {
      readable.push(chunk)

      cb()
    }, function (cb) {
      setImmediate(function () {
        readable.push(null)

        cb()
      })
    }))

  return readable
}

module.exports = gitRawCommits
