'use strict'
const conventionalChangelogCore = require('conventional-changelog-core')
const config = require('../')
const expect = require('chai').expect
const through = require('through2')
const tmp = require('tmp')
const { gitInit, gitDummyCommit } = require('../../../tools/test-tools')

tmp.setGracefulCleanup()

const oldDir = process.cwd()

describe('atom preset', function () {
  before(() => {
    const tmpDir = tmp.dirSync()
    process.chdir(tmpDir.name)
    gitInit()
    gitDummyCommit([':arrow_down: exception-reporting'])
    gitDummyCommit([':bug: `updateContentDimensions` when model changes'])
    gitDummyCommit(['Merge pull request #7881 from atom/bf-upgrade-babel-to-5.6.17'])
    gitDummyCommit([':arrow_up: language-gfm@0.79.0'])
    gitDummyCommit([':arrow_up: one-dark/light-ui@v1.0.1'])
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

        expect(chunk).to.include(':arrow_down:')
        expect(chunk).to.include('`updateContentDimensions` when model changes')
        expect(chunk).to.include(':arrow_up:')
        expect(chunk).to.include('one-dark/light-ui@v1.0.1')

        expect(chunk).to.not.include('7881')

        done()
      }))
  })
})
