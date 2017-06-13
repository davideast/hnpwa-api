import { HackerNewsItem, HackerNewsItemTree } from '../api';
import * as firebase from 'firebase';

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
