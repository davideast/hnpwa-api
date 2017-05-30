import * as functions from 'firebase-functions';
import { app } from './server';

export let api = functions.https.onRequest(app);
