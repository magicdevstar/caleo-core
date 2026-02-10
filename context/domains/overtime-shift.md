# Overtime Shift

## Definition

An **overtime shift** (or simply "shift") is a scheduled unit of extra work beyond an officer's regular duty schedule. Shifts represent paid overtime opportunities that officers can claim and work through the Caleo platform. Caleo manages the scheduling and assignment of overtime shifts but does not handle payroll processing—payment is managed externally by each organization.

## Real-World Examples

- **Special Event Coverage**: 3 officers needed for crowd control at a concert venue, 6:00 PM - 2:00 AM
- **Emergency Response**: Additional patrol officers required during storm response, 8:00 AM - 4:00 PM
- **Community Service**: School crossing guard coverage during regular officer absences, 7:00 AM - 9:00 AM

## Why This Concept Matters

Overtime shifts are the **core transactional unit** of the entire Caleo platform:

1. **Primary Value Delivery**: Officers use Caleo to find, claim, and work overtime opportunities
2. **Revenue Source**: Organizations pay for overtime shift coverage; officers earn supplemental income
3. **Scheduling Complexity**: Managing thousands of shifts across multiple events, assignments, and officers requires sophisticated automation

## Key Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| **shiftId (Group ID)** | UUID shared by all shifts in the same slot group | `"550e8400-e29b-41d4-a716-446655440000"` |
| **Start Time** | When the shift begins (Date/time) | `2026-02-15T18:00:00Z` |
| **End Time** | When the shift ends (Date/time) | `2026-02-16T02:00:00Z` |
| **Status** | Current state of the shift | `AVAILABLE`, `ASSIGNED`, `LOCKED` |
| **Assignment ID** | Which assignment this shift belongs to | ObjectId reference |
| **Event ID** | Which event this shift belongs to | ObjectId reference |
| **User ID** | Officer assigned to this shift (if any) | ObjectId reference or null |
| **Availability** | Which days of the week this shift spans | `{ saturday: {...}, sunday: {...} }` |
| **Locked** | Whether admins have locked this shift | `true` / `false` |
| **Check-In/Out** | Officer attendance tracking details | Timestamps, coords, notes |

## Hierarchical Relationships

Shifts exist within a three-level hierarchy:

```
Event (e.g., "Lakers Game Security")
  └── Assignment (e.g., "Parking Lot Patrol")
      └── Shift Group (shiftId: "uuid-123")
          ├── Shift Slot 1 (available)
          ├── Shift Slot 2 (assigned to Officer A)
          └── Shift Slot 3 (assigned to Officer B)
```

**One Event** contains **many Assignments**  
**One Assignment** contains **many Shift Groups**  
**One Shift Group** contains **many Shift Slots** (individual shifts with same shiftId)

## Shift Group Concept

Multiple shifts can share the same `shiftId`, representing **multiple slots for the same shift**. This allows events to require multiple officers for the same assignment and time period.

**Example**: "Need 5 officers for parking lot patrol, 6 PM - 2 AM"
- All 5 shifts have the same start time, end time, assignment, and shiftId
- Each shift is a separate slot that can be assigned to a different officer
- Officers see this as "5 slots available" for the same shift

**Business Rationale**: Events often need multiple officers for the same role (e.g., crowd control requires 10 officers, not 1).

## Lifecycle States

Shifts progress through various states from creation to completion:

| Status | Description | Transition |
|--------|-------------|------------|
| **AVAILABLE** | Shift exists but no officer assigned; not started | Created by admin |
| **LOCKED** | Admin has locked the shift; cannot be claimed | Admin action |
| **ASSIGNED** | Officer has been assigned to the shift | Officer claims or admin assigns |
| **RELINQUISHED** | Officer voluntarily gave up the shift | Officer relinquishes |
| **UNASSIGNED** | Admin removed officer from shift | Admin unassigns |
| **REMOVED** | Shift was deleted from assignment | Admin removes |

**Additional Lifecycle Events** (not status changes):
- **Check-In**: Officer arrives and checks in (timestamp recorded)
- **Check-Out**: Officer completes shift and checks out (timestamp recorded)
- **Completion**: Shift end time has passed

## Status Definitions (GraphQL Schema)

From `schema.graphql:616-629`:

```graphql
enum ShiftStatus {
  # Not removed, not assigned to a user, and not started
  AVAILABLE
  # Assigned shifts that are not started
  ASSIGNED
  # Shifts that were unassigned via assigned user
  RELINQUISHED
  # Shifts that were unassigned via admin
  UNASSIGNED
  # Shifts that were removed from an assignment
  REMOVED
  # Shifts that are marked as locked
  LOCKED
}
```

## Check-In/Check-Out

Shifts can track officer attendance through check-in and check-out functionality:

**Check-In Details**:
- Check-in time (when officer arrives)
- GPS coordinates (location verification)
- Check-in notes (officer comments)
- Equipment check-in time (if equipment feature enabled)

**Check-Out Details**:
- Check-out time (when officer completes shift)
- GPS coordinates (location verification)
- Check-out notes (officer comments)
- Equipment check-out time
- Vehicle category (if equipment tracking enabled)
- Admin notes (supervisor comments)
- No-show flag (if officer didn't show up)

**Geo-Fencing** (optional): Shifts/events can have geo-fence boundaries that restrict where officers can check in/out.

## Availability Tracking

Shifts store which days of the week they span, allowing the system to check if an officer's availability matches the shift requirements.

**Example**: A shift from Saturday 10 PM to Sunday 6 AM would have:
```javascript
{
  availability: {
    saturday: { startTime: "22:00", endTime: "23:59" },
    sunday: { startTime: "00:00", endTime: "06:00" },
    // all other days: null
  }
}
```

## Assignment Methods

Officers can be assigned to shifts through multiple mechanisms:

1. **First Come First Serve (FCFS)**: Officers claim available shifts immediately on a first-come basis
2. **Lottery**: Officers request shifts during a lottery window; system randomly assigns based on priority/tier
3. **Interest List**: Officers express interest; admins manually assign shifts
4. **Admin Assignment**: Admins directly assign officers to locked shifts

## Business Rules Applied

### Conflict Detection
- Officers cannot be assigned to overlapping shifts (checked via start/end time comparison)
- System checks for scheduling conflicts before allowing assignment
- Optional "shift buffer" adds padding time between shifts to prevent back-to-back scheduling

### Relinquishment Rules
- Officers can relinquish (give up) assigned shifts before a deadline (e.g., 24 hours before start)
- Relinquishing may result in tier penalties (e.g., moved to lower tier for 21 days)
- Optional: Require note when relinquishing

### Eligibility Checks
- Officer's availability must match shift availability (day/time)
- Officer's rank, skills, and equipment may need to meet assignment requirements
- Monthly max hours and weekly max shifts limits enforced (if features enabled)

## Related Concepts

- **Event**: Parent container for shifts (see Event concept - TODO)
- **Assignment**: Intermediate grouping of shifts within an event (see Assignment concept - TODO)
- **[Organization](./organization.md)**: All shifts belong to one organization for data partitioning
- **Officer/Member**: Users who claim and work shifts (see Officer concept - TODO)
- **Lottery**: Assignment mechanism for distributing shifts fairly (see Lottery concept - TODO)
- **Interest List**: Assignment mechanism for admin-managed shift distribution (see Interest List concept - TODO)

## Common Misunderstandings

**Misconception**: A shift is assigned to an officer for the duration of the event  
**Reality**: Shifts have specific start/end times independent of the overall event duration; an event may have shifts at different times

**Misconception**: Officers can claim any available shift  
**Reality**: Officers must meet eligibility requirements (availability, rank, skills, tier, no conflicts, max hours)

**Misconception**: The shiftId uniquely identifies one shift  
**Reality**: shiftId is a **group identifier**; multiple shifts share the same shiftId to represent multiple slots for the same time/assignment

**Misconception**: REMOVED status means the shift was deleted  
**Reality**: REMOVED is a soft delete; the shift still exists in the database with a `removedAt` timestamp for audit purposes

## Technical Implementation

- **Location**: `backend/core/src/models/shift.ts` (ShiftModel, IShift interface)
- **GraphQL Type**: `backend/core/schema.graphql:777-825` (Shift type)
- **Database Collection**: `shifts` (MongoDB)
- **Data Partitioning**: Every shift includes `orgId` for multi-tenant isolation

**Key Technical Details**:
- Shift slots with same `shiftId` are grouped together visually in the UI
- DataLoader pattern used to batch-load shifts by assignment, event, or user
- Check-in/check-out coordinates stored as GPS lat/lng for geo-verification
- Availability stored as day-of-week map for efficient conflict detection

---

*See [Domain Concepts Index](./INDEX.md) for related concepts*
