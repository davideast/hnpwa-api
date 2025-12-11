import * as functions from 'firebase-functions/v1';
import cors from 'cors';
import express from 'express';
import { 
  createExpressApp, 
  ApiConfig, 
  createBareExpressApp,
  FIREBASE_APP_NAME } from './server';

export { publisher } from './publish';

export type Trigger = functions.HttpsFunction & ((req: Express.Request, resp: Express.Response) => void);

/**
 * Configure the Cloud Function Trigger based on options. The configuration
 * allows you to set cache expiration, enable cors, enable compression,
 * set the Firebase App instance name, and set a local port for testing. The 
 * local port should not be used in production.
 * @param config
 */
export const trigger = (config?: ApiConfig): Trigger => {
   // merge defaults with config
   const mergedConfig : ApiConfig = {
      useCors: false,
      routerPath: '',
      cdnCacheExpiry: 600,
      browserCacheExpiry: 300,
      staleWhileRevalidate: 120,
      firebaseAppName: FIREBASE_APP_NAME,
      useCompression: true,
      offline: false,
      runWith: {
         memory: '256MB',
         timeoutSeconds: 300
      },
      ...config,
   };
   
   const expressApp = createExpressApp(mergedConfig);

   // When hosted in a cloud function, the function name is prefixed to the path.
   // The user may also be adding the function name to the routerPath which will
   // cause a route mismatch.
   if (process.env.FUNCTION_NAME && mergedConfig.routerPath === `/${process.env.FUNCTION_NAME}`) {
      mergedConfig.routerPath = '';
   }

   const router = express.Router();
   router.use(mergedConfig.routerPath || '', expressApp);
   const tscRouterHack = router as any;

   // wrap in cors if cors enabled
   if (mergedConfig.useCors) {
      const corsServer = cors({ origin: true });
      // Marked as any because of Type mismatch between CORS package and
      // Functions
      return functions
         .runWith(mergedConfig.runWith!)
         .https
         .onRequest((req: any, res: any) => {
            corsServer(req, res, () => {
               tscRouterHack(req, res);
            });
         });
   }
    else {
      return functions
         .runWith(mergedConfig.runWith!)
         .https.onRequest(tscRouterHack);
   }
};

export const app = createBareExpressApp;

export { HackerNewsItem, HackerNewsItemTree, Story } from './api/interfaces';
