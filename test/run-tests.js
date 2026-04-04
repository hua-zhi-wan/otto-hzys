#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Test configuration - only backend tests now
const TESTS = [
  {
    name: 'Backend API Tests',
    command: 'node',
    args: ['test/backend.test.js'],
    env: {
      ...process.env,
      TEST_URL: process.env.TEST_URL || 'http://localhost:3000',
      MAX_CONCURRENT: process.env.MAX_CONCURRENT || '20',
      TOTAL_REQUESTS: process.env.TOTAL_REQUESTS || '50'
    }
  }
];

async function runTest(testConfig) {
  console.log(`\n🚀 Running ${testConfig.name}...`);
  
  return new Promise((resolve) => {
    const testProcess = spawn(testConfig.command, testConfig.args, {
      env: testConfig.env,
      stdio: 'inherit'
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testConfig.name} passed!`);
        resolve(true);
      } else {
        console.log(`❌ ${testConfig.name} failed!`);
        resolve(false);
      }
    });
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('Running Backend Test Suite');
  console.log('='.repeat(60));
  
  // Check if backend server is running
  const backendUrl = process.env.TEST_URL || 'http://localhost:3000';
  console.log(`Backend URL: ${backendUrl}`);
  
  let allPassed = true;
  
  for (const test of TESTS) {
    const passed = await runTest(test);
    allPassed = allPassed && passed;
  }
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('🎉 All backend tests completed successfully!');
    process.exit(0);
  } else {
    console.log('⚠️  Some backend tests had issues');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}