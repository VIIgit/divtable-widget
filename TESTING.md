# Unit Tests for DivTable Widget

This document provides a comprehensive overview of the unit tests that have been added to the DivTable widget project.

## Overview

The test suite consists of 157 tests covering all major functionality of the DivTable widget, including:

- QueryEngine functionality
- DivTable main class
- Query language features
- Integration testing
- Test utilities

## Test Structure

### Test Files

1. **`tests/query-engine.test.js`** - Tests for the QueryEngine class
2. **`tests/divtable.test.js`** - Tests for the main DivTable class
3. **`tests/query-language.test.js`** - Tests for query language functionality
4. **`tests/integration.test.js`** - Integration tests
5. **`tests/utilities.test.js`** - Tests using utility functions
6. **`tests/test-utils.js`** - Reusable test utilities and helpers
7. **`tests/setup.js`** - Test environment setup

### Test Configuration

- **Jest** as the testing framework
- **jsdom** environment for DOM testing
- **@testing-library/jest-dom** for enhanced assertions
- Comprehensive mocking for Monaco Editor

## Test Coverage

### QueryEngine Tests (73 tests)

- **Constructor**: Initialization with default and custom parameters
- **Data Management**: Setting and updating objects
- **Search Functionality**: Text-based searching with multiple terms
- **Query Parsing**: Parsing various query conditions (=, !=, >, <, IN, etc.)
- **Condition Application**: Testing operators with different data types
- **Expression Evaluation**: Complex queries with AND/OR logic
- **Error Handling**: Invalid queries and edge cases

### DivTable Tests (42 tests)

- **Constructor**: Initialization with various options
- **Configuration**: Checkboxes, multi-select, virtual scrolling
- **Data Management**: Handling empty data, null values
- **Selection**: Row selection and focus management
- **Virtual Scrolling**: Page size, loading thresholds
- **Callbacks**: Event handlers and pagination
- **Loading States**: Different loading scenarios

### Query Language Tests (20 tests)

- **Language Setup**: Monaco editor integration
- **Completion Provider**: Auto-completion functionality
- **Validation**: Query syntax validation
- **Field Names**: Dynamic field configuration
- **Editor Integration**: Monaco editor features

### Integration Tests (15 tests)

- **Complete Widget**: End-to-end functionality
- **Query Integration**: Full query workflow
- **Performance**: Large dataset handling
- **Edge Cases**: Error scenarios and boundary conditions

### Utility Tests (7 tests)

- **Test Helpers**: Utility function validation
- **Mock Creation**: Monaco editor mocking
- **Data Generation**: Sample data creation
- **Configuration**: Default options setup

## Key Features Tested

### Query Engine Capabilities

- Simple text search across all fields
- Structured queries with operators (=, !=, >, <, >=, <=)
- IN operator for list matching
- Boolean logic (AND, OR) with parentheses
- Null value handling
- Array field support
- Case-insensitive searching
- Complex nested expressions

### DivTable Widget Features

- Table initialization and configuration
- Data binding and updates
- Row selection (single and multiple)
- Virtual scrolling for large datasets
- Loading states and placeholders
- Refresh functionality
- Auto-fetch capabilities
- Custom column definitions
- Primary key handling

### Query Language Features

- Monaco Editor integration
- Syntax highlighting and validation
- Auto-completion for field names and operators
- Real-time error checking
- Dynamic field name updates
- Custom language configuration

## Test Utilities

The `test-utils.js` file provides comprehensive utilities for:

- Creating mock Monaco editor instances
- Generating sample test data and columns
- Setting up test containers and DOM elements
- Performance testing helpers
- Query result validation
- Event simulation utilities

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Examples

### Basic QueryEngine Test

```javascript
it('should filter data using simple search', () => {
  const results = queryEngine.filterObjects('john');
  expect(results).toEqual([1, 3]); // John Doe, Bob Johnson
});
```

### Complex Query Test

```javascript
it('should handle complex queries with AND/OR', () => {
  const results = queryEngine.filterObjects('status = "active" AND age > 30');
  expect(results).toEqual([3]); // Bob Johnson (35)
});
```

### DivTable Configuration Test

```javascript
it('should create table with virtual scrolling', () => {
  const options = {
    tableWidgetElement: container,
    columns: testColumns,
    data: testData,
    virtualScrolling: true,
    pageSize: 50
  };
  divTable = new DivTable(mockMonaco, options);
  expect(divTable.virtualScrolling).toBe(true);
  expect(divTable.pageSize).toBe(50);
});
```

## Mock Configuration

The test setup includes comprehensive mocking for:

- Monaco Editor API
- DOM manipulation methods
- Browser APIs (ResizeObserver, IntersectionObserver)
- CSS imports
- Animation frame handling

## Error Handling Tests

The test suite includes comprehensive error handling for:

- Invalid query syntax
- Missing required parameters
- Null/undefined data scenarios
- Boundary condition testing
- Performance edge cases

## Performance Considerations

Tests include performance validation for:

- Large dataset handling (1000+ records)
- Complex query execution timing
- Widget initialization performance
- Memory usage patterns

## Future Enhancements

Potential areas for test expansion:

- End-to-end browser testing
- Visual regression testing
- Accessibility testing
- Cross-browser compatibility
- Mobile device testing
- Performance benchmarking
- Load testing scenarios

## Contributing to Tests

When adding new features:

1. Add corresponding unit tests
2. Update integration tests if needed
3. Ensure test coverage remains high
4. Follow existing test patterns
5. Add performance tests for new features
6. Update this documentation

The test suite provides a solid foundation for maintaining code quality and ensuring the DivTable widget continues to function correctly as it evolves.
