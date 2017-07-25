import * as fs from 'fs';
import {Api, ApiOptions, Story, MAX_PAGES} from '../api';

/**
 * Retrieve all stories across all pages into a single array.
 * @param hnapi 
 * @param topic 
 * @param opts 
 * @param max 
 * @param acc 
 */
async function getStories(hnapi: Api, topic: string, opts: ApiOptions, max: number, acc: Story[] = []): Promise<Story[]> {
  const news = await hnapi[topic](opts);
  const sum = acc.concat(news);
  const nextPage = opts.page + 1;
  if(opts.page >= max) {
    return sum;
  }
  opts = { page: nextPage };

  return getStories(hnapi, topic, opts, max, sum);
}

/**
 * Create the offline files from the current online HN data set.
 * @param hnapi 
 */
export async function buildFiles(hnapi: Api) {
  let promiseHash: { [key: string]: Promise<Story[]> } = {};
  Object.keys(MAX_PAGES).forEach(key => {
    if(typeof hnapi[key] !== 'function') {
      promiseHash[key] = Promise.resolve([]);
    } else {
      const opts = { page: 1 };
      const maxPage = MAX_PAGES[key];
      promiseHash[key] = getStories(hnapi, key, opts, maxPage);
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
