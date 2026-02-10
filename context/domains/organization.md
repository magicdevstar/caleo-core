# Organization

## Definition

An **organization** is a tenant within the Caleo platform, representing a single law enforcement agency. All users and data are logically partitioned by organization, creating isolated environments for each agency on the shared platform.

## Real-World Examples

- **LASD** (Los Angeles Sheriff's Department)
- **LVMPD** (Las Vegas Metropolitan Police Department)

## Why This Concept Matters

Organizations are the fundamental unit of multi-tenancy in Caleo:

1. **Data Isolation**: Strict partitioning ensures one agency's data never crosses into another's view or operations
2. **Customization**: Each agency has unique settings, features, timezone preferences, and business rules
3. **Future Portability**: All entities are labeled by organization to enable potential spin-off into isolated, standalone systems

## Key Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| **Name** | Agency identifier | "LASD", "LVMPD" |
| **Timezone** | Organization's operating timezone | "America/Los_Angeles" |
| **Week Start Day** | First day of the week for scheduling | Sunday, Monday |
| **Features** | Enabled feature flags | `{ lottery: true, sso: false, ... }` |
| **Settings** | Customizations and business rule configurations | Lottery windows, shift buffers, tier labels |

## Lifecycle

### Creation
- Internal Caleo super admins provision new organizations
- New orgs receive default feature flags and settings
- Organization becomes available immediately after provisioning

### Updates
- Super admins can modify organization settings and features
- Changes apply to all users within that organization
- No downtime required for configuration updates

### Deletion
- **Soft delete only** - Organizations are never hard deleted
- Marked with `removedAt` timestamp
- Data remains in database for audit and recovery purposes

### Merge/Split
- Not currently supported
- Future feature under consideration for agency consolidations or divisions

## Technical Implementation

### Multi-Tenancy Architecture
- Shared AWS Cognito user pool for authentication across all organizations
- Users logically partitioned by organization ID (`orgId`)
- All MongoDB documents include organization reference for filtering
- Data access enforced at service/repository layer

### Data Partitioning
```typescript
// Every entity includes organization reference
{
  _id: ObjectId,
  orgId: ObjectId,        // Organization partition key
  // ... entity-specific fields
}
```

### User Association
- Each user belongs to exactly one organization
- User's `orgId` determines which data they can access
- Cross-organization access is prohibited (except super admins)

## Related Concepts

- **[Feature Flags](../workflows/feature-flag-management.md)**: Control which features are enabled per organization
- **Users/Officers**: Belong to a single organization
- **Events/Shifts**: Scoped to a single organization
- **[Overtime Shift](./overtime-shift.md)**: All shifts are partitioned by organization

## Common Misunderstandings

**Misconception**: Organizations can share users or data  
**Reality**: Each organization is completely isolated; users and data never cross organization boundaries

**Misconception**: Organizations can be permanently deleted  
**Reality**: Only soft deletes are supported to maintain data integrity and audit trails

**Misconception**: Users can belong to multiple organizations  
**Reality**: Each user belongs to exactly one organization (though super admins can impersonate across orgs)

---

**Technical Location**: `backend/core/src/models/organizations/`  
**GraphQL Type**: `backend/core/schema.graphql:1660-1684` (Organization type)

*See [Domain Concepts Index](./INDEX.md) for related concepts*
