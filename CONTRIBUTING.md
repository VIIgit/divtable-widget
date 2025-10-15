# Contributing to DivTable Widget

Thank you for your interest in contributing to DivTable Widget! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/divtable-widget.git
   cd divtable-widget
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running the Examples

```bash
npm run serve
```

This will start a local HTTP server at `http://localhost:8080` where you can test your changes.

### Building

```bash
# Production build
npm run build

# Development build with watch mode
npm run dev
```

### Testing Your Changes

1. Make your changes to the source files in `src/`
2. Test your changes using the example files in `examples/`
3. Ensure the build completes without errors
4. Test in multiple browsers if possible

## Code Style Guidelines

- Use **camelCase** for variable and function names
- Use **2 spaces** for indentation
- Add **comments** for complex logic
- Keep functions **focused and small**
- Follow existing code patterns in the project

## Commit Guidelines

- Use clear and descriptive commit messages
- Start with a verb in present tense (e.g., "Add", "Fix", "Update")
- Reference issue numbers when applicable

Examples:
```
Add support for custom date formatters
Fix pagination bug when filtering
Update README with new API examples
```

## Pull Request Process

1. **Update documentation** if you're adding new features
2. **Test your changes** thoroughly
3. **Update CHANGELOG.md** with your changes
4. **Submit a pull request** with:
   - Clear description of the changes
   - Reference to any related issues
   - Screenshots/GIFs if applicable (for UI changes)

## Reporting Bugs

When reporting bugs, please include:

- **Description** of the bug
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Browser and version**
- **Code examples** if applicable

## Feature Requests

We welcome feature requests! Please provide:

- **Clear description** of the feature
- **Use case** - why is this feature needed?
- **Examples** of how it would work
- **Mockups** if applicable (for UI features)

## Questions?

Feel free to open an issue for any questions about contributing.

## License

By contributing to DivTable Widget, you agree that your contributions will be licensed under the Apache License 2.0.
