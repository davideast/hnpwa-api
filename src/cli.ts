#!/usr/bin/env node

import * as yargs from 'yargs';
import chalk from 'chalk';
import * as path from 'path';
import { loadCommands } from './cli/command-loader';

export { AppOptions, createApp, serve, saveOfflineApi } from './standalone';

if (require.main === module) {
  // Configure yargs
  const commands = loadCommands(path.join(__dirname, 'cli', 'commands'));

  let cli = yargs
    .scriptName('hnpwa-api')
    .usage(chalk.bold('$0 <cmd> [args]'));

  commands.forEach(cmd => {
    cli = cli.command(
      cmd.command,
      cmd.describe,
      cmd.builder,
      cmd.handler
    );
  });

  cli.demandCommand(1, chalk.red('You must provide a valid command.'))
    .help()
    .alias('h', 'help')
    .alias('v', 'version')
    .epilog(chalk.gray('For more information, visit https://github.com/davideast/hnpwa-api'))
    .strict()
    .argv;
}
