# git-raw-commits

[![NPM version][npm-image]][npm-url]
[![Build Status][ci-image]][ci-url]
[![Dependency Status][daviddm-image]][daviddm-url]
[![Codecov][codecov-image]][codecov-url]

> Get raw git commits out of your repository using git-log(1)


## Install

```sh
$ npm install --save git-raw-commits
```


## Usage

```js
var gitRawCommits = require('git-raw-commits');

gitRawCommits(options)
  .pipe(...);
```


## API

### gitRawCommits(gitOpts, [execOpts])

Returns a readable stream. Stream is split to break on each commit.

#### gitOpts

Type: `object`

Please check the available options at http://git-scm.com/docs/git-log.
**NOTE:** Single dash arguments are not supported because of https://github.com/sindresorhus/dargs/blob/master/index.js#L5.

*NOTE*: for `<revision range>` we can also use `<from>..<to>` pattern, and this module has the following extra options for shortcut of this pattern:

##### gitOpts.from

Type: `string` Default: `''`

##### gitOpts.to

Type: `string` Default: `'HEAD'`

This module also have the following additions:

##### gitOpts.format

Type: `string` Default: `'%B'`

Please check http://git-scm.com/docs/git-log for format options.

##### gitOpts.debug

Type: `function`

A function to get debug information.

##### gitOpts.path

Type: `string`

Filter commits to the path provided.

##### execOpts

Options to pass to `git` `childProcess`

Type: `object`

##### execOpts.cwd

Type: `string`

Current working directory to execute git in


## CLI

```sh
$ npm install --global git-raw-commits
$ git-raw-commits --help # for more details
```


## License

MIT © [Steve Mao](https://github.com/stevemao)


[npm-image]: https://badge.fury.io/js/git-raw-commits.svg
[npm-url]: https://npmjs.org/package/git-raw-commits
[ci-image]: https://github.com/conventional-changelog/conventional-changelog/workflows/ci/badge.svg
[ci-url]: https://github.com/conventional-changelog/conventional-changelog/actions?query=workflow%3Aci+branch%3Amaster
[daviddm-image]: https://david-dm.org/conventional-changelog/git-raw-commits.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/conventional-changelog/git-raw-commits
[codecov-image]: https://codecov.io/gh/conventional-changelog/conventional-changelog/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/conventional-changelog/conventional-changelog
