import { ApiCreator, ApiOptions, Story } from './types';
import { apiMap } from './constants';
import { storyFactory, topicEndpointFactory, itemEndpointFactory, userEndpointFactory } from './factories';
import { getUser } from './user';
import { getItemAndComments } from './item';
import { itemMap } from './transforms';
// @ts-ignore
import firebase from 'firebase/compat/app';

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
    user(id: string | number) {
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
