'use strict'
const expect = require('chai').expect
const spawn = require('child_process').spawn
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
const readFileSync = fs.readFileSync
const writeFileSync = fs.writeFileSync
const { gitInit, gitDummyCommit, exec } = require('../../../tools/test-tools')

const cliPath = path.join(__dirname, '../cli.js')
const oldDir = process.cwd()

require('chai').should()

function originalChangelog () {
  writeFileSync(path.join(__dirname, 'fixtures/_CHANGELOG.md'), 'Some previous changelog.\n')
}

describe('standard-changelog cli', function () {
  before(function () {
    process.chdir(__dirname)
    rimraf.sync('tmp')
    console.log('before', __dirname)
    fs.mkdirSync('tmp')
    process.chdir('tmp')
    gitInit()
    gitDummyCommit('feat: First commit')
  })

  beforeEach(function () {
    rimraf.sync('CHANGELOG.md')
  })

  after(function () {
    originalChangelog()
    process.chdir(oldDir)
  })

  describe('without any argument', function () {
    it('appends to changelog if it exists', function (done) {
      writeFileSync('CHANGELOG.md', '\nold content', 'utf-8')

      const cp = spawn(process.execPath, [cliPath], {
        stdio: [process.stdin, null, null]
      })

      cp.on('close', function (code) {
        code.should.equal(0)
        const content = readFileSync('CHANGELOG.md', 'utf-8')
        content.should.match(/First commit/)
        content.should.match(/old content/)
        return done()
      })
    })

    it('generates changelog if it does not exist', function (done) {
      const cp = spawn(process.execPath, [cliPath], {
        stdio: [process.stdin, null, null]
      })

      cp.on('close', function (code) {
        code.should.equal(0)
        const content = readFileSync('CHANGELOG.md', 'utf-8')
        content.should.match(/First commit/)
        return done()
      })
    })
  })

  it('should overwrite if `-s` presents when appending', function (done) {
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

  it('should overwrite if `-s` presents when not appending', function (done) {
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

  it('should overwrite if `infile` and `outfile` are the same', function (done) {
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

    cp.on('close', function (code) {
      expect(code).to.equal(0)
      const modified = readFileSync(path.join(__dirname, 'tmp/_CHANGELOG.md'), 'utf8')
      expect(modified).to.match(/Some previous changelog.(\s|.)*First commit/)

      done()
    })
  })

  it('should work if `infile` presets but `outfile` is missing when appending', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-i', path.join(__dirname, 'fixtures/_CHANGELOG.md'), '--append'], {
      stdio: [process.stdin, null, null]
    })

    cp.on('close', function (code) {
      expect(code).to.equal(0)
      const modified = readFileSync(path.join(__dirname, 'tmp/_CHANGELOG.md'), 'utf8')
      expect(modified).to.match(/Some previous changelog.(\s|.)*First commit/)

      done()
    })
  })

  it('should ignore `infile` if `releaseCount` is `0` (file)', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-i', path.join(__dirname, 'fixtures/_CHANGELOG.md'), '--releaseCount', 0], {
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

  it('should create `infile` if `infile` is ENOENT', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-i', 'no-such-file.md'], {
      stdio: [process.stdin, null, null]
    })

    cp.on('close', function (code) {
      expect(code).to.equal(0)
      const modified = readFileSync('no-such-file.md', 'utf8')
      expect(modified).to.include('First commit')
      expect(modified).to.not.include('previous')
      done()
    })
  })

  it('should create `infile` if `infile` is ENOENT and overwrite infile', function (done) {
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

  it('should default to CHANGELOG.md if `-s` presents but `-i` is missing', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-s'], {
      stdio: [process.stdin, null, null]
    })

    cp.on('close', function (code) {
      expect(code).to.equal(0)
      const modified = readFileSync('CHANGELOG.md', 'utf8')
      expect(modified).to.include('First commit')
      expect(modified).to.not.include('previous')
      done()
    })
  })

  it('-k should work', function (done) {
    const cp = spawn(process.execPath, [cliPath, '-k', path.join(__dirname, 'fixtures/_package.json')], {
      stdio: [process.stdin, null, null]
    })

    cp.on('close', function (code) {
      expect(code).to.equal(0)
      const modified = readFileSync('CHANGELOG.md', 'utf8')
      expect(modified).to.include('0.0.17')
      done()
    })
  })

  it('--context should work with relative path', function (done) {
    const cp = spawn(process.execPath, [cliPath, '--context', '../fixtures/context.json', '--config', '../fixtures/config.js'], {
      stdio: [process.stdin, null, null]
    })

    cp.on('close', function (code) {
      expect(code).to.equal(0)
      const modified = readFileSync('CHANGELOG.md', 'utf8')
      expect(modified).to.include('my-repo')
      done()
    })
  })

  it('--context should work with absolute path', function (done) {
    const cp = spawn(process.execPath, [cliPath, '--context', '../fixtures/context.json', '--config', path.join(__dirname, 'fixtures/config.js')], {
      stdio: [process.stdin, null, null]
    })

    cp.on('close', function (code) {
      expect(code).to.equal(0)
      const modified = readFileSync('CHANGELOG.md', 'utf8')
      expect(modified).to.include('my-repo')
      done()
    })
  })

  it('generates full historical changelog on --first-release', function (done) {
    exec('git tag -a v0.0.17 -m "old release"')

    const cp = spawn(process.execPath, [cliPath, '-k', path.join(__dirname, 'fixtures/_package.json'), '--first-release'], {
      stdio: [process.stdin, null, null]
    })

    cp.on('close', function (code) {
      expect(code).to.equal(0)
      const modified = readFileSync('CHANGELOG.md', 'utf8')
      expect(modified).to.include('First commit')
      exec('git tag -d v0.0.17')
      done()
    })
  })

  it('outputs an error if context file is not found', function (done) {
    let output = ''

    const cp = spawn(process.execPath, [cliPath, '--context', 'missing-file.txt'], {
      stdio: [process.stdin, null, null]
    })

    cp.stderr.on('data', function (data) {
      output += data.toString()
    })

    cp.on('close', function (code) {
      expect(code).to.equal(1)
      output.toString().should.match(/Cannot find module/)
      return done()
    })
  })
})
