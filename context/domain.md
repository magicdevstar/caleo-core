# Domain Concepts

## Overview

This document provides an overview of the core business concepts and terminology used throughout the Caleo platform. For detailed documentation of each concept, see the individual files in the `domains/` directory.

## Quick Reference

- **[Domain Concepts Index](./domains/INDEX.md)** - Table of contents for all domain concepts

## Documented Concepts

### [Organization](./domains/organization.md)
A tenant within the Caleo platform, representing a single law enforcement agency. Organizations are the fundamental unit of multi-tenancy and data isolation.

### [Overtime Shift](./domains/overtime-shift.md)
A scheduled unit of extra work beyond an officer's regular duty schedule. Shifts are the core transactional unit of the Caleo platform.

## Concepts To Be Documented

The following concepts are referenced throughout the system but need formal documentation:

- **Event**: Container for shifts and assignments
- **Assignment**: Grouping of shifts within an event with specific requirements
- **Officer/Member**: Users who claim and work overtime shifts
- **Tier**: Membership level affecting shift access priority
- **Lottery**: Time-based shift assignment mechanism
- **Interest List**: Admin-managed shift assignment workflow
- **Venue**: Physical location where events take place
- **Rank**: Officer's position/level within their organization
- **Skill**: Specialized capability required for certain shifts
- **Equipment**: Required gear or vehicles for shifts
- **Feature Flag**: Boolean toggle controlling functionality per organization

---

**For detailed concept documentation, navigate to**: [domains/INDEX.md](./domains/INDEX.md)
