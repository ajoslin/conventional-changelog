'use strict'
const standardChangelog = require('../')
const expect = require('chai').expect
const shell = require('shelljs')
const through = require('through2')
const writeFileSync = require('fs').writeFileSync

describe('standardChangelog', function () {
  before(function () {
    shell.config.resetForTesting()
    shell.cd(__dirname)
    shell.rm('-rf', 'tmp')
    shell.mkdir('tmp')
    shell.cd('tmp')
    shell.mkdir('git-templates')
    shell.exec('git init --template=../git-templates')
    writeFileSync('test1', '')
    shell.exec('git add --all && git commit -m"feat: first commit"')
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
