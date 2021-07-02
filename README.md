---

# Jira Ticket Resource

[![Build Status](https://travis-ci.org/vergissberlin/jira-resource.svg?branch=master)](https://travis-ci.org/vergissberlin/jira-resource)
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/vergissberlin/jira-resource/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/vergissberlin/jira-resource/?branch=master)
[![Code Intelligence Status](https://scrutinizer-ci.com/g/vergissberlin/jira-resource/badges/code-intelligence.svg?b=master)](https://scrutinizer-ci.com/code-intelligence)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/f2ff0bbe8ec746b7af07d3bb088e0787)](https://www.codacy.com/app/andre_1725/jira-resource?utm_source=github.com&utm_medium=referral&utm_content=vergissberlin/jira-resource&utm_campaign=Badge_Grade)

Create and update Jira tickets via Concourse

## Quick Example

```yaml
- name: update-jira
  plan:
      - put: jira
        params:
            issue_type: Change
            issue_key: BUILD-11
            summary: Build v1.0.1
            fields:
                description: With some text
```

## Source Configuration

Newer versions of Jira no longer support username and password credentials for its basic auth method and have switched to email and API token instead. You will need to generate an API token from an account with sufficient permissions to perform the actions this plugin supports. See [the Jira documentation](https://developer.atlassian.com/cloud/jira/platform/jira-rest-api-basic-authentication/) for more information.

```yaml
resources:
    - name: jira
      type: jira-resource
      source:
          url: https://xxxxx.atlassian.net
          email: xxxxx
          apitoken: xxxxx
          project: APROJECT
```

If you are using an older version of Jira Server that still supports the deprecated password-based basic auth, you can keep using the previous set of source settings as below

```yaml
resources:
    - name: jira
      type: jira-resource
      source:
          url: https://xxxxx.atlassian.net
          username: xxxxx
          password: xxxxx
          project: APROJECT
```

## Resource Type Configuration

```yaml
resource_types:
    - name: jira-resource
      type: docker-image
      source:
          repository: danrspencer/jira-resource
          tag: latest
```

## Behavior

### `out`: Creates, updates and transitions a Jira ticket

#### $TEXT

The `summary`, `fields` and `custom_fields` can be either a string value, or an object with `text` / `file` fields. If just the `file` or `text` is specified it is used to populate the field, if both `file` and `text` are specified then the file is substituted in to replace $FILE in the text.

e.g.

```yaml
description: An awesome ticket
-------
description:
  file: messages/this-will-be-the-description
-------
description:
  text: |
    Substitute text into this messaage

    $FILE
  file: messages/jira-message
-------
description:
  text: |
    Substitute text into this messaage
```

#### $NOW

If a date field needs to be populated with a date relative to current time `$NOW` can be used. The datetime can be modified relative to the current date.

e.g.

```
$NOW
# One hour ahead
$NOW+1h
# Yesterday
$NOW-1d
```

_KEY_

-   `years y`
-   `weeks w`
-   `days d`
-   `hours h`
-   `minutes m`
-   `seconds s`

#### Parameters

-   `issue_key`: Just using for searching / updating existing issue. For searching / updating issue, priority is higher than searching by `summary`.

```yaml
issue_key: BUILD-11
-------
issue_key: BUILD-11,BUILD-12,BUILD-13
-------
issue_key:
  file: issue/key
-------
issue_key:
  text: BUILD-$FILE
  file: issue/key
-------
issue_key:
  text: BUILD-11
```

-   `summary`: _required for create issue_ The summary of the Jira Ticket. This is used as a unique identifier for the ticket for the purpose of updating / modifying. As such it's recommended you include something unique in the summary, such as the build version. For searching/updating issue, priority is lower than searching by `summary`.


```yaml
summary: Ticket Summary
-------
summary:
  text: Build v$FILE
  file: version/version
```

-   `issue_type`: The issue type for the ticket

```yaml
issue_type: Bug
```

-   `fields`: A list of fields to be set with specified values

```yaml
fields:
    description:
        text: |
            Routine Release

            $FILE
        file: messages/jira-release-notes
    environment: Prod
    duedate: $NOW+1h
```

-   `custom_fields`: A list of custom fields to update. The id and value are used to update the custom field. You can also specify the type of custom field. Currently supported types are:
    -   Default (no type specified): set a `FreeTextField` custom field.
    -   `selectlist`: set a `SelectList` custom field. Can set its value by ID with the `value_id` key or by value with the `value` key.

Have a look at the [JIRA API documentation](https://developer.atlassian.com/server/jira/platform/jira-rest-api-examples/#creating-an-issue-examples) for more information about the different field types and their content format.

The property title doesn't matter, it's purpose is to make the pipeline yml more understandable.

```yaml
custom_fields:
    sample_freetext_field:
        id: 10201
        value: Something
    sample_selectlist_field:
        id: 10202
        type: selectlist
        value: Some selectlist value
    sample_selectlist_id_field:
        id: 10203
        type: selectlist
        value_id: "123"
```

-   `watchers`: An array of usernames to be added as watchers to the ticket

```yaml
watchers:
    - dave
    - amier
    - lauren
```

-   `transitions`: An array of string values for the ticket to be moved through. The transitions are conducted in the order specified.

```yaml
transitions:
    - Submit
    - In Dev
```

-   `comments`: Add comments.

```yaml
comments:
    - content:
        text: |
            New comment
            $FILE
        file: messages/jira-release-notes
    - content:
        file: messages/jira-release-notes
    - content:
        text: |
            New comment
    - content: New comment
```

-   `search_filters`: Custom filter when searching issues.

```yaml
search_filters:
    status: Done
    type: Bug
```

#### Order of execution

When executing the Jira job the ticket is updated in the following order:

-   Search for existing issue matching `summary` given
-   Create ticket / update ticket
-   Add watchers
-   Perform transitions
-   Add comments

If you need to perform actions in a different order, for example, transitions before adding watchers then multiple jobs are required.

e.g.

```yaml
# Create ticket and Submit
- put: jira
  params:
    issue_type: Change
    summary:
      text: Site v$FILE
      file: version/version
    transitions:
       - Submit

# Create sub task
- put: jira
  params:
    parent: ABC
    issue_type: Sub: Task
    summary:
      text: Site v$FILE
      file: version/version

# Add a watcher then move to in dev
- put: jira
  params:
    summary:
      text: Site v$FILE
      file: version/version
    watchers:
    - dan
    transitions:
    - In Dev
```

#### Real world example

```yaml
jobs:
    - name: start-release
      plan:
          - get: code-base
            trigger: true
          - get: version
          - task: write-release-notes
            config:
                platform: linux
                image_resource:
                    source:
                        repository: travix/base-alpine-git
                    type: docker-image
                inputs:
                    - name: version
                    - name: code-base
                run:
                    path: code-base/ci/scripts/write-release-notes
                outputs:
                    - name: messages
          - put: jira
            params:
                issue_type: Change
                summary:
                    text: Build v$FILE
                    file: version/version
                fields:
                    description:
                        text: |
                            Routine Release

                            $FILE

                            _Generated by Concourse_
                        file: messages/jira-release-notes
                    environment: Prod
                    duedate: $NOW+1h
                custom_fields:
                    how_awesome:
                        id: 10201
                        value: Very!
                transitions:
                    - Submit
          - put: jira
            params:
                summary:
                    text: Build v$FILE
                    file: version/version
                watchers:
                    - dave
                    - amier
                    - lauren
                transitions:
                    - Approve
                comments:
                    - content: New comment by consourse

resources:
    - name: code-base
      type: git
      source:
          uri: git@github.com:danrspencer/jira-resource.git
          branch: master
          private_key: { { private-repo-key } }

    - name: version
      type: semver
      source:
          driver: git
          uri: git@github.com:danrspencer/jira-resource.git
          branch: version
          private_key: { { private-repo-key } }
          file: version

    - name: jira
      type: jira-resource
      source:
          url: https://jira.atlassian.net
          email: { { jira-email } }
          apitoken: { { jira-api-token } }
          project: JR

resource_types:
    - name: jira-resource
      type: docker-image
      source:
          repository: danrspencer/jira-resource
          tag: latest
```
