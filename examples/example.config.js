module.exports = (function () {
    'use strict';

    // pretend doing something smart here
    var toWatch = (function () {
        return [
            '/absolute/path/to/dir',
            'relative/path/use/with/caution',
            'ftp://my.beloved.ec2.bucket/',
            'ftp://user:password@my.backup.host/path/at/ftp/resource'
        ]
    })();

    return {
        threshold: '4 years',
        watch: toWatch
    }
})();
