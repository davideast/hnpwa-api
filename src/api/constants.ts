import { ApiString } from './types';

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
