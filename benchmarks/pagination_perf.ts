
// Mock Firebase for benchmark

class MockSnapshot {
  constructor(private data: any) {}
  val() { return this.data; }
  forEach(callback: (child: MockSnapshotWithKey) => void) {
    if (typeof this.data === 'object' && this.data !== null && !Array.isArray(this.data)) {
        // Sort keys numerically to simulate Firebase behavior
        const keys = Object.keys(this.data).sort((a, b) => parseInt(a) - parseInt(b));
        keys.forEach(key => {
            callback(new MockSnapshotWithKey(this.data[key], key));
        });
    } else if (Array.isArray(this.data)) {
        this.data.forEach((val, idx) => {
            callback(new MockSnapshotWithKey(val, idx.toString()));
        });
    }
  }
}

class MockSnapshotWithKey extends MockSnapshot {
  constructor(data: any, public key: string) {
    super(data);
  }
}

class MockRef {
  constructor(
      private path: string,
      private queryConstraints: string[] = [],
      public metrics: { fetchedItems: number }
  ) {}

  child(path: string) {
    return new MockRef(`${this.path}/${path}`, [...this.queryConstraints], this.metrics);
  }

  limitToFirst(n: number) {
    this.queryConstraints.push(`limitToFirst(${n})`);
    return this;
  }

  orderByKey() {
    this.queryConstraints.push('orderByKey');
    return this;
  }

  startAt(key: string) {
    this.queryConstraints.push(`startAt(${key})`);
    return this;
  }

  async once(event: string) {
    // Simulate fetching data
    // We assume 5000 items in topstories
    const totalItems = 5000;
    const allData = Array.from({length: totalItems}, (_, i) => 100000 + i);

    let result: any = null;

    if (this.path.includes('topstories')) {
        let fetchCount = totalItems;
        let start = 0;

        // Parse constraints
        const limitConstraint = this.queryConstraints.find(c => c.startsWith('limitToFirst'));
        if (limitConstraint) {
            const match = limitConstraint.match(/\d+/);
            if (match) fetchCount = parseInt(match[0]);
        }

        const startAtConstraint = this.queryConstraints.find(c => c.startsWith('startAt'));
        if (startAtConstraint) {
             const match = startAtConstraint.match(/\d+/);
             if (match) start = parseInt(match[0]);
        }

        // Count "fetched" items
        // In reality, Firebase fetches 'fetchCount' items starting from 'start'.
        this.metrics.fetchedItems += fetchCount;

        if (startAtConstraint) {
            // Return object (simulating Firebase response for startAt query)
            const subset: any = {};
            for (let i = 0; i < fetchCount; i++) {
                const index = start + i;
                if (index < totalItems) {
                    subset[index.toString()] = allData[index];
                }
            }
            result = subset;
        } else {
            // Return array (Old behavior simulation)
            result = allData.slice(0, fetchCount);
        }
    } else {
        // Just return null for anything else
        result = null;
    }

    return new MockSnapshot(result);
  }
}

const metricsOld = { fetchedItems: 0 };
const metricsNew = { fetchedItems: 0 };

// Create distinct mocks to avoid shared state if any (though state is in metrics objects)
const mockAppOld = {
  database: () => ({
    ref: (path: string) => new MockRef(path, [], metricsOld)
  })
};

const mockAppNew = {
  database: () => ({
    ref: (path: string) => new MockRef(path, [], metricsNew)
  })
};

// Implementations
async function storiesOld(topic: string, options: { page: number }, app: any) {
  const opts = { page: 1, ...options };
  const limit = 30;
  const startIndex = (opts.page-1) * limit;
  const endIndex = startIndex + limit;
  const ref = app.database().ref('v0');
  const storyRef = ref.child(topic).limitToFirst(limit * opts.page);
  const stories = await storyRef.once('value');
  const items: number[] = stories.val().slice(startIndex, endIndex);
  return items;
}

async function storiesNew(topic: string, options: { page: number }, app: any) {
  const opts = { page: 1, ...options };
  const limit = 30;
  const startIndex = (opts.page-1) * limit;
  const ref = app.database().ref('v0');
  const storyRef = ref.child(topic).orderByKey().startAt(startIndex.toString()).limitToFirst(limit);
  const stories = await storyRef.once('value');
  const items: number[] = [];
  stories.forEach((child: any) => {
    items.push(child.val());
  });
  return items;
}

// Benchmark
async function runBenchmark() {
    console.log("=== Pagination Benchmark (Page 10) ===");

    // Page 10
    const page = 10;

    // Old
    metricsOld.fetchedItems = 0;
    await storiesOld('topstories', { page }, mockAppOld);
    console.log(`[Old] Page ${page}: Fetched ${metricsOld.fetchedItems} items from DB.`);

    // New
    metricsNew.fetchedItems = 0;
    await storiesNew('topstories', { page }, mockAppNew);
    console.log(`[New] Page ${page}: Fetched ${metricsNew.fetchedItems} items from DB.`);

    console.log("\n=== Pagination Benchmark (Page 50) ===");
    const page50 = 50;
     // Old
    metricsOld.fetchedItems = 0;
    await storiesOld('topstories', { page: page50 }, mockAppOld);
    console.log(`[Old] Page ${page50}: Fetched ${metricsOld.fetchedItems} items from DB.`);

    // New
    metricsNew.fetchedItems = 0;
    await storiesNew('topstories', { page: page50 }, mockAppNew);
    console.log(`[New] Page ${page50}: Fetched ${metricsNew.fetchedItems} items from DB.`);
}

runBenchmark().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
