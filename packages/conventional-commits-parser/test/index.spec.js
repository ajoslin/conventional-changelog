'use strict'
const conventionalCommitsParser = require('../')
const mocha = require('mocha')
const describe = mocha.describe
const it = mocha.it
const expect = require('chai').expect
const forEach = require('lodash/forEach')
const through = require('through2')

describe('conventionalCommitsParser', function () {
  it('should parse raw commits', function (done) {
    const stream = through()
    const commits = [
      'feat(ng-list): Allow custom separator\n' +
      'bla bla bla\n\n' +
      'Closes #123\nCloses #25\nFixes #33\n',

      'feat(scope): broadcast $destroy event on scope destruction\n' +
      'bla bla bla\n\n' +
      'BREAKING CHANGE: some breaking change\n',

      'fix(zzz): Very cool commit\n' +
      'bla bla bla\n\n' +
      'Closes #2, #3. Resolves #4. Fixes #5. Fixes #6.\n' +
      'What not ?\n',

      'chore(scope with spaces): some chore\n' +
      'bla bla bla\n\n' +
      'BREAKING CHANGE: some other breaking change\n',

      'Revert "throw an error if a callback is passed to animate methods"\n\n' +
      'This reverts commit 9bb4d6ccbe80b7704c6b7f53317ca8146bc103ca.\n\n' +
      '-hash-\n' +
      'd7a40a29214f37d469e57d730dfd042b639d4d1f'
    ]

    forEach(commits, function (commit) {
      stream.write(commit)
    })
    stream.end()

    let i = 0

    stream
      .pipe(conventionalCommitsParser())
      .pipe(through.obj(function (chunk, enc, cb) {
        if (i === 0) {
          expect(chunk.header).to.equal('feat(ng-list): Allow custom separator')
        } else if (i === 1) {
          expect(chunk.notes).to.eql([{
            title: 'BREAKING CHANGE',
            text: 'some breaking change'
          }])
        } else if (i === 2) {
          expect(chunk.header).to.equal('fix(zzz): Very cool commit')
        } else if (i === 3) {
          expect(chunk.header).to.equal('chore(scope with spaces): some chore')
        } else if (i === 4) {
          expect(chunk.revert).to.eql({
            header: 'throw an error if a callback is passed to animate methods',
            hash: '9bb4d6ccbe80b7704c6b7f53317ca8146bc103ca'
          })
        }

        i++
        cb()
      }, function () {
        expect(i).to.equal(5)
        done()
      }))
  })

  it('should ignore malformed commits', function (done) {
    const stream = through()
    const commits = [
      'chore(scope with spaces): some chore\n',

      '\n' +
      ' \n\n',

      'fix(zzz): Very cool commit\n' +
      'bla bla bla\n\n'
    ]

    forEach(commits, function (commit) {
      stream.write(commit)
    })
    stream.end()

    let i = 0

    stream
      .pipe(conventionalCommitsParser())
      .pipe(through.obj(function (chunk, enc, cb) {
        ++i
        cb()
      }, function () {
        expect(i).to.equal(3)
        done()
      }))
  })

  it('should warn if malformed commits found', function (done) {
    const stream = through()
    const commit = ' \n\n'

    stream.write(commit)
    stream.end()

    stream
      .pipe(conventionalCommitsParser({
        warn: function (warning) {
          expect(warning).to.equal('TypeError: Expected a raw commit')
          done()
        }
      }))
      .pipe(through.obj(function (chunk, enc, cb) {
        cb()
      }))
  })

  it('should error if malformed commits found and `options.warn === true`', function (done) {
    const stream = through()
    const commit = ' \n\n'

    stream.write(commit)
    stream.end()

    stream
      .pipe(conventionalCommitsParser({
        warn: true
      }))
      .on('error', function (err) {
        expect(err.toString()).to.equal('TypeError: Expected a raw commit')
        done()
      })
  })

  const commits = [
    'feat(ng-list) Allow custom separator\n' +
    'bla bla bla\n\n' +
    'Fix #123\nCloses #25\nfix #33\n',

    'fix(ng-list) Another custom separator\n' +
    'bla bla bla\n\n' +
    'BREAKING CHANGES: some breaking changes\n'
  ]

  it('should take options', function (done) {
    const stream = through()
    let i = 0

    forEach(commits, function (commit) {
      stream.write(commit)
    })
    stream.end()

    stream
      .pipe(conventionalCommitsParser({
        headerPattern: /^(\w*)(?:\(([\w$.\-* ]*)\))? (.*)$/,
        noteKeywords: ['BREAKING CHANGES'],
        referenceActions: ['fix']
      }))
      .pipe(through.obj(function (chunk, enc, cb) {
        if (i === 0) {
          expect(chunk.type).to.equal('feat')
          expect(chunk.scope).to.equal('ng-list')
          expect(chunk.subject).to.equal('Allow custom separator')
          expect(chunk.references).to.eql([{
            action: 'Fix',
            owner: null,
            repository: null,
            issue: '123',
            raw: '#123',
            prefix: '#'
          }, {
            action: null,
            owner: null,
            repository: null,
            issue: '25',
            raw: 'Closes #25',
            prefix: '#'
          }, {
            action: 'fix',
            owner: null,
            repository: null,
            issue: '33',
            raw: '#33',
            prefix: '#'
          }])
        }
        if (i === 1) {
          expect(chunk.type).to.equal('fix')
          expect(chunk.scope).to.equal('ng-list')
          expect(chunk.subject).to.equal('Another custom separator')
          expect(chunk.notes[0]).to.eql({
            title: 'BREAKING CHANGES',
            text: 'some breaking changes'
          })
        }

        i++
        cb()
      }, function () {
        expect(i).to.equal(2)
        done()
      }))
  })

  it('should take string options', function (done) {
    const stream = through()
    let i = 0

    forEach(commits, function (commit) {
      stream.write(commit)
    })
    stream.write('blabla\n-hash-\n9b1aff905b638aa274a5fc8f88662df446d374bd')
    stream.write('Revert "throw an error if a callback is passed to animate methods"\n\nThis reverts commit 9bb4d6ccbe80b7704c6b7f53317ca8146bc103ca.')
    stream.end()

    stream
      .pipe(conventionalCommitsParser({
        fieldPattern: '^-(.*?)-$',
        headerPattern: '^(\\w*)(?:\\(([\\w\\$\\.\\-\\* ]*)\\))?\\ (.*)$',
        headerCorrespondence: 'subject,type,  scope,',
        issuePrefixes: '#',
        noteKeywords: 'BREAKING CHANGES',
        referenceActions: 'fix',
        revertPattern: '^Revert\\s"([\\s\\S]*)"\\s*This reverts commit (\\w*)\\.',
        mergePattern: '/^Merge pull request #(\\d+) from (.*)$/',
        revertCorrespondence: ' header'
      }))
      .pipe(through.obj(function (chunk, enc, cb) {
        if (i === 0) {
          expect(chunk.subject).to.equal('feat')
          expect(chunk.type).to.equal('ng-list')
          expect(chunk.scope).to.equal('Allow custom separator')
          expect(chunk.references).to.eql([{
            action: 'Fix',
            owner: null,
            repository: null,
            issue: '123',
            raw: '#123',
            prefix: '#'
          }, {
            action: null,
            owner: null,
            repository: null,
            issue: '25',
            raw: 'Closes #25',
            prefix: '#'
          }, {
            action: 'fix',
            owner: null,
            repository: null,
            issue: '33',
            raw: '#33',
            prefix: '#'
          }])
        } else if (i === 1) {
          expect(chunk.type).to.equal('ng-list')
          expect(chunk.scope).to.equal('Another custom separator')
          expect(chunk.subject).to.equal('fix')
          expect(chunk.notes[0]).to.eql({
            title: 'BREAKING CHANGES',
            text: 'some breaking changes'
          })
        } else if (i === 2) {
          expect(chunk.header).to.equal('blabla')
          expect(chunk.hash).to.equal('9b1aff905b638aa274a5fc8f88662df446d374bd')
        } else if (i === 3) {
          expect(chunk.revert.header).to.equal('throw an error if a callback is passed to animate methods')
        }

        i++
        cb()
      }, function () {
        expect(i).to.equal(4)
        done()
      }))
  })
})

describe('sync', function () {
  it('should work', function () {
    const commit = 'feat(ng-list): Allow custom separator\n' +
      'bla bla bla\n\n' +
      'Closes #123\nCloses #25\nFixes #33\n'
    const result = conventionalCommitsParser.sync(commit)

    expect(result.header).to.equal('feat(ng-list): Allow custom separator')
    expect(result.footer).to.equal('Closes #123\nCloses #25\nFixes #33')
    expect(result.references).to.eql([
      {
        action: 'Closes',
        issue: '123',
        owner: null,
        prefix: '#',
        raw: '#123',
        repository: null
      },
      {
        action: 'Closes',
        issue: '25',
        owner: null,
        prefix: '#',
        raw: '#25',
        repository: null
      },
      {
        action: 'Fixes',
        issue: '33',
        owner: null,
        prefix: '#',
        raw: '#33',
        repository: null
      }
    ])
  })

  it('should parse references from header', function () {
    const commit = 'Subject #1'
    const result = conventionalCommitsParser.sync(commit)

    expect(result.references).to.eql([{
      action: null,
      issue: '1',
      owner: null,
      prefix: '#',
      raw: 'Subject #1',
      repository: null
    }])
  })

  it('should parse slash in the header with default headerPattern option', () => {
    const commit = 'feat(hello/world): message'
    const result = conventionalCommitsParser.sync(commit)

    expect(result.type).to.equal('feat')
    expect(result.scope).to.equal('hello/world')
    expect(result.subject).to.equal('message')
  })
})
