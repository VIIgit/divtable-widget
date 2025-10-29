# DivTable Widget

A modern, flexible table widget built with CSS Grid and Flexbox instead of HTML tables, featuring Monaco Editor integration for advanced query capabilities.

![alt](demo.gif)

## Features

- **Modern CSS-based Layout**: Uses CSS Grid and Flexbox for flexible, responsive design
- **Advanced Query Language**: Monaco Editor integration with intelligent autocomplete and syntax highlighting
- **Virtual Scrolling**: Efficiently handle large datasets with pagination support
- **Auto-Fetch**: Automated pagination with play/pause/resume controls
- **Grouping & Sorting**: Multi-level grouping with 4-state sorting (alphabetical asc/desc, count asc/desc)
- **Selection Management**: Single and multi-row selection with checkbox support
- **Filter Selected Rows**: Toggle to show only selected rows
- **Loading States**: Configurable loading placeholders and progress indicators with visual feedback
- **Keyboard Navigation**: Full keyboard accessibility with arrow key navigation
- **Responsive Design**: Adaptive column sizing and mobile-friendly layout
- **Composite Columns**: Stack multiple fields in one column or create two-line headers

## Installation

```bash
npm install divtable-widget monaco-editor
```

## Quick Start

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="node_modules/divtable-widget/src/div-table.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs/loader.min.js"></script>
</head>
<body>
  <div id="table-container"></div>
  
  <script src="node_modules/divtable-widget/src/query.js"></script>
  <script src="node_modules/divtable-widget/src/div-table.js"></script>
  <script>
    // Initialize Monaco Editor
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs' }});
    require(['vs/editor/editor.main'], function() {
      const divTable = new DivTable(monaco, {
        tableWidgetElement: document.getElementById('table-container'),
        columns: [
          { field: 'id', header: 'ID', primaryKey: true },
          { field: 'name', header: 'Name' },
          { field: 'email', header: 'Email' },
          { field: 'status', header: 'Status' }
        ],
        data: [
          { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' }
        ],
        showCheckboxes: true,
        multiSelect: true,
        onSelectionChange: (selectedRows) => {
          console.log('Selected:', selectedRows);
        }
      });
    });
  </script>
</body>
</html>
```

### With Virtual Scrolling

```javascript
const divTable = new DivTable(monaco, {
  tableWidgetElement: document.getElementById('table-container'),
  columns: [
    { field: 'id', header: 'ID', primaryKey: true },
    { field: 'name', header: 'Name' },
    { field: 'age', header: 'Age' }
  ],
  virtualScrolling: true,
  pageSize: 100,
  totalRecords: 10000,
  showAutoFetchButton: true,
  autoFetchDelay: 500,
  onNextPage: async () => {
    const nextPage = await fetchDataFromServer(currentPage + 1);
    divTable.appendData(nextPage);
  }
});
```

## Configuration Options

### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tableWidgetElement` | HTMLElement | **required** | Container element for the table |
| `columns` | Array | **required** | Column definitions (see Column Configuration) |
| `data` | Array | `[]` | Initial data array. If not provided and `onNextPage` is available, first page will be loaded automatically |
| `showCheckboxes` | Boolean | `true` | Show selection checkboxes |
| `multiSelect` | Boolean | `true` | Allow multiple row selection |
| `primaryKeyField` | String | `'id'` | Field to use as primary key (auto-detected from columns if not specified) |

### Virtual Scrolling Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `virtualScrolling` | Boolean | `false` | Enable virtual scrolling mode for large datasets |
| `pageSize` | Number | `100` | Number of rows per page |
| `totalRecords` | Number | `pageSize * 10` | Total number of records available (for progress calculation) |
| `loadingThreshold` | Number | `pageSize * 0.8` | Trigger loading when this many rows from end |
| `scrollThreshold` | Number | `0.95` | Fallback percentage-based scroll threshold |
| `showAutoFetchButton` | Boolean | `true` | Show auto-fetch play/pause/resume button |
| `autoFetchDelay` | Number | `500` | Delay between auto-fetch requests (milliseconds) |

### UI Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showLoadingPlaceholder` | Boolean | `true` | Show loading skeleton when no data is present |
| `showRefreshButton` | Boolean | `false` | Show refresh button in info section |

### Callbacks

| Option | Type | Parameters | Description |
|--------|------|------------|-------------|
| `onSelectionChange` | Function | `(selectedRows)` | Called when row selection changes. Receives array of selected data objects |
| `onRowFocus` | Function | `(rowData, groupInfo)` | Called when a row or group header receives focus |
| `onNextPage` | Function | `(page, pageSize)` | Called to load next page of data. Should return array of records or Promise |
| `onPreviousPage` | Function | `(page, pageSize)` | Called to load previous page (optional) |
| `onRefresh` | Function | `()` | Called when refresh button is clicked. Should reload data |

## Query Language

The widget includes a powerful query language with Monaco Editor integration:

### Syntax

```
field operator value [AND/OR field operator value]
```

### Operators

- `=` - Equals
- `!=` - Not equals
- `>` - Greater than
- `<` - Less than
- `>=` - Greater than or equal
- `<=` - Less than or equal
- `CONTAINS` - String contains (case-insensitive)
- `STARTS_WITH` - String starts with
- `ENDS_WITH` - String ends with
- `IN` - Value in list: `status IN (active, pending)`
- `BETWEEN` - Value in range: `age BETWEEN (18, 65)`

### Examples

```
status = "active"
age > 18 AND status = "active"
name CONTAINS "John"
created_at BETWEEN (2024-01-01, 2024-12-31)
status IN (active, pending, review)
```

## Keyboard Navigation

The widget provides full keyboard accessibility:

### Navigation Keys

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate between rows and group headers |
| `→` | Expand collapsed group (when focused on group header) |
| `←` | Collapse expanded group (when focused on group header) |
| `Space` / `Enter` | Toggle selection of focused row or group |
| `Tab` | Navigate between checkboxes (if enabled) |

### Focus Behavior

- When checkboxes are enabled, focus moves to the checkbox element
- When checkboxes are disabled, focus moves to the row element
- Group headers are always focusable and can be expanded/collapsed with arrow keys
- Selection changes trigger the `onSelectionChange` callback
- Focus changes trigger the `onRowFocus` callback

## API Methods

### Data Management

```javascript
// Apply a query filter to the data
divTable.applyQuery('status = "active" AND age > 18');

// Add a single record (upsert - updates if exists, adds if new)
divTable.addRecord({ id: 1, name: 'John Doe', email: 'john@example.com' });

// Remove a record by ID
const removedRecord = divTable.removeRecord(1);

// Refresh the table data (reloads from onNextPage if virtual scrolling)
await divTable.refresh();
```

### Selection

```javascript
// Get selected rows (returns array of data objects)
const selected = divTable.getSelectedRows();

// Toggle filter to show only selected rows
divTable.toggleSelectedRowsFilter(true);  // Show only selected
divTable.toggleSelectedRowsFilter(false); // Show all rows
divTable.toggleSelectedRowsFilter();      // Toggle current state

// Clear all selections
divTable.clearSelection();
```

### Grouping and Sorting

```javascript
// Group by a field
divTable.group('category');

// Clear grouping
divTable.clearGrouping();

// Sort by a field
divTable.sort('name', 'asc'); // 'asc' or 'desc'
divTable.sort('age');         // Toggles between asc/desc

// For grouped fields, sorting cycles through 4 states:
// 1. Sort groups alphabetically ascending (↑ₐ)
// 2. Sort groups alphabetically descending (↓z)
// 3. Sort groups by count ascending (↑₁)
// 4. Sort groups by count descending (↓₉)
// 5. Back to no sort
```

### Auto-Fetch Controls

```javascript
// The auto-fetch feature automatically loads pages with play/pause/resume controls
// These methods are called internally by the UI buttons, but can also be called programmatically:

// Start auto-fetching all pages
divTable.startAutoFetch();

// Stop auto-fetching
divTable.stopAutoFetch();

// Note: Pause/resume is handled automatically by the UI button
// The isAutoFetching and autoFetchPaused properties track the state
```

## Column Configuration

### Basic Column

```javascript
{
  field: 'name',           // Data field name (required)
  label: 'Full Name',      // Display header (optional, defaults to field)
  primaryKey: false,       // Is this the primary key? (required for one column)
  hidden: false,           // Hide column (default: false)
  groupable: true,         // Allow grouping by this column (default: true)
  render: (value, item) => `<strong>${value}</strong>` // Custom render function
}
```

### Advanced Column Features

#### Responsive Sizing

```javascript
{
  field: 'description',
  label: 'Description',
  responsive: {
    size: 'flexible-large' // 'fixed-narrow' (80px), 'fixed-medium' (120px),
                          // 'flexible-small' (1fr), 'flexible-medium' (2fr),
                          // 'flexible-large' (3fr)
  }
}
```

#### Composite Columns (Multiple Fields in One Column)

```javascript
// Stack multiple fields vertically in one column
{
  field: 'firstName',
  label: 'First Name',
  fieldCompositeName: 'fullName'
},
{
  field: 'lastName',
  label: 'Last Name',
  fieldCompositeName: 'fullName'
}
```

#### Compound Columns (Two-Line Headers)

```javascript
// Display two labels for one field (main label + sub label)
{
  field: 'price',
  label: 'Product Price',
  subLabel: 'USD',
  subField: 'currency' // Optional: allows sorting by subField
}
```

### Column Render Function

Custom rendering for cell values:

```javascript
{
  field: 'status',
  label: 'Status',
  render: (value, item) => {
    const colors = { active: 'green', inactive: 'red', pending: 'orange' };
    return `<span style="color: ${colors[value]}">${value}</span>`;
  }
}
```

### Column Types

The widget automatically detects and handles different data types based on the data:

- **Strings**: Text data with CONTAINS, STARTS_WITH, ENDS_WITH operators
- **Numbers**: Numeric data with comparison operators (>, <, >=, <=)
- **Dates**: Date/time values with BETWEEN operator
- **Booleans**: True/false values with = operator
- **Arrays**: Array values are joined with commas for display

## Styling

The widget uses CSS variables for easy customization:

```css
.div-table-widget {
  --table-border-color: #e0e0e0;
  --header-bg-color: #f5f5f5;
  --row-hover-color: #f9f9f9;
  --selected-row-color: #e3f2fd;
}
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions

## License

Apache License 2.0

Copyright 2025 DivTable Widget Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

### Version 1.0.0

- Initial release
- Core table functionality with CSS Grid/Flexbox layout
- Monaco Editor integration for query language
- Virtual scrolling support
- Auto-fetch pagination
- Grouping and sorting
- Selection management
- Keyboard navigation
