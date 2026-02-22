import { Argv } from 'yargs';

export interface CliCommand {
  command: string;
  describe: string;
  builder: (yargs: Argv) => Argv;
  handler: (argv: any) => void | Promise<void>;
}
