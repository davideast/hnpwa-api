import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleLRU } from '../src/api/cache';

describe('SimpleLRU', () => {
  let originalNow: () => number;
  let mockNow: number;

  beforeEach(() => {
    originalNow = Date.now;
    mockNow = 1000000;
    Date.now = () => mockNow;
  });

  afterEach(() => {
    Date.now = originalNow;
  });

  function advanceTime(ms: number) {
    mockNow += ms;
  }

  it('should set and get values', () => {
    const cache = new SimpleLRU<string>(10, 1000);
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
    expect(cache.size()).toBe(1);
  });

  it('should return undefined for missing keys', () => {
    const cache = new SimpleLRU<string>(10, 1000);
    expect(cache.get('missing')).toBeUndefined();
  });

  it('should evict items when max size is exceeded (LRU)', () => {
    const cache = new SimpleLRU<string>(2, 1000);
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    // key1 should be evicted as it was the first one added and not accessed
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBe('value2');
    expect(cache.get('key3')).toBe('value3');
    expect(cache.size()).toBe(2);
  });

  it('should update LRU order on get', () => {
    const cache = new SimpleLRU<string>(2, 1000);
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    // Access key1, making key2 the least recently used
    cache.get('key1');

    // Adding key3 should now evict key2
    cache.set('key3', 'value3');

    expect(cache.get('key2')).toBeUndefined();
    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key3')).toBe('value3');
  });

  it('should expire items after TTL', () => {
    const cache = new SimpleLRU<string>(10, 1000);
    cache.set('key1', 'value1');

    // Advance time past TTL
    advanceTime(1001);

    expect(cache.get('key1')).toBeUndefined();
    // Cache size should decrease after get() deletes the expired item
    expect(cache.size()).toBe(0);
  });

  it('should overwrite existing keys and update their TTL and position', () => {
    const cache = new SimpleLRU<string>(2, 1000);
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    advanceTime(500);

    // Overwrite key1
    cache.set('key1', 'value1-updated');

    advanceTime(600);

    // Total time for key2 is 1100ms, which is > 1000ms TTL
    expect(cache.get('key2')).toBeUndefined();

    // key1 was reset at 500ms, so it should still be valid at 1100ms (expires at 1500ms)
    expect(cache.get('key1')).toBe('value1-updated');
  });

  it('should clear the cache', () => {
    const cache = new SimpleLRU<string>(10, 1000);
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    cache.clear();

    expect(cache.size()).toBe(0);
    expect(cache.get('key1')).toBeUndefined();
  });
});
