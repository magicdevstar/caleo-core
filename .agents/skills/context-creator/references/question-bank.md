# Question Bank for Domain Knowledge

This reference provides categorized questions to guide the interactive Q&A process when documenting business domain knowledge. Use these questions as starting points and adapt based on the user's responses.

## Domain Concepts Questions

Use when documenting core terminology and concepts in `context/domain.md`.

### Initial Questions
- What is this concept called? (What term do users/stakeholders use?)
- How would you define this concept in business terms?
- What makes this concept important to the business?

### Relationship Questions
- How does this concept relate to other concepts in the domain?
- What other concepts depend on or interact with this one?
- Are there any hierarchies or groupings? (e.g., parent-child, categories)

### Context Questions
- In what contexts or situations does this concept appear?
- Are there different variations or types of this concept?
- What are common misunderstandings about this concept?

### Example Prompts
- "Can you give me an example of [concept] in a real scenario?"
- "How would you explain [concept] to a new team member?"
- "What would happen if [concept] didn't exist in the system?"

## Entity/Data Model Questions

Use when documenting entities and their relationships in `context/entities.md`.

### Core Entity Questions
- What is this entity called? (Use business terminology)
- What does this entity represent in the real world?
- What are the key attributes that define this entity?

### Relationship Questions
- What other entities does this one relate to?
- What is the nature of each relationship? (one-to-one, one-to-many, many-to-many)
- Are there required vs optional relationships?

### Lifecycle Questions
- How is this entity created? (What triggers creation?)
- Can this entity be updated? What attributes change over time?
- Can this entity be deleted? What happens when it's removed?
- What are the different states this entity can be in?

### Business Rules Questions
- Are there validation rules for this entity's attributes?
- What makes this entity valid or invalid?
- Are there constraints across multiple entities?

### Example Prompts
- "Walk me through the lifecycle of a [entity]"
- "What happens when a [entity] is related to multiple [other entities]?"
- "What attributes are required vs optional?"

## Workflow Questions

Use when documenting workflows in `context/workflows/<workflow-name>.md`.

### Initiation Questions
- What is this workflow called?
- What triggers or initiates this workflow?
- Who can initiate this workflow? (roles, permissions)

### Actor Questions
- Who are the key actors/roles involved in this workflow?
- What does each actor do in this workflow?
- Can actors perform actions on behalf of others?

### Step Questions
- What are the main steps in this workflow?
- What happens at each step?
- Are any steps optional or conditional?
- Can steps be performed in parallel or must they be sequential?

### Decision Points
- Are there decision points in this workflow?
- What determines which path is taken?
- Can the workflow be reversed or undone?

### Success/Failure Questions
- What does successful completion look like?
- What can cause this workflow to fail?
- What happens when the workflow fails? (error handling, rollback)
- Are there notifications or alerts involved?

### Edge Cases
- What are common edge cases or exceptions?
- How does the workflow handle unusual situations?
- Are there time-sensitive aspects? (timeouts, deadlines)

### Example Prompts
- "Walk me through what happens when [scenario]"
- "What if [actor] tries to [action] before [other action] is complete?"
- "How does the system prevent [problematic scenario]?"

## Business Rules Questions

Use when documenting business rules in `context/business-rules/<rule-name>.md`.

### Rule Definition Questions
- What is this rule called?
- Can you state the rule in plain language?
- Is this rule enforced by the system or just a guideline?

### Rationale Questions
- Why does this rule exist?
- What business problem does this rule solve?
- What would happen without this rule?
- Is this rule based on compliance/legal requirements or business preferences?

### Scope Questions
- When does this rule apply? (conditions, contexts)
- Who does this rule apply to? (all users, specific roles, specific entities)
- Are there time-based aspects? (business hours, date ranges)

### Enforcement Questions
- How is this rule enforced? (validation, prevention, warning)
- What happens when this rule is violated?
- Can this rule be overridden? By whom?
- Are there exceptions to this rule?

### Related Rules Questions
- Does this rule depend on other rules?
- Does this rule conflict with any other rules?
- Are there related rules that should be documented together?

### Evolution Questions
- How stable is this rule? (does it change frequently?)
- Are there plans to change or remove this rule?
- Has this rule changed in the past? Why?

### Example Prompts
- "Give me an example of when this rule would prevent something"
- "What's a scenario where this rule makes sense?"
- "Are there situations where this rule causes problems?"

## General Follow-Up Questions

Use these to dig deeper regardless of the topic being documented.

### Clarification
- "Can you elaborate on [specific point]?"
- "What do you mean by [term or phrase]?"
- "Is [paraphrased understanding] accurate?"

### Examples
- "Can you give me a concrete example?"
- "What would this look like in practice?"
- "Have you encountered this scenario before?"

### Edge Cases
- "What if [unusual scenario]?"
- "How does this handle [edge case]?"
- "Are there exceptions I should know about?"

### Context
- "How does this fit into the bigger picture?"
- "What related topics should we document?"
- "Is there anything else I should know about this?"

### Validation
- "Does this summary capture what you've explained?"
- "Is there anything missing or incorrect?"
- "Would you like to add more detail to any section?"

## Tips for Effective Questioning

### Start Broad, Then Narrow
1. Begin with open-ended questions to understand the big picture
2. Ask specific questions to fill in details
3. Validate understanding with summarization

### Listen for Cues
- If user mentions terminology, ask for definitions
- If user mentions exceptions, dig into edge cases
- If user mentions rationale, capture the "why"

### Adapt to Responses
- If user gives brief answers, ask for examples or elaboration
- If user gives lengthy answers, summarize and confirm understanding
- If user seems uncertain, offer to come back to it later

### Focus on Business Value
- Prioritize "what" and "why" over "how"
- Capture business terminology, not just technical terms
- Document business rationale and context

### Keep It Conversational
- Use natural language, not formal interview questions
- Build on previous answers
- Show that you're listening and understanding

### Know When to Move On
- Don't belabor points that are clearly understood
- Offer to document placeholders for future expansion
- Suggest logical next topics based on what's been discussed
