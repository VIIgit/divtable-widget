const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const {
  createMockMonaco,
  createTestContainer,
  removeTestContainer,
  createSampleData,
  createSampleColumns,
  createFieldNames,
  createDefaultOptions,
  validateQueryResults,
  createQueryTestScenarios,
  nextTick,
  expectToThrowError,
  expectNotToThrow
} = require('./test-utils.js');

// Import source files
const fs = require('fs');
const path = require('path');

// Load the source files
const querySource = fs.readFileSync(path.join(__dirname, '../src/query.js'), 'utf8');
const divTableSource = fs.readFileSync(path.join(__dirname, '../src/div-table.js'), 'utf8');

// Execute the source code to make classes available
eval(querySource);
eval(divTableSource);

describe('DivTable with Test Utilities', () => {
  let container;
  let divTable;
  let mockMonaco;

  beforeEach(() => {
    container = createTestContainer();
    mockMonaco = createMockMonaco();
    global.monaco = mockMonaco;
  });

  afterEach(() => {
    if (divTable && typeof divTable.dispose === 'function') {
      divTable.dispose();
    }
    removeTestContainer(container);
    jest.clearAllMocks();
  });

  describe('Using test utilities for setup', () => {
    it('should create table with default sample data', () => {
      const options = createDefaultOptions(container);
      divTable = new DivTable(mockMonaco, options);

      expect(divTable.data).toHaveLength(5);
      expect(divTable.columns).toHaveLength(9);
      expect(divTable.primaryKeyField).toBe('id');
    });

    it('should create table with custom data size', () => {
      const customData = createSampleData(10);
      const options = createDefaultOptions(container, { data: customData });
      divTable = new DivTable(mockMonaco, options);

      expect(divTable.data).toHaveLength(10);
      expect(divTable.data[9].name).toBe('User 10');
    });

    it('should handle custom columns configuration', () => {
      const customColumns = createSampleColumns().slice(0, 4); // Only first 4 columns
      const options = createDefaultOptions(container, { columns: customColumns });
      divTable = new DivTable(mockMonaco, options);

      expect(divTable.columns).toHaveLength(4);
      expect(divTable.columns[0].field).toBe('id');
      expect(divTable.columns[3].field).toBe('status');
    });
  });

  describe('Query testing with utilities', () => {
    beforeEach(() => {
      const options = createDefaultOptions(container);
      divTable = new DivTable(mockMonaco, options);
    });

    it('should run all predefined query scenarios', () => {
      const scenarios = createQueryTestScenarios();
      
      scenarios.forEach(scenario => {
        try {
          validateQueryResults(divTable.queryEngine, scenario.query, scenario.expectedIds);
        } catch (error) {
          throw new Error(`Failed scenario "${scenario.name}": ${error.message}`);
        }
      });
    });

    it('should handle individual query scenarios', () => {
      // Test equality queries
      validateQueryResults(divTable.queryEngine, 'name = "John Doe"', [1]);
      
      // Test numeric comparisons
      validateQueryResults(divTable.queryEngine, 'salary >= 60000', [2, 3, 4, 5]);
      
      // Test complex queries
      validateQueryResults(
        divTable.queryEngine, 
        'department = "Engineering" AND isManager = true', 
        [1, 5]
      );
    });

    it('should test error scenarios', () => {
      expectToThrowError(
        () => divTable.queryEngine.filterObjects('field AND'),
        'Query error'
      );

      expectNotToThrow(
        () => divTable.queryEngine.filterObjects('name = "Valid Query"')
      );
    });
  });

  describe('Field names configuration testing', () => {
    it('should create query language with field names', () => {
      const fieldNames = createFieldNames();
      
      expectNotToThrow(() => {
        setupQueryLanguage(mockMonaco, { fieldNames });
      });

      expect(mockMonaco.languages.register).toHaveBeenCalled();
      expect(mockMonaco.languages.registerCompletionItemProvider).toHaveBeenCalled();
    });

    it('should handle different field types', () => {
      const fieldNames = createFieldNames();
      
      // Check that we have different field types
      expect(fieldNames.id.type).toBe('number');
      expect(fieldNames.name.type).toBe('string');
      expect(fieldNames.isManager.type).toBe('boolean');
      expect(fieldNames.status.values).toEqual(['active', 'inactive', 'pending']);
    });
  });

  describe('Performance testing with utilities', () => {
    it('should handle large datasets efficiently', async () => {
      const largeData = createSampleData(1000);
      const options = createDefaultOptions(container, {
        data: largeData,
        virtualScrolling: true,
        pageSize: 50
      });

      const startTime = performance.now();
      divTable = new DivTable(mockMonaco, options);
      await nextTick(); // Allow for async operations
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10000); // Should be reasonably fast
      expect(divTable.data).toHaveLength(1000);
    });

    it('should execute queries efficiently on large datasets', () => {
      const largeData = createSampleData(500);
      const options = createDefaultOptions(container, { data: largeData });
      divTable = new DivTable(mockMonaco, options);

      const startTime = performance.now();
      const results = divTable.queryEngine.filterObjects('status = "active"');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Virtual scrolling with utilities', () => {
    it('should configure virtual scrolling correctly', () => {
      const options = createDefaultOptions(container, {
        virtualScrolling: true,
        pageSize: 25,
        totalRecords: 1000
      });

      divTable = new DivTable(mockMonaco, options);

      expect(divTable.virtualScrolling).toBe(true);
      expect(divTable.pageSize).toBe(25);
      expect(divTable.totalRecords).toBe(1000);
      expect(divTable.loadingThreshold).toBe(20); // 80% of pageSize
    });

    it('should handle virtual scrolling state management', () => {
      const options = createDefaultOptions(container, {
        virtualScrolling: true,
        pageSize: 10
      });

      divTable = new DivTable(mockMonaco, options);

      // Test initial state
      expect(divTable.currentPage).toBe(0);
      expect(divTable.isLoading).toBe(false);
      expect(divTable.hasMoreData).toBe(true);
      expect(divTable.visibleStartIndex).toBe(0);
      expect(divTable.visibleEndIndex).toBe(10);
    });
  });

  describe('Selection and callbacks with utilities', () => {
    it('should handle callback functions', () => {
      const callbacks = {
        onSelectionChange: jest.fn(),
        onRowFocus: jest.fn(),
        onRefresh: jest.fn(),
        onNextPage: jest.fn(),
        onPreviousPage: jest.fn()
      };

      const options = createDefaultOptions(container, callbacks);
      divTable = new DivTable(mockMonaco, options);

      // Verify callbacks are properly assigned
      expect(divTable.onSelectionChange).toBe(callbacks.onSelectionChange);
      expect(divTable.onRowFocus).toBe(callbacks.onRowFocus);
      expect(divTable.onRefresh).toBe(callbacks.onRefresh);
      expect(divTable.onNextPage).toBe(callbacks.onNextPage);
      expect(divTable.onPreviousPage).toBe(callbacks.onPreviousPage);
    });

    it('should manage selection state properly', () => {
      const options = createDefaultOptions(container);
      divTable = new DivTable(mockMonaco, options);

      // Test selection operations
      divTable.selectedRows.add(1);
      divTable.selectedRows.add(3);
      divTable.selectedRows.add(5);

      expect(divTable.selectedRows.size).toBe(3);
      expect(divTable.selectedRows.has(1)).toBe(true);
      expect(divTable.selectedRows.has(2)).toBe(false);
      expect(divTable.selectedRows.has(3)).toBe(true);

      // Test clearing selection
      divTable.selectedRows.clear();
      expect(divTable.selectedRows.size).toBe(0);
    });
  });

  describe('Configuration options with utilities', () => {
    it('should handle all configuration options', () => {
      const options = createDefaultOptions(container, {
        showCheckboxes: false,
        multiSelect: false,
        showLoadingPlaceholder: false,
        showRefreshButton: true,
        showAutoFetchButton: true,
        autoFetchDelay: 300,
        virtualScrolling: true,
        pageSize: 20,
        loadingThreshold: 15,
        scrollThreshold: 0.9
      });

      divTable = new DivTable(mockMonaco, options);

      expect(divTable.showCheckboxes).toBe(false);
      expect(divTable.multiSelect).toBe(false);
      expect(divTable.showLoadingPlaceholder).toBe(false);
      expect(divTable.showRefreshButton).toBe(true);
      expect(divTable.showAutoFetchButton).toBe(true);
      expect(divTable.autoFetchDelay).toBe(300);
      expect(divTable.virtualScrolling).toBe(true);
      expect(divTable.pageSize).toBe(20);
      expect(divTable.loadingThreshold).toBe(15);
      expect(divTable.scrollThreshold).toBe(0.9);
    });

    it('should apply CSS classes based on options', () => {
      const options = createDefaultOptions(container, {
        showCheckboxes: false,
        multiSelect: false
      });

      divTable = new DivTable(mockMonaco, options);

      expect(container.classList.contains('no-checkboxes')).toBe(true);
      expect(container.classList.contains('no-multiselect')).toBe(true);
    });
  });

  describe('Edge cases with utilities', () => {
    it('should handle empty data gracefully', () => {
      const options = createDefaultOptions(container, { data: [] });
      
      expectNotToThrow(() => {
        divTable = new DivTable(mockMonaco, options);
      });

      expect(divTable.data).toEqual([]);
      expect(divTable.filteredData).toEqual([]);
    });

    it('should handle null/undefined values in data', () => {
      const dataWithNulls = createSampleData().map(item => ({
        ...item,
        optionalField: Math.random() > 0.5 ? 'value' : null
      }));

      const options = createDefaultOptions(container, { data: dataWithNulls });
      divTable = new DivTable(mockMonaco, options);

      expectNotToThrow(() => {
        divTable.queryEngine.filterObjects('optionalField = NULL');
      });
    });

    it('should handle missing primary key field', () => {
      const columnsWithoutPK = createSampleColumns().map(col => ({
        ...col,
        primaryKey: false
      }));

      const options = createDefaultOptions(container, { columns: columnsWithoutPK });
      divTable = new DivTable(mockMonaco, options);

      // Should fallback to 'id' as primary key
      expect(divTable.primaryKeyField).toBe('id');
    });
  });
});