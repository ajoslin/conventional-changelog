'use strict'
const expect = require('chai').expect
const gitRawCommits = require('./')
const through = require('through2')
const writeFileSync = require('fs').writeFileSync
const fs = require('fs')
const tmp = require('tmp')
const { gitInit, exec } = require('../../tools/test-tools')

tmp.setGracefulCleanup()
const oldDir = process.cwd()

describe('git-raw-commits', function () {
  before(() => {
    const tmpDir = tmp.dirSync()
    process.chdir(tmpDir.name)
    gitInit()
  })

  after(() => {
    process.chdir(oldDir)
  })

  it('should emit an error and the error should not be read only if there is no commits', function (done) {
    gitRawCommits()
      .on('error', function (err) {
        expect(err).to.be.ok // eslint-disable-line no-unused-expressions
        err.message = 'error message'
        done()
      })
      .pipe(through(function () {
        done('should error')
      }, function () {
        done('should error')
      }))
  })

  it('should execute the command without error', function (done) {
    fs.mkdirSync('./packages/foo', { recursive: true })
    writeFileSync('./packages/foo/test1', '')
    exec('git add --all && git commit -m"First commit"')
    writeFileSync('test2', '')
    exec('git add --all && git commit -m"Second commit"')
    writeFileSync('test3', '')
    exec('git add --all && git commit -m"Third commit"')

    gitRawCommits()
      .on('close', done)
      .on('error', done)
  })

  it('should get commits without `options` (`options.from` defaults to first commit)', function (done) {
    let i = 0

    gitRawCommits()
      .pipe(through(function (chunk, enc, cb) {
        chunk = chunk.toString()

        if (i === 0) {
          expect(chunk).to.equal('Third commit\n\n')
        } else if (i === 1) {
          expect(chunk).to.equal('Second commit\n\n')
        } else {
          expect(chunk).to.equal('First commit\n\n')
        }

        i++
        cb()
      }, function () {
        expect(i).to.equal(3)
        done()
      }))
  })

  it('should honour `options.from`', function (done) {
    let i = 0

    gitRawCommits({
      from: 'HEAD~1'
    })
      .pipe(through(function (chunk, enc, cb) {
        chunk = chunk.toString()

        expect(chunk).to.equal('Third commit\n\n')

        i++
        cb()
      }, function () {
        expect(i).to.equal(1)
        done()
      }))
  })

  it('should honour `options.to`', function (done) {
    let i = 0

    gitRawCommits({
      to: 'HEAD^'
    })
      .pipe(through(function (chunk, enc, cb) {
        chunk = chunk.toString()

        if (i === 0) {
          expect(chunk).to.equal('Second commit\n\n')
        } else {
          expect(chunk).to.equal('First commit\n\n')
        }

        i++
        cb()
      }, function () {
        expect(i).to.equal(2)
        done()
      }))
  })

  it('should honour `options.format`', function (done) {
    let i = 0

    gitRawCommits({
      format: 'what%n%B'
    })
      .pipe(through(function (chunk, enc, cb) {
        chunk = chunk.toString()

        if (i === 0) {
          expect(chunk).to.equal('what\nThird commit\n\n')
        } else if (i === 1) {
          expect(chunk).to.equal('what\nSecond commit\n\n')
        } else {
          expect(chunk).to.equal('what\nFirst commit\n\n')
        }

        i++
        cb()
      }, function () {
        expect(i).to.equal(3)
        done()
      }))
  })

  it('should allow commits to be scoped to a specific directory', function (done) {
    let i = 0
    let output = ''

    gitRawCommits({
      path: './packages/foo'
    })
      .pipe(through(function (chunk, enc, cb) {
        output += chunk.toString()

        i++
        cb()
      }, function () {
        expect(i).to.equal(1)
        expect(output).to.match(/First commit/)
        expect(output).to.not.match(/Second commit/)
        done()
      }))
  })

  it('should show your git-log command', function (done) {
    gitRawCommits({
      format: 'what%n%B',
      debug: function (cmd) {
        expect(cmd).to.include('Your git-log command is:\ngit log --format')
        done()
      }
    })
  })

  it('should prevent variable expansion on windows', function (done) {
    let i = 0

    gitRawCommits({
      format: '%%cd%n%B'
    })
      .pipe(through(function (chunk, enc, cb) {
        chunk = chunk.toString()

        if (i === 0) {
          expect(chunk).to.equal('%cd\nThird commit\n\n')
        } else if (i === 1) {
          expect(chunk).to.equal('%cd\nSecond commit\n\n')
        } else {
          expect(chunk).to.equal('%cd\nFirst commit\n\n')
        }

        i++
        cb()
      }, function () {
        expect(i).to.equal(3)
        done()
      }))
  })
})
