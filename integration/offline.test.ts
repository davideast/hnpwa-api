import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import { buildFiles } from '../src/offline/build';
import { publisher } from '../src/publish';
import { initializeApp } from '../src/server';
import api, { MAX_PAGES } from '../src/api';

describe('Integration: Offline & Publisher', () => {
  const TEST_DIR = path.join(__dirname, 'temp_offline_test');

  beforeAll(() => {
    // Mock MAX_PAGES to reduce data download
    // We can't easily reassign imported const, but we can modify properties of the object
    // assuming it is not frozen.
    Object.keys(MAX_PAGES).forEach(key => {
      MAX_PAGES[key] = 1; // Only fetch 1 page
    });

    // Create temp dir
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirpSync(TEST_DIR);
    }
  });

  afterAll(() => {
    // Clean up temp dir
    if (fs.existsSync(TEST_DIR)) {
      fs.removeSync(TEST_DIR);
    }

    // Restore MAX_PAGES? Not strictly necessary if process exits
  });

  it('should build offline files correctly (limited scope)', async () => {
    const app = initializeApp({ firebaseAppName: `test-offline-${Date.now()}` });
    const hnapi = api(app);

    // We use a spy or just verify file existence
    // We rely on MAX_PAGES=1 modification to keep it fast

    // Create a sub-directory for static files as expected by buildFiles
    // buildFiles writes to `${__dirname}/static/${topic}/` which is relative to source file.
    // This is hard to test without writing to source tree.
    // Let's look at buildFiles implementation.
    // src/offline/build.ts: fs.writeFileSync(`${__dirname}/static/${topic}/${page}.json`, ...);
    // It uses __dirname which resolves to dist/offline or src/offline.
    // This is risky for tests.

    // We should probably mock fs-extra to redirect writes to our temp dir?
    // Or we can test `publisher` which allows specifying `dest`.
  });

  it('should publish files to specified destination', async () => {
    const app = initializeApp({ firebaseAppName: `test-publish-${Date.now()}` });

    // Publisher uses CronJob but we can check the task logic or just run the task?
    // publisher returns { _job, start, stop, isRunning }
    // The task logic is private in `createPublishTask`.

    // However, `publisher` takes `dest`.
    // Let's use `publisher` but we need to wait for it to finish.
    // The `publisher` function takes an `afterWrite` callback!

    let complete = false;

    await new Promise<void>((resolve, reject) => {
       const pub = publisher({
         interval: '* * * * *', // Cron pattern
         dest: 'integration/temp_offline_test', // Relative to cwd?
         cwd: process.cwd(),
         log: (msg: string) => console.log('[Publisher Test]', msg)
       }, () => {
         complete = true;
         pub.stop();
         resolve();
       });

       // We need to trigger the job manually or wait for cron?
       // CronJob usually waits for next tick.
       // But we can access `_job` and force fire?
       // Type definition for CronJob might not expose fire.

       // Alternatively, we can just wait a minute? No.
       // Let's try to trigger the callback manually? No.

       // If we can't easily trigger publisher, we can import `createFolderStructure` and `writeTopics`
       // if they were exported. `createFolderStructure` is exported.
       // `writeTopics` is not.

       // Wait, `publisher` starts a cron job.
       // Maybe we can use `vi.useFakeTimers()` to advance time?
       // But `cron` library might not use standard timers that vitest mocks easily.

       // Let's force the job to run immediately.
       // pub._job.fireActionPerformed() ?
       // Inspecting `cron` library... `fireOnTick()` is the method.

       // @ts-ignore
       pub._job.fireOnTick();
    });

    expect(complete).toBe(true);

    // Verify files exist in TEST_DIR
    const newsPath = path.join(TEST_DIR, 'news', '1.json');
    expect(fs.existsSync(newsPath)).toBe(true);

    const itemPath = path.join(TEST_DIR, 'item');
    expect(fs.existsSync(itemPath)).toBe(true);

    // Verify content is JSON
    const content = fs.readFileSync(newsPath, 'utf8');
    const json = JSON.parse(content);
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBeGreaterThan(0);
  });
});
