'use strict'
const concat = require('concat-stream')
const expect = require('chai').expect
const fs = require('fs')
const spawn = require('child_process').fork
const through = require('through2')
const path = require('path')

const cliPath = path.join(__dirname, '../test-cli.js')

describe('changelog-parser cli', function () {
  before(function () {
    process.chdir(__dirname)
  })

  it('should parse commits in a file', function (done) {
    const cp = spawn(cliPath, [path.join(__dirname, 'fixtures/log1.txt')], {
      stdio: [process.stdin, null, null, 'ipc'],
      env: {
        FORCE_STDIN_TTY: '1'
      }
    })
    cp.stdout
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.include('"type":"feat","scope":"ngMessages","subject":"provide support for dynamic message resolution"')

        done()
      }))
  })

  it('should work with a separator', function (done) {
    const cp = spawn(cliPath, [path.join(__dirname, 'fixtures/log2.txt'), '==='], {
      stdio: [process.stdin, null, null, 'ipc'],
      env: {
        FORCE_STDIN_TTY: '1'
      }
    })
    cp.stdout
      .pipe(concat(function (chunk) {
        chunk = chunk.toString()

        expect(chunk).to.include('"type":"docs","scope":"ngMessageExp","subject":"split ngMessage docs up to show its alias more clearly"')
        expect(chunk).to.include('"type":"fix","scope":"$animate","subject":"applyStyles from options on leave"')

        done()
      }))
  })

  it('should work with two files', function (done) {
    const cp = spawn(cliPath, [path.join(__dirname, 'fixtures/log1.txt'), path.join(__dirname, 'fixtures/log2.txt'), '==='], {
      stdio: [process.stdin, null, null, 'ipc'],
      env: {
        FORCE_STDIN_TTY: '1'
      }
    })
    cp.stdout
      .pipe(concat(function (chunk) {
        chunk = chunk.toString()

        expect(chunk).to.include('"type":"feat","scope":"ngMessages","subject":"provide support for dynamic message resolution"')
        expect(chunk).to.include('"type":"docs","scope":"ngMessageExp","subject":"split ngMessage docs up to show its alias more clearly"')
        expect(chunk).to.include('"type":"fix","scope":"$animate","subject":"applyStyles from options on leave"')

        done()
      }))
  })

  it('should error if files cannot be found', function (done) {
    let i = 0
    const cp = spawn(cliPath, [path.join(__dirname, 'fixtures/log1.txt'), path.join(__dirname, 'fixtures/log4.txt'), path.join(__dirname, 'fixtures/log2.txt'), path.join(__dirname, 'fixtures/log5.txt'), '==='], {
      stdio: [process.stdin, null, null, 'ipc'],
      env: {
        FORCE_STDIN_TTY: '1'
      }
    })
    cp.stderr
      .pipe(through(function (chunk, enc, cb) {
        chunk = chunk.toString()

        if (i === 0) {
          expect(chunk).to.contain(`Failed to read file ${path.join(__dirname, 'fixtures/log4.txt')}`)
        } else {
          expect(chunk).to.contain(`Failed to read file ${path.join(__dirname, 'fixtures/log5.txt')}`)
        }

        i++
        cb()
      }, function () {
        done()
      }))
  })

  it('should work with options', function (done) {
    const cp = spawn(cliPath, [path.join(__dirname, 'fixtures/log3.txt'), '-p', '^(\\w*)(?:\\(([:\\w\\$\\.\\-\\* ]*)\\))?\\: (.*)$', '--reference-actions', 'close, fix', '-n', 'BREAKING NEWS', '--headerCorrespondence', 'scope, type,subject '], {
      stdio: [process.stdin, null, null, 'ipc'],
      env: {
        FORCE_STDIN_TTY: '1'
      }
    })
    cp.stdout
      .pipe(concat(function (chunk) {
        const data = JSON.parse(chunk.toString())[0]

        expect(data.scope).to.equal('category')
        expect(data.type).to.equal('fix:subcategory')
        expect(data.subject).to.equal('My subject')

        expect(data.references).to.eql([
          {
            action: 'Close',
            owner: null,
            repository: null,
            issue: '10036',
            raw: '#10036',
            prefix: '#'
          },
          {
            action: null,
            issue: '13233',
            owner: null,
            prefix: '#',
            raw: 'Fixed #13233',
            repository: null
          },
          {
            action: 'fix',
            owner: null,
            repository: null,
            issue: '9338',
            raw: '#9338',
            prefix: '#'
          }
        ])

        expect(data.notes).to.eql([
          {
            title: 'BREAKING NEWS',
            text: 'A lot of changes!'
          }
        ])

        done()
      }))
  })

  it('should work if it is not a tty', function (done) {
    const cp = spawn(cliPath, {
      stdio: [fs.openSync(path.join(__dirname, 'fixtures/log1.txt'), 'r'), null, null, 'ipc']
    })
    cp.stdout
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.include('"type":"feat","scope":"ngMessages","subject":"provide support for dynamic message resolution"')

        done()
      }))
  })

  it('should seperate if it is not a tty', function (done) {
    const cp = spawn(cliPath, ['==='], {
      stdio: [fs.openSync(path.join(__dirname, 'fixtures/log2.txt'), 'r'), null, null, 'ipc']
    })

    cp.stdout
      .pipe(concat(function (chunk) {
        chunk = chunk.toString()

        expect(chunk).to.include('"type":"docs","scope":"ngMessageExp","subject":"split ngMessage docs up to show its alias more clearly"')
        expect(chunk).to.include('"type":"fix","scope":"$animate","subject":"applyStyles from options on leave"')

        done()
      }))
  })

  it('should error if it is not a tty and commit cannot be parsed', function (done) {
    const cp = spawn(cliPath, {
      stdio: [fs.openSync(path.join(__dirname, 'fixtures/bad_commit.txt'), 'r'), null, null, 'ipc']
    })
    cp.stderr
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.equal('TypeError: Expected a raw commit\n')

        done()
      }))
  })
})
