const chai = require('chai');
const expect = chai.expect;

const moment = require('moment');
const nock = require('nock');

const createOrUpdateIssue = require('../src/createOrUpdateIssue.js');

const jira = require('./resources/jiraDetails.js');
const concourseInput = require('./resources/concourseInput.js');

nock.disableNetConnect();

describe('create or update issue', () => {

    beforeEach(() => {
        nock.cleanAll();
    });

    describe('create', () => {

        it('creates the jira issue', (done) => {
            let input = concourseInput();

            let create = setupCreate({
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

            createOrUpdateIssue('', null, input.source, input.params, () => {
                expect(create.isDone()).to.be.true;
                done();
            });
        });

        it('returns the new issue', (done) => {
            let input = concourseInput();

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

            createOrUpdateIssue('', null, input.source, input.params, (error, result) => {
                expect(error).to.be.null;
                expect(result).to.deep.equal({
                    "id": "15805",
                    "key": "ATP-1",
                    "self": "http://jira.comrest/api/2/issue/15805"
                });
                done();
            });
        });

        it('handles an additional field', (done) => {
            let input = concourseInput();

            input.params.fields.environment = 'PROD';

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

            createOrUpdateIssue('', null, input.source, input.params, () => {
                expect(createWithEnv.isDone()).to.be.true;
                done();
            });
        });

        it('parses a $NOW', (done) => {
            let input = concourseInput();

            input.params.fields.duedate = '$NOW';

            let createWithDate = setupCreate((body) => {
                let duedate = moment(body.fields.duedate);
                let now = moment();

                return Math.abs(duedate.diff(now, 's')) < 1;
            });

            createOrUpdateIssue('', null, input.source, input.params, () => {
                expect(createWithDate.isDone()).to.be.true;
                done();
            });
        });

        it('parses a $NOWs with +/-', (done) => {
            let input = concourseInput();

            input.params.fields.duedate = '$NOW+5';
            input.params.fields.tomorrow = '$NOW+1d';
            input.params.fields.abitago = '$NOW-8h'

            let createWithDate = setupCreate((body) => {
                let duedate = moment(body.fields.duedate);

                let expectedDueDate = moment().add(5, 'm');

                return Math.abs(expectedDueDate.diff(duedate, 's')) < 1;
            });

            createOrUpdateIssue('', null, input.source, input.params, () => {
                expect(createWithDate.isDone()).to.be.true;
                done();
            });
        });

        it('parses a $NOWs with +/- and units', (done) => {
            let input = concourseInput();

            input.params.fields.tomorrow = '$NOW+1d';
            input.params.fields.abitago = '$NOW-8h'

            let createWithDate = setupCreate((body) => {
                let tomorrow = moment(body.fields.tomorrow);
                let abitago = moment(body.fields.abitago);

                let expectedTomorrow = moment().add(1, 'd');
                let expectedAbitago = moment().add(-8, 'h');

                return Math.abs(expectedTomorrow.diff(tomorrow, 's')) < 1
                    && Math.abs(expectedAbitago.diff(abitago, 's')) < 1;
            });

            createOrUpdateIssue('', null, input.source, input.params, () => {
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

            createOrUpdateIssue('', null, input.source, input.params, () => {
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

            createOrUpdateIssue('', null, input.source, input.params, () => {
                expect(createWithCustom.isDone()).to.be.true;
                done();
            });
        });

        it('handles an error response', (done) => {
            let input = concourseInput();

            nock(jira.url)
                .post('/rest/api/2/issue/', {
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
                .reply(400, {
                    errorMessages:[],
                    errors: {
                        environment: "Environment is required.",
                        duedate: "Due Date is required."
                    }
                });

            createOrUpdateIssue('', null, input.source, input.params, (error, result) => {
                expect(error.message).to.equal('Could not update Jira.');
                expect(result).to.be.undefined;
                done();
            });
        });

        it('handles an error in the request', (done) => {
            nock.cleanAll();

            let input = concourseInput();

            createOrUpdateIssue('', null, input.source, input.params, (error, result) => {
                expect(error).to.not.be.null;
                expect(error.message).to.not.equal('Could not update Jira.');
                expect(result).to.be.undefined;
                done();
            });
        });
    });

    describe('update', () => {

        let update;
        let issueId = 15805;

        let issue = {
            expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
            id: issueId,
            self: jira.url + "/rest/api/2/issue/" + issueId,
            key: "ATP-1",
            fields: {
                summary: "TEST 1.106.0"
            }
        };

        beforeEach(() => {
            update = nock(jira.url)
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
                .reply(201)
        });

        it('updates the issue', (done) => {
            let input = concourseInput();

            createOrUpdateIssue('', issue, input.source, input.params, () => {
                expect(update.isDone()).to.be.true;
                done();
            });
        });

        it('returns the issue', (done) => {
            let input = concourseInput();

            createOrUpdateIssue('', issue, input.source, input.params, (error, result) => {
                expect(error).to.be.null;
                expect(result).to.deep.equal({
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: issueId,
                    self: jira.url + "/rest/api/2/issue/" + issueId,
                    key: "ATP-1",
                    fields: {
                        summary: "TEST 1.106.0"
                    }
                });
                done();
            });
        });

        it('handles an error response', (done) => {
            nock.cleanAll();

            let input = concourseInput();

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
                .reply(400, {
                    errorMessages:[],
                    errors: {
                        environment: "Environment is required.",
                        duedate: "Due Date is required."
                    }
                });

            createOrUpdateIssue('', issue, input.source, input.params, (error, result) => {
                expect(error.message).to.equal('Could not update Jira.');
                done();
            });
        });

        it('handles an error in the request', (done) => {
            nock.cleanAll();

            let input = concourseInput();

            createOrUpdateIssue('', issue, input.source, input.params, (error, result) => {
                expect(error).to.not.be.null;
                expect(error.message).to.not.equal('Could not update Jira.');
                done();
            });
        });

        it('can update an issue using just a summary', (done) => {
            let input = {
                params: {
                    summary: "TEST 1.106.0"
                },
                source: {
                    url: jira.url,
                    username: jira.user,
                    password: jira.pass,
                    project: "ATP"
                }
            };

            updateWithOnlySummary = nock(jira.url)
                .put('/rest/api/2/issue/' + issueId, {
                    fields: {
                        summary: "TEST 1.106.0",
                        project: {
                            key: "ATP"
                        }
                    }
                })
                .basicAuth({
                    user: jira.user,
                    pass: jira.pass
                })
                .reply(201);

            createOrUpdateIssue('', issue, input.source, input.params, () => {
                expect(updateWithOnlySummary.isDone()).to.be.true;
                done();
            });
        });
    });

    describe('files', () => {

        let dir = process.cwd() + '/spec';

        it('can use a file for text', (done) => {
            let input = concourseInput();
            input.params.fields.description = {
                file: 'resources/sample.out'
            };

            let create = setupCreate({
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

            createOrUpdateIssue(dir, null, input.source, input.params, () => {
                expect(create.isDone()).to.be.true;
                done();
            });
        });

        it('replaces $FILE with contents of file', (done) => {
            let issueId = 15805;

            let issue = {
                expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                id: issueId,
                self: jira.url + "/rest/api/2/issue/" + issueId,
                key: "ATP-1",
                fields: {
                    summary: "TEST 1.106.0"
                }
            };

            let input = concourseInput();
            input.params.summary = {
                text: "Summary - $FILE",
                file: 'resources/sample.out'
            };
            input.params.fields.description = {
                text: "Static text - $FILE",
                file: 'resources/sample.out'
            };

            let create = setupCreate({
                fields: {
                    project: {
                        key: "ATP"
                    },
                    issuetype: {
                        name: "Bug"
                    },
                    summary: "Summary - Text from file",
                    description: "Static text - Text from file"
                }
            });

            createOrUpdateIssue(dir, null, input.source, input.params, () => {
                expect(create.isDone()).to.be.true;
                done();
            });
        });
    });

});

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