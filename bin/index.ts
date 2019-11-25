#! /usr/bin/env node

import { Command } from 'commander';
import log from 'debug';
import inquirer from 'inquirer';
import Main from '../src/Main';
import { error } from '../src/ui';

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const debug = log('automan:bin');
const program = new Command();

program
    .name('automan')
    .usage('[options]')
    .version(require('../package.json').version)
    .option('-f, --force', `override the git status check`, false)
    .option('-d, --dryrun', `only print the result, won't emit any changes to filesystem`, false)
    .option('-m, --mode <mode>', 'automan interact mode (interact|command)', 'interact')
    .option('-c, --config <config>', 'automan configuration file')
    .option(
        '-p, --props <props>',
        'props that you defined in automan configuration, comma separated list (e.g. name=haha,type=class)'
    );

program.parse(process.argv);

const { config, mode, props, dryrun, force } = program;
const main = new Main(program);

debug('program options: ', { config, mode, props, dryrun, force });

try {
    // 🚀 bootstrap !
    main.bootstrap();
} catch(e) {
    error(e);
}

process.on('uncaughtException', error);
process.on('unhandledRejection', error);