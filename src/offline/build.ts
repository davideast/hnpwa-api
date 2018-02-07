import * as fs from 'fs';
import { Api, ApiOptions, Story, MAX_PAGES } from '../api';

export interface GetStoriesOptions {
  hnapi: Api;
  topic: string;
  opts: ApiOptions;
  max: number;
  acc?: Story[];
}

/**
 * Retrieve all stories across all pages into a single array. A callback
 * is provided for each recursive call.
 */
export async function getStories(
  { hnapi, topic, opts, max, acc = [] }: GetStoriesOptions,
  onStories?: (stories: Story[], sum: Story[], page: number) => void): Promise<Story[]> {
  const news = await hnapi[topic](opts);
  const sum = acc.concat(news);
  const nextPage = opts.page + 1;
  if(onStories !== undefined) {
    onStories(news, sum, opts.page);
  }
  if(opts.page >= max) {
    return sum;
  }
  opts = { page: nextPage };

  return getStories({ hnapi, topic, opts, max, acc: sum }, onStories);
}

/**
 * Create the offline files from the current online HN data set.
 * @param hnapi 
 */
export async function buildFiles(hnapi: Api) {
  let promiseHash: { [key: string]: Promise<Story[]> } = {};
  Object.keys(MAX_PAGES).forEach(topic => {
    if(typeof hnapi[topic] !== 'function') {
      promiseHash[topic] = Promise.resolve([]);
    } else {
      const opts = { page: 1 };
      const max = MAX_PAGES[topic];
      promiseHash[topic] = getStories({ hnapi, topic, opts, max });
    }
  });

  Object.keys(promiseHash).forEach(async key => {
    const stories = await promiseHash[key];
    if(stories.length > 0) {
      const json = JSON.stringify(stories);
      fs.writeFileSync(`${__dirname}/${key}.json`, json, 'utf8');
    }

    if(key === 'news') {
      const itemPromises = stories.map(story => hnapi.item(story.id));
      const allItems = await Promise.all(itemPromises);
      const itemsJson = JSON.stringify(allItems);
      fs.writeFile(`${__dirname}/items.json`, itemsJson, 'utf8', () => {
        process.exit(0);
      });
    }
  });
}
