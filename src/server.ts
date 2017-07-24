import * as functions from 'firebase-functions';
import * as firebase from 'firebase';
import * as express from 'express';
import * as compression from 'compression';
import { Api } from './api';
import api from './api';
import offlineApi from './offline/api';

export const FIREBASE_APP_NAME = 'hnpwa-api';

export interface ApiConfig {
  useCors?: boolean;
  routerPath?: string;
  useCompression?: boolean;
  browserCacheExpiry?: number;
  cdnCacheExpiry?: number;
  staleWhileRevalidate?: number;
  firebaseAppName?: string;
  localPort?: number;
  offline?: boolean;
}

// Hash of route matchers
export const routes = {
  NEWS_AND_STUFF: /^\/(news.json|newest.json|ask.json|show.json|jobs.json)$/,
  ITEM: /^\/item\/(\d+).json$/,
  USER: /^\/user\/(\w+).json$/,
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
    // "news" | "ask" | "jobs" | "show" etc...
    const topic = req.params[0].replace('.json', '');
    const page = withinBounds(req.query.page);
    const newsies = await hnapi[topic]({ page });
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

/**
 * Create a data api depending on the offline configuration. If offline is disabled
 * the data api will retrieve data from Firebase server. Otherwise it will read from
 * local files.
 * @param config 
 * @param firebaseApp 
 */
function getApi(config: ApiConfig, firebaseApp: firebase.app.App) {
  let hnapi: Api;
  if(!config.offline) {
    hnapi = api(firebaseApp);
  } else {
    // firebase app does nothing here
    hnapi = offlineApi(firebaseApp);
  }  
  return hnapi;
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
  const { cdnCacheExpiry, browserCacheExpiry, staleWhileRevalidate } = config;
  return (req: express.Request, res: express.Response, next: Function) => {
    res.set('Cache-Control', `public, max-age=${browserCacheExpiry}, s-maxage=${cdnCacheExpiry}, stale-while-revalidate=${staleWhileRevalidate}`);
    next();
  };
}

/**
 * Attaches express route handlers for the HNAPI given a Firebase App instance and
 * a user's config.
 * @param expressApp 
 * @param config 
 */
export function configureExpressRoutes(expressApp: express.Application, config: ApiConfig) {
  // Init firebase app instance
  const firebaseApp = initializeApp(config);
  // Create API instance from firebaseApp
  let hnapi = getApi(config, firebaseApp);

  expressApp.get(routes.NEWS_AND_STUFF, getNewsAndStuff(hnapi));
  expressApp.get(routes.ITEM, getItemAndComments(hnapi));
  expressApp.get(routes.USER, getUserInfo(hnapi));
  expressApp.get('/favicon.ico', (req, res) => res.status(204).end());

  return expressApp;
}

/**
 * Create an express application object based on the configuration passed in.
 * @param config 
 */
export function createExpressApp(config: ApiConfig) {
  let expressApp: express.Application = express();

  // Configure middleware
  if (config.useCompression) { expressApp.use(compression()); }
  expressApp.use(cacheControl(config));

  // apply routes
  expressApp = configureExpressRoutes(expressApp, config);

  return expressApp;
}

/**
 * Create an express app instance without the middleware configuration.
 * This is used for testing or applications not hosted on Firebase Hosting.
 * @param firebaseAppName 
 */
export function createBareExpressApp(firebaseAppName = FIREBASE_APP_NAME) {
  return configureExpressRoutes(express(), { firebaseAppName });
}
