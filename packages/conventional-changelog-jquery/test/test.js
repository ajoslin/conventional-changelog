'use strict'
const conventionalChangelogCore = require('conventional-changelog-core')
const config = require('../')
const expect = require('chai').expect
const gitDummyCommit = require('git-dummy-commit')
const shell = require('shelljs')
const through = require('through2')

describe('jquery preset', function () {
  before(function () {
    shell.config.resetForTesting()
    shell.cd(__dirname)
    shell.rm('-rf', 'tmp')
    shell.mkdir('tmp')
    shell.cd('tmp')
    shell.mkdir('git-templates')
    shell.exec('git init --template=./git-templates')
    gitDummyCommit(['Core: Make jQuery objects iterable'])
    gitDummyCommit(['CSS: Don\'t name the anonymous swap function'])
    gitDummyCommit(['Event: Remove an internal argument to the on method', 'Fixes #2, #4, gh-200'])
    gitDummyCommit(['Manipulation: Remove an internal argument to the remove method', 'Closes #22'])
    gitDummyCommit(['Bad commit'])
    gitDummyCommit(['Core: Create jQuery.ajax', 'Closes gh-100'])
  })

  it('should generate a changelog', function (done) {
    conventionalChangelogCore({
      config: config
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()

        expect(chunk).to.include('Create jQuery.ajax')
        expect(chunk).to.include(', closes [gh-100](https://github.com/conventional-changelog/conventional-changelog/issues/100)')
        expect(chunk).to.include(')\n* Make jQuery objects iterable')
        expect(chunk).to.include('### CSS')
        expect(chunk).to.include('Remove an internal argument to the on method')
        expect(chunk).to.include(', closes [#2](https://bugs.jquery.com/ticket/2) [#4](https://bugs.jquery.com/ticket/4) [gh-200](https://github.com/conventional-changelog/conventional-changelog/issues/200)')
        expect(chunk).to.include('### Manipulation')

        expect(chunk).to.not.include('Bad')

        done()
      }))
  })
})
