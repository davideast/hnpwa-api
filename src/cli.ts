#!/usr/bin/env node

import * as yargs from 'yargs';
import express from 'express';
import chalk from 'chalk';
import api from './api';
import { createExpressApp, initializeApp } from './server';
import { buildFiles } from './offline/build';

export interface AppOptions { port: number, offline: boolean, routerPath: string };

export const createApp = (opts: AppOptions): express.Express => {
  const { port, offline, routerPath } = opts;

  // TODO(davideast): Check for offline data if offline arg exists
  const expressApp = createExpressApp({ offline });

  const router = express.Router();
  router.use(routerPath, expressApp);

  const hostApp = express();
  hostApp.use(router);
  return hostApp;
}

export const serve = (opts: AppOptions): express.Express => {
  const { port } = opts;
  const hostApp = createApp(opts);
  hostApp.listen(`${port}`, () => console.log(chalk.green(`Listening on ${port}!`)));
  return hostApp;
}

export const saveOfflineApi = async () => {
  const app = initializeApp({ firebaseAppName: `${Date.now()}` });
  const hnapi = api(app);
  console.log(chalk.cyan('Starting offline build...'));
  await buildFiles(hnapi);
  console.log(chalk.green('Offline build complete!'));
  process.exit(0);
};

if (require.main === module) {
  // Configure yargs
  yargs
    .scriptName('hnpwa-api')
    .usage(chalk.bold('$0 <cmd> [args]'))
    .command(
      'serve',
      'Start the API server',
      (yargs) => {
        return yargs
          .option('port', {
            alias: 'p',
            type: 'number',
            default: 3002,
            describe: 'Port to run the server on'
          })
          .option('offline', {
            alias: 'o',
            type: 'boolean',
            default: false,
            describe: 'Serve from offline cache'
          })
          .option('routerPath', {
            alias: 'r',
            type: 'string',
            default: '',
            describe: 'Path prefix for the router'
          });
      },
      (argv) => {
        serve({
          port: argv.port,
          offline: argv.offline,
          routerPath: argv.routerPath
        });
      }
    )
    .command(
      'save',
      'Save offline data to node_modules/hnpwa-api/offline',
      (yargs) => {
        return yargs;
      },
      (argv) => {
        saveOfflineApi();
      }
    )
    .demandCommand(1, chalk.red('You must provide a valid command.'))
    .help()
    .alias('h', 'help')
    .alias('v', 'version')
    .epilog(chalk.gray('For more information, visit https://github.com/davideast/hnpwa-api'))
    .strict()
    .argv;
}
