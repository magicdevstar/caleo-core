# Organization Feature Flag Management

## Overview

Organization feature flags are boolean toggles that enable or disable specific functionality on a per-organization basis. They provide a flexible mechanism to control feature availability without requiring code changes or redeployment.

## Business Purpose

Feature flags serve two primary business needs:

1. **Feature Gating**: Control release of new features that aren't ready for production yet
2. **Multi-Tenant Isolation**: Isolate features across different law enforcement organizations on the platform

This allows Caleo to:
- Gradually roll out new functionality to specific organizations
- Offer tiered feature sets (free vs. paid features)
- Handle organization-specific exceptions and requirements
- Test features with select organizations before broad release

## Key Actors

| Role | Responsibilities |
|------|-----------------|
| **Developers** | Create feature flag definitions, implement feature-specific code, deploy changes |
| **Super Admins** | Toggle features on/off for specific organizations via admin UI |
| **End Users** | Experience enabled/disabled features in the customer-facing application |

## Workflow Steps

### Step 1: Define Feature Flag (Developer)

**Location**: `backend/core/src/models/organizations/organization.defaults.ts` (lines 38-75)

Developer adds new feature to the `featureDefinitions` array:

```typescript
{ value: 'yourFeatureName', label: 'Your Feature Display Name', defaultEnabled: false }
```

**Decision Point**: Choose default value based on business strategy:
- `defaultEnabled: true` - Feature is standard functionality; specific orgs can opt-out as exceptions
- `defaultEnabled: false` - Feature is an upgrade; orgs must opt-in (typically paid or readiness-gated)

**Examples**:
- `autoEnroll` (default false) - Paid feature for automatic officer enrollment
- `eventCheckIn` (default false) - Optional check-in functionality for events
- `sso` (default false) - Enterprise SSO support (requires configuration)

### Step 2: Update GraphQL Schema (Developer)

**Location**: `backend/core/schema.graphql`

Add feature to both the output type and input type:

**Output Type** (OrganizationFeatures, ~line 1717):
```graphql
type OrganizationFeatures {
  yourFeatureName: Boolean!
}
```

**Input Type** (UpsertOrganizationFeatures, ~line 1948):
```graphql
input UpsertOrganizationFeatures {
  yourFeatureName: Boolean
}
```

**Note**: Output is required (`Boolean!`), input is optional (`Boolean`) to allow partial updates.

### Step 3: Generate TypeScript Types (Developer)

Run code generation to update TypeScript definitions:

```bash
cd backend/core
yarn generate
```

This updates `backend/core/src/__generated__/resolvers-types.ts` with the new feature type definitions.

### Step 4: Implement Feature Logic (Developer)

Use guard clauses in resolvers/services to check feature status:

```typescript
if (!organization.features.yourFeatureName) {
  return; // Feature disabled, skip processing
}

// Feature-specific logic here
```

**Common Patterns**:
- Guard clauses (most common) - Skip logic if feature disabled
- Conditional behavior - Alter behavior based on feature state
- Access control - Combine feature checks with user permissions

TODO: Link to specific code examples in `backend/core/AGENTS.md`

### Step 5: Deploy Changes

```bash
cd backend/core
yarn deploy
```

Once deployed:
- New organizations automatically receive the feature with its `defaultEnabled` value
- Existing organizations can access the feature field (MongoDB flexible schema)
- Missing feature values default to `false` via field resolvers

### Step 6: Toggle Feature (Super Admin)

**Location**: Admin UI at `frontends/admin/src/sections/organization/view/organization-details-view.tsx`

Super Admin navigates to organization details and toggles the feature on/off via the feature management interface.

**Permissions**:
- Only Super Admins can modify feature flags
- Regular admins cannot change feature settings
- Changes take effect immediately (no deployment required)

**Via GraphQL API** (alternative):
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

### Step 7: Feature Detection (Frontend)

**Location**: Customer UI at `frontends/ui/src/hooks/use-features.ts`

Frontend code checks feature status using the `useFeatures()` hook:

```typescript
import { useFeatures } from 'src/hooks/use-features';

function MyComponent() {
  const features = useFeatures();
  
  if (!features.yourFeatureName) {
    return null; // Feature disabled, hide component
  }
  
  // Render feature-specific UI
  return <YourFeatureComponent />;
}
```

**How it works**:
- Hook parses `flatFeatures` JSON from authenticated user's organization
- Returns all feature flags as boolean properties
- Component renders conditionally based on feature state

## Default Value Strategy

### When to Use `defaultEnabled: true`

**Use Case**: Feature is considered standard functionality; specific organizations opt-out as exceptions.

**Examples**:
- Core platform features that most organizations need
- Features being deprecated (enabled by default, disabled for orgs migrating away)
- Security or compliance features that should be on unless explicitly disabled

### When to Use `defaultEnabled: false`

**Use Case**: Feature is an upgrade or requires opt-in.

**Examples**:
- **Paid Features**: Organizations must purchase or subscribe (e.g., `docusign`, `eventInvoice`)
- **Readiness-Gated Features**: Requires setup or configuration before enabling (e.g., `sso`, `kiosk`)
- **Beta Features**: New functionality being tested with select organizations
- **Organization-Specific Features**: Custom features for specific clients (e.g., `lasdEventFields`, `lasdUserFields`)

## Edge Cases and Special Scenarios

### Complex Features Beyond Boolean Toggles

Some features require additional configuration beyond a simple on/off toggle (e.g., API keys, template IDs, URLs).

**Pattern**: Use feature branches for development, then merge to main with optional feature flag for gradual rollout.

**Example**: Docusign integration requires:
- Feature flag: `docusign` (boolean)
- Additional config: `organization.docusign.templateId` (string)
- Feature only works when both flag is enabled AND config is present

TODO: Document configuration pattern for complex features

### Feature Dependencies

Features are generally **flat and independent** - they don't depend on other features being enabled.

If a feature does require another feature, check both in your guard clause:

```typescript
if (!organization.features.docusignCheckout || 
    !organization.features.endOfShiftPDF) {
  return; // Both features required
}
```

### Handling Existing Organizations

When a new feature is added:

1. **New Organizations**: Automatically receive the feature with its `defaultEnabled` value
2. **Existing Organizations**: Feature field becomes available immediately (MongoDB flexible schema)
3. **Missing Values**: Field resolvers coerce missing values to `false`

**No database migration required** - MongoDB's flexible schema and GraphQL field resolvers handle backward compatibility.

### Rolling Back Features

Rollback process is straightforward:

1. Super Admin toggles feature to disabled in admin UI
2. Frontend immediately stops rendering feature-specific UI
3. Backend skips feature-specific logic due to guard clauses

**No deployment required** for rollback - feature flags provide instant on/off control.

## Business Rules Applied

- **Super Admin Only**: Only super admins can create/modify feature flag definitions and toggle features for organizations
- **Immediate Effect**: Feature toggles take effect immediately without requiring app restart or redeployment
- **Default Values**: New features follow default enabled/disabled strategy based on feature tier (standard vs. upgrade)
- **Multi-Tenant Isolation**: Each organization has independent feature flag settings

## Success Criteria

A feature flag is successfully implemented when:

- ✅ Feature definition exists in `organization.defaults.ts`
- ✅ GraphQL schema includes feature in both output and input types
- ✅ TypeScript types are generated without errors
- ✅ Feature logic includes guard clauses checking feature state
- ✅ Super admin can toggle feature in admin UI
- ✅ Customer frontend correctly shows/hides feature based on flag
- ✅ Default value aligns with business strategy (standard vs. upgrade)

## Related Documentation

### Technical Implementation
- **Backend Guide**: [backend/core/AGENTS.md](../../backend/core/AGENTS.md) - "Adding Organization Feature Flags" section
- **Admin Frontend**: [frontends/admin/AGENTS.md](../../frontends/admin/AGENTS.md)
- **Customer Frontend**: [frontends/ui/AGENTS.md](../../frontends/ui/AGENTS.md)

### Related Workflows
- TODO: Link to organization provisioning workflow
- TODO: Link to feature testing/QA workflow

### Code Locations
- **Feature Definitions**: `backend/core/src/models/organizations/organization.defaults.ts:38-75`
- **GraphQL Schema**: `backend/core/schema.graphql` (OrganizationFeatures ~1717, UpsertOrganizationFeatures ~1948)
- **Admin UI Toggle**: `frontends/admin/src/sections/organization/view/organization-details-view.tsx:19`
- **Frontend Hook**: `frontends/ui/src/hooks/use-features.ts:9-28`
- **Service Methods**: `backend/core/src/models/organizations/organization.service.ts`
