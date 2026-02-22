import { Argv } from 'yargs';
import { CliCommand } from '../command';
import { serve } from '../../standalone';

export const serveCommand: CliCommand = {
  command: 'serve',
  describe: 'Start the API server',
  builder: (yargs: Argv) => {
    return yargs
      .option('port', {
        alias: 'p',
        type: 'number',
        default: 3002,
        describe: 'Port to run the server on'
      })
      .option('offline', {
        alias: 'o',
        type: 'boolean',
        default: false,
        describe: 'Serve from offline cache'
      })
      .option('routerPath', {
        alias: 'r',
        type: 'string',
        default: '',
        describe: 'Path prefix for the router'
      });
  },
  handler: (argv: any) => {
    serve({
      port: argv.port,
      offline: argv.offline,
      routerPath: argv.routerPath
    });
  }
};
