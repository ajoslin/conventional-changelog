'use strict'
const conventionalChangelogCore = require('conventional-changelog-core')
const config = require('../')
const expect = require('chai').expect
const gitDummyCommit = require('git-dummy-commit')
const shell = require('shelljs')
const through = require('through2')

describe('atom preset', function () {
  before(function () {
    shell.config.resetForTesting()
    shell.cd(__dirname)
    shell.rm('-rf', 'tmp')
    shell.mkdir('tmp')
    shell.cd('tmp')
    shell.mkdir('git-templates')
    shell.exec('git init --template=./git-templates')
    gitDummyCommit([':arrow_down: exception-reporting'])
    if (process.platform !== 'win32') {
      // we need to escape backtick for bash but not for windows
      // probably this should be done in git-dummy-commit or shelljs
      gitDummyCommit([':bug: \\`updateContentDimensions\\` when model changes'])
    } else {
      gitDummyCommit([':bug: `updateContentDimensions` when model changes'])
    }
    gitDummyCommit(['Merge pull request #7881 from atom/bf-upgrade-babel-to-5.6.17'])
    gitDummyCommit([':arrow_up: language-gfm@0.79.0'])
    gitDummyCommit([':arrow_up: one-dark/light-ui@v1.0.1'])
  })

  it('should work if there is no semver tag', function (done) {
    conventionalChangelogCore({
      config: config
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()

        expect(chunk).to.include(':arrow_down:')
        expect(chunk).to.include('`updateContentDimensions` when model changes')
        expect(chunk).to.include(':arrow_up:')
        expect(chunk).to.include('one-dark/light-ui@v1.0.1')

        expect(chunk).to.not.include('7881')

        done()
      }))
  })
})
