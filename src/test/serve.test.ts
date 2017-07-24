import * as hnapi from '../';

const app = hnapi.trigger({ 
   localPort: 3002,
   useCors: true,
   cdnCacheExpiry: 900,
   offline: true
});
