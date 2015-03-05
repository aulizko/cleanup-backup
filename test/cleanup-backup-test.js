'use strict';

/*global describe, it, beforeEach*/

var CleanupBackup = require('../src/cleanup-backup.es6');
var path = require('path');
var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var FtpReaper = require('ftp-reap');
var FsReaper = require('fs-reap');

describe('CleanBackup', function () {
    describe('#constructor', function () {
        it('should throw an error if threshold option is not provided', function () {
            function instantiateCleanBackupWithoutParams() {
                return new CleanupBackup();
            }

            expect(instantiateCleanBackupWithoutParams).to.throw('You must specify threshold property');
        });

        it('should create maxAge property', function () {
            var c1 = new CleanupBackup([], 1000);
            expect(c1.maxAge).to.equal(1000);

            var c2 = new CleanupBackup([], '3 years');
            expect(c2.maxAge).to.equal('3 years');
        });

        it('should instantiate FtpReaper and FsReaper and store them as properties', function () {
            var c = new CleanupBackup([], 1);
            expect(c.ftpReaper).to.not.be.an('undefined');
            expect(c.ftpReaper).to.be.an.instanceof(FtpReaper);

            expect(c.fsReaper).to.not.be.an('undefined');
            expect(c.fsReaper).to.be.an.instanceof(FsReaper);
        });

        it('should parse toWatch param and store pass it to appropriate reaper', function () {
            var c = new CleanupBackup([
                'path/to/local',
                'ftp://host/'
            ], 1);

            expect(c.ftpReaper.workers.length).to.equal(1);
            expect(c.ftpReaper.workers[0].connection.host).to.equal('host');
            expect(c.ftpReaper.workers[0].connection.path).to.equal('/');

            expect(c.fsReaper.dirs.length).to.equal(1);
            expect(c.fsReaper.dirs[0]).to.equal(path.resolve(process.cwd(), 'path/to/local'));
        });

        it('should ignore unsupported URI with unsupported protocols', function () {
            var c = new CleanupBackup([
                'http://host.dom/',
                'gopher://host.cc.olo/'
            ], 1);

            expect(c.ftpReaper.workers.length).to.equal(0);
            expect(c.fsReaper.dirs.length).to.equal(0);
        });

        it('should call __buildFtpReaperConfigurationFromUri for every ftp url', function () {
            var spy = sinon.spy(CleanupBackup.prototype, '__buildFtpReaperConfigurationFromUri');

            new CleanupBackup([
                'ftp://host.dom/',
                'ftps://host.cc.olo/'
            ], 1);

            expect(spy).to.have.callCount(2);
            spy.restore();
        });
    });

    describe('#__buildFtpReaperConfigurationFromUri()', function () {
        var cleanupBackup;

        beforeEach(function () {
            cleanupBackup = new CleanupBackup([
                'ftp://authenticated:userpasswd@testhost.tt:9999/~complicated/path?showHidden=true',
                'ftp://defaultporttest.ru',
                'ftps://testhost.tt'
            ], 1);
        });

        it('should use hostname, i.e. without port (if any)', function () {
            expect(cleanupBackup.ftpReaper.workers[0].connection.host).to.equal('testhost.tt');
        });

        it('should use port if provided and return nothing if none was given', function () {
            expect(cleanupBackup.ftpReaper.workers[0].connection.port).to.equal(9999);
            expect(cleanupBackup.ftpReaper.workers[1].connection.port).to.be.an('undefined');
        });

        it('should return provided path with search part', function () {
            expect(cleanupBackup.ftpReaper.workers[0].connection.path).to.equal('/~complicated/path?showHidden=true');
            expect(cleanupBackup.ftpReaper.workers[1].connection.path).to.equal('/');
        });

        it('should split auth part of url into username and password', function () {
            expect(cleanupBackup.ftpReaper.workers[0].connection.user).to.equal('authenticated');
            expect(cleanupBackup.ftpReaper.workers[0].connection.password).to.equal('userpasswd');
        });

        it('should not specify username and password if non given', function () {
            expect(cleanupBackup.ftpReaper.workers[1].connection.user).to.be.an('undefined');
            expect(cleanupBackup.ftpReaper.workers[1].connection.password).to.be.an('undefined');
        });

        it('should set secure flag only if protocol is ftps', function () {
            expect(cleanupBackup.ftpReaper.workers[0].connection.secure).to.be.an('undefined');
            expect(cleanupBackup.ftpReaper.workers[1].connection.secure).to.be.an('undefined');
            expect(cleanupBackup.ftpReaper.workers[2].connection.secure).to.equal(true);
        });
    });

    describe('#run()', function () {
        var cleanupBackup;

        beforeEach(function () {
            cleanupBackup = new CleanupBackup([
            ], 1000);
        });

        it('should set maxAge property for both reapers', function (done) {
            cleanupBackup
                .run()
                .then(function () {
                    expect(cleanupBackup.ftpReaper.__maxAge).to.equal(1000);
                    expect(cleanupBackup.fsReaper.mmaxage).to.equal(1000);
                    done();
                })
                .catch(done);
        });

        it('should actually call #run() method of both reapers', function (done) {
            var ftpSpy = sinon.spy(cleanupBackup.ftpReaper, 'run');
            var fsSpy = sinon.spy(cleanupBackup.fsReaper, 'run');

            cleanupBackup
                .run()
                .then(function () {
                    expect(ftpSpy).to.have.callCount(1);
                    expect(fsSpy).to.have.callCount(1);

                    ftpSpy.restore();
                    fsSpy.restore();
                    done();
                })
                .catch(done);
        });

        it('should call callback after run', function (done) {
            cleanupBackup.run(function (err, value) {
                expect(err).to.equal(null); // erm... Don't know how to test function call inside of sinon spy
                expect(value).to.be.an.instanceof(Array);

                done();
            });
        });

        it('should return promise', function () {
            var thenable = cleanupBackup.run();
            // I prefer duck typing for this case
            expect(thenable).to.respondTo('then');
            expect(thenable).to.respondTo('catch');
        });
    });
});

