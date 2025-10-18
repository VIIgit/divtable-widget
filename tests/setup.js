require('@testing-library/jest-dom');

// Load source modules
try {
  const divTableModule = require('../src/div-table.js');
  const queryModule = require('../src/query.js');
  
  // Make classes and functions globally available for tests
  global.DivTable = divTableModule.DivTable;
  global.QueryEngine = divTableModule.QueryEngine;
  global.setupQueryLanguage = queryModule.setupQueryLanguage;
  global.createQueryEditor = queryModule.createQueryEditor;
  global.updateQueryEditorFieldNames = queryModule.updateQueryEditorFieldNames;
  global.getQueryEditorFieldNames = queryModule.getQueryEditorFieldNames;
} catch (error) {
  console.error('Error loading modules:', error);
}
global.monaco = {
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

// Mock CSS imports
jest.mock('../src/div-table.css', () => ({}));

// Setup DOM environment
document.body.innerHTML = '';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));