# Running Directory

This directory tracks current work in progress, active features being developed, and ongoing tasks.

## Purpose

Keep track of what's currently being worked on to avoid conflicts and provide context for ongoing development.

## What to Include

- **Active features**: Features currently being built with implementation plans
- **Refactoring efforts**: Active refactoring work and progress
- **Migration work**: Database or code migrations in progress
- **Experiments**: Current spikes or experiments being explored
- **Implementation plans**: Detailed plans for complex features
- **Work breakdown**: Task breakdowns for large features

## When to Create a Running Item

Create a new markdown file here when you:

- Start work on a new feature
- Begin a refactoring effort
- Start an experiment or spike
- Need to track progress on a complex task

## When to Move a Running Item

Once work is complete:
1. Move the file to `delivered/` directory
2. Add completion date and summary
3. Reference it in commit messages or PRs if applicable

## Example Files

- `feature-task-prioritization.md` - Implementing smart task prioritization algorithm
- `refactor-theme-usage.md` - Refactoring components to use THEME constants consistently
- `experiment-realtime-updates.md` - Exploring Supabase real-time subscriptions
- `bugfix-auth-session-handling.md` - Fixing authentication session persistence issue

## File Naming

Use kebab-case with descriptive names: `category-item.md`

Prefix with:
- `feature-` for new features
- `bugfix-` for bug fixes
- `refactor-` for refactoring work
- `experiment-` for experiments/spikes

## Template

```markdown
# [Running Item Title]

## Status
[In Progress | Blocked | Review | Testing]

## Started
[Date]

## Description
What is being worked on?

## Progress
- [x] Completed step 1
- [x] Completed step 2
- [ ] In progress step 3
- [ ] Pending step 4

## Current Blocker
[Any blockers or dependencies]

## Notes
- Implementation decisions made
- Things to remember
- Questions or considerations

## Next Steps
1. Immediate next action
2. Subsequent steps

## Related
- Links to related files, PRs, or issues
```
