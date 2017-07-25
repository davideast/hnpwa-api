import { Api, ApiCreator, ApiOptions, Story, Item, User } from '../api';

const TEST_USER: User = { about: '', created_time: 1400006274, created: "3 years ago", id: "davideast", karma: 22 };

const getFile = (topic: string): Story[] => {
  return require(__dirname + `/${topic}.json`);
};

const pageStories = (topic: string, options: ApiOptions): Story[] => {
  const stories = getFile(topic);
  const opts = { page: 1, ...options };
  const limit = 30;
  const startIndex = (opts.page - 1) * limit;
  const endIndex = startIndex + limit;
  return stories.slice(startIndex, endIndex);
};

const offlineApi = (app: any) => {
  return {
    async news(options: ApiOptions) {
      return pageStories('news', options);
    },
    async newest(options: ApiOptions) {
      return pageStories('newest', options);
    },
    async ask(options: ApiOptions) {
      return pageStories('ask', options);
    },
    async show(options: ApiOptions) {
      return pageStories('show', options);
    },
    async jobs(options: ApiOptions) {
      return pageStories('jobs', options);
    },
    async user(id: number) {
      return TEST_USER as User;
    },
    async item(id: number) {
      return {} as Item;
    }
  };
};

export default offlineApi;
