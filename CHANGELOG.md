# Changelog

## [1.3.0] - 2026-04-18

### Added

- **Focus reconciliation after data changes**: `onRowFocus` now fires automatically after `replaceData()`, `appendData()`, and `applyQuery()`. If the focused row still exists in the visible (filtered) data, the callback re-fires with the current row data. If the focused row was removed or hidden by a filter, `onRowFocus(undefined, undefined)` fires to allow clearing detail panels.
- **`autoFocusFirstRow` option** (default: `false`): When enabled, the first visible row is automatically focused whenever no row has focus — for example after initial data load, data replacement, or when a filter hides the previously focused row.
- **External pre-filtering support**: The widget's `queryEngine.evaluateExpression(row, expression)` can be used to pre-filter data externally before calling `replaceData()`, allowing server-side or custom filters separate from the built-in query bar.

## [1.2.0] - 2026-02-01

### Fixed

- Corrected `.div-table-body` max-height calculation to use the widget height minus toolbar and header heights.
- Synchronized row heights between `.div-table-scroll-body` and `.div-table-fixed-body` so the tallest row is used.
- Fixed issue where a `.div-table-cell.composite-cell` could be taller than its row, causing overflow; now the tallest cell in a row determines the row height for both fixed and scroll sections.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-15

### Added

- Initial release of DivTable Widget
- CSS Grid and Flexbox-based table layout
- Monaco Editor integration for query language
- Virtual scrolling support for large datasets
- Auto-fetch pagination controls
- Multi-level grouping functionality
- Sorting by columns
- Single and multi-row selection
- Keyboard navigation support
- Loading state placeholders
- Responsive design
- Comprehensive query language with operators:
  - Comparison: =, !=, >, <, >=, <=
  - String: CONTAINS, STARTS_WITH, ENDS_WITH
  - List: IN
  - Range: BETWEEN
- Monaco Editor autocomplete and syntax highlighting
- API methods for data management, selection, and loading states

### Features

- Configurable column definitions
- Customizable loading thresholds
- Pause/resume auto-fetch functionality
- Collapsible groups
- Progress indicators for loading
- Checkbox-based selection
- Focus management with callbacks
- Row-level and group-level selection

[1.0.0]: https://github.com/yourusername/divtable-widget/releases/tag/v1.0.0
