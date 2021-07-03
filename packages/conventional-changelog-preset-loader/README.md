# conventional-changelog-preset-loader

[![NPM version][npm-image]][npm-url]
[![Build Status][ci-image]][ci-url]
[![Dependency Status][daviddm-image]][daviddm-url]
[![Codecov][codecov-image]][codecov-url]

> Configuration preset loader for `conventional-changelog`.

## Usage

```sh
$ npm install --save conventional-changelog-preset-loader
```

```js
var conventionalChangelogPresetLoader = require('conventional-changelog-preset-loader');

configuration = conventionalChangelogPresetLoader(`angular`);
```


The string that is passed to the preset loader is manipulated by prepending `conventional-changelog` to the name.

For example:
* `angular` => `conventional-changelog-angular`
* `angular/preset/path` => `conventional-changelog-angular/preset/path`
* `@scope/angular` => `@scope/conventional-changelog-angular`
* `@scope/angular/preset/path` => `@scope/conventional-changelog-angular/preset/path`

Will return whatever is exported by the preset package. That may be a configuration object, a function, or a promise.

## License

MIT © [Steve Mao](https://github.com/stevemao)

[npm-image]: https://badge.fury.io/js/conventional-changelog-preset-loader.svg
[npm-url]: https://npmjs.org/package/conventional-changelog-preset-loader
[ci-image]: https://github.com/conventional-changelog/conventional-changelog/workflows/ci/badge.svg
[ci-url]: https://github.com/conventional-changelog/conventional-changelog/actions?query=workflow%3Aci+branch%3Amaster
[daviddm-image]: https://david-dm.org/conventional-changelog/conventional-changelog-preset-loader.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/conventional-changelog/conventional-changelog-preset-loader
[codecov-image]: https://codecov.io/gh/conventional-changelog/conventional-changelog/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/conventional-changelog/conventional-changelog
