'use strict';

var del = require("del");
var CLIEngine = require("eslint").CLIEngine;
const createApp = require('github-app');
const { spawnSync } = require('child_process');
const process = require('process');


const privateKey = process.env.GITHUB_APP_PRIVATE_KEY
const app = createApp({
    id: 21256,
    cert: privateKey
})

module.exports.check = async (event, context) => {

    let status_code = 200;
    const body = JSON.parse(event.body);

    // generate a random name to avoid naming collisions
    // in the tmp directory
    process.chdir('/tmp')
    const temp_dir = Math.random().toString(36).substring(7);

    // if not running on lambda, just use locally installed git
    if (process.env.IS_LAMBDA === 'true') {
        await require("lambda-git")()
    }

    try {

        // clone git repo
        const cmd = spawnSync('git', ['clone', '--quiet', body.repository.clone_url, temp_dir])

        const errorString = cmd.stderr.toString()
        if (errorString) {
          throw new Error(
            `Git clone failed
            ${errorString}`
          )
        }

        // run eslint
        const eslint = new CLIEngine();
        const report = eslint.executeOnFiles([temp_dir]);

        // map eslint severity to github annotation level
        const severity_map = {
            1: 'warning',
            2: 'failure'
        }

        let conclusion = 'success';
        const summary = ['Problem Files:'];
        const annotations = [];

        // parse the eslint results
        for (let i = 0; i < report.results.length; i++) {
            let linted_file = report.results[i];

            // skip over files with no interesting results
            if (!linted_file.errorCount && !linted_file.warningCount) {
                continue;
            }

            conclusion = 'failure';

            const path = linted_file.filePath.split(temp_dir)[1].slice(1);
            summary.push(path);

            for (let j = 0; j < linted_file.messages.length; j++) {

                const problem = linted_file.messages[j]

                annotations.push({
                    path: path,
                    message: problem.message,
                    annotation_level: severity_map[problem.severity],
                    start_line: problem.line,
                    end_line: problem.endLine,
                });
            }
        }

        // send the check for this commit on github
        const github = await app.asInstallation(473122)
        await github.checks.create({
            owner: body.repository.owner.login,
            repo: body.repository.name,
            name: "Silvermine eslint check", 
            head_sha: body.head_sha || body.check_suite.head_sha || body.head_commit.id,
            status: 'completed',
            conclusion: conclusion,
            completed_at: new Date().toISOString(),
            output: {
                title: conclusion, 
                summary: summary.join('\n'),
                annotations: annotations
            }
        });
    }

    catch (error) {
        console.log(error);
        status_code = 500;
    }

    finally {
        del.sync([temp_dir]);
    }

  return {
    statusCode: status_code,
  };

};
