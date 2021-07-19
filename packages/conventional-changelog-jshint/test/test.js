'use strict'
const conventionalChangelogCore = require('conventional-changelog-core')
const config = require('../')
const expect = require('chai').expect
const through = require('through2')
const tmp = require('tmp')
const { gitInit, gitDummyCommit } = require('../../../tools/test-tools')

tmp.setGracefulCleanup()
const oldDir = process.cwd()

describe('jshint preset', function () {
  before(() => {
    const tmpDir = tmp.dirSync()
    process.chdir(tmpDir.name)
    gitInit()
    gitDummyCommit(['[[Chore]] Move scope-manager to external file'])
    gitDummyCommit(['[[Test]] Add test for gh-985. Fixes #985'])
    gitDummyCommit(['[[FIX]] catch params are scoped to the catch only'])
    gitDummyCommit(['[[Fix]] accidentally use lower-case'])
    gitDummyCommit(['[[FEAT]] Option to assume strict mode', '', 'BREAKING CHANGE: Not backward compatible.'])
  })

  after(() => {
    process.chdir(oldDir)
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
