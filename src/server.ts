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

function initializeApp(req: express.Request, res: express.Response, next: Function) {
  if(firebase.apps.length === 0) {
    firebase.initializeApp({ databaseURL: 'https://hacker-news.firebaseio.com/' });
  }
  next();
}

function cacheControl(req: express.Request, res: express.Response, next: Function) {
  res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
  next();
}

export async function getNewsAndStuff(req: express.Request, res: express.Response) {
  const base = req.params[0];
  const page = Math.min(10, Math.max(1, parseInt(req.query.page, 10) || 1));
  const newsies = await api[base]({ page });
  res.jsonp(newsies);
}

app.use(initializeApp);
app.use(cacheControl);
app.use(compression());
app.get(routes.NEWS_AND_STUFF, getNewsAndStuff);

function isDevMode() {
  const args = process.argv.slice(2);
  return args.find(arg => arg === 'dev');
}

if(isDevMode()) {
  app.listen('3002', () => console.log('listening'));
}

export { app };
