'use strict'
const conventionalChangelogCore = require('conventional-changelog-core')
const config = require('../')
const expect = require('chai').expect
const gitDummyCommit = require('git-dummy-commit')
const shell = require('shelljs')
const through = require('through2')

describe('jshint preset', function () {
  before(function (done) {
    shell.config.resetForTesting()
    shell.cd(__dirname)
    shell.rm('-rf', 'tmp')
    shell.mkdir('tmp')
    shell.cd('tmp')
    shell.mkdir('git-templates')
    shell.exec('git init --template=./git-templates')
    gitDummyCommit(['[[Chore]] Move scope-manager to external file'])
    gitDummyCommit(['[[Test]] Add test for gh-985. Fixes #985'])
    gitDummyCommit(['[[FIX]] catch params are scoped to the catch only'])
    gitDummyCommit(['[[Fix]] accidentally use lower-case'])
    gitDummyCommit(['[[FEAT]] Option to assume strict mode', '', 'BREAKING CHANGE: Not backward compatible.'])
    done()
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

        expect(chunk).to.include('catch params are scoped to the catch only')
        expect(chunk).to.include('### Bug Fixes')
        expect(chunk).to.include('Option to assume strict mode')
        expect(chunk).to.include('accidentally use lower-case')
        expect(chunk).to.include('### Features')
        expect(chunk).to.include('BREAKING CHANGES')

        expect(chunk).to.not.include('Chore')
        expect(chunk).to.not.include('Move scope-manager to external file')
        expect(chunk).to.not.include('Add test for gh-985.')
        expect(chunk).to.not.include('Bad')

        done()
      }))
  })
})
