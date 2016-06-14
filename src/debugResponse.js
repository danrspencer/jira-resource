
const debug = require('debug')('jira-resource');

module.exports = (response) => {
    debug(
        'Response: (%s) %s',
        response.statusCode,
        response.body ? JSON.stringify(response.body, null, 2) : '-empty body-'
    );
};