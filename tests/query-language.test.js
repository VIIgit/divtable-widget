const { describe, it, expect, beforeEach } = require('@jest/globals');
const { createMockMonaco } = require('./test-utils');

// Import source files
const fs = require('fs');
const path = require('path');

// Load the source files
const querySource = fs.readFileSync(path.join(__dirname, '../src/query.js'), 'utf8');

// Execute the source code to make functions available
eval(querySource);

describe('Query Language Functions', () => {
  let mockMonaco;
  let mockContainer;
  let fieldNames;

  beforeEach(() => {
    mockMonaco = global.monaco;
    
    mockContainer = document.createElement('div');
    document.body.appendChild(mockContainer);

    fieldNames = {
      'id': { type: 'number', label: 'ID' },
      'name': { type: 'string', label: 'Name' },
      'age': { type: 'number', label: 'Age' },
      'status': { type: 'string', label: 'Status', values: ['active', 'inactive', 'pending'] },
      'isActive': { type: 'boolean', label: 'Is Active' }
    };
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
  });

  describe('setupLanguageConfiguration', () => {
    it('should set up language configuration for Monaco', () => {
      const languageId = 'test-query-lang';
      
      setupLanguageConfiguration(mockMonaco, languageId);

      expect(mockMonaco.languages.setLanguageConfiguration).toHaveBeenCalledWith(
        languageId,
        expect.objectContaining({
          autoClosingPairs: expect.arrayContaining([
            { open: '(', close: ')' },
            { open: '[', close: ']' },
            { open: '"', close: '"' },
            { open: "'", close: "'" }
          ]),
          surroundingPairs: expect.arrayContaining([
            { open: '(', close: ')' },
            { open: '[', close: ']' },
            { open: '"', close: '"' },
            { open: "'", close: "'" }
          ])
        })
      );
    });
  });

  describe('setupEditorTheme', () => {
    it('should define query theme for Monaco', () => {
      setupEditorTheme(mockMonaco);

      expect(mockMonaco.editor.defineTheme).toHaveBeenCalledWith(
        'queryTheme',
        expect.objectContaining({
          base: 'vs',
          inherit: true,
          rules: expect.arrayContaining([
            expect.objectContaining({ token: 'identifier' }),
            expect.objectContaining({ token: 'operator' }),
            expect.objectContaining({ token: 'boolean' }),
            expect.objectContaining({ token: 'number' }),
            expect.objectContaining({ token: 'string' }),
            expect.objectContaining({ token: 'keyword' })
          ])
        })
      );
    });
  });

  describe('generateUniqueLanguageId', () => {
    it('should generate unique language IDs', () => {
      const id1 = generateUniqueLanguageId(fieldNames);
      const id2 = generateUniqueLanguageId(fieldNames);
      
      expect(id1).toMatch(/^querylang-\d+-\d+$/);
      expect(id2).toMatch(/^querylang-\d+-\d+$/);
      expect(id1).not.toBe(id2);
    });

    it('should include field hash in language ID for different field sets', () => {
      const fields1 = { name: { type: 'string' } };
      const fields2 = { age: { type: 'number' } };
      
      const id1 = generateUniqueLanguageId(fields1);
      const id2 = generateUniqueLanguageId(fields2);
      
      expect(id1).not.toBe(id2);
    });
  });

  describe('setupQueryLanguage', () => {
    it('should register new language and set up features', () => {
      const result = setupQueryLanguage(mockMonaco, { fieldNames });

      expect(result).toHaveProperty('languageId');
      expect(result).toHaveProperty('setupAutoInsertBrackets');
      expect(result).toHaveProperty('dispose');
      
      expect(mockMonaco.languages.register).toHaveBeenCalledWith({
        id: result.languageId
      });

      expect(mockMonaco.languages.registerCompletionItemProvider).toHaveBeenCalled();
    });

    it('should only set up theme once', () => {
      // Create a fresh Monaco mock for this test
      const testMonaco = createMockMonaco();
      testMonaco.editor.defineTheme = jest.fn();
      
      setupQueryLanguage(testMonaco, { fieldNames });
      setupQueryLanguage(testMonaco, { fieldNames });

      // Theme should only be set up once
      expect(testMonaco.editor.defineTheme).toHaveBeenCalledTimes(1);
    });
  });

  describe('createQueryEditor', () => {
    it('should create editor with default options', () => {
      const result = createQueryEditor(mockMonaco, mockContainer);

      expect(result).toHaveProperty('editor');
      expect(result).toHaveProperty('model');
      expect(mockMonaco.editor.create).toHaveBeenCalled();
      expect(mockMonaco.editor.createModel).toHaveBeenCalled();
    });

    it('should create editor with custom options', () => {
      const options = {
        fieldNames,
        initialValue: 'name = "test"',
        placeholder: 'Enter query here',
        showClearButton: true
      };

      const result = createQueryEditor(mockMonaco, mockContainer, options);

      expect(result).toHaveProperty('editor');
      expect(result).toHaveProperty('model');
      
      // Should create model with initial value
      expect(mockMonaco.editor.createModel).toHaveBeenCalledWith(
        'name = "test"',
        expect.any(String)
      );
    });

    it('should set up clear button when enabled', () => {
      const result = createQueryEditor(mockMonaco, mockContainer, {
        fieldNames,
        showClearButton: true
      });

      // Check that clear button is created in the wrapper
      const wrapper = mockContainer.querySelector('.monaco-editor-wrapper');
      expect(wrapper).not.toBeNull();
      
      const clearButton = wrapper.querySelector('.query-clear-button');
      expect(clearButton).not.toBeNull();
      expect(clearButton.innerHTML).toBe('✕');
    });

    it('should not create clear button when disabled', () => {
      const result = createQueryEditor(mockMonaco, mockContainer, {
        fieldNames,
        showClearButton: false
      });

      const wrapper = mockContainer.querySelector('.monaco-editor-wrapper');
      const clearButton = wrapper?.querySelector('.query-clear-button');
      expect(clearButton).toBeNull();
    });

    it('should add methods to editor instance', () => {
      const result = createQueryEditor(mockMonaco, mockContainer, { fieldNames });

      expect(result.editor.updateFieldNames).toBeInstanceOf(Function);
      expect(result.editor.getFieldNames).toBeInstanceOf(Function);
      expect(result.editor.languageId).toBeDefined();
    });
  });

  describe('updateQueryEditorFieldNames', () => {
    it('should update field names for existing language', () => {
      const languageSetup = setupQueryLanguage(mockMonaco, { fieldNames });
      const newFieldNames = {
        newField: { type: 'string', label: 'New Field' }
      };

      const result = updateQueryEditorFieldNames(
        mockMonaco, 
        languageSetup.languageId, 
        newFieldNames
      );

      expect(result).toBe(true);
    });

    it('should return false for non-existent language', () => {
      const result = updateQueryEditorFieldNames(
        mockMonaco, 
        'non-existent-language', 
        fieldNames
      );

      expect(result).toBe(false);
    });
  });

  describe('getQueryEditorFieldNames', () => {
    it('should return field names for existing language', () => {
      const languageSetup = setupQueryLanguage(mockMonaco, { fieldNames });
      
      const result = getQueryEditorFieldNames(languageSetup.languageId);

      expect(result).toEqual(fieldNames);
    });

    it('should return null for non-existent language', () => {
      const result = getQueryEditorFieldNames('non-existent-language');

      expect(result).toBeNull();
    });
  });

  describe('editor integration', () => {
    let editor;

    beforeEach(() => {
      const result = createQueryEditor(mockMonaco, mockContainer, { fieldNames });
      editor = result.editor;
    });

    it('should have proper editor structure', () => {
      const wrapper = mockContainer.querySelector('.monaco-editor-wrapper');
      expect(wrapper).not.toBeNull();
      
      const editorContainer = wrapper.querySelector('div[style*="flex: 1"]');
      expect(editorContainer).not.toBeNull();
    });

    it('should handle editor methods', () => {
      expect(() => {
        editor.updateFieldNames({ newField: { type: 'string' } });
      }).not.toThrow();

      expect(() => {
        const fields = editor.getFieldNames();
      }).not.toThrow();
    });
  });

  describe('completion provider setup', () => {
    it('should register completion provider', () => {
      setupCompletionProvider(mockMonaco, { fieldNames, languageId: 'test-lang' });

      expect(mockMonaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
        'test-lang',
        expect.objectContaining({
          provideCompletionItems: expect.any(Function)
        })
      );
    });
  });

  describe('validation setup', () => {
    it('should set up validation for language', () => {
      const result = setupValidation(mockMonaco, { 
        fieldNames, 
        languageId: 'test-lang' 
      });

      expect(result).toBeDefined();
    });

    it('should not duplicate validation setup for same language', () => {
      const result1 = setupValidation(mockMonaco, { 
        fieldNames, 
        languageId: 'test-lang' 
      });
      
      const result2 = setupValidation(mockMonaco, { 
        fieldNames, 
        languageId: 'test-lang' 
      });

      expect(result1).toBe(result2);
    });
  });

  describe('token provider setup', () => {
    it('should set up token provider', () => {
      setupTokenProvider(mockMonaco, { fieldNames, languageId: 'test-lang' });

      expect(mockMonaco.languages.setMonarchTokensProvider).toHaveBeenCalledWith(
        'test-lang',
        expect.objectContaining({
          tokenizer: expect.any(Object)
        })
      );
    });
  });

  describe('field name utilities', () => {
    it('should handle different field types', () => {
      const mixedFields = {
        stringField: { type: 'string', label: 'String Field' },
        numberField: { type: 'number', label: 'Number Field' },
        booleanField: { type: 'boolean', label: 'Boolean Field' },
        enumField: { type: 'string', label: 'Enum Field', values: ['a', 'b', 'c'] }
      };

      expect(() => {
        setupQueryLanguage(mockMonaco, { fieldNames: mixedFields });
      }).not.toThrow();
    });

    it('should handle empty field names', () => {
      expect(() => {
        setupQueryLanguage(mockMonaco, { fieldNames: {} });
      }).not.toThrow();
    });

    it('should handle undefined field names', () => {
      expect(() => {
        setupQueryLanguage(mockMonaco, {});
      }).not.toThrow();
    });
  });
});