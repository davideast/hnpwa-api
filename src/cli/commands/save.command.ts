import { Argv } from 'yargs';
import { CliCommand } from '../command';
import { saveOfflineApi } from '../../standalone';

export const saveCommand: CliCommand = {
  command: 'save',
  describe: 'Save offline data to node_modules/hnpwa-api/offline',
  builder: (yargs: Argv) => {
    return yargs;
  },
  handler: async (argv: any) => {
    await saveOfflineApi();
  }
};
