import * as functions from 'firebase-functions';
import * as firebase from 'firebase';
import * as express from 'express';
import * as compression from 'compression';
import api from './api';

const app = express();

const routes = {
  NEWS_AND_STUFF: /^\/(news|news2|newest|ask|show|jobs)$/,
  BEST_IN_SHOW: /^\/(shownew|best|active|noobstories)$/,
  ITEM: /^\/item\/(\d+)$/,
  NEW_COMMENTS: '/newcomments',
  USER: /^\/user\/(\w+)$/,
};

function roundDown(page: string) {
  return Math.min(10, Math.max(1, parseInt(page, 10) || 1));
}

function initializeApp(req: express.Request, res: express.Response, next: Function) {
  // This assumes only one firebase app instance
  if(firebase.apps.length === 0) {
    firebase.initializeApp({ databaseURL: 'https://hacker-news.firebaseio.com/' });
  }
  next();
}

function cacheControl(req: express.Request, res: express.Response, next: Function) {
  // Cache in browser for 5 min and in on CDN for 10 min
  res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
  next();
}

export async function getNewsAndStuff(req: express.Request, res: express.Response) {
  const base = req.params[0];
  const page = roundDown(req.query.page);
  const newsies = await api[base]({ page });
  res.jsonp(newsies);
}

export async function getItemAndComments(req: express.Request, res: express.Response) {
  const itemId = req.params[0];
  const item = await api.item(itemId);
  res.jsonp(item);
}

// Middleware
app.use(initializeApp);
app.use(cacheControl);
app.use(compression());

// GET Routes
app.get(routes.NEWS_AND_STUFF, getNewsAndStuff);
app.get(routes.ITEM, getItemAndComments);
app.get('/favicon.ico', (req, res) => res.status(204).end());

/**
 * Helper function for detecting the "dev" argument. This allows
 * you to run the server locally with `node server dev`.
 */
function isDevMode() {
  const args = process.argv.slice(2);
  return args.find(arg => arg === 'dev');
}

if(isDevMode()) {
  app.listen('3002', () => console.log('listening'));
}

export { app };
