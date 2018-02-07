import { publishServer } from '../publish/server';

const server = publishServer({ 
  port: 3003, 
  interval: '* * * * *', 
  dest: 'public/v0', 
  cwd: process.cwd()
});

const stop = server.start();

server.afterWrite(() => {
  console.log('Writing...');
});
