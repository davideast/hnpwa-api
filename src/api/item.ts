import { HackerNewsItem, HackerNewsItemTree } from '../api';
import * as firebase from 'firebase';

/**
 * Retrieves an "item" and its comment tree by an id. The building block of
 * the HN API is the "item". Everything is an item. A story, job, comments, and
 * nearly everything else. Each "item" has a list of "kids" which are the comments
 * for stories and the subcomments for comments. 
 * 
 * This method retrieves the individual item and then fetches each "kid" by its
 * id. The kids array is stripped out to save on bytes across the wire.
 * @param id 
 */
export async function getItemAndComments(id: number): Promise<HackerNewsItemTree | null> {
   const itemRef = firebase.database().ref('v0/item').child(id.toString());
   const snap: firebase.database.DataSnapshot = await itemRef.once('value');
   const item = snap.val() as HackerNewsItem;
   if(!item) { return null; }

   let comments: (HackerNewsItemTree | null)[] = [];
   if (item.kids && item.kids.length) {
      comments = await Promise.all(item.kids.map((kid: any) => getItemAndComments(kid)));
   }

   // strip kids from response
   delete item.kids;
   
   // TODO(davideast): Poll parts
   delete item.parts;

   return {
      item,
      comments  
   };
}
