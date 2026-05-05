# CLAUDE.md

> About this file: CLAUDE.md provides Claude Code with persistent context about your project. It's automatically loaded into every conversation, eliminating the need to repeat project information.

---

## 🎯 Project Context

### About This Project

Koraa is a mobile-first wellness productivity app that prioritizes tasks based on emotional state. Users complete daily emotional check-ins (emotion, energy, time availability, focus level) and the app adapts task prioritization accordingly. The app features a "brain dump" interface for frictionless task capture and a beautiful, ethereal UI with gradient aesthetics.

**Project Type**: React Native mobile app with Expo, supporting iOS, Android, and Web

**Primary Purpose**: Help users organize their day based on how they're feeling, rather than rigid to-do lists

**Tech Stack**:
- **Language**: TypeScript 5.9.2 (strict mode enabled)
- **Framework**: Expo 54.0.10 with React Native 0.81.4, React 19.1.0
- **Navigation**: Expo Router 6.0.8 (file-based routing)
- **Backend**: Supabase 2.58.0 (Authentication + PostgreSQL database)
- **UI**: React Native StyleSheet, Lucide React Native icons
- **Fonts**: DM Sans (Medium/Bold), Libre Baskerville (Italic)
- **Architecture**: Expo New Architecture enabled

---

## 📁 Project Structure

```
[project-root]/
├── app/                    # Expo Router file-based routing
│   ├── _layout.tsx         # Root layout with font loading, AuthProvider
│   ├── index.tsx           # Entry point / welcome screen
│   ├── auth.tsx            # Authentication screen
│   ├── help.tsx            # FAQ, legal links, soporte (ruta /help)
│   ├── (tabs)/             # Tab navigation group
│   │   ├── index.tsx       # "Hoy" - Today's prioritized tasks
│   │   ├── vaciar.tsx      # Tab "Tareas" - captura y asignación de tareas
│   │   ├── sentir.tsx      # "Sentir" - Daily emotional check-in
│   │   ├── semana.tsx      # "Semana" - weekly view
│   │   ├── tips.tsx        # Tab "Consejos" - tips según estado y perfil
│   │   └── yo.tsx          # "Yo" - Profile and settings
│   ├── onboarding/         # Onboarding flow screens
│   │   ├── welcome.tsx
│   │   ├── emotion.tsx
│   │   ├── energy.tsx
│   │   ├── time.tsx
│   │   └── focus.tsx
│   └── +not-found.tsx      # 404 screen
├── components/             # Reusable UI components
│   ├── EmotionCard.tsx
│   └── GradientButton.tsx
├── constants/              # App constants and design tokens
│   ├── theme.ts            # Complete design system (THEME)
│   └── legalUrls.ts        # URLs opcionales privacidad/términos + email soporte
├── contexts/               # React Context providers
│   └── AuthContext.tsx     # Authentication state management
├── hooks/                  # Custom React hooks
│   └── useFrameworkReady.ts
├── lib/                    # Third-party client libraries
│   └── supabase.ts         # Supabase client configuration
├── supabase/               # Database migrations
│   └── migrations/
└── assets/                 # Images, fonts, etc.
```

### Key Directories

- `app/` - Expo Router file-based routing. Each file becomes a route. Groups in parentheses `(tabs)` create layout groups
- `components/` - Reusable React components using functional components and hooks
- `constants/` - Centralized constants, especially `theme.ts` which exports THEME design system
- `contexts/` - React Context providers (currently AuthContext for authentication)
- `hooks/` - Custom React hooks for reusable logic
- `lib/` - Third-party client initialization (Supabase client)
- `supabase/migrations/` - SQL migration files for database schema

### Important Files

- `constants/theme.ts` - Complete design system with colors, typography, spacing, shadows, border radius. Always use THEME constants instead of hardcoded values
- `lib/supabase.ts` - Supabase client singleton. Import with `import { supabase } from '@/lib/supabase'`
- `contexts/AuthContext.tsx` - Authentication state. Use `useAuth()` hook in components
- `app/_layout.tsx` - Root layout loads fonts, wraps app in AuthProvider, configures navigation

---

## 📂 Extended Context: Development Guidelines

**BEST PRACTICE**: Keep this CLAUDE.md file concise by moving detailed documentation to the `development_guidelines/` folder and referencing it here.

The `development_guidelines/` directory organizes extended project context:

- **`/learnings/`** - Lessons learned, proven patterns, gotchas, optimization wins
- **`/planned/`** - Future features, known bugs, technical debt, roadmap
- **`/running/`** - Current work in progress, active features, implementation plans
- **`/delivered/`** - Completed work and features

See individual README files in each subdirectory for usage guidelines.

**UX / flujo de usuario:** Auditoría y entregables (Ayuda en Hoy/Sentir, `FlowIndicator` sin números + «Orden sugerido», hint opcional en Tareas, tour primera sesión, Hoy lite día 1) en [koraa_ux_flow_audit.md](development_guidelines/delivered/koraa_ux_flow_audit.md). Prueba en Expo Go: sección *Probar en Expo Go* en ese documento.

---

## 🔧 Development Standards

### Code Style

- **TypeScript**: Strict mode enabled. All functions and components must have proper types
- **Components**: Functional components only. Use hooks (useState, useEffect, useContext, custom hooks)
- **Imports**: Use path aliases `@/` for imports (configured in tsconfig.json)
- **Formatting**: Prettier with single quotes, 2-space indentation, bracket spacing
- **Naming**: PascalCase for components, camelCase for functions/variables, SCREAMING_SNAKE_CASE for constants

### Styling Conventions

- **Always use THEME constants** from `@/constants/theme` - never hardcode colors, spacing, or typography
- Use `StyleSheet.create()` for component styles at bottom of file
- Spacing uses 8-point system: `THEME.spacing.xs` (8px), `sm` (16px), `md` (24px), `lg` (32px), `xl` (48px)
- Typography uses predefined styles: `THEME.typography.h1`, `h2`, `h3`, `body`, `caption`, `small`
- Colors: `THEME.colors.fill[100]` (white), `fill[200]` (light gray), `text.main`, `text.secondary`, `gradient.blue`, `gradient.pink`
- Border radius: `THEME.borderRadius.standard` (8px), `rounded` (16px), `pill` (24px), `full` (32px)
- Shadows: `THEME.shadows.soft` for card elevations

### Naming Conventions

- **Files**: PascalCase for components (`EmotionCard.tsx`), camelCase for utilities, kebab-case for configs
- **Components**: PascalCase, export named function components
- **Functions/Variables**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE or exported as const objects (THEME)
- **Types**: PascalCase with descriptive names (`EmotionCardProps`, `Task`)

### Component Patterns

- Export named function components: `export function ComponentName({ props }: PropsType)`
- Define props types with TypeScript interfaces or types
- Use StyleSheet.create() at bottom of file, reference in style prop
- Use `activeOpacity={0.7}` for TouchableOpacity interactions
- Always use THEME constants for styling

### Testing Requirements

- Testing framework: Not currently configured. Consider adding Jest + React Native Testing Library
- Test location: To be determined when testing is added

### Documentation

- TypeScript types serve as inline documentation
- Complex logic should have brief comments explaining "why"
- Component props should be self-documenting via TypeScript types

---

## ⚙️ Common Commands

```bash
# Development
npm run dev                    # Start Expo development server (disables telemetry)
npm install                    # Install dependencies

# Linting & Type Checking
npm run lint                   # Run Expo linter
npm run typecheck              # Run TypeScript compiler in check mode (no emit)

# Supabase (local checks & migration hints)
npm run env:bootstrap          # Crea .env desde .env.example si no existe
npm run check:supabase       # Verifica .env, DNS y /auth/v1/health
npm run check:supabase:migrations  # Lista migraciones y orden sugerido (ver guía)
npm run verify:local         # check:supabase + check:supabase:migrations

# Building
npm run build:web              # Export web build using Expo
```

### Additional Expo Commands

```bash
# iOS
npx expo start --ios           # Start dev server and open iOS simulator

# Android
npx expo start --android       # Start dev server and open Android emulator

# Web
npx expo start --web           # Start dev server for web

# Clear cache
npx expo start -c               # Start with cleared cache
```

---

## 🔄 Standard Workflows

### Default Workflow (Apply to all tasks)

Before making any code changes:

1. **Understand** - Review existing code patterns and THEME usage
2. **Plan** - Consider impact on authentication flow, database schema, or UI consistency
3. **Type** - Define TypeScript types/interfaces first
4. **Style** - Use THEME constants, follow 8-point spacing system
5. **Test** - Verify changes work on target platform(s)

### Feature Development Workflow

1. **Analyze** - Review requirements and similar existing screens/components
2. **Design** - Plan component structure, data flow, and Supabase queries
3. **Implement** - Create components following established patterns:
   - Functional component with TypeScript types
   - Use THEME constants for styling
   - StyleSheet.create() at bottom
   - Handle loading/error states
4. **Type Check** - Run `npm run typecheck`
5. **Lint** - Run `npm run lint`
6. **Review** - Self-review checklist:
   - [ ] TypeScript types defined and correct
   - [ ] Uses THEME constants (no hardcoded values)
   - [ ] Follows existing component patterns
   - [ ] Proper error handling for Supabase calls
   - [ ] Loading states handled appropriately

### Database Changes Workflow

1. **Create Migration** - Add new SQL file in `supabase/migrations/`
2. **Test Locally** - Apply migration to local Supabase instance
3. **Update Types** - Ensure TypeScript types match new schema
4. **Update RLS Policies** - Add/update Row Level Security policies
5. **Test Queries** - Verify Supabase queries work with new schema

**Schema, migraciones y SQL Editor (orden, columnas faltantes):** [SUPABASE_SCHEMA_AND_MIGRATIONS.md](development_guidelines/learnings/SUPABASE_SCHEMA_AND_MIGRATIONS.md)

---

## 🛠️ Project-Specific Patterns

### Authentication

- Use `useAuth()` hook from `@/contexts/AuthContext` to access authentication state
- AuthContext provides: `session`, `user`, `loading`, `signUp()`, `signIn()`, `signOut()`
- All Supabase queries should check for authenticated user first
- Onboarding status stored in `profiles.onboarding_completed`

### Database Queries

- Always use Supabase client from `@/lib/supabase`
- Check authentication before queries: `const { data: { user } } = await supabase.auth.getUser()`
- Filter by `user_id` for user-specific data
- Use RLS policies (already configured) - queries automatically filtered by authenticated user
- Handle errors from Supabase responses

### Navigation

- Expo Router file-based routing - file location determines route
- Use `<Link>` from `expo-router` for navigation
- Use `router.push()`, `router.replace()` from `useRouter()` hook
- Tab navigation configured in `app/(tabs)/_layout.tsx`

### UI Patterns

- **Gradient Cards**: Use `LinearGradient` from `expo-linear-gradient` with `THEME.colors.gradient.blue` and `THEME.colors.gradient.pink`
- **Empty States**: Show helpful message with accent text using `THEME.fonts.accent.italic`
- **Cards**: White background (`THEME.colors.fill[100]`), rounded corners (`THEME.borderRadius.rounded`), soft shadow
- **Touch Targets**: Minimum 48px height (THEME.sizes.touchTarget)
- **Icons**: Use Lucide React Native icons, size 24px standard, 32px large

---

## 🚨 Critical Rules & Warnings

### Things to NEVER Do

- ❌ Never hardcode colors, spacing, or typography values - always use THEME constants
- ❌ Never use class components - functional components with hooks only
- ❌ Never skip TypeScript types - strict mode requires proper typing
- ❌ Never directly mutate state - use setState or functional updates
- ❌ Never commit `.env` file with Supabase credentials
- ❌ Never disable TypeScript strict mode
- ❌ Never bypass RLS policies - all database access must be authenticated

### Things to ALWAYS Do

- ✅ Always use THEME constants from `@/constants/theme`
- ✅ Always define TypeScript types for component props
- ✅ Always use StyleSheet.create() for styles
- ✅ Always check authentication before Supabase queries
- ✅ Always handle loading and error states in async operations
- ✅ Always use path aliases (`@/`) for imports
- ✅ Always run `npm run typecheck` before committing

### Security Considerations

- Environment variables must be prefixed with `EXPO_PUBLIC_` to be available in app
- Supabase RLS policies are enabled on all tables - don't bypass them
- User data is automatically filtered by `auth.uid()` via RLS
- Never expose Supabase service role key in client code

---

## 📝 Project-Specific Notes

### Architecture Decisions

- **Expo Router**: File-based routing simplifies navigation structure
- **Supabase**: Backend-as-a-service for auth and database, reducing backend code
- **StyleSheet over styled-components**: Performance and simplicity for React Native
- **Centralized THEME**: Single source of truth for design tokens ensures consistency
- **TypeScript strict mode**: Catches errors early, improves code quality
- **New Architecture**: Expo New Architecture enabled for better performance

### Database Schema

- **profiles**: User profiles with `id` (references auth.users), `email`, `full_name`, `onboarding_completed`
- **daily_check_ins**: Daily emotional state with `user_id`, `date`, `emotion`, `energy_level` (1-5), `available_time`, `focus_level`
- **tasks**: User tasks with `user_id`, `content`, `category`, `is_completed`, `is_priority`, `completed_at`
- All tables have RLS enabled with policies for authenticated users
- Timestamps: `created_at`, `updated_at` on relevant tables

### API Conventions

- All database access via Supabase client
- Queries automatically filtered by authenticated user via RLS
- Use Supabase real-time subscriptions for live updates if needed
- Error handling: Check `error` property in Supabase responses

### Environment Variables

Required in `.env` file:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Opcional (pantalla **Ayuda** → enlaces legales): `EXPO_PUBLIC_PRIVACY_POLICY_URL`, `EXPO_PUBLIC_TERMS_OF_SERVICE_URL`. Ver [KORAA_HELP_AND_LEGAL_URLS.md](development_guidelines/learnings/KORAA_HELP_AND_LEGAL_URLS.md).

Medición de producto (tabla `app_events`, `lib/analytics.ts`): [KORAA_ANALYTICS_PHASE_D.md](development_guidelines/delivered/KORAA_ANALYTICS_PHASE_D.md). Opcional: `EXPO_PUBLIC_ANALYTICS_ENABLED=false`.

Onboarding obligatorio y tabs con sesión: [onboarding_gate_and_tabs_auth.md](development_guidelines/delivered/onboarding_gate_and_tabs_auth.md).

### Design System

- **Colors**: White backgrounds, blue-to-pink gradients, subtle grays for text
- **Typography**: DM Sans for headings/body, Libre Baskerville Italic for accent text
- **Spacing**: 8-point system (8, 16, 24, 32, 48px)
- **Shadows**: Soft, subtle shadows for depth (`THEME.shadows.soft`)
- **Border Radius**: Standard (8px), Rounded (16px), Pill (24px), Full (32px)

---

## 🌍 Environment & Configuration

### TypeScript Configuration

- Extends `expo/tsconfig.base`
- Strict mode enabled
- Path aliases: `@/*` maps to project root
- Includes Expo types and environment declarations

### Expo Configuration

- New Architecture enabled
- Typed routes enabled (experimental)
- Supports iOS, Android, Web
- Portrait orientation only
- Automatic dark mode support (`userInterfaceStyle: "automatic"`)

---

## 💡 Tips for Working with This Codebase

- Check `constants/theme.ts` first when styling - likely constant already exists
- Review similar screens/components before creating new ones (especially onboarding flow)
- Use Expo DevTools for debugging (shake device or `Cmd+D` in simulator)
- Supabase Studio is useful for inspecting database data during development
- Run `npm run typecheck` frequently to catch TypeScript errors early
- Check `contexts/AuthContext.tsx` to understand authentication flow
- Tab navigation structure is in `app/(tabs)/_layout.tsx`

---

## 🔄 Maintenance

**Last Updated**: January 2025

**Maintained By**: Development Team

**Review Frequency**: When major changes occur or quarterly

---

## 📋 Quick Reference Checklist

Before starting any task:
- [ ] I understand the requirements and existing patterns
- [ ] I know which THEME constants to use
- [ ] I've reviewed similar components/screens
- [ ] I understand the data flow (Supabase queries, auth state)

Before committing:
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] Linter passes (`npm run lint`)
- [ ] All styles use THEME constants
- [ ] TypeScript types are defined for all props
- [ ] Error handling is implemented for async operations
