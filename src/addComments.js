const async = require('async');
const debug = require('debug')('jira-resource');
const request = require('request');
const replaceTextFileString = require('./replaceTextFileString.js');
const debugResponse = require('./debugResponse.js');

module.exports = (baseFileDir, issue, source, params, callback) => {
  if (!issue) {
    return callback(null);
  }

  if (!params.comments) {
    return callback(null, issue);
  }

  const commentsUrl = source.url + '/rest/api/2/issue/' + issue.id + '/comment/';

  debug('Adding comments...');

  async.each(
    params.comments,
    (comment, next) => {
      const content = replaceTextFileString(baseFileDir, comment.content);
      debug('Adding: %s', content);

      request(
        {
          method: 'POST',
          uri: commentsUrl,
          auth: {
            username: source.username,
            password: source.password
          },
          json: {
            body: content
          }
        },
        (error, response) => {
          debugResponse(response);
          next(error);
        }
      );
    },
    (error) => {
      callback(error, issue);
    }
  );
};
