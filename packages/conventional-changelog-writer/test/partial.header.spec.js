'use strict'
const expect = require('chai').expect
const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')

let template
let templateContext

before(function (done) {
  fs.readFile(path.resolve(__dirname, '../templates/header.hbs'), function (err, data) {
    if (err) done(err)
    template = data.toString()
    done()
  })
})

beforeEach(function () {
  templateContext = {
    version: 'my version'
  }
})

describe('partial.header', function () {
  it('should generate header if `isPatch` is truthy', function () {
    templateContext.isPatch = true
    const log = Handlebars.compile(template)(templateContext)

    expect(log).to.equal('## <small>my version</small>\n')
  })

  it('should generate header if `isPatch` is falsy', function () {
    templateContext.isPatch = false
    const log = Handlebars.compile(template)(templateContext)

    expect(log).to.equal('## my version\n')
  })

  it('should generate header if `title` is truthy', function () {
    templateContext.title = 'my title'
    const log = Handlebars.compile(template)(templateContext)

    expect(log).to.equal('## my version "my title"\n')
  })

  it('should generate header if `date` is truthy', function () {
    templateContext.date = 'my date'
    const log = Handlebars.compile(template)(templateContext)

    expect(log).to.equal('## my version (my date)\n')
  })
})
