import * as functions from 'firebase-functions';
import * as cors from 'cors';
import * as express from 'express';
import { server } from './server';

export interface HttpHandlerConfig {
   useCors: boolean;
   browserCacheExpiry: string;
   cdnCacheExpiry: string;
}

export type Trigger = functions.TriggerAnnotated & ((req: Express.Request, resp: Express.Response) => void);

/**
 * Create a middleware handler for caching responses in the browser and CDN.
 * @param config 
 */
function cacheControl(config: HttpHandlerConfig) {
   const { cdnCacheExpiry, browserCacheExpiry } = config;
   return (req: express.Request, res: express.Response, next: Function) => {
      res.set('Cache-Control', `public, max-age=${browserCacheExpiry}, s-maxage=${cdnCacheExpiry}`);
      next();
   };
}

/**
 * Configure the HttpHandler based on user's options. 
 * @param config { useCors: boolean }
 */
export let app = (config: HttpHandlerConfig = { useCors: false, cdnCacheExpiry: '600', browserCacheExpiry: '300' }): Trigger => {
   server.use(cacheControl(config));
   if (config.useCors) {
      const corsServer = cors({ origin: true });
      return functions.https.onRequest((req, res) => {
         corsServer(req, res, () => {
            server(req, res);
         });
      });
   } else {
      return functions.https.onRequest(server);
   }
};
