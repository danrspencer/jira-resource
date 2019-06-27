const chai = require("chai");
const expect = chai.expect;

const nock = require("nock");

const processTransitions = require("../src/processTransitions.js");

const jira = require("./resources/jiraDetails.js");
const concourseInput = require("./resources/concourseInput.js");

nock.disableNetConnect();

describe("processTransitions", () => {
    let issue = {
        id: "15805",
        key: "ATP-1",
        self: jira.url + "rest/api/2/issue/15805"
    };

    beforeEach(() => {
        nock.cleanAll();
    });

    it("updates an issue with a transition", done => {
        nock(jira.url)
            .get("/rest/api/2/issue/" + issue.id + "/transitions/")
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(200, {
                expand: "transitions",
                transitions: [
                    {
                        id: "51",
                        name: "Submit"
                    }
                ]
            });

        let transition = nock(jira.url)
            .post("/rest/api/2/issue/" + issue.id + "/transitions/", {
                transition: {
                    id: "51"
                }
            })
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(204);

        let input = concourseInput();
        input.params.transitions = ["Submit"];

        processTransitions(issue, input.source, input.params, () => {
            expect(transition.isDone()).to.be.true;
            done();
        });
    });

    it("can handle multiple possible transitions", done => {
        let input = concourseInput();
        input.params.transitions = ["Reject"];

        nock(jira.url)
            .get("/rest/api/2/issue/" + issue.id + "/transitions/")
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(200, {
                expand: "transitions",
                transitions: [
                    {
                        id: "51",
                        name: "Submit"
                    },
                    {
                        id: "60",
                        name: "Reject"
                    }
                ]
            });

        let transition = nock(jira.url)
            .post("/rest/api/2/issue/" + issue.id + "/transitions/", {
                transition: {
                    id: "60"
                }
            })
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(204);

        processTransitions(issue, input.source, input.params, () => {
            expect(transition.isDone()).to.be.true;
            done();
        });
    });

    it("can progress through multiple transitions", done => {
        let input = concourseInput();
        input.params.transitions = ["Submit", "Test", "Reject"];

        nock(jira.url)
            .get("/rest/api/2/issue/" + issue.id + "/transitions/")
            .basicAuth({ user: jira.user, pass: jira.token })
            .reply(200, {
                expand: "transitions",
                transitions: [{ id: "51", name: "Submit" }]
            })
            .get("/rest/api/2/issue/" + issue.id + "/transitions/")
            .basicAuth({ user: jira.user, pass: jira.token })
            .reply(200, {
                expand: "transitions",
                transitions: [{ id: "69", name: "Test" }]
            })
            .get("/rest/api/2/issue/" + issue.id + "/transitions/")
            .basicAuth({ user: jira.user, pass: jira.token })
            .reply(200, {
                expand: "transitions",
                transitions: [
                    { id: "12", name: "Complete" },
                    { id: "13", name: "Reject" }
                ]
            });

        let transitions = nock(jira.url)
            .post("/rest/api/2/issue/" + issue.id + "/transitions/", {
                transition: {
                    id: "51"
                }
            })
            .basicAuth({ user: jira.user, pass: jira.token })
            .reply(204)
            .post("/rest/api/2/issue/" + issue.id + "/transitions/", {
                transition: {
                    id: "69"
                }
            })
            .basicAuth({ user: jira.user, pass: jira.token })
            .reply(204)
            .post("/rest/api/2/issue/" + issue.id + "/transitions/", {
                transition: {
                    id: "13"
                }
            })
            .basicAuth({ user: jira.user, pass: jira.token })
            .reply(204);

        processTransitions(issue, input.source, input.params, () => {
            expect(transitions.isDone()).to.be.true;
            done();
        });
    });

    it("isn't case sensitive for transitions", done => {
        nock(jira.url)
            .get("/rest/api/2/issue/" + issue.id + "/transitions/")
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(200, {
                expand: "transitions",
                transitions: [
                    {
                        id: "51",
                        name: "SUBMIT"
                    }
                ]
            });

        let transition = nock(jira.url)
            .post("/rest/api/2/issue/" + issue.id + "/transitions/", {
                transition: {
                    id: "51"
                }
            })
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(204);

        let input = concourseInput();

        input.params.transitions = ["submit"];

        processTransitions(issue, input.source, input.params, () => {
            expect(transition.isDone()).to.be.true;
            done();
        });
    });
});
