'use strict';

import path from 'path';
import Loader from 'yaml-config-loader';
import chalk from 'chalk';
import {EventEmitter} from 'events';

import CleanupBackup from './cleanup-backup.es6';

export default class CLI extends EventEmitter {
    argv(argv) {
        'use strict';

        if (argv.config) { // config option is set, try to load config file
            const filePath = path.resolve(process.cwd(), argv.config);
            const ext = path.extname(argv.config);
            if (ext === '.yaml') {
                this.loadYamlConfig(filePath);
            } else if (ext === '.json' || ext === '.js') {
                this.loadJsFriendlyConfig(filePath);
            } else {
                this.emit('error', 'Unsupported config file extension');
            }
        } else {
            let config = {
                watch: argv._,
                threshold: argv.threshold
            };

            if (this.validate(config, true)) {
                this.run(config);
            }
        }
    }

    validate(config, fromCommandLine = false) {
        if (!config) {
            this.emit('error', 'Empty or mistyped config file');
            return false;
        }

        if (!config.threshold) {
            if (fromCommandLine) {
                this.emit('error', 'Please specify threshold option');
            } else {
                this.emit('error', 'Config file must specify "threshold" option');
            }

            return false;
        }

        if (!config.watch || config.watch.length === 0) {
            if (fromCommandLine) {
                this.emit('error', 'Please specify at least one location');
            } else {
                this.emit('error', 'Config file must specify "watch" option');
            }
        }

        return true;
    }

    run(config) {
        const cleanupBackup = new CleanupBackup(config.watch, config.threshold);

        cleanupBackup
            .run()
            .then(() => this.emit('success', 'Job\'s done'))
            .catch(error => this.emit('error', error));
    }

    loadYamlConfig(filePath) {
        const loader = new Loader();

        loader.addFile(filePath);
        loader.load((error, config) => {
            if (error) {
                if (error.message.indexOf('Specified configuration file') !== -1 &&
                    error.message.indexOf('not found') !== -1) {

                    return this.emit('error', 'Can\'t find config file', filePath);
                } else {
                    throw error;
                }
            }

            if (this.validate(config)) {
                this.run(config);
            }
        });
    }

    loadJsFriendlyConfig(filePath) {
        let config;
        try {
            config = require(filePath);
        } catch (requireError) {
            if (requireError.message.indexOf('Cannot find module') !== -1) {
                this.emit('error', 'Can\'t find config file', filePath);
                return;
            } else {
                throw requireError; // something special, re-throw to stop process
            }
        }

        if (this.validate(config)) {
            this.run(config);
        }
    }
}
