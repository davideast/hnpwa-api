// @ts-ignore
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import express from 'express';
import { Express }  from 'express';
import compression from 'compression';
import { Api, SimpleLRU } from './api';
import api from './api';
import offlineApi from './offline/api';
import { installMcpServer } from './mcp/server';

export const FIREBASE_APP_NAME = 'hnpwa-api';

const MS_PER_MINUTE = 60 * 1000;

export const STORIES_CACHE_MAX_SIZE = 100;
export const STORIES_CACHE_TTL = 5 * MS_PER_MINUTE;

export const ITEMS_CACHE_MAX_SIZE = 1000;
export const ITEMS_CACHE_TTL = 10 * MS_PER_MINUTE;

const storiesCache = new SimpleLRU<any>(STORIES_CACHE_MAX_SIZE, STORIES_CACHE_TTL);
const itemsCache = new SimpleLRU<any>(ITEMS_CACHE_MAX_SIZE, ITEMS_CACHE_TTL);

export interface ApiConfig {
  useCors?: boolean;
  routerPath?: string;
  useCompression?: boolean;
  browserCacheExpiry?: number;
  cdnCacheExpiry?: number;
  staleWhileRevalidate?: number;
  firebaseAppName?: string;
  offline?: boolean;
  runWith?: {
    memory: '128MB' | '256MB' | '512MB' | '1GB' | '2GB'; 
    timeoutSeconds: number;
  }
}

// Hash of route matchers
export const routes = {
  NEWS_AND_STUFF: /^\/(news.json|newest.json|ask.json|show.json|jobs.json)$/,
  ITEM: /^\/item\/(\d+).json$/,
  USER: /^\/user\/([\w-]+).json$/,
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

export function getIndex(hnapi: Api) {
  return (req: any, res: any) => {
    res.jsonp(hnapi.index());
  };
}

/**
 * Creates an express route handler based on a Firebase App instance.
 * Get a list of "stories" based on the parameters provided. This API maps to the
 * traditional "top bar" (news, ask, jobs, show) in HN UI's. Paging is provided 
 * through the ?page query param.
 * @param firebaseApp
 */
export function getNewsAndStuff(hnapi: Api) {
  return async (req: any, res: any) => {
    // "news" | "ask" | "jobs" | "show" etc...
    const topic = req.params[0].replace('.json', '');
    const page = withinBounds(req.query.page);

    const cacheKey = `${topic}-${page}`;
    const cached = storiesCache.get(cacheKey);
    if (cached) {
      return res.jsonp(cached);
    }

    const newsies = await hnapi[topic]({ page });
    storiesCache.set(cacheKey, newsies);
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
  return async (req: any, res: any) => {
    const itemId = req.params[0];

    const cached = itemsCache.get(itemId);
    if (cached) {
      return res.jsonp(cached);
    }

    const item = await hnapi.item(itemId);
    itemsCache.set(itemId, item);
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
  return async (req: any, res: any) => {
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
export function initializeApp(config: ApiConfig): firebase.app.App {
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
  return (req: any, res: any, next: Function) => {
    res.set('Cache-Control', `public, max-age=${browserCacheExpiry}, s-maxage=${cdnCacheExpiry}, stale-while-revalidate=${staleWhileRevalidate}`);
    next();
  };
}


function prettyPrint() {
  return (req: any, res: any, next: Function) => {
    // Override res.json and res.jsonp to avoid global state modifications.
    // This prevents race conditions where concurrent requests interfere with
    // each other's response formatting.
    const app = req.app;

    res.json = function(obj: any) {
      const print = this.req.query.print;
      // Index page (/) is pretty-printed by default
      const isIndex = this.req.path === '/' || this.req.path === '';
      const spaces = (typeof print === 'undefined' && !isIndex) ? 0 : 2;

      const replacer = app.get('json replacer');
      const body = JSON.stringify(obj, replacer, spaces);
      this.set('Content-Type', 'application/json');
      return this.send(body);
    };

    res.jsonp = function(obj: any) {
      const print = this.req.query.print;
      // Index page (/) is pretty-printed by default
      const isIndex = this.req.path === '/' || this.req.path === '';
      const spaces = (typeof print === 'undefined' && !isIndex) ? 0 : 2;

      const replacer = app.get('json replacer');
      let body = JSON.stringify(obj, replacer, spaces);
      const callbackName = app.get('jsonp callback name') || 'callback';
      let callback = this.req.query[callbackName];

      if (Array.isArray(callback)) {
        callback = callback[0];
      }

      if (typeof callback === 'string' && callback.length !== 0) {
        this.set('X-Content-Type-Options', 'nosniff');
        this.set('Content-Type', 'text/javascript');
        const cb = callback.replace(/[^\[\]\w$.]/g, '');

        // Handle undefined JSON.stringify result
        if (typeof body === 'undefined') {
          return this.send(`/**/ typeof ${cb} === 'function' && ${cb}(${body});`);
        }

        const json = body.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
        return this.send(`/**/ typeof ${cb} === 'function' && ${cb}(${json});`);
      }

      this.set('Content-Type', 'application/json');
      return this.send(body);
    };

    next();
  };
}

// Define RequestHandler type locally to match express usage
type RequestHandler = (req: any, res: any, next: any) => void;

/**
 * Attaches express route handlers for the HNAPI given a Firebase App instance and
 * a user's config.
 * @param expressApp 
 * @param config 
 */
export function configureExpressRoutes(expressApp: Express, config: ApiConfig) {
  // Init firebase app instance
  const firebaseApp = initializeApp(config);
  // Create API instance from firebaseApp
  let hnapi = getApi(config, firebaseApp);
  
  // Mount MCP Server
  installMcpServer(expressApp, hnapi);

  expressApp.get('/', getIndex(hnapi));
  expressApp.get(routes.NEWS_AND_STUFF, getNewsAndStuff(hnapi));
  expressApp.get(routes.ITEM, getItemAndComments(hnapi));
  expressApp.get(routes.USER, getUserInfo(hnapi));
  expressApp.get('/favicon.ico', (req, res) => res.status(204).end());
  expressApp.get('/_start', (req, res) => {
    res.set('Cache-Control', 'private');
    res.send(true);
  });

  return expressApp;
}

/**
 * Create an express application object based on the configuration passed in.
 * @param config 
 */
export function createExpressApp(config: ApiConfig) {
  let expressApp: Express = express();
  expressApp.set('json spaces', 0);

  // Configure middleware
  if (config.useCompression) { expressApp.use(compression()); }
  expressApp.use(cacheControl(config));
  expressApp.use(prettyPrint());

  if (config.offline) { expressApp.use(express.static(`${__dirname}/offline/static`)); }

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
