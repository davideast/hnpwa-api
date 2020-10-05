const hnapi = require('hnpwa-api');
exports.api0 = hnapi.trigger({
   useCors: true,
   routerPath: '/v0',
   cdnCacheExpiry: 1200,
   browserCacheExpiry: 300,
   runWith: {
      timeoutSeconds: 300,
      memory: '1GB'
   }
});
