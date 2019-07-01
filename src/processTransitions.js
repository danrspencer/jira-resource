const _ = require('lodash');
const async = require('async');
const debug = require('debug')('jira-resource');
const request = require('request');

const debugResponse = require('./utils/debugResponse.js');

module.exports = (issue, source, params, callback) => {
  if (!issue) {
    return callback(null);
  }

  if (!params.transitions) {
    return callback(null, issue);
  }

  const transitionUrl = source.url + '/rest/api/2/issue/' + issue.id + '/transitions/';

  async.eachSeries(
    params.transitions,
    (nextTransition, next) => {
      processTransition(transitionUrl, nextTransition, () => {
        next();
      });
    },
    () => {
      callback(null, issue);
    }
  );

  function processTransition(transitionUrl, transitionName, done) {
    async.waterfall(
      [
        (next) => {
          debug('Searching for available transitions...');

          request(
            {
              method: 'GET',
              uri: transitionUrl,
              auth: {
                username: source.email,
                password: source.apitoken
              },
              json: true
            },
            (error, response, body) => {
              debugResponse(response);

              let matchTransitions = _.filter(body.transitions, (transition) => {
                return transition.name.toLowerCase() == transitionName.toLowerCase();
              });
              if (matchTransitions.length <= 0) {
                return done(new Error('Not found for: ' + transitionName + ", choices: " + body.transitions));
              }
              let transitionId = matchTransitions[0].id;

              next(error, transitionId);
            }
          );
        },
        (transitionId, done) => {
          debug('Performing transition: %s (%s)', transitionName, transitionId);

          request(
            {
              method: 'POST',
              uri: transitionUrl,
              auth: {
                username: source.email,
                password: source.apitoken
              },
              json: {
                transition: {
                  id: transitionId
                }
              }
            },
            (error, response) => {
              debugResponse(response);
              done(error);
            }
          );
        }
      ],
      done
    );
  }
};
