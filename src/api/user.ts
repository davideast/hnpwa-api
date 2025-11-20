// @ts-ignore
import firebase from 'firebase/compat/app';
import moment from 'moment';
import { User } from './';

/**
 * Get a user by their id and transform into a UI friendly JSON object.
 * @param id - The user's id
 */
export async function getUser(id: number, firebaseApp: firebase.app.App): Promise<User | null> {
   const userRef = firebaseApp.database().ref('v0').child('user').child(id.toString());
   const snapshot = await userRef.once('value');
   const user = snapshot.val();
   if (user && user.id) {
      return {
         about: user.about,
         created_time: user.created,
         created: moment(user.created * 1000).fromNow(),
         id: user.id,
         karma: user.karma
      };
   }
   return null;
}
