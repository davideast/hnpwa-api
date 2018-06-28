import { buildFiles } from '../offline/build';
import api from '../api';
import { initializeApp, createExpressApp } from '../server';

const hnapi = api(initializeApp({}));

buildFiles(hnapi).then(_ => {
  console.log('done building');
  const app = createExpressApp({
    offline: true,
    firebaseAppName: 'lol'
  });
  
  app.listen(3002, () => console.log('Listening on 3002'));  
});

