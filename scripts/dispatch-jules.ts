import { JulesClient } from '@google/jules-sdk';
import { readFileSync } from 'fs';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

// Initialize the Jules client with the API key from the environment
const client = new JulesClient({
  apiKey: process.env.JULES_API_KEY,
});

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('prompt-file', {
      alias: 'p',
      type: 'string',
      description: 'Path to the prompt file',
      demandOption: true,
    })
    .option('branch', {
      alias: 'b',
      type: 'string',
      description: 'Branch to update (for failure recovery)',
    })
    .help()
    .argv;

  try {
    const promptContent = readFileSync(argv['prompt-file'], 'utf-8');

    console.log(`Dispatching Jules with prompt from: ${argv['prompt-file']}`);

    // If a branch is provided, we are in "Rescue Mode" (fix existing branch).
    // Otherwise, we are in "Loop Mode" (start new branch/phase).
    const sessionConfig = {
      prompt: promptContent,
      branch: argv.branch || undefined, // undefined will let Jules create a new branch
      // You can add more configuration options here as needed by the SDK
    };

    const session = await client.sessions.create(sessionConfig);
    console.log(`Jules session started: ${session.id}`);

  } catch (error) {
    console.error('Failed to dispatch Jules:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
