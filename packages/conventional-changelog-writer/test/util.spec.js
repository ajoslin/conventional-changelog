'use strict'
const util = require('../lib/util')
const expect = require('chai').expect

describe('util', function () {
  describe('compileTemplates', function () {
    it('should compile templates with default partials', function () {
      const templates = {
        mainTemplate: '{{> header}}{{> commit}}{{> footer}}',
        headerPartial: 'header\n',
        commitPartial: 'commit\n',
        footerPartial: 'footer\n'
      }
      const compiled = util.compileTemplates(templates)

      expect(compiled()).to.equal('header\ncommit\nfooter\n')
    })

    it('should compile templates with default partials if one is an empty string', function () {
      const templates = {
        mainTemplate: '{{> header}}{{> commit}}{{> footer}}',
        headerPartial: '',
        commitPartial: 'commit\n',
        footerPartial: 'footer\n'
      }
      const compiled = util.compileTemplates(templates)

      expect(compiled()).to.equal('commit\nfooter\n')
    })

    it('should compile templates with customized partials', function () {
      const templates = {
        mainTemplate: '{{> partial1}}{{> partial2}}{{> partial3}}',
        partials: {
          partial1: 'partial1\n',
          partial2: 'partial2\n',
          partial3: 'partial3\n',
          partial4: null
        }
      }
      const compiled = util.compileTemplates(templates)

      expect(compiled()).to.equal('partial1\npartial2\npartial3\n')
    })
  })

  describe('functionify', function () {
    it('should turn any truthy value into a function', function () {
      const func = util.functionify('a')

      expect(func).to.be.a('function')
    })

    it('should not change falsy value', function () {
      const func = util.functionify(null)

      expect(func).to.equal(null)
    })
  })

  describe('getCommitGroups', function () {
    const commits = [{
      groupBy: 'A',
      content: 'this is A'
    }, {
      groupBy: 'A',
      content: 'this is another A'
    }, {
      groupBy: 'Big B',
      content: 'this is B and its a bit longer'
    }]

    it('should group but not sort groups', function () {
      const commitGroups = util.getCommitGroups('groupBy', commits)

      expect(commitGroups).to.eql([{
        title: 'A',
        commits: [{
          groupBy: 'A',
          content: 'this is A'
        }, {
          groupBy: 'A',
          content: 'this is another A'
        }]
      }, {
        title: 'Big B',
        commits: [{
          groupBy: 'Big B',
          content: 'this is B and its a bit longer'
        }]
      }])
    })

    it('should group if `groupBy` is undefined', function () {
      const commits = [{
        content: 'this is A'
      }, {
        content: 'this is another A'
      }, {
        groupBy: 'Big B',
        content: 'this is B and its a bit longer'
      }]
      const commitGroups = util.getCommitGroups('groupBy', commits)

      expect(commitGroups).to.eql([{
        title: false,
        commits: [{
          content: 'this is A'
        }, {
          content: 'this is another A'
        }]
      }, {
        title: 'Big B',
        commits: [{
          groupBy: 'Big B',
          content: 'this is B and its a bit longer'
        }]
      }])
    })

    it('should group and sort groups', function () {
      const commitGroups = util.getCommitGroups('groupBy', commits, function (a, b) {
        if (a.title.length < b.title.length) {
          return 1
        }
        if (a.title.length > b.title.length) {
          return -1
        }
        return 0
      })

      expect(commitGroups).to.eql([{
        title: 'Big B',
        commits: [{
          groupBy: 'Big B',
          content: 'this is B and its a bit longer'
        }]
      }, {
        title: 'A',
        commits: [{
          groupBy: 'A',
          content: 'this is A'
        }, {
          groupBy: 'A',
          content: 'this is another A'
        }]
      }])
    })

    it('should group and but not sort commits', function () {
      const commitGroups = util.getCommitGroups('groupBy', commits)

      expect(commitGroups).to.eql([{
        title: 'A',
        commits: [{
          groupBy: 'A',
          content: 'this is A'
        }, {
          groupBy: 'A',
          content: 'this is another A'
        }]
      }, {
        title: 'Big B',
        commits: [{
          groupBy: 'Big B',
          content: 'this is B and its a bit longer'
        }]
      }])
    })

    it('should group and sort commits', function () {
      const commitGroups = util.getCommitGroups('groupBy', commits, false, function (a, b) {
        if (a.content.length < b.content.length) {
          return 1
        }
        if (a.content.length > b.content.length) {
          return -1
        }
        return 0
      })

      expect(commitGroups).to.eql([{
        title: 'A',
        commits: [{
          groupBy: 'A',
          content: 'this is another A'
        }, {
          groupBy: 'A',
          content: 'this is A'
        }]
      }, {
        title: 'Big B',
        commits: [{
          groupBy: 'Big B',
          content: 'this is B and its a bit longer'
        }]
      }])
    })
  })

  describe('getNoteGroups', function () {
    const notes = [{
      title: 'A title',
      text: 'this is A and its a bit longer'
    }, {
      title: 'B+',
      text: 'this is B'
    }, {
      title: 'C',
      text: 'this is C'
    }, {
      title: 'A title',
      text: 'this is another A'
    }, {
      title: 'B+',
      text: 'this is another B'
    }]

    it('should group', function () {
      const noteGroups = util.getNoteGroups(notes)

      expect(noteGroups).to.eql([{
        title: 'A title',
        notes: [{
          title: 'A title',
          text: 'this is A and its a bit longer'
        }, {
          title: 'A title',
          text: 'this is another A'
        }]
      }, {
        title: 'B+',
        notes: [{
          title: 'B+',
          text: 'this is B'
        }, {
          title: 'B+',
          text: 'this is another B'
        }]
      }, {
        title: 'C',
        notes: [{
          title: 'C',
          text: 'this is C'
        }]
      }])
    })

    it('should group and sort groups', function () {
      const noteGroups = util.getNoteGroups(notes, function (a, b) {
        if (a.title.length > b.title.length) {
          return 1
        }
        if (a.title.length < b.title.length) {
          return -1
        }
        return 0
      })

      expect(noteGroups).to.eql([{
        title: 'C',
        notes: [{
          title: 'C',
          text: 'this is C'
        }]
      }, {
        title: 'B+',
        notes: [{
          title: 'B+',
          text: 'this is B'
        }, {
          title: 'B+',
          text: 'this is another B'
        }]
      }, {
        title: 'A title',
        notes: [{
          title: 'A title',
          text: 'this is A and its a bit longer'
        }, {
          title: 'A title',
          text: 'this is another A'
        }]
      }])
    })

    it('should group and sort notes', function () {
      const noteGroups = util.getNoteGroups(notes, false, function (a, b) {
        if (a.text.length < b.text.length) {
          return 1
        }
        if (a.text.length > b.text.length) {
          return -1
        }
        return 0
      })

      expect(noteGroups).to.eql([{
        title: 'A title',
        notes: [{
          title: 'A title',
          text: 'this is A and its a bit longer'
        }, {
          title: 'A title',
          text: 'this is another A'
        }]
      }, {
        title: 'B+',
        notes: [{
          title: 'B+',
          text: 'this is another B'
        }, {
          title: 'B+',
          text: 'this is B'
        }]
      }, {
        title: 'C',
        notes: [{
          title: 'C',
          text: 'this is C'
        }]
      }])
    })

    it('should work if title does not exist', function () {
      const notes = [{
        title: '',
        text: 'this is A and its a bit longer'
      }, {
        title: 'B+',
        text: 'this is B'
      }, {
        title: '',
        text: 'this is another A'
      }, {
        title: 'B+',
        text: 'this is another B'
      }]

      const noteGroups = util.getNoteGroups(notes)

      expect(noteGroups).to.eql([{
        title: '',
        notes: [{
          title: '',
          text: 'this is A and its a bit longer'
        }, {
          title: '',
          text: 'this is another A'
        }]
      }, {
        title: 'B+',
        notes: [{
          title: 'B+',
          text: 'this is B'
        }, {
          title: 'B+',
          text: 'this is another B'
        }]
      }])
    })
  })

  describe('processCommit', function () {
    const commit = {
      hash: '456789uhghi',
      subject: 'my subject!!!',
      replaceThis: 'bad',
      doNothing: 'nothing'
    }

    it('should process object commit', function () {
      const processed = util.processCommit(commit)

      expect(processed).to.eql({
        hash: '456789uhghi',
        subject: 'my subject!!!',
        replaceThis: 'bad',
        doNothing: 'nothing',
        raw: {
          hash: '456789uhghi',
          subject: 'my subject!!!',
          replaceThis: 'bad',
          doNothing: 'nothing'
        }
      })
    })

    it('should process json commit', function () {
      const processed = util.processCommit(JSON.stringify(commit))

      expect(processed).to.eql({
        hash: '456789uhghi',
        subject: 'my subject!!!',
        replaceThis: 'bad',
        doNothing: 'nothing',
        raw: {
          hash: '456789uhghi',
          subject: 'my subject!!!',
          replaceThis: 'bad',
          doNothing: 'nothing'
        }
      })
    })

    it('should transform by a function', function () {
      const processed = util.processCommit(commit, function (commit) {
        commit.hash = commit.hash.substring(0, 4)
        commit.subject = commit.subject.substring(0, 5)
        commit.replaceThis = 'replaced'
        return commit
      })

      expect(processed).to.eql({
        hash: '4567',
        subject: 'my su',
        replaceThis: 'replaced',
        doNothing: 'nothing',
        raw: {
          hash: '456789uhghi',
          subject: 'my subject!!!',
          replaceThis: 'bad',
          doNothing: 'nothing'
        }
      })
    })

    it('should transform by an object', function () {
      const processed = util.processCommit(commit, {
        hash: function (hash) {
          return hash.substring(0, 4)
        },
        subject: function (subject) {
          return subject.substring(0, 5)
        },
        replaceThis: 'replaced'
      })

      expect(processed).to.eql({
        hash: '4567',
        subject: 'my su',
        replaceThis: 'replaced',
        doNothing: 'nothing',
        raw: {
          hash: '456789uhghi',
          subject: 'my subject!!!',
          replaceThis: 'bad',
          doNothing: 'nothing'
        }
      })
    })

    it('should transform by an object using dot path', function () {
      const processed = util.processCommit({
        header: {
          subject: 'my subject'
        }
      }, {
        'header.subject': function (subject) {
          return subject.substring(0, 5)
        }
      })

      expect(processed).to.eql({
        header: {
          subject: 'my su'
        },
        raw: {
          header: {
            subject: 'my subject'
          }
        }
      })
    })
  })

  describe('processContext', function () {
    const commits = [{
      content: 'this is A'
    }, {
      content: 'this is another A'
    }, {
      groupBy: 'Big B',
      content: 'this is B and its a bit longer'
    }]

    const notes = [{
      title: 'A',
      text: 'this is A and its a bit longer'
    }, {
      title: 'B',
      text: 'this is B'
    }, {
      title: 'A',
      text: 'this is another A'
    }, {
      title: 'B',
      text: 'this is another B'
    }]

    it('should process context without `options.groupBy`', function () {
      const extra = util.getExtraContext(commits, notes, {})

      expect(extra).to.eql({
        commitGroups: [{
          title: false,
          commits: [{
            content: 'this is A'
          }, {
            content: 'this is another A'
          }, {
            content: 'this is B and its a bit longer',
            groupBy: 'Big B'
          }]
        }],
        noteGroups: [{
          title: 'A',
          notes: [{
            title: 'A',
            text: 'this is A and its a bit longer'
          }, {
            title: 'A',
            text: 'this is another A'
          }]
        }, {
          title: 'B',
          notes: [{
            title: 'B',
            text: 'this is B'
          }, {
            title: 'B',
            text: 'this is another B'
          }]
        }]
      })
    })

    it('should process context with `options.groupBy` found', function () {
      const extra = util.getExtraContext(commits, notes, {
        groupBy: 'groupBy'
      })

      expect(extra).to.eql({
        commitGroups: [{
          title: false,
          commits: [{
            content: 'this is A'
          }, {
            content: 'this is another A'
          }]
        }, {
          title: 'Big B',
          commits: [{
            content: 'this is B and its a bit longer',
            groupBy: 'Big B'
          }]
        }],
        noteGroups: [{
          title: 'A',
          notes: [{
            title: 'A',
            text: 'this is A and its a bit longer'
          }, {
            title: 'A',
            text: 'this is another A'
          }]
        }, {
          title: 'B',
          notes: [{
            title: 'B',
            text: 'this is B'
          }, {
            title: 'B',
            text: 'this is another B'
          }]
        }]
      })
    })

    it('should process context with `options.groupBy` not found', function () {
      const extra = util.getExtraContext(commits, notes, {
        groupBy: 'what?'
      })

      expect(extra).to.eql({
        commitGroups: [{
          title: false,
          commits: [{
            content: 'this is A'
          }, {
            content: 'this is another A'
          }, {
            content: 'this is B and its a bit longer',
            groupBy: 'Big B'
          }]
        }],
        noteGroups: [{
          title: 'A',
          notes: [{
            title: 'A',
            text: 'this is A and its a bit longer'
          }, {
            title: 'A',
            text: 'this is another A'
          }]
        }, {
          title: 'B',
          notes: [{
            title: 'B',
            text: 'this is B'
          }, {
            title: 'B',
            text: 'this is another B'
          }]
        }]
      })
    })
  })

  describe('generate', function () {
    it('should merge with the key commit', function () {
      const log = util.generate({
        mainTemplate: '{{whatever}}',
        finalizeContext: function (context) {
          return context
        },
        debug: function () {}
      }, [], {
        whatever: 'a'
      }, {
        whatever: 'b'
      })

      expect(log).to.equal('b')
    })

    it('should attach a copy of the commit to note', function () {
      const log = util.generate({
        mainTemplate: '{{#each noteGroups}}{{#each notes}}{{commit.header}}{{/each}}{{/each}}',
        ignoreReverted: true,
        finalizeContext: function (context) {
          return context
        },
        debug: function () {}
      }, [{
        header: 'feat(): new feature',
        body: null,
        footer: null,
        notes: [{
          title: 'BREAKING CHANGE',
          text: 'WOW SO MANY CHANGES'
        }],
        references: [],
        revert: null,
        hash: '815a3f0717bf1dfce007bd076420c609504edcf3'
      }, {
        header: 'chore: first commit',
        body: null,
        footer: null,
        notes: [{
          title: 'BREAKING CHANGE',
          text: 'Not backward compatible.'
        }, {
          title: 'IMPORTANT CHANGE',
          text: 'This is very important!'
        }],
        references: [],
        revert: null,
        hash: '74a3e4d6d25dee2c0d6483a0a3887417728cbe0a'
      }])

      expect(log).to.include('feat(): new feature')
      expect(log).to.include('chore: first commit')
    })

    it('should not html escape any content', function () {
      const log = util.generate({
        mainTemplate: '{{whatever}}',
        finalizeContext: function (context) {
          return context
        },
        debug: function () {}
      }, [], [], {
        whatever: '`a`'
      })

      expect(log).to.equal('`a`')
    })

    it('should ignore a reverted commit', function () {
      const log = util.generate({
        mainTemplate: '{{#each commitGroups}}{{commits.length}}{{#each commits}}{{header}}{{/each}}{{/each}}{{#each noteGroups}}{{title}}{{#each notes}}{{text}}{{/each}}{{/each}}',
        ignoreReverted: true,
        finalizeContext: function (context) {
          return context
        },
        debug: function () {}
      }, [{
        header: 'revert: feat(): amazing new module\n',
        body: 'This reverts commit 56185b7356766d2b30cfa2406b257080272e0b7a.\n',
        footer: null,
        notes: [],
        references: [],
        revert: {
          header: 'feat(): amazing new module',
          hash: '56185b7356766d2b30cfa2406b257080272e0b7a'
        },
        hash: '789d898b5f8422d7f65cc25135af2c1a95a125ac\n'
      }, {
        header: 'feat(): amazing nee\n',
        body: null,
        footer: 'BREAKI]ompatible.\n',
        notes: [{
          title: 'BREAKING CHANGE',
          text: 'some breaking change'
        }],
        references: [],
        revert: null,
        hash: '56185b',
        raw: {
          header: 'feat(): amazing new module\n',
          body: null,
          footer: 'BREAKING CHANGE: Not backward compatible.\n',
          notes: [{
            title: 'BREAKING CHANGE',
            text: 'some breaking change'
          }],
          references: [],
          revert: null,
          hash: '56185b7356766d2b30cfa2406b257080272e0b7a\n'
        }
      }, {
        header: 'feat(): new feature\n',
        body: null,
        footer: null,
        notes: [{
          title: 'BREAKING CHANGE',
          text: 'WOW SO MANY CHANGES'
        }],
        references: [],
        revert: null,
        hash: '815a3f0717bf1dfce007bd076420c609504edcf3\n'
      }, {
        header: 'chore: first commit\n',
        body: null,
        footer: null,
        notes: [],
        references: [],
        revert: null,
        hash: '74a3e4d6d25dee2c0d6483a0a3887417728cbe0a\n'
      }])

      expect(log).to.include('feat(): new feature\n')
      expect(log).to.include('chore: first commit\n')
      expect(log).to.include('WOW SO MANY CHANGES')
      expect(log).to.not.include('amazing new module')
      expect(log).to.not.include('revert')
      expect(log).to.not.include('breaking change')
    })

    it('should finalize context', function () {
      const log = util.generate({
        mainTemplate: '{{whatever}} {{somethingExtra}}',
        finalizeContext: function (context) {
          context.somethingExtra = 'oh'
          return context
        },
        debug: function () {}
      }, [], [], {
        whatever: '`a`'
      })

      expect(log).to.equal('`a` oh')
    })

    it('should finalize context', function () {
      const log = util.generate({
        mainTemplate: '{{whatever}} {{somethingExtra}} {{opt}} {{commitsLen}} {{whatever}}',
        finalizeContext: function (context, options, commits, keyCommit) {
          context.somethingExtra = 'oh'
          context.opt = options.opt
          context.commitsLen = commits.length
          context.whatever = keyCommit.whatever

          return context
        },
        debug: function () {},
        opt: 'opt'
      }, [], [], {
        whatever: '`a`'
      })

      expect(log).to.equal('`a` oh opt 0 `a`')
    })

    it('should pass the correct arguments', function () {
      util.generate({
        mainTemplate: '{{#each noteGroups}}{{#each notes}}{{commit.header}}{{/each}}{{/each}}',
        ignoreReverted: true,
        finalizeContext: function (context, options, filteredCommits, keyCommit, originalCommits) {
          expect(filteredCommits.length).to.equal(2)
          expect(originalCommits.length).to.equal(4)
        },
        debug: function () {}
      }, [{
        header: 'revert: feat(): amazing new module\n',
        body: 'This reverts commit 56185b7356766d2b30cfa2406b257080272e0b7a.\n',
        footer: null,
        notes: [],
        references: [],
        revert: {
          header: 'feat(): amazing new module',
          hash: '56185b7356766d2b30cfa2406b257080272e0b7a'
        },
        hash: '789d898b5f8422d7f65cc25135af2c1a95a125ac\n'
      }, {
        header: 'feat(): amazing nee\n',
        body: null,
        footer: 'BREAKI]ompatible.\n',
        notes: [{
          title: 'BREAKING CHANGE',
          text: 'some breaking change'
        }],
        references: [],
        revert: null,
        hash: '56185b',
        raw: {
          header: 'feat(): amazing new module\n',
          body: null,
          footer: 'BREAKING CHANGE: Not backward compatible.\n',
          notes: [{
            title: 'BREAKING CHANGE',
            text: 'some breaking change'
          }],
          references: [],
          revert: null,
          hash: '56185b7356766d2b30cfa2406b257080272e0b7a\n'
        }
      }, {
        header: 'feat(): new feature\n',
        body: null,
        footer: null,
        notes: [{
          title: 'BREAKING CHANGE',
          text: 'WOW SO MANY CHANGES'
        }],
        references: [],
        revert: null,
        hash: '815a3f0717bf1dfce007bd076420c609504edcf3\n'
      }, {
        header: 'chore: first commit\n',
        body: null,
        footer: null,
        notes: [],
        references: [],
        revert: null,
        hash: '74a3e4d6d25dee2c0d6483a0a3887417728cbe0a\n'
      }])
    })
  })
})
