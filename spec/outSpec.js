'use strict'

const chai = require('chai');
const expect = chai.expect;

const moment = require('moment');
const nock = require('nock');
const out = require('../src/out.js');

const jira = require('./resources/jiraDetails.js');
const concourseInput = require('./resources/concourseInput.js');

nock.disableNetConnect();

describe('jira resource', () => {

    beforeEach(() => {
        nock.cleanAll();
    });

    it('checks for an existing issue', (done) => {
        let search = setupSearch();

        out(concourseInput(), '', () => {
            expect(search.isDone()).to.be.true;
            done();
        });
    });

    describe('transitions', () => {

        let issueId = 15805;

        beforeEach(() => {
            setupSearch([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: issueId,
                    self: "https://jira.atlassian.net/rest/api/2/issue/" + issueId,
                    key: "ATP-1",
                    fields: {
                        summary: "TEST 1.106.0"
                    }
                }
            ]);

            nock(jira.url)
                .put('/rest/api/2/issue/' + issueId, {
                    fields: {
                        project: {
                            key: "ATP"
                        },
                        issuetype: {
                            name: "Bug"
                        },
                        summary: "TEST 1.106.0",
                        description: "Inline static description"
                    }
                })
                .basicAuth({
                    user: jira.user,
                    pass: jira.pass
                })
                .reply(200)
        });

        it('updates an issue with a transition', (done) => {
            nock(jira.url)
                .get('/rest/api/2/issue/' + issueId + '/transitions/')
                .basicAuth({
                    user: jira.user,
                    pass: jira.pass
                })
                .reply(200, {
                    "expand": "transitions",
                    "transitions": [
                        {
                            "id": "51",
                            "name": "Submit"
                        }
                    ]
                });

            let transition = nock(jira.url)
                .post('/rest/api/2/issue/' + issueId + '/transitions/', {
                    transition: {
                        id: "51"
                    }
                })
                .basicAuth({
                    user: jira.user,
                    pass: jira.pass
                })
                .reply(204);

            let input = concourseInput();

            input.params.transitions = [
                'Submit'
            ];

            out(input, '',  () => {
                expect(transition.isDone()).to.be.true;
                done();
            });
        });

        it('can handle multiple possible transitions', (done) => {
            let input = concourseInput();
            input.params.transitions = [
                'Reject'
            ];

            nock(jira.url)
                .get('/rest/api/2/issue/' + issueId + '/transitions/')
                .basicAuth({
                    user: jira.user,
                    pass: jira.pass
                })
                .reply(200, {
                    "expand": "transitions",
                    "transitions": [
                        {
                            "id": "51",
                            "name": "Submit"
                        },
                        {
                            "id": "60",
                            "name": "Reject"
                        }
                    ]
                });

            let transition = nock(jira.url)
                .post('/rest/api/2/issue/' + issueId + '/transitions/', {
                    transition: {
                        id: "60"
                    }
                })
                .basicAuth({
                    user: jira.user,
                    pass: jira.pass
                })
                .reply(204);

            out(input, '',  () => {
                expect(transition.isDone()).to.be.true;
                done();
            });
        });

        it('can progress through multiple transitions', (done) => {
            let input = concourseInput();
            input.params.transitions = [
                'Submit', 'Test', 'Reject'
            ];

            let transitions = [
                [ { "id": "51", "name": "Submit" } ],
                [ { "id": "69", "name": "Test" } ],
                [ { "id": "12",  "name": "Complete" }, { "id": "13",  "name": "Reject" } ]
            ];
            nock(jira.url)
                .get('/rest/api/2/issue/' + issueId + '/transitions/')
                .basicAuth({ user: jira.user, pass: jira.pass })
                .reply(200, { "expand": "transitions", "transitions": transitions[0] })
                .get('/rest/api/2/issue/' + issueId + '/transitions/')
                .basicAuth({ user: jira.user, pass: jira.pass })
                .reply(200, { "expand": "transitions", "transitions": transitions[1] })
                .get('/rest/api/2/issue/' + issueId + '/transitions/')
                .basicAuth({ user: jira.user, pass: jira.pass })
                .reply(200, { "expand": "transitions", "transitions": transitions[2] });

            let transition1 = nock(jira.url)
                .post('/rest/api/2/issue/' + issueId + '/transitions/', {
                    transition: {
                        id: "51"
                    }
                })
                .basicAuth({
                    user: jira.user,
                    pass: jira.pass
                })
                .reply(204);

            let transition2 = nock(jira.url)
                .post('/rest/api/2/issue/' + issueId + '/transitions/', {
                    transition: {
                        id: "69"
                    }
                })
                .basicAuth({
                    user: jira.user,
                    pass: jira.pass
                })
                .reply(204);

            let transition3 = nock(jira.url)
                .post('/rest/api/2/issue/' + issueId + '/transitions/', {
                    transition: {
                        id: "13"
                    }
                })
                .basicAuth({
                    user: jira.user,
                    pass: jira.pass
                })
                .reply(204);

            out(input, '',  () => {
                expect(transition1.isDone(), 'Transition 1').to.be.true;
                expect(transition2.isDone(), 'Transition 2').to.be.true;
                expect(transition3.isDone(), 'Transition 3').to.be.true;
                done();
            });
        });

        it('performs transitions on new issues', (done) => {

            let input = concourseInput();
            input.params.transitions = [
                'Submit'
            ];

            nock.cleanAll();

            setupSearch();

            setupCreate({
                fields: {
                    project: {
                        key: "ATP"
                    },
                    issuetype: {
                        name: "Bug"
                    },
                    summary: "TEST 1.106.0",
                    description: "Inline static description"
                }
            });

            nock(jira.url)
                .get('/rest/api/2/issue/' + issueId + '/transitions/')
                .basicAuth({
                    user: jira.user,
                    pass: jira.pass
                })
                .reply(200, {
                    "expand": "transitions",
                    "transitions": [
                        {
                            "id": "51",
                            "name": "Submit"
                        }
                    ]
                });

            let transition = nock(jira.url)
                .post('/rest/api/2/issue/' + issueId + '/transitions/', {
                    transition: {
                        id: "51"
                    }
                })
                .basicAuth({
                    user: jira.user,
                    pass: jira.pass
                })
                .reply(204);

            out(input, '',  () => {
                expect(transition.isDone()).to.be.true;
                done();
            });
        });

        it('isn\'t case sensitive for transitions', (done) => {
            nock(jira.url)
                .get('/rest/api/2/issue/' + issueId + '/transitions/')
                .basicAuth({
                    user: jira.user,
                    pass: jira.pass
                })
                .reply(200, {
                    "expand": "transitions",
                    "transitions": [
                        {
                            "id": "51",
                            "name": "SUBMIT"
                        }
                    ]
                });

            let transition = nock(jira.url)
                .post('/rest/api/2/issue/' + issueId + '/transitions/', {
                    transition: {
                        id: "51"
                    }
                })
                .basicAuth({
                    user: jira.user,
                    pass: jira.pass
                })
                .reply(204);

            let input = concourseInput();

            input.params.transitions = [
                'submit'
            ];

            out(input, '',  () => {
                expect(transition.isDone()).to.be.true;
                done();
            });
        });
    });

});

function setupSearch(issues, summary) {
    issues = issues || [];
    summary = summary || 'TEST 1.106.0';

    return nock(jira.url)
        .post('/rest/api/2/search/', {
            jql: 'project="ATP" AND summary~"' + summary + '" ORDER BY id DESC',
            maxResults: 1,
            fields: [
                "key",
                "summary"
            ]
        })
        .basicAuth({
            user: jira.user,
            pass: jira.pass
        })
        .reply(200, {
            expand: "names,schema",
            startAt: 0,
            maxResults: 1,
            total: issues.length,
            issues: issues
        });
}

function setupCreate(expectedBody) {
    return nock(jira.url)
        .post('/rest/api/2/issue/', expectedBody)
        .basicAuth({
            user: jira.user,
            pass: jira.pass
        })
        .reply(200, {
            id: "15805",
            key: "ATP-1",
            self: jira.url + "rest/api/2/issue/15805"
        });
}