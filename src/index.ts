import * as functions from 'firebase-functions';
import * as cors from 'cors';
import * as express from 'express';
import { createExpressApp, ApiConfig, createBareExpressApp, FIREBASE_APP_NAME } from './server';

export type Trigger = functions.TriggerAnnotated & ((req: Express.Request, resp: Express.Response) => void);

/**
 * Configure the Cloud Function Trigger based on options. The configuration
 * allows you to set cache expiration, enable cors, enable compression,
 * set the Firebase App instance name, and set a local port for testing. The 
 * local port should not be used in production.
 * @param config
 */
export let trigger = (config?: ApiConfig): Trigger => {
   // merge defaults with config
   const mergedConfig = {
      useCors: false,
      routerPath: '',
      cdnCacheExpiry: 600,
      browserCacheExpiry: 300,
      staleWhileRevalidate: 120,
      firebaseAppName: FIREBASE_APP_NAME,
      useCompression: true,
      ...config,
   };
   
   const expressApp = createExpressApp(mergedConfig);

   if (mergedConfig.localPort) {
      const port = mergedConfig.localPort;
      expressApp.listen(`${port}`, () => console.log(`Listening on ${port}!`));
   }

   const router = express.Router();
   router.use(mergedConfig.routerPath, expressApp);
   const tscRouterHack = router as any;

   // wrap in cors if cors enabled
   if (mergedConfig.useCors) {
      const corsServer = cors({ origin: true });
      return functions.https.onRequest((req, res) => {
         corsServer(req, res, () => {
            tscRouterHack(req, res);
         });
      });
   } else {
      return functions.https.onRequest(tscRouterHack);
   }
};

export let app = createBareExpressApp;
