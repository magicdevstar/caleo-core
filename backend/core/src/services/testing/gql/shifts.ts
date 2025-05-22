import gql from "graphql-tag";

export const SHIFT_INTEREST_REQUEST = gql`
  mutation ShiftInterestRequest($shiftInterestRequest: UpsertShiftInterestRequest) {
    shiftInterestRequest(shiftInterestRequest: $shiftInterestRequest) {
      id
    }
  }
`;

export const ASSIGN_SHIFT = gql`
  mutation AssignShift($id: String!, $userId: String, $note: String) {
    shiftAssign(id: $id, userId: $userId, note: $note) {
      id
      user {
        id
      }
    }
  }
`;

export const GET_AVAILABLE_SHIFTS = gql`
  query GetAvailableShifts($input: AvailableShiftsSearchInput!) {
    availableShifts(input: $input) {
      items {
        id
        shiftId
        startTime
        endTime
        refNumber
        event {
          id
          referenceId
          assignmentIds
          name
          attachments
          notes
          status
          scheduledInterestList
          scheduledCloseInterestList
          scheduledFirstComeFirstServe
        }
        assignment {
          id
          name
          bwNeeded
          shiftIds
          description
          reportingLocation
          requiredSkills {
            id
            name
          }
          ranks {
            id
            name
          }
        }
        otherShiftSlots {
          id
          refNumber
          user {
            id
            firstName
            lastName
            member {
              pNumber
            }
          }
        }

        shiftInterestRequest {
          id
        }

        shiftBufferShift {
          id
          shiftId
          startTime
          endTime
          assignment {
            id
            name
          }
          event {
            id
            name
          }
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

export const CREATE_SHIFTS = gql`
  mutation CreateShifts($input: [UpsertShift]!, $removeSlots: Boolean) {
    shifts(shifts: $input, removeSlots: $removeSlots) {
      id
      event {
        id
        assignmentIds
      }
      locked
      status
      assignment {
        id
        shiftIds
      }
      startTime
      endTime
      shiftId
    }
  }
`;