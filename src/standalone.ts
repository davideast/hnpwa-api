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
