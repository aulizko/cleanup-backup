'use strict';

import url from 'url';
import FtpReaper from 'ftp-reap';
import FsReaper from 'fs-reap';
import {EventEmitter} from 'events';
import chalk from 'chalk';

export default class CleanupBackup extends EventEmitter {
    constructor(toWatch, threshold) {
        if (!threshold) {
            throw new Error('You must specify threshold property');
        }
        this.maxAge = threshold;

        this.ftpReaper = new FtpReaper();
        this.fsReaper = new FsReaper();

        // parse each entry at toWatch, determine if theis needs fs or ftp reaper and run them
        toWatch.forEach(location => {
            const parsedLocation = url.parse(location);

            if (parsedLocation.protocol === null) { // assume that are fs path
                this.fsReaper.watch(location);
            } else if (parsedLocation.protocol === 'ftp:' || parsedLocation.protocol === 'ftps:') {
                this.ftpReaper.watch(this.__buildFtpReaperConfigurationFromUri(parsedLocation));
            } else {
                console.log(chalk.yellow(
                    `Protocol ${parsedLocation.protocol} not supported. Problem occured with next location`,
                    chalk.underline(location)
                ));
            }
        });
    }

    __buildFtpReaperConfigurationFromUri(parsedLocation) {
        let configuration = {
            host: parsedLocation.hostname
        };

        if (parsedLocation.port) {
            configuration.port = Number(parsedLocation.port);
        }

        if (parsedLocation.path) {
            configuration.path = parsedLocation.path;
        }

        if (parsedLocation.auth) {
            [configuration.user, configuration.password] = parsedLocation.auth.split(':');
        }

        if (parsedLocation.protocol === 'ftps:') {
            configuration.secure = true;
        }

        return configuration;
    }

    run(callback) {
        this.ftpReaper.maxAge(this.maxAge);
        this.fsReaper.maxAge(this.maxAge);

        let promise = Promise.resolve(true);

        promise.then(Promise
            .all([
                this.ftpReaper.run(),
                this.fsReaper.run()
            ]));

        if (callback) {
            promise
                .then((...args) => {
                    if (callback && typeof callback === 'function') {
                        setTimeout(function () {
                            callback(null, args);
                        }, 0);
                    }
                })
                .catch((err) => {
                    if (callback && typeof callback === 'function') {
                        setTimeout(function () {
                            callback(err);
                        }, 0);
                    }
                });
        }

        return promise;
    }
}
