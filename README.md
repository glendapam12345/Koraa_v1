# Kora - Organiza tu día sintiendo

A mobile-first wellness productivity app that prioritizes tasks based on emotional state, built with Expo and Supabase.

## Features

- **Emotion-Based Organization**: Daily check-ins that adapt task prioritization to your emotional state
- **Brain Dump**: Frictionless task capture without rigid structure
- **Smart Prioritization**: Automatic task prioritization based on energy, time, and focus levels
- **Beautiful Design**: Ethereal UI with gradient aesthetics and massive whitespace
- **Cross-Platform**: iOS, Android, and Web support

## Tech Stack

- **Framework**: Expo (React Native)
- **Navigation**: Expo Router
- **Backend**: Supabase (Auth + Database)
- **Typography**: DM Sans + Libre Baskerville
- **Styling**: StyleSheet with 8-point spacing system

## Design System

### Colors
- **Primary Gradient**: Blue (#4A90E2) to Pink (#FF6B6B)
- **Backgrounds**: White (#FFFFFF) and Light Gray (#F4F4F7)
- **Text**: Dark Gray (#121212) and Medium Gray (#595959)

### Typography
- **Headings**: DM Sans (Medium/Bold)
- **Accent Text**: Libre Baskerville Italic
- **Body**: DM Sans Medium

### Spacing
Uses 8-point system: 8px, 16px, 24px, 32px, 48px

## App Structure

### Onboarding Flow
1. Welcome screen introducing the concept
2. Authentication (Sign up/Login)
3. Emotion selection
4. Energy level check-in
5. Available time check-in
6. Focus level check-in

### Main Tabs
- **Hoy**: Today's prioritized tasks based on check-in
- **Vaciar**: Brain dump for capturing thoughts and tasks
- **Sentir**: Daily emotional check-in
- **Yo**: Profile and settings

## Database Schema

### Tables
- `profiles`: User profiles with onboarding status
- `daily_check_ins`: Daily emotional state and metrics
- `tasks`: User tasks with categories and priority flags

All tables include Row Level Security (RLS) policies for data protection.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run typecheck

# Build for web
npm run build:web
```

## Environment Variables

Required in `.env`:
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
