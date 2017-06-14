# HNPWA API

Deploy a CDN cached Hacker News API to your own Firebase Hosting Domain. All in two lines of code 😎

**Heavily** inspired/guided by [cheeaun's](https://github.com/cheeaun) [node-hnapi](https://github.com/cheeaun/node-hnapi).

## Install
```bash
npm i hnpwa-api
```

## Basic usage
Import and use in your `functions/index.js` file:
```js
const hnapi = require('hnpwa-api');
exports.api = hnapi.trigger({
   useCors: false, // defaults to false
   useCompression: true, // defaults to true
   browserCacheExpiry: 300, // in seconds (5 min is the default)
   cdnCacheExpiry: 600, // in seconds (10 min is the default)
   firebaseAppName: 'hnpwa-api', // defaults to 'hnpwa-api'
   localPort: 3002 // serves locally when passed, remove for production
});
```

## Why?
Two reasons: **latency** and **same domain**.

### Latency
This API is designed for Firebase Hosting which is backed by a global CDN. Responses are cached in edges around the globe which results in low latency.

[Latency test: CDN cached vs. in memory cache](https://latency.apex.sh/?url=https%3A%2F%2Fhnpwa-api.firebaseapp.com%2Fnews%3Fpage%3D1&compare=https%3A%2F%2Fnode-hnapi.herokuapp.com%2Fnews%3Fpage%3D1)

### Same domain
With HTTP/2 you reuse one connection per domain. This package allows you to easily deploy your own HNAPI on your own domain for one nice TCP connection.

## Setup Tutorial

#### 1. Install the Firebase CLI: 
```bash
npm i -g firebase-tools
```

#### 2. Initialize Cloud Functions for Firebase
```bash
firebase init functions
```

#### 3. Install hnpwa-api
Inside of the `functions` folder, install `hnpwa-api`:
```bash
cd functions
npm i hnpwa-api --save # not needed on npm 5 but you get what im sayin
```

#### 4. Add HNAPI endpoint
Open `functions/index.js`, and configure your HNAPI.

```js
const hnapi = require('hnpwa-api');
exports.api = hnapi.trigger({
   useCors: false, // defaults to false
   useCompression: true, // defaults to true
   browserCacheExpiry: 300, // in seconds (5 min is the default)
   cdnCacheExpiry: 600, // in seconds (10 min is the default)
   firebaseAppName: 'hnpwa-api', // defaults to hnpwa-api
   localPort: 3002 // serves locally when passed, remove for production
});
```

#### 5. Initialize Firebase Hosting
```bash
firebase init hosting
```

#### 6. Create a redirect for the API function
Open `firebase.json` and create a redirect to call out to the HNAPI:
```json
{
  "hosting": {
    "public": "public",
    "rewrites": [{
       "source": "**",
       "function": "api"
    }]
  }
}
```

#### 7. Deploy!
```bash
firebase deploy
```

That's all there is to it. Feel free to file an issue if you find a bug.


## Non-Firebase setup
Not using Cloud Functions or Firebase Hosting as your backend? No problem. This library still has you covered.

```js
const hnapi = require('hnpwa-api');
// does not include any middleware like the trigger() call above
const expressApp = hnapi.app(); // optionally provide a firebase app name
expressApp.listen(3000, () => console.log('Listening all on my own!'));
```

This returns an express app instance with the expected HN API endpoints. No middleware is attached unlike the `trigger(config)` method. 

### Why do I need a Firebase App Name if not using Firebase Hosting?
You may not use Firebase as your backed, but Hacker News does. The base HN API is backed by the Firebase Database. This library uses the Firebase Node SDK to retrieve data and coalesce it into a single UI friendly response.

### Local Setup
```bash
git clone https://github.com/davideast/hnpwa-api/
npm i
npm run build # single build of the project
npm run watch # typescript (tsc) watcher
npm run serve # local nodemon server
npm run pack # local tarball for test installations
```
