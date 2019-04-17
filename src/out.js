const async = require('async');
const debug = require('debug')('jira-resource');

const addWatchers = require('./addWatchers.js');
const createIssue = require('./createIssue.js');
const updateIssue = require('./updateIssue.js');
const processTransitions = require('./processTransitions');
const searchIssues = require('./searchIssues.js');
const addComments = require('./addComments.js');

module.exports = (input, baseFileDir, callback) => {
  const source = input.source;
  const params = input.params;

  debug('input params: %s', JSON.stringify(input.params));

  async.waterfall(
    [
      (next) => {
        searchIssues(baseFileDir, source, params, next);
      },
      (issues, next) => {
        if (issues.length == 0) {
          createIssue(baseFileDir, source, params, next)
        } else {
          async.each(issues, function(issue, callback) {
            updateIssue(baseFileDir, issue, source, params, callback)
          }, function(err) {
            if (err) { return next(err) }
            else {
              next(null, issues);
            }
          });
        }
      },
      (issues, next) => {
        async.each(issues, function(issue, callback) {
          addWatchers(issue, source, params, callback);
        }, function(err) {
          if (err) { return next(err) }
          else {
            next(null, issues);
          }
        });
      },
      (issues, next) => {
        async.each(issues, function(issue, callback) {
          processTransitions(issue, source, params, callback);
        }, function(err) {
          if (err) { return next(err) }
          else {
            next(null, issues);
          }
        });
      },
      (issues, next) => {
        async.each(issues, function(issue, callback) {
          addComments(baseFileDir, issue, source, params, callback);
        }, function(err) {
          if (err) { return next(err) }
          else {
            next(null, issues);
          }
        });
      }
    ],
    (error, issues) => {
      let output = null;
      if (issues && issues.length > 0) {
        let metadata = [];
        for (let issue of issues) {
          metadata.push({
            name: issue.key,
            value: source.url.replace(/\/$/, "") + '/secure/QuickSearch.jspa?searchString=' + issue.key
          })
        }
        output = {
          version: {ref: 'none'},
          metadata: metadata
        };
      } else if (!error) {
        error = new Error('Could not create issue.');
      }

      callback(error, output);
    }
  );
};
