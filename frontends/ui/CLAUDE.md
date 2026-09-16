# AGENTS.md

This file provides guidance to AI coding agents (Claude, Copilot, Cursor, etc.) working in the Caleo Pro Frontend codebase.

## Project Overview

React 18 + TypeScript 4.9 overtime shift management system for law enforcement. Uses Material-UI v5, Apollo Client (GraphQL), AWS Amplify (Cognito auth), MapLibre GL, and FullCalendar. Built with Create React App + CRACO, deployed via SST v3 to AWS.

## Commands

```bash
# Development
yarn start                # Dev server on port 3000
yarn build                # Production build
yarn build:analyze        # Build with bundle size analysis

# Code Quality
yarn lint                 # Run ESLint
yarn lint:fix            # Auto-fix ESLint issues
yarn prettier            # Format with Prettier

# Deployment
yarn deploy              # Deploy to AWS via SST

# Utilities
yarn clear-all           # Remove node_modules and build artifacts
yarn re-start            # Clean reinstall and start
yarn re-build            # Clean reinstall and build
```

**Note**: No test infrastructure is currently configured. Do not attempt to run tests.

## Code Style Guidelines

### Imports

- **Use absolute imports** with `src/` as base path (configured in tsconfig.json)
- **Import order**: External packages → Internal modules → Types → Styles
- **Examples**:
  ```typescript
  import { useCallback, useState } from 'react';
  import { gql } from '@apollo/client';
  import Button from '@mui/material/Button';
  import { useAuthContext } from 'src/auth/hooks/use-auth-context';
  import { User } from 'src/__generated__/resolvers-types';
  ```

### Formatting (Prettier)

- **Print width**: 100 characters
- **Quotes**: Single quotes (`'`)
- **Trailing commas**: ES5 style (objects, arrays)
- **Tab width**: 2 spaces
- **Semicolons**: Always required

### TypeScript

- **Strict mode enabled**: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`
- **Prefer explicit types** for function parameters and return values
- **Use interfaces** for object shapes, especially props
- **Type imports**: Use `import type` when importing only types
- **Examples**:

  ```typescript
  // Good
  export function fDate(date: InputValue, newFormat?: string): string {
    const fm = newFormat || 'dd MMM yyyy';
    return date ? format(new Date(date), fm) : '';
  }

  // Good - Interface for props
  export interface UseBooleanReturnType<T> {
    value: boolean;
    attribute: T | undefined;
    onTrue: (a?: T) => void;
    onFalse: () => void;
  }
  ```

### Naming Conventions

- **Components**: PascalCase (`ConfirmDialog`, `UserTable`)
- **Files**: kebab-case for utilities/hooks (`use-boolean.ts`, `format-time.ts`)
- **Hooks**: Prefix with `use` (`useBoolean`, `useAuthContext`)
- **GraphQL queries**: UPPERCASE_SNAKE_CASE (`GET_USER`, `ME`, `CREATE_BROWSER_NOTIFICATION_SUBSCRIPTION`)
- **API files**: lowercase with hyphens matching domain (`user.ts`, `event.ts`, `assignment-group.ts`)
- **Types/Interfaces**: PascalCase (`User`, `UserTableFilters`, `ConfirmDialogProps`)
- **Functions**: camelCase (`fDate`, `onToggle`, `setValue`)

### Component Patterns

- **Prefer function components** (no class components)
- **Default exports** for page/section components
- **Named exports** for reusable utilities, hooks, types
- **Destructure props** in function signature
- **Use MUI components** directly (Button, Dialog, etc.) - no custom wrappers unless necessary
- **Example**:
  ```typescript
  export default function ConfirmDialog({
    title,
    content,
    action,
    hasCancel = true,
    open,
    onClose,
    maxWidth = 'xs',
    ...other
  }: ConfirmDialogProps) {
    return (
      <Dialog fullWidth maxWidth={maxWidth} open={open} onClose={onClose} {...other}>
        {title && <DialogTitle sx={{ pb: 2 }}>{title}</DialogTitle>}
        {content && <DialogContent>{content}</DialogContent>}
      </Dialog>
    );
  }
  ```

### Custom Hooks

- **Always use useCallback** for returned functions
- **Memoize appropriately** with useMemo/useCallback
- **Return objects** with descriptive property names
- **Example**:
  ```typescript
  export function useBoolean<T>({ defaultValue }: { defaultValue?: boolean } = {}) {
    const [value, setValue] = useState(!!defaultValue);

    const onTrue = useCallback(() => {
      setValue(true);
    }, []);

    return { value, onTrue, setValue };
  }
  ```

### Date and Time Handling

**CRITICAL: Always use dayjs with timezone awareness for displaying dates/times to users.**

- **Never use `new Date()` or `date-fns` directly** for displaying dates to users
- **Always use `convertDate()` from `src/hooks/use-datejs`** to convert dates to organization timezone
- **Always use `useDateFormats()` hook** to get organization-specific format strings
- **Use `useAuthContext()`** to get the user object for timezone conversion

#### Correct Pattern

```typescript
import { useAuthContext } from 'src/auth/hooks';
import { convertDate, useDateFormats } from 'src/hooks/use-datejs';

function MyComponent() {
  const { user } = useAuthContext();
  const { dateFormat, timeFormat, dateTimeFormat } = useDateFormats();

  // Display a date
  const formattedDate = convertDate({ date: myDate, user }).format(dateFormat);

  // Display a time
  const formattedTime = convertDate({ date: myDate, user }).format(timeFormat);

  // Display date and time
  const formattedDateTime = convertDate({ date: myDate, user }).format(dateTimeFormat);

  // Compare dates (use dayjs methods)
  const date1Dayjs = convertDate({ date: date1, user });
  const date2Dayjs = convertDate({ date: date2, user });
  const isEarlier = date1Dayjs.isBefore(date2Dayjs);
  const isLater = date1Dayjs.isAfter(date2Dayjs);
}
```

#### Why This Matters

- Organizations operate in different timezones (LASD in Los Angeles, LVMPD in Las Vegas, etc.)
- User browsers may be in different timezones than the organization
- Without timezone conversion, a shift starting at 8:00 AM PST could display as 11:00 AM EST to a user in that timezone
- The backend stores dates in UTC; `convertDate()` converts them to the organization's timezone

#### When NOT to Use Timezone Conversion

- Internal calculations that don't involve display to users
- API requests/responses (backend handles timezone conversion)
- Storing dates (always store in UTC/ISO format)

### GraphQL Patterns

- **All queries/mutations** in `src/api/[domain].ts` files
- **Use gql template literals** from `@apollo/client`
- **Define reusable fragments** as template strings (e.g., `userDetailProperties`)
- **Import generated types** from `src/__generated__/resolvers-types`
- **Example**:

  ```typescript
  import { gql } from '@apollo/client';
  import { User } from 'src/__generated__/resolvers-types';

  const userDetailProperties = `
    id
    firstName
    lastName
  `;

  export const ME = gql`
    query Me {
      me {
        ${userDetailProperties}
      }
    }
  `;
  ```

### Error Handling

- **No try-catch required** for Apollo queries (use error from hook)
- **Use react-error-boundary** for component-level error boundaries
- **Log errors with console.error** (console is allowed per ESLint config)
- **Example**:

  ```typescript
  const { data, loading, error } = useQuery(GET_USER, { variables: { id } });

  if (error) {
    console.error('Failed to fetch user:', error);
    return <ErrorComponent error={error} />;
  }
  ```

### ESLint Rules (Notable)

- **Console allowed**: `console.log`, `console.error` permitted
- **No unused imports enforcement**: `unused-imports` plugin disabled
- **camelCase not enforced**: `camelcase: 0`
- **Param reassignment allowed**: `no-param-reassign: 0` (useful for Immer patterns)
- **Arrow body style**: Flexible (no enforcement)
- **Props spreading allowed**: `react/jsx-props-no-spreading: 0`

## File Organization

```
src/
├── __generated__/       # Auto-generated GraphQL types (DO NOT EDIT)
├── api/                 # GraphQL queries/mutations by domain
├── auth/                # Auth context, guards, hooks
├── components/          # Cross-feature reusable components
├── hooks/               # Custom React hooks (38 files)
├── layouts/             # Page layouts (dashboard, auth, compact)
├── pages/               # Thin page wrappers
├── routes/              # Route definitions and components
├── sections/            # Feature-specific components
├── theme/               # MUI theme customization
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── App.tsx              # Root component with providers
```

### Component Placement

- **Reusable across features** → `src/components/`
- **Feature-specific** → `src/sections/[feature]/`
- **Page wrappers** → `src/pages/`
- **Form fields** → `src/components/hook-form/`

## Common Patterns

### Lazy Loading Routes

Always use `lazyWithRetry` for route components:

```typescript
import { lazyWithRetry } from 'src/routes/components/lazy-with-retry';

const UserPage = lazyWithRetry(() => import('src/pages/dashboard/user'));
```

### Form Validation

Use React Hook Form + Yup:

```typescript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

const schema = Yup.object().shape({
  email: Yup.string().email().required(),
});

const methods = useForm({ resolver: yupResolver(schema) });
```

### Styling

- **Use MUI's `sx` prop** for component-level styles
- **Theme values**: Access via `theme` object in sx
- **Example**: `<Box sx={{ pb: 2, typography: 'body2' }}>`

## Environment Variables

All variables **must** be prefixed with `REACT_APP_`:

- `REACT_APP_HOST_API` - REST API endpoint
- `REACT_APP_APOLLO_API` - GraphQL endpoint
- `REACT_APP_MAPBOX_API` - Mapbox API key
- `REACT_APP_AWS_AMPLIFY_*` - Cognito config (5 variables)

## Important Notes

- **MapLibre preferred** over Mapbox (no API limits, open source)
- **MUI X Pro license** required (key in `src/App.tsx:53`)
- **Large bundle**: ~297k lines of generated GraphQL types
- **Multi-tenancy**: Supports subdomain routing (lasd.caleo.com, lvmpd.caleo.com)
- **Memory optimization**: Build parallelism limited to 1 to prevent OOM
- **No module concatenation** in production builds

## Troubleshooting

- **Build memory errors**: Already optimized with `parallelism: 1` and `concatenateModules: false`
- **Chunk load failures**: Handled by `lazyWithRetry` wrapper
- **GraphQL errors**: Check auth token in Network tab, verify `REACT_APP_APOLLO_API`
- **Map issues**: Ensure MapLibre CSS imported: `import 'maplibre-gl/dist/maplibre-gl.css'`

## What NOT to Do

- ❌ Create test files (no test infrastructure exists)
- ❌ Use relative imports (use `src/` absolute imports)
- ❌ Edit `src/__generated__/` files (auto-generated)
- ❌ Use class components (function components only)
- ❌ Skip lazy loading for route components
- ❌ Commit secrets in `.env` or `credentials.json`
- ❌ Use interactive git commands (`git rebase -i`, `git add -i`)
