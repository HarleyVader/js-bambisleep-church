// Test setup file
const path = require('path');
const fs = require('fs');

// Mock console methods to reduce noise during testing
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  // Mock console.log to reduce noise unless in debug mode
  if (!process.env.DEBUG_TESTS) {
    console.log = jest.fn();
    console.error = jest.fn();
  }
});

afterEach(() => {
  // Restore console methods
  if (!process.env.DEBUG_TESTS) {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  }
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  // Create temporary test data files
  createTestDataFile: (filename, data) => {
    const testDataPath = path.join(__dirname, '../src/data/test');
    if (!fs.existsSync(testDataPath)) {
      fs.mkdirSync(testDataPath, { recursive: true });
    }
    const filePath = path.join(testDataPath, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return filePath;
  },
  
  // Clean up test data files
  cleanupTestData: () => {
    const testDataPath = path.join(__dirname, '../src/data/test');
    if (fs.existsSync(testDataPath)) {
      fs.rmSync(testDataPath, { recursive: true, force: true });
    }
  },
  
  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Clean up after all tests
afterAll(() => {
  global.testUtils.cleanupTestData();
});
