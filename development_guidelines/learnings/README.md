# Learnings Directory

This directory stores lessons learned, proven patterns, and wisdom gained from building Kora.

## Purpose

Document solutions to tricky problems, patterns that work well, gotchas to avoid, and optimizations that made a difference.

## What to Include

- **Solutions to tricky problems**: How you solved specific technical challenges
- **Proven patterns**: Code patterns that work well in this codebase
- **Gotchas**: Common mistakes to avoid, especially with Expo, React Native, or Supabase
- **Performance optimizations**: Changes that improved app performance
- **Integration challenges**: Solutions for integrating third-party libraries or services
- **Design patterns**: React/React Native patterns that work well for this app
- **Supabase-specific learnings**: Database query patterns, RLS policy insights, auth flow patterns

## When to Create a Learning

Create a new markdown file here when you:

- Solve a complex problem that took significant time to figure out
- Discover a pattern that makes development easier
- Encounter a gotcha that others should avoid
- Make a performance improvement worth documenting
- Learn something specific about Expo, React Native, or Supabase that's project-relevant

## Example Files

- `supabase-rls-patterns.md` - Row Level Security patterns that work well
- `expo-router-navigation-patterns.md` - Navigation patterns with Expo Router
- `theme-usage-best-practices.md` - Best practices for using THEME constants
- `authentication-flow-lessons.md` - Lessons from implementing auth with Supabase
- `performance-optimization-wins.md` - Optimizations that improved app performance

## File Naming

Use kebab-case with descriptive names: `topic-description.md`

## Template

```markdown
# [Learning Title]

## Problem
What problem did you solve?

## Solution
How did you solve it?

## Key Insights
- Important points to remember
- Why this approach works

## Code Example
```typescript
// Example code if relevant
```

## Related
- Links to related files or documentation
```
