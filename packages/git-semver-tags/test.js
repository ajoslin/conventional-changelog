'use strict'
const path = require('path')
const fs = require('fs')
const assert = require('assert')
const tmp = require('tmp')
const gitSemverTags = require('./')
const { gitInit, gitDummyCommit, exec } = require('../../tools/test-tools')
const writeFileSync = fs.writeFileSync

tmp.setGracefulCleanup()
const oldDir = process.cwd()

describe('git-semver-tags', function () {
  before(function () {
    const tmpDir = tmp.dirSync()
    process.chdir(tmpDir.name)
    gitInit()
  })

  after(() => {
    process.chdir(oldDir)
  })

  it('should error if no commits found', function (done) {
    gitSemverTags(function (err) {
      assert(err)

      done()
    })
  })

  it('should get no semver tags', function (done) {
    writeFileSync('test1', '')
    exec('git add --all && git commit -m"First commit"')
    exec('git tag foo')

    gitSemverTags(function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, [])

      done()
    })
  })

  it('should get the semver tag', function (done) {
    writeFileSync('test2', '')
    exec('git add --all && git commit -m"Second commit"')
    exec('git tag v2.0.0')
    writeFileSync('test3', '')
    exec('git add --all && git commit -m"Third commit"')
    exec('git tag va.b.c')

    gitSemverTags(function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['v2.0.0'])

      done()
    })
  })

  it('should get both semver tags', function (done) {
    exec('git tag v3.0.0')

    gitSemverTags(function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['v3.0.0', 'v2.0.0'])

      done()
    })
  })

  it('should get all semver tags if two tags on the same commit', function (done) {
    exec('git tag v4.0.0')

    gitSemverTags(function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['v4.0.0', 'v3.0.0', 'v2.0.0'])

      done()
    })
  })

  it('should still work if I run it again', function (done) {
    gitSemverTags(function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['v4.0.0', 'v3.0.0', 'v2.0.0'])

      done()
    })
  })

  it('should be in reverse chronological order', function (done) {
    writeFileSync('test4', '')
    exec('git add --all && git commit -m"Fourth commit"')
    exec('git tag v1.0.0')

    gitSemverTags(function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['v1.0.0', 'v4.0.0', 'v3.0.0', 'v2.0.0'])

      done()
    })
  })

  it('should work with prerelease', function (done) {
    writeFileSync('test5', '')
    exec('git add --all && git commit -m"Fifth commit"')
    exec('git tag 5.0.0-pre')

    gitSemverTags(function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['5.0.0-pre', 'v1.0.0', 'v4.0.0', 'v3.0.0', 'v2.0.0'])

      done()
    })
  })

  it('should work with empty commit', function (done) {
    const tmpDir = tmp.dirSync()
    process.chdir(tmpDir.name)
    gitInit()
    gitDummyCommit('empty commit')
    exec('git tag v1.1.0')
    exec('git tag blarg-project@1.0.0') // should be ignored.
    gitDummyCommit('empty commit2')
    gitDummyCommit('empty commit3')

    gitSemverTags(function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['v1.1.0'])

      done()
    })
  })

  it('should work with lerna style tags', function (done) {
    writeFileSync('test5', '2')
    exec('git add --all && git commit -m"sixth commit"')
    exec('git tag foo-project@4.0.0')
    writeFileSync('test5', '3')
    exec('git add --all && git commit -m"seventh commit"')
    exec('git tag foo-project@5.0.0')

    gitSemverTags({ lernaTags: true }, function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['foo-project@5.0.0', 'foo-project@4.0.0', 'blarg-project@1.0.0'])
      done()
    })
  })

  it('should work with lerna style tags with multiple digits', function (done) {
    writeFileSync('test5', '4')
    exec('git add --all && git commit -m"fifth commit"')
    exec('git tag foobar-project@0.0.10')
    writeFileSync('test5', '5')
    exec('git add --all && git commit -m"sixth commit"')
    exec('git tag foobar-project@0.10.0')
    writeFileSync('test5', '6')
    exec('git add --all && git commit -m"seventh commit"')
    exec('git tag foobar-project@10.0.0')

    gitSemverTags({ lernaTags: true }, function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['foobar-project@10.0.0', 'foobar-project@0.10.0', 'foobar-project@0.0.10', 'foo-project@5.0.0', 'foo-project@4.0.0', 'blarg-project@1.0.0'])
      done()
    })
  })

  it('should allow lerna style tags to be filtered by package', function (done) {
    writeFileSync('test5', '')
    exec('git add --all && git commit -m"seventh commit"')
    exec('git tag bar-project@5.0.0')

    gitSemverTags({ lernaTags: true, package: 'bar-project' }, function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['bar-project@5.0.0'])
      done()
    })
  })

  it('should not allow package filter without lernaTags=true', function (done) {
    gitSemverTags({ package: 'bar-project' }, function (err) {
      assert.deepStrictEqual(err.message, 'opts.package should only be used when running in lerna mode')
      done()
    })
  })

  it('should work with tag prefix option', function (done) {
    writeFileSync('test6', '')
    exec('git add --all && git commit -m"eigth commit"')
    exec('git tag ms/6.0.0')
    writeFileSync('test6', '1')
    exec('git add --all && git commit -m"tenth commit"')
    exec('git tag ms/7.0.0')
    writeFileSync('test6', '2')
    exec('git add --all && git commit -m"eleventh commit"')
    exec('git tag notms/7.0.0')

    gitSemverTags({ tagPrefix: 'ms/' }, function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['ms/7.0.0', 'ms/6.0.0'])
      done()
    })
  })

  it('should skip unstable tags', function (done) {
    writeFileSync('test7', '')
    exec('git add --all && git commit -m"twelfth commit"')
    exec('git tag skip/8.0.0')
    writeFileSync('test8', '')
    exec('git add --all && git commit -m"thirteenth commit"')
    exec('git tag skip/9.0.0-alpha.1')
    writeFileSync('test9', '')
    exec('git add --all && git commit -m"fourteenth commit"')
    exec('git tag skip/9.0.0-rc.1')
    writeFileSync('test10', '')
    exec('git add --all && git commit -m"fifteenth commit"')
    exec('git tag skip/9.0.0')

    gitSemverTags({ tagPrefix: 'skip/', skipUnstable: true }, function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['skip/9.0.0', 'skip/8.0.0'])
      done()
    })
  })
})

describe('git semver tags on different cwd', function () {
  it('getting semver tag on cwd', (done) => {
    const tmpDir = tmp.dirSync()
    process.chdir(tmpDir.name)
    fs.mkdirSync('foobar')
    process.chdir('foobar')
    gitInit()

    writeFileSync('test2', '')
    exec('git add --all && git commit -m "First commit"')
    exec('git tag v1.1.0')

    process.chdir(tmpDir.name)

    const cwd = path.join(tmpDir.name, 'foobar')
    gitSemverTags({ cwd: cwd }, function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['v1.1.0'])
      done()
    })
  })
})
