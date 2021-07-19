'use strict'

const path = require('path')
const assert = require('assert')
const gitSemverTags = require('./')
const shell = require('shelljs')
const writeFileSync = require('fs').writeFileSync
const gitDummyCommit = require('git-dummy-commit')

describe('git-semver-tags', function () {
  before(function () {
    shell.config.resetForTesting()
    shell.cd(__dirname)
    shell.rm('-rf', 'tmp')
    shell.mkdir('tmp')
    shell.cd('tmp')
    shell.exec('git init')
  })

  it('should error if no commits found', function (done) {
    gitSemverTags(function (err) {
      assert(err)

      done()
    })
  })

  it('should get no semver tags', function (done) {
    writeFileSync('test1', '')
    shell.exec('git add --all && git commit -m"First commit"')
    shell.exec('git tag foo')

    gitSemverTags(function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, [])

      done()
    })
  })

  it('should get the semver tag', function (done) {
    writeFileSync('test2', '')
    shell.exec('git add --all && git commit -m"Second commit"')
    shell.exec('git tag v2.0.0')
    writeFileSync('test3', '')
    shell.exec('git add --all && git commit -m"Third commit"')
    shell.exec('git tag va.b.c')

    gitSemverTags(function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['v2.0.0'])

      done()
    })
  })

  it('should get both semver tags', function (done) {
    shell.exec('git tag v3.0.0')

    gitSemverTags(function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['v3.0.0', 'v2.0.0'])

      done()
    })
  })

  it('should get all semver tags if two tags on the same commit', function (done) {
    shell.exec('git tag v4.0.0')

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
    shell.exec('git add --all && git commit -m"Fourth commit"')
    shell.exec('git tag v1.0.0')

    gitSemverTags(function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['v1.0.0', 'v4.0.0', 'v3.0.0', 'v2.0.0'])

      done()
    })
  })

  it('should work with prerelease', function (done) {
    writeFileSync('test5', '')
    shell.exec('git add --all && git commit -m"Fifth commit"')
    shell.exec('git tag 5.0.0-pre')

    gitSemverTags(function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['5.0.0-pre', 'v1.0.0', 'v4.0.0', 'v3.0.0', 'v2.0.0'])

      done()
    })
  })

  it('should work with empty commit', function (done) {
    shell.rm('-rf', '.git')
    shell.exec('git init')
    gitDummyCommit('empty commit')
    shell.exec('git tag v1.1.0')
    shell.exec('git tag blarg-project@1.0.0') // should be ignored.
    gitDummyCommit('empty commit2')
    gitDummyCommit('empty commit3')

    gitSemverTags(function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['v1.1.0'])

      done()
    })
  })

  it('should work with lerna style tags', function (done) {
    writeFileSync('test5', '')
    shell.exec('git add --all && git commit -m"sixth commit"')
    shell.exec('git tag foo-project@4.0.0')
    shell.exec('git add --all && git commit -m"seventh commit"')
    shell.exec('git tag foo-project@5.0.0')

    gitSemverTags({ lernaTags: true }, function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['foo-project@5.0.0', 'foo-project@4.0.0', 'blarg-project@1.0.0'])
      done()
    })
  })

  it('should work with lerna style tags with multiple digits', function (done) {
    writeFileSync('test5', '')
    shell.exec('git add --all && git commit -m"fifth commit"')
    shell.exec('git tag foobar-project@0.0.10')
    shell.exec('git add --all && git commit -m"sixth commit"')
    shell.exec('git tag foobar-project@0.10.0')
    shell.exec('git add --all && git commit -m"seventh commit"')
    shell.exec('git tag foobar-project@10.0.0')

    gitSemverTags({ lernaTags: true }, function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['foobar-project@10.0.0', 'foobar-project@0.10.0', 'foobar-project@0.0.10', 'foo-project@5.0.0', 'foo-project@4.0.0', 'blarg-project@1.0.0'])
      done()
    })
  })

  it('should allow lerna style tags to be filtered by package', function (done) {
    writeFileSync('test5', '')
    shell.exec('git add --all && git commit -m"seventh commit"')
    shell.exec('git tag bar-project@5.0.0')

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
    shell.exec('git add --all && git commit -m"eigth commit"')
    shell.exec('git tag ms/6.0.0')
    shell.exec('git add --all && git commit -m"tenth commit"')
    shell.exec('git tag ms/7.0.0')
    shell.exec('git add --all && git commit -m"eleventh commit"')
    shell.exec('git tag notms/7.0.0')

    gitSemverTags({ tagPrefix: 'ms/' }, function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['ms/7.0.0', 'ms/6.0.0'])
      done()
    })
  })

  it('should skip unstable tags', function (done) {
    writeFileSync('test7', '')
    shell.exec('git add --all && git commit -m"twelfth commit"')
    shell.exec('git tag skip/8.0.0')
    writeFileSync('test8', '')
    shell.exec('git add --all && git commit -m"thirteenth commit"')
    shell.exec('git tag skip/9.0.0-alpha.1')
    writeFileSync('test9', '')
    shell.exec('git add --all && git commit -m"fourteenth commit"')
    shell.exec('git tag skip/9.0.0-rc.1')
    writeFileSync('test10', '')
    shell.exec('git add --all && git commit -m"fifteenth commit"')
    shell.exec('git tag skip/9.0.0')

    gitSemverTags({ tagPrefix: 'skip/', skipUnstable: true }, function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['skip/9.0.0', 'skip/8.0.0'])
      done()
    })
  })
})

describe('git semver tags on different cwd', function () {
  it('getting semver tag on cwd', (done) => {
    shell.config.resetForTesting()
    shell.cd(__dirname)
    shell.rm('-rf', 'tmp')
    shell.mkdir('tmp')
    shell.cd('tmp')
    shell.mkdir('foobar')
    shell.cd('foobar')
    shell.exec('git init')

    writeFileSync('test2', '')
    shell.exec('git add --all && git commit -m "First commit"')
    shell.exec('git tag v1.1.0')

    shell.cd('cd ' + path.join(__dirname, 'tmp'))

    const cwd = path.join(__dirname, 'tmp', 'foobar')
    gitSemverTags({ cwd: cwd }, function (err, tags) {
      if (err) done(err)
      assert.deepStrictEqual(tags, ['v1.1.0'])
      done()
    })
  })
})
