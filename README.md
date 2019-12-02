# testresult2rp

````
Usage: testresult2rp <command> [options]

Commands:
  testresult2rp cucumber [options]  send cucumber json report to
                                    reportportal(https://reportportal.io)

Options:
  --file, -f     provide a path to report file               [string] [required]
  --config       ReportPortal api configuration(*.json) file
  --debug, -d    run in debug                                          [boolean]
  --version, -v  Show version number                                   [boolean]
  --help, -h     Show help                                             [boolean]

Examples:
  cucutestresult2rp cucumber -f ./cucumber-result.json --config
  ./report-portal-config.json

copyright 2019
````