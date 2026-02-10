# AGENTS.md - Caleo Platform Monorepo

This file provides guidance to AI coding agents working in the Caleo monorepo. For directory-specific coding guidelines, see the `AGENTS.md` file within each directory.

## Platform Overview

Caleo is an overtime shift management platform for law enforcement agencies. It is a multi-tenant SaaS product deployed on AWS. The monorepo contains the backend API, infrastructure-as-code, two frontend applications, and operational scripts.

## Repository Structure

```
caleo-core/
├── backend/core/        # Core GraphQL API + Lambda functions
├── backend/terraform/   # AWS account-wide infrastructure (Terraform)
├── frontends/ui/        # Customer-facing frontend (React)
├── frontends/admin/     # Backoffice admin tool (React)
└── ops/migrations/      # Ad-hoc database migration scripts
```

## Directory Details

### `backend/core/` - Core API

The primary backend service powering the platform. Built with TypeScript, Apollo Server, AWS Lambda, and MongoDB. Uses a layered architecture: resolvers -> services -> repositories -> models.

**Key technologies:**
- **Runtime**: Node.js + TypeScript on AWS Lambda
- **API**: Apollo Server (GraphQL)
- **Database**: MongoDB (native driver, not Mongoose)
- **Notifications**: AWS Pinpoint (email/SMS via SES + SMS), being deprecated
- **Auth**: AWS Cognito
- **Bundler**: esbuild (via Serverless Framework)
- **IaC**: Serverless Framework
- **Testing**: Jest with mongodb-memory-server

See `backend/core/AGENTS.md` for detailed coding guidelines, patterns, and commands.

### `backend/terraform/` - Infrastructure

Manages account-wide AWS resources using Terraform. Organized into reusable modules and per-environment configurations.

```
backend/terraform/
├── modules/
│   ├── amplify-domain    # Amplify custom domain configuration
│   ├── cognito           # Cognito user pool setup
│   ├── cognito_provider  # Cognito identity providers
│   ├── hosted-zone       # Route53 hosted zones
│   └── public-s3         # Public S3 bucket configuration
└── environments/
    ├── dev               # Development environment
    └── prod              # Production environment
```

### `frontends/ui/` - Customer Frontend

The primary customer-facing web application. An overtime shift management UI used by law enforcement officers and administrators.

**Key technologies:**
- **Framework**: React 18 + TypeScript 4.9
- **UI Library**: Material-UI v5 (MUI)
- **Data**: Apollo Client (GraphQL)
- **Auth**: AWS Amplify (Cognito)
- **Maps**: MapLibre GL
- **Calendar**: FullCalendar
- **Build**: Create React App + CRACO
- **Deployment**: SST v3 to AWS

See `frontends/ui/AGENTS.md` for detailed coding guidelines, patterns, and commands.

### `frontends/admin/` - Backoffice Admin Tool

Internal admin application for platform operations. Used to:
- Provision new organizations
- Manage organization feature flags and access
- Impersonate users for troubleshooting

Built with a similar stack to `frontends/ui/` (React + TypeScript + MUI + Apollo Client), deployed via SST v3.

See `frontends/admin/AGENTS.md` for detailed coding guidelines, patterns, and commands.

### `ops/migrations/` - Migration Scripts

A collection of ad-hoc Node.js scripts used for one-off database data migrations. These are run manually when data shape changes require backfilling or transforming existing documents in MongoDB.

## Known Technical Debt & Planned Migrations

### AWS Pinpoint Replacement (Critical - EOY 2026 deadline)
AWS Pinpoint is being deprecated and expires at the end of 2026. The notification system in `backend/core/` needs to be migrated away from Pinpoint. SES (email) and SNS (SMS) are direct alternatives already partially in use.

### MongoDB Index Strategy Consolidation
The current MongoDB index creation is scattered and inconsistent. Indexes need to be consolidated into a coherent strategy. Mongoose is a potential option for managing schemas and indexes declaratively, though the team has reservations about adopting it.

### Build Tooling: esbuild -> Vite
The `backend/core/` bundler should be migrated from esbuild to Vite for consistency and better dev experience.

### IaC: Serverless Framework -> SST
The `backend/core/` deployment should be migrated from Serverless Framework to SST, which is already used by both frontend apps. This would unify the IaC approach across the monorepo.

### Frontend: MUI v5 -> Latest MUI
The `frontends/ui/` application needs to be upgraded to the latest version of Material-UI.

## Development Conventions

### Package Manager
All projects use **yarn**. There is no root-level `package.json` — this is not a workspaces monorepo. Each directory manages its own dependencies independently. Always `cd` into the relevant directory before running commands.

| Directory | Package Manager | Install | Run Script |
|-----------|----------------|---------|------------|
| `backend/core/` | yarn | `yarn install` | `yarn <script>` |
| `frontends/ui/` | yarn | `yarn install` | `yarn <script>` |
| `frontends/admin/` | yarn | `yarn install` | `yarn <script>` |
| `ops/migrations/` | yarn | `yarn install` | `yarn <script>` |

### Commit Conventions
This repo uses **conventional commits**. Format: `<type>: <description>`

Common types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `ci`

### GraphQL Schema as Source of Truth
The schema defined in `backend/core/schema.graphql` is the single source of truth. Changes to the schema affect:
- **Backend**: Run `yarn generate` in `backend/core/` to regenerate resolver types
- **Frontends**: Both `frontends/ui/` and `frontends/admin/` generate client types from the deployed GraphQL endpoint

If you modify the schema, be aware of the downstream impact on all three projects.

## Cross-Cutting Concerns

- **Auth**: AWS Cognito across all services. Backend validates JWT tokens; frontends use AWS Amplify SDK.
- **GraphQL Schema**: Defined in `backend/core/schema.graphql`. Both frontends and the backend generate types from this schema.
- **Multi-tenancy**: Organizations are isolated at the data layer (MongoDB). Frontends support subdomain routing (e.g., `lasd.caleo.com`, `lvmpd.caleo.com`).
- **Feature Flags**: Per-organization boolean toggles managed in the backend and consumed by frontends. See `backend/core/AGENTS.md` for the full feature flag guide.
- **Environments**: `dev` and `prod`, managed via Terraform (infra) and Serverless/SST (application).
