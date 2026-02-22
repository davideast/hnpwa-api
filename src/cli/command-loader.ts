import * as fs from 'fs';
import * as path from 'path';
import { CliCommand } from './command';

export function loadCommands(directory: string): CliCommand[] {
  // If directory doesn't exist, return empty
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = fs.readdirSync(directory);
  const commands: CliCommand[] = [];

  for (const file of files) {
    if ((file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts') && file !== 'index.ts' && file !== 'index.js') {
      const modulePath = path.join(directory, file);
      // Use require for CJS
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const module = require(modulePath);

      // Check for default export or named export implementing CliCommand
      // Check if it has 'command' and 'handler' properties
      if (module.default && module.default.command && typeof module.default.handler === 'function') {
        commands.push(module.default);
      } else {
        // Iterate exports to find one that matches
        for (const key in module) {
          if (module[key] && module[key].command && typeof module[key].handler === 'function') {
            commands.push(module[key]);
          }
        }
      }
    }
  }
  return commands;
}
