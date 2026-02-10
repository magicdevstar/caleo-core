# Output Patterns and Templates

This reference provides templates and patterns for organizing context documentation. Use these as starting points and adapt based on the specific content being documented.

## General Guidelines

### Writing Style
- Use clear, concise language
- Write for someone unfamiliar with the domain
- Use business terminology, not just technical jargon
- Include examples to illustrate concepts
- Focus on "what" and "why" rather than "how"

### Structure
- Start with a brief overview/summary
- Use headers to organize content hierarchically
- Include links to related documentation
- Add TODO markers for future expansion
- Keep summaries brief (can be expanded later)

### Linking
- Link to related context files using relative paths
- Reference AGENTS.md for technical implementation details
- Cross-reference workflows, business rules, and entities

---

## Template: Domain Concepts (context/domain.md)

Use this template for documenting core domain terminology and concepts.

```markdown
# Domain Concepts

## Overview
Brief description of the domain and its primary focus.

## Core Concepts

### [Concept Name]
**Definition**: Clear, business-oriented definition of the concept.

**Purpose**: Why this concept matters to the business.

**Related Concepts**: 
- [Other Concept] - brief description of relationship
- [Another Concept] - brief description of relationship

**Key Characteristics**:
- Characteristic 1
- Characteristic 2

**Common Usage**: How this concept appears in everyday business operations.

**Examples**:
- Example scenario 1
- Example scenario 2

**Common Misunderstandings**: Clarifications of frequent confusion points.

---

### [Next Concept Name]
[Repeat structure above]

## Domain-Specific Terminology

| Term | Definition | Context |
|------|------------|---------|
| Term 1 | Definition | When/where it's used |
| Term 2 | Definition | When/where it's used |

## Related Documentation
- [Entities](./entities.md) - Data models that embody these concepts
- [Business Rules](./business-rules/) - Rules governing these concepts
- Technical Implementation: See [backend/core/AGENTS.md](../backend/core/AGENTS.md)

## TODO
- [ ] Add more examples for [concept]
- [ ] Document edge cases for [concept]
```

### Example: Domain Concepts

```markdown
# Domain Concepts

## Overview
The overtime shift management domain focuses on scheduling and managing extra-duty shifts for law enforcement officers beyond their regular assignments.

## Core Concepts

### Overtime Shift
**Definition**: A temporary work assignment offered to law enforcement officers beyond their regular scheduled hours, typically for special events, emergency coverage, or community services.

**Purpose**: Provides flexible staffing for unplanned or special needs while offering officers additional income opportunities.

**Related Concepts**: 
- Officer - The person who can claim and work the shift
- Organization - The law enforcement agency managing the shift
- Eligibility - Rules determining who can work which shifts

**Key Characteristics**:
- Time-bound (specific start and end times)
- Optional (officers choose whether to accept)
- Compensated (payment terms defined)
- Location-specific (physical location where work occurs)

**Common Usage**: Administrators create overtime shifts for upcoming events; eligible officers browse and claim available shifts; supervisors approve shift assignments.

**Examples**:
- Special event coverage: A concert venue needs 3 officers for crowd control
- Emergency coverage: Storm response requires additional patrol officers
- Community service: School crossing guard coverage during regular officer absences

**Common Misunderstandings**: 
- Overtime shifts are NOT mandatory assignments (unlike regular duty)
- Overtime shifts may have different eligibility requirements than regular duty

---

### Officer Eligibility
**Definition**: The set of criteria that determines whether a specific officer is permitted to claim and work a particular overtime shift.

**Purpose**: Ensures shifts are staffed by qualified personnel and maintains fairness in opportunity distribution.

**Related Concepts**:
- Overtime Shift - The assignment being evaluated
- Officer - The person whose eligibility is being determined
- Business Rules - The specific criteria used for determination

**Key Characteristics**:
- Rule-based (defined by organization policies)
- Dynamic (can change based on officer status, shift history, certifications)
- Transparent (officers can see why they're eligible or ineligible)

**Common Usage**: System evaluates eligibility when displaying available shifts to officers; administrators review eligibility rules when creating shifts.

**Examples**:
- Certification requirement: Only officers with SWAT training can claim SWAT-related shifts
- Fair distribution: Officers who've worked fewer overtime hours get priority
- Rank requirement: Supervisory shifts require minimum rank of sergeant

## Domain-Specific Terminology

| Term | Definition | Context |
|------|------------|---------|
| Extra Duty | Alternative term for overtime shift | Used interchangeably in some organizations |
| Claim | Officer action to request/accept an available shift | "Officer claims a shift" |
| Assignment | Final allocation of shift to an officer | "Shift assigned to officer after approval" |
| Eligibility Pool | Set of officers who meet criteria for a shift | Used in scheduling algorithms |

## Related Documentation
- [Entities](./entities.md) - Officer, Shift, Organization data models
- [Workflows](./workflows/) - Shift creation, assignment, approval processes
- [Business Rules](./business-rules/) - Eligibility rules, scheduling constraints
- Technical Implementation: See [backend/core/AGENTS.md](../backend/core/AGENTS.md)

## TODO
- [ ] Add more examples for eligibility scenarios
- [ ] Document organization-specific terminology variations
```

---

## Template: Entity Documentation (context/entities.md)

Use this template for documenting key business entities and their relationships.

```markdown
# Business Entities

## Overview
Brief description of the main entities in the domain and how they relate.

## Entity: [Entity Name]

### Business Description
What this entity represents in the real world.

### Key Attributes

| Attribute | Description | Type | Required | Notes |
|-----------|-------------|------|----------|-------|
| attribute1 | Description | String | Yes | Additional context |
| attribute2 | Description | Number | No | Default value: X |

### Relationships

**Related To: [Other Entity]**
- Relationship type: One-to-many / Many-to-many / One-to-one
- Description: How they relate in business terms
- Example: "Each Shift belongs to one Organization"

**Related To: [Another Entity]**
- [Same structure as above]

### Lifecycle

1. **Creation**: How/when this entity is created
   - Trigger: What initiates creation
   - Required data: Minimum information needed
   
2. **Updates**: What can change over time
   - Mutable attributes: Which fields can be updated
   - Restrictions: What can't be changed and why

3. **Deletion**: How/when this entity can be removed
   - Conditions: When deletion is allowed
   - Impact: What happens to related entities

### States/Status Values

| State | Meaning | Transitions From | Transitions To |
|-------|---------|------------------|----------------|
| State1 | Description | Previous states | Next states |
| State2 | Description | Previous states | Next states |

### Business Rules

Link to relevant business rules that govern this entity:
- [Rule Name](./business-rules/rule-name.md) - Brief description
- [Another Rule](./business-rules/another-rule.md) - Brief description

### Related Workflows

Workflows that involve this entity:
- [Workflow Name](./workflows/workflow-name.md) - Brief description

### Examples

**Example 1: [Scenario Name]**
```
Concrete example showing this entity in context
```

**Example 2: [Another Scenario]**
```
Another concrete example
```

### Technical Implementation
See [backend/core/AGENTS.md](../backend/core/AGENTS.md) for data model details.

---

## Entity: [Next Entity]
[Repeat structure above]

## Entity Relationship Diagram

```
[Optional: ASCII or description of how entities relate]

Organization (1) ----< (many) Shift
Shift (many) ----< (many) Officer
Officer (1) ----< (many) Assignment
```

## TODO
- [ ] Document additional entities: [entity names]
- [ ] Add more detailed state transition rules
- [ ] Create visual entity relationship diagram
```

---

## Template: Workflow Documentation (context/workflows/<workflow-name>.md)

Use this template for documenting specific workflows. Each workflow gets its own file.

```markdown
# [Workflow Name]

## Overview
One-sentence description of what this workflow accomplishes.

## Business Purpose
Why this workflow exists and what business value it provides.

## Trigger
What initiates this workflow:
- User action: [specific action]
- System event: [specific event]
- Schedule: [timing]
- Other: [description]

## Actors

### [Role/Actor Name]
- **Responsibilities**: What this actor does in the workflow
- **Permissions Required**: Access levels needed
- **Typical Users**: Who typically has this role

### [Another Role]
[Same structure as above]

## Prerequisites
What must be true before this workflow can start:
- [ ] Prerequisite 1
- [ ] Prerequisite 2

## Workflow Steps

### 1. [Step Name]
**Actor**: Who performs this step

**Action**: What happens in this step

**Details**:
- Sub-action or detail 1
- Sub-action or detail 2

**Validation**: Business rules checked at this step
- [Rule Name](../business-rules/rule-name.md)

**Possible Outcomes**:
- Success: Proceeds to step 2
- Failure: [What happens on failure]

---

### 2. [Next Step Name]
[Repeat structure above]

---

### 3. [Conditional Step Name]
**Condition**: When this step occurs (e.g., "If approval is required")

[Rest of step structure]

---

## Decision Points

### [Decision Name]
**Condition**: What determines the path

**Path A**: Description of what happens if condition is true
- Leads to: [Next step]

**Path B**: Description of what happens if condition is false
- Leads to: [Different step]

## Success Criteria
What defines successful completion:
- [ ] Criterion 1
- [ ] Criterion 2

## Failure Scenarios

### [Failure Scenario Name]
**Cause**: What causes this failure

**Handling**: How the system handles it
- User notification: [What user sees]
- System action: [What system does]
- Recovery: [How to recover]

## Business Rules Applied

Links to business rules that govern this workflow:
- [Rule Name](../business-rules/rule-name.md) - When it's applied
- [Another Rule](../business-rules/another-rule.md) - When it's applied

## Edge Cases

### [Edge Case Name]
**Scenario**: Description of unusual situation

**Handling**: How the workflow handles this case

### [Another Edge Case]
[Same structure]

## Related Workflows

Workflows that interact with or follow this one:
- [Workflow Name](./related-workflow.md) - How they relate
- [Another Workflow](./another-workflow.md) - How they relate

## Examples

### Example 1: [Typical Scenario]
Step-by-step walkthrough of a typical execution:
1. User does X
2. System validates Y
3. Result is Z

### Example 2: [Edge Case Scenario]
Step-by-step walkthrough of an edge case:
1. User does A
2. System encounters unusual condition B
3. Result is C

## Notifications & Communications

What notifications are sent during this workflow:
- **To [Role]**: Message content / purpose
- **To [Another Role]**: Message content / purpose

## Technical Implementation
See [backend/core/AGENTS.md](../backend/core/AGENTS.md) for API endpoints and technical details.

## TODO
- [ ] Add more edge case documentation
- [ ] Document error messages and their meanings
- [ ] Add user interface screenshots (if applicable)
```

---

## Template: Business Rule Documentation (context/business-rules/<rule-name>.md)

Use this template for documenting specific business rules. Each rule or rule category gets its own file.

```markdown
# [Rule Name or Category]

## Rule Statement
Clear, concise statement of the rule in plain language.

Example: "Officers must have completed required certification within the past 12 months to be eligible for specialized shifts."

## Business Rationale

**Why This Rule Exists**:
Explanation of the business reason, compliance requirement, or operational need.

**Business Value**:
- Value point 1
- Value point 2

**Without This Rule**:
What problems would occur if this rule didn't exist.

## Scope

**Applies To**:
- Entity/entities affected
- User roles affected
- Organizational contexts (if applicable)

**When Active**:
- Always
- During specific time periods
- Under certain conditions

**Exceptions**:
Situations where this rule does not apply:
- Exception 1 and why
- Exception 2 and why

## Rule Details

### Conditions
Specific conditions that must be met:
1. Condition 1 with details
2. Condition 2 with details

### Parameters
If the rule has configurable parameters:
- Parameter name: Description, typical value
- Another parameter: Description, typical value

### Calculations
If the rule involves calculations, show the formula or logic:
```
Example: Eligibility Score = (Hours Worked × 0.5) + (Certification Count × 2)
```

## Enforcement

**Enforcement Type**:
- Prevention (action cannot be taken)
- Validation (warning shown, action can proceed)
- Post-check (action allowed, flagged for review)

**When Checked**:
- On user action (e.g., when claiming shift)
- On schedule (e.g., nightly batch)
- On event (e.g., when status changes)

**Violation Handling**:
What happens when the rule is violated:
- User sees: [error message or warning]
- System does: [automatic action]
- Logs/alerts: [what's recorded]

## Override Capability

**Can Be Overridden**: Yes / No

**Who Can Override**:
- Role with override permission
- Conditions under which override is allowed

**Override Process**:
1. Step 1 of override process
2. Step 2 of override process

**Override Logging**:
What's recorded when rule is overridden

## Related Rules

Rules that interact with or depend on this rule:
- [Related Rule](./related-rule.md) - Nature of relationship
- [Another Rule](./another-rule.md) - Nature of relationship

**Potential Conflicts**:
Any known conflicts with other rules and how they're resolved.

## Usage in Workflows

Workflows where this rule is applied:
- [Workflow Name](../workflows/workflow-name.md) - At which step
- [Another Workflow](../workflows/another-workflow.md) - At which step

## Examples

### Example 1: Rule Applied Successfully
**Scenario**: Describe the situation

**Rule Evaluation**: How the rule was checked

**Outcome**: What happened (action allowed)

### Example 2: Rule Violation
**Scenario**: Describe the situation

**Rule Evaluation**: How the rule was checked

**Outcome**: What happened (action blocked, warning shown, etc.)

**User Experience**: What the user saw/experienced

### Example 3: Edge Case
**Scenario**: Describe unusual situation

**Rule Evaluation**: How the rule handled it

**Outcome**: Result

## Rule Evolution

**Stability**: How often this rule changes
- Stable (rarely changes)
- Evolving (changes periodically)
- Configurable (varies by organization)

**History**:
- Previous versions of this rule (if applicable)
- Why changes were made

**Future Changes**:
- Planned modifications
- Considerations for future

## Organizational Variations

If this rule varies by organization or can be configured:

**Organization A**:
- Configuration: [specific settings]
- Rationale: [why configured this way]

**Organization B**:
- Configuration: [specific settings]
- Rationale: [why configured this way]

## Technical Implementation
See [backend/core/AGENTS.md](../backend/core/AGENTS.md) for validation logic and implementation details.

## TODO
- [ ] Add more examples
- [ ] Document edge cases
- [ ] Gather metrics on rule violations
```

---

## File Naming Conventions

### Use Kebab-Case
- ✅ `shift-creation.md`
- ✅ `officer-eligibility.md`
- ✅ `overtime-calculation.md`
- ❌ `ShiftCreation.md`
- ❌ `officer_eligibility.md`

### Be Descriptive
- ✅ `shift-assignment-workflow.md` (clear purpose)
- ✅ `certification-requirements.md` (specific topic)
- ❌ `workflow1.md` (too generic)
- ❌ `rules.md` (too broad)

### Use Consistent Patterns
For workflows: `[action]-[object].md`
- `shift-creation.md`
- `officer-assignment.md`
- `approval-processing.md`

For business rules: `[domain]-[rule-type].md`
- `eligibility-requirements.md`
- `scheduling-constraints.md`
- `overtime-limits.md`

---

## Integration with AGENTS.md

Context documentation complements technical AGENTS.md files:

**Context Files (context/)**: 
- Business perspective ("what" and "why")
- Domain language and terminology
- Business rules and workflows
- Non-technical stakeholder viewpoint

**AGENTS.md Files**:
- Technical perspective ("how")
- Code patterns and conventions
- API endpoints and data models
- Developer-focused guidance

**Cross-Referencing**:

In context files, reference technical implementation:
```markdown
## Technical Implementation
See [backend/core/AGENTS.md](../backend/core/AGENTS.md) for:
- GraphQL resolvers handling this workflow
- Database schema for entities
- Validation logic for business rules
```

In AGENTS.md, reference business context:
```markdown
## Business Context
For business rules and workflows, see:
- [Domain concepts](../context/domain.md)
- [Shift creation workflow](../context/workflows/shift-creation.md)
- [Eligibility rules](../context/business-rules/eligibility.md)
```

---

## Tips for Effective Documentation

### Start Simple, Expand Later
1. Write a brief summary first
2. Add TODO markers for future expansion
3. Iterate and expand over time

### Use Examples Liberally
- Concrete examples clarify abstract concepts
- Show both typical and edge cases
- Use realistic scenarios from the domain

### Keep It Maintainable
- Break large topics into multiple files
- Use consistent structure across files
- Link related documentation
- Date significant changes

### Make It Discoverable
- Use clear, searchable file names
- Include overview/summary sections
- Create index files for subdirectories
- Cross-reference related topics

### Write for Your Audience
- Use business language for business concepts
- Avoid unnecessary jargon
- Define domain-specific terms
- Assume reader is learning the domain
