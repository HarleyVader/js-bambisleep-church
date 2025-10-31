/**
 * Jest global setup configuration
 * Prevents test hangs and ensures proper cleanup
 */

/**
 * BambiSleep™ Church - Global Jest Configuration
 * Ensures tests clean up properly and don't hang
 */

// Set global timeout for all tests
jest.setTimeout(10000);

// Force cleanup after each test
afterEach(() => {
  // Clear all timers
  jest.clearAllTimers();
  
  // Restore real timers if mocked
  if (jest.isMockFunction(setTimeout)) {
    jest.useRealTimers();
  }
});

// Force Jest to exit after all tests complete
// This prevents hanging on unclosed handles
process.on('SIGTERM', () => {
  process.exit(0);
});


// Suppress console errors during tests (optional - comment out if debugging)
// global.console.error = jest.fn();
