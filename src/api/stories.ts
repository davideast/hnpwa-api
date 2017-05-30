import { HackerNewsItem } from '../api';
import * as firebase from 'firebase';

export async function stories(base: string, options: {}) {
  const opts = { page: 1, ...options };
  const limit = 30;
  const startIndex = (opts.page-1) * limit;
  const endIndex = startIndex + limit;
  const ref = firebase.database().ref('v0');
  const storyRef = ref.child(base).limitToFirst(limit * opts.page);
  const stories = await storyRef.once('value');
  const items: number[] = stories.val().slice(startIndex, endIndex);
  const promises = items.map(id => ref.child('item').child(id.toString()).once('value'));
  const resolves: HackerNewsItem[] = await Promise.all(promises.map(async snap => {
    const snapshot = await snap;
    return snapshot.val();
  }));
  return resolves;
}

