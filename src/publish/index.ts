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
  log?: Function;
}

const json404 = (topic: string) => {
  const page = MAX_PAGES[topic];
  return {
    "status": "404",
    "max": page,
    "message": `Page not found. Maximum page number is ${page}`
  };
}

/**
 * Write files to disk from the HNPWA API at a set interval. Fire the
 * afterWrite callback when all files are written.
 * @param options
 * @param afterWrite 
 */
export function publisher(opts: PublishOptions, afterWrite: () => void) {
  let { interval, dest, cwd, log } = opts;
  // If the user does not provide a log function, use a noop fn
  if(typeof log !== 'function') { log = () => {} };
  const job = new CronJob(interval, createPublishTask(dest, cwd, afterWrite, log));
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
export function createFolderStructure(root: string, cwd: string, log: Function) {
  const rootPath = path.resolve(cwd, root);
  const itemPath = path.resolve(rootPath, 'item');
  // Delete existing files first for a fresh deploy
  log('Deleting current data.');
  fs.removeSync(rootPath);
  fs.mkdirpSync(rootPath);
  Object.keys(MAX_PAGES).forEach(topic => {
    const maxPlusOne = MAX_PAGES[topic] + 1;
    const topicPath = path.resolve(rootPath, topic);
    const path404 = path.resolve(topicPath, `${maxPlusOne}.json`);
    fs.mkdirpSync(topicPath);
    // Write a 404 json result for the next page outside of the
    // MAX_PAGES result.
    fs.writeFileSync(path404, json404(topic), 'utf8');
  });
  fs.mkdirpSync(itemPath);
  return rootPath;
}


/**
 * Creates the task of writing HNPWA API files to disk.
 * @param rootPath 
 * @param afterWrite 
 */
function createPublishTask(dest: string, cwd: string, afterWrite: Function, log: Function): () => void {
  return async () => {
    const rootPath = createFolderStructure(dest, cwd, log);
    const firebaseApp = initializeApp({ firebaseAppName: `${Date.now()}` });
    const hnapi = api(firebaseApp);
    const promiseHash = writeTopics(hnapi, rootPath, log);
    const stories = await promiseHash.news;
    await writeItems(stories, hnapi, rootPath, log);
    afterWrite();
  };
}

/**
 * Downloads and writes the top-level HNPWA API topics to disk.
 * @param hnapi 
 * @param rootPath 
 */
function writeTopics(hnapi: Api, rootPath: string, log: Function) {
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
          log(`Wrote ${topicPath}.`);
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
async function writeItems(stories: Story[], hnapi: Api, rootPath: string, log: Function) {
  try {
    const itemPromises = stories.map(story => hnapi.item(story.id));
    const allItems = await Promise.all(itemPromises);
    return new Promise((resolve, reject) => {
      allItems.forEach(item => {
        if(item === null) {
          return;
        }
        const itemPath = path.resolve(rootPath, 'item', `${item.id.toString()}.json`);
        fs.writeFileSync(itemPath, JSON.stringify(item), 'utf8');
        log(`Wrote ${itemPath}.`)
      });
      resolve();
    });
  } catch(e) {
    log(e);
    throw e;
  }
}
