'use strict'
const conventionalChangelog = require('../')
const expect = require('chai').expect
const through = require('through2')
const fs = require('fs')
const path = require('path')
const tmp = require('tmp')
const { gitInit, exec } = require('../../../tools/test-tools')

tmp.setGracefulCleanup()
const oldDir = process.cwd()

describe('conventionalChangelog', function () {
  before(() => {
    const tmpDir = tmp.dirSync()
    process.chdir(tmpDir.name)
    gitInit()
    fs.writeFileSync(path.join(tmpDir.name, 'test1'), '')
    exec('git add --all && git commit -m"First commit"')
  })

  after(() => {
    process.chdir(oldDir)
  })

  it('should not warn if preset is found', function (done) {
    let i = 0

    conventionalChangelog({
      preset: 'angular',
      warn: function (warning) {
        done(warning)
      }
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk, enc, cb) {
        chunk = chunk.toString()

        expect(chunk).to.include('#')

        i++
        cb()
      }, function () {
        expect(i).to.equal(1)
        done()
      }))
  })

  it('should work with mixed case', function (done) {
    let i = 0

    conventionalChangelog({
      preset: 'aNgular',
      warn: function (warning) {
        done(warning)
      }
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk, enc, cb) {
        chunk = chunk.toString()

        expect(chunk).to.include('#')

        i++
        cb()
      }, function () {
        expect(i).to.equal(1)
        done()
      }))
  })

  it('should allow object for preset', function (done) {
    let i = 0

    conventionalChangelog({
      preset: {
        name: 'conventionalcommits'
      },
      warn: function (warning) {
        done(warning)
      }
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk, enc, cb) {
        chunk = chunk.toString()

        expect(chunk).to.include('#')

        i++
        cb()
      }, function () {
        expect(i).to.equal(1)
        done()
      }))
  })

  it('should warn if preset is not found', function (done) {
    let i = 0

    conventionalChangelog({
      preset: 'no',
      warn: function (warning) {
        if (i > 0) {
          return
        }

        expect(warning).to.equal('Preset: "no" does not exist')

        i++
        done()
      }
    })
      .on('error', function (err) {
        done(err)
      })
  })

  it('should still work if preset is not found', function (done) {
    let i = 0

    conventionalChangelog({
      preset: 'no'
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk, enc, cb) {
        chunk = chunk.toString()

        expect(chunk).to.include('#')

        i++
        cb()
      }, function () {
        expect(i).to.equal(1)
        done()
      }))
  })
})
