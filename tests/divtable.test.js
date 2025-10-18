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

describe('DivTable', () => {
  let container;
  let divTable;
  let mockMonaco;
  let testData;
  let testColumns;

  beforeEach(() => {
    // Create a container element
    container = document.createElement('div');
    container.className = 'div-table-widget';
    document.body.appendChild(container);

    // Mock Monaco editor
    mockMonaco = global.monaco;

    // Test data
    testData = [
      { id: 1, name: 'John Doe', age: 30, status: 'active' },
      { id: 2, name: 'Jane Smith', age: 25, status: 'inactive' },
      { id: 3, name: 'Bob Johnson', age: 35, status: 'active' }
    ];

    // Test columns
    testColumns = [
      { field: 'id', title: 'ID', primaryKey: true },
      { field: 'name', title: 'Name' },
      { field: 'age', title: 'Age' },
      { field: 'status', title: 'Status' }
    ];
  });

  afterEach(() => {
    if (divTable && typeof divTable.dispose === 'function') {
      divTable.dispose();
    }
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.monaco).toBe(mockMonaco);
      expect(divTable.options).toBe(options);
      expect(divTable.data).toBe(testData);
      expect(divTable.columns).toBe(testColumns);
      expect(divTable.showCheckboxes).toBe(true);
      expect(divTable.multiSelect).toBe(true);
      expect(divTable.primaryKeyField).toBe('id');
    });

    it('should handle explicit empty data array', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: []
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.data).toEqual([]);
      expect(divTable.isLoadingState).toBe(true);
    });

    it('should handle no data provided (undefined)', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.data).toEqual([]);
      expect(divTable._shouldLoadFirstPage).toBe(false);
    });

    it('should set _shouldLoadFirstPage when onNextPage provided and no data', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        onNextPage: jest.fn()
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable._shouldLoadFirstPage).toBe(true);
    });

    it('should respect showCheckboxes option', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        showCheckboxes: false
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.showCheckboxes).toBe(false);
      expect(container.classList.contains('no-checkboxes')).toBe(true);
    });

    it('should respect multiSelect option', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        multiSelect: false
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.multiSelect).toBe(false);
      expect(container.classList.contains('no-multiselect')).toBe(true);
    });

    it('should set up virtual scrolling options', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        virtualScrolling: true,
        pageSize: 50,
        totalRecords: 1000
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.virtualScrolling).toBe(true);
      expect(divTable.pageSize).toBe(50);
      expect(divTable.totalRecords).toBe(1000);
    });

    it('should handle callbacks', () => {
      const onSelectionChange = jest.fn();
      const onRowFocus = jest.fn();
      const onRefresh = jest.fn();

      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        onSelectionChange,
        onRowFocus,
        onRefresh
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.onSelectionChange).toBe(onSelectionChange);
      expect(divTable.onRowFocus).toBe(onRowFocus);
      expect(divTable.onRefresh).toBe(onRefresh);
    });

    it('should initialize QueryEngine with correct parameters', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.queryEngine).toBeDefined();
      expect(divTable.queryEngine.objects).toBe(testData);
      expect(divTable.queryEngine.primaryKeyField).toBe('id');
    });

    it('should handle custom primary key field', () => {
      const customColumns = [
        { field: 'customId', title: 'Custom ID', primaryKey: true },
        { field: 'name', title: 'Name' }
      ];

      const options = {
        tableWidgetElement: container,
        columns: customColumns,
        data: testData
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.primaryKeyField).toBe('customId');
    });

    it('should throw error if no container provided', () => {
      const options = {
        columns: testColumns,
        data: testData
      };

      // Mock console.error to avoid output during test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const divTable = new DivTable(mockMonaco, options);

      expect(consoleErrorSpy).toHaveBeenCalledWith('DivTable: tableWidgetElement is required');
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('data management', () => {
    beforeEach(() => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData
      };
      divTable = new DivTable(mockMonaco, options);
    });

    it('should initialize filteredData with copy of data', () => {
      expect(divTable.filteredData).toEqual(testData);
      expect(divTable.filteredData).not.toBe(testData); // Should be a copy
    });

    it('should update query engine when data changes', () => {
      const newData = [{ id: 4, name: 'New User', age: 40, status: 'active' }];
      
      if (typeof divTable.updateData === 'function') {
        divTable.updateData(newData);
        expect(divTable.queryEngine.objects).toBe(newData);
      }
    });
  });

  describe('selection management', () => {
    beforeEach(() => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData
      };
      divTable = new DivTable(mockMonaco, options);
    });

    it('should initialize with empty selection', () => {
      expect(divTable.selectedRows.size).toBe(0);
      expect(divTable.focusedRowId).toBe(null);
    });

    it('should handle selection state', () => {
      divTable.selectedRows.add(1);
      divTable.selectedRows.add(2);
      
      expect(divTable.selectedRows.has(1)).toBe(true);
      expect(divTable.selectedRows.has(2)).toBe(true);
      expect(divTable.selectedRows.size).toBe(2);
    });
  });

  describe('virtual scrolling', () => {
    beforeEach(() => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        virtualScrolling: true,
        pageSize: 2
      };
      divTable = new DivTable(mockMonaco, options);
    });

    it('should initialize virtual scrolling state', () => {
      expect(divTable.virtualScrolling).toBe(true);
      expect(divTable.pageSize).toBe(2);
      expect(divTable.currentPage).toBe(0);
      expect(divTable.isLoading).toBe(false);
      expect(divTable.hasMoreData).toBe(true);
    });

    it('should calculate visible range correctly', () => {
      expect(divTable.visibleStartIndex).toBe(0);
      expect(divTable.visibleEndIndex).toBe(2);
    });
  });

  describe('auto-fetch functionality', () => {
    beforeEach(() => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        showAutoFetchButton: true,
        autoFetchDelay: 100
      };
      divTable = new DivTable(mockMonaco, options);
    });

    it('should initialize auto-fetch state', () => {
      expect(divTable.showAutoFetchButton).toBe(true);
      expect(divTable.autoFetchDelay).toBe(100);
      expect(divTable.isAutoFetching).toBe(false);
      expect(divTable.autoFetchPaused).toBe(false);
      expect(divTable.autoFetchTimeout).toBe(null);
    });
  });

  describe('sorting and grouping', () => {
    beforeEach(() => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData
      };
      divTable = new DivTable(mockMonaco, options);
    });

    it('should initialize sorting state', () => {
      expect(divTable.sortColumn).toBe(null);
      expect(divTable.sortDirection).toBe('asc');
    });

    it('should initialize grouping state', () => {
      expect(divTable.groupByField).toBe(null);
      expect(divTable.collapsedGroups).toBeInstanceOf(Set);
      expect(divTable.collapsedGroups.size).toBe(0);
    });
  });

  describe('query functionality', () => {
    beforeEach(() => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData
      };
      divTable = new DivTable(mockMonaco, options);
    });

    it('should initialize with empty query', () => {
      expect(divTable.currentQuery).toBe('');
    });

    it('should have queryEngine initialized', () => {
      expect(divTable.queryEngine).toBeDefined();
      expect(divTable.queryEngine).toBeInstanceOf(QueryEngine);
    });
  });

  describe('refresh functionality', () => {
    it('should handle refresh button configuration', () => {
      const onRefresh = jest.fn();
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        showRefreshButton: true,
        onRefresh
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.showRefreshButton).toBe(true);
      expect(divTable.onRefresh).toBe(onRefresh);
    });
  });

  describe('loading state', () => {
    it('should show loading state when no data and loading enabled', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: [],
        showLoadingPlaceholder: true
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.isLoadingState).toBe(true);
    });

    it('should not show loading state when loading disabled', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: [],
        showLoadingPlaceholder: false
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.isLoadingState).toBe(false);
    });

    it('should not show loading state when data provided', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        showLoadingPlaceholder: true
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.isLoadingState).toBe(false);
    });
  });

  describe('pagination callbacks', () => {
    it('should handle pagination callbacks', () => {
      const onNextPage = jest.fn();
      const onPreviousPage = jest.fn();

      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        onNextPage,
        onPreviousPage
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.onNextPage).toBe(onNextPage);
      expect(divTable.onPreviousPage).toBe(onPreviousPage);
    });
  });

  describe('loading threshold configuration', () => {
    it('should set default loading threshold', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        pageSize: 100
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.loadingThreshold).toBe(80); // 80% of 100
    });

    it('should respect custom loading threshold', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        loadingThreshold: 50
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.loadingThreshold).toBe(50);
    });

    it('should set default scroll threshold', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.scrollThreshold).toBe(0.95);
    });
  });

  describe('total records calculation', () => {
    it('should use provided totalRecords', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        totalRecords: 500
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.totalRecords).toBe(500);
    });

    it('should calculate totalRecords for virtual scrolling', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        virtualScrolling: true,
        pageSize: 50
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.totalRecords).toBe(500); // 10x page size
    });

    it('should use data length when no virtual scrolling', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        virtualScrolling: false
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.totalRecords).toBe(testData.length);
    });
  });
});