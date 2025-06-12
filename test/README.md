# BambiSleep Church - Test Suite

## Overview
This test suite provides comprehensive testing for the BambiSleep Church application, including unit tests, integration tests, and agent system tests.

## Test Structure
```
test/
├── unit/           # Unit tests for individual components
├── integration/    # Integration tests for API endpoints
├── agents/         # Tests for the AI agent system
└── package.json    # Test dependencies
```

## Running Tests

### Prerequisites
Install test dependencies:
```bash
cd test
npm install
```

### Test Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:agents
```

## Test Categories

### Unit Tests
- **DatabaseService**: Singleton pattern and basic operations
- **ResponseUtils**: API response standardization
- **Utility Functions**: Helper functions and utilities

### Integration Tests
- **MainController**: Content submission and view tracking
- **API Endpoints**: Full request/response cycles
- **Error Handling**: Error scenarios and edge cases

### Agent System Tests
- **MCP Server**: Model Context Protocol implementation
- **Agent Communication**: A2A messaging and coordination
- **Discovery Agent**: Content detection and analysis
- **Feed Management**: Content validation and moderation
- **Stats Management**: Analytics and knowledge base

## Coverage Goals
- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: All API endpoints covered
- **Agent Tests**: Core agent functionality verified

## Test Data
Tests use mock data and avoid dependency on actual database files. Test mode is enabled for database operations to prevent interference with production data.

## Continuous Integration
These tests are designed to run in CI/CD pipelines and provide reliable feedback on code quality and functionality.

## Contributing
When adding new features:
1. Write unit tests for new utility functions
2. Add integration tests for new API endpoints
3. Include agent tests for new AI functionality
4. Ensure tests pass before submitting changes
