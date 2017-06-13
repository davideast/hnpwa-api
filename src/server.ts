import * as functions from 'firebase-functions';
import * as firebase from 'firebase';
import * as express from 'express';
import * as compression from 'compression';
import api from './api';

const server: express.Application = express();

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
 */
function withinBounds(page: string, bounds: number = 10) {
  return Math.min(bounds, Math.max(1, parseInt(page, 10) || 1));
}

/**
 * Initializes the default App instance if none exists. This middleware assumes
 * that there is only one Firebase app instance.
 * @param req 
 * @param res 
 * @param next 
 */
function initializeApp(req: express.Request, res: express.Response, next: Function) {
  if(firebase.apps.length === 0) {
    firebase.initializeApp({ databaseURL: 'https://hacker-news.firebaseio.com/' });
  }
  next();
}

/**
 * Get a list of "stories" based on the parameters provided. This API maps to the
 * traditional "top bar" (news, ask, jobs, show) in HN UI's. Paging is provided 
 * through the ?page query param.
 * @param req 
 * @param res 
 */
export async function getNewsAndStuff(req: express.Request, res: express.Response) {
  const base = req.params[0]; // "news" | "ask" | "jobs" | "show" etc...
  const page = withinBounds(req.query.page);
  const newsies = await api[base]({ page });
  res.jsonp(newsies);
}

/**
 * Get an item and it's comments from a request id param and return the JSON representation of 
 * the user.
 * @param req 
 * @param res 
 */
export async function getItemAndComments(req: express.Request, res: express.Response) {
  const itemId = req.params[0];
  const item = await api.item(itemId);
  res.jsonp(item);
}

/**
 * Get a user from a request id param and return the JSON representation of 
 * the user.
 * @param req 
 * @param res 
 */
export async function getUserInfo(req: express.Request, res: express.Response) {
  const userId = req.params[0];
  const user = await api.user(userId);
  res.jsonp(user);
}

// Middleware
server.use(initializeApp);
server.use(compression());

// GET Routes
server.get(routes.NEWS_AND_STUFF, getNewsAndStuff);
server.get(routes.ITEM, getItemAndComments);
server.get(routes.USER, getUserInfo);
server.get('/favicon.ico', (req, res) => res.status(204).end());

/**
 * Helper function for detecting the "dev" argument. This allows
 * you to run the server locally with `node server dev`.
 */
function isDevMode() {
  const args = process.argv.slice(2);
  return args.find(arg => arg === 'dev');
}

if(isDevMode()) {
  server.listen('3002', () => console.log('listening on 3002'));
}

export { server };
