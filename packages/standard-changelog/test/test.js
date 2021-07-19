'use strict'
const standardChangelog = require('../')
const expect = require('chai').expect
const through = require('through2')
const fs = require('fs')
const tmp = require('tmp')
const { gitInit, exec } = require('../../../tools/test-tools')

tmp.setGracefulCleanup()
const oldDir = process.cwd()

describe('standardChangelog', function () {
  before(() => {
    const tmpDir = tmp.dirSync()
    process.chdir(tmpDir.name)
    gitInit()
    fs.writeFileSync('test1', '')
    exec('git add --all && git commit -m"feat: first commit"')
  })

  after(() => {
    process.chdir(oldDir)
  })

  it('should generate angular changelog', function (done) {
    let i = 0

    standardChangelog()
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk, enc, cb) {
        chunk = chunk.toString()

        expect(chunk).to.include('Features')

        i++
        cb()
      }, function () {
        expect(i).to.equal(1)
        done()
      }))
  })
})
