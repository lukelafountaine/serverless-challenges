/* eslint no-process-env: 0 */
'use strict';

const process = require('process');
const config = {};

config.privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
config.isLambda = process.env.IS_LAMBDA;

module.exports = config;
