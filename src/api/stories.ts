import { HackerNewsItem, Story, story } from '../api';
// @ts-ignore
import firebase from 'firebase/compat/app';

/**
 * Retrieve a set of "stories" based on the HN topic ("topstories", 
 * "newstories", etc...). 
 * @param topic - topstories, newstories, askstories, jobstories, etc...
 * @param options - { page: number }
 */
export async function stories(topic: string, options: {}, firebaseApp: firebase.app.App) {
  const opts = { page: 1, ...options };
  const limit = 30;
  const startIndex = (opts.page-1) * limit;
  const endIndex = startIndex + limit;
  const ref = firebaseApp.database().ref('v0');
  const storyRef = ref.child(topic).limitToFirst(limit * opts.page);
  const stories = await storyRef.once('value');
  const items: number[] = stories.val().slice(startIndex, endIndex);
  const promises = items.map(id => ref.child('item').child(id.toString()).once('value'));
  const resolves: Story[] = await Promise.all(promises.map(async snap => {
    const snapshot = await snap;
    const item = snapshot.val() as HackerNewsItem;
    return story(item);
  }));
  return resolves;
}
