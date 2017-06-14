import * as functions from 'firebase-functions';
import * as firebase from 'firebase';
import * as express from 'express';
import * as compression from 'compression';
import { Api } from './api';
import api from './api';

// Hash of route matchers
const routes = {
  NEWS_AND_STUFF: /^\/(news|news2|newest|ask|show|jobs)$/,
  BEST_IN_SHOW: /^\/(shownew|best|active|noobstories)$/,
  ITEM: /^\/item\/(\d+)$/,
  NEW_COMMENTS: '/newcomments',
  USER: /^\/user\/(\w+)$/,
};

/**
 * Return a number within a maximum boundary. If the boundary of 10 is supplied
 * and 11 is passed as the page, 10 is returned. 
 * 
 * 10 = withinBounds(11, 10);
 * 1 = withinBounds(1, 10);
 * @param page 
 * @param maxBounds
 */
function withinBounds(page: string, maxBounds = 10) {
  return Math.min(maxBounds, Math.max(1, parseInt(page, 10) || 1));
}

/**
 * Creates an express route handler based on a Firebase App instance.
 * Get a list of "stories" based on the parameters provided. This API maps to the
 * traditional "top bar" (news, ask, jobs, show) in HN UI's. Paging is provided 
 * through the ?page query param.
 * @param firebaseApp
 */
export function getNewsAndStuff(hnapi: Api) {
  return async (req: express.Request, res: express.Response) => {
    const base = req.params[0]; // "news" | "ask" | "jobs" | "show" etc...
    const page = withinBounds(req.query.page);
    const newsies = await hnapi[base]({ page });
    res.jsonp(newsies);
  };
}

/**
 * Creates an express route handler based on a Firebase App instance.
 * Get an item and it's comments from a request id param and return the JSON representation of 
 * the user.
 * @param firebaseApp
 */
export function getItemAndComments(hnapi: Api) {
  return async (req: express.Request, res: express.Response) => {
    const itemId = req.params[0];
    const item = await hnapi.item(itemId);
    res.jsonp(item);
  };
}

/**
 * Creates an express route handler based on a Firebase App instance.
 * Get a user from a request id param and return the JSON representation of 
 * the user.
 * @param firebaseApp
 */
export function getUserInfo(hnapi: Api) {
  return async (req: express.Request, res: express.Response) => {
    const userId = req.params[0];
    const user = await hnapi.user(userId);
    res.jsonp(user);
  };
}

export interface ApiConfig {
   useCors?: boolean;
   useCompression?: boolean;
   browserCacheExpiry?: number;
   cdnCacheExpiry?: number;
   firebaseAppName?: string;
   localPort?: number;
}

/**
 * Creates a firebase app instance based on the configuration name.
 * @param config 
 */
function initializeApp(config: ApiConfig): firebase.app.App {
  const possibleApp = firebase.apps.find(app => app!.name === config.firebaseAppName);
  let app = possibleApp!;
  if (!possibleApp) {
    app = firebase.initializeApp({ databaseURL: 'https://hacker-news.firebaseio.com/' }, config.firebaseAppName);
  }
  return app;
}

/**
 * Create a middleware handler for caching responses in the browser and CDN.
 * @param config 
 */
function cacheControl(config: ApiConfig) {
   const { cdnCacheExpiry, browserCacheExpiry } = config;
   return (req: express.Request, res: express.Response, next: Function) => {
      res.set('Cache-Control', `public, max-age=${browserCacheExpiry}, s-maxage=${cdnCacheExpiry}`);
      next();
   };
}

/**
 * Create an express application object based on the configuration passed in.
 * @param config 
 */
export function createExpressApp(config: ApiConfig) {
  const expressApp: express.Application = express();

  // Init firebase app instance
  const firebaseApp = initializeApp(config);
  // Create API instance from firebaseApp
  const hnapi = api(firebaseApp);

  // Middleware
  if(config.useCompression) { expressApp.use(compression()); }
  expressApp.use(cacheControl(config));
  
  // GET Routes
  expressApp.get(routes.NEWS_AND_STUFF, getNewsAndStuff(hnapi));
  expressApp.get(routes.ITEM, getItemAndComments(hnapi));
  expressApp.get(routes.USER, getUserInfo(hnapi));
  expressApp.get('/favicon.ico', (req, res) => res.status(204).end());

  return expressApp;
}
