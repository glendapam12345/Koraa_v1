# Planned Directory

This directory documents future improvements, known bugs, technical debt, and roadmap items for Koraa.

## Purpose

Keep track of planned work, technical debt, and improvements that should be made in the future.

## What to Include

- **Future features**: Features planned for upcoming releases
- **Known bugs**: Documented bugs with reproduction steps and severity
- **Technical debt**: Code that needs refactoring or improvement
- **Architectural improvements**: Planned changes to app architecture
- **Performance enhancements**: Optimization opportunities identified
- **Security improvements**: Security enhancements planned
- **UX improvements**: User experience enhancements planned
- **Database changes**: Schema changes or migrations planned

## When to Create a Planned Item

Create a new markdown file here when you:

- Identify a feature that should be built in the future
- Discover a bug but don't have time to fix it immediately
- Notice technical debt that should be addressed
- Plan an architectural change
- Identify an optimization opportunity

## Example Files

- `future-features.md` - Upcoming feature requirements and specifications
- `known-bugs.md` - Documented bugs with reproduction steps and priority
- `technical-debt.md` - Code that needs refactoring or improvement
- `performance-improvements.md` - Optimization opportunities
- `database-schema-changes.md` - Planned database migrations

## File Naming

Use kebab-case with descriptive names: `category-item.md`

## Before Starting New Work

Always check this directory before starting new features to see if:
- The feature is already planned (avoid duplicate work)
- Related bugs or technical debt exist
- Dependencies or prerequisites are documented

## Template

```markdown
# [Planned Item Title]

## Status
[Planned | In Design | Blocked | Ready to Start]

## Priority
[High | Medium | Low]

## Description
What needs to be done?

## Rationale
Why is this important?

## Requirements
- Specific requirements or acceptance criteria
- Dependencies

## Implementation Notes
- How it might be implemented
- Considerations or gotchas

## Related
- Links to related issues, features, or technical debt
```
