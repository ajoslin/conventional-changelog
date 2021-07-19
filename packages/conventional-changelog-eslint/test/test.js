'use strict'
const conventionalChangelogCore = require('conventional-changelog-core')
const config = require('../')
const expect = require('chai').expect
const gitDummyCommit = require('git-dummy-commit')
const shell = require('shelljs')
const through = require('through2')

describe('eslint preset', function () {
  before(function () {
    shell.config.resetForTesting()
    shell.cd(__dirname)
    shell.rm('-rf', 'tmp')
    shell.mkdir('tmp')
    shell.cd('tmp')
    shell.mkdir('git-templates')
    shell.exec('git init --template=./git-templates')

    if (process.platform !== 'win32') {
      // we need to escape backtick for bash but not for windows
      // probably this should be done in git-dummy-commit or shelljs
      gitDummyCommit(['Fix: the \\`no-class-assign\\` rule (fixes #2718)'])
    } else {
      gitDummyCommit(['Fix: the `no-class-assign` rule (fixes #2718)'])
    }
    gitDummyCommit([])
    gitDummyCommit(['Update: Handle CRLF line endings in spaced-comment rule - 2 (fixes #3005)'])
    gitDummyCommit(['Fix: indent rule should recognize single line statements with ASI (fixes #3001, fixes #3000)'])
    gitDummyCommit(['Docs: Fix unmatched paren in rule description'])
    gitDummyCommit(['Fix:        Commit with trailing spaces in the beginning'])
    gitDummyCommit(['Merge pull request #3033 from gcochard/patch-3 '])
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

        expect(chunk).to.include('the `no-class-assign` rule')
        expect(chunk).to.include('### Fix')
        expect(chunk).to.include('indent rule should recognize single line statements with ASI')
        expect(chunk).to.include('* Commit with trailing spaces in the beginning')
        expect(chunk).to.include('### Docs')

        expect(chunk).to.not.include('3033')

        done()
      }))
  })
})
