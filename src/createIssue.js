const _ = require('lodash');
const debug = require('debug')('jira-resource');

const requestIssue = require('./utils/requestIssue.js');

module.exports = (baseFileDir, source, params, callback) => {

  return createIssue((error, newIssue) => {
      if (newIssue) {
        callback(error, [newIssue]);
      } else {
        callback(error);
      }
  });

  function createIssue(done) {
    debug('Issue doesn\'t exist, creating new issue...');

    // check before create issue
    if (!params.summary) {
        return done(new Error('"summary" field is required for creating new issue.'));
    }

    return requestIssue(baseFileDir, source, params, source.url + '/rest/api/2/issue/', 'POST', (error, response, body) => {
      if (!error && !body) {
        return done(new Error('Could not create issue.'));
      }

      done(error, body);
    });
  }
};
