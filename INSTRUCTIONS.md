# DivTable Widget — AI Integration Guide

> Comprehensive reference for configuring and customising the DivTable widget.
> Designed for both human developers and AI coding assistants.

---

## Quick Start (CDN)

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vii7/div-table-widget@latest/src/div-table.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs/loader.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@vii7/div-table-widget@latest/src/query.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@vii7/div-table-widget@latest/src/div-table.js"></script>
</head>
<body>
  <div id="my-table"></div>
  <script>
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs' }});
    require(['vs/editor/editor.main'], function () {
      const table = new DivTable(monaco, {
        tableWidgetElement: document.getElementById('my-table'),
        columns: [
          { field: 'id', label: 'ID', primaryKey: true },
          { field: 'name', label: 'Name' }
        ],
        data: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ]
      });
    });
  </script>
</body>
</html>
```

---

## Constructor

```js
const table = new DivTable(monaco, options);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `monaco` | object | The global `monaco` object from Monaco Editor |
| `options` | object | Configuration object (see below) |

---

## Constructor Options

### Core

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tableWidgetElement` | HTMLElement | **required** | Container `<div>` for the widget |
| `data` | Array\|null | `[]` | Initial row data. Pass `null` to trigger auto-load of first page via `onNextPage` |
| `columns` | Array | `[]` | Column definitions (see Column Configuration) |
| `showCheckboxes` | boolean | `true` | Show row selection checkboxes |
| `multiSelect` | boolean | `true` | Allow selecting multiple rows |

### Grouping & Sorting

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `group` | string | – | Field name to group by on init (e.g. `'department'`) |
| `groupCollapsed` | boolean | `true` | Whether groups start collapsed (`true`) or expanded (`false`) when grouping is applied |
| `sort` | object | – | Initial sort: `{ field: 'name', direction: 'asc'\|'desc' }` |

### Virtual Scrolling

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `virtualScrolling` | boolean | `false` | Enable paginated virtual scrolling |
| `pageSize` | number | `100` | Records per page |
| `totalRecords` | number | `pageSize * 10` | Expected total (used for progress bar) |
| `loadingThreshold` | number | `pageSize * 0.8` | Trigger next-page load when within N records of the end |
| `scrollThreshold` | number | `0.95` | Fallback percentage-based trigger |
| `onNextPage` | async function | – | `async (page, pageSize) => Array` — return new rows or `[]` when done |

### Auto-Fetch

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showAutoFetchButton` | boolean | `true` | Show play/pause auto-fetch button |
| `autoFetchDelay` | number | `500` | Milliseconds between auto-fetch requests |

### UI / Loading

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showLoadingPlaceholder` | boolean | `true` | Show skeleton shimmer when data is empty |
| `showRefreshButton` | boolean | `false` | Show a ↻ refresh button in the toolbar |
| `fixedColumns` | number | `0` | Number of left columns to freeze |
| `lazyCellRendering` | boolean | `true` | Use IntersectionObserver for lazy cell rendering |
| `lazyRenderMargin` | string | `'200px'` | Pre-render margin for lazy rendering |

### Aggregates / Summaries

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showHeaderSummary` | boolean | `false` | Show grand total summary row below the header |
| `showGroupSummary` | boolean | `false` | Show subtotal summary row per group |

### Callbacks

| Option | Type | Description |
|--------|------|-------------|
| `onSelectionChange` | function | `(selectedRows: Array) => void` — fired on every selection change |
| `onRowFocus` | function | `(row: object\|null, group: object\|null) => void` — fired when a row/group receives focus |
| `onRefresh` | function | `() => void\|Promise` — called when refresh is triggered (non-virtual tables) |
| `groupRender` | function | `({ field, value, displayValue, count, items, collapsed }) => string` — custom HTML renderer for group header labels. If omitted, renders as `displayValue (count)`. |

---

## Column Configuration

Each entry in the `columns` array is an object:

### Identity & Type

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `field` | string | **required** | Data property name |
| `label` | string | `field` | Header text (supports HTML like `<br>`) |
| `primaryKey` | boolean | `false` | Mark as the primary key column |
| `type` | string | `'string'` | `'string'`, `'number'`, or `'boolean'` — affects query auto-complete and sorting |
| `hidden` | boolean | `false` | Column exists in data but is not rendered |

### Display

| Property | Type | Description |
|----------|------|-------------|
| `render` | function | `(value, row) => string` — custom HTML renderer for cell content |
| `align` | string | `'left'`, `'center'`, or `'right'` |

### Responsive

| Property | Type | Description |
|----------|------|-------------|
| `responsive` | object | `{ priority, size, hideMobile, hideSmall, allowWrap }` |
| `responsive.priority` | string | `'high'`, `'medium'`, `'low'` |
| `responsive.size` | string | Grid sizing: `'fixed-narrow'` (80px), `'fixed-medium'` (120px), `'flexible-small'` (1fr), `'flexible-medium'` (2fr), `'flexible-large'` (3fr) |

### Grouping

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `groupable` | boolean | `true` | Whether the column can be used for grouping |

### Composite Columns

| Property | Type | Description |
|----------|------|-------------|
| `fieldCompositeName` | string | Columns sharing the same value are stacked vertically inside one cell. The first column's `responsive.size` controls the cell width. |

### Aggregates

| Property | Type | Description |
|----------|------|-------------|
| `aggregate` | string | Aggregate function: `'sum'`, `'avg'`, `'count'`, `'min'`, `'max'` |
| `aggregateRender` | function | `(value) => string` — custom formatter for the aggregate value |

---

## Public Methods

### Data Management

| Method | Description |
|--------|-------------|
| `addRecord(record)` | Add or upsert a row (matched by primary key). Returns `true` on success. |
| `removeRecord(id)` | Remove a row by primary key. Returns removed object or `false`. |
| `appendData(newData)` | Append/upsert an array of rows. Returns `{ added, updated, skipped, invalid }`. |
| `replaceData(newData)` | Replace all data. Clears selections. Returns `{ success, validRecords, skipped, duplicates }`. |
| `resetToLoading()` | Clear all data and revert to loading placeholder state. |
| `setLoadingState(bool)` | Manually show/hide the loading placeholder. |
| `async refresh()` | Re-fetch data. For virtual tables: resets to page 0 and reloads. |

### Selection

| Method | Description |
|--------|-------------|
| `selectAll()` | Select all visible rows. |
| `clearSelection()` | Deselect all rows. |
| `getSelectedRows()` | Returns array of selected row objects. |
| `getValidSelectedCount()` | Returns count of selected rows that still exist in data. |
| `toggleSelectedRowsFilter(show?)` | Toggle or set whether only selected rows are shown. |
| `toggleRowSelection(index)` | Toggle selection of a specific row by index. |

### Grouping & Sorting

| Method | Description |
|--------|-------------|
| `group(field)` | Group by `field`. Groups start collapsed or expanded based on `groupCollapsed` option. |
| `clearGrouping()` | Remove grouping. |
| `sort(field, direction?)` | Sort by field. Direction defaults to `'asc'`. Grouped fields cycle: value-asc → value-desc → count-asc → count-desc. |

### Virtual Scrolling

| Method | Description |
|--------|-------------|
| `setTotalRecords(n)` | Update expected total records count. |
| `stopAutoFetch()` | Stop the auto-fetch loop. |

### Query

| Method | Description |
|--------|-------------|
| `applyQuery(queryString)` | Programmatically apply a filter query. |

### Column Accessors

| Method | Returns |
|--------|---------|
| `getOrderedColumns()` | Visible columns in display order. |
| `getCompositeColumns()` | Columns grouped by `fieldCompositeName`. |
| `getAllColumns()` | All column definitions (including hidden). |

---

## Query Language

The query bar (powered by Monaco Editor) supports **free-text search** and **structured queries**.

### Free-Text Search

Just type words — rows matching ALL terms across any field are shown:

```
john chicago
```

### Structured Queries

```
field operator value
```

#### Operators

| Operator | Example |
|----------|---------|
| `=` | `city = "New York"` |
| `!=` | `status != "inactive"` |
| `>` | `age > 30` |
| `<` | `salary < 50000` |
| `>=` | `age >= 25` |
| `<=` | `salary <= 100000` |
| `IN` | `city IN ["New York", "Chicago"]` |

#### Logical Operators

```
city = "New York" AND age > 25
status = true OR department = "Engineering"
(city = "Chicago" OR city = "Houston") AND active = true
```

#### Special Values

| Value | Meaning |
|-------|---------|
| `NULL` | Matches null, undefined, or empty string |
| `true` / `false` | Boolean comparison |
| Unquoted numbers | Numeric comparison |
| `"quoted string"` | Exact string match |

#### Array Fields

For fields containing arrays (e.g. `tags: ["a", "b"]`):
- `tags = "a"` → matches if array contains `"a"`
- `tags != "a"` → matches if array does NOT contain `"a"`
- `tags IN ["a", "c"]` → matches if any element is in the list

#### Monaco Editor Features

- **Autocomplete**: Field names and values auto-suggested
- **Syntax highlighting**: Operators, fields, values colour-coded
- **Validation**: Red underline on syntax errors

---

## Theming

### CSS Variable Reference

All variables are defined on `:root` in `div-table.css` and can be overridden per-theme.

#### Primary / Accent

| Variable | Default | Description |
|----------|---------|-------------|
| `--dt-primary` | `#007bff` | Primary accent colour |
| `--dt-primary-hover` | `#0056b3` | Primary hover state |
| `--dt-primary-light` | `rgba(0,123,255,0.1)` | Primary tint background |
| `--dt-primary-lighter` | `rgba(0,123,255,0.05)` | Even lighter primary tint |
| `--dt-focus-ring` | `rgba(3,102,214,0.1)` | Focus ring colour |

#### Backgrounds

| Variable | Default | Description |
|----------|---------|-------------|
| `--dt-bg-base` | `#ffffff` | Base widget background |
| `--dt-bg-light` | `#f9f9f7` | Light background (alt rows) |
| `--dt-bg-hover` | `rgb(240,247,255)` | Row hover |
| `--dt-bg-selected` | `rgba(0,123,255,0.1)` | Selected row |
| `--dt-bg-header` | `#f9f9f7` | Header row |
| `--dt-bg-summary` | `#f9f9f7` | Summary row |
| `--dt-bg-disabled` | `#f0f0f0` | Disabled state |

#### Borders

| Variable | Default |
|----------|---------|
| `--dt-border-light` | `#e9ecef` |
| `--dt-border-medium` | `#e1e5e9` |
| `--dt-border-dark` | `#ced4da` |
| `--dt-border-row` | `#f1f3f4` |
| `--dt-border-focus` | `#123a67` |
| `--dt-border-hover` | `#b0b8c1` |

#### Text

| Variable | Default |
|----------|---------|
| `--dt-text-primary` | `#374151` |
| `--dt-text-secondary` | `#495057` |
| `--dt-text-muted` | `#6b7280` |
| `--dt-text-light` | `#666666` |
| `--dt-text-disabled` | `#999999` |
| `--dt-text-inverse` | `#ffffff` |

#### Shadows

| Variable | Default |
|----------|---------|
| `--dt-shadow` | `rgba(0,0,0,0.1)` |
| `--dt-shadow-medium` | `rgba(0,0,0,0.12)` |
| `--dt-shadow-heavy` | `rgba(0,0,0,0.15)` |

#### Error / Success / Warning / Info

| Variable | Default | Description |
|----------|---------|-------------|
| `--dt-error` | `#dc3545` | Error accent |
| `--dt-error-bg` | `#fff5f5` | Error background |
| `--dt-success` | `#28a745` | Success accent |
| `--dt-success-bg` | `#e8f5e9` | Success background |
| `--dt-warning` | `#ffc107` | Warning accent |
| `--dt-info` | `#0ea5e9` | Info accent |

#### UI Element Colours

| Variable | Default | Description |
|----------|---------|-------------|
| `--dt-button-bg` | `#f0f0f0` | Button background |
| `--dt-button-bg-hover` | `#e0e0e0` | Button hover |
| `--dt-button-text` | `#333333` | Button text |
| `--dt-scrollbar-track` | `#f1f1f1` | Scrollbar track |
| `--dt-scrollbar-thumb` | `#c1c1c1` | Scrollbar thumb |
| `--dt-scrollbar-thumb-hover` | `#a8a8a8` | Scrollbar thumb hover |
| `--dt-spinner-track` | `#e3e3e3` | Spinner track |
| `--dt-spinner-active` | `#666666` | Spinner active arc |
| `--dt-skeleton-base` | `#e9ecef` | Skeleton loading base |
| `--dt-skeleton-shine` | `#f8f9fa` | Skeleton shimmer |
| `--dt-group-bg` | `rgba(249,249,247,0.5)` | Group header row |
| `--dt-summary-border` | `#adb5bd` | Summary row border |

### Built-in Themes

| Theme | CSS File | Activation |
|-------|----------|------------|
| Default (light) | `div-table.css` | No extra class needed |
| Dark | `div-table-theme-dark.css` | Add `class="theme-dark"` to widget container |
| Apple Light | `div-table-theme-apple.css` | Add `class="theme-apple"` to widget container |
| Apple Dark | `div-table-theme-apple.css` | Add `class="theme-apple dark"` to widget container |

### Creating a Custom Theme

```css
.theme-my-brand {
  --dt-primary: #6200ea;
  --dt-primary-hover: #3700b3;
  --dt-bg-base: #fafafa;
  --dt-bg-hover: #f3e5f5;
  --dt-bg-selected: rgba(98, 0, 234, 0.08);
  --dt-text-primary: #212121;
  --dt-border-light: #e0e0e0;
  /* ... override any variable from the table above ... */
}
```

Apply it:

```html
<div id="my-table" class="div-table-widget theme-my-brand"></div>
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate rows |
| `Space` | Toggle selection of focused row |
| `Enter` | Activate / expand group |
| `Escape` | Clear query editor focus |

---

## Recipes

### 1. Static Table with Grouping (Expanded)

```js
const table = new DivTable(monaco, {
  tableWidgetElement: document.getElementById('el'),
  data: myData,
  columns: myColumns,
  group: 'department',
  groupCollapsed: false,    // groups start expanded
  showGroupSummary: true
});
```

### 2. Static Table with Grouping (Collapsed — Default)

```js
const table = new DivTable(monaco, {
  tableWidgetElement: document.getElementById('el'),
  data: myData,
  columns: myColumns,
  group: 'department',
  // groupCollapsed defaults to true — groups start collapsed
  showGroupSummary: true
});
```

### 3. Custom Group Header Rendering

```js
const table = new DivTable(monaco, {
  tableWidgetElement: document.getElementById('el'),
  data: employees,
  columns: myColumns,
  group: 'department',
  groupCollapsed: false,
  showGroupSummary: true,
  groupRender: ({ field, value, displayValue, count, items, collapsed }) => {
    const avgSalary = items.reduce((s, r) => s + (r.salary || 0), 0) / count;
    const icon = value === 'Engineering' ? '⚙️' : value === 'Sales' ? '💼' : '📋';
    return `${icon} <strong>${displayValue}</strong> — ${count} people — avg $${Math.round(avgSalary).toLocaleString()}`;
  }
});
```

### 3. Virtual Scrolling with Auto-Fetch

```js
const table = new DivTable(monaco, {
  tableWidgetElement: el,
  data: null,                      // triggers auto-load of page 0
  columns: myColumns,
  virtualScrolling: true,
  pageSize: 100,
  totalRecords: 5000,
  showRefreshButton: true,
  showAutoFetchButton: true,
  autoFetchDelay: 800,
  onNextPage: async (page, pageSize) => {
    const res = await fetch(`/api/data?page=${page}&size=${pageSize}`);
    return await res.json();       // return [] when no more data
  }
});
```

### 4. Read-Only Table (No Checkboxes)

```js
const table = new DivTable(monaco, {
  tableWidgetElement: el,
  data: myData,
  columns: myColumns,
  showCheckboxes: false,
  multiSelect: false
});
```

### 5. Fixed (Frozen) Columns

```js
const table = new DivTable(monaco, {
  tableWidgetElement: el,
  data: myData,
  columns: myColumns,
  fixedColumns: 2        // freeze first 2 visible columns
});
```

### 6. Programmatic Operations

```js
// Apply filter
table.applyQuery('city = "Chicago" AND age > 25');

// Sort
table.sort('salary', 'desc');

// Group (will collapse groups by default)
table.group('department');

// Add / upsert a row
table.addRecord({ id: 99, name: 'New Person', city: 'Berlin' });

// Remove a row
table.removeRecord(99);

// Get selected rows
const selected = table.getSelectedRows();

// Refresh virtual table
await table.refresh();

// Replace all data
table.replaceData(freshDataArray);
```

---

## Demo Pages

| Page | Path | Description |
|------|------|-------------|
| Main demo | `examples/index.html` | Three tables: checkboxes, no-checkboxes with grouping, virtual scrolling with fixed columns |
| Apple theme | `examples/apple.html` | Apple HIG-inspired light/dark theme demo |
| Fullscreen | `examples/fullscreen.html` | Full-viewport table |

---

## Architecture Notes

- **No HTML tables** — layout uses CSS Grid for rows and Flexbox for cells.
- **Single JS class** (`DivTable`) in `src/div-table.js` (~6300 lines).
- **QueryEngine** in `src/query.js` — evaluates structured and free-text queries.
- **Monaco Editor** is loaded via CDN and used for the query input bar.
- **CSS variables** make every colour, shadow, and spacing customisable.
- **Lazy cell rendering** via `IntersectionObserver` keeps large tables performant.
- **Primary key** (`primaryKey: true` on a column, or defaults to `id`) is used internally for selection tracking, upsert logic, and query filtering.
