# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A React web application for managing TCG (Trading Card Game) collections, such as Pokémon, Magic: The Gathering, Yu-Gi-Oh!, etc. Built with React 18, TypeScript, and Vite.

## Development Commands

### Setup
```bash
npm install
```

### Development
```bash
npm run dev              # Start development server (Vite)
npm run build            # Type-check and build for production
npm run preview          # Preview production build locally
```

### Code Quality
```bash
npm run type-check       # Run TypeScript compiler without emitting files
npm run lint             # Lint TypeScript/TSX files
npm run lint:fix         # Auto-fix linting issues
```

### Testing
```bash
npm test                 # Run tests in watch mode
npm run test:ui          # Run tests with Vitest UI
npm run test:coverage    # Generate test coverage report
```

## Architecture

### Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Testing**: Vitest
- **Linting**: ESLint with TypeScript support

### Directory Structure
```
src/
├── components/     # Reusable React components
├── pages/          # Page-level components (route handlers)
├── services/       # API calls and external service integrations
├── types/          # TypeScript type definitions and interfaces
├── utils/          # Utility functions and helpers
├── App.tsx         # Main application component with routing
├── main.tsx        # Application entry point
└── index.css       # Global styles
```

### Path Aliases
The project uses path aliases configured in `tsconfig.json`:
- `@/*` maps to `src/*` for cleaner imports
- Example: `import { Component } from '@/components/Component'`

### Component Organization
- Components in `src/components/` should be reusable UI elements
- Page components in `src/pages/` correspond to routes
- Each major component should have its own directory if it includes multiple files (component, styles, tests)

### Type Definitions
- Store shared TypeScript interfaces and types in `src/types/`
- Define types for TCG collections, cards, users, etc.
- Keep API response types separate from internal domain types

### Services Layer
- API integrations and data fetching logic go in `src/services/`
- Each external service (e.g., card databases, authentication) gets its own file
- Keep business logic separate from components

## Code Style

### TypeScript
- Strict mode is enabled
- Use explicit types for function parameters and return values
- Prefer interfaces over types for object shapes
- Enable all strict compiler options (already configured)

### React Patterns
- Use functional components with hooks
- Prefer named exports for components
- Use React Router's declarative routing with `<Routes>` and `<Route>`
- Keep components focused and single-purpose

### Testing
- Place test files next to the code they test with `.test.ts` or `.test.tsx` extension
- Use Vitest for unit and integration tests
- Test components with common user interactions and edge cases

## Workflow

### Before Committing
1. Run `npm run type-check` to ensure no TypeScript errors
2. Run `npm run lint` to check for linting issues
3. Run `npm test` to verify all tests pass
4. Fix any issues before committing

### Adding New Features
1. Create types in `src/types/` for new data structures
2. Implement service layer in `src/services/` for API interactions
3. Build reusable components in `src/components/`
4. Create page components in `src/pages/` and add routes in `App.tsx`
5. Write tests for new functionality

## TCG-Specific Considerations

When implementing TCG collection features:
- Design for multiple TCG types (Pokémon, MTG, Yu-Gi-Oh, etc.)
- Card data should include: name, set, rarity, condition, quantity, value
- Consider implementing search, filter, and sort functionality
- Plan for bulk import/export of collections
- Account for different card attributes per TCG type
