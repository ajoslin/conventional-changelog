'use strict'
const concat = require('concat-stream')
const expect = require('chai').expect
const spawn = require('child_process').spawn
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
const { gitInit, exec } = require('../../../tools/test-tools')
const readFileSync = fs.readFileSync
const writeFileSync = fs.writeFileSync

const cliPath = path.join(__dirname, '../cli.js')

function originalChangelog () {
  writeFileSync(path.join(__dirname, 'fixtures/_CHANGELOG.md'), 'Some previous changelog.\n')
}

describe('cli', function () {
  before(function () {
    process.chdir(__dirname)
    rimraf.sync('tmp')
    fs.mkdirSync('tmp')
    process.chdir('tmp')
    gitInit()
    writeFileSync('test1', '')
    exec('git add --all && git commit -m"First commit"')
  })

  after(function () {
    originalChangelog()
  })

  it('should work without any arguments', function (done) {
    const cp = spawn(process.execPath, [cliPath], {
      stdio: [process.stdin, null, null]
    })

    cp.stdout
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.include('First commit')

        done()
      }))
  })

  it('should output to the same file if `-s` presents when appending', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-i', path.join(__dirname, 'fixtures/_CHANGELOG.md'), '-s', '--append'], {
      stdio: [process.stdin, null, null]
    })

    cp.on('close', function (code) {
      expect(code).to.equal(0)
      const modified = readFileSync(path.join(__dirname, 'fixtures/_CHANGELOG.md'), 'utf8')
      expect(modified).to.match(/Some previous changelog.(\s|.)*First commit/)

      originalChangelog()
      done()
    })
  })

  it('should output to the same file if `-s` presents when not appending', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-i', path.join(__dirname, 'fixtures/_CHANGELOG.md'), '-s'], {
      stdio: [process.stdin, null, null]
    })

    cp.on('close', function (code) {
      expect(code).to.equal(0)
      const modified = readFileSync(path.join(__dirname, 'fixtures/_CHANGELOG.md'), 'utf8')
      expect(modified).to.match(/First commit(\s|.)*Some previous changelog./)

      originalChangelog()
      done()
    })
  })

  it('should output to the same file if `infile` and `outfile` are the same', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-i', path.join(__dirname, 'fixtures/_CHANGELOG.md'), '-o', path.join(__dirname, 'fixtures/_CHANGELOG.md')], {
      stdio: [process.stdin, null, null]
    })

    cp.on('close', function (code) {
      expect(code).to.equal(0)
      const modified = readFileSync(path.join(__dirname, 'fixtures/_CHANGELOG.md'), 'utf8')
      expect(modified).to.include('First commit')
      expect(modified).to.include('Some previous changelog.\n')

      originalChangelog()
      done()
    })
  })

  it('should work if `infile` is missing but `outfile` presets', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-o', path.join(__dirname, 'tmp/_CHANGELOG.md')], {
      stdio: [process.stdin, null, null]
    })

    cp.on('close', function (code) {
      expect(code).to.equal(0)
      const modified = readFileSync(path.join(__dirname, 'tmp/_CHANGELOG.md'), 'utf8')
      expect(modified).to.include('First commit')

      done()
    })
  })

  it('should work if both `infile` and `outfile` presets when not appending', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-i', path.join(__dirname, 'fixtures/_CHANGELOG.md'), '-o', path.join(__dirname, 'tmp/_CHANGELOG.md')], {
      stdio: [process.stdin, null, null]
    })

    cp.on('close', function (code) {
      expect(code).to.equal(0)
      const modified = readFileSync(path.join(__dirname, 'tmp/_CHANGELOG.md'), 'utf8')
      expect(modified).to.match(/First commit(\s|.)*Some previous changelog./)

      done()
    })
  })

  it('should work if both `infile` and `outfile` presets when appending', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-i', path.join(__dirname, 'fixtures/_CHANGELOG.md'), '-o', path.join(__dirname, 'tmp/_CHANGELOG.md'), '--append'], {
      stdio: [process.stdin, null, null]
    })

    cp.on('close', function (code) {
      expect(code).to.equal(0)
      const modified = readFileSync(path.join(__dirname, 'tmp/_CHANGELOG.md'), 'utf8')
      expect(modified).to.match(/Some previous changelog.(\s|.)*First commit/)

      done()
    })
  })

  it('should work if `infile` presets but `outfile` is missing when not appending', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-i', path.join(__dirname, 'fixtures/_CHANGELOG.md')], {
      stdio: [process.stdin, null, null]
    })

    cp.stdout
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.match(/First commit(\s|.)*Some previous changelog./)

        done()
      }))
  })

  it('should work if `infile` presets but `outfile` is missing when appending', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-i', path.join(__dirname, 'fixtures/_CHANGELOG.md'), '--append'], {
      stdio: [process.stdin, null, null]
    })

    cp.stdout
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.match(/Some previous changelog.(\s|.)*First commit/)

        done()
      }))
  })

  it('should ignore `infile` if `releaseCount` is `0` (stdout)', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-i', path.join(__dirname, 'fixtures/_CHANGELOG.md'), '--release-count', 0], {
      stdio: [process.stdin, null, null]
    })

    cp.stdout
      .pipe(concat(function (chunk) {
        chunk = chunk.toString()

        expect(chunk).to.include('First commit')
        expect(chunk).to.not.include('previous')

        done()
      }))
  })

  it('should ignore `infile` if `releaseCount` is `0` (file)', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-i', path.join(__dirname, 'fixtures/_CHANGELOG.md'), '--release-count', 0, '-s'], {
      stdio: [process.stdin, null, null]
    })

    cp.on('close', function (code) {
      expect(code).to.equal(0)
      const modified = readFileSync(path.join(__dirname, 'fixtures/_CHANGELOG.md'), 'utf8')
      expect(modified).to.include('First commit')
      expect(modified).to.not.include('previous')

      originalChangelog()
      done()
    })
  })

  it('should ignore `infile` if `infile` is ENOENT', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-i', 'no-such-file.md'], {
      stdio: [process.stdin, null, null]
    })

    cp.stdout
      .pipe(concat(function (chunk) {
        chunk = chunk.toString()

        expect(chunk).to.include('First commit')
        expect(chunk).to.not.include('previous')
        expect(chunk).to.not.match(/First commit[\w\W]*First commit/)

        done()
      }))
  })

  it('should warn if `infile` is ENOENT', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-i', 'no-such-file.md', '-v'], {
      stdio: [process.stdin, null, null]
    })

    cp.stderr
      .pipe(concat(function (chunk) {
        chunk = chunk.toString()

        expect(chunk).to.include('infile does not exist.')

        done()
      }))
  })

  it('should create `infile` if `infile` is ENOENT and output to the same file', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-i', path.join(__dirname, 'tmp/no-such-file.md'), '-s'], {
      stdio: [process.stdin, null, null]
    })

    cp.on('close', function (code) {
      expect(code).to.equal(0)
      const modified = readFileSync(path.join(__dirname, 'tmp/no-such-file.md'), 'utf8')
      expect(modified).to.include('First commit')
      expect(modified).to.not.include('previous')

      originalChangelog()
      done()
    })
  })

  it('should error if `-s` presents but `-i` is missing', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-s'], {
      stdio: [process.stdin, null, null]
    })

    cp.stderr
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.include('infile must be provided if same-file flag presents.\n')
      }))

    cp.on('close', function (code) {
      expect(code).to.equal(1)

      done()
    })
  })

  it('should error if it fails to get any options file', function (done) {
    const cp = spawn(process.execPath, [cliPath, '--config', 'no'], {
      stdio: [process.stdin, null, null]
    })

    cp.stderr
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.include('Failed to get file. ')
      }))

    cp.on('close', function (code) {
      expect(code).to.equal(1)

      done()
    })
  })

  it('-k should work', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-k', path.join(__dirname, 'fixtures/_package.json')], {
      stdio: [process.stdin, null, null]
    })

    cp.stdout
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.include('0.0.17')
      }))

    cp.on('close', function (code) {
      expect(code).to.equal(0)

      done()
    })
  })

  it('--context should work with relative path', function (done) {
    const cp = spawn(process.execPath, [cliPath, '--context', '../fixtures/context.json', '--config', '../fixtures/config.js'], {
      stdio: [process.stdin, null, null]
    })

    cp.stdout
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.equal('unicorn template')
        done()
      }))
  })

  it('--context should work with absolute path', function (done) {
    const cp = spawn(process.execPath, [cliPath, '--context', '../fixtures/context.json', '--config', path.join(__dirname, 'fixtures/config.js')], {
      stdio: [process.stdin, null, null]
    })

    cp.stdout
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.equal('unicorn template')
        done()
      }))
  })

  it('--config should work with a return promise', function (done) {
    const cp = spawn(process.execPath, [cliPath, '--config', '../fixtures/promise-config.js'], {
      stdio: [process.stdin, null, null]
    })

    cp.stdout
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.equal('template')
        done()
      }))
  })

  it('--config should work with relative path', function (done) {
    const cp = spawn(process.execPath, [cliPath, '--config', '../fixtures/config.js'], {
      stdio: [process.stdin, null, null]
    })

    cp.stdout
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.equal('template')
        done()
      }))
  })

  it('--config should work with absolute path', function (done) {
    const cp = spawn(process.execPath, [cliPath, '--config', path.join(__dirname, 'fixtures/config.js')], {
      stdio: [process.stdin, null, null]
    })

    cp.stdout
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.equal('template')
        done()
      }))
  })

  it('--preset should work', function (done) {
    writeFileSync('angular', '')
    exec('git add --all && git commit -m"fix: fix it!"')
    const cp = spawn(process.execPath, [cliPath, '--preset', 'angular'], {
      stdio: [process.stdin, null, null]
    })

    cp.stdout
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.include('Bug Fixes')
        done()
      }))
  })
  it('--preset "conventionalcommits" should work', function (done) {
    writeFileSync('angular', '2')
    exec('git add --all && git commit -m"fix: fix it!"')
    const cp = spawn(process.execPath, [cliPath, '--preset', 'conventionalcommits'], {
      stdio: [process.stdin, null, null]
    })

    cp.stdout
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.include('Bug Fixes')
        done()
      }))
  })

  it('--config should work with --preset', function (done) {
    const cp = spawn(process.execPath, [cliPath, '--preset', 'angular', '--config', path.join(__dirname, 'fixtures/config.js')], {
      stdio: [process.stdin, null, null]
    })

    cp.stdout
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.equal('Bug Fixestemplate')
        done()
      }))
  })

  it('should be verbose', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-v', '-p', 'no'], {
      stdio: [process.stdin, null, null]
    })

    cp.stdout
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.include('Your git-log command is')
      }))

    cp.stderr
      .pipe(concat(function (chunk) {
        expect(chunk.toString()).to.include('Preset: "no" does not exist\n')
      }))

    cp.on('close', function (code) {
      expect(code).to.equal(0)

      done()
    })
  })
})
