import { gql } from "@apollo/client";

export const REMOVE_SHIFT = gql`
  mutation RemoveShift($id: String!) {
    removeShift(id: $id)
  }
`;

export const REMOVE_SHIFTS = gql`
  mutation RemoveShifts($id: String!) {
    removeShifts(shiftId: $id)
  }
`;

export const ASSIGN_SHIFT = gql`
  mutation AssignShift($id: String!, $userId: String, $note: String) {
    shiftAssign(id: $id, userId: $userId, note: $note) {
      id
    }
  }
`;

export const GET_AVAILABLE_SHIFTS = gql`
  query GetAvailableShifts($input: SearchInput!) {
    availableShifts(input: $input) {
      items {
        id
        shiftId
        startTime
        endTime
        status
        locked
        
        assignment {
          id
          name
        }

        event {
          id
          name
        }
        
        user {
          id
          name
        }
      }
      total
    }
  }
`;

export const GET_ALL_SHIFTS = gql`
  query GetAllShifts($input: ShiftSearchInput!) {
    shifts(input: $input) {
      items {
        id
        shiftId
        startTime
        endTime
        status
        locked
        
        assignment {
          id
          name
        }

        event {
          id
          name
        }
        
        user {
          id
          name
        }
      }
      total
    }
  }
`;

export const GET_GROUPED_SHIFTS = gql`
  query GetGroupedShift($shiftId: String!) {
    groupedShifts(shiftId: $shiftId) {
      id
      shiftId
      startTime
      endTime
      status
      locked
      
      assignment {
        id
        name
      }

      event {
        id
        name
      }
      
      user {
        id
        name
        member {
          pNumber
          contactInfo {
            primaryPhone {
              number
            }
          }
        }
      }
    }
  }
`;

export const UPSERT_SHIFTS = gql`
  mutation UpsertShifts($input: [UpsertShift]!) {
    shifts(shifts: $input) {
      id
      assignmentId
      eventId
    }
  }
`;
