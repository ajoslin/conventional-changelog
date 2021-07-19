'use strict'
const conventionalChangelogCore = require('conventional-changelog-core')
const config = require('../')
const expect = require('chai').expect
const through = require('through2')
const tmp = require('tmp')
const { gitInit, gitDummyCommit } = require('../../../tools/test-tools')

tmp.setGracefulCleanup()
const oldDir = process.cwd()

describe('ember preset', function () {
  beforeEach(() => {
    const tmpDir = tmp.dirSync()
    process.chdir(tmpDir.name)
    gitInit()

    gitDummyCommit(['Merge pull request #12001 from rwjblue/remove-with-controller', '[CLEANUP beta] Remove {{with}} keyword\'s controller option. Closes #1'])
    gitDummyCommit(['Merge pull request #11984 from emberjs/fix-each', '[PERF beta] `@each` should remain a stable node for chains.'])
    gitDummyCommit(['Merge pull request #11970 from pixelhandler/ember-rfc-80', '[DOC Release] Make ArrayProxy public'])
    gitDummyCommit(['Merge pull request #12010 from duggiefresh/12004-doc-array-methods', '[DOC release] Mark `Ember.Array` methods as public'])
    gitDummyCommit(['Merge pull request #12017 from rwjblue/deprecate-render-function', '[BUGFIX release] Deprecate specifying `.render` to views/components.'])
    gitDummyCommit(['Merge pull request #11968 from jayphelps/remove-ember-views-component-block-info', '[FEATURE ember-views-component-block-param-info] remove feature info and unflag tests'])
    gitDummyCommit(['Merge pull request #1000 from jayphelps/remove-ember-views-component-block-info', '[SECURITY CVE-2014-0013] Ensure primitive value contexts are escaped.'])
    gitDummyCommit('Bad commit')
    gitDummyCommit('Merge pull request #2000000 from jayphelps/remove-ember-views-component-block-info')
  })

  afterEach(() => {
    process.chdir(oldDir)
  })

  it('should work if there is no semver tag', function (done) {
    conventionalChangelogCore({
      config: config
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()

        expect(chunk).to.include('[12001]')
        expect(chunk).to.include('Remove {{with}} keyword\'s controller option.')
        expect(chunk).to.include('Release')
        expect(chunk).to.include('### Bug Fixes')
        expect(chunk).to.include('### Cleanup')
        expect(chunk).to.include('### Features')
        expect(chunk).to.include('### Documentation')
        expect(chunk).to.include('### Security')

        expect(chunk).to.not.include('CLEANUP')
        expect(chunk).to.not.include('FEATURE')
        expect(chunk).to.not.include('Bad')

        done()
      }))
  })
})
