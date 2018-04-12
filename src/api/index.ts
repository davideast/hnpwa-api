export * from './interfaces';
import { Story, itemMap, HackerNewsItemTree, HackerNewsItem, Item, User } from './interfaces';
import { stories } from './stories';
import { getItemAndComments } from './item';
import { getUser } from './user';

export type ApiFn = (options: {}) => Promise<Story[]>;
export type ApiString = 'topstories' | 'newstories' | 'askstories' | 'showstories' | 'jobstories' | 'item' | 'user';
export interface ApiOptions {
  page: number;
}
export const MAX_PAGES: { [key: string]: number } = {
  "news": 10,
  "jobs": 1,
  "ask": 2,
  "show": 2,
  "newest": 10,
  "/": 10
};

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
  index(): { name: string };
  news(options: ApiOptions): Promise<Story[]>;
  newest(options: ApiOptions): Promise<Story[]>;
  ask(options: ApiOptions): Promise<Story[]>;
  show(options: ApiOptions): Promise<Story[]>;
  jobs(options: ApiOptions): Promise<Story[]>;
  item(id: number): Promise<Item | null>;
  user(id: number): Promise<User | null>;
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
  return (options: ApiOptions) => stories(key, options, app);
}

function topicEndpointFactory(topic: string) {
  return {
    topic,
    url: `https://api.hnpwa.com/v0/${topic}/1.json`,
    maxPages: MAX_PAGES[topic]
  };
}

function itemEndpointFactory() {
  return {
    topic: 'item',
    url: `https://api.hnpwa.com/v0/item/1.json`,
    maxPages: null
  };
}

function userEndpointFactory() {
  return {
    topic: 'user',
    url: `https://api.hnpwa.com/v0/users/davideast.json`,
    maxPages: null
  };
}

/**
 * The aggregated API for interfacing with Hacker News.
 */
const api: ApiCreator = (app: firebase.app.App) => {
  return {
    index(): any {
      return {
        name: 'Welcome to the HNPWA API',
        endpoints: [
          topicEndpointFactory('news'),
          topicEndpointFactory('newest'),
          topicEndpointFactory('ask'),
          topicEndpointFactory('show'),
          topicEndpointFactory('jobs'),
          itemEndpointFactory(),
          userEndpointFactory()
        ]
      };
    },
    news(options: ApiOptions): Promise<Story[]> {
      return storyFactory(apiMap.NEWS, app)(options);
    },
    newest(options: ApiOptions) {
      return storyFactory(apiMap.NEWEST, app)(options);
    },
    ask(options: ApiOptions) {
      return storyFactory(apiMap.ASK, app)(options);
    },
    show(options: ApiOptions) {
      return storyFactory(apiMap.SHOW, app)(options);
    },
    jobs(options: ApiOptions) {
      return storyFactory(apiMap.JOBS, app)(options);
    },
    user(id: number) {
      return getUser(id, app);
    },
    async item(id: number) {
      const itemsWithComments = await getItemAndComments(id, app);
      if(itemsWithComments === null || itemsWithComments === undefined) {
        return null;
      }
      return itemMap(itemsWithComments);
    },
  }
};

export default api;
