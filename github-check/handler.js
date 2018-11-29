'use strict';

var del = require('del');
var CLIEngine = require('eslint').CLIEngine;
const createApp = require('github-app');
const { spawnSync } = require('child_process');
const process = require('process');

const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
const app = createApp({
   id: 21256,
   cert: privateKey
})

module.exports.check = async(event, context) => {

   let statusCode = 200;
   const body = JSON.parse(event.body);

   // generate a random name to avoid naming collisions
   // in the tmp directory
   process.chdir('/tmp');
   const tempDir = Math.random().toString(36).substring(7);

    // if not running on lambda, just use locally installed git
   if (process.env.IS_LAMBDA === 'true') {
      await require('lambda-git')();
   }

   try {

      // clone git repo
      const cmd = spawnSync('git', [ 'clone', '--quiet', body.repository.clone_url, tempDir ]);
      const errorString = cmd.stderr.toString();

      if (errorString) {
         throw new Error(
            `Git clone failed
            ${errorString}`
         );
      }

      // run eslint
      const eslint = new CLIEngine();
      const report = eslint.executeOnFiles([ tempDir ]);

      // map eslint severity to github annotation level
      const severityMap = {
         1: 'warning',
         2: 'failure'
      };

      let conclusion = 'success';
      const summary = [ 'Problem Files:' ];
      const annotations = [];

        // parse the eslint results
      for (let i = 0; i < report.results.length; i++) {
         let lintedFile = report.results[i];

         // skip over files with no interesting results
         if (!lintedFile.errorCount && !lintedFile.warningCount) {
            continue;
         }

         conclusion = 'failure';

         const path = lintedFile.filePath.split(tempDir)[1].slice(1);

         summary.push(path);

         for (let j = 0; j < lintedFile.messages.length; j++) {

            const problem = lintedFile.messages[j];

            annotations.push({
               path: path,
               message: problem.message,
               annotation_level: severityMap[problem.severity],
               start_line: problem.line,
               end_line: problem.endLine || problem.line,
            });
         }
      }

      // send the check for this commit on github
      const github = await app.asInstallation(473122);

      await github.checks.create({
         owner: body.repository.owner.login,
         repo: body.repository.name,
         name: 'Silvermine eslint check', 
         head_sha: body.head_sha || body.check_suite.head_sha || body.head_commit.id,
         status: 'completed',
         conclusion: conclusion,
         completed_at: new Date().toISOString(),
         output: {
            title: conclusion, 
            summary: summary.join('\n'),
            annotations: annotations,
         }
      });
   } catch(error) {
      console.log(error);
      statusCode = 500;
   } finally {
      del.sync([ tempDir ]);
   }

   return {
      statusCode: statusCode,
   };

};
