
import { describe, it } from 'vitest';
import { stories } from '../src/api/stories';
import { HackerNewsItem } from '../src/api/interfaces';
import { performance } from 'perf_hooks';

// Mock types
class MockSnapshot {
  constructor(private _val: any) {}
  val() { return this._val; }
}

class MockRef {
  constructor(private path: string, private db: any) {}

  child(path: string) {
    return new MockRef(`${this.path}/${path}`, this.db);
  }

  limitToFirst(n: number) {
    return this;
  }

  async once(event: string) {
    if (this.path.startsWith('v0/topstories')) {
      // Return 50 IDs
      return new MockSnapshot(Array.from({length: 50}, (_, i) => i + 1));
    }
    if (this.path.includes('/item/')) {
        const id = parseInt(this.path.split('/').pop() || '0');
        const item: HackerNewsItem = {
            id,
            type: 'story',
            by: 'user' + id,
            time: 1600000000,
            text: 'text',
            score: 100,
            title: 'Story Title ' + id,
            descendants: 10,
            url: 'http://example.com/' + id
        };
        return new MockSnapshot(item);
    }
    return new MockSnapshot(null);
  }
}

const mockApp: any = {
  database: () => ({
    ref: (path: string) => new MockRef(path, mockApp)
  })
};

describe('Performance Benchmark', () => {
    it('should measure execution time of stories()', async () => {
        // Warmup
        console.log('Warming up...');
        for(let i=0; i<50; i++) {
            await stories('topstories', { page: 1 }, mockApp);
        }

        console.log('Running benchmark...');
        const start = performance.now();
        const iterations = 1000;

        for(let i=0; i<iterations; i++) {
            await stories('topstories', { page: 1 }, mockApp);
        }

        const end = performance.now();
        const totalTime = end - start;
        const avgTime = totalTime / iterations;

        console.log(`Total time for ${iterations} iterations: ${totalTime.toFixed(2)}ms`);
        console.log(`Average time per iteration: ${avgTime.toFixed(4)}ms`);
    });
});
