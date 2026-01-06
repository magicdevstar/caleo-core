# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Caleo Pro Frontend - A React-based overtime shift management system for law enforcement agencies (LASD, LVMPD). The application handles shift scheduling, event management, incident reporting, and multi-agency coordination.

## Development Commands

```bash
# Development
yarn start                # Start dev server (port 3000)
yarn build                # Production build
yarn build:analyze        # Build with bundle analyzer

# Code Quality
yarn lint                 # Run ESLint
yarn lint:fix            # Auto-fix ESLint issues
yarn prettier            # Format code with Prettier

# Deployment
yarn deploy              # Deploy to AWS via SST

# Utilities
yarn clear-all           # Remove node_modules and build artifacts
yarn re-start            # Clean reinstall and start
yarn re-build            # Clean reinstall and build
```

**Note**: No test infrastructure is currently configured.

## Required Environment Variables

All environment variables must be prefixed with `REACT_APP_`:

```bash
REACT_APP_HOST_API                            # REST API endpoint
REACT_APP_ASSETS_API                          # Assets/media API
REACT_APP_MAPBOX_API                          # Mapbox API key
REACT_APP_APOLLO_API                          # GraphQL endpoint
REACT_APP_AWS_AMPLIFY_USER_POOL_ID            # Cognito User Pool
REACT_APP_AWS_AMPLIFY_USER_POOL_WEB_CLIENT_ID # Cognito Client ID
REACT_APP_AWS_AMPLIFY_REGION                  # AWS region
REACT_APP_AWS_AMPLIFY_USER_POOL_DOMAIN        # Cognito domain
REACT_APP_VAPID_PUBLIC_KEY                    # Push notifications
```

## Architecture

### Technology Stack

- **Framework**: React 18.2.0 + TypeScript 4.9.5
- **Build Tool**: Create React App (CRA) with CRACO customization
- **Deployment**: SST v3 (AWS StaticSite on S3/CloudFront)
- **UI Library**: Material-UI v5.14.0 (requires MUI X Pro license)
- **GraphQL**: Apollo Client v3.8.0 with generated types
- **Authentication**: AWS Amplify (Cognito) + Auth0 fallback
- **Maps**: MapLibre GL v5 (preferred) and Mapbox GL v2.15
- **Forms**: React Hook Form v7.45.1 + Yup validation
- **Calendar**: FullCalendar v6.1.11 (day/time/timeline views)

### Provider Hierarchy

The app wraps components in this order (see `src/App.tsx`):

```tsx
<AuthProvider>                    // AWS Amplify authentication
  <LocalizationProvider>          // Dayjs date formatting
    <SettingsProvider>            // Theme/layout settings
      <ThemeProvider>             // MUI theme
        <ApolloProvider>          // GraphQL client
          <MotionLazy>            // Framer Motion animations
            <SnackbarProvider>    // Notistack notifications
              <Router />          // React Router v6
```

### Directory Structure

```
src/
├── __generated__/       # GraphQL types (auto-generated, 297k+ lines)
├── api/                 # GraphQL queries/mutations (24 files)
│   └── *.ts            # Organized by domain (user, event, shifts, etc.)
├── auth/
│   ├── context/        # Amplify auth provider
│   ├── guard/          # AuthGuard component for protected routes
│   └── hooks/          # useAuthContext, etc.
├── components/          # Reusable components (46+ directories)
│   ├── hook-form/      # Form field wrappers for React Hook Form
│   ├── map/            # MapLibre/Mapbox components
│   ├── table/          # Data table components
│   └── ...
├── hooks/              # Custom hooks (38 files)
├── layouts/            # Page layouts
│   ├── dashboard/      # Main app layout (sidebar, header, nav)
│   ├── auth/           # Auth pages layout (login, register)
│   └── compact/        # Minimal layout (kiosk mode)
├── pages/              # Page components (thin wrappers)
├── routes/
│   ├── sections/       # Route definitions (auth, dashboard, kiosk, etc.)
│   ├── components/     # lazyWithRetry, AuthGuard
│   └── paths.ts        # Path constants
├── sections/           # Feature-specific sections (14+ domains)
│   ├── admin/          # Admin features
│   ├── availableOvertime/
│   ├── myOvertime/
│   └── ...
├── theme/              # MUI theme customization
│   ├── overrides/      # Component style overrides
│   └── options/        # Theme options (palette, typography, etc.)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions (24 files)
│   ├── apollo.ts       # Apollo client setup with auth
│   ├── axios.ts        # HTTP client
│   ├── excel-billing-event-builder.ts
│   ├── generate-files/ # PDF/Excel generation utilities
│   └── ...
└── App.tsx             # Root component
```

### Routing Architecture

Routes are lazy-loaded using `lazyWithRetry` wrapper (in `src/routes/components/lazy-with-retry.tsx`):
- Automatic retry on chunk load failures (common with CRA code splitting)
- Route groups: `authRoutes`, `dashboardRoutes`, `kioskRoutes`, `externalRequestRoutes`, `mainRoutes`
- Protected routes use `<AuthGuard>` wrapper
- Default redirect: `/` → `PATH_AFTER_LOGIN` (usually `/dashboard`)

### GraphQL Patterns

1. **Type Generation**: All types in `src/__generated__/graphql.ts` (297k+ lines)
2. **API Layer**: Queries/mutations in `src/api/*.ts` organized by domain
3. **Apollo Setup**: Auth token automatically injected via `authLink` (see `src/utils/apollo.ts`)
4. **Query Pattern**:
   ```ts
   import { useQuery } from '@apollo/client';
   import { GET_USER } from 'src/api/user';

   const { data, loading, error } = useQuery(GET_USER, { variables: { id } });
   ```

### Bundle Optimization

CRACO config (craco.config.js) splits vendors into separate chunks:
- `mui` - All @mui packages (~244KB max)
- `mapbox` - Mapbox/MapLibre packages
- `fullcalendar` - Calendar packages
- `apollo` - Apollo Client packages
- `vendors` - Other node_modules

Run `yarn build:analyze` to visualize bundle sizes.

## Key Conventions

### Imports
- **Absolute imports**: Uses `src/` as base (configured in tsconfig.json)
- **Example**: `import { useAuthContext } from 'src/auth/hooks/use-auth-context';`

### Component Organization
- **Reusable components**: `src/components/` (cross-feature)
- **Feature components**: `src/sections/[feature]/` (feature-specific)
- **Pages**: Thin wrappers in `src/pages/` that compose sections

### Lazy Loading
Always use `lazyWithRetry` for route components:
```tsx
import { lazyWithRetry } from 'src/routes/components/lazy-with-retry';

const UserPage = lazyWithRetry(() => import('src/pages/dashboard/user'));
```

### Theme Customization
- Default theme: Dark mode (`themeMode: 'dark'`)
- Color presets: `default | cyan | purple | blue | orange | red`
- Override MUI components in `src/theme/overrides/`
- Custom theme options in `src/theme/options/`

### Form Patterns
Use React Hook Form with Yup validation:
```tsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

const schema = Yup.object().shape({
  email: Yup.string().email().required(),
});

const methods = useForm({
  resolver: yupResolver(schema),
});
```

### Map Components
- **Prefer MapLibre GL** over Mapbox GL (open source, no API limits)
- Map components in `src/components/map/`
- Drawing tools: `@mapbox/mapbox-gl-draw` (works with both)

## Important Notes

### MUI X Pro License
- License key hardcoded in `src/App.tsx:53`
- Required for `@mui/x-date-pickers-pro` and advanced data grid features

### Multi-Tenancy
- Application supports multiple agencies via subdomain routing
- Example: `lasd.caleo.com`, `lvmpd.caleo.com`
- Domain configuration in `sst.config.ts` via `DOMAIN_NAME` and `DOMAIN_ALIASES`

### PWA Features
- Service worker configured via Workbox
- Supports "Add to Home Screen" on mobile
- Precaching and offline strategies enabled

### Memory Optimization
- CRACO disables module concatenation in production (`concatenateModules: false`)
- Parallelism limited to 1 during builds to prevent OOM errors
- Large bundle due to extensive dependencies (~297k lines of generated GraphQL types)

### Common Patterns

**Custom Hooks**: Extensive use of custom hooks for business logic:
- `use-current-shifts.ts` - Current shift management
- `use-event-summary.ts` - Event data aggregation
- `use-browser-notification.ts` - Push notifications
- 35+ more in `src/hooks/`

**File Generation**: Utilities in `src/utils/generate-files/` for:
- Excel reports (ExcelJS)
- PDF generation (pdf-lib)
- Template-based documents

**Error Boundaries**:
- `<ErrorComponent>` wraps Router in App.tsx
- Uses `react-error-boundary` for graceful error handling

## Troubleshooting

### Build Failures
- If build fails with memory errors, reduce parallelism in craco.config.js
- Clear cache: `yarn clear-all && yarn install`

### Bundle Size
- Use `yarn build:analyze` to identify large dependencies
- Consider lazy-loading heavy components (maps, calendar, PDF viewer)

### GraphQL Errors
- Check auth token in Network tab (should have `Bearer` prefix)
- Verify `REACT_APP_APOLLO_API` environment variable
- Amplify session expires - user may need to re-authenticate

### Map Issues
- MapLibre preferred over Mapbox (no API key limits)
- Ensure `REACT_APP_MAPBOX_API` set if using Mapbox features
- CSS must be imported: `import 'maplibre-gl/dist/maplibre-gl.css'`
