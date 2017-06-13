export * from './interfaces';
import { Story, itemMap, HackerNewsItemTree, HackerNewsItem } from './interfaces';
import { stories } from './stories';
import { getItemAndComments } from './item';

export type ApiFn = (options:{}) => Promise<Story[]>;
export type ApiString = 'topstories' | 'newstories' | 'askstories' | 'showstories' | 'jobstories' | 'item';

export const apiMap: { [key: string]: ApiString } = {
  NEWS: 'topstories',
  NEWEST: 'newstories',
  ASK: 'askstories',
  SHOW: 'showstories',
  JOBS: 'jobstories',
  ITEM: 'item'
};

export interface Api {
  [key: string]: any;
  news(options: {}): Promise<Story[]>;
  newest(options: {}): Promise<Story[]>;
  ask(options: {}): Promise<Story[]>;
  show(options: {}): Promise<Story[]>;
  jobs(options: {}): Promise<Story[]>;
  item(id: number): Promise<any>;
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
  async item(id: number) {
    const itemsWithComments = await getItemAndComments(id);
    return itemMap(itemsWithComments!);
  },
};

export default api;

