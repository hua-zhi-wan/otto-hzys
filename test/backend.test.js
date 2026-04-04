const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  maxConcurrentRequests: process.env.MAX_CONCURRENT || 50,
  totalRequests: process.env.TOTAL_REQUESTS || 100,
  timeout: process.env.TIMEOUT || 30000,
  // Valid test texts (non-empty, within length limits)
  validTestTexts: [
    'hello world',
    '大家好啊，我是说的道理',
    'test123!@#',
    '电棍otto活字印刷',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    '0123456789',
    '...，。！？；：',
    'mixed混合文本123ABC',
    'very long text that should test the system limits and see how it handles longer inputs with various combinations of chinese characters english letters numbers and punctuation marks to ensure robustness'
  ],
  // All test texts including edge cases
  allTestTexts: [
    'hello world',
    '大家好啊，我是说的道理',
    'test123!@#',
    '电棍otto活字印刷',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    '0123456789',
    '...，。！？；：',
    'mixed混合文本123ABC',
    'very long text that should test the system limits and see how it handles longer inputs with various combinations of chinese characters english letters numbers and punctuation marks to ensure robustness',
    ''
  ]
};

// Generate random test parameters
function generateRandomParams() {
  return {
    isYsdd: Math.random() > 0.5,
    useNonDdbPinyin: Math.random() > 0.5,
    isSliced: Math.random() > 0.5
  };
}

// Generate random text from valid test texts (for concurrency and parameter tests)
function getRandomValidText() {
  const texts = TEST_CONFIG.validTestTexts;
  return texts[Math.floor(Math.random() * texts.length)];
}

// Generate random text from all test texts
function getRandomText() {
  const texts = TEST_CONFIG.allTestTexts;
  return texts[Math.floor(Math.random() * texts.length)];
}

// Make a single request to the backend
async function makeRequest(text, params = {}) {
  const requestBody = JSON.stringify({
    text: text,
    ...params
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody)
    },
    timeout: TEST_CONFIG.timeout
  };

  // Parse URL
  const url = new URL(TEST_CONFIG.baseUrl + '/api/text-to-wav');
  const client = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(url, options, (res) => {
      let data = [];

      res.on('data', (chunk) => {
        data.push(chunk);
      });

      res.on('end', () => {
        const buffer = Buffer.concat(data);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            success: true,
            statusCode: res.statusCode,
            contentLength: buffer.length,
            contentType: res.headers['content-type'],
            buffer
          });
        } else {
          const errorText = buffer.toString();
          resolve({
            success: false,
            statusCode: res.statusCode,
            error: errorText,
            contentLength: buffer.length
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(requestBody);
    req.end();
  });
}

function countRiffHeaders(buffer) {
  let count = 0;
  let offset = 0;

  while (offset < buffer.length) {
    const next = buffer.indexOf('RIFF', offset, 'ascii');
    if (next === -1) break;
    count++;
    offset = next + 4;
  }

  return count;
}

// Single request test
async function testSingleRequest() {
  console.log('🧪 Testing single request...');

  const text = getRandomValidText();
  const params = generateRandomParams();

  try {
    const start = performance.now();
    const result = await makeRequest(text, params);
    const end = performance.now();

    console.log(`✅ Single request completed in ${(end - start).toFixed(2)}ms`);
    console.log(`   Text: "${text}"`);
    console.log(`   Params: ${JSON.stringify(params)}`);
    console.log(`   Status: ${result.statusCode}, Content-Length: ${result.contentLength}`);

    if (!result.success) {
      console.log(`   ❌ Error: ${result.error}`);
      return false;
    }

    // Validate WAV format
    if (result.contentType === 'audio/wav' && result.contentLength > 1000) {
      console.log('   ✅ Valid WAV response');
      return true;
    } else {
      console.log(`   ⚠️  Unexpected response: ${result.contentType}, size: ${result.contentLength}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Single request failed: ${error.message}`);
    return false;
  }
}

// Concurrency test
async function testConcurrency() {
  console.log(`\n🚀 Testing concurrency (${TEST_CONFIG.maxConcurrentRequests} concurrent requests)...`);

  const startTime = performance.now();
  let successfulRequests = 0;
  let failedRequests = 0;

  // Create batches of concurrent requests
  const batches = Math.ceil(TEST_CONFIG.totalRequests / TEST_CONFIG.maxConcurrentRequests);

  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(
      TEST_CONFIG.maxConcurrentRequests,
      TEST_CONFIG.totalRequests - (batch * TEST_CONFIG.maxConcurrentRequests)
    );

    console.log(`   Batch ${batch + 1}/${batches} (${batchSize} requests)`);

    const promises = [];
    for (let i = 0; i < batchSize; i++) {
      const text = getRandomValidText(); // Use only valid texts for concurrency test
      const params = generateRandomParams();
      promises.push(makeRequest(text, params));
    }

    try {
      const results = await Promise.allSettled(promises);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            successfulRequests++;
          } else {
            failedRequests++;
            console.log(`      Request ${index + 1} failed with status ${result.value.statusCode}`);
          }
        } else {
          failedRequests++;
          console.log(`      Request ${index + 1} threw error: ${result.reason.message}`);
        }
      });
    } catch (error) {
      console.log(`   Batch ${batch + 1} error: ${error.message}`);
      failedRequests += batchSize;
    }
  }

  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const requestsPerSecond = (TEST_CONFIG.totalRequests / totalTime) * 1000;

  console.log(`\n📊 Concurrency Test Results:`);
  console.log(`   Total Requests: ${TEST_CONFIG.totalRequests}`);
  console.log(`   Successful: ${successfulRequests}`);
  console.log(`   Failed: ${failedRequests}`);
  console.log(`   Success Rate: ${((successfulRequests / TEST_CONFIG.totalRequests) * 100).toFixed(2)}%`);
  console.log(`   Total Time: ${totalTime.toFixed(2)}ms`);
  console.log(`   Requests/Second: ${requestsPerSecond.toFixed(2)}`);

  return failedRequests === 0;
}

// Edge case tests
async function testEdgeCases() {
  console.log('\n🔍 Testing edge cases...');

  const edgeCases = [
    { text: '', description: 'Empty string' },
    { text: 'a'.repeat(1001), description: 'Text too long (1001 chars)' },
    { text: 'valid text', description: 'Valid text', params: { invalidParam: 'test' } },
    { text: null, description: 'Null text' },
    { text: 123, description: 'Number instead of string' }
  ];

  let allPassed = true;

  for (const testCase of edgeCases) {
    try {
      const result = await makeRequest(testCase.text, testCase.params || {});

      if (testCase.text === '' || testCase.text === null || typeof testCase.text !== 'string') {
        // These should fail with 400
        if (result.statusCode === 400) {
          console.log(`   ✅ ${testCase.description}: Correctly rejected`);
        } else {
          console.log(`   ❌ ${testCase.description}: Should have been rejected but got ${result.statusCode}`);
          allPassed = false;
        }
      } else if (testCase.text.length > 1000) {
        // Text too long should be rejected
        if (result.statusCode === 400) {
          console.log(`   ✅ ${testCase.description}: Correctly rejected (too long)`);
        } else {
          console.log(`   ❌ ${testCase.description}: Should have been rejected for length`);
          allPassed = false;
        }
      } else {
        // Valid cases should succeed
        if (result.success) {
          console.log(`   ✅ ${testCase.description}: Successfully processed`);
        } else {
          console.log(`   ❌ ${testCase.description}: Failed unexpectedly`);
          allPassed = false;
        }
      }
    } catch (error) {
      console.log(`   ⚠️  ${testCase.description}: Threw error - ${error.message}`);
      // For invalid inputs, throwing might be acceptable
      if (typeof testCase.text === 'string' && testCase.text.length <= 1000 && testCase.text.length > 0) {
        allPassed = false;
      }
    }
  }

  return allPassed;
}

// Parameter combination test
async function testParameterCombinations() {
  console.log('\n⚙️  Testing all parameter combinations...');

  const texts = ['hello', '你好'];
  const ysddOptions = [true, false];
  const nonDdbOptions = [true, false];
  const slicedOptions = [true, false];

  let totalTests = 0;
  let passedTests = 0;

  for (const text of texts) {
    for (const isYsdd of ysddOptions) {
      for (const useNonDdbPinyin of nonDdbOptions) {
        for (const isSliced of slicedOptions) {
          totalTests++;
          try {
            const result = await makeRequest(text, {
              isYsdd,
              useNonDdbPinyin,
              isSliced
            });

            if (result.success) {
              passedTests++;
            } else {
              console.log(`   ❌ Failed: text="${text}", ysdd=${isYsdd}, nonDdb=${useNonDdbPinyin}, sliced=${isSliced}`);
            }
          } catch (error) {
            console.log(`   ❌ Error: text="${text}", ysdd=${isYsdd}, nonDdb=${useNonDdbPinyin}, sliced=${isSliced} - ${error.message}`);
          }
        }
      }
    }
  }

  console.log(`   Passed: ${passedTests}/${totalTests} combinations`);
  return passedTests === totalTests;
}

async function testWavIntegrity() {
  console.log('\n🎵 Testing WAV integrity...');

  try {
    const result = await makeRequest('大家好啊', {
      isYsdd: false,
      useNonDdbPinyin: false,
      isSliced: false
    });

    if (!result.success) {
      console.log(`   ❌ Request failed with status ${result.statusCode}`);
      return false;
    }

    const riffCount = countRiffHeaders(result.buffer);
    if (riffCount !== 1) {
      console.log(`   ❌ Expected 1 RIFF header, got ${riffCount}`);
      return false;
    }

    console.log('   ✅ Response contains a single RIFF header');
    return true;
  } catch (error) {
    console.log(`   ❌ WAV integrity test failed: ${error.message}`);
    return false;
  }
}

async function testSingleCharPronunciation() {
  console.log('\n🔤 Testing single character pronunciation...');

  try {
    const silence = await makeRequest('_', {
      isYsdd: false,
      useNonDdbPinyin: false,
      isSliced: false
    });
    const letter = await makeRequest('A', {
      isYsdd: false,
      useNonDdbPinyin: false,
      isSliced: false
    });
    const digit = await makeRequest('1', {
      isYsdd: false,
      useNonDdbPinyin: false,
      isSliced: false
    });

    if (!silence.success || !letter.success || !digit.success) {
      console.log('   ❌ Failed to fetch one of the pronunciation samples');
      return false;
    }

    if (Buffer.compare(silence.buffer, letter.buffer) === 0) {
      console.log('   ❌ Single letter "A" is still falling back to silence');
      return false;
    }

    if (Buffer.compare(silence.buffer, digit.buffer) === 0) {
      console.log('   ❌ Single digit "1" is still falling back to silence');
      return false;
    }

    console.log('   ✅ Single letters and digits no longer fall back to silence');
    return true;
  } catch (error) {
    console.log(`   ❌ Single character pronunciation test failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('='.repeat(60));
  console.log('Backend API Test Suite');
  console.log('='.repeat(60));
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`Max Concurrent: ${TEST_CONFIG.maxConcurrentRequests}`);
  console.log(`Total Requests: ${TEST_CONFIG.totalRequests}`);
  console.log('='.repeat(60));

  let allTestsPassed = true;

  // Run individual tests
  const singleTestPassed = await testSingleRequest();
  allTestsPassed = allTestsPassed && singleTestPassed;

  const edgeTestPassed = await testEdgeCases();
  allTestsPassed = allTestsPassed && edgeTestPassed;

  const paramTestPassed = await testParameterCombinations();
  allTestsPassed = allTestsPassed && paramTestPassed;

  const wavIntegrityPassed = await testWavIntegrity();
  allTestsPassed = allTestsPassed && wavIntegrityPassed;

  const singleCharPronunciationPassed = await testSingleCharPronunciation();
  allTestsPassed = allTestsPassed && singleCharPronunciationPassed;

  const concurrencyTestPassed = await testConcurrency();
  allTestsPassed = allTestsPassed && concurrencyTestPassed;

  console.log('\n' + '='.repeat(60));
  if (allTestsPassed) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed!');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test suite failed with error:', error);
    process.exit(1);
  });
}

module.exports = {
  makeRequest,
  generateRandomParams,
  getRandomValidText,
  getRandomText,
  testSingleRequest,
  testConcurrency,
  testEdgeCases,
  testParameterCombinations,
  runTests
};
