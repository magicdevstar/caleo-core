# AGENTS.md

This file provides guidance to AI coding agents working in the Caleo Admin Frontend codebase.

## Project Overview

Internal backoffice admin tool for the Caleo platform. Used by the Caleo team to provision new organizations, manage organization feature flags and access, and impersonate users for troubleshooting. Built with React 18 + TypeScript 4.9, Material-UI v5, Apollo Client (GraphQL), and AWS Amplify (Cognito auth). Deployed via SST v3 to AWS.

## Commands

```bash
# Development
yarn start                # Dev server (react-scripts)
yarn build                # Production build

# Code Quality
yarn lint                 # Run ESLint
yarn lint:fix             # Auto-fix ESLint issues
yarn prettier             # Format with Prettier

# Deployment
yarn deploy               # Deploy to AWS via SST

# Utilities
yarn clear-all            # Remove node_modules and build artifacts
yarn re-start             # Clean reinstall and start
yarn re-build             # Clean reinstall and build
```

**Note**: No test infrastructure is currently configured. Do not attempt to run tests.

## Code Style Guidelines

### Imports

- **Use absolute imports** with `src/` as base path (configured in tsconfig.json)
- **Import order**: External packages → Internal modules → Types → Styles
- **Examples**:
  ```typescript
  import { useState } from 'react';
  import { gql } from '@apollo/client';
  import Button from '@mui/material/Button';
  import { useAuthContext } from 'src/auth/hooks/use-auth-context';
  ```

### Formatting (Prettier)

- **Single quotes** (`'`)
- **Trailing commas**: ES5 style
- **Tab width**: 2 spaces
- **Semicolons**: Always required

### TypeScript

- **Strict mode enabled**: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`
- **Prefer explicit types** for function parameters and return values
- **Use interfaces** for object shapes, especially props

### Naming Conventions

- **Components**: PascalCase (`OrganizationTable`, `UserDrawer`)
- **Files**: kebab-case for utilities/hooks (`use-boolean.ts`)
- **Hooks**: Prefix with `use` (`useBoolean`, `useAuthContext`)
- **GraphQL queries**: UPPERCASE_SNAKE_CASE (`GET_ORGANIZATIONS`, `ME`)
- **Types/Interfaces**: PascalCase
- **Functions**: camelCase

### Component Patterns

- **Function components only** (no class components)
- **Default exports** for page/section components
- **Named exports** for reusable utilities, hooks, types
- **Destructure props** in function signature
- **Use MUI components** directly (Button, Dialog, etc.)

### GraphQL Patterns

- **All queries/mutations** in `src/api/[domain].ts` files (organization.ts, user.ts, rank.ts)
- **Use gql template literals** from `@apollo/client`
- **Import generated types** from `src/__generated__/resolvers-types`

### Error Handling

- **No try-catch required** for Apollo queries (use error from hook)
- **Use react-error-boundary** for component-level error boundaries

## File Organization

```
src/
├── __generated__/       # Auto-generated GraphQL types (DO NOT EDIT)
├── api/                 # GraphQL queries/mutations (organization.ts, user.ts, rank.ts)
├── auth/                # Auth context, guards, hooks (Amplify/Cognito)
├── components/          # Reusable components
├── hooks/               # Custom React hooks
├── layouts/             # Page layouts
├── pages/               # Page wrappers (admin/, auth/, 404, 500)
├── routes/              # Route definitions
├── sections/            # Feature-specific components (auth/, organization/, empty/, error/)
├── theme/               # MUI theme customization
├── types/               # TypeScript type definitions
├── utils/               # Utility functions (Apollo client config, etc.)
└── App.tsx              # Root component with providers
```

## Key Differences from `frontends/ui/`

- **Simpler scope**: Only organization management, user management, and rank management
- **Build tool**: Plain `react-scripts` (no CRACO)
- **Dark mode default**: Theme defaults to `themeMode: 'dark'`
- **No maps/calendar features**: Simpler UI surface area
- **Auth**: Same Amplify/Cognito setup but restricted to internal Caleo team members

## What NOT to Do

- Do not create test files (no test infrastructure exists)
- Do not use relative imports (use `src/` absolute imports)
- Do not edit `src/__generated__/` files (auto-generated)
- Do not use class components (function components only)
- Do not commit secrets in `.env` or `credentials.json`
