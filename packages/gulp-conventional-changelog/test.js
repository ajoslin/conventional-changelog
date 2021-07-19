'use strict'
const concat = require('concat-stream')
const conventionalChangelog = require('./')
const expect = require('chai').expect
const Vinyl = require('vinyl')
const join = require('path').join
const through = require('through2')
const Buffer = require('safe-buffer').Buffer
const writeFileSync = require('fs').writeFileSync
const tmp = require('tmp')
const { gitInit, exec } = require('../../tools/test-tools')

tmp.setGracefulCleanup()
const oldDir = process.cwd()

describe('gulp-conventional-changelog', function () {
  before(() => {
    const tmpDir = tmp.dirSync()
    process.chdir(tmpDir.name)
    gitInit()
  })

  after(() => {
    process.chdir(oldDir)
  })

  describe('error', function () {
    it('should emit error if any', function (cb) {
      const stream = conventionalChangelog({
        preset: 'angular'
      })

      stream.on('error', function (err) {
        expect(err.plugin).to.equal('gulp-conventional-changelog')
        cb()
      })

      stream.on('data', function (file) {
        cb(file)
      })

      stream.write(new Vinyl({
        cwd: __dirname,
        base: join(__dirname, 'fixtures'),
        path: join(__dirname, 'fixtures/CHANGELOG.md'),
        contents: Buffer.from('')
      }))

      stream.end()
    })
  })

  describe('stream', function () {
    before(function (done) {
      writeFileSync('test1', '')
      exec('git add --all && git commit -m"feat(module): amazing new module"')

      done()
    })

    it('should prepend the log', function (cb) {
      const stream = conventionalChangelog({
        preset: 'angular'
      })

      const fakeStream = through()
      fakeStream.write(Buffer.from('CHANGELOG'))
      fakeStream.end()

      stream.on('data', function (file) {
        file.contents
          .pipe(concat(function (data) {
            expect(data.toString()).to.match(/### Features[\w\W]*module:[\w\W]*amazing new module.[\w\W]*CHANGELOG$/)
            cb()
          }))
      })

      stream.write(new Vinyl({
        cwd: __dirname,
        base: join(__dirname, 'fixtures'),
        path: join(__dirname, 'fixtures/CHANGELOG.md'),
        contents: fakeStream
      }))

      stream.end()
    })

    it('should append the log', function (cb) {
      const stream = conventionalChangelog({
        preset: 'angular',
        append: true
      })

      const fakeStream = through()
      fakeStream.write(Buffer.from('CHANGELOG'))
      fakeStream.end()

      stream.on('data', function (file) {
        file.contents
          .pipe(concat(function (data) {
            expect(data.toString()).to.match(/CHANGELOG[\w\W]*### Features[\w\W]*module:[\w\W]*amazing new module/)
            cb()
          }))
      })

      stream.write(new Vinyl({
        cwd: __dirname,
        base: join(__dirname, 'fixtures'),
        path: join(__dirname, 'fixtures/CHANGELOG.md'),
        contents: fakeStream
      }))

      stream.end()
    })

    it('should generate all blocks', function (cb) {
      const stream = conventionalChangelog({
        preset: 'angular',
        releaseCount: 0
      })

      const fakeStream = through()

      stream.on('data', function (file) {
        file.contents
          .pipe(concat(function (data) {
            expect(data.toString()).to.match(/[\w\W]*### Features[\w\W]*module:[\w\W]*amazing new module/)
            cb()
          }))
      })

      stream.write(new Vinyl({
        cwd: __dirname,
        base: join(__dirname, 'fixtures'),
        path: join(__dirname, 'fixtures/CHANGELOG.md'),
        contents: fakeStream
      }))

      stream.end()
    })
  })

  describe('buffer', function () {
    it('should prepend the log', function (cb) {
      const stream = conventionalChangelog({
        preset: 'angular'
      })

      stream.on('data', function (file) {
        expect(file.contents.toString()).to.match(/### Features[\w\W]*module:[\w\W]*amazing new module.[\w\W]*CHANGELOG$/)
      })

      stream.on('end', cb)

      stream.write(new Vinyl({
        cwd: __dirname,
        base: join(__dirname, 'fixtures'),
        path: join(__dirname, 'fixtures/CHANGELOG.md'),
        contents: Buffer.from('CHANGELOG')
      }))

      stream.end()
    })

    it('should append the log', function (cb) {
      const stream = conventionalChangelog({
        preset: 'angular',
        append: true
      })

      stream.on('data', function (file) {
        expect(file.contents.toString()).to.match(/CHANGELOG[\w\W]*### Features[\w\W]*module:[\w\W]*amazing new module/)
      })

      stream.on('end', cb)

      stream.write(new Vinyl({
        cwd: __dirname,
        base: join(__dirname, 'fixtures'),
        path: join(__dirname, 'fixtures/CHANGELOG.md'),
        contents: Buffer.from('CHANGELOG')
      }))

      stream.end()
    })

    it('should generate all blocks', function (cb) {
      const stream = conventionalChangelog({
        preset: 'angular',
        releaseCount: 0
      })

      stream.on('data', function (file) {
        expect(file.contents.toString()).to.match(/[\w\W]*### Features[\w\W]*module:[\w\W]*amazing new module/)
      })

      stream.on('end', cb)

      stream.write(new Vinyl({
        cwd: __dirname,
        base: join(__dirname, 'fixtures'),
        path: join(__dirname, 'fixtures/CHANGELOG.md'),
        contents: Buffer.from('CHANGELOG')
      }))

      stream.end()
    })

    it('output encoding should always be buffer', function (cb) {
      exec('git tag v0.0.0')
      const stream = conventionalChangelog({
        preset: 'angular'
      }, {
        version: '0.0.0'
      })

      stream.on('data', function (file) {
        expect(file.contents.toString()).to.equal('CHANGELOG')
      })

      stream.on('end', cb)

      stream.write(new Vinyl({
        cwd: __dirname,
        base: join(__dirname, 'fixtures'),
        path: join(__dirname, 'fixtures/CHANGELOG.md'),
        contents: Buffer.from('CHANGELOG')
      }))

      stream.end()
    })
  })

  describe('null', function () {
    it('should let null files pass through', function (done) {
      const stream = conventionalChangelog()
      let n = 0

      stream.pipe(through.obj(function (file, enc, cb) {
        expect(file.path).to.equal('null.md')
        expect(file.contents).to.equal(null)
        n++

        cb()
      }, function () {
        expect(n).to.equal(1)
        done()
      }))

      stream.write(new Vinyl({
        path: 'null.md',
        contents: null
      }))

      stream.end()
    })
  })

  it('should verbose', function (cb) {
    const stream = conventionalChangelog({
      verbose: true
    })

    stream.on('error', function () {
      console.log('You should see your git-log command')
      cb()
    })

    stream.write(new Vinyl({
      cwd: __dirname,
      base: join(__dirname, 'fixtures'),
      path: join(__dirname, 'fixtures/CHANGELOG.md'),
      contents: Buffer.from('CHANGELOG')
    }))

    stream.end()
  })
})
