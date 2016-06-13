'use strict'

const chai = require('chai');
const expect = chai.expect;

const moment = require('moment');
const nock = require('nock');
const out = require('../src/out.js');

const jiraUrl = 'http://jira.com';
const jiraUser = 'dave';
const jiraPass = 'letmein';

nock.disableNetConnect();

describe('prometheus client', () => {

    beforeEach(() => {
        nock.cleanAll();
    });

    it('checks for an existing issue', (done) => {
        let search = setupSearch();

        out(concourseInput(), () => {
            expect(search.isDone()).to.be.true;
            done();
        });
    });

    describe('no existing issue', () => {
        let create;

        beforeEach(() => {
            setupSearch();

            create = setupCreate({
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
        });

        it('creates the jira issue', (done) => {
            out(concourseInput(), () => {
                expect(create.isDone()).to.be.true;
                done();
            });
        });

        it('returns the issue key', (done) => {
            out(concourseInput(), (result) => {
                expect(result).to.deep.equal({
                    version: {
                        issue: "ATP-1"
                    }
                });
                done();
            });
        });

        it('handles an additional field', (done) => {
            let input = concourseInput();

            input.params.environment = 'PROD';

            let createWithEnv = setupCreate({
                    fields: {
                        project: {
                            key: "ATP"
                        },
                        issuetype: {
                            name: "Bug"
                        },
                        summary: "TEST 1.106.0",
                        description: "Inline static description",
                        environment: "PROD"
                    }
                });

            out(input, () => {
                expect(createWithEnv.isDone()).to.be.true;
                done();
            });
        });

        it('parses a $NOW', (done) => {
            let input = concourseInput();

            input.params.duedate = '$NOW';

            let createWithDate = setupCreate((body) => {
                    let duedate = moment(body.fields.duedate);
                    let now = moment();

                    return Math.abs(duedate.diff(now, 's')) < 1;
                });

            out(input, () => {
                expect(createWithDate.isDone()).to.be.true;
                done();
            });
        });

        it('parses a $NOWs with +/-', (done) => {
            let input = concourseInput();

            input.params.duedate = '$NOW+5';
            input.params.tomorrow = '$NOW+1d';
            input.params.abitago = '$NOW-8h'

            let createWithDate = setupCreate((body) => {
                let duedate = moment(body.fields.duedate);

                let expectedDueDate = moment().add(5, 'm');

                return Math.abs(expectedDueDate.diff(duedate, 's')) < 1;
            });

            out(input, () => {
                expect(createWithDate.isDone()).to.be.true;
                done();
            });
        });

        it('parses a $NOWs with +/- and units', (done) => {
            let input = concourseInput();

            input.params.tomorrow = '$NOW+1d';
            input.params.abitago = '$NOW-8h'

            let createWithDate = setupCreate((body) => {
                    let tomorrow = moment(body.fields.tomorrow);
                    let abitago = moment(body.fields.abitago);

                    let expectedTomorrow = moment().add(1, 'd');
                    let expectedAbitago = moment().add(-8, 'h');

                    return Math.abs(expectedTomorrow.diff(tomorrow, 's')) < 1
                        && Math.abs(expectedAbitago.diff(abitago, 's')) < 1;
                });

            out(input, () => {
                expect(createWithDate.isDone()).to.be.true;
                done();
            });
        });

        it('handles a custom field', (done) => {
             let input = concourseInput();

            input.params.custom_fields = {
                something: {
                    id: 10201,
                    value: 'dave!'
                }
            };

            let createWithCustom = setupCreate({
                fields: {
                    project: {
                        key: "ATP"
                    },
                    issuetype: {
                        name: "Bug"
                    },
                    summary: "TEST 1.106.0",
                    description: "Inline static description",
                    customfield_10201: 'dave!'
                }
            });

            out(input, () => {
                expect(createWithCustom.isDone()).to.be.true;
                done();
            });
        });

        it('handles multiple custom fields', (done) => {
            let input = concourseInput();

            input.params.custom_fields = {
                something: {
                    id: 10201,
                    value: 'dave!'
                },
                somethingElse: {
                    id: 12345,
                    value: 'meh'
                }
            };

            let createWithCustom = setupCreate({
                fields: {
                    project: {
                        key: "ATP"
                    },
                    issuetype: {
                        name: "Bug"
                    },
                    summary: "TEST 1.106.0",
                    description: "Inline static description",
                    customfield_10201: 'dave!',
                    customfield_12345: 'meh'
                }
            });

            out(input, () => {
                expect(createWithCustom.isDone()).to.be.true;
                done();
            });
        });
    });

    describe('existing issue', () => {
        let update;

        beforeEach(() => {
            let issueId = 15805;

            setupSearch([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: issueId,
                    self: "https://infinityworks.atlassian.net/rest/api/2/issue/" + issueId,
                    key: "ATP-1",
                    fields: {
                        summary: "TEST 1.106.0"
                    }
                }
            ]);

            update = nock(jiraUrl)
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
                    user: jiraUser,
                    pass: jiraPass
                })
                .reply(200)
        });

        it('updates the issue', (done) => {
            out(concourseInput(), () => {
                expect(update.isDone()).to.be.true;
                done();
            });
        });

        it('returns the issue key', (done) => {
            out(concourseInput(), (result) => {
                expect(result).to.deep.equal({
                    version: {
                        issue: "ATP-1"
                    }
                });
                done();
            });
        });
    });

    describe('transitions', () => {

        let issueId = 15805;

        beforeEach(() => {
            setupSearch([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: issueId,
                    self: "https://infinityworks.atlassian.net/rest/api/2/issue/" + issueId,
                    key: "ATP-1",
                    fields: {
                        summary: "TEST 1.106.0"
                    }
                }
            ]);

            nock(jiraUrl)
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
                    user: jiraUser,
                    pass: jiraPass
                })
                .reply(200)
        });


        it('updates an issue with a transition', (done) => {
            nock(jiraUrl)
                .get('/rest/api/2/issue/' + issueId + '/transitions/')
                .basicAuth({
                    user: jiraUser,
                    pass: jiraPass
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

            let transition = nock(jiraUrl)
                .post('/rest/api/2/issue/' + issueId + '/transitions/', {
                    transition: {
                        id: "51"
                    }
                })
                .basicAuth({
                    user: jiraUser,
                    pass: jiraPass
                })
                .reply(204);

            let input = concourseInput();

            input.params.transitions = [
                'Submit'
            ];

            out(input, () => {
                expect(transition.isDone()).to.be.true;
                done();
            });
        });

        it('can handle multiple possible transitions', (done) => {
            let input = concourseInput();
            input.params.transitions = [
                'Reject'
            ];

            nock(jiraUrl)
                .get('/rest/api/2/issue/' + issueId + '/transitions/')
                .basicAuth({
                    user: jiraUser,
                    pass: jiraPass
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

            let transition = nock(jiraUrl)
                .post('/rest/api/2/issue/' + issueId + '/transitions/', {
                    transition: {
                        id: "60"
                    }
                })
                .basicAuth({
                    user: jiraUser,
                    pass: jiraPass
                })
                .reply(204);



            out(input, () => {
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
            nock(jiraUrl)
                .get('/rest/api/2/issue/' + issueId + '/transitions/')
                .basicAuth({ user: jiraUser, pass: jiraPass })
                .reply(200, { "expand": "transitions", "transitions": transitions[0] })
                .get('/rest/api/2/issue/' + issueId + '/transitions/')
                .basicAuth({ user: jiraUser, pass: jiraPass })
                .reply(200, { "expand": "transitions", "transitions": transitions[1] })
                .get('/rest/api/2/issue/' + issueId + '/transitions/')
                .basicAuth({ user: jiraUser, pass: jiraPass })
                .reply(200, { "expand": "transitions", "transitions": transitions[2] });

            let transition1 = nock(jiraUrl)
                .post('/rest/api/2/issue/' + issueId + '/transitions/', {
                    transition: {
                        id: "51"
                    }
                })
                .basicAuth({
                    user: jiraUser,
                    pass: jiraPass
                })
                .reply(204);

            let transition2 = nock(jiraUrl)
                .post('/rest/api/2/issue/' + issueId + '/transitions/', {
                    transition: {
                        id: "69"
                    }
                })
                .basicAuth({
                    user: jiraUser,
                    pass: jiraPass
                })
                .reply(204);

            let transition3 = nock(jiraUrl)
                .post('/rest/api/2/issue/' + issueId + '/transitions/', {
                    transition: {
                        id: "13"
                    }
                })
                .basicAuth({
                    user: jiraUser,
                    pass: jiraPass
                })
                .reply(204);

            out(input, () => {
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

            nock(jiraUrl)
                .get('/rest/api/2/issue/' + issueId + '/transitions/')
                .basicAuth({
                    user: jiraUser,
                    pass: jiraPass
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

            let transition = nock(jiraUrl)
                .post('/rest/api/2/issue/' + issueId + '/transitions/', {
                    transition: {
                        id: "51"
                    }
                })
                .basicAuth({
                    user: jiraUser,
                    pass: jiraPass
                })
                .reply(204);

            out(input, () => {
                expect(transition.isDone()).to.be.true;
                done();
            });
        });
    });

    describe('files', () => {

        beforeEach(() => {
            setupSearch();
        });

        it('can use a file for text', (done) => {
            let input = concourseInput();
            input.params.description = {
                file: 'spec/sample.out'
            };

            create = setupCreate({
                fields: {
                    project: {
                        key: "ATP"
                    },
                    issuetype: {
                        name: "Bug"
                    },
                    summary: "TEST 1.106.0",
                    description: "Text from file"
                }
            });

            out(input, () => {
                expect(create.isDone()).to.be.true;
                done();
            });
        });

        it('replaces $TEXT_FILE with contents of file', (done) => {
            let input = concourseInput();
            input.params.description = {
                text: "Static text - $FILE",
                file: 'spec/sample.out'
            };

            create = setupCreate({
                fields: {
                    project: {
                        key: "ATP"
                    },
                    issuetype: {
                        name: "Bug"
                    },
                    summary: "TEST 1.106.0",
                    description: "Static text - Text from file"
                }
            });

            out(input, () => {
                expect(create.isDone()).to.be.true;
                done();
            });
        });
    });

});

function setupSearch(issues) {
    issues = issues || [];

    return nock(jiraUrl)
        .post('/rest/api/2/search/', {
            jql: 'project="ATP" AND summary~"TEST 1.106.0" ORDER BY id DESC',
            maxResults: 1,
            fields: [
                "key",
                "summary"
            ]
        })
        .basicAuth({
            user: jiraUser,
            pass: jiraPass
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
    return nock(jiraUrl)
        .post('/rest/api/2/issue/', expectedBody)
        .basicAuth({
            user: jiraUser,
            pass: jiraPass
        })
        .reply(200, {
            id: "15805",
            key: "ATP-1",
            self: jiraUrl + "rest/api/2/issue/15805"
        });
}

function concourseInput() {
    return {
        params: {
            summary: "TEST 1.106.0",
            description: "Inline static description",
            issue_type: "Bug"
        },
        source: {
            url: jiraUrl,
            username: jiraUser,
            password: jiraPass,
            project: "ATP"
        }
    };
}