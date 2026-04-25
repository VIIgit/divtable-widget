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
    document.querySelectorAll('.div-table-copy-chooser').forEach(el => el.remove());
    localStorage.clear();
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

  describe('copy behavior', () => {
    beforeEach(() => {
      container.id = 'copy-unit-table';
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: jest.fn()
        }
      });

      divTable = new DivTable(mockMonaco, {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        lazyCellRendering: false
      });
    });

    it('should show the chooser on first Ctrl/Cmd+C instead of copying immediately', () => {
      const preventDefault = jest.fn();

      divTable.handleKeyDown({
        ctrlKey: true,
        metaKey: false,
        key: 'c',
        preventDefault
      });

      expect(preventDefault).toHaveBeenCalled();
      expect(document.querySelector('.div-table-copy-chooser')).not.toBeNull();
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    it('should open chooser in keyboard mode on Ctrl/Cmd+C', () => {
      const showCopyChooser = jest.spyOn(divTable, 'showCopyChooser').mockImplementation(() => {});

      divTable.handleCopyShortcut({});

      expect(showCopyChooser).toHaveBeenCalledWith(null, { fromKeyboard: true });
    });

    it('should fall back to CSV in executeCopyMode when cell mode has no focused column', () => {
      const copyRowsAsCsv = jest.spyOn(divTable, 'copyRowsAsCsv').mockImplementation(() => {});

      divTable.focusedRowId = '1';
      divTable.focusedColumnField = null;

      divTable.executeCopyMode('cell');

      expect(copyRowsAsCsv).toHaveBeenCalled();
    });

    it('should normalize array and object cell values before copying', () => {
      divTable = new DivTable(mockMonaco, {
        tableWidgetElement: container,
        columns: [
          { field: 'id', primaryKey: true },
          { field: 'tags' },
          { field: 'meta' }
        ],
        data: [
          { id: 1, tags: ['a', 'b'], meta: { city: 'Bern' } }
        ],
        lazyCellRendering: false
      });

      divTable.focusedRowId = '1';
      divTable.focusedColumnField = 'tags';
      divTable.copyCellValue();
      expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith('a, b');

      divTable.focusedColumnField = 'meta';
      divTable.copyCellValue();
      expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith('{"city":"Bern"}');
    });

    it('should load a persisted copy mode from localStorage', () => {
      localStorage.setItem('divtable:copyMode:copy-unit-table', 'record');

      divTable = new DivTable(mockMonaco, {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        lazyCellRendering: false
      });

      expect(divTable.copyMode).toBe('record');
      expect(divTable.copyModeFirstUse).toBe(false);
    });

    it('should copy focused record when executeCopyMode uses record mode', () => {
      const copyFocusedRowAsCsv = jest.spyOn(divTable, 'copyFocusedRowAsCsv').mockImplementation(() => {});

      divTable.executeCopyMode('record');

      expect(copyFocusedRowAsCsv).toHaveBeenCalled();
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

  describe('aggregate columns', () => {
    let aggregateData;
    let aggregateColumns;

    beforeEach(() => {
      aggregateData = [
        { id: 1, name: 'John', salary: 50000, city: 'NYC' },
        { id: 2, name: 'Jane', salary: 60000, city: 'NYC' },
        { id: 3, name: 'Bob', salary: 70000, city: 'LA' },
        { id: 4, name: 'Alice', salary: 80000, city: 'LA' },
        { id: 5, name: 'Charlie', salary: 90000, city: 'Chicago' }
      ];

      aggregateColumns = [
        { field: 'id', label: 'ID', primaryKey: true },
        { field: 'name', label: 'Name' },
        { field: 'salary', label: 'Salary', aggregate: 'sum' },
        { field: 'city', label: 'City', groupable: true }
      ];
    });

    it('should detect aggregate columns', () => {
      const options = {
        tableWidgetElement: container,
        columns: aggregateColumns,
        data: aggregateData
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.hasAggregateColumns()).toBe(true);
      expect(divTable.getAggregateColumns().length).toBe(1);
      expect(divTable.getAggregateColumns()[0].field).toBe('salary');
    });

    it('should return false when no aggregate columns', () => {
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData
      };

      const divTable = new DivTable(mockMonaco, options);

      expect(divTable.hasAggregateColumns()).toBe(false);
      expect(divTable.getAggregateColumns().length).toBe(0);
    });

    it('should calculate sum aggregate', () => {
      const options = {
        tableWidgetElement: container,
        columns: aggregateColumns,
        data: aggregateData
      };

      const divTable = new DivTable(mockMonaco, options);
      const salaryColumn = aggregateColumns.find(c => c.field === 'salary');
      const sum = divTable.calculateAggregate(salaryColumn, aggregateData);

      expect(sum).toBe(350000); // 50000 + 60000 + 70000 + 80000 + 90000
    });

    it('should calculate average aggregate', () => {
      const avgColumns = [
        { field: 'id', label: 'ID', primaryKey: true },
        { field: 'salary', label: 'Salary', aggregate: 'avg' }
      ];

      const options = {
        tableWidgetElement: container,
        columns: avgColumns,
        data: aggregateData
      };

      const divTable = new DivTable(mockMonaco, options);
      const salaryColumn = avgColumns.find(c => c.field === 'salary');
      const avg = divTable.calculateAggregate(salaryColumn, aggregateData);

      expect(avg).toBe(70000); // 350000 / 5
    });

    it('should calculate count aggregate', () => {
      const countColumns = [
        { field: 'id', label: 'ID', primaryKey: true },
        { field: 'name', label: 'Name', aggregate: 'count' }
      ];

      const options = {
        tableWidgetElement: container,
        columns: countColumns,
        data: aggregateData
      };

      const divTable = new DivTable(mockMonaco, options);
      const nameColumn = countColumns.find(c => c.field === 'name');
      const count = divTable.calculateAggregate(nameColumn, aggregateData);

      expect(count).toBe(5);
    });

    it('should calculate min aggregate', () => {
      const minColumns = [
        { field: 'id', label: 'ID', primaryKey: true },
        { field: 'salary', label: 'Salary', aggregate: 'min' }
      ];

      const options = {
        tableWidgetElement: container,
        columns: minColumns,
        data: aggregateData
      };

      const divTable = new DivTable(mockMonaco, options);
      const salaryColumn = minColumns.find(c => c.field === 'salary');
      const min = divTable.calculateAggregate(salaryColumn, aggregateData);

      expect(min).toBe(50000);
    });

    it('should calculate max aggregate', () => {
      const maxColumns = [
        { field: 'id', label: 'ID', primaryKey: true },
        { field: 'salary', label: 'Salary', aggregate: 'max' }
      ];

      const options = {
        tableWidgetElement: container,
        columns: maxColumns,
        data: aggregateData
      };

      const divTable = new DivTable(mockMonaco, options);
      const salaryColumn = maxColumns.find(c => c.field === 'salary');
      const max = divTable.calculateAggregate(salaryColumn, aggregateData);

      expect(max).toBe(90000);
    });

    it('should return null for empty data', () => {
      const options = {
        tableWidgetElement: container,
        columns: aggregateColumns,
        data: []
      };

      const divTable = new DivTable(mockMonaco, options);
      const salaryColumn = aggregateColumns.find(c => c.field === 'salary');
      const sum = divTable.calculateAggregate(salaryColumn, []);

      expect(sum).toBe(null);
    });

    it('should handle null/undefined values in aggregation', () => {
      const dataWithNulls = [
        { id: 1, salary: 50000 },
        { id: 2, salary: null },
        { id: 3, salary: 70000 },
        { id: 4, salary: undefined },
        { id: 5, salary: 90000 }
      ];

      const options = {
        tableWidgetElement: container,
        columns: aggregateColumns,
        data: dataWithNulls
      };

      const divTable = new DivTable(mockMonaco, options);
      const salaryColumn = aggregateColumns.find(c => c.field === 'salary');
      const sum = divTable.calculateAggregate(salaryColumn, dataWithNulls);

      expect(sum).toBe(210000); // 50000 + 70000 + 90000 (ignores null/undefined)
    });

    it('should render header summary row when enabled', () => {
      const options = {
        tableWidgetElement: container,
        columns: aggregateColumns,
        data: aggregateData,
        showHeaderSummary: true
      };

      const divTable = new DivTable(mockMonaco, options);

      const summaryRow = container.querySelector('.header-summary');
      expect(summaryRow).not.toBeNull();
      expect(summaryRow.classList.contains('summary-row')).toBe(true);
    });

    it('should not render header summary when disabled', () => {
      const options = {
        tableWidgetElement: container,
        columns: aggregateColumns,
        data: aggregateData,
        showHeaderSummary: false
      };

      const divTable = new DivTable(mockMonaco, options);

      const summaryRow = container.querySelector('.header-summary');
      expect(summaryRow).toBeNull();
    });

    it('should render group summary in group headers when grouped', () => {
      const options = {
        tableWidgetElement: container,
        columns: aggregateColumns,
        data: aggregateData,
        showGroupSummary: true,
        group: 'city'
      };

      const divTable = new DivTable(mockMonaco, options);
      
      // Expand all groups to see group summaries
      divTable.collapsedGroups.clear();
      divTable.render();

      const groupHeaders = container.querySelectorAll('.group-header');
      // Should have 3 group headers (NYC, LA, Chicago) with inline summary cells
      expect(groupHeaders.length).toBe(3);
      groupHeaders.forEach(header => {
        expect(header.querySelectorAll('.group-summary-cell').length).toBeGreaterThan(0);
      });
    });

    it('should format aggregate values with custom render function', () => {
      const customColumns = [
        { field: 'id', label: 'ID', primaryKey: true },
        { 
          field: 'salary', 
          label: 'Salary', 
          aggregate: 'sum',
          aggregateRender: (value) => `$${value.toLocaleString()}`
        }
      ];

      const options = {
        tableWidgetElement: container,
        columns: customColumns,
        data: aggregateData,
        showHeaderSummary: true
      };

      const divTable = new DivTable(mockMonaco, options);
      const salaryColumn = customColumns.find(c => c.field === 'salary');
      const formatted = divTable.formatAggregateValue(350000, salaryColumn);

      expect(formatted).toBe('$350,000');
    });

    it('should use selection-aware aggregation', () => {
      const options = {
        tableWidgetElement: container,
        columns: aggregateColumns,
        data: aggregateData,
        showHeaderSummary: true
      };

      const divTable = new DivTable(mockMonaco, options);
      
      // Select first two rows (salary: 50000 + 60000)
      divTable.selectedRows.add('1');
      divTable.selectedRows.add('2');
      
      const aggregationData = divTable.getAggregationDataSet(aggregateData);
      const salaryColumn = aggregateColumns.find(c => c.field === 'salary');
      const sum = divTable.calculateAggregate(salaryColumn, aggregationData);

      expect(sum).toBe(110000); // Only selected rows
    });
  });

  describe('replaceData focus reconciliation', () => {
    it('should fire onRowFocus(undefined) when focused row is removed by replaceData', () => {
      const focusCalls = [];
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        onRowFocus: (row, group) => focusCalls.push({ row, group })
      };

      const divTable = new DivTable(mockMonaco, options);

      // Simulate focusing row with id '1'
      divTable.focusedRowId = '1';
      divTable._lastFocusCallback = { rowId: '1', groupKey: null };

      focusCalls.length = 0;

      // Replace data WITHOUT the focused row
      divTable.replaceData([
        { id: 20, name: 'New Person', age: 40, status: 'active' }
      ]);

      // Should have fired onRowFocus with undefined to clear the details panel
      const clearCall = focusCalls.find(c => c.row === undefined);
      expect(clearCall).toBeDefined();
      expect(divTable.focusedRowId).toBeNull();
    });

    it('should re-fire onRowFocus with updated data when focused row survives replaceData', () => {
      const focusCalls = [];
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        onRowFocus: (row, group) => focusCalls.push({ row, group })
      };

      const divTable = new DivTable(mockMonaco, options);

      // Simulate focusing row with id '1'
      divTable.focusedRowId = '1';
      divTable._lastFocusCallback = { rowId: '1', groupKey: null };

      focusCalls.length = 0;

      // Replace data WITH the focused row (updated name)
      divTable.replaceData([
        { id: 1, name: 'John Updated', age: 31, status: 'active' }
      ]);

      // Should have re-fired onRowFocus with the updated row data
      const refocusCall = focusCalls.find(c => c.row && c.row.name === 'John Updated');
      expect(refocusCall).toBeDefined();
      expect(divTable.focusedRowId).toBe('1');
    });

    it('should re-fire onRowFocus when focused row still exists after appendData', () => {
      const focusCalls = [];
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        onRowFocus: (row, group) => focusCalls.push({ row, group })
      };

      const divTable = new DivTable(mockMonaco, options);

      // Focus row with id '1'
      divTable.focusedRowId = '1';
      divTable._lastFocusCallback = { rowId: '1', groupKey: null };

      focusCalls.length = 0;

      divTable.appendData([
        { id: 20, name: 'Extra', age: 50, status: 'active' }
      ]);

      // Row 1 still exists, so onRowFocus should re-fire with that row
      const refocusCall = focusCalls.find(c => c.row && c.row.id === 1);
      expect(refocusCall).toBeDefined();
    });

    it('should fire onRowFocus(undefined) when query filter hides the focused row', () => {
      const focusCalls = [];
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        onRowFocus: (row, group) => focusCalls.push({ row, group })
      };

      const divTable = new DivTable(mockMonaco, options);

      // Focus row id '1' (John Doe, age 30, status active)
      divTable.focusedRowId = '1';
      divTable._lastFocusCallback = { rowId: '1', groupKey: null };

      focusCalls.length = 0;

      // Apply a filter that excludes the focused row
      divTable.applyQuery('status = "inactive"');

      // Focused row is hidden by filter — should clear focus
      const clearCall = focusCalls.find(c => c.row === undefined);
      expect(clearCall).toBeDefined();
      expect(divTable.focusedRowId).toBeNull();
    });

    it('should re-fire onRowFocus when query filter still includes the focused row', () => {
      const focusCalls = [];
      const options = {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        onRowFocus: (row, group) => focusCalls.push({ row, group })
      };

      const divTable = new DivTable(mockMonaco, options);

      // Focus row id '1' (John Doe, age 30, status active)
      divTable.focusedRowId = '1';
      divTable._lastFocusCallback = { rowId: '1', groupKey: null };

      focusCalls.length = 0;

      // Apply a filter that still includes the focused row
      divTable.applyQuery('status = "active"');

      // Focused row is still visible — should re-fire with row data
      const refocusCall = focusCalls.find(c => c.row && c.row.id === 1);
      expect(refocusCall).toBeDefined();
      expect(divTable.focusedRowId).toBe('1');
    });
  });

  describe('autoFocusFirstRow', () => {
    it('should not auto-focus by default', () => {
      const focusCalls = [];
      const divTable = new DivTable(mockMonaco, {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        onRowFocus: (row, group) => focusCalls.push({ row, group })
      });

      focusCalls.length = 0;

      divTable.replaceData([...testData]);

      // No auto-focus — focusedRowId should remain null
      expect(divTable.focusedRowId).toBeNull();
      const focusCall = focusCalls.find(c => c.row && c.row.id === 1);
      expect(focusCall).toBeUndefined();
    });

    it('should auto-focus first row on replaceData when enabled and nothing focused', () => {
      const focusCalls = [];
      const divTable = new DivTable(mockMonaco, {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        autoFocusFirstRow: true,
        onRowFocus: (row, group) => focusCalls.push({ row, group })
      });

      focusCalls.length = 0;

      divTable.replaceData([...testData]);

      // Should auto-focus the first row
      expect(divTable.focusedRowId).toBe('1');
      const focusCall = focusCalls.find(c => c.row && c.row.id === 1);
      expect(focusCall).toBeDefined();
    });

    it('should auto-focus first row when filter hides the focused row', () => {
      const focusCalls = [];
      const divTable = new DivTable(mockMonaco, {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        autoFocusFirstRow: true,
        onRowFocus: (row, group) => focusCalls.push({ row, group })
      });

      // Focus row id '1' (status=active)
      divTable.focusedRowId = '1';
      divTable._lastFocusCallback = { rowId: '1', groupKey: null };
      focusCalls.length = 0;

      // Filter excludes row 1 — only inactive rows remain (row 2: Jane Smith)
      divTable.applyQuery('status = "inactive"');

      // Should auto-focus first visible row instead of clearing
      expect(divTable.focusedRowId).toBe('2');
      const focusCall = focusCalls.find(c => c.row && c.row.id === 2);
      expect(focusCall).toBeDefined();
    });

    it('should fire onRowFocus(undefined) when filter hides focused row and no data remains', () => {
      const focusCalls = [];
      const divTable = new DivTable(mockMonaco, {
        tableWidgetElement: container,
        columns: testColumns,
        data: testData,
        autoFocusFirstRow: true,
        onRowFocus: (row, group) => focusCalls.push({ row, group })
      });

      divTable.focusedRowId = '1';
      divTable._lastFocusCallback = { rowId: '1', groupKey: null };
      focusCalls.length = 0;

      // Replace with empty data
      divTable.replaceData([]);

      // No data to auto-focus — should clear
      expect(divTable.focusedRowId).toBeNull();
      const clearCall = focusCalls.find(c => c.row === undefined);
      expect(clearCall).toBeDefined();
    });
  });
});