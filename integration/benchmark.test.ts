import { describe, it } from 'vitest';
import { getItemAndComments } from '../src/api/item';
import { initializeApp } from '../src/server';
// @ts-ignore
import firebase from 'firebase/compat/app';

describe('Benchmark getItemAndComments', () => {
  it('measures performance for item 8863', { timeout: 60000 }, async () => {
    const app = initializeApp({ firebaseAppName: 'benchmark' });
    const itemId = 8863; // Dropbox Show HN - moderate size tree

    console.log('Starting benchmark...');

    const iterations = 3;
    let totalTime = 0;

    for (let i = 0; i < iterations; i++) {
       const start = Date.now();
       await getItemAndComments(itemId, app);
       const end = Date.now();
       const duration = end - start;
       console.log(`Iteration ${i + 1}: ${duration}ms`);
       totalTime += duration;
    }

    console.log(`Average time: ${totalTime / iterations}ms`);
  });
});
