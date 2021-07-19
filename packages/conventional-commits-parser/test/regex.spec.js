'use strict'
const expect = require('chai').expect
const regex = require('../lib/regex')

describe('regex', function () {
  describe('notes', function () {
    it('should match a simple note', function () {
      const reNotes = regex({
        noteKeywords: ['Breaking News', 'Breaking Change']
      }).notes
      const match = 'Breaking News: This is so important.'.match(reNotes)
      expect(match[0]).to.equal('Breaking News: This is so important.')
      expect(match[1]).to.equal('Breaking News')
      expect(match[2]).to.equal('This is so important.')
    })

    it('should match notes with customized pattern', function () {
      const reNotes = regex({
        noteKeywords: ['BREAKING CHANGE'],
        notesPattern: (noteKeywords) => new RegExp('^[\\s|*]*(' + noteKeywords + ')[:\\s]+(?:\\[.*\\] )(.*)', 'i')
      }).notes
      const notes = 'BREAKING CHANGE: [Do not match this prefix.] This is so important.'
      const match = notes.match(reNotes)
      expect(match[0]).to.equal(notes)
      expect(match[1]).to.equal('BREAKING CHANGE')
      expect(match[2]).to.equal('This is so important.')
    })

    it('should be case insensitive', function () {
      const reNotes = regex({
        noteKeywords: ['Breaking News', 'Breaking Change']
      }).notes
      const match = 'BREAKING NEWS: This is so important.'.match(reNotes)
      expect(match[0]).to.equal('BREAKING NEWS: This is so important.')
      expect(match[1]).to.equal('BREAKING NEWS')
      expect(match[2]).to.equal('This is so important.')
    })

    it('should ignore whitespace', function () {
      const reNotes = regex({
        noteKeywords: [' Breaking News', 'Breaking Change ', '', ' Breaking SOLUTION ', '  '],
        issuePrefixes: ['#']
      }).notes
      const match = 'Breaking News: This is so important.'.match(reNotes)
      expect(match[0]).to.equal('Breaking News: This is so important.')
      expect(match[1]).to.equal('Breaking News')
      expect(match[2]).to.equal('This is so important.')
    })

    it('should not accidentally match in a sentence', function () {
      const reNotes = regex({
        noteKeywords: [' Breaking News'],
        issuePrefixes: ['#']
      }).notes
      const match = 'This is a breaking news: So important.'.match(reNotes)
      expect(match).to.equal(null)
    })

    it('should not match if there is text after `noteKeywords`', function () {
      const reNotes = regex({
        noteKeywords: [' BREAKING CHANGE'],
        issuePrefixes: ['#']
      }).notes
      const match = 'BREAKING CHANGES: Wow.'.match(reNotes)
      expect(match).to.equal(null)
    })
  })

  describe('references', function () {
    it('should match a simple reference', function () {
      const reReferences = regex({
        referenceActions: ['Closes']
      }).references
      const match = reReferences.exec('closes #1')
      expect(match[0]).to.equal('closes #1')
      expect(match[1]).to.equal('closes')
      expect(match[2]).to.equal('#1')
    })

    it('should be case insensitive', function () {
      const reReferences = regex({
        referenceActions: ['Closes']
      }).references
      const match = reReferences.exec('ClOsEs #1')
      expect(match[0]).to.equal('ClOsEs #1')
      expect(match[1]).to.equal('ClOsEs')
      expect(match[2]).to.equal('#1')
    })

    it('should not match if keywords does not present', function () {
      const reReferences = regex({
        referenceActions: ['Close']
      }).references
      const match = reReferences.exec('Closes #1')
      expect(match).to.equal(null)
    })

    it('should take multiple reference keywords', function () {
      const reReferences = regex({
        referenceActions: [' Closes', 'amends', 'fixes']
      }).references
      const match = reReferences.exec('amends #1')
      expect(match[0]).to.eql('amends #1')
      expect(match[1]).to.eql('amends')
      expect(match[2]).to.equal('#1')
    })

    it('should match multiple references', function () {
      const reReferences = regex({
        referenceActions: ['Closes', 'amends']
      }).references
      const string = 'Closes #1 amends #2; closes bug #4'
      let match = reReferences.exec(string)
      expect(match[0]).to.equal('Closes #1 ')
      expect(match[1]).to.equal('Closes')
      expect(match[2]).to.equal('#1 ')

      match = reReferences.exec(string)
      expect(match[0]).to.equal('amends #2; ')
      expect(match[1]).to.equal('amends')
      expect(match[2]).to.equal('#2; ')

      match = reReferences.exec(string)
      expect(match[0]).to.equal('closes bug #4')
      expect(match[1]).to.equal('closes')
      expect(match[2]).to.equal('bug #4')
    })

    it('should match references with mixed content, like JIRA tickets', function () {
      const reReferences = regex({
        referenceActions: ['Closes', 'amends']
      }).references
      const string = 'Closes #JIRA-123 amends #MY-OTHER-PROJECT-123; closes bug #4'
      let match = reReferences.exec(string)
      expect(match[0]).to.equal('Closes #JIRA-123 ')
      expect(match[1]).to.equal('Closes')
      expect(match[2]).to.equal('#JIRA-123 ')

      match = reReferences.exec(string)
      expect(match[0]).to.equal('amends #MY-OTHER-PROJECT-123; ')
      expect(match[1]).to.equal('amends')
      expect(match[2]).to.equal('#MY-OTHER-PROJECT-123; ')

      match = reReferences.exec(string)
      expect(match[0]).to.equal('closes bug #4')
      expect(match[1]).to.equal('closes')
      expect(match[2]).to.equal('bug #4')
    })

    it('should reference an issue without an action', function () {
      const string = 'gh-1, prefix-3, Closes gh-6'
      const reReferences = regex().references

      const match = reReferences.exec(string)
      expect(match[0]).to.equal('gh-1, prefix-3, Closes gh-6')
      expect(match[1]).to.equal('')
      expect(match[2]).to.equal('gh-1, prefix-3, Closes gh-6')
    })

    it('should ignore whitespace', function () {
      const reReferences = regex({
        referenceActions: [' Closes', 'amends ', '', ' fixes ', '   ']
      }).references
      const match = 'closes #1, amends #2, fixes #3'.match(reReferences)
      expect(match).to.eql(['closes #1, ', 'amends #2, ', 'fixes #3'])
    })
  })

  describe('referenceParts', function () {
    let reReferenceParts = regex({
      issuePrefixes: ['#']
    }).referenceParts

    afterEach(function () {
      reReferenceParts.lastIndex = 0
    })

    it('should match simple reference parts', function () {
      const match = reReferenceParts.exec('#1')
      expect(match[0]).to.equal('#1')
      expect(match[1]).to.equal(undefined)
      expect(match[2]).to.equal('#')
      expect(match[3]).to.equal('1')
    })

    it('should reference an issue in parenthesis', function () {
      const string = '#27), pinned shelljs to version that works with nyc (#30)'
      let match = reReferenceParts.exec(string)
      expect(match[0]).to.equal('#27')
      expect(match[1]).to.equal(undefined)
      expect(match[2]).to.equal('#')
      expect(match[3]).to.equal('27')

      match = reReferenceParts.exec(string)
      expect(match[0]).to.equal('), pinned shelljs to version that works with nyc (#30')
      expect(match[1]).to.equal(undefined)
      expect(match[2]).to.equal('#')
      expect(match[3]).to.equal('30')
    })

    it('should match reference parts with something else', function () {
      const match = reReferenceParts.exec('something else #1')
      expect(match[0]).to.equal('something else #1')
      expect(match[1]).to.equal(undefined)
      expect(match[3]).to.equal('1')
    })

    it('should match reference parts with a repository', function () {
      const match = reReferenceParts.exec('repo#1')
      expect(match[0]).to.equal('repo#1')
      expect(match[1]).to.equal('repo')
      expect(match[3]).to.equal('1')
    })

    it('should match JIRA-123 like reference parts', function () {
      const match = reReferenceParts.exec('#JIRA-123')
      expect(match[0]).to.equal('#JIRA-123')
      expect(match[1]).to.equal(undefined)
      expect(match[2]).to.equal('#')
      expect(match[3]).to.equal('JIRA-123')
    })

    it('should not match MY-€#%#&-123 mixed symbol reference parts', function () {
      const match = reReferenceParts.exec('#MY-€#%#&-123')
      expect(match).to.equal(null)
    })

    it('should match reference parts with multiple references', function () {
      const string = '#1 #2, something #3; repo#4'
      let match = reReferenceParts.exec(string)
      expect(match[0]).to.equal('#1')
      expect(match[1]).to.equal(undefined)
      expect(match[3]).to.equal('1')

      match = reReferenceParts.exec(string)
      expect(match[0]).to.equal(' #2')
      expect(match[1]).to.equal(undefined)
      expect(match[3]).to.equal('2')

      match = reReferenceParts.exec(string)
      expect(match[0]).to.equal(', something #3')
      expect(match[1]).to.equal(undefined)
      expect(match[3]).to.equal('3')

      match = reReferenceParts.exec(string)
      expect(match[0]).to.equal('; repo#4')
      expect(match[1]).to.equal('repo')
      expect(match[3]).to.equal('4')
    })

    it('should match issues with customized prefix', function () {
      const string = 'closes gh-1, amends #2, fixes prefix-3'
      reReferenceParts = regex({
        issuePrefixes: ['gh-', 'prefix-']
      }).referenceParts

      let match = reReferenceParts.exec(string)
      expect(match[0]).to.equal('closes gh-1')
      expect(match[1]).to.equal(undefined)
      expect(match[2]).to.equal('gh-')
      expect(match[3]).to.equal('1')

      match = reReferenceParts.exec(string)
      expect(match[0]).to.equal(', amends #2, fixes prefix-3')
      expect(match[1]).to.equal(undefined)
      expect(match[2]).to.equal('prefix-')
      expect(match[3]).to.equal('3')
    })

    it('should be case sensitve if set in options', function () {
      const string = 'closes gh-1, amends GH-2, fixes #3'
      reReferenceParts = regex({
        issuePrefixes: ['GH-'],
        issuePrefixesCaseSensitive: true
      }).referenceParts

      const match = reReferenceParts.exec(string)
      expect(match[0]).to.equal('closes gh-1, amends GH-2')
      expect(match[1]).to.equal(undefined)
      expect(match[2]).to.equal('GH-')
      expect(match[3]).to.equal('2')
    })

    it('should match nothing if there is no customized prefix', function () {
      const string = 'closes gh-1, amends #2, fixes prefix-3'
      reReferenceParts = regex().referenceParts

      const match = reReferenceParts.exec(string)
      expect(match).to.equal(null)
    })
  })

  describe('mentions', function () {
    it('should match basically mention', function () {
      const string = 'Thanks!! @someone'
      const mentions = regex().mentions

      const match = mentions.exec(string)
      expect(match[0]).to.equal('@someone')
      expect(match[1]).to.equal('someone')
    })

    it('should match mention with hyphen', function () {
      const string = 'Thanks!! @some-one'
      const mentions = regex().mentions

      const match = mentions.exec(string)
      expect(match[0]).to.equal('@some-one')
      expect(match[1]).to.equal('some-one')
    })

    it('should match mention with underscore', function () {
      const string = 'Thanks!! @some_one'
      const mentions = regex().mentions

      const match = mentions.exec(string)
      expect(match[0]).to.equal('@some_one')
      expect(match[1]).to.equal('some_one')
    })

    it('should match mention with parentheses', function () {
      const string = 'Fix feature1 (by @someone)'
      const mentions = regex().mentions

      const match = mentions.exec(string)
      expect(match[0]).to.equal('@someone')
      expect(match[1]).to.equal('someone')
    })

    it('should match mention with brackets', function () {
      const string = 'Fix feature1 [by @someone]'
      const mentions = regex().mentions

      const match = mentions.exec(string)
      expect(match[0]).to.equal('@someone')
      expect(match[1]).to.equal('someone')
    })

    it('should match mention with braces', function () {
      const string = 'Fix feature1 {by @someone}'
      const mentions = regex().mentions

      const match = mentions.exec(string)
      expect(match[0]).to.equal('@someone')
      expect(match[1]).to.equal('someone')
    })

    it('should match mention with angle brackets', function () {
      const string = 'Fix feature1 by <@someone>'
      const mentions = regex().mentions

      const match = mentions.exec(string)
      expect(match[0]).to.equal('@someone')
      expect(match[1]).to.equal('someone')
    })
  })
})
