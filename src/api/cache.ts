/**
 * A simple Least Recently Used (LRU) cache implementation with Time-To-Live (TTL) support.
 * Since lru-cache library might not be available in all environments, this provides
 * a lightweight alternative with no external dependencies.
 */
export class SimpleLRU<T> {
  private cache = new Map<string, { value: T; expires: number }>();
  private max: number;
  private ttl: number;

  /**
   * @param max Maximum number of items to store in the cache
   * @param ttl Time-to-live in milliseconds
   */
  constructor(max = 100, ttl = 1000 * 60 * 5) {
    this.max = max;
    this.ttl = ttl;
  }

  /**
   * Retrieve an item from the cache.
   * Returns undefined if item is not found or has expired.
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end to mark as recently used
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  /**
   * Add an item to the cache.
   * If the cache is full, the least recently used item is removed.
   */
  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.max) {
      // The first key in the Map iterator is the oldest (LRU)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttl
    });
  }

  /**
   * Clear all items from the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current size of the cache.
   */
  size(): number {
    return this.cache.size;
  }
}
