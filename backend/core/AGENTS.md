# AGENTS.md - Coding Guidelines for Caleo Core Backend

## Project Overview
This is a serverless GraphQL API built with TypeScript, Apollo Server, AWS Lambda, and MongoDB. The codebase follows a layered architecture with resolvers, services, repositories, and models.

## Build & Test Commands

### Core Commands
- `yarn lint` - Run ESLint on all source files
- `yarn lint:fix` - Auto-fix linting issues
- `yarn test` - Run all tests with UTC timezone
- `yarn generate` (or `yarn gen`) - Generate GraphQL types from schema

### Running Specific Tests
- `yarn test <test-file-name>` - Run a specific test file (e.g., `yarn test organization.test.ts`)
- `TZ=UTC jest --testPathPattern=<pattern>` - Run tests matching pattern
- Pre-configured test patterns:
  - `yarn test:assignments` - Assignment-related tests
  - `yarn test:shifts` - Shift-related tests
  - `yarn test:interest` - Interest list tests
  - `yarn test:dates` - Date utility tests

### Deployment
- `yarn deploy` - Generate types and deploy all functions
- `yarn deploy:graphql` - Deploy only the GraphQL handler
- `yarn offline` - Run serverless offline for local development

## Code Style Guidelines

### Import Organization
1. **External packages first** (Node.js built-ins, then npm packages)
2. **GraphQL generated types** from `__generated__/resolvers-types`
3. **Local models and services**
4. **Utilities last**

Example:
```typescript
import { ObjectId } from "mongodb";
import merge from 'lodash.merge';
import { Context } from "../../../utils/createContext";
import { UpsertOrganization } from "../../../__generated__/resolvers-types";
import { adminOnly, superAdminOnly } from "../../../utils/access";
import { IOrganization } from "../../../models/organizations/organization.entity";
```

### Formatting & Structure
- **No semicolons** at end of statements (ESLint enforced)
- **Single quotes** for strings
- **2-space indentation**
- **Trailing commas** in objects and arrays
- Use `async/await` for asynchronous code, not `.then()`
- Place GraphQL resolvers in separate files: `*.query.ts`, `*.mutation.ts`, `*.fields.ts`

### TypeScript Conventions
- **Use explicit types** for function parameters and return values
- **Interfaces over types** for entity definitions (prefix with `I`, e.g., `IOrganization`)
- **No `any` type** when possible - use proper typing or generics
- **Optional chaining** (`?.`) for potentially undefined values
- Generate GraphQL types with `yarn generate` - never manually edit `__generated__/` files

### Naming Conventions
- **Files**: kebab-case (e.g., `organization.service.ts`)
- **Classes**: PascalCase with suffixes:
  - `*Service` for business logic
  - `*Repository` or `*Repo` for data access
  - `*Model` for database models
- **Functions/variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase with `I` prefix (e.g., `IOrganization`)
- **GraphQL types**: Generated from schema, no manual changes

### Error Handling
- Use `GraphQLError` for user-facing errors in resolvers
- Define error constants in `src/utils/errors.ts`:
  ```typescript
  export const organizationErrors = {
    NOT_FOUND: 'ORGANIZATION_NOT_FOUND',
    NAME_MUST_BE_UNIQUE: 'ORGANIZATION_NAME_MUST_BE_UNIQUE',
  };
  ```
- Log errors using AWS Powertools Logger:
  ```typescript
  import logger from '../utils/logger';
  logger.error('Error message', { error, context });
  ```

### Access Control
- Use utility functions for permission checks:
  - `adminOnly(user)` - Requires admin privileges
  - `superAdminOnly(user)` - Requires super admin privileges
  - `isSuperAdmin(user)` - Returns boolean for conditional logic
- Always validate user permissions at the resolver level

### MongoDB Patterns
- Use `ObjectId` from `mongodb` package for ID conversions
- Extend `BaseMongo<T>` for repository classes
- Use DataLoader for batch loading: `loader.load(id)`
- Always include `docType` field for document filtering
- Soft deletes: Set `removedAt` timestamp instead of hard deletion
- Track changes: `createdAt`, `updatedAt`, `modifiedById` fields

### Date Handling
- Use `date-fns` for date manipulation
- Use `date-fns-tz` for timezone-aware operations
- Always specify `TZ=UTC` when running tests
- Store dates as `Date` objects in MongoDB, expose as ISO strings in GraphQL

### Testing
- Use `@jest/globals` for test utilities (`describe`, `test`, `expect`, `jest`)
- Use `jest.useFakeTimers()` for time-dependent tests
- Mock AWS SDK clients with `aws-sdk-client-mock`
- Use `mongodb-memory-server` for database testing
- Test files: `*.test.ts` in same directory as source
- Use `test.each()` for parameterized tests

### GraphQL Resolver Structure
Resolvers should be split into separate files per domain:
- `*.query.ts` - Query resolvers
- `*.mutation.ts` - Mutation resolvers
- `*.fields.ts` - Field resolvers and type definitions
- Export named objects: `Query`, `Mutation`, `fields`

Example resolver:
```typescript
export const Query = {
  organization: async (
    _parent: unknown,
    _args: unknown,
    { organizations, user }: Context
  ): Promise<IOrganization | null> =>
    organizations.get(user?.member.orgId || ''),
};
```

### Context Usage
- Always destructure needed services from `Context`
- Context provides: `user`, `organization`, all service instances
- Services available: `organizations`, `users`, `shifts`, `events`, etc.
- Lambda context available as `lambdaContext` and `lambdaEvent`

### Environment Variables
- Defined in `serverless.yml` under `params`
- Access via `process.env.*`
- Common vars: `STAGE`, `MONGODB_NAME`, `LOG_LEVEL`, `DOCUSIGN_BASE`

## ESLint Rules
- `@typescript-eslint/no-unused-vars: error` (ignores rest siblings)
- `@typescript-eslint/no-empty-object-type: off`
- `@typescript-eslint/no-explicit-any: off`
- `no-case-declarations: off`

## Architecture Patterns
- **Resolvers**: Handle GraphQL requests, validate input, call services
- **Services**: Business logic, orchestrate multiple repositories
- **Repositories**: Data access layer, MongoDB operations
- **Models**: Entity interfaces and data structures
- Use dependency injection in constructors
- DataLoader pattern for N+1 query prevention

## Git Workflow
- Never commit generated files (`src/__generated__/*`)
- Run `yarn lint` before committing
- Generate types before deploying: `yarn generate`

## Key Files
- `schema.graphql` - GraphQL schema definition
- `codegen.yml` - GraphQL code generation config
- `serverless.yml` - AWS Lambda configuration
- `jest.config.js` - Test configuration
- `eslint.config.mjs` - Linting rules

## Adding Organization Feature Flags

Organization feature flags are boolean toggles that enable or disable specific functionality per organization. They provide a flexible way to control feature availability without code changes.

### Feature Flag Architecture

**Key Locations:**
- **Feature Definitions**: `src/models/organizations/organization.defaults.ts` (lines 38-74)
- **GraphQL Schema**: `schema.graphql` (OrganizationFeatures type ~line 1717, UpsertOrganizationFeatures input ~line 1948)
- **Generated Types**: `src/__generated__/resolvers-types.ts` (auto-generated)
- **Service Methods**: `src/models/organizations/organization.service.ts`
- **Mutations**: `src/graphql/resolvers/organization/organization.mutation.ts`

### Step-by-Step Guide to Add a New Feature Flag

#### 1. Add Feature Definition

**File**: `src/models/organizations/organization.defaults.ts`

Add your feature to the `featureDefinitions` array (around line 38-74):

```typescript
export const featureDefinitions = [
  // ... existing features ...
  { value: 'yourFeatureName', label: 'Your Feature Display Name', defaultEnabled: false },
];
```

**Naming Conventions:**
- `value`: camelCase, descriptive of the feature (e.g., `adminManagedProfilePhotos`)
- `label`: Human-readable title case (e.g., `Admin Managed Profile Photos`)
- `defaultEnabled`: Boolean, typically `false` for new features

**Examples of Existing Features:**
- `{ value: 'autoEnroll', label: 'Auto Enroll On Login', defaultEnabled: false }`
- `{ value: 'eventCheckIn', label: 'Event Check In', defaultEnabled: false }`
- `{ value: 'docusign', label: 'Docusign Integration', defaultEnabled: false }`

#### 2. Update GraphQL Schema

**File**: `schema.graphql`

**A. Add to OrganizationFeatures type** (~line 1717):
```graphql
type OrganizationFeatures {
  # ... existing features ...
  yourFeatureName: Boolean!
}
```

**B. Add to UpsertOrganizationFeatures input** (~line 1948):
```graphql
input UpsertOrganizationFeatures {
  # ... existing features ...
  yourFeatureName: Boolean
}
```

**Important Notes:**
- Output type (`OrganizationFeatures`): Field is **required** (`Boolean!`)
- Input type (`UpsertOrganizationFeatures`): Field is **optional** (`Boolean`)
- This allows querying all features but only updating specific ones

#### 3. Generate TypeScript Types

Run the code generation command to update TypeScript definitions:

```bash
yarn generate
```

This updates `src/__generated__/resolvers-types.ts` with your new feature type definitions.

**Verification:**
```bash
grep -n "yourFeatureName" src/__generated__/resolvers-types.ts
```

You should see 3 entries:
1. In `OrganizationFeatures` output type
2. In `UpsertOrganizationFeatures` input type
3. In resolver type definitions

#### 4. Add Tests

**File**: `src/models/organizations/organization.test.ts`

Add tests to verify the feature is properly defined:

```typescript
describe('Feature Definitions', () => {
  test('yourFeatureName feature should be defined', () => {
    const feature = featureDefinitions.find(f => f.value === 'yourFeatureName')
    expect(feature).toBeDefined()
    expect(feature?.value).toBe('yourFeatureName')
    expect(feature?.label).toBe('Your Feature Display Name')
    expect(feature?.defaultEnabled).toBe(false)
  })

  test('yourFeatureName should be included in features object', () => {
    expect(features).toHaveProperty('yourFeatureName')
    expect(features.yourFeatureName).toBe(false)
  })
})
```

**Run Tests:**
```bash
yarn test -- organization.test.ts
```

#### 5. Code Quality Checks

```bash
# Check linting
yarn lint

# Fix linting issues
yarn lint:fix

# Run all tests
yarn test
```

### Using Feature Flags in Code

#### Pattern 1: Guard Clauses (Most Common)

Check if feature is enabled before executing feature-specific code:

```typescript
// In a service or resolver
if (!organization.features.yourFeatureName) {
  return; // Feature disabled, skip processing
}

// Feature-specific logic here
```

**Example**: `src/services/interestList.service.ts:56-59`
```typescript
if (!organization.features.interestLists) {
  return;
}
```

#### Pattern 2: Conditional Behavior

Alter behavior based on feature state:

```typescript
const status = organization.features.autoEnroll 
  ? MemberStatus.Active 
  : MemberStatus.Pending;
```

**Example**: `src/handlers/cognito/registerUser.ts:81`

#### Pattern 3: Multi-Feature Checks

Combine multiple feature checks:

```typescript
if (organization.features.docusignCheckout && 
    organization.features.endOfShiftPDF &&
    organization.docusign?.templateId) {
  // Execute complex feature logic
}
```

**Example**: `src/services/docusign.service.ts:440`

#### Pattern 4: Access Control with Features

Restrict functionality based on both user role and feature state:

```typescript
import { GraphQLError } from 'graphql'
import { isSuperAdmin, isAdmin } from '../utils/access'

if (organization.features.adminManagedProfilePhotos && 
    !isSuperAdmin(user) && 
    !isAdmin(user)) {
  throw new GraphQLError('This action requires admin privileges', {
    extensions: { code: 'FORBIDDEN' },
  })
}
```

#### Pattern 5: Query Organizations by Feature

Find organizations with specific features enabled:

```typescript
// In organization.service.ts
withYourFeatureEnabled(): Promise<IOrganization[]> {
  return this.organizationRepo.collection.find<IOrganization>({
    'features.yourFeatureName': true,
  }).toArray()
}
```

**Example**: `src/models/organizations/organization.service.ts:67-71`

### Toggling Features

#### Via GraphQL Mutation (Super Admin Only)

```graphql
mutation UpdateOrgFeatures {
  organization(organization: {
    id: "org_id_here"
    features: {
      yourFeatureName: true
    }
  }) {
    id
    features {
      yourFeatureName
    }
  }
}
```

#### Via Service Method (Programmatic)

Useful for testing or scripts:

```typescript
await organizations.setFeature({
  _id: new ObjectId('org_id_here'),
  feature: 'yourFeatureName',
  value: true
})
```

**Method**: `src/models/organizations/organization.service.ts:31-45`

### Access Control for Features

**Permission Levels:**
- **Super Admins**: Can enable/disable any feature for any organization
- **Regular Admins**: Cannot modify feature flags (features removed from update input)
- **Members**: No access to feature flag management

**Enforcement**: `src/graphql/resolvers/organization/organization.mutation.ts:60-62`
```typescript
if (!isSuperAdmin(user)) {
  delete org.features; // Regular admins cannot modify features
}
```

### Default Behavior

When a new feature is added:
1. **New organizations**: Receive the feature with its `defaultEnabled` value
2. **Existing organizations**: Feature field is automatically available (MongoDB flexible schema)
3. **Missing feature values**: Coerced to `false` by field resolvers

**Field Resolver**: `src/graphql/resolvers/organization/organization.fields.ts:60-63`
```typescript
OrganizationFeatures: featureDefinitions.reduce((acc, { value: key }) => ({
  ...acc,
  [key]: (parent: OrganizationFeatures) => !!parent[key], // Coerce to boolean
}), {}),
```

### Deployment Considerations

- **No Database Migration Required**: MongoDB's flexible schema automatically supports new fields
- **Backward Compatible**: Existing code continues to work; missing features default to `false`
- **Immediate Availability**: Features can be toggled via API immediately after deployment
- **No Serverless Config Changes**: Feature flags are application-level, not infrastructure-level

### Testing Feature Flags

**Unit Tests** (feature definition):
```typescript
test('feature should be defined correctly', () => {
  const feature = featureDefinitions.find(f => f.value === 'yourFeatureName')
  expect(feature).toBeDefined()
  expect(feature?.defaultEnabled).toBe(false)
})
```

**Integration Tests** (feature behavior):
```typescript
// In testing service
await testing.setFeature({
  orgId: testOrg._id,
  feature: 'yourFeatureName',
  value: true
})

// Test feature-specific behavior
const result = await yourService.doSomething()
expect(result).toBe(expectedValueWhenEnabled)
```

**Example**: `src/services/testing/testing.service.ts:98-115`

### Common Patterns Summary

| Pattern | Use Case | Example Location |
|---------|----------|------------------|
| Guard Clause | Skip feature logic if disabled | `interestList.service.ts:56` |
| Conditional Behavior | Alter behavior based on feature | `registerUser.ts:81` |
| Multi-Feature Check | Require multiple features | `docusign.service.ts:440` |
| Query by Feature | Find orgs with feature enabled | `organization.service.ts:67` |
| Access Control | Combine with user permissions | Custom implementation |

### Feature Flag Best Practices

1. **Default to False**: New features should typically default to `false` for safety
2. **Descriptive Names**: Use clear, action-oriented names (e.g., `adminManagedProfilePhotos`, not `photoFlag`)
3. **Guard Early**: Check feature flags at the entry point of feature-specific code
4. **Document Purpose**: Add comments explaining what the feature controls
5. **Test Both States**: Write tests for both enabled and disabled states
6. **Cleanup Old Flags**: Remove feature flags once features are fully rolled out and stable

### Troubleshooting

**Feature not appearing in GraphQL:**
- Run `yarn generate` to regenerate types
- Check schema.graphql has feature in both type and input
- Verify no syntax errors in schema

**Feature always returning false:**
- Check `featureDefinitions` in `organization.defaults.ts`
- Verify field resolver in `organization.fields.ts`
- Check database document has the feature field

**Tests failing:**
- Ensure `TZ=UTC` is set for test execution
- Verify imports include `featureDefinitions` and `features`
- Check test assertions match actual feature values

### Quick Reference Checklist

When adding a new feature flag:
- [ ] Add to `featureDefinitions` in `organization.defaults.ts`
- [ ] Add to `OrganizationFeatures` type in `schema.graphql`
- [ ] Add to `UpsertOrganizationFeatures` input in `schema.graphql`
- [ ] Run `yarn generate`
- [ ] Add tests in `organization.test.ts`
- [ ] Run `yarn lint` and fix any issues
- [ ] Run `yarn test` to verify all tests pass
- [ ] Implement feature-specific logic with guard clauses
- [ ] Document the feature purpose in code comments

