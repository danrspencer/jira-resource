

const nock = require('nock');

nock.disableNetConnect();

const out = require('../src/out.js');

describe('prometheus client', () => {

    const jiraUrl = 'http://jira.com';

    it('returns the issue key', () => {

        nock(jiraUrl)
            .get('/')
            .reply(200, { issues: [ { key: 'TEST-123' } ] });




        var result = out({
                params: {},
                source: {
                    url: jiraUrl
                }
            }
        );

        expect(result).toEqual({
            version: { issue: 'TEST-123' }
        });
    });

});