#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test runner configuration
const config = {
  testDir: path.join(__dirname, '../server/src/__tests__'),
  reportsDir: path.join(__dirname, '../test-reports'),
  coverageDir: path.join(__dirname, '../coverage'),
};

// Create reports directory if it doesn't exist
if (!fs.existsSync(config.reportsDir)) {
  fs.mkdirSync(config.reportsDir, { recursive: true });
}

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf8',
      ...options,
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, output: error.message };
  }
}

function generateReport(results) {
  const reportPath = path.join(config.reportsDir, 'test-summary.json');
  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`Test summary saved to: ${reportPath}`, 'cyan');
}

// Test suites
const testSuites = [
  {
    name: 'Unit Tests',
    command: 'cd server && npm run test:unit',
    description: 'Run unit tests for individual components',
  },
  {
    name: 'Integration Tests',
    command: 'cd server && npm run test:integration',
    description: 'Run integration tests for component interactions',
  },
  {
    name: 'API Tests',
    command: 'cd server && npm run test:api',
    description: 'Run API endpoint tests',
  },
  {
    name: 'Performance Tests',
    command: 'cd server && npm run test:performance',
    description: 'Run performance and load tests',
  },
  {
    name: 'WebSocket Tests',
    command: 'cd server && npm run test:socket',
    description: 'Run WebSocket communication tests',
  },
  {
    name: 'Security Tests',
    command: 'cd server && npm run test:security',
    description: 'Run security and authentication tests',
  },
];

// Main function
async function main() {
  const args = process.argv.slice(2);
  let suiteName = args[0];
  let coverage = args.includes('--coverage');
  let watch = args.includes('--watch');
  let verbose = args.includes('--verbose');

  log('🚀 AutoMedia Test Runner', 'bright');
  log('=====================================', 'bright');

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  if (args.includes('--list')) {
    showTestSuites();
    return;
  }

  // Run specific suite or all suites
  if (suiteName) {
    await runTestSuite(suiteName, { coverage, watch, verbose });
  } else {
    await runAllTestSuites({ coverage, watch, verbose });
  }
}

function showHelp() {
  log('Usage: npm run test-runner [suite-name] [options]', 'yellow');
  log('');
  log('Options:', 'yellow');
  log('  --coverage    Run tests with coverage report', 'cyan');
  log('  --watch       Run tests in watch mode', 'cyan');
  log('  --verbose     Show detailed test output', 'cyan');
  log('  --list        List available test suites', 'cyan');
  log('  --help        Show this help message', 'cyan');
  log('');
  log('Available test suites:', 'yellow');
  showTestSuites();
  log('');
  log('Examples:', 'yellow');
  log('  npm run test-runner                      # Run all test suites', 'cyan');
  log('  npm run test-runner unit --coverage       # Run unit tests with coverage', 'cyan');
  log('  npm run test-runner integration --watch   # Run integration tests in watch mode', 'cyan');
}

function showTestSuites() {
  testSuites.forEach((suite, index) => {
    log(`${index + 1}. ${suite.name}`, 'green');
    log(`   ${suite.description}`, 'cyan');
  });
}

async function runTestSuite(suiteName, options = {}) {
  const suite = testSuites.find(s =>
    s.name.toLowerCase().includes(suiteName.toLowerCase())
  );

  if (!suite) {
    log(`❌ Test suite '${suiteName}' not found`, 'red');
    log('Use --list to see available suites', 'yellow');
    return;
  }

  log(`🧪 Running ${suite.name}...`, 'blue');
  log(`   ${suite.description}`, 'cyan');

  let command = suite.command;
  if (options.coverage) command += ' --coverage';
  if (options.watch) command += ' --watch';
  if (options.verbose) command += ' --verbose';

  const result = runCommand(command, { timeout: 300000 }); // 5 minutes timeout

  if (result.success) {
    log(`✅ ${suite.name} completed successfully`, 'green');
    if (options.verbose) {
      log(result.output, 'cyan');
    }
  } else {
    log(`❌ ${suite.name} failed`, 'red');
    if (options.verbose) {
      log(result.output, 'yellow');
    }
  }

  return { suite: suite.name, success: result.success, output: result.output };
}

async function runAllTestSuites(options = {}) {
  const results = [];
  const startTime = Date.now();

  log('🔥 Running all test suites...', 'magenta');

  for (const suite of testSuites) {
    const result = await runTestSuite(suite.name, options);
    results.push(result);
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Generate summary report
  log('', 'reset');
  log('📊 Test Summary', 'bright');
  log('=================', 'bright');
  log(`Total Duration: ${formatDuration(duration)}`, 'cyan');
  log(`Total Suites: ${results.length}`, 'cyan');
  log(`Passed: ${results.filter(r => r.success).length}`, 'green');
  log(`Failed: ${results.filter(r => !r.success).length}`, 'red');

  if (results.some(r => !r.success)) {
    log('', 'reset');
    log('❌ Some test suites failed', 'red');
    log('Check the output above for details', 'yellow');
    process.exit(1);
  } else {
    log('', 'reset');
    log('🎉 All test suites passed!', 'green');
    log('Great job! 🚀', 'bright');
  }

  // Generate report
  generateReport(results);
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  log(`❌ Uncaught Exception: ${error.message}`, 'red');
  log(error.stack, 'yellow');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled Rejection at: ${promise}`, 'red');
  log(`Reason: ${reason}`, 'yellow');
  process.exit(1);
});

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  runTestSuite,
  runAllTestSuites,
  testSuites,
};