#!/usr/bin/env node

import * as yargs from 'yargs';
import * as express from 'express';
import api from './api';
import { createExpressApp, ApiConfig, createBareExpressApp, initializeApp, FIREBASE_APP_NAME } from './server';
import { buildFiles } from './offline/build';
const argv = yargs.argv;

export const serve = (opts: { port: number, offline: boolean, routerPath: string }) => {
  const { port, offline, routerPath } = opts;
  
  // TODO(davideast): Check for offline data if offline arg exists
  const expressApp = createExpressApp({ offline });

  const router = express.Router();
  router.use(routerPath, expressApp);
  
  const hostApp = express();
  hostApp.use(router);
  hostApp.listen(`${port}`, () => console.log(`Listening on ${port}!`));
}

export const saveOfflineApi = () => {
  const app = initializeApp({ firebaseAppName: `${Date.now()}` });
  const hnapi = api(app);
  buildFiles(hnapi);
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
