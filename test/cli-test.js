'use strict';

/*global describe, it, beforeEach*/

var CleanupBackup = require('../src/cleanup-backup.es6');
var CLI = require('../src/cli.es6');
var path = require('path');
var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;
chai.use(require('sinon-chai'));

describe('CLI', function () {
    describe('#constructor()', function () {
        it('should create instance of CLI', function () {
            var cli = new CLI();
            expect(cli).to.not.be.an('undefined');
            expect(cli).to.be.an.instanceof(CLI);
        })
    });

    describe('#argv()', function () {
        var cli;
        beforeEach(function () {
            cli = new CLI();
        });

        it('should call loadYamlConfig if config file extension is .yaml', function () {
            var loadYamlStub = sinon.stub(cli, 'loadYamlConfig');

            cli.argv({config: 'test.yaml'});

            expect(loadYamlStub).to.have.callCount(1);
            expect(loadYamlStub).to.have.calledWith(path.resolve(process.cwd(), 'test.yaml'));
            loadYamlStub.restore();
        });

        it('should call loadJsFriendlyConfig if config file extension is .js', function () {
            var loadJsFriendlyConfigStub = sinon.stub(cli, 'loadJsFriendlyConfig');

            cli.argv({config: 'test.js'});

            expect(loadJsFriendlyConfigStub).to.have.callCount(1);
            expect(loadJsFriendlyConfigStub).to.have.calledWith(path.resolve(process.cwd(), 'test.js'));
            loadJsFriendlyConfigStub.restore();
        });

        it('should call loadJsFriendlyConfig if config file extension is .json', function () {
            var loadJsFriendlyConfigStub = sinon.stub(cli, 'loadJsFriendlyConfig');

            cli.argv({config: 'test.json'});

            expect(loadJsFriendlyConfigStub).to.have.callCount(1);
            expect(loadJsFriendlyConfigStub).to.have.calledWith(path.resolve(process.cwd(), 'test.json'));
            loadJsFriendlyConfigStub.restore();
        });

        it('should emit error message if config file provided, but without fitting file extension', function (done) {
            cli.on('error', function (message) {
                expect(message).to.equal('Unsupported config file extension');
                done();
            });

            cli.argv({config: 'abracadabra'});
        });

        it('should call validate method if config property is undefined in argv', function () {
            var validateSpy = sinon.stub(cli, 'validate');
            var runStub = sinon.stub(cli, 'run');

            cli.argv({_: [1, 2, 3], threshold: 10});

            expect(validateSpy).to.have.callCount(1);
            expect(validateSpy).to.have.calledWith({watch: [1, 2, 3], threshold: 10}, true);

            validateSpy.restore();
            runStub.restore();
        });

        it('should call run method if validation is successfull', function () {
            var validateStub = sinon.stub(cli, 'validate');
            validateStub.returns(true);
            var runStub = sinon.stub(cli, 'run');

            cli.argv({});

            expect(validateStub).to.have.callCount(1);
            expect(validateStub).to.have.calledWith({ threshold: undefined, watch: undefined }, true);

            expect(runStub).to.have.callCount(1);
            expect(runStub).to.have.calledWith({ threshold: undefined, watch: undefined });

            validateStub.restore();
            runStub.restore();
        });

        it('should not call run method if validation failed', function () {
            var validateStub = sinon.stub(cli, 'validate');
            validateStub.returns(false);
            var runStub = sinon.stub(cli, 'run');

            cli.argv({});

            expect(validateStub).to.have.callCount(1);
            expect(validateStub).to.have.calledWith({ threshold: undefined, watch: undefined }, true);

            expect(runStub).to.have.callCount(0);

            validateStub.restore();
            runStub.restore();
        });
    });

    describe('#validate()', function () {
        var cli;
        beforeEach(function () {
            cli = new CLI();
        });

        it('should emit error if config param is falsie', function (done) {
            cli.on('error', function (message) {
                expect(message).to.equal('Empty or mistyped config file');
                done();
            });

            cli.validate();
        });

        it('should emit one error if threshold is unspecified and we are working with config file', function (done) {
            cli.on('error', function (message) {
                expect(message).to.equal('Config file must specify "threshold" option');
                done();
            });

            cli.validate({});
        });
        it('should emit another error if threshold is unspecified and we are working with cli params', function (done) {
            cli.on('error', function (message) {
                expect(message).to.equal('Please specify threshold option');
                done();
            });

            cli.validate({}, true);
        });

        it('should emit error if watch are falsie', function (done) {
            cli.on('error', function (message) {
                expect(message).to.equal('Config file must specify "watch" option');
                done();
            });

            cli.validate({threshold: 10});
        });

        it('should emit special error if watch are falsie and we are working from command line', function (done) {
            cli.on('error', function (message) {
                expect(message).to.equal('Please specify at least one location');
                done();
            });

            cli.validate({threshold: 10}, true);
        });

        it('should emit special  error if watch array are empty and we are working with cli', function (done) {
            cli.on('error', function (message) {
                expect(message).to.equal('Please specify at least one location');
                done();
            });

            cli.validate({threshold: 10, watch: []}, true);
        });

        it('should emit special error if watch are empty and we are working with config file', function (done) {
            cli.on('error', function (message) {
                expect(message).to.equal('Config file must specify "watch" option');
                done();
            });

            cli.validate({threshold: 10, watch: []});
        });

        it('should return true if all checks passed', function () {
            expect(cli.validate({threshold: 10, watch: [1]})).to.equal(true);
            expect(cli.validate({threshold: 10, watch: [1]}), true).to.equal(true);
        });
    });

    describe('#run()', function () {
        var cli;
        beforeEach(function () {
            cli = new CLI();
        });

        it('should emit success event when deletion is done', function (done) {
            var cleanupBackupRunMethodStub = sinon.stub(CleanupBackup.prototype, 'run');
            cleanupBackupRunMethodStub.returns(Promise.resolve(true));

            cli.on('success', function (message) {
                expect(message).to.equal('Job\'s done');
                cleanupBackupRunMethodStub.restore();

                done();
            });

            cli.argv({_: ['ftp://host/'], threshold: 10});
        });
    });

    describe('#loadYamlConfig()', function () {
        var cli;
        beforeEach(function () {
            cli = new CLI();
        });

        it('should load valid yaml file', function (done) {
            var validateStub = sinon.stub(cli, 'validate');
            validateStub.returns(false);
            cli.loadYamlConfig(path.resolve(__dirname, '../examples/example.config.yaml'));

            setTimeout(function () { // omg, I will burn in hell for that
                expect(validateStub).to.have.callCount(1);
                expect(validateStub).to.have.calledWith({
                    watch: [
                        '/absolute/path/to/dir',
                        'relative/path/use/with/caution',
                        'ftp://my.beloved.ec2.bucket/',
                        'ftp://user:password@my.backup.host/path/at/ftp/resource'
                    ],
                    threshold: '4 years'
                });

                validateStub.restore();
                done();
            }, 100);
        });

        it('should re-emit any error that came from yaml-config-loader', function (done) {
            cli.on('error', function (message, path) {
                expect(message).to.equal('Can\'t find config file');
                expect(path).to.equal('abracadabra');
                done();
            });

            cli.loadYamlConfig('abracadabra');
        });

        it('should call validate on config that came from file', function (done) {
            var validateStub = sinon.stub(cli, 'validate');
            validateStub.returns(false);
            cli.loadYamlConfig(path.resolve(__dirname, '../examples/example.config.yaml'));

            setTimeout(function () {
                expect(validateStub).to.have.callCount(1);
                expect(validateStub).to.have.calledWith({
                    watch: [
                        '/absolute/path/to/dir',
                        'relative/path/use/with/caution',
                        'ftp://my.beloved.ec2.bucket/',
                        'ftp://user:password@my.backup.host/path/at/ftp/resource'
                    ],
                    threshold: '4 years'
                });

                validateStub.restore();
                done();
            }, 100);
        });

        it('should call run method if validation was successfull', function (done) {
            var runMethod = sinon.stub(cli, 'run');
            cli.loadYamlConfig(path.resolve(__dirname, '../examples/example.config.yaml'));

            setTimeout(function () {
                expect(runMethod).to.have.callCount(1);
                expect(runMethod).to.have.calledWith({
                    watch: [
                        '/absolute/path/to/dir',
                        'relative/path/use/with/caution',
                        'ftp://my.beloved.ec2.bucket/',
                        'ftp://user:password@my.backup.host/path/at/ftp/resource'
                    ],
                    threshold: '4 years'
                });

                runMethod.restore();
                done();
            }, 100);
        });
    });

    describe('#loadJsFriendlyConfig()', function () {
        var cli;
        beforeEach(function () {
            cli = new CLI();
        });

        it('should load valid json file', function () {
            var validateStub = sinon.stub(cli, 'validate');
            validateStub.returns(false);

            cli.loadJsFriendlyConfig(path.resolve(__dirname, '../examples/example.config.json'));

            expect(validateStub).to.have.callCount(1);
            expect(validateStub).to.have.calledWith({
                watch: [
                    '/absolute/path/to/dir',
                    'relative/path/use/with/caution',
                    'ftp://my.beloved.ec2.bucket/',
                    'ftp://user:password@my.backup.host/path/at/ftp/resource'
                ],
                threshold: '4 years'
            });

            validateStub.restore();
        });

        it('should load valid js file', function () {
            var validateStub = sinon.stub(cli, 'validate');
            validateStub.returns(false);

            cli.loadJsFriendlyConfig(path.resolve(__dirname, '../examples/example.config.js'));

            expect(validateStub).to.have.callCount(1);
            expect(validateStub).to.have.calledWith({
                watch: [
                    '/absolute/path/to/dir',
                    'relative/path/use/with/caution',
                    'ftp://my.beloved.ec2.bucket/',
                    'ftp://user:password@my.backup.host/path/at/ftp/resource'
                ],
                threshold: '4 years'
            });

            validateStub.restore();
        });

        it('should emit it\'s own error event if file wasn\'t found', function (done) {
            cli.on('error', function (message, path) {
                expect(message).to.equal('Can\'t find config file');
                expect(path).to.equal('abracadabra');
                done();
            });

            cli.loadJsFriendlyConfig('abracadabra');
        });

        it('should call run method if validation was successfull', function () {
            var runMethodStub = sinon.stub(cli, 'run');

            cli.loadJsFriendlyConfig(path.resolve(__dirname, '../examples/example.config.js'));

            expect(runMethodStub).to.have.callCount(1);
            expect(runMethodStub).to.have.calledWith({
                watch: [
                    '/absolute/path/to/dir',
                    'relative/path/use/with/caution',
                    'ftp://my.beloved.ec2.bucket/',
                    'ftp://user:password@my.backup.host/path/at/ftp/resource'
                ],
                threshold: '4 years'
            });

            runMethodStub.restore();
        });
    });
});
