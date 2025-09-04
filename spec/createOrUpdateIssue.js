const chai = require("chai");
const expect = chai.expect;

const moment = require("moment");
const nock = require("nock");

const createIssue = require("../src/createIssue.js");
const updateIssue = require("../src/updateIssue.js");

const jira = require("./resources/jiraDetails.js");
const concourseInput = require("./resources/concourseInput.js");
const concourseInputSubTask = require("./resources/concourseInputSubTask.js");

nock.disableNetConnect();

describe("create or update issue", () => {
    const env = Object.assign({}, process.env);

    beforeEach(() => {
        nock.cleanAll();
    });

    afterEach(() => {
        process.env = env;
    });

    describe("create", () => {
        it("creates the jira issue", done => {
            let input = concourseInput();
            let create = setupCreateTask({
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

            createIssue("", input.source, input.params, () => {
                expect(create.isDone()).to.be.true;
                done();
            });
        });

        it("returns the new issue", done => {
            let input = concourseInput();

            setupCreateTask({
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

            createIssue(
                "",
                input.source,
                input.params,
                (error, result) => {
                    expect(error).to.be.null;
                    expect(result).to.deep.equal([{
                        id: "15805",
                        key: "ATP-1",
                        self: "http://jira.comrest/api/2/issue/15805"
                    }]);
                    done();
                }
            );
        });

        it("creates the jira sub task", done => {
            const input = concourseInputSubTask();
            const create = setupCreateSubTask({
                fields: {
                    project: {
                        key: "ATP"
                    },
                    parent: {
                        key: "ATP-1"
                    },
                    issuetype: {
                        name: "Sub: Task"
                    },
                    summary: "Test sub task",
                    description: "Inline static description for sub task"
                }
            });

            createIssue("", input.source, input.params, () => {
                expect(create.isDone()).to.be.true;
                done();
            });
        });

        it("handles an additional field", done => {
            let input = concourseInput();

            input.params.fields.environment = "PROD";

            let createWithEnv = setupCreateTask({
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

            createIssue("", input.source, input.params, () => {
                expect(createWithEnv.isDone()).to.be.true;
                done();
            });
        });

        it("parses a $NOW", done => {
            let input = concourseInput();

            input.params.fields.duedate = "$NOW";

            let createWithDate = setupCreateTask(body => {
                let duedate = moment(body.fields.duedate);
                let now = moment();

                return Math.abs(duedate.diff(now, "s")) < 1;
            });

            createIssue("", input.source, input.params, () => {
                expect(createWithDate.isDone()).to.be.true;
                done();
            });
        });

        it("parses a $NOWs with +/-", done => {
            let input = concourseInput();

            input.params.fields.duedate = "$NOW+5";
            input.params.fields.tomorrow = "$NOW+1d";
            input.params.fields.abitago = "$NOW-8h";

            let createWithDate = setupCreateTask(body => {
                let duedate = moment(body.fields.duedate);

                let expectedDueDate = moment().add(5, "m");

                return Math.abs(expectedDueDate.diff(duedate, "s")) < 1;
            });

            createIssue("", input.source, input.params, () => {
                expect(createWithDate.isDone()).to.be.true;
                done();
            });
        });

        it("parses a $NOWs with +/- and units", done => {
            let input = concourseInput();

            input.params.fields.tomorrow = "$NOW+1d";
            input.params.fields.abitago = "$NOW-8h";

            let createWithDate = setupCreateTask(body => {
                let tomorrow = moment(body.fields.tomorrow);
                let abitago = moment(body.fields.abitago);

                let expectedTomorrow = moment().add(1, "d");
                let expectedAbitago = moment().add(-8, "h");

                return (
                    Math.abs(expectedTomorrow.diff(tomorrow, "s")) < 1 &&
                    Math.abs(expectedAbitago.diff(abitago, "s")) < 1
                );
            });

            createIssue("", input.source, input.params, () => {
                expect(createWithDate.isDone()).to.be.true;
                done();
            });
        });

        it("handles a custom field", done => {
            let input = concourseInput();

            input.params.custom_fields = {
                something: {
                    id: 10201,
                    value: "dave!"
                }
            };

            let createWithCustom = setupCreateTask({
                fields: {
                    project: {
                        key: "ATP"
                    },
                    issuetype: {
                        name: "Bug"
                    },
                    summary: "TEST 1.106.0",
                    description: "Inline static description",
                    customfield_10201: "dave!"
                }
            });

            createIssue("", input.source, input.params, () => {
                expect(createWithCustom.isDone()).to.be.true;
                done();
            });
        });

        it("handles a selectlist custom field with a string value", done => {
            let input = concourseInput();

            input.params.custom_fields = {
                selectlist_field: {
                    id: 10201,
                    type: "selectlist",
                    value: "dave!"
                }
            };

            let createWithCustom = setupCreateTask({
                fields: {
                    project: {
                        key: "ATP"
                    },
                    issuetype: {
                        name: "Bug"
                    },
                    summary: "TEST 1.106.0",
                    description: "Inline static description",
                    customfield_10201: { value: "dave!" }
                }
            });

            createIssue("", input.source, input.params, () => {
                expect(createWithCustom.isDone()).to.be.true;
                done();
            });
        });

        it("handles a selectlist custom field with a value id", done => {
            let input = concourseInput();

            input.params.custom_fields = {
                selectlist_field: {
                    id: 10201,
                    type: "selectlist",
                    value_id: 123
                }
            };

            let createWithCustom = setupCreateTask({
                fields: {
                    project: {
                        key: "ATP"
                    },
                    issuetype: {
                        name: "Bug"
                    },
                    summary: "TEST 1.106.0",
                    description: "Inline static description",
                    customfield_10201: { id: "123" }
                }
            });

            createIssue("", input.source, input.params, () => {
                expect(createWithCustom.isDone()).to.be.true;
                done();
            });
        });

        it("handles multiple custom fields", done => {
            let input = concourseInput();

            input.params.custom_fields = {
                something: {
                    id: 10201,
                    value: "dave!"
                },
                somethingElse: {
                    id: 12345,
                    value: "meh"
                }
            };

            let createWithCustom = setupCreateTask({
                fields: {
                    project: {
                        key: "ATP"
                    },
                    issuetype: {
                        name: "Bug"
                    },
                    summary: "TEST 1.106.0",
                    description: "Inline static description",
                    customfield_10201: "dave!",
                    customfield_12345: "meh"
                }
            });

            createIssue("", input.source, input.params, () => {
                expect(createWithCustom.isDone()).to.be.true;
                done();
            });
        });

        it("handles an error response", done => {
            let input = concourseInput();

            nock(jira.url)
                .post("/rest/api/2/issue/", {
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
                    pass: jira.token
                })
                .reply(400, {
                    errorMessages: [],
                    errors: {
                        environment: "Environment is required.",
                        duedate: "Due Date is required."
                    }
                });

                createIssue(
                "",
                input.source,
                input.params,
                (error, result) => {
                    expect(error.message).to.equal("Could not update Jira.");
                    expect(result).to.be.undefined;
                    done();
                }
            );
        });

        it("handles an error in the request", done => {
            nock.cleanAll();

            const input = concourseInput();

            createIssue(
                "",
                input.source,
                input.params,
                (error, result) => {
                    expect(error).to.not.be.null;
                    expect(error.message).to.not.equal(
                        "Could not update Jira."
                    );
                    expect(result).to.be.undefined;
                    done();
                }
            );
        });

        it("handles an integer value", done => {
            let input = concourseInput();
            input.params.fields.build_number = 12345;

            let create = setupCreateTask({
                fields: {
                    project: {
                        key: "ATP"
                    },
                    issuetype: {
                        name: "Bug"
                    },
                    summary: "TEST 1.106.0",
                    description: "Inline static description",
                    build_number: "12345"
                }
            });

            createIssue("", input.source, input.params, () => {
                expect(create.isDone()).to.be.true;
                done();
            });
        });
    });

    describe("update", () => {
        let update;
        let issueId = 15805;

        let issue = {
            expand:
                "operations,versionedRepresentations,editmeta,changelog,renderedFields",
            id: issueId,
            self: jira.url + "/rest/api/2/issue/" + issueId,
            key: "ATP-1",
            fields: {
                summary: "TEST 1.106.0"
            }
        };

        beforeEach(() => {
            update = nock(jira.url)
                .put("/rest/api/2/issue/" + issueId, {
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
                    pass: jira.token
                })
                .reply(201);
        });

        it("updates the issue", done => {
            let input = concourseInput();

            updateIssue("", issue, input.source, input.params, () => {
                expect(update.isDone()).to.be.true;
                done();
            });
        });

        it("returns the issue", done => {
            let input = concourseInput();

            updateIssue(
                "",
                issue,
                input.source,
                input.params,
                (error, result) => {
                    expect(error).to.be.null;
                    expect(result).to.deep.equal({
                        expand:
                            "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                        id: issueId,
                        self: jira.url + "/rest/api/2/issue/" + issueId,
                        key: "ATP-1",
                        fields: {
                            summary: "TEST 1.106.0"
                        }
                    });
                    done();
                }
            );
        });

        it("handles an error response", done => {
            nock.cleanAll();

            let input = concourseInput();

            nock(jira.url)
                .put("/rest/api/2/issue/" + issueId, {
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
                    pass: jira.token
                })
                .reply(400, {
                    errorMessages: [],
                    errors: {
                        environment: "Environment is required.",
                        duedate: "Due Date is required."
                    }
                });

            updateIssue(
                "",
                issue,
                input.source,
                input.params,
                error => {
                    expect(error.message).to.equal("Could not update Jira.");
                    done();
                }
            );
        });

        it("handles an error in the request", done => {
            nock.cleanAll();

            let input = concourseInput();

            updateIssue(
                "",
                issue,
                input.source,
                input.params,
                error => {
                    expect(error).to.not.be.null;
                    expect(error.message).to.not.equal(
                        "Could not update Jira."
                    );
                    done();
                }
            );
        });

        it("can update an issue using just a summary", done => {
            let input = {
                params: {
                    summary: "TEST 1.106.0"
                },
                source: {
                    url: jira.url,
                    email: jira.user,
                    apitoken: jira.token,
                    project: "ATP"
                }
            };

            let updateWithOnlySummary = nock(jira.url)
                .put("/rest/api/2/issue/" + issueId, {
                    fields: {
                        summary: "TEST 1.106.0",
                        project: {
                            key: "ATP"
                        }
                    }
                })
                .basicAuth({
                    user: jira.user,
                    pass: jira.token
                })
                .reply(201);

            updateIssue("", issue, input.source, input.params, () => {
                expect(updateWithOnlySummary.isDone()).to.be.true;
                done();
            });
        });
    });

    describe("files", () => {
        let dir = process.cwd() + "/spec";

        it("can use a file for text", done => {
            let input = concourseInput();
            input.params.fields.description = {
                file: "resources/sample.out"
            };

            let create = setupCreateTask({
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

            createIssue(dir, input.source, input.params, () => {
                expect(create.isDone()).to.be.true;
                done();
            });
        });

        it("replaces $FILE with contents of file", done => {
            let input = concourseInput();
            input.params.summary = {
                text: "Summary - $FILE",
                file: "resources/sample.out"
            };
            input.params.fields.description = {
                text: "Static text - $FILE",
                file: "resources/sample.out"
            };

            let create = setupCreateTask({
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

            createIssue(dir, input.source, input.params, () => {
                expect(create.isDone()).to.be.true;
                done();
            });
        });

        it("parses Concourse Metadata environment variables", (done) => {

            let input = concourseInput();
            input.params.summary = {
                text: "Summary - $FILE",
                file: "resources/placeholders-summary.out"
            };
            input.params.fields.description = {
                text: "Static text - $FILE",
                file: "resources/placeholders-description.out"
            };

            process.env.BUILD_ID = 'test_build_id'
            process.env.BUILD_NAME = 'test_build_name'
            process.env.BUILD_JOB_NAME = 'test_build_job_name'
            process.env.BUILD_PIPELINE_NAME = 'test_build_pipeline_name'
            process.env.BUILD_PIPELINE_INSTANCE_VARS = '{"foo":"bar"}'
            process.env.BUILD_TEAM_NAME = 'test_build_team_name'
            process.env.ATC_EXTERNAL_URL = 'https://example.com'

            let create = setupCreateTask({
                fields: {
                    project: {
                        key: "ATP"
                    },
                    issuetype: {
                        name: "Bug"
                    },
                    summary: "Summary - PIPELINE: test_build_pipeline_name",
                    description: `Static text - BUILD_ID: test_build_id
BUILD_NAME: test_build_name
BUILD_JOB_NAME: test_build_job_name
BUILD_PIPELINE_NAME: test_build_pipeline_name
BUILD_PIPELINE_INSTANCE_VARS: vars.foo=%22bar%22
BUILD_TEAM_NAME: test_build_team_name
ATC_EXTERNAL_URL: https://example.com`
                }
            });

            createIssue(dir, input.source, input.params, () => {
                expect(create.isDone()).to.be.true;
                done();
            });

        });
    });
});

function setupCreateTask(expectedBody) {
    return nock(jira.url)
        .post("/rest/api/2/issue/", expectedBody)
        .basicAuth({
            user: jira.user,
            pass: jira.token
        })
        .reply(200, {
            id: "15805",
            key: "ATP-1",
            self: jira.url + "rest/api/2/issue/15805"
        });
}

function setupCreateSubTask(expectedBody) {
    return nock(jira.url)
        .post("/rest/api/2/issue/", expectedBody)
        .basicAuth({
            user: jira.user,
            pass: jira.token
        })
        .reply(200, {
            id: "15806",
            key: "ATP-2",
            self: jira.url + "rest/api/2/issue/15806"
        });
}
