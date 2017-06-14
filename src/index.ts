import * as functions from 'firebase-functions';
import * as cors from 'cors';
import * as express from 'express';
import { createExpressApp, ApiConfig, } from './server';

export type Trigger = functions.TriggerAnnotated & ((req: Express.Request, resp: Express.Response) => void);

/**
 * Helper function for detecting the "dev" argument. This allows
 * you to run the server locally with `node server dev`.
 */
function isDevMode() {
   const args = process.argv.slice(2);
   return args.find(arg => arg === 'dev');
}

/**
 * Configure the HttpHandler based on user's options. 
 * @param config { useCors: boolean }
 */
export let app = (config: ApiConfig): Trigger => {
   // merge defaults with config
   config = {
      ...config,
      useCors: false,
      cdnCacheExpiry: 600,
      browserCacheExpiry: 300,
      firebaseAppName: 'hnpwa-api',
      useCompression: true
   };

   const expressApp = createExpressApp(config);

   if (config.localPort) {
      expressApp.listen(`${config.localPort}`, () => console.log(`listening on ${config.localPort}`));
   }

   // wrap in cors if cors enabled
   if (config.useCors) {
      const corsServer = cors({ origin: true });
      return functions.https.onRequest((req, res) => {
         corsServer(req, res, () => {
            expressApp(req, res);
         });
      });
   } else {
      return functions.https.onRequest(expressApp);
   }
};
