export * from './interfaces';
import { Story, itemMap, HackerNewsItemTree, HackerNewsItem, Item } from './interfaces';
import { stories } from './stories';
import { getItemAndComments } from './item';
import { getUser, User } from './user';

export type ApiFn = (options:{}) => Promise<Story[]>;
export type ApiString = 'topstories' | 'newstories' | 'askstories' | 'showstories' | 'jobstories' | 'item' | 'user';

// Constant Hash of API topics 
export const apiMap: { [key: string]: ApiString } = {
  NEWS: 'topstories',
  NEWEST: 'newstories',
  ASK: 'askstories',
  SHOW: 'showstories',
  JOBS: 'jobstories',
  ITEM: 'item',
  USER: 'user'
};

export interface Api {
  [key: string]: any;
  news(options: {}): Promise<Story[]>;
  newest(options: {}): Promise<Story[]>;
  ask(options: {}): Promise<Story[]>;
  show(options: {}): Promise<Story[]>;
  jobs(options: {}): Promise<Story[]>;
  item(id: number): Promise<Item>;
  user(id: number): Promise<User>;
}

export type ApiCreator = (app: firebase.app.App) => Api;

/**
 * Helper method for generating a "story" feed. Top level keys like 
 * "topstories" and "newstories" return an array of child keys which require
 * subsequent fetching. 
 * @param key 
 * @param options 
 */
function storyFactory(key: ApiString, app: firebase.app.App) {
  return (options: {}) => stories(key, options, app);
}

/**
 * The aggregated API for interfacing with Hacker News.
 */
const api: ApiCreator = (app: firebase.app.App) => {
  return {
    news(options: {}): Promise<Story[]> {
      return storyFactory(apiMap.NEWS, app)(options);
    },
    newest(options: {}) {
      return storyFactory(apiMap.NEWEST, app)(options);
    },
    ask(options: {}) {
      return storyFactory(apiMap.ASK, app)(options);
    },
    show(options: {}) {
      return storyFactory(apiMap.SHOW, app)(options);
    },
    jobs(options: {}) {
      return storyFactory(apiMap.NEWS, app)(options);
    },
    user(id: number) {
      return getUser(id, app);
    },
    async item(id: number) {
      const itemsWithComments = await getItemAndComments(id, app);
      return itemMap(itemsWithComments!);
    },
  }
};

export default api;
