
# COPILOT_INSTRUCTIONS.md — Project Quality and Release Process

This file defines the quality standards and required process for maintaining and releasing the `divtable-widget` project. All contributors and automation (including Copilot) must follow these rules to ensure a high-quality, consistent, and maintainable codebase.

## Quality Standards

- All code must be clear, well-structured, and use descriptive names for variables, functions, and classes.
- All public APIs and major features must be documented in the README.md.
- All new features and bugfixes must include or update relevant tests in the `tests/` directory.
- All code must pass the test suite (`npm test`) and build successfully (`npm run build`) before merging or releasing.
- All user-facing changes must be reflected in the documentation and changelog.
- **Markdown files must not contain hard tabs.** Always use spaces for indentation in all `.md` files to comply with markdown linting rules (e.g., MD010/no-hard-tabs).
- **Do not use emphasis (e.g., `*text*` or `_text_`) as a heading.** Always use proper heading syntax (`#`, `##`, etc.) for section titles in markdown files to comply with MD036/no-emphasis-as-heading.

## Release Process

When preparing a new release, you **must**:

1. **Update the version** in `package.json` following semantic versioning.
2. **Update the changelog** (`CHANGELOG.md`):
   - Move unreleased changes to a new version section with the release date.
   - Summarize all user-facing changes (features, fixes, breaking changes).
3. **Update the README.md**:
   - Add a summary of new features or fixes at the top if relevant.
   - Ensure all usage, API, and installation instructions are current.
4. **Build and test**:
   - Run `npm run build` and `npm test` to ensure the release is stable.
5. **Commit and tag**:
   - Commit all changes with a clear message (e.g., `Release vX.Y.Z: summary`).
   - Tag the release (e.g., `git tag vX.Y.Z`).
   - Push commits and tags to the repository.
6. **Publish** (if applicable):
   - Publish to npm (`npm publish`) if this is a public release.

## Contribution Guidelines

- All pull requests must follow the above process for any user-facing change.
- Automated tools (including Copilot) must not bypass these requirements.
- All documentation and process files (README.md, CHANGELOG.md, COPILOT_INSTRUCTIONS.md) must be kept up to date.

---

For questions, see the repository README or open an issue.
