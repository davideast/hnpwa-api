import * as functions from 'firebase-functions';
import * as cors from 'cors';
import { server } from './server';

export interface HttpHandlerConfig { useCors: boolean; }

export type Trigger = functions.TriggerAnnotated & ((req: Express.Request, resp: Express.Response) => void);

/**
 * Configure the HttpHandler based on user's options. 
 * @param config { useCors: boolean }
 */
export let app = (config: HttpHandlerConfig = { useCors: false }): Trigger => {
   if(config.useCors) {
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
