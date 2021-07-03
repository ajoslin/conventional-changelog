# conventional-changelog-conventionalcommits

[![NPM version][npm-image]][npm-url]
[![Build Status][ci-image]][ci-url]
[![Dependency Status][daviddm-image]][daviddm-url]
[![Codecov][codecov-image]][codecov-url]

## conventionalcommits.org convention

A concrete implementation of the specification described at
[conventionalcommits.org](https://conventionalcommits.org/) for automated
CHANGELOG generation and version management.


## Indirect Usage (as preset)

Use the [Conventional Changelog CLI Quick Start](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-cli#quick-start) with the `-p conventionalcommits` option.

## Direct Usage (as a base preset so you can customize it)

If you want to use this package directly and pass options, you can use the [Conventional Changelog CLI Quick Start](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-cli#quick-start) and with the `--config` or `-n` parameter, pass a js config that looks like this
```
'use strict'
const config = require('conventional-changelog-conventionalcommits')

module.exports = config({
    "issuePrefixes": ["TEST-"],
    "issueUrlFormat": "myBugTracker.com/{prefix}{id}"
})
```

or json config like that:
```
{
    "options": {
        "preset": {
            "name": "conventionalchangelog",
            "issuePrefixes": ["TEST-"],
            "issueUrlFormat": "myBugTracker.com/{prefix}{id}"
        }
    }
}
```
This last json config way passes the `preset` object to the `conventional-changelog-preset-loader` package, that in turn, passes this same `preset` object as the config for the `conventional-changelog-conventionalcommits`.


See [conventional-changelog-config-spec](https://github.com/conventional-changelog/conventional-changelog-config-spec) for available
configuration options.


[npm-image]: https://badge.fury.io/js/conventional-changelog-conventionalcommits.svg
[npm-url]: https://npmjs.org/package/conventional-changelog-conventionalcommits
[ci-image]: https://github.com/conventional-changelog/conventional-changelog/workflows/ci/badge.svg
[ci-url]: https://github.com/conventional-changelog/conventional-changelog/actions?query=workflow%3Aci+branch%3Amaster
[daviddm-image]: https://david-dm.org/conventional-changelog/conventional-changelog-angular.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/conventional-changelog/conventional-changelog-angular
[codecov-image]: https://codecov.io/gh/conventional-changelog/conventional-changelog/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/conventional-changelog/conventional-changelog
