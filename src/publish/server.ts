import * as fs from 'fs-extra';
import * as path from 'path';
import * as express from 'express';
import { CronJob } from 'cron';
import { createApp } from '../cli';
import { getStories, GetStoriesOptions } from '../offline/build';
import { Api, ApiOptions, Story, MAX_PAGES } from '../api';
import api from '../api';
import { initializeApp } from '../server';

export interface PubishServerOptions {
  port: number;
  interval: string | Date;
  dest: string;
  cwd: string;
}

export function createFolderStructure(dest: string, cwd: string) {
  const rootPath = path.resolve(cwd, dest);
  fs.mkdirpSync(rootPath);
}

export function publishServer(
    { port, interval, dest, cwd }: PubishServerOptions) {
  const app = createApp({ port, offline: false, routerPath: '' });
  createFolderStructure(dest, cwd);
  let promiseHash: { [key: string]: Promise<Story[]> } = {};
  let afterWriteCallback: Function;
  const job = new CronJob(interval, () => {
    const topic = "news";
    const opts = { page: 1 };
    const max = MAX_PAGES[topic];
    const firebaseApp = initializeApp({ firebaseAppName: `${Date.now()}` });
    const hnapi = api(firebaseApp);
    getStories({ hnapi, topic, opts, max }, function onStories(items, sum, page) {
      console.log(page);
      afterWriteCallback();
    });
  });
  return {
    _app: app,
    _job: job,
    afterWrite(cb: () => void) {
      afterWriteCallback = cb;
    },
    start(message = `Listening on ${port}...`) {
      const server = app.listen(port, () => console.log(message))
      job.start();
      return function stop() {
        server.close();
        job.stop(); 
      };
    }
  };
}

/**
const server = publishServer({ 
  port: 3002, 
  interval: '', 
  dest: '', 
  cwd: process.cwd()
});

const stop = server.start('');

server.afterWrite(() => {
  console.log('Writing');
  stop();
});
*/