'use strict'
module.exports = Promise.resolve({
  writerOpts: {
    mainTemplate: '{{commitGroups.[0].commits.[0].type}}{{testContext}}template'
  }
})
