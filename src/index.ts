import * as functions from 'firebase-functions';
import * as cors from 'cors';
import { app } from './server';

let httpHandler = () => {
   const corsServer = cors({ origin: true });
   return functions.https.onRequest((req, res) => {
      corsServer(req, res, () => {
         app(req, res);
      });
   });
};

module.exports = httpHandler;
