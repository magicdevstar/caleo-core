# Domain Concepts Index

This directory contains detailed documentation for core business concepts and terminology used throughout the Caleo platform.

## What Are Domain Concepts?

Domain concepts represent the fundamental building blocks of the overtime shift management system for law enforcement agencies. They define:

- **Business terminology** and definitions
- **Real-world examples** of each concept
- **Why each concept matters** to the business
- **Key attributes** that define each concept
- **Relationships** between concepts
- **Common misunderstandings** to clarify

## Purpose

These documents serve as a **business glossary** for:
- New team members learning the Caleo domain
- Product managers defining requirements
- Developers implementing features
- Support staff troubleshooting issues
- Stakeholders understanding system capabilities

## How to Use This Index

Click any concept below to view its full documentation. Concepts are organized alphabetically for easy reference.

---

## Core Concepts

### [Organization](./organization.md)
A tenant within the Caleo platform, representing a single law enforcement agency. Organizations are the fundamental unit of multi-tenancy and data isolation.

**Key Points**: Multi-tenant architecture, data partitioning, customization per agency

---

### [Overtime Shift](./overtime-shift.md)
A scheduled unit of extra work beyond an officer's regular duty schedule. Shifts are the core transactional unit of the Caleo platform.

**Key Points**: Shift groups, lifecycle states, check-in/out tracking, assignment methods

---

## Concepts To Be Documented

The following concepts are referenced throughout the system but need formal documentation:

- **Event**: Container for shifts and assignments (e.g., "Lakers Game Security")
- **Assignment**: Grouping of shifts within an event with specific requirements (e.g., "Parking Lot Patrol")
- **Officer/Member**: Users who claim and work overtime shifts
- **Tier**: Membership level affecting shift access priority (TIER_1, TIER_2, etc.)
- **Lottery**: Time-based shift assignment mechanism with random selection
- **Interest List**: Admin-managed shift assignment workflow where officers express interest
- **Venue**: Physical location where events take place
- **Rank**: Officer's position/level within their organization (e.g., Sergeant, Lieutenant)
- **Skill**: Specialized capability required for certain shifts (e.g., K-9 Handler, Bilingual)
- **Equipment**: Required gear or vehicles for shifts (e.g., Motorcycle, Patrol Car)
- **Feature Flag**: Boolean toggle controlling functionality per organization

---

## Cross-References

- **Technical Implementation**: See `AGENTS.md` files in each directory for code-level details
- **Workflows**: See `context/workflows/` for process documentation
- **Business Rules**: See `context/business-rules/` for rule definitions

---

## Contributing

When documenting a new concept:

1. Create a new file: `context/domains/<concept-name>.md`
2. Follow the template structure from existing concept files
3. Update this INDEX.md with a link and brief description
4. Cross-reference related concepts where applicable
5. Use business language (avoid technical jargon when possible)

---

*Last Updated: February 10, 2026*
