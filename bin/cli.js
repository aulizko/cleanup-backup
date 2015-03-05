#!/usr/bin/env node


var yargs = require('yargs');
var CLI = require('../lib/cli.es6');
var util = require('util');
var chalk = require('chalk');

// Configure CLI options.
var argv = yargs
    .usage('Usage: $0 [options]')
    .example('$0 -t 2w /path1 ftp://host/',
    'Deletes all files that are older then two weeks at provided locations')
    .example('$0 -c /path/to/config/file',
    'Path to config file')
    .string('_')
    .describe('t', 'Max age of files, can be in milliseconds or at human-readable format, like "2weeks", "3months", "2w", etc.')
    .alias('t', 'threshold')
    .describe('c', 'Path to config file. It may be YAML or JSON formatted')
    .alias('c', 'config')
    .help('h')
    .alias('h', 'help')
    .epilogue('For more information, read http://github.com/aulizko/cleanup-backup/')
    .version(function () {
        return require('../package').version;
    })
    .strict()
    .argv;

var cli = new CLI();

cli.on('error', function (message, path) {
    'use strict';

    if (util.isError(message)) {
        throw message; // re-throw unexpected error to stop process
    }

    console.log(chalk.red(
        message,
        (path ? chalk.underline(path) : '')
    ));
});

cli.argv(argv);
