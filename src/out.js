
const request = require('request');
const sleep   = require('sleep');

module.exports = (input) => {

    const source = input.source;
    const params = input.params;

    var issueKey;

    request.get(source.url, (error, response, body) => {
        console.log(body);

        issueKey = body.issues[0].key;
    });

    while (!issueKey) {
        console.log(issueKey);

    }

    return issueKey;
};