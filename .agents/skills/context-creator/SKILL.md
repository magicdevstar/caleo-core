---
name: context-creator
description: Create business domain context documentation through interactive Q&A. Use when the user wants to document business domain knowledge, create system context, capture business rules and workflows, or when they say "help me create context" or "document domain knowledge". This skill helps capture the "what" and "why" of the system from a business perspective, complementing technical AGENTS.md files.
---

# Context Creator

## Overview

This skill guides you through creating business domain documentation via interactive Q&A. It captures business rules, workflows, domain concepts, and entity relationships in organized markdown files at `context/` in the project root.

## Purpose

Context documentation complements technical AGENTS.md files:

**Context files** (what this skill creates):
- Business perspective: what/why
- Domain language and terminology
- Business rules and rationale
- User workflows and processes

**AGENTS.md files** (technical docs):
- Technical perspective: how
- Code patterns and architecture
- API endpoints and data models
- Developer implementation details

## Output Structure

Documentation is organized in `context/` directory:

```
context/
├── README.md                     # Overview of context structure
├── domain.md                     # Core domain concepts & terminology
├── entities.md                   # Business entities & relationships
├── workflows/                    # One file per workflow
│   ├── shift-creation.md
│   ├── shift-assignment.md
│   └── ...
└── business-rules/               # One file per rule category
    ├── eligibility.md
    ├── scheduling-constraints.md
    └── ...
```

## Interactive Q&A Workflow

Follow this step-by-step process when the skill is invoked.

### Step 1: Initialize Directory Structure

Before starting the Q&A process, ensure the context directory structure exists.

Run the helper script:

```bash
node .agents/skills/context-creator/scripts/ensure-context-dirs.js
```

This creates:
- `context/` directory at project root
- `context/workflows/` subdirectory
- `context/business-rules/` subdirectory
- `context/README.md` explaining the structure

### Step 2: Determine Documentation Topic

Ask the user what they want to document today. Use the Question tool to present options:

**Question**: "What would you like to document today?"

**Options**:
1. **Core domain concepts** - Updates `context/domain.md` with terminology and key concepts
2. **Business entity/data model** - Updates `context/entities.md` with entity definitions and relationships
3. **A specific workflow** - Creates `context/workflows/<workflow-name>.md`
4. **A specific business rule** - Creates `context/business-rules/<rule-name>.md`

### Step 3: Ask Targeted Questions

Based on the user's selection, use the question bank in `references/question-bank.md` to guide your questions.

#### For Domain Concepts (context/domain.md)

Start with:
- "What domain concept would you like to document?"
- "How would you define this concept in business terms?"
- "Why is this concept important to the business?"

Follow up with:
- "How does this concept relate to other concepts?"
- "Can you give me a concrete example?"
- "What are common misunderstandings about this concept?"

#### For Business Entities (context/entities.md)

Start with:
- "What entity would you like to document?"
- "What does this entity represent in the real world?"
- "What are the key attributes that define this entity?"

Follow up with:
- "What other entities does this relate to?"
- "How is this entity created, updated, and deleted?"
- "What states or status values can this entity have?"

#### For Workflows (context/workflows/<name>.md)

Start with:
- "What is this workflow called?" (for file naming)
- "What does this workflow accomplish?"
- "What triggers or initiates this workflow?"

Follow up with:
- "Who are the key actors/roles involved?"
- "What are the main steps in this workflow?"
- "What business rules are applied during this workflow?"
- "What are common edge cases or exceptions?"
- "What defines successful completion?"

#### For Business Rules (context/business-rules/<name>.md)

Start with:
- "What is this business rule called?" (for file naming)
- "Can you state the rule in plain language?"
- "Why does this rule exist? What's the business rationale?"

Follow up with:
- "When does this rule apply?"
- "What happens when this rule is violated?"
- "Are there any exceptions to this rule?"
- "Who can override this rule, if anyone?"

### Step 4: Active Listening & Follow-Ups

**Techniques for effective Q&A**:

1. **Listen for cues**: If user mentions terminology, ask for definitions; if they mention exceptions, dig into edge cases

2. **Paraphrase and confirm**: "So if I understand correctly, [paraphrase]. Is that accurate?"

3. **Ask for examples**: "Can you give me a concrete example of when this happens?"

4. **Probe deeper when needed**: "Can you elaborate on [specific point]?"

5. **Respect brevity preference**: User wants brief summaries that can be expanded later, so don't over-question on first pass

6. **Use TODO markers**: Add "TODO: Expand with more examples" for areas that need future detail

### Step 5: Summarize and Confirm

Before creating/updating files:

1. **Summarize** what you've captured in clear, structured format
2. **Ask for confirmation**: "Does this capture what you've explained?"
3. **Offer corrections**: "Is there anything missing or incorrect?"
4. **Check completeness**: "Would you like to add more detail to any section?"

### Step 6: Create or Update Files

Based on the topic and information gathered:

#### For New Files

Use the Write tool to create the file following the appropriate template from `references/output-patterns.md`:

- Workflows: Use workflow template
- Business rules: Use business rule template
- Domain concepts: Use domain concepts section pattern
- Entities: Use entity documentation section pattern

**File naming**: Use kebab-case (e.g., `shift-creation.md`, `eligibility-requirements.md`)

#### For Existing Files

Use the Read tool to check current content, then Edit tool to update:

- Add new sections
- Expand existing content
- Update TODO markers
- Add cross-references

### Step 7: Offer Next Steps

After creating/updating the file, ask:

**Question**: "What would you like to do next?"

**Options**:
1. **Document another topic** - Return to Step 2
2. **Expand what we just created** - Ask more detailed questions about the same topic
3. **Add related documentation** - Suggest related workflows, rules, or concepts to document
4. **Done for now** - Conclude the session

## Asking Effective Questions

### Start Broad, Then Narrow

```
Broad:    "What does this workflow accomplish?"
Medium:   "What are the main steps?"
Specific: "What validation happens at step 3?"
```

### Use the 5W1H Framework

- **What**: What is this concept/workflow/rule?
- **Who**: Who are the actors/roles involved?
- **Where**: Where do these operations happen? (contexts)
- **When**: When does this apply/trigger?
- **Why**: Why does this exist? (business rationale)
- **How**: How do users accomplish this? (workflow steps)

### Adapt to User Responses

**If user gives brief answer**: Ask for example or elaboration
- "Can you give me a concrete example?"
- "Can you elaborate on that?"

**If user gives lengthy answer**: Summarize and confirm
- "Let me make sure I understand: [summary]. Correct?"

**If user seems uncertain**: Offer to document placeholder
- "We can add a TODO here and come back to it later"
- "Would you like to document this later when you have more clarity?"

### Know When to Move On

Don't belabor points that are clearly understood. The goal is brief summaries that can be expanded later, so:

- Capture the essentials first
- Add TODO markers liberally
- Move to next topic when ready
- User can always expand later

## Using Bundled Resources

### references/question-bank.md

Comprehensive library of questions categorized by topic:
- Domain concepts questions
- Entity/data model questions
- Workflow questions
- Business rules questions
- General follow-up questions

**When to read**: Reference as needed during Q&A to find targeted questions for specific situations.

### references/output-patterns.md

Templates and examples for each documentation type:
- Domain concepts template with example
- Entity documentation template
- Workflow documentation template
- Business rule documentation template
- File naming conventions
- Integration with AGENTS.md

**When to read**: Before creating new files to follow established patterns and structure.

## Best Practices

### Brief Summaries First

User wants concise documentation that can be expanded incrementally:

✅ **Good**: Core information with TODO markers
```markdown
## Step 3: Validate Eligibility
System checks if officer meets eligibility criteria.

TODO: Add specific validation rules
TODO: Document error messages shown to user
```

❌ **Avoid**: Trying to capture every detail on first pass
```markdown
## Step 3: Validate Eligibility
System performs comprehensive validation including checking certification expiration dates (which must be within 12 months), verifying the officer hasn't exceeded monthly overtime limits (configured per organization, typically 80 hours), ensuring no scheduling conflicts exist with the officer's regular duty schedule or previously claimed shifts, validating rank requirements...
[lengthy details that could be added later]
```

### Use TODO Markers

Add TODO items for future expansion:
- `TODO: Add more examples`
- `TODO: Document edge cases`
- `TODO: Add validation error messages`
- `TODO: Link to related business rules`

### Cross-Reference Generously

Link related documentation:
- Link workflows to the business rules they apply
- Link business rules to the workflows where they're used
- Link entities to the workflows that manipulate them
- Link domain concepts to concrete entities and workflows
- Link to AGENTS.md for technical implementation

Example:
```markdown
## Business Rules Applied
- [Officer Eligibility](../business-rules/eligibility.md)
- [Scheduling Constraints](../business-rules/scheduling-constraints.md)

## Technical Implementation
See [backend/core/AGENTS.md](../../backend/core/AGENTS.md) for GraphQL resolvers and validation logic.
```

### Use Business Language

Write for non-technical stakeholders:

✅ **Good**: "Officers can claim available overtime shifts"
❌ **Avoid**: "Users can POST to the /shifts/:id/claim endpoint"

✅ **Good**: "System validates eligibility before allowing assignment"
❌ **Avoid**: "Resolver checks eligibility rules in the validation middleware"

### Provide Concrete Examples

Abstract concepts become clearer with examples:

```markdown
### Overtime Shift
**Examples**:
- Special event coverage: A concert venue needs 3 officers for crowd control
- Emergency coverage: Storm response requires additional patrol officers
- Community service: School crossing guard coverage during regular officer absences
```

### Keep Files Focused

Each workflow or business rule gets its own file:

✅ **Good**: 
- `workflows/shift-creation.md`
- `workflows/shift-assignment.md`
- `workflows/shift-approval.md`

❌ **Avoid**: 
- `workflows/all-shift-workflows.md` (too broad)

### Incremental Documentation

Build context over time:

1. **First pass**: Create basic structure with essentials
2. **Second pass**: Expand with more details and examples
3. **Ongoing**: Update as business rules evolve

Don't try to document everything at once. It's better to have several concise, accurate files than one exhaustive but incomplete document.

## File Naming Conventions

Use kebab-case for all files:

**Workflows**: `[action]-[object].md`
- ✅ `shift-creation.md`
- ✅ `officer-assignment.md`
- ✅ `approval-processing.md`

**Business Rules**: `[domain]-[rule-type].md`
- ✅ `eligibility-requirements.md`
- ✅ `scheduling-constraints.md`
- ✅ `overtime-limits.md`

**Generic**: `[descriptive-name].md`
- ✅ `domain.md`
- ✅ `entities.md`

## Handling Special Cases

### When User Wants to Update Existing Files

1. Use Read tool to load current content
2. Show user relevant section
3. Ask: "What would you like to add or update?"
4. Use Edit tool to make targeted changes
5. Confirm changes with user

### When User Wants to Create Index Files

If subdirectories grow large, create index files:

**context/workflows/README.md**:
```markdown
# Workflows

## Shift Management
- [Shift Creation](./shift-creation.md)
- [Shift Assignment](./shift-assignment.md)
- [Shift Approval](./shift-approval.md)

## Officer Management
- [Officer Onboarding](./officer-onboarding.md)
- [Certification Tracking](./certification-tracking.md)
```

### When Business Rules Vary by Organization

Document variations in the rule file:

```markdown
## Organizational Variations

**LASD (Los Angeles Sheriff's Department)**:
- Maximum overtime hours: 80 per month
- Rationale: Union agreement terms

**LVMPD (Las Vegas Metropolitan Police)**:
- Maximum overtime hours: 100 per month
- Rationale: Different staffing model
```

### When Documentation Conflicts with AGENTS.md

Context documentation represents business requirements and domain knowledge, while AGENTS.md represents technical implementation. If they conflict:

1. Document the business requirement in context/
2. Note the discrepancy: "TODO: Verify implementation matches business rule"
3. Suggest investigating whether implementation or business rule needs updating

## Example Q&A Session

**Agent**: What would you like to document today?

**User**: I want to document the shift creation workflow.

**Agent**: Great! Let's capture the shift creation workflow. What triggers the creation of an overtime shift?

**User**: Administrators identify a need for extra coverage - could be a special event, emergency, or planned coverage gap.

**Agent**: Who are the key actors involved in this workflow?

**User**: The administrator who creates the shift, and then later officers who can view and claim it.

**Agent**: What are the main steps from creation to assignment?

**User**: Administrator fills out shift details like date, time, location, and requirements. System validates the information. Shift becomes available to eligible officers. Officers can view and claim it. Administrator reviews and approves the assignment.

**Agent**: What business rules are checked when creating the shift?

**User**: Valid date/time, required fields are filled, location is valid, any special requirements like certifications.

**Agent**: What about edge cases - any unusual situations?

**User**: Sometimes shifts overlap with scheduled events, or need last-minute changes, or nobody eligible claims them.

**Agent**: Perfect. Let me summarize what you've told me:

[Agent summarizes in structured format]

Does this capture the shift creation workflow accurately?

**User**: Yes, that looks good.

**Agent**: [Creates context/workflows/shift-creation.md with the captured information]

I've created `context/workflows/shift-creation.md`. What would you like to do next?

**User**: Let's document the eligibility rules.

**Agent**: [Continues with business rule documentation...]

## Maintenance and Evolution

### Updating Documentation

As the system evolves:

1. **Regular reviews**: Periodically review context files for accuracy
2. **Expand TODOs**: Gradually expand placeholder sections
3. **Add examples**: Include real-world scenarios as they arise
4. **Update cross-references**: Keep links current as files are added/changed

### Version Control

Context files should be committed to git:
- Track changes to business rules over time
- Document rationale for rule changes
- Maintain history of domain evolution

### Collaboration

Multiple people can contribute:
- Subject matter experts provide domain knowledge
- Product owners clarify business rules
- Support team adds edge cases from tickets
- Developers sync technical implementation

## Success Criteria

Good context documentation should:

✅ Help new team members understand the business domain  
✅ Clarify why certain features exist  
✅ Document business rules in plain language  
✅ Capture workflows from user perspective  
✅ Complement (not duplicate) technical AGENTS.md  
✅ Be maintainable and easy to update  
✅ Include concrete examples  
✅ Use consistent structure and formatting  

## Related Skills

- **conventional-commit**: Use when committing context documentation changes
- **skill-creator**: Reference for understanding skill patterns (this skill follows those patterns)
