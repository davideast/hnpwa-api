# HNPWA API

An unofficial CDN cached Hacker News API deployed to your own Firebase Hosting domain. All in two lines of code 😎.

**Heavily** inspired/guided by [cheeaun's](https://github.com/cheeaun) [node-hnapi](https://github.com/cheeaun/node-hnapi).

## Why?
Two reasons: latency and same domain.

### Latency
If you're building an HNPWA you'll need to cut down on latency across the globe. This API is designed for Firebase Hosting which is backed by a global CDN. Responses are cached in edges around the globe which results in low latency.

[Latency test: CDN cached vs. in memory cache](https://latency.apex.sh/?url=https%3A%2F%2Fhnpwa-api.firebaseapp.com%2Fnews%3Fpage%3D1&compare=https%3A%2F%2Fnode-hnapi.herokuapp.com%2Fnews%3Fpage%3D1)


### Same domain
With HTTP/2 you reuse one connection per domain. If your API is on a separate domain, that's two TCP connections instead of one. This package allows you to easily deploy your own HNAPI on your own domain for one nice TCP connection.

## Install
```bash
npm i hnpwa-api
```

## Basic usage
Import and use in your `functions/index.js` file:
```js
const hnapi = require('hnpwa-api');
exports.api = hnapi.app({ useCors: true }); 
```

### Setup Tutorial

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

#### 3. Add HNAPI endpoint
Open `functions/index.js`, and configure your HNAPI.

```js
const hnapi = require('hnpwa-api');
exports.api = hnapi.app({
   useCors: false, // defaults to false
   cacheExpiry: 600 // seconds (10 minutes here)
});
```

#### 4. Initialize Firebase Hosting
```bash
firebase init hosting
```

#### 5. Create a redirect for the API function
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

#### 6. Deploy!
```bash
firebase deploy
```

That's all there is to it. Feel free to file an issue if you find a bug.

### Local Setup
```bash
git clone https://github.com/davideast/hnpwa-api/
npm i
npm run watch # typescript (tsc) watcher
npm run serve # local nodemon server
npm run pack # local tarball for test installations
```
