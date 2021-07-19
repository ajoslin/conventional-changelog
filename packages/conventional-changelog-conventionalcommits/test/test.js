'use strict'
const conventionalChangelogCore = require('conventional-changelog-core')
const getPreset = require('../')
const preset = getPreset()
const expect = require('chai').expect
const through = require('through2')
const path = require('path')
const fs = require('fs')
const tmp = require('tmp')
const { gitInit, gitDummyCommit, exec } = require('../../../tools/test-tools')
const betterThanBefore = require('better-than-before')()
const preparing = betterThanBefore.preparing

betterThanBefore.setups([
  function () {
    const tmpDir = tmp.dirSync()
    process.chdir(tmpDir.name)
    gitInit()
    fs.writeFileSync('package.json', JSON.stringify({
      name: 'conventional-changelog-core',
      repository: {
        type: 'git',
        url: 'https://github.com/conventional-changelog/conventional-changelog.git'
      }
    }))
    gitDummyCommit(['build!: first build setup', 'BREAKING CHANGE: New build system.'])
    gitDummyCommit(['ci(travis): add TravisCI pipeline', 'BREAKING CHANGE: Continuously integrated.'])
    gitDummyCommit(['Feat: amazing new module', 'BREAKING CHANGE: Not backward compatible.'])
    gitDummyCommit(['Fix(compile): avoid a bug', 'BREAKING CHANGE: The Change is huge.'])
    gitDummyCommit(['perf(ngOptions): make it faster', ' closes #1, #2'])
    gitDummyCommit(['fix(changelog): proper issue links', ' see #1, conventional-changelog/standard-version#358'])
    gitDummyCommit('revert(ngOptions): bad commit')
    gitDummyCommit('fix(*): oops')
    gitDummyCommit(['fix(changelog): proper issue links', ' see GH-1'])
    gitDummyCommit(['feat(awesome): adress EXAMPLE-1'])
    gitDummyCommit(['chore(deps): upgrade example from 1 to 2'])
    gitDummyCommit(['chore(release): release 0.0.0'])
  },
  function () {
    gitDummyCommit(['feat(awesome): addresses the issue brought up in #133'])
  },
  function () {
    gitDummyCommit(['feat(awesome): fix #88'])
  },
  function () {
    gitDummyCommit(['feat(awesome): issue brought up by @bcoe! on Friday'])
  },
  function () {
    gitDummyCommit(['build(npm): edit build script', 'BREAKING CHANGE: The Change is huge.'])
    gitDummyCommit(['ci(travis): setup travis', 'BREAKING CHANGE: The Change is huge.'])
    gitDummyCommit(['docs(readme): make it clear', 'BREAKING CHANGE: The Change is huge.'])
    gitDummyCommit(['style(whitespace): make it easier to read', 'BREAKING CHANGE: The Change is huge.'])
    gitDummyCommit(['refactor(code): change a lot of code', 'BREAKING CHANGE: The Change is huge.'])
    gitDummyCommit(['test(*)!: more tests', 'BREAKING CHANGE: The Change is huge.'])
  },
  function () {
    exec('git tag v0.1.0')
    gitDummyCommit('feat: some more feats')
  },
  function () {
    exec('git tag v0.2.0')
    gitDummyCommit('feature: some more features')
  },
  function () {
    gitDummyCommit(['feat(*): implementing #5 by @dlmr', ' closes #10'])
  },
  function () {
    gitDummyCommit(['fix: use npm@5 (@username)'])
    gitDummyCommit(['build(deps): bump @dummy/package from 7.1.2 to 8.0.0', 'BREAKING CHANGE: The Change is huge.'])
    gitDummyCommit([
      'feat: complex new feature',
      'this is a complex new feature with many reviewers',
      'Reviewer: @hutson',
      'Fixes: #99',
      'Refs: #100',
      'BREAKING CHANGE: this completely changes the API'
    ])
    gitDummyCommit(['FEAT(foo)!: incredible new flag FIXES: #33'])
  },
  function () {
    gitDummyCommit(['Revert \\"feat: default revert format\\"', 'This reverts commit 1234.'])
    gitDummyCommit(['revert: feat: custom revert format', 'This reverts commit 5678.'])
  },
  function () {
    gitDummyCommit([
      'chore: release at different version',
      'Release-As: v3.0.2'
    ])
  }
])

describe('conventionalcommits.org preset', function () {
  it('should work if there is no semver tag', function (done) {
    preparing(1)

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()

        expect(chunk).to.include('first build setup')
        expect(chunk).to.include('**travis:** add TravisCI pipeline')
        expect(chunk).to.include('**travis:** Continuously integrated.')
        expect(chunk).to.include('amazing new module')
        expect(chunk).to.include('**compile:** avoid a bug')
        expect(chunk).to.include('make it faster')
        expect(chunk).to.include(', closes [#1](https://github.com/conventional-changelog/conventional-changelog/issues/1) [#2](https://github.com/conventional-changelog/conventional-changelog/issues/2)')
        expect(chunk).to.include('New build system.')
        expect(chunk).to.include('Not backward compatible.')
        expect(chunk).to.include('**compile:** The Change is huge.')
        expect(chunk).to.include('Build System')
        expect(chunk).to.include('Continuous Integration')
        expect(chunk).to.include('Features')
        expect(chunk).to.include('Bug Fixes')
        expect(chunk).to.include('Performance Improvements')
        expect(chunk).to.include('Reverts')
        expect(chunk).to.include('bad commit')
        expect(chunk).to.include('BREAKING CHANGE')

        expect(chunk).to.not.include('ci')
        expect(chunk).to.not.include('feat')
        expect(chunk).to.not.include('fix')
        expect(chunk).to.not.include('perf')
        expect(chunk).to.not.include('revert')
        expect(chunk).to.not.include('***:**')
        expect(chunk).to.not.include(': Not backward compatible.')

        // CHANGELOG should group sections in order of importance:
        expect(
          chunk.indexOf('BREAKING CHANGE') < chunk.indexOf('Features') &&
          chunk.indexOf('Features') < chunk.indexOf('Bug Fixes') &&
          chunk.indexOf('Bug Fixes') < chunk.indexOf('Performance Improvements') &&
          chunk.indexOf('Performance Improvements') < chunk.indexOf('Reverts')
        ).to.equal(true)

        done()
      }))
  })

  it('should not list breaking change twice if ! is used', function (done) {
    preparing(1)

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()
        expect(chunk).to.not.match(/\* first build setup\r?\n/)
        done()
      }))
  })

  it('should allow alternative "types" configuration to be provided', function (done) {
    preparing(1)
    conventionalChangelogCore({
      config: require('../')({
        types: []
      })
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()

        expect(chunk).to.include('first build setup')
        expect(chunk).to.include('**travis:** add TravisCI pipeline')
        expect(chunk).to.include('**travis:** Continuously integrated.')
        expect(chunk).to.include('amazing new module')
        expect(chunk).to.include('**compile:** avoid a bug')
        expect(chunk).to.include('Feat')

        expect(chunk).to.not.include('make it faster')
        expect(chunk).to.not.include('Reverts')
        done()
      }))
  })

  it('should allow matching "scope" to configuration', function (done) {
    preparing(1)
    conventionalChangelogCore({
      config: require('../')({
        types: [
          { type: 'chore', scope: 'deps', section: 'Dependencies' }
        ]
      })
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()

        expect(chunk).to.include('### Dependencies')
        expect(chunk).to.include('**deps:** upgrade example from 1 to 2')

        expect(chunk).to.not.include('release 0.0.0')
        done()
      }))
  })

  it('should properly format external repository issues', function (done) {
    preparing(1)
    conventionalChangelogCore({
      config: preset
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()
        expect(chunk).to.include('[#1](https://github.com/conventional-changelog/conventional-changelog/issues/1)')
        expect(chunk).to.include('[conventional-changelog/standard-version#358](https://github.com/conventional-changelog/standard-version/issues/358)')
        done()
      }))
  })

  it('should properly format external repository issues given an `issueUrlFormat`', function (done) {
    preparing(1)
    conventionalChangelogCore({
      config: getPreset({
        issuePrefixes: ['#', 'GH-'],
        issueUrlFormat: 'issues://{{repository}}/issues/{{id}}'
      })
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()
        expect(chunk).to.include('[#1](issues://conventional-changelog/issues/1)')
        expect(chunk).to.include('[conventional-changelog/standard-version#358](issues://standard-version/issues/358)')
        expect(chunk).to.include('[GH-1](issues://conventional-changelog/issues/1)')
        done()
      }))
  })

  it('should properly format issues in external issue tracker given an `issueUrlFormat` with `prefix`', function (done) {
    preparing(1)
    conventionalChangelogCore({
      config: getPreset({
        issueUrlFormat: 'https://example.com/browse/{{prefix}}{{id}}',
        issuePrefixes: ['EXAMPLE-']
      })
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()
        expect(chunk).to.include('[EXAMPLE-1](https://example.com/browse/EXAMPLE-1)')
        done()
      }))
  })

  it('should replace #[0-9]+ with GitHub format issue URL by default', function (done) {
    preparing(2)

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()
        expect(chunk).to.include('[#133](https://github.com/conventional-changelog/conventional-changelog/issues/133)')
        done()
      }))
  })

  it('should remove the issues that already appear in the subject', function (done) {
    preparing(3)

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()
        expect(chunk).to.include('[#88](https://github.com/conventional-changelog/conventional-changelog/issues/88)')
        expect(chunk).to.not.include('closes [#88](https://github.com/conventional-changelog/conventional-changelog/issues/88)')
        done()
      }))
  })

  it('should replace @user with configured userUrlFormat', function (done) {
    preparing(4)

    conventionalChangelogCore({
      config: require('../')({
        userUrlFormat: 'https://foo/{{user}}'
      })
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()
        expect(chunk).to.include('[@bcoe](https://foo/bcoe)')
        done()
      }))
  })

  it('should not discard commit if there is BREAKING CHANGE', function (done) {
    preparing(5)

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()

        expect(chunk).to.include('Continuous Integration')
        expect(chunk).to.include('Build System')
        expect(chunk).to.include('Documentation')
        expect(chunk).to.include('Styles')
        expect(chunk).to.include('Code Refactoring')
        expect(chunk).to.include('Tests')

        done()
      }))
  })

  it('should omit optional ! in breaking commit', function (done) {
    preparing(5)

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()

        expect(chunk).to.include('### Tests')
        expect(chunk).to.include('* more tests')

        done()
      }))
  })

  it('should work if there is a semver tag', function (done) {
    preparing(6)
    let i = 0

    conventionalChangelogCore({
      config: preset,
      outputUnreleased: true
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk, enc, cb) {
        chunk = chunk.toString()

        expect(chunk).to.include('some more feats')
        expect(chunk).to.not.include('BREAKING')

        i++
        cb()
      }, function () {
        expect(i).to.equal(1)
        done()
      }))
  })

  it('should support "feature" as alias for "feat"', function (done) {
    preparing(7)
    let i = 0

    conventionalChangelogCore({
      config: preset,
      outputUnreleased: true
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk, enc, cb) {
        chunk = chunk.toString()

        expect(chunk).to.include('some more features')
        expect(chunk).to.not.include('BREAKING')

        i++
        cb()
      }, function () {
        expect(i).to.equal(1)
        done()
      }))
  })

  it('should work with unknown host', function (done) {
    preparing(7)
    let i = 0

    conventionalChangelogCore({
      config: require('../')({
        commitUrlFormat: 'http://unknown/commit/{{hash}}',
        compareUrlFormat: 'http://unknown/compare/{{previousTag}}...{{currentTag}}'
      }),
      pkg: {
        path: path.join(__dirname, 'fixtures/_unknown-host.json')
      }
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk, enc, cb) {
        chunk = chunk.toString()

        expect(chunk).to.include('(http://unknown/compare')
        expect(chunk).to.include('](http://unknown/commit/')

        i++
        cb()
      }, function () {
        expect(i).to.equal(1)
        done()
      }))
  })

  it('should work specifying where to find a package.json using conventional-changelog-core', function (done) {
    preparing(8)
    let i = 0

    conventionalChangelogCore({
      config: preset,
      pkg: {
        path: path.join(__dirname, 'fixtures/_known-host.json')
      }
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk, enc, cb) {
        chunk = chunk.toString()

        expect(chunk).to.include('(https://github.com/conventional-changelog/example/compare')
        expect(chunk).to.include('](https://github.com/conventional-changelog/example/commit/')
        expect(chunk).to.include('](https://github.com/conventional-changelog/example/issues/')

        i++
        cb()
      }, function () {
        expect(i).to.equal(1)
        done()
      }))
  })

  it('should fallback to the closest package.json when not providing a location for a package.json', function (done) {
    preparing(8)
    let i = 0

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function (err) {
        console.info(err)
        done(err)
      })
      .pipe(through(function (chunk, enc, cb) {
        chunk = chunk.toString()

        expect(chunk).to.include('(https://github.com/conventional-changelog/conventional-changelog/compare')
        expect(chunk).to.include('](https://github.com/conventional-changelog/conventional-changelog/commit/')
        expect(chunk).to.include('](https://github.com/conventional-changelog/conventional-changelog/issues/')

        i++
        cb()
      }, function () {
        expect(i).to.equal(1)
        done()
      }))
  })

  it('should support non public GitHub repository locations', function (done) {
    preparing(8)

    conventionalChangelogCore({
      config: preset,
      pkg: {
        path: path.join(__dirname, 'fixtures/_ghe-host.json')
      }
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()

        expect(chunk).to.include('(https://github.internal.example.com/dlmr')
        expect(chunk).to.include('(https://github.internal.example.com/conventional-changelog/internal/compare')
        expect(chunk).to.include('](https://github.internal.example.com/conventional-changelog/internal/commit/')
        expect(chunk).to.include('5](https://github.internal.example.com/conventional-changelog/internal/issues/5')
        expect(chunk).to.include(' closes [#10](https://github.internal.example.com/conventional-changelog/internal/issues/10)')

        done()
      }))
  })

  it('should only replace with link to user if it is an username', function (done) {
    preparing(9)

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()

        expect(chunk).to.not.include('(https://github.com/5')
        expect(chunk).to.include('(https://github.com/username')

        expect(chunk).to.not.include('[@dummy](https://github.com/dummy)/package')
        expect(chunk).to.include('bump @dummy/package from')
        done()
      }))
  })

  it('supports multiple lines of footer information', function (done) {
    preparing(9)

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()
        expect(chunk).to.include('closes [#99]')
        expect(chunk).to.include('[#100]')
        expect(chunk).to.include('this completely changes the API')
        done()
      }))
  })

  it('does not require that types are case sensitive', function (done) {
    preparing(9)

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()
        expect(chunk).to.include('incredible new flag')
        done()
      }))
  })

  it('populates breaking change if ! is present', function (done) {
    preparing(9)

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()
        expect(chunk).to.match(/incredible new flag FIXES: #33\r?\n/)
        done()
      }))
  })

  it('parses both default (Revert "<subject>") and custom (revert: <subject>) revert commits', function (done) {
    preparing(10)

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()
        expect(chunk).to.match(/custom revert format/)
        expect(chunk).to.match(/default revert format/)
        done()
      }))
  })
  it('should include commits with "Release-As:" footer in CHANGELOG', function (done) {
    preparing(11)

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()
        expect(chunk).to.match(/release at different version/)
        done()
      }))
  })
})
