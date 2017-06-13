export * from './interfaces';
import { Story, itemMap, HackerNewsItemTree, HackerNewsItem, Item } from './interfaces';
import { stories } from './stories';
import { getItemAndComments } from './item';
import { getUser, User } from './user';

export type ApiFn = (options:{}) => Promise<Story[]>;
export type ApiString = 'topstories' | 'newstories' | 'askstories' | 'showstories' | 'jobstories' | 'item' | 'user';

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

/**
 * Helper method for generating a "story" feed. Top level keys like 
 * "topstories" and "newstories" return an array of child keys which require
 * subsequent fetching. 
 * @param key 
 * @param options 
 */
function storyFactory(key: ApiString) {
  return (options: {}) => stories(key, options);
}

/**
 * The aggregated API for interfacing with Hacker News.
 */
const api: Api = {
  news(options: {}): Promise<Story[]> { 
    return storyFactory(apiMap.NEWS)(options); 
  },
  newest(options: {}) { 
    return storyFactory(apiMap.NEWEST)(options); 
  },
  ask(options: {}) { 
    return storyFactory(apiMap.ASK)(options); 
  },
  show(options: {}) { 
    return storyFactory(apiMap.SHOW)(options); 
  },
  jobs(options: {}) { 
    return storyFactory(apiMap.NEWS)(options); 
  },
  user(id: number) {
    return getUser(id);
  },
  async item(id: number) {
    const itemsWithComments = await getItemAndComments(id);
    return itemMap(itemsWithComments!);
  },
};

export default api;
