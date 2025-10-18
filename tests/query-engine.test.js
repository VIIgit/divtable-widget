const { describe, it, expect, beforeEach } = require('@jest/globals');

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

describe('QueryEngine', () => {
  let queryEngine;
  let testData;

  beforeEach(() => {
    testData = [
      { id: 1, name: 'John Doe', age: 30, status: 'active', tags: ['developer', 'lead'] },
      { id: 2, name: 'Jane Smith', age: 25, status: 'inactive', tags: ['designer'] },
      { id: 3, name: 'Bob Johnson', age: 35, status: 'active', tags: ['manager', 'lead'] },
      { id: 4, name: 'Alice Brown', age: 28, status: 'pending', tags: ['developer'] },
      { id: 5, name: 'Charlie Davis', age: null, status: 'active', tags: [] }
    ];
    queryEngine = new QueryEngine(testData, 'id');
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const engine = new QueryEngine();
      expect(engine.objects).toEqual([]);
      expect(engine.primaryKeyField).toBe('id');
    });

    it('should initialize with provided data and primary key', () => {
      const data = [{ customId: 1, name: 'test' }];
      const engine = new QueryEngine(data, 'customId');
      expect(engine.objects).toBe(data);
      expect(engine.primaryKeyField).toBe('customId');
    });
  });

  describe('setObjects', () => {
    it('should update the objects array', () => {
      const newData = [{ id: 99, name: 'New User' }];
      queryEngine.setObjects(newData);
      expect(queryEngine.objects).toBe(newData);
    });
  });

  describe('searchObjects', () => {
    it('should return all IDs for empty search', () => {
      const result = queryEngine.searchObjects('');
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should return all IDs for whitespace-only search', () => {
      const result = queryEngine.searchObjects('   ');
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should find objects by single search term', () => {
      const result = queryEngine.searchObjects('john');
      expect(result).toEqual([1, 3]); // John Doe, Bob Johnson
    });

    it('should find objects by multiple search terms', () => {
      const result = queryEngine.searchObjects('john active');
      expect(result).toEqual([1, 3]); // Both John Doe and Bob Johnson are active
    });

    it('should handle case-insensitive search', () => {
      const result = queryEngine.searchObjects('JANE');
      expect(result).toEqual([2]);
    });

    it('should return empty array when no matches found', () => {
      const result = queryEngine.searchObjects('nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('parseCondition', () => {
    it('should parse simple equality condition', () => {
      const result = queryEngine.parseCondition('name = "John Doe"');
      expect(result).toEqual({
        field: 'name',
        operator: '=',
        value: 'John Doe'
      });
    });

    it('should parse inequality condition', () => {
      const result = queryEngine.parseCondition('age != 30');
      expect(result).toEqual({
        field: 'age',
        operator: '!=',
        value: 30
      });
    });

    it('should parse greater than condition', () => {
      const result = queryEngine.parseCondition('age > 25');
      expect(result).toEqual({
        field: 'age',
        operator: '>',
        value: 25
      });
    });

    it('should parse less than condition', () => {
      const result = queryEngine.parseCondition('age < 35');
      expect(result).toEqual({
        field: 'age',
        operator: '<',
        value: 35
      });
    });

    it('should parse IN condition', () => {
      const result = queryEngine.parseCondition('status IN ["active", "pending"]');
      expect(result).toEqual({
        field: 'status',
        operator: 'IN',
        value: ['active', 'pending']
      });
    });

    it('should parse IN condition with NULL', () => {
      const result = queryEngine.parseCondition('age IN ["30", NULL]');
      expect(result).toEqual({
        field: 'age',
        operator: 'IN',
        value: ['30', null]
      });
    });

    it('should parse boolean values', () => {
      const trueResult = queryEngine.parseCondition('active = true');
      expect(trueResult.value).toBe(true);

      const falseResult = queryEngine.parseCondition('active = false');
      expect(falseResult.value).toBe(false);
    });

    it('should parse NULL value', () => {
      const result = queryEngine.parseCondition('age = NULL');
      expect(result.value).toBe(null);
    });

    it('should parse numeric values', () => {
      const result = queryEngine.parseCondition('score = 95.5');
      expect(result.value).toBe(95.5);
    });

    it('should throw error for invalid condition', () => {
      expect(() => {
        queryEngine.parseCondition('invalid condition format');
      }).toThrow('Invalid condition: invalid condition format');
    });
  });

  describe('applyCondition', () => {
    const testObj = { id: 1, name: 'John', age: 30, status: 'active', tags: ['dev', 'lead'], score: null };

    it('should handle equality operator', () => {
      expect(queryEngine.applyCondition(testObj, { field: 'name', operator: '=', value: 'John' })).toBe(true);
      expect(queryEngine.applyCondition(testObj, { field: 'name', operator: '=', value: 'Jane' })).toBe(false);
    });

    it('should handle equality with null values', () => {
      expect(queryEngine.applyCondition(testObj, { field: 'score', operator: '=', value: null })).toBe(true);
      expect(queryEngine.applyCondition(testObj, { field: 'name', operator: '=', value: null })).toBe(false);
    });

    it('should handle equality with array fields', () => {
      expect(queryEngine.applyCondition(testObj, { field: 'tags', operator: '=', value: 'dev' })).toBe(true);
      expect(queryEngine.applyCondition(testObj, { field: 'tags', operator: '=', value: 'designer' })).toBe(false);
    });

    it('should handle inequality operator', () => {
      expect(queryEngine.applyCondition(testObj, { field: 'name', operator: '!=', value: 'Jane' })).toBe(true);
      expect(queryEngine.applyCondition(testObj, { field: 'name', operator: '!=', value: 'John' })).toBe(false);
    });

    it('should handle inequality with null values', () => {
      expect(queryEngine.applyCondition(testObj, { field: 'score', operator: '!=', value: null })).toBe(false);
      expect(queryEngine.applyCondition(testObj, { field: 'name', operator: '!=', value: null })).toBe(true);
    });

    it('should handle inequality with array fields', () => {
      expect(queryEngine.applyCondition(testObj, { field: 'tags', operator: '!=', value: 'designer' })).toBe(true);
      expect(queryEngine.applyCondition(testObj, { field: 'tags', operator: '!=', value: 'dev' })).toBe(false);
    });

    it('should handle greater than operator', () => {
      expect(queryEngine.applyCondition(testObj, { field: 'age', operator: '>', value: 25 })).toBe(true);
      expect(queryEngine.applyCondition(testObj, { field: 'age', operator: '>', value: 35 })).toBe(false);
    });

    it('should handle greater than with null values', () => {
      expect(queryEngine.applyCondition(testObj, { field: 'score', operator: '>', value: 0 })).toBe(false);
    });

    it('should handle greater than with array fields', () => {
      expect(queryEngine.applyCondition(testObj, { field: 'tags', operator: '>', value: 1 })).toBe(false);
    });

    it('should handle less than operator', () => {
      expect(queryEngine.applyCondition(testObj, { field: 'age', operator: '<', value: 35 })).toBe(true);
      expect(queryEngine.applyCondition(testObj, { field: 'age', operator: '<', value: 25 })).toBe(false);
    });

    it('should handle less than with null values', () => {
      expect(queryEngine.applyCondition(testObj, { field: 'score', operator: '<', value: 100 })).toBe(false);
    });

    it('should handle less than with array fields', () => {
      expect(queryEngine.applyCondition(testObj, { field: 'tags', operator: '<', value: 5 })).toBe(false);
    });

    it('should handle IN operator', () => {
      expect(queryEngine.applyCondition(testObj, { field: 'status', operator: 'IN', value: ['active', 'pending'] })).toBe(true);
      expect(queryEngine.applyCondition(testObj, { field: 'status', operator: 'IN', value: ['inactive', 'pending'] })).toBe(false);
    });

    it('should handle IN operator with null values in list', () => {
      expect(queryEngine.applyCondition(testObj, { field: 'score', operator: 'IN', value: ['active', null] })).toBe(true);
      expect(queryEngine.applyCondition(testObj, { field: 'name', operator: 'IN', value: ['Jane', null] })).toBe(false);
    });

    it('should handle IN operator with null object value', () => {
      expect(queryEngine.applyCondition(testObj, { field: 'score', operator: 'IN', value: ['active', 'pending'] })).toBe(false);
    });

    it('should handle IN operator with array fields', () => {
      expect(queryEngine.applyCondition(testObj, { field: 'tags', operator: 'IN', value: ['dev', 'designer'] })).toBe(true);
      expect(queryEngine.applyCondition(testObj, { field: 'tags', operator: 'IN', value: ['manager', 'designer'] })).toBe(false);
    });

    it('should return false for unknown operator', () => {
      expect(queryEngine.applyCondition(testObj, { field: 'name', operator: 'UNKNOWN', value: 'John' })).toBe(false);
    });
  });

  describe('processGroup', () => {
    const testObj = { id: 1, name: 'John', age: 30, status: 'active' };

    it('should handle single condition', () => {
      const result = queryEngine.processGroup(testObj, 'name = "John"');
      expect(result).toBe(true);
    });

    it('should handle AND conditions', () => {
      const result = queryEngine.processGroup(testObj, 'name = "John" AND age = 30');
      expect(result).toBe(true);

      const result2 = queryEngine.processGroup(testObj, 'name = "John" AND age = 25');
      expect(result2).toBe(false);
    });

    it('should handle OR conditions', () => {
      const result = queryEngine.processGroup(testObj, 'name = "Jane" OR age = 30');
      expect(result).toBe(true);

      const result2 = queryEngine.processGroup(testObj, 'name = "Jane" OR age = 25');
      expect(result2).toBe(false);
    });

    it('should handle complex conditions with AND and OR', () => {
      const result = queryEngine.processGroup(testObj, 'name = "Jane" OR age = 30 AND status = "active"');
      expect(result).toBe(true);
    });

    it('should handle boolean literals', () => {
      expect(queryEngine.processGroup(testObj, 'true')).toBe(true);
      expect(queryEngine.processGroup(testObj, 'false')).toBe(false);
    });

    it('should throw error for invalid condition', () => {
      expect(() => {
        queryEngine.processGroup(testObj, 'invalid condition');
      }).toThrow('Invalid condition: invalid condition');
    });
  });

  describe('evaluateExpression', () => {
    const testObj = { id: 1, name: 'John', age: 30, status: 'active' };

    it('should return true for empty expression', () => {
      expect(queryEngine.evaluateExpression(testObj, '')).toBe(true);
      expect(queryEngine.evaluateExpression(testObj, '   ')).toBe(true);
    });

    it('should handle simple expression', () => {
      expect(queryEngine.evaluateExpression(testObj, 'name = "John"')).toBe(true);
      expect(queryEngine.evaluateExpression(testObj, 'name = "Jane"')).toBe(false);
    });

    it('should handle expressions with parentheses', () => {
      const result = queryEngine.evaluateExpression(testObj, '(name = "John" OR name = "Jane") AND age = 30');
      expect(result).toBe(true);
    });

    it('should handle nested parentheses', () => {
      const result = queryEngine.evaluateExpression(testObj, '((name = "John" AND age = 30) OR status = "inactive")');
      expect(result).toBe(true);
    });
  });

  describe('filterObjects', () => {
    it('should return all IDs for empty query', () => {
      const result = queryEngine.filterObjects('');
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should perform search when no operators present', () => {
      const result = queryEngine.filterObjects('john');
      expect(result).toEqual([1, 3]); // John Doe, Bob Johnson
    });

    it('should perform structured query when operators present', () => {
      const result = queryEngine.filterObjects('status = "active"');
      expect(result).toEqual([1, 3, 5]);
    });

    it('should handle complex queries', () => {
      const result = queryEngine.filterObjects('status = "active" AND age > 29');
      expect(result).toEqual([1, 3]); // John Doe (30), Bob Johnson (35)
    });

    it('should handle IN queries', () => {
      const result = queryEngine.filterObjects('status IN ["active", "pending"]');
      expect(result).toEqual([1, 3, 4, 5]);
    });

    it('should throw error for invalid query', () => {
      expect(() => {
        queryEngine.filterObjects('field AND');
      }).toThrow();
    });

    it('should handle queries with null values', () => {
      const result = queryEngine.filterObjects('age = NULL');
      expect(result).toEqual([5]); // Charlie Davis has null age
    });
  });
});