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
        description
        eventId
        bwNeeded
        createdAt

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
      description
      eventId
      bwNeeded
      createdAt

      requiredSkills {
        id
        name
        active
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
