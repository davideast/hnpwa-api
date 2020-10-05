#!/usr/bin/env node

import * as yargs from 'yargs';
import * as express from 'express';
import api from './api';
import { createExpressApp, initializeApp } from './server';
import { buildFiles } from './offline/build';

interface FlagInputs {
  save: boolean;
  serve: boolean;
  port: number;
  offline: boolean;
  routerPath: string;
  v: boolean;
  version: boolean;
}

const argv: FlagInputs = yargs.argv as any;

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
  hostApp.listen(`${port}`, () => console.log(`Listening on ${port}!`));
  return hostApp;
}

export const saveOfflineApi = async () => {
  const app = initializeApp({ firebaseAppName: `${Date.now()}` });
  const hnapi = api(app);
  await buildFiles(hnapi);
  process.exit(0);
};

// TODO(davideast): Use a CLI tool and maybe some chalk
if(argv.serve) {
  serve({
    port: argv.port || 3002,
    offline: argv.offline || false,
    routerPath: argv.routerPath || ''
  });
} else if(argv.save) {
  saveOfflineApi();
} else if(argv.v || argv.version) {
  const pkg = require('./package.json');
  console.log(pkg.version);  
} else {
  const pkg = require('./package.json');
  console.log(`
  
  hnpwa-api version ${pkg.version}
  "${pkg.description}"

  Available commands:
    --serve (--serve --port=4000 --offline=true --routerPath="/api")
    --save # Saves current HN data set to node_modules/hnpwa-api/offline
    -v # or --version
    
  `)
}
