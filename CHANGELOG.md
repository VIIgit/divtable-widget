# Changelog

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
