'use strict'
const expect = require('chai').expect
const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')

let template
let templateContext

before(function (done) {
  fs.readFile(path.resolve(__dirname, '../templates/commit.hbs'), function (err, data) {
    if (err) done(err)
    template = data.toString()
    done()
  })
})

beforeEach(function () {
  templateContext = {
    header: 'my header',
    host: 'www.myhost.com',
    owner: 'a',
    repository: 'b',
    commit: 'my commits',
    issue: 'my issue',
    hash: 'hash'
  }
})

describe('partial.commit', function () {
  it('should ignore host and owner if they do not exist and just use repository to link', function () {
    const log = Handlebars.compile(template)({
      header: 'my header',
      repository: 'www.myhost.com/a/b',
      commit: 'my commits',
      issue: 'my issue',
      hash: 'hash',
      linkReferences: true,
      references: [{
        issue: 1
      }]
    })

    expect(log).to.equal('* my header ([hash](www.myhost.com/a/b/my commits/hash)), closes [#1](www.myhost.com/a/b/my issue/1)\n')
  })

  it('should ignore owner if it does not exist and use host and repository to link', function () {
    const log = Handlebars.compile(template)({
      header: 'my header',
      host: 'www.myhost.com',
      repository: 'a/b',
      commit: 'my commits',
      issue: 'my issue',
      hash: 'hash',
      linkReferences: true,
      references: [{
        issue: 1
      }]
    })

    expect(log).to.equal('* my header ([hash](www.myhost.com/a/b/my commits/hash)), closes [#1](www.myhost.com/a/b/my issue/1)\n')
  })

  it('should just use repoUrl to link', function () {
    const log = Handlebars.compile(template)({
      header: 'my header',
      host: 'www.myhost.com',
      repoUrl: 'www.myhost.com',
      commit: 'my commits',
      issue: 'my issue',
      hash: 'hash',
      linkReferences: true,
      references: [{
        issue: 1
      }]
    })

    expect(log).to.equal('* my header ([hash](www.myhost.com/my commits/hash)), closes [#1](www.myhost.com/my issue/1)\n')
  })

  it('should not link the commit if `linkReferences` is falsy', function () {
    const log = Handlebars.compile(template)(templateContext)

    expect(log).to.equal('* my header hash\n')
  })

  it('should link the commit if `linkReferences` is thuthy', function () {
    templateContext.linkReferences = true
    const log = Handlebars.compile(template)(templateContext)

    expect(log).to.equal('* my header ([hash](www.myhost.com/a/b/my commits/hash))\n')
  })

  it('should link reference commit if `linkReferences` is thuthy and no `owner`', function () {
    templateContext.linkReferences = true
    templateContext.owner = null
    templateContext.repository = 'a/b'
    const log = Handlebars.compile(template)(templateContext)

    expect(log).to.equal('* my header ([hash](www.myhost.com/a/b/my commits/hash))\n')
  })

  it('should not link reference if `references` is truthy and `linkReferences` is falsy', function () {
    templateContext.references = [{
      issue: 1
    }, {
      issue: 2
    }, {
      issue: 3
    }]
    const log = Handlebars.compile(template)(templateContext)

    expect(log).to.equal('* my header hash, closes #1 #2 #3\n')
  })

  it('should link reference if `references` is truthy and `linkReferences` is truthy', function () {
    templateContext.linkReferences = true
    templateContext.references = [{
      issue: 1
    }, {
      issue: 2
    }, {
      issue: 3
    }]
    const log = Handlebars.compile(template)(templateContext)

    expect(log).to.equal('* my header ([hash](www.myhost.com/a/b/my commits/hash)), closes [#1](www.myhost.com/a/b/my issue/1) [#2](www.myhost.com/a/b/my issue/2) [#3](www.myhost.com/a/b/my issue/3)\n')
  })

  it('should link reference if `references` is truthy and `linkReferences` is truthy without an owner', function () {
    templateContext.linkReferences = true
    templateContext.owner = null
    templateContext.repository = 'a/b'
    templateContext.references = [{
      issue: 1
    }, {
      issue: 2
    }, {
      issue: 3
    }]
    const log = Handlebars.compile(template)(templateContext)

    expect(log).to.equal('* my header ([hash](www.myhost.com/a/b/my commits/hash)), closes [#1](www.myhost.com/a/b/my issue/1) [#2](www.myhost.com/a/b/my issue/2) [#3](www.myhost.com/a/b/my issue/3)\n')
  })

  it('should link reference from a different repository with an owner', function () {
    templateContext.linkReferences = true
    templateContext.references = [{
      owner: 'c',
      repository: 'd',
      issue: 1
    }]
    const log = Handlebars.compile(template)(templateContext)

    expect(log).to.equal('* my header ([hash](www.myhost.com/a/b/my commits/hash)), closes [c/d#1](www.myhost.com/c/d/my issue/1)\n')
  })

  it('should link reference from a different repository without an owner', function () {
    templateContext.linkReferences = true
    templateContext.references = [{
      repository: 'c/d',
      issue: 1
    }]
    const log = Handlebars.compile(template)(templateContext)

    expect(log).to.equal('* my header ([hash](www.myhost.com/a/b/my commits/hash)), closes [c/d#1](www.myhost.com/c/d/my issue/1)\n')
  })
})
