import * as fs from 'fs-extra';
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
  onStories?: (stories: Story[], sum: Story[], page: number) => void | Promise<void>): Promise<Story[]> {

  const pages: number[] = [];
  for (let i = opts.page; i <= max; i++) {
    pages.push(i);
  }

  const results = await Promise.all(pages.map(async (page) => {
    const stories = await hnapi[topic]({ ...opts, page });
    return { stories, page };
  }));

  // Sort by page number to ensure consistent accumulation and callback order
  results.sort((a, b) => a.page - b.page);

  let sum = [...acc];
  for (const result of results) {
    sum = sum.concat(result.stories);
    if (onStories !== undefined) {
      await onStories(result.stories, sum, result.page);
    }
  }

  return sum;
}

/**
 * Create the offline files from the current online HN data set.
 * @param hnapi 
 */
export async function buildFiles(hnapi: Api) {
  return new Promise((resolve, reject) => {
    try {
      let promiseHash: { [key: string]: Promise<Story[]> } = {};
      Object.keys(MAX_PAGES).forEach(topic => {
        if(typeof hnapi[topic] !== 'function') {
          promiseHash[topic] = Promise.resolve([]);
        } else {
          const opts = { page: 1 };
          const max = MAX_PAGES[topic];
          promiseHash[topic] = getStories({ hnapi, topic, opts, max }, (stories, sum, page) => {
            const json = JSON.stringify(stories);
            fs.mkdirpSync(`${__dirname}/static/${topic}/`);
            fs.writeFileSync(`${__dirname}/static/${topic}/${page}.json`, json, 'utf8');
          });
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
            resolve(void 0);
          });
        }
      }); 
    } catch (e) {
      reject(e);
    }
  });
}
