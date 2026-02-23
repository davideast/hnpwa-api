import { ApiString, ApiOptions } from './types';
import { stories } from './stories';
import { MAX_PAGES } from './constants';
// @ts-ignore
import firebase from 'firebase/compat/app';

/**
 * Helper method for generating a "story" feed. Top level keys like
 * "topstories" and "newstories" return an array of child keys which require
 * subsequent fetching.
 * @param key
 * @param options
 */
export function storyFactory(key: ApiString, app: firebase.app.App) {
  return (options: ApiOptions) => stories(key, options, app);
}

export function topicEndpointFactory(topic: string) {
  return {
    topic,
    url: `https://api.hnpwa.com/v0/${topic}/1.json`,
    maxPages: MAX_PAGES[topic]
  };
}

export function itemEndpointFactory() {
  return {
    topic: 'item',
    url: `https://api.hnpwa.com/v0/item/1.json`,
    maxPages: null
  };
}

export function userEndpointFactory() {
  return {
    topic: 'user',
    url: `https://api.hnpwa.com/v0/user/davideast.json`,
    maxPages: null
  };
}
