const hnapi = require('hnpwa-api');

exports.api0 = hnapi.trigger({
   useCors: true,
   routerPath: '/api/v0',
   staleWhileRevalidate: 86400,
   cdnCacheExpiry: 1200,
   browserCacheExpiry: 300
});
