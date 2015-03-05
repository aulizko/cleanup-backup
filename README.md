# cleanup-backup

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]
[![Gittip][gittip-image]][gittip-url]

Delete files based on last modified date on the local file system or over FTP.

Personally, I use it to clean outdated backup files.

## CLI usage

```cli
$ npm install -g cleanup-backup

# specify threshold and as many locations as you want
$ cleanup-backup --threshold 3years /path/to/local/dir ftp://user:password@host/

# or use config file
$ cleanup-backup --config /path/to/my/config/file
```

Personally, I use `cleanup-backup` with config file and put it into my crontab.

### CLI options:

`-t`, `--threshold` Max age of files, can be in milliseconds or at human-readable format,
like `2weeks`, `3months`, `2w`, etc. More on human-readable time format see at [ms][ms-url] package API.

`-c`, `--config` Path to config file. It may be `.yaml` or `.json` or `.js`. More on config file format below.

`-h`, `--help` Show help.

`--version` Show version number.

### More CLI examples:

```cli
# Deletes all files that are older then two weeks at directory /path1 and at FTP resource.
$ cleanup-backup -t 2w /path1 ftp://host/

# Deletes all files that are older then 3 years at ftp resorce
$ cleanup-backup -t 3years ftp://user:password@resource/
```

### Config file format

Config file may be YAML, JSON, Node module formatted.
Thus, the supported file formats is `.yaml`, `.json`, `.js` respectively.

Config file must specify two properties:

1. Threshold - max age of a file. Can be integer number means it is milliseconds or human-readable format like `3 months`.
You can read more about human-readable format at [ms][ms-url] package API.
2. Watch - array of locations to reap. Each entry may be local filesystem path or FTP URI.

You can see example config files here:

* [YAML][yaml-config-file-example]
* [JSON][json-config-file-example]
* [Node module][js-config-file-example]

## Programmatic api

```js
var CleanupBackup = require('cleanup-backup');

var cleanupBackup = new CleanupBackup(
    [
        '/absolute/path/to/dir',
        'ftp://mirror1.backup',
        'ftp://mirror2.backup'
    ],
    '4 years'
);
```

### var cleanupBackup = new CleanupBackup(locations, threshold);

Instantiates CleanupBackup. No actions are performed here.

Both params are required.

`locations` is an array of locations (each location can be local file system path or FTP URI).

`threshold` set the max age of files to keep. Any files that are older than this will be removed.

### cleanupBackpu.run(callback).then( => ).catch(err => )

Actually starts to remove files.

Provides node-style `callback(err, value)` and promise support.

## License

MIT, see [LICENSE][license-url] for details.

[ms-url]: http://www.npmjs.com/package/ms
[yaml-config-file-example]: examples/example.config.yaml
[json-config-file-example]: examples/example.config.json
[js-config-file-example]: examples/example.config.js
[license-url]: LICENSE
[travis-image]: https://img.shields.io/travis/aulizko/cleanup-backup.svg?style=flat-square
[travis-url]: https://travis-ci.org/aulizko/cleanup-backup
[coveralls-image]: https://img.shields.io/coveralls/aulizko/cleanup-backup.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/aulizko/cleanup-backup
[npm-image]: https://img.shields.io/npm/v/cleanup-backup.svg?style=flat-square
[npm-url]: https://npmjs.org/package/cleanup-backup
[david-image]: http://img.shields.io/david/aulizko/cleanup-backup.svg?style=flat-square
[david-url]: https://david-dm.org/aulizko/cleanup-backup
[license-image]: http://img.shields.io/npm/l/cleanup-backup.svg?style=flat-square
[downloads-image]: http://img.shields.io/npm/dm/cleanup-backup.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/cleanup-backup
[gittip-image]: https://img.shields.io/gratipay/aulizko.svg?style=flat-square
[gittip-url]: https://gratipay.com/aulizko/
