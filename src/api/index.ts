export * from './interfaces';
import { HackerNewsItem } from './interfaces';
import { stories } from './stories';

export type ApiFn = (options:{}) => Promise<HackerNewsItem[]>;
export type ApiString = 'topstories' | 'newstories' | 'askstories' | 'showstories' | 'jobstories';

export const apiMap: { [key: string]: ApiString } = {
  news: 'topstories',
  newest: 'newstories',
  ask: 'askstories',
  show: 'showstories',
  jobs: 'jobstories'
};

let api: {
  [key: string]: ApiFn;
  news: ApiFn;
  newest: ApiFn;
  ask: ApiFn;
  show: ApiFn;
  jobs: ApiFn;
} = {} as any;

Object.keys(apiMap).forEach(key => {
  api[key] = (options: {}) => stories(apiMap[key], options);
});

export default api;