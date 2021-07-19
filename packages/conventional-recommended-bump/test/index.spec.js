'use strict'

const assert = require('assert')
const betterThanBefore = require('better-than-before')()
const conventionalRecommendedBump = require('../index')
const fs = require('fs')
const tmp = require('tmp')
const { gitInit, gitDummyCommit, exec } = require('../../../tools/test-tools')

const preparing = betterThanBefore.preparing

betterThanBefore.setups([
  () => { // 1
    const tmpDir = tmp.dirSync()
    process.chdir(tmpDir.name)
    gitInit()
  },
  () => { // 2
    gitDummyCommit(['feat!: my first commit'])
  },
  () => { // 3
    exec('git tag v1.0.0')
  },
  () => { // 4
    // we need non-empty commit, so we can revert it
    fs.writeFileSync('file1', '')
    exec('git add file1')
    gitDummyCommit(['feat: my second commit'])
  },
  () => { // 5
    exec('git revert HEAD')
  },
  () => { // 6
    gitDummyCommit(['feat: should not be taken into account', 'BREAKING CHANGE: I broke the API'])
    exec('git tag ms/1.0.0')
    gitDummyCommit(['feat: this should have been working'])
  },
  () => { // 7
    exec('git tag my-package@1.0.0')
    gitDummyCommit(['feat: this should have been working'])
  }
])

describe('conventional-recommended-bump API', () => {
  describe('options object', () => {
    it('should throw an error if an \'options\' object is not provided', done => {
      assert.throws(() => conventionalRecommendedBump())
      assert.throws(() => conventionalRecommendedBump('invalid options object'))
      done()
    })
  })

  describe('callback', () => {
    it('should throw an error if no, or an invalid, callback function is provided', done => {
      assert.throws(() => conventionalRecommendedBump({}))
      assert.throws(() => conventionalRecommendedBump({}, {}))
      assert.throws(() => conventionalRecommendedBump({}, {}, {}))
      done()
    })

    it('should allow callback function in the \'parserOpts\' argument spot', done => {
      preparing(1)

      conventionalRecommendedBump({}, err => {
        assert.ok(err)
        done()
      })
    })
  })

  it('should return an error if there are no commits in the repository', done => {
    preparing(1)

    conventionalRecommendedBump({}, {}, err => {
      assert.ok(err)
      done()
    })
  })

  describe('conventionalcommits ! in isolation', () => {
    it('recommends major if ! is used in isolation', done => {
      preparing(2)

      conventionalRecommendedBump({
        preset: {
          name: 'conventionalcommits'
        }
      }, {}, (_, recommendation) => {
        assert.notStrictEqual(recommendation.reason.indexOf('1 BREAKING'), -1)
        assert.strictEqual(recommendation.releaseType, 'major')
        done()
      })
    })
  })

  describe('optional \'whatBump\'', () => {
    it('should throw an error if \'whatBump\' is defined but not a function', done => {
      preparing(2)

      conventionalRecommendedBump({
        whatBump: 'invalid'
      }, {}, err => {
        assert.ok(err)
        assert.strictEqual(err.message, 'whatBump must be a function')
        done()
      })
    })

    it('should return \'{}\' if no \'whatBump\'', done => {
      preparing(2)

      conventionalRecommendedBump({}, {}, (err, recommendation) => {
        if (err) done(err)
        assert.deepStrictEqual(recommendation, {})
        done()
      })
    })

    it('should return \'{}\' if \'whatBump\' returns \'null\'', done => {
      preparing(2)

      conventionalRecommendedBump({
        whatBump: () => { return null }
      }, (err, recommendation) => {
        if (err) done(err)
        assert.deepStrictEqual(recommendation, {})
        done()
      })
    })

    it('should return \'{}\' if \'whatBump\' returns \'undefined\'', done => {
      preparing(2)

      conventionalRecommendedBump({
        whatBump: () => { return undefined }
      }, (err, recommendation) => {
        if (err) done(err)
        assert.deepStrictEqual(recommendation, {})
        done()
      })
    })

    it('should return what is returned by \'whatBump\'', done => {
      preparing(2)

      conventionalRecommendedBump({
        whatBump: () => { return { test: 'test' } }
      }, (err, recommendation) => {
        if (err) done(err)
        assert.deepStrictEqual(recommendation, { test: 'test' })
        done()
      })
    })

    it('should send options to \'whatBump\'', done => {
      preparing(2)

      conventionalRecommendedBump({
        lernaPackage: 'test',
        whatBump: (commits, options) => { return options.lernaPackage }
      }, (err, recommendation) => {
        if (err) done(err)
        assert.deepStrictEqual(recommendation, 'test')
        done()
      })
    })

    it('should return \'releaseType\' as undefined if \'level\' is not valid', done => {
      preparing(2)

      conventionalRecommendedBump({
        whatBump: () => { return { level: 'test' } }
      }, (err, recommendation) => {
        if (err) done(err)
        assert.deepStrictEqual(recommendation, { level: 'test', releaseType: undefined })
        done()
      })
    })
  })

  describe('warn logging', () => {
    it('will ignore \'warn\' option if it\'s not a function', done => {
      preparing(3)

      conventionalRecommendedBump({}, { warn: 'invalid' }, done)
    })

    it('should warn if there is no new commits since last release', done => {
      preparing(3)

      conventionalRecommendedBump({}, {
        warn: warning => {
          assert.strictEqual(warning, 'No commits since last release')
          done()
        }
      }, () => {})
    })
  })

  describe('loading a preset package', () => {
    it('recommends a patch release for a feature when preMajor=true', done => {
      preparing(4)

      conventionalRecommendedBump({
        preset: {
          name: 'conventionalcommits',
          preMajor: true
        }
      }, {}, (_, recommendation) => {
        assert.notStrictEqual(recommendation.reason.indexOf('1 features'), -1)
        assert.strictEqual(recommendation.releaseType, 'patch')
        done()
      })
    })

    it('recommends a minor release for a feature when preMajor=false', done => {
      preparing(4)

      conventionalRecommendedBump({
        preset: {
          name: 'conventionalcommits'
        }
      }, {}, (_, recommendation) => {
        assert.notStrictEqual(recommendation.reason.indexOf('1 features'), -1)
        assert.strictEqual(recommendation.releaseType, 'minor')
        done()
      })
    })

    it('should ignore reverted commits', done => {
      preparing(5)

      conventionalRecommendedBump({
        whatBump: commits => {
          assert.strictEqual(commits.length, 0)
          done()
        }
      }, () => {})
    })

    it('should include reverted commits', done => {
      preparing(5)

      conventionalRecommendedBump({
        ignoreReverted: false,
        whatBump: commits => {
          assert.strictEqual(commits.length, 2)
          done()
        }
      }, () => {})
    })

    it('throws an error if unable to load a preset package', done => {
      preparing(6)

      conventionalRecommendedBump({
        preset: 'does-not-exist'
      }, {}, err => {
        assert.ok(err)
        assert.strictEqual(err.message, 'Unable to load the "does-not-exist" preset package. Please make sure it\'s installed.')
        done()
      })
    })

    it('recommends a minor release for a breaking change when preMajor=true', done => {
      preparing(6)

      conventionalRecommendedBump({
        preset: {
          name: 'conventionalcommits',
          preMajor: true
        }
      }, {}, (_, recommendation) => {
        assert.notStrictEqual(recommendation.reason.indexOf('1 BREAKING'), -1)
        assert.strictEqual(recommendation.releaseType, 'minor')
        done()
      })
    })

    it('recommends a major release for a breaking change when preMajor=false', done => {
      preparing(6)

      conventionalRecommendedBump({
        preset: {
          name: 'conventionalcommits'
        }
      }, {}, (_, recommendation) => {
        assert.notStrictEqual(recommendation.reason.indexOf('1 BREAKING'), -1)
        assert.strictEqual(recommendation.releaseType, 'major')
        done()
      })
    })
  })

  describe('repository with custom tag prefix', () => {
    it('should recommends a minor release if appropriate', done => {
      preparing(6)

      conventionalRecommendedBump({
        tagPrefix: 'ms/',
        whatBump: commits => {
          assert.strictEqual(commits.length, 1)
          assert.strictEqual(commits[0].type, 'feat')
          done()
        }
      }, () => {})
    })
  })

  describe('repository with lerna tags', () => {
    it('should recommend \'major\' version bump when not using lerna tags', done => {
      preparing(7)

      conventionalRecommendedBump({
        whatBump: commits => {
          assert.strictEqual(commits.length, 3)
          done()
        }
      }, () => {})
    })

    it('should recommend \'minor\' version bump when lerna tag option is enabled', done => {
      preparing(7)

      conventionalRecommendedBump({
        lernaPackage: 'my-package',
        whatBump: commits => {
          assert.strictEqual(commits.length, 1)
          assert.strictEqual(commits[0].type, 'feat')
          done()
        }
      }, () => {})
    })
  })
})
