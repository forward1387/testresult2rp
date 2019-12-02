#!/usr/bin/env node
const fs = require('fs');

require('yargs')
  .usage('Usage: $0 <command> [options]')
  .demandCommand(1)
  .demandOption(['f'])
  .option('file', {
    alias: 'f',
    describe: 'provide a path to report file'
  })
  .config('config', 'ReportPortal api configuration(*.json) file', function(configPath) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  })
  .option('debug', {
    alias: 'd',
    describe: 'run in debug'
  })
  .example('cucutestresult2rp cucumber -f ./cucumber-result.json --config ./report-portal-config.json')
  .command('cucumber [options]', 'send cucumber json report to reportportal(https://reportportal.io)', (yargs) => {
    global.LOG_LEVEL = yargs.argv.d ? 'DEBUG' : 'INFO';
    let {parseAndSendCucumberResults} = require('./lib/cucumber.reporter');
    return parseAndSendCucumberResults(yargs.argv);
  })
  .string(['f'])
  .version('v')
  .alias('version', 'v')
  .help('h')
  .alias('help', 'h')
  .boolean(['d'])
  .epilog('copyright 2019')
  .argv;