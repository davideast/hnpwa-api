import * as fs from 'fs';
import * as path from 'path';
import { McpResource } from './resource';

export async function loadResources(directory: string): Promise<McpResource[]> {
  const files = fs.readdirSync(directory);
  const resources: McpResource[] = [];

  for (const file of files) {
    if ((file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts') && file !== 'index.ts' && file !== 'index.js') {
      const modulePath = path.join(directory, file);
      // Use dynamic import for better ESM/CJS interop
      const module = await import(modulePath);

      // Check for default export or named export implementing McpResource
      if (module.default && typeof module.default.register === 'function') {
        resources.push(module.default);
      } else {
        // Iterate exports to find one that matches
        for (const key in module) {
          if (module[key] && typeof module[key].register === 'function') {
            resources.push(module[key]);
          }
        }
      }
    }
  }
  return resources;
}
