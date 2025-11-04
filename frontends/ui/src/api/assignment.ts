import { gql } from "@apollo/client";

export const REMOVE_ASSIGNMENT = gql`
  mutation RemoveAssignment($id: String!) {
    removeAssignment(id: $id)
  }
`;

export const DEMOBILIZE_ASSIGNMENT = gql`
  mutation DemobilizeAssignment($assignmentId: ObjectId!) {
    demobilized(assignmentId: $assignmentId)
  }
`;

export const GET_ASSIGNMENT_DESCRIPTION = gql`
  query GetAssignment($id: String!) {
    assignment(id: $id) {
      id
      description
    }
  }
`;

export const GET_ALL_ASSIGNMENT = gql`
  query GetAllAssignments($input: SearchInput!) {
    assignments(input: $input) {
      items {
        id
        name
        callSign
        description
        eventId
        bwNeeded
        createdAt
        isSigningAuthority

        requiredEquipment {
          id
          name
        }

        requiredSkills {
          id
          name
        }

        ranks {
          id
          name
        }

        shifts {
          id
          shiftId
          status
          userId
        }
      }
      total
    }
  }
`;

export const GET_ASSIGNMENT_SIGNING_AUTHORITY = gql`
  query GetAssignment($id: String!) {
    assignment(id: $id) {
      id
      isSigningAuthority
    }
  }
`;

export const GET_SIGNING_AUTHORITY_ASSIGNMENTS = gql`
query GetSigningAuthorityAssignments($eventId: ObjectId!) {
  signingAuthorityAssignments(eventId: $eventId) {
    items {
      id
      name
    }
  }
}
`;

export const GET_ASSIGNMENT = gql`
  query GetAssignment($id: String!) {
    assignment(id: $id) {
      id
      name
      callSign
      description
      notifyWhenFullyStaffed
      reportingLocation
      eventId
      bwNeeded
      createdAt
      removedAt
      isSigningAuthority

      geoFence
      allowOfficerCheckIn

      radioFrequency
      uniform
      briefingTime
      briefingLocation
      includeDriveTime
      reportingTime

      assignmentDivision {
        id
        name
      }

      assignmentGroup {
        id
        name
      }

      branch {
        id
        name
      }

      reportingLocationDetails {
        fullAddress
        location {
          latitude
          longitude
        }
      }

      shiftSlots {
        id
        slotCount
        slotDetails {
          index
          callSign
          customId
          locked
        }
      }

      useSupervisorAssignmentOverride
      supervisorAssignment {
        id
        name
      }

      useLieutenantAssignmentOverride
      lieutenantAssignment {
        id
        name
      }

      useFieldSupervisorAssignmentOverride
      fieldSupervisorAssignment {
        id
        name
      }

      requiredEquipment {
        id
        name
        active
      }

      requiredSkills {
        id
        name
        active
      }

      event {
        id
        status
        endTime
        removedAt
        name

        overrideSupervisor {
          id
          name
          member {
            rank {
              id
              name
            }
          }
        }
      }

      ranks {
        id
        name
        active
      }

      shifts {
        id
        shiftId
        status
        userId
        startTime
        endTime
      }
    }
  }
`;

export const UPSERT_ASSIGNMENT = gql`
  mutation UpsertAssignment($input: UpsertAssignment!) {
    assignment(assignment: $input) {
      id
      eventId
    }
  }
`;
