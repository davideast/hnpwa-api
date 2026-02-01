import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// This script simulates gathering CI logs and creating a failure report.
// In a real scenario, you might parse JSON reports from Jest/Vitest or JUnit XML.

async function main() {
  const logFiles = [
    'test-output.log',
    'build-output.log'
  ];

  let report = '# CI Failure Report\n\n';
  let hasFailures = false;

  for (const file of logFiles) {
    const logPath = resolve(process.cwd(), file);
    if (existsSync(logPath)) {
      const content = readFileSync(logPath, 'utf-8');
      // Simple heuristic: check for "FAIL" or "Error"
      if (content.includes('FAIL') || content.includes('Error:')) {
        hasFailures = true;
        report += `## Log: ${file}\n\`\`\`\n${content.slice(-2000)}\n\`\`\`\n\n(Truncated to last 2000 chars)\n`;
      }
    }
  }

  if (!hasFailures) {
    // If no specific log files found, check for generic error signals or just output "Unknown Failure"
    report += "Could not find specific test failure logs. Please check the CI console output manually.";
  }

  report += "\n\n## Instructions for Jules\n";
  report += "Please analyze the above errors and fix the code in the current branch. Run tests locally to verify before submitting.";

  console.log(report);
}

if (require.main === module) {
  main();
}
