'use strict'

const parserOpts = require('./parser-opts')
const writerOpts = require('./writer-opts')

module.exports = Promise.all([parserOpts, writerOpts])
  .then(([parserOpts, writerOpts]) => {
    return { parserOpts, writerOpts }
  })
