'use strict'
const conventionalChangelogCore = require('conventional-changelog-core')
const config = require('../')
const expect = require('chai').expect
const through = require('through2')
const tmp = require('tmp')
const { gitInit, gitDummyCommit } = require('../../../tools/test-tools')

tmp.setGracefulCleanup()
const oldDir = process.cwd()

describe('express preset', function () {
  before(() => {
    const tmpDir = tmp.dirSync()
    process.chdir(tmpDir.name)
    gitInit()
    gitDummyCommit(['deps: type-is@~1.6.3', '', ' - deps: mime-types@~2.1.1',
      ' - perf: reduce try block size',
      ' - perf: remove bitwise operations'])
    gitDummyCommit(['perf: use saved reference to http.STATUS_CODES', '', 'closes #2602'])
    gitDummyCommit(['docs: add license comments'])
    gitDummyCommit(['deps: path-to-regexp@0.1.4'])
    gitDummyCommit(['Bad commit'])
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

        expect(chunk).to.include('### Dependencies')
        expect(chunk).to.include('type-is@~1.6.3')
        expect(chunk).to.include(' - deps: mime-types@~2.1.1\n')
        expect(chunk).to.include('path-to-regexp@0.1.4')
        expect(chunk).to.include('### Performance')
        expect(chunk).to.include('use saved reference to http.STATUS_CODES')

        expect(chunk).to.not.include('license')
        expect(chunk).to.not.include('Bad')

        done()
      }))
  })
})
