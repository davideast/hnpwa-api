import { HackerNewsItem, Story, story } from './interfaces';
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
  const ref = firebaseApp.database().ref('v0');
  const storyRef = ref.child(topic).orderByKey().startAt(startIndex.toString()).limitToFirst(limit);
  const stories = await storyRef.once('value');
  const items: number[] = [];
  stories.forEach((child) => {
    items.push(child.val());
  });
  const resolves: Story[] = (await Promise.all(items.map(async id => {
    const snapshot = await ref.child('item').child(id.toString()).once('value');
    const item = snapshot.val() as HackerNewsItem;
    return item ? story(item) : null;
  }))).filter((item): item is Story => item !== null);
  return resolves;
}
