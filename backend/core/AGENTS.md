# AGENTS.md - Coding Guidelines for Caleo Core Backend

## Project Overview
This is a serverless GraphQL API built with TypeScript, Apollo Server, AWS Lambda, and MongoDB. The codebase follows a layered architecture with resolvers, services, repositories, and models.

## Build & Test Commands

### Core Commands
- `npm run lint` - Run ESLint on all source files
- `npm run lint:fix` - Auto-fix linting issues
- `npm run test` - Run all tests with UTC timezone
- `npm run generate` (or `npm run gen`) - Generate GraphQL types from schema

### Running Specific Tests
- `npm run test -- <test-file-name>` - Run a specific test file (e.g., `npm run test -- organization.test.ts`)
- `TZ=UTC jest --testPathPattern=<pattern>` - Run tests matching pattern
- Pre-configured test patterns:
  - `npm run test:assignments` - Assignment-related tests
  - `npm run test:shifts` - Shift-related tests
  - `npm run test:interest` - Interest list tests
  - `npm run test:dates` - Date utility tests

### Deployment
- `npm run deploy` - Generate types and deploy all functions
- `npm run deploy:graphql` - Deploy only the GraphQL handler
- `npm run offline` - Run serverless offline for local development

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
- Generate GraphQL types with `npm run generate` - never manually edit `__generated__/` files

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
- Run `npm run lint` before committing
- Generate types before deploying: `npm run generate`

## Key Files
- `schema.graphql` - GraphQL schema definition
- `codegen.yml` - GraphQL code generation config
- `serverless.yml` - AWS Lambda configuration
- `jest.config.js` - Test configuration
- `eslint.config.mjs` - Linting rules
