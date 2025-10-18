const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

// Import source files
const fs = require('fs');
const path = require('path');

// Load the source files
const querySource = fs.readFileSync(path.join(__dirname, '../src/query.js'), 'utf8');
const divTableSource = fs.readFileSync(path.join(__dirname, '../src/div-table.js'), 'utf8');

// Execute the source code to make classes available
eval(querySource);
eval(divTableSource);

// Make classes available globally
global.DivTable = DivTable;
global.QueryEngine = QueryEngine;

describe('DivTable Integration Tests', () => {
  let container;
  let divTable;
  let mockMonaco;
  let testData;
  let testColumns;

  beforeEach(() => {
    // Create a container element
    container = document.createElement('div');
    container.className = 'div-table-widget';
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Mock Monaco editor
    mockMonaco = global.monaco;

    // Extended test data for integration tests
    testData = [
      { 
        id: 1, 
        name: 'John Doe', 
        age: 30, 
        status: 'active',
        department: 'Engineering',
        salary: 75000,
        isManager: true,
        tags: ['developer', 'lead', 'javascript']
      },
      { 
        id: 2, 
        name: 'Jane Smith', 
        age: 25, 
        status: 'inactive',
        department: 'Design',
        salary: 65000,
        isManager: false,
        tags: ['designer', 'ui', 'ux']
      },
      { 
        id: 3, 
        name: 'Bob Johnson', 
        age: 35, 
        status: 'active',
        department: 'Engineering',
        salary: 85000,
        isManager: true,
        tags: ['manager', 'lead', 'python']
      },
      { 
        id: 4, 
        name: 'Alice Brown', 
        age: 28, 
        status: 'pending',
        department: 'Marketing',
        salary: 55000,
        isManager: false,
        tags: ['marketing', 'content']
      },
      { 
        id: 5, 
        name: 'Charlie Davis', 
        age: null, 
        status: 'active',
        department: 'Sales',
        salary: 70000,
        isManager: false,
        tags: []
      }
    ];

    // Test columns with detailed configuration
    testColumns = [
      { 
        field: 'id', 
        title: 'ID', 
        primaryKey: true,
        width: 60
      },
      { 
        field: 'name', 
        title: 'Full Name',
        width: 150
      },
      { 
        field: 'age', 
        title: 'Age',
        width: 80
      },
      { 
        field: 'status', 
        title: 'Status',
        width: 100
      },
      { 
        field: 'department', 
        title: 'Department',
        width: 120
      },
      { 
        field: 'salary', 
        title: 'Salary',
        width: 100,
        format: 'currency'
      },
      { 
        field: 'isManager', 
        title: 'Manager',
        width: 80
      }
    ];
  });

  afterEach(() => {
    if (divTable && typeof divTable.dispose === 'function') {
      divTable.dispose();
    }
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe('Complete widget initialization', () => {
    it('should create a fully functional table widget', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        showCheckboxes: true,
        multiSelect: true,
        onSelectionChange: jest.fn(),
        onRowFocus: jest.fn()
      };

      divTable = new DivTable(mockMonaco, options);

      // Check that the widget is properly initialized
      expect(divTable).toBeDefined();
      expect(divTable.data).toBe(testData);
      expect(divTable.columns).toBe(testColumns);
      expect(divTable.queryEngine).toBeInstanceOf(QueryEngine);
      
      // Check that DOM structure is created
      expect(container.children.length).toBeGreaterThan(0);
    });

    it('should handle table without checkboxes', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        showCheckboxes: false
      };

      divTable = new DivTable(mockMonaco, options);

      expect(container.classList.contains('no-checkboxes')).toBe(true);
    });

    it('should handle single selection mode', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        multiSelect: false
      };

      divTable = new DivTable(mockMonaco, options);

      expect(container.classList.contains('no-multiselect')).toBe(true);
    });
  });

  describe('Query functionality integration', () => {
    beforeEach(() => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData
      };
      divTable = new DivTable(mockMonaco, options);
    });

    it('should filter data using simple search', () => {
      const results = divTable.queryEngine.filterObjects('john');
      expect(results).toEqual([1, 3]); // John Doe, Bob Johnson
    });

    it('should filter data using structured queries', () => {
      const results = divTable.queryEngine.filterObjects('status = "active"');
      expect(results).toEqual([1, 3, 5]); // Active users
    });

    it('should handle complex queries with AND/OR', () => {
      const results = divTable.queryEngine.filterObjects('status = "active" AND age > 30');
      expect(results).toEqual([3]); // Bob Johnson (35)
    });

    it('should handle IN queries', () => {
      const results = divTable.queryEngine.filterObjects('department IN ["Engineering", "Design"]');
      expect(results).toEqual([1, 2, 3]); // Engineering and Design departments
    });

    it('should handle null value queries', () => {
      const results = divTable.queryEngine.filterObjects('age = NULL');
      expect(results).toEqual([5]); // Charlie Davis with null age
    });

    it('should handle boolean queries', () => {
      const results = divTable.queryEngine.filterObjects('isManager = true');
      expect(results).toEqual([1, 3]); // Managers
    });

    it('should handle numeric comparison queries', () => {
      const results = divTable.queryEngine.filterObjects('salary > 70000');
      expect(results).toEqual([1, 3]); // High salary employees
    });
  });

  describe('Virtual scrolling integration', () => {
    it('should handle virtual scrolling configuration', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        virtualScrolling: true,
        pageSize: 2,
        totalRecords: 100,
        onNextPage: jest.fn(),
        onPreviousPage: jest.fn()
      };

      divTable = new DivTable(mockMonaco, options);

      expect(divTable.virtualScrolling).toBe(true);
      expect(divTable.pageSize).toBe(2);
      expect(divTable.totalRecords).toBe(100);
      expect(divTable.onNextPage).toBeDefined();
      expect(divTable.onPreviousPage).toBeDefined();
    });

    it('should calculate loading threshold correctly', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        virtualScrolling: true,
        pageSize: 50
      };

      divTable = new DivTable(mockMonaco, options);

      expect(divTable.loadingThreshold).toBe(40); // 80% of 50
    });
  });

  describe('Selection and focus integration', () => {
    let onSelectionChange;
    let onRowFocus;

    beforeEach(() => {
      onSelectionChange = jest.fn();
      onRowFocus = jest.fn();

      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        onSelectionChange,
        onRowFocus
      };

      divTable = new DivTable(mockMonaco, options);
    });

    it('should manage selection state', () => {
      // Simulate selection
      divTable.selectedRows.add(1);
      divTable.selectedRows.add(3);

      expect(divTable.selectedRows.has(1)).toBe(true);
      expect(divTable.selectedRows.has(3)).toBe(true);
      expect(divTable.selectedRows.size).toBe(2);
    });

    it('should manage focus state', () => {
      divTable.focusedRowId = 2;
      expect(divTable.focusedRowId).toBe(2);
    });

    it('should track last focus callback to prevent duplicates', () => {
      expect(divTable._lastFocusCallback).toEqual({
        rowId: null,
        groupKey: null
      });
    });
  });

  describe('Auto-fetch functionality integration', () => {
    it('should handle auto-fetch configuration', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        showAutoFetchButton: true,
        autoFetchDelay: 200
      };

      divTable = new DivTable(mockMonaco, options);

      expect(divTable.showAutoFetchButton).toBe(true);
      expect(divTable.autoFetchDelay).toBe(200);
      expect(divTable.isAutoFetching).toBe(false);
      expect(divTable.autoFetchPaused).toBe(false);
    });

    it('should handle auto-fetch state management', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        showAutoFetchButton: true
      };

      divTable = new DivTable(mockMonaco, options);

      // Test auto-fetch state changes
      divTable.isAutoFetching = true;
      expect(divTable.isAutoFetching).toBe(true);

      divTable.autoFetchPaused = true;
      expect(divTable.autoFetchPaused).toBe(true);
    });
  });

  describe('Loading state integration', () => {
    it('should show loading state correctly', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: [],
        showLoadingPlaceholder: true
      };

      divTable = new DivTable(mockMonaco, options);

      expect(divTable.isLoadingState).toBe(true);
    });

    it('should determine when to load first page', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        // No data provided, but onNextPage callback exists
        onNextPage: jest.fn()
      };

      divTable = new DivTable(mockMonaco, options);

      expect(divTable._shouldLoadFirstPage).toBe(true);
    });
  });

  describe('Refresh functionality integration', () => {
    it('should handle refresh callback', () => {
      const onRefresh = jest.fn();
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        showRefreshButton: true,
        onRefresh
      };

      divTable = new DivTable(mockMonaco, options);

      expect(divTable.showRefreshButton).toBe(true);
      expect(divTable.onRefresh).toBe(onRefresh);
    });
  });

  describe('Data synchronization', () => {
    beforeEach(() => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData
      };
      divTable = new DivTable(mockMonaco, options);
    });

    it('should keep filteredData in sync with data', () => {
      expect(divTable.filteredData).toEqual(testData);
      expect(divTable.filteredData).not.toBe(testData); // Should be a copy
    });

    it('should keep queryEngine data in sync', () => {
      expect(divTable.queryEngine.objects).toBe(testData);
    });
  });

  describe('Primary key handling', () => {
    it('should use default primary key when none specified', () => {
      const columnsWithoutPrimaryKey = [
        { field: 'name', title: 'Name' },
        { field: 'age', title: 'Age' }
      ];

      const options = {
        tableWidgetElement: container,
        columns: columnsWithoutPrimaryKey,
        data: testData
      };

      divTable = new DivTable(mockMonaco, options);

      expect(divTable.primaryKeyField).toBe('id'); // Default fallback
    });

    it('should use specified primary key', () => {
      const columnsWithCustomPrimaryKey = [
        { field: 'customId', title: 'Custom ID', primaryKey: true },
        { field: 'name', title: 'Name' }
      ];

      const options = {
        tableWidgetElement: container,
        columns: columnsWithCustomPrimaryKey,
        data: testData
      };

      divTable = new DivTable(mockMonaco, options);

      expect(divTable.primaryKeyField).toBe('customId');
    });
  });

  describe('Error handling', () => {
    it('should handle missing container gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const options = {
        tableWidgetElement: null,
        columns: testColumns,
        data: testData
      };

      divTable = new DivTable(mockMonaco, options);

      expect(consoleErrorSpy).toHaveBeenCalledWith('DivTable: tableWidgetElement is required');
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle invalid query gracefully', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData
      };

      divTable = new DivTable(mockMonaco, options);

      expect(() => {
        divTable.queryEngine.filterObjects('field AND');
      }).toThrow();
    });
  });

  describe('Performance considerations', () => {
    it('should handle large datasets efficiently', () => {
      // Create a larger dataset
      const largeData = [];
      for (let i = 0; i < 1000; i++) {
        largeData.push({
          id: i,
          name: `User ${i}`,
          age: 20 + (i % 50),
          status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'inactive' : 'pending',
          department: ['Engineering', 'Design', 'Marketing', 'Sales'][i % 4]
        });
      }

      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: largeData,
        virtualScrolling: true,
        pageSize: 50
      };

      const startTime = performance.now();
      divTable = new DivTable(mockMonaco, options);
      const endTime = performance.now();

      // Should initialize within reasonable time (less than 10 seconds)
      expect(endTime - startTime).toBeLessThan(10000);
      expect(divTable.data.length).toBe(1000);
    });

    it('should handle complex queries efficiently', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData
      };

      divTable = new DivTable(mockMonaco, options);

      const complexQuery = '(status = "active" AND age > 25) OR (department = "Engineering" AND isManager = true)';
      
      const startTime = performance.now();
      const results = divTable.queryEngine.filterObjects(complexQuery);
      const endTime = performance.now();

      // Should execute query quickly (less than 100ms for small dataset)
      expect(endTime - startTime).toBeLessThan(100);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });
});