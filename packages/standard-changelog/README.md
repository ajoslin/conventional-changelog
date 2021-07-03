# Standard CHANGELOG

[![NPM version][npm-image]][npm-url]
[![Build Status][ci-image]][ci-url]
[![Dependency Status][daviddm-image]][daviddm-url]
[![Codecov][codecov-image]][codecov-url]

> An opinionated approach to CHANGELOG generation using angular commit conventions.

## Quick Start

```sh
$ npm install -g standard-changelog
$ cd my-project
$ standard-changelog
```

The above generates a changelog based on commits since the last semver tag that match the pattern of a "Feature", "Fix", "Performance Improvement" or "Breaking Changes".

**your first release:**

If you're using this tool for the first time and want to generate new content in CHANGELOG.md, you can run:

```sh
$ standard-changelog --first-release
```

**advanced topics:**

All available command line parameters can be listed using [CLI](#cli) : `standard-changelog --help`.

## Programmatic Usage

```sh
$ npm install --save standard-changelog
```

```js
var standardChangelog = require('standard-changelog');

standardChangelog()
  .pipe(process.stdout); // or any writable stream
```

## CLI

```sh
$ npm install -g standard-changelog
$ standard-changelog --help
```

## API

See the [conventional-changelog](https://github.com/ajoslin/conventional-changelog) docs with the angular preset.

## License

MIT

[npm-image]: https://badge.fury.io/js/standard-changelog.svg
[npm-url]: https://npmjs.org/package/standard-changelog
[ci-image]: https://github.com/conventional-changelog/conventional-changelog/workflows/ci/badge.svg
[ci-url]: https://github.com/conventional-changelog/conventional-changelog/actions?query=workflow%3Aci+branch%3Amaster
[daviddm-image]: https://david-dm.org/conventional-changelog/standard-changelog.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/conventional-changelog/standard-changelog
[codecov-image]: https://codecov.io/gh/conventional-changelog/conventional-changelog/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/conventional-changelog/conventional-changelog
