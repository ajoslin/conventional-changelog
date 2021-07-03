# conventional-changelog

[![NPM version][npm-image]][npm-url]
[![Build Status][ci-image]][ci-url]
[![Dependency Status][daviddm-image]][daviddm-url]
[![Codecov][codecov-image]][codecov-url]

> Generate a changelog from git metadata


## Usage

You most likely only need to use this module if you're building a library that provides an abstraction on top of conventional commits,  See [Getting started](https://github.com/conventional-changelog/conventional-changelog#getting-started) if you're an end-user.

```sh
$ npm install --save conventional-changelog
```

```js
var conventionalChangelog = require('conventional-changelog');

conventionalChangelog({
  preset: 'angular'
})
  .pipe(process.stdout); // or any writable stream
```

Or if you want to use your own custom preset:

```js
var conventionalChangelog = require('conventional-changelog');

var config = require('@org/conventional-changelog-custom-preset');
conventionalChangelog({config})
  .pipe(process.stdout); // or any writable stream
```

## API

### conventionalChangelog([options, [context, [gitRawCommitsOpts, [parserOpts, [writerOpts]]]]])

Returns a readable stream.

#### options

See the [conventional-changelog-core](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-core) docs. The API is the same with the following changes or additions:

##### preset

Type: `string` Possible values: `'angular', 'atom', 'codemirror', 'ember', 'eslint', 'express', 'jquery', 'jscs', 'jshint'`

It's recommended to use a preset so you don't have to define everything yourself. Presets are names of built-in `config`.

A scoped preset package such as `@scope/conventional-changelog-custom-preset` can be used by passing `@scope/custom-preset` to this option.

**NOTE:** `options.config` will be overwritten by the values of preset. You should use either `preset` or `config`, but not both.

## [Notes for parent modules](https://github.com/conventional-changelog/conventional-changelog-core#notes-for-parent-modules)

## License

MIT

[npm-image]: https://badge.fury.io/js/conventional-changelog.svg
[npm-url]: https://npmjs.org/package/conventional-changelog
[ci-image]: https://github.com/conventional-changelog/conventional-changelog/workflows/ci/badge.svg
[ci-url]: https://github.com/conventional-changelog/conventional-changelog/actions?query=workflow%3Aci+branch%3Amaster
[daviddm-image]: https://david-dm.org/conventional-changelog/conventional-changelog.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/conventional-changelog/conventional-changelog
[codecov-image]: https://codecov.io/gh/conventional-changelog/conventional-changelog/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/conventional-changelog/conventional-changelog
