/**
 * Test utilities for DivTable widget tests
 */

/**
 * Creates a mock Monaco editor instance with all required methods
 */
function createMockMonaco() {
  return {
    editor: {
      create: jest.fn(() => ({
        dispose: jest.fn(),
        getValue: jest.fn(() => ''),
        setValue: jest.fn(),
        onDidChangeModelContent: jest.fn(() => ({ dispose: jest.fn() })),
        onKeyDown: jest.fn(() => ({ dispose: jest.fn() })),
        onDidPaste: jest.fn(() => ({ dispose: jest.fn() })),
        onDidFocusEditorWidget: jest.fn(() => ({ dispose: jest.fn() })),
        onDidBlurEditorWidget: jest.fn(() => ({ dispose: jest.fn() })),
        getContribution: jest.fn(() => ({
          widget: {
            isVisible: jest.fn(() => false)
          }
        })),
        getModel: jest.fn(() => ({
          getLineContent: jest.fn(() => ''),
          setValue: jest.fn(),
          getValue: jest.fn(() => ''),
          getValueInRange: jest.fn(() => ''),
          getLanguageId: jest.fn(() => 'query-language'),
          onDidChangeContent: jest.fn(() => ({ dispose: jest.fn() }))
        })),
        setPosition: jest.fn(),
        executeEdits: jest.fn(),
        trigger: jest.fn(),
        focus: jest.fn(),
        layout: jest.fn()
      })),
      createModel: jest.fn(() => ({
        dispose: jest.fn(),
        getValue: jest.fn(() => ''),
        setValue: jest.fn(),
        getLineContent: jest.fn(() => ''),
        getLanguageId: jest.fn(() => 'query-language'),
        onDidChangeContent: jest.fn(() => ({ dispose: jest.fn() }))
      })),
      getModels: jest.fn(() => [
        {
          dispose: jest.fn(),
          getValue: jest.fn(() => ''),
          setValue: jest.fn(),
          getLineContent: jest.fn(() => ''),
          getLanguageId: jest.fn(() => 'query-language'),
          onDidChangeContent: jest.fn(() => ({ dispose: jest.fn() }))
        }
      ]),
      setModelMarkers: jest.fn(),
      onDidCreateModel: jest.fn(() => ({ dispose: jest.fn() })),
      defineTheme: jest.fn()
    },
    languages: {
      register: jest.fn(),
      setLanguageConfiguration: jest.fn(),
      registerCompletionItemProvider: jest.fn(() => ({ dispose: jest.fn() })),
      setMonarchTokensProvider: jest.fn(),
      CompletionItemKind: {
        Field: 0,
        Function: 1,
        Operator: 2,
        Keyword: 3,
        Text: 4,
        Value: 5
      },
      CompletionItemInsertTextRule: {
        KeepWhitespace: 1
      },
      MarkerSeverity: {
        Error: 8,
        Warning: 4,
        Info: 2,
        Hint: 1
      }
    },
    Range: jest.fn((startLineNumber, startColumn, endLineNumber, endColumn) => ({
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn
    }))
  };
}

/**
 * Creates a test container element
 */
function createTestContainer() {
  const container = document.createElement('div');
  container.className = 'div-table-widget';
  container.style.width = '800px';
  container.style.height = '600px';
  document.body.appendChild(container);
  return container;
}

/**
 * Removes a test container element
 */
function removeTestContainer(container) {
  if (container && container.parentNode) {
    container.parentNode.removeChild(container);
  }
}

/**
 * Creates sample test data for testing
 */
function createSampleData(count = 5) {
  const data = [];
  const statuses = ['active', 'inactive', 'pending'];
  const departments = ['Engineering', 'Design', 'Marketing', 'Sales'];
  const names = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Davis'];
  
  for (let i = 0; i < count; i++) {
    data.push({
      id: i + 1,
      name: names[i] || `User ${i + 1}`,
      age: i === 4 ? null : 25 + (i * 5), // Make last user have null age
      status: statuses[i % statuses.length],
      department: departments[i % departments.length],
      salary: 50000 + (i * 10000),
      isManager: i % 2 === 0,
      tags: i === 4 ? [] : [`tag${i}`, `category${i}`], // Make last user have empty tags
      score: i === 0 ? null : 80 + (i * 5) // Make first user have null score
    });
  }
  
  return data;
}

/**
 * Creates sample column definitions for testing
 */
function createSampleColumns() {
  return [
    { field: 'id', title: 'ID', primaryKey: true, width: 60 },
    { field: 'name', title: 'Full Name', width: 150 },
    { field: 'age', title: 'Age', width: 80 },
    { field: 'status', title: 'Status', width: 100 },
    { field: 'department', title: 'Department', width: 120 },
    { field: 'salary', title: 'Salary', width: 100, format: 'currency' },
    { field: 'isManager', title: 'Manager', width: 80 },
    { field: 'tags', title: 'Tags', width: 150 },
    { field: 'score', title: 'Score', width: 80 }
  ];
}

/**
 * Creates field names configuration for query language testing
 */
function createFieldNames() {
  return {
    'id': { type: 'number', label: 'ID' },
    'name': { type: 'string', label: 'Full Name' },
    'age': { type: 'number', label: 'Age' },
    'status': { 
      type: 'string', 
      label: 'Status', 
      values: ['active', 'inactive', 'pending'] 
    },
    'department': { 
      type: 'string', 
      label: 'Department',
      values: ['Engineering', 'Design', 'Marketing', 'Sales']
    },
    'salary': { type: 'number', label: 'Salary' },
    'isManager': { type: 'boolean', label: 'Is Manager' },
    'tags': { type: 'array', label: 'Tags' },
    'score': { type: 'number', label: 'Score' }
  };
}

/**
 * Creates default DivTable options for testing
 */
function createDefaultOptions(container, overrides = {}) {
  return {
    tableWidgetElement: container,
    columns: createSampleColumns(),
    data: createSampleData(),
    showCheckboxes: true,
    multiSelect: true,
    onSelectionChange: jest.fn(),
    onRowFocus: jest.fn(),
    onRefresh: jest.fn(),
    onNextPage: jest.fn(),
    onPreviousPage: jest.fn(),
    ...overrides
  };
}

/**
 * Waits for the next tick in the event loop
 */
function nextTick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Waits for a specific amount of time
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simulates user typing in an input field
 */
function simulateTyping(element, text) {
  element.value = text;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Simulates a click event
 */
function simulateClick(element) {
  element.dispatchEvent(new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  }));
}

/**
 * Simulates a key press event
 */
function simulateKeyPress(element, key, options = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    code: key,
    bubbles: true,
    cancelable: true,
    ...options
  });
  element.dispatchEvent(event);
}

/**
 * Gets all visible rows in a table
 */
function getVisibleRows(container) {
  return container.querySelectorAll('.div-table-row:not(.div-table-row-hidden)');
}

/**
 * Gets all selected rows in a table
 */
function getSelectedRows(container) {
  return container.querySelectorAll('.div-table-row.selected');
}

/**
 * Gets the focused row in a table
 */
function getFocusedRow(container) {
  return container.querySelector('.div-table-row.focused');
}

/**
 * Asserts that an element has a specific class
 */
function expectToHaveClass(element, className) {
  expect(element.classList.contains(className)).toBe(true);
}

/**
 * Asserts that an element does not have a specific class
 */
function expectNotToHaveClass(element, className) {
  expect(element.classList.contains(className)).toBe(false);
}

/**
 * Creates a mock performance timer
 */
function createMockPerformanceTimer() {
  let startTime = 0;
  
  return {
    start() {
      startTime = performance.now();
    },
    
    end() {
      return performance.now() - startTime;
    },
    
    measure(fn) {
      const start = performance.now();
      const result = fn();
      const duration = performance.now() - start;
      return { result, duration };
    }
  };
}

/**
 * Validates that a function throws a specific error
 */
function expectToThrowError(fn, expectedMessage) {
  expect(() => fn()).toThrow(expectedMessage);
}

/**
 * Validates that a function does not throw
 */
function expectNotToThrow(fn) {
  expect(() => fn()).not.toThrow();
}

/**
 * Creates a spy on console methods and restores them after use
 */
function createConsoleSpy(method = 'error') {
  const spy = jest.spyOn(console, method).mockImplementation();
  
  return {
    spy,
    restore() {
      spy.mockRestore();
    }
  };
}

/**
 * Validates query engine results
 */
function validateQueryResults(queryEngine, query, expectedIds) {
  const results = queryEngine.filterObjects(query);
  expect(results).toEqual(expectedIds);
}

/**
 * Creates test scenarios for query testing
 */
function createQueryTestScenarios() {
  return [
    {
      name: 'simple equality',
      query: 'status = "active"',
      expectedIds: [1, 4]
    },
    {
      name: 'numeric comparison',
      query: 'age > 25',
      expectedIds: [2, 3, 4]
    },
    {
      name: 'null value',
      query: 'age = NULL',
      expectedIds: [5]
    },
    {
      name: 'boolean value',
      query: 'isManager = true',
      expectedIds: [1, 3, 5]
    },
    {
      name: 'IN operator',
      query: 'status IN ["active", "pending"]',
      expectedIds: [1, 3, 4]
    },
    {
      name: 'AND condition',
      query: 'status = "active" AND age > 25',
      expectedIds: [4]
    },
    {
      name: 'OR condition',
      query: 'status = "pending" OR isManager = true',
      expectedIds: [1, 3, 5]
    },
    {
      name: 'complex condition',
      query: '(status = "active" AND age > 25) OR department = "Marketing"',
      expectedIds: [3, 4]
    },
    {
      name: 'search mode',
      query: 'john',
      expectedIds: [1, 3]
    }
  ];
}

// Export all functions using CommonJS
module.exports = {
  createMockMonaco,
  createTestContainer,
  removeTestContainer,
  createSampleData,
  createSampleColumns,
  createFieldNames,
  createDefaultOptions,
  nextTick,
  wait,
  simulateTyping,
  simulateClick,
  simulateKeyPress,
  getVisibleRows,
  getSelectedRows,
  getFocusedRow,
  expectToHaveClass,
  expectNotToHaveClass,
  createMockPerformanceTimer,
  expectToThrowError,
  expectNotToThrow,
  createConsoleSpy,
  validateQueryResults,
  createQueryTestScenarios
};