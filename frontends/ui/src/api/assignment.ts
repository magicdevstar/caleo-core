import { gql } from "@apollo/client";

export const REMOVE_ASSIGNMENT = gql`
  mutation RemoveAssignment($id: String!) {
    removeAssignment(id: $id)
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

      shiftSlots {
        id
        slotCount
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
