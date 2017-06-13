import * as firebase from 'firebase';
import * as moment from 'moment';

export interface User {
   about: string;
   created_time: number;
   created: string;
   id: number;
   karma: number;  
}

export async function getUser(id: number): Promise<User | null> {
   const userRef = firebase.database().ref('v0').child('user').child(id.toString());
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
