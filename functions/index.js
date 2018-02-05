const hnapi = require('hnpwa-api');

exports.api0 = hnapi.trigger({
   useCors: true,
   routerPath: '/api/v0',
   staleWhileRevalidate: 30,
   cdnCacheExpiry: 30,
   browserCacheExpiry: 0
});
