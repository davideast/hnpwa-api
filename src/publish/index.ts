import * as fs from 'fs-extra';
import * as path from 'path';
import * as express from 'express';
import { CronJob } from 'cron';
import { createApp } from '../cli';
import { getStories, GetStoriesOptions } from '../offline/build';
import { Api, ApiOptions, Story, MAX_PAGES } from '../api';
import api from '../api';
import { initializeApp } from '../server';

export interface PublishOptions {
  interval: string | Date;
  dest: string;
  cwd: string;
}

/**
 * Write files to disk from the HNPWA API at a set interval. Fire the
 * afterWrite callback when all files are written.
 * @param options
 * @param afterWrite 
 */
export function publisher(opts: PublishOptions, afterWrite: () => void) {
  const { interval, dest, cwd } = opts;
  const rootPath = createFolderStructure(dest, cwd);
  const job = new CronJob(interval, createPublishTask(rootPath, afterWrite));
  return {
    _job: job,
    start: () => job.start(),
    stop: () => job.stop(),
    isRunning: () => job.running
  };
}

/**
 * Create the API folder structure given the root path and the current
 * working directory.
 * 
 * Ex:
 * /v0
 *  / news
 *  - 1.json
 * 
 * @param root 
 * @param cwd 
 */
export function createFolderStructure(root: string, cwd: string) {
  const rootPath = path.resolve(cwd, root);
  const itemPath = path.resolve(rootPath, 'item');
  fs.mkdirpSync(rootPath);
  Object.keys(MAX_PAGES).forEach(topic => {
    const topicPath = path.resolve(rootPath, topic);
    fs.mkdirpSync(topicPath);
  });
  fs.mkdirpSync(itemPath);
  return rootPath;
}


/**
 * Creates the task of writing HNPWA API files to disk.
 * @param rootPath 
 * @param afterWrite 
 */
function createPublishTask(rootPath: string, afterWrite: Function): () => void {
  return async () => {
    const opts = { page: 1 };
    const firebaseApp = initializeApp({ firebaseAppName: `${Date.now()}` });
    const hnapi = api(firebaseApp);
    const promiseHash = writeTopics(hnapi, rootPath);
    const stories = await promiseHash.news;
    await writeItems(stories, hnapi, rootPath);
    afterWrite();
  };
}

/**
 * Downloads and writes the top-level HNPWA API topics to disk.
 * @param hnapi 
 * @param rootPath 
 */
function writeTopics(hnapi: Api, rootPath: string) {
  let promiseHash: { [key: string]: Promise<Story[]> } = {};
  Object.keys(MAX_PAGES).forEach(topic => {
    if (typeof hnapi[topic] !== 'function') {
      promiseHash[topic] = Promise.resolve([]);
    }
    else {
      const opts = { page: 1 };
      const max = MAX_PAGES[topic];
      promiseHash[topic] = getStories({ hnapi, topic, opts, max }, function getStories(stories, sum, page) {
        const topicPath = path.resolve(rootPath, topic, `${page.toString()}.json`);
        if (stories.length > 0) {
          fs.writeFileSync(topicPath, JSON.stringify(stories), 'utf8');
          console.log(`Wrote ${topicPath}.`);
        }
      });
    }
  });
  return promiseHash;
}

/**
 * Writes a given set of items to individual disk files.
 * @param stories 
 * @param hnapi 
 * @param rootPath 
 */
async function writeItems(stories: Story[], hnapi: Api, rootPath: string) {
  try {
    const itemPromises = stories.map(story => hnapi.item(story.id));
    const allItems = await Promise.all(itemPromises);
    console.log(allItems);
    return new Promise((resolve, reject) => {
      allItems.forEach(item => {
        if(item === null) {
          return;
        }
        console.log(item.id);
        const itemPath = path.resolve(rootPath, 'item', `${item.id.toString()}.json`);
        fs.writeFileSync(itemPath, JSON.stringify(item), 'utf8');
        console.log(`Wrote ${itemPath}.`)
      });
      resolve();
    });
  } catch(e) {
    console.log(e);
    throw e;
  }
}
