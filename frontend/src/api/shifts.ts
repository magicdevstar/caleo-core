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

export const REMOVE_LOTTERY_SHIFT_REQUEST = gql`
  mutation RemoveLotteryShiftRequest($id: String!) {
    removeShiftLotteryRequest(id: $id)
  }
`;

export const ASSIGN_SHIFT = gql`
  mutation AssignShift($id: String!, $userId: String, $note: String) {
    shiftAssign(id: $id, userId: $userId, note: $note) {
      id
    }
  }
`;

export const REMOVE_SHIFT_BUFFER_REQUEST = gql`
  mutation RemoveShiftBufferRequests($id: String!) {
    removeShiftBufferRequest(id: $id)
  }
`;

export const CREATE_SHIFT_BUFFER = gql`
  mutation CreateShiftBuffer($input: CreateShiftBufferRequest) {
    shiftBufferRequest(shiftBufferRequest: $input) {
      id
    }
  }
`;

export const CREATE_SHIFT_LOTTERY_REQUEST = gql`
  mutation UpsertShiftLotteryRequest($input: UpsertShiftLotteryRequest) {
    shiftLotteryRequest(shiftLotteryRequest: $input) {
      id
    }
  }
`;

export const GET_AVAILABLE_SHIFTS = gql`
  query GetAvailableShifts($input: AvailableShiftsSearchInput!) {
    availableShifts(input: $input) {
      items {
        id
        startTime
        endTime
        refNumber
        event {
          id
          referenceId
          name
          attachments
          notes
          status
          scheduledFirstComeFirstServe
          lotteryNumber
          lotteryCounter {
            start
          }
          venue {
            id
            name
            address
            city
            state
            zip
            phone
            contact {
              firstName
              lastName
              email
              phone
            }
          }
        }
        assignment {
          id
          name
          bwNeeded
          description
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
          order
          user {
            id
            firstName
            lastName
            member {
              pNumber
            }
          }
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

export const GET_LOTTERY_SHIFTS = gql`
  query GetLotteryShifts {
    lotteryShifts {
      items {
        id
        shiftId
        startTime
        endTime
        assignment {
          id
          name
          bwNeeded
          description
          requiredSkills {
            id
            name
          }
          ranks {
            id
            name
          }
        }
        lotteryRequest {
          id
          shiftGroupId
        }
        event {
          id
          referenceId
          name
          attachments
          notes
          venue {
            id
            name
            address
            city
            state
            zip
            phone
            contact {
              firstName
              lastName
              email
              phone
            }
          }
        }
      }
    }
  }
`;

export const GET_LOTTERY_SHIFT_REQUESTS = gql`
  query GetShiftLotteryRequests($input: ShiftLotteryRequestsSearchInput) {
    shiftLotteryRequests(input: $input) {
      items {
        id
        shiftGroupId
        order
        userId
        shift {
          id
          shiftId
          startTime
          endTime
          assignment {
            id
            name
            bwNeeded
            description
            requiredSkills {
              id
              name
            }
            ranks {
              id
              name
            }
          }
          lotteryRequest {
            id
            shiftGroupId
          }
          event {
            id
            referenceId
            name
            attachments
            notes
            venue {
              id
              name
              address
              city
              state
              zip
              phone
              contact {
                firstName
                lastName
                email
                phone
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_ALL_SHIFTS = gql`
  query GetAllShifts($input: ShiftSearchInput!) {
    shifts(input: $input) {
      items {
        id
        startTime
        endTime
        status
        refNumber
        event {
          id
          referenceId
          name
          attachments
          notes
          venue {
            id
            name
            address
            city
            state
            zip
            phone
            contact {
              firstName
              lastName
              email
              phone
            }
          }
        }
        assignment {
          id
          name
          bwNeeded
          description
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
          order
          user {
            id
            firstName
            lastName
            member {
              pNumber
            }
          }
        }
      }
      total
    }
  }
`;

export const GET_SHIFT_LOTTERY_REQUESTS_REPORT = gql`
  query GetShiftLotteryRequestsReport($input: ShiftLotteryRequestsSearchInput!) {
    shiftLotteryRequests(input: $input) {
      items {
        id
        shiftGroupId
        order
        status
        user {
          firstName
          lastName
          member {
            pNumber
          }
        }
        shift {
          id
          shiftId
          startTime
          endTime
        }
        event {
          id
          referenceId
          name
          lotteryCounter {
            id
            start
            end
          }
        }
        assignment {
          id
          name
        }
      }
    }
  }
`;

export const GET_OFFICER_REPORT_SHIFTS = gql`
  query GetOfficerReportShifts($input: ShiftSearchInput!) {
    shifts(input: $input) {
      items {
        id
        startTime
        endTime
        status
        removedAt
        relinquishNote
        refNumber
        user {
          id
          firstName
          lastName
          member {
            pNumber
            contactInfo {
              primaryPhone {
                number
              }
            }
          }
        }
        event {
          id
          referenceId
          name
          startTime
          endTime
          createdBy {
            id
            name
            member {
              pNumber
            }
          }
          venue {
            id
            name
          }
        }
        assignment {
          id
          name
        }
      }
      total
    }
  }
`;

export const DYNAMIC_SHIFT_SEARCH = gql`
  query GetAllShifts($input: ShiftSearchInput!) {
    shifts(input: $input) {
      items {
        id
        shiftId
        refNumber
        startTime
        endTime
        status
        createdBy {
          id
          member {
            pNumber
          }
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
        event {
          id
          referenceId
          name
          removedAt
        }
        assignment {
          id
          name
          removedAt
          requiredSkills {
            id
            name
          }
          ranks {
            id
            name
          }
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
      refNumber
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
        status
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

export const GET_SHIFT_DETAILS = gql`
query GetShiftDetails($id: String!) {
  shift(id: $id) {
    id
    startTime
    endTime
    refNumber
    event {
      id
      referenceId
      name
      attachments
      notes
      venue {
        id
        name
        address
        city
        state
        zip
        phone
        contact {
          firstName
          lastName
          email
          phone
        }
      }
    }
    assignment {
      id
      name
      bwNeeded
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
      order
      user {
        id
        firstName
        lastName
        member {
          pNumber
        }
      }
    }
  }
}
`;

export const NOTIFY_OF_SHIFT = gql`
  mutation NotifyOfShift($shiftId: String!) {
    notifyUsersOfShift(shiftId: $shiftId)
  }
`;

export const GET_SHIFT_BUFFER_REQUESTS = gql`
  query GetShiftBufferRequests($input: ShiftBufferRequestsSearchInput!) {
    shiftBufferRequests(input: $input) {
      items {
        id
        status
        note
        createdAt
        startTime
        endTime
        shift {
          id
          startTime
          endTime
          event {
            id
            referenceId
            name
            attachments
            notes
            venue {
              id
              name
              address
              city
              state
              zip
              phone
              contact {
                firstName
                lastName
                email
                phone
              }
            }
          }
          assignment {
            id
            name
            bwNeeded
            description
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
            order
            user {
              id
              firstName
              lastName
              member {
                pNumber
              }
            }
          }
        }
        shiftBufferShift {
          id
          startTime
          endTime
          assignment {
            id
            name
          }
          event {
            id
            name
            referenceId
          }
        }
        assignment {
          id
          name
        }
        event {
          id
          name
          referenceId
        }
        user {
          id
          name
          member {
            pNumber
          }
        }
      }
      total
    }
  }
`;

export const SET_SHIFT_BUFFER_STATUS = gql`
  mutation SetShiftBufferStatus($id: String!, $status: ShiftBufferRequestStatus!, $reason: String) {
    setShiftBufferStatus(id: $id, status: $status, reason: $reason) {
      id
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
