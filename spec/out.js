const chai = require("chai");
const expect = chai.expect;

const nock = require("nock");
const out = require("../src/out.js");

const jira = require("./resources/jiraDetails.js");

const baseFileDir = process.cwd() + "/spec";

/** Uncomment the below for sexy debug shizzles **/
//require("request-debug")(require("request"));

nock.disableNetConnect();

describe("jira resource", () => {
    let issueId = "12345";
    let summary = "TEST - 1.0.1";

    beforeEach(() => {
        nock.cleanAll();
    });

    it("accepts legacy basic auth credentials", done => {
        setupSearch();

        const create = setupCreate();
        const watchers = setupAddWatchers();
        const transitions = setupTransitions();

        let input = getInput();
        delete input.source.email;
        delete input.source.apitoken;
        input.source.username = jira.user;
        input.source.password = jira.token;

        out(input, baseFileDir, (error) => {
            expect(error).to.be.null;
            done();
        });
    });

    it("can create a ticket", done => {
        setupSearch();

        let create = setupCreate();
        let watchers = setupAddWatchers();
        let transitions = setupTransitions();

        let input = getInput();

        out(input, baseFileDir, (error, result) => {
            expect(error).to.be.null;
            expect(result).to.deep.equal({
                version: { ref: "none" },
                metadata: [{ name: "ATP-51", "value": "http://jira.com/secure/QuickSearch.jspa?searchString=ATP-51"}]
            });

            expect(create.isDone(), "create ticket").to.be.true;
            expect(watchers.isDone(), "add watchers").to.be.true;
            expect(transitions.isDone(), "perform transitions").to.be.true;

            done();
        });
    });

    it("can update a ticket", done => {
        setupSearch({
            expand:
                "operations,versionedRepresentations,editmeta,changelog,renderedFields",
            id: issueId,
            self: jira.url + "/rest/api/2/issue/" + issueId,
            key: "ATP-1",
            fields: {
                summary: "TEST 1.106.0"
            }
        });

        let update = setupUpdate();
        let watchers = setupAddWatchers();
        let transitions = setupTransitions();

        let input = getInput();

        out(input, baseFileDir, (error, result) => {
            expect(error).to.be.null;
            expect(result).to.deep.equal({
                version: { ref: "none" },
                metadata: [{ name: "ATP-1", "value": "http://jira.com/secure/QuickSearch.jspa?searchString=ATP-1"}]
            });

            expect(update.isDone(), "create ticket").to.be.true;
            expect(watchers.isDone(), "add watchers").to.be.true;
            expect(transitions.isDone(), "perform transitions").to.be.true;

            done();
        });
    });

    function getInput() {
        return {
            params: {
                issue_type: "Feature",
                summary: {
                    file: "resources/sample.version",
                    text: "TEST - $FILE"
                },
                fields: {
                    description: {
                        file: "resources/sample.out",
                        text: "Sample description [$FILE]"
                    },
                    environment: "Prod"
                },
                custom_fields: {
                    a_custom_field: {
                        id: 10201,
                        value: 12345
                    },
                    another_one: {
                        id: 76552,
                        value: "something"
                    }
                },
                transitions: ["Review", "Done"],
                watchers: ["dave", "amier"]
            },
            source: {
                url: jira.url,
                email: jira.user,
                apitoken: jira.token,
                project: "ATP"
            }
        };
    }

    function setupSearch(issue) {
        let issues = issue ? [issue] : [];

        nock(jira.url)
            .post("/rest/api/3/search/jql", {
                jql: 'project="ATP" AND summary~"' +
                    summary +
                    '"  ORDER BY id DESC',
                maxResults: 1,
                fields: ['key', 'summary']
            })
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(200, {
                expand: "names,schema",
                startAt: 0,
                maxResults: 1,
                total: issues.length,
                issues: issues
            });
    }

    function setupCreate() {
        return nock(jira.url)
            .post("/rest/api/2/issue/", {
                fields: {
                    project: {
                        key: "ATP"
                    },
                    issuetype: {
                        name: "Feature"
                    },
                    summary: summary,
                    description: "Sample description [Text from file]",
                    environment: "Prod",
                    customfield_10201: "12345",
                    customfield_76552: "something"
                }
            })
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(200, {
                id: issueId,
                key: "ATP-51",
                self: jira.url + "/rest/api/2/issue/" + issueId
            });
    }

    function setupUpdate() {
        return nock(jira.url)
            .put("/rest/api/2/issue/" + issueId, {
                fields: {
                    project: {
                        key: "ATP"
                    },
                    issuetype: {
                        name: "Feature"
                    },
                    summary: summary,
                    description: "Sample description [Text from file]",
                    environment: "Prod",
                    customfield_10201: "12345",
                    customfield_76552: "something"
                }
            })
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(201);
    }

    function setupAddWatchers() {
        return nock(jira.url)
            .post("/rest/api/2/issue/" + issueId + "/watchers/", '"dave"')
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(204)
            .post("/rest/api/2/issue/" + issueId + "/watchers/", '"amier"')
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(204);
    }

    function setupTransitions() {
        nock(jira.url)
            .get("/rest/api/2/issue/" + issueId + "/transitions/")
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(200, {
                expand: "transitions",
                transitions: [
                    {
                        id: "321",
                        name: "Review"
                    }
                ]
            })
            .get("/rest/api/2/issue/" + issueId + "/transitions/")
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(200, {
                expand: "transitions",
                transitions: [
                    {
                        id: "456",
                        name: "Done"
                    },
                    {
                        id: "789",
                        name: "Reject"
                    }
                ]
            });

        return nock(jira.url)
            .post("/rest/api/2/issue/" + issueId + "/transitions/", {
                transition: {
                    id: "321"
                }
            })
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(204)
            .post("/rest/api/2/issue/" + issueId + "/transitions/", {
                transition: {
                    id: "456"
                }
            })
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(204);
    }
});
