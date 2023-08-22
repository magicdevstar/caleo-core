import { gql } from "@apollo/client";

export const REMOVE_SHIFT = gql`
  mutation RemoveShift($id: String!) {
    removeShift(id: $id)
  }
`;

export const GET_ALL_SHIFTS = gql`
  query GetAllShifts($input: SearchInput!) {
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
