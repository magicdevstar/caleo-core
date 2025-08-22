import { gql } from "@apollo/client";
import { Shift } from "src/__generated__/resolvers-types";

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

export const CHECK_IN = gql`
  mutation CheckIn($input: ShiftCheckInOutEvent!) {
    checkIn(input: $input) {
      id
      shiftCheckInOut {
        checkInTime
        checkOutTime
      }
    }
  }
`;

export const EDIT_CHECK_IN_OUT = gql`
  mutation EditCheckInOut($input: ShiftAdminCheckInOutEvent!) {
    editCheckInOut(input: $input) {
      id
      shiftCheckInOut {
        checkInTime
        checkOutTime
      }
    }
  }
`;

export const CHECK_OUT = gql`
  mutation CheckOut($input: ShiftCheckInOutEvent!) {
    checkOut(input: $input) {
      shift {
        id
        shiftCheckInOut {
          checkInTime
          checkOutTime
        }
      }
      signingUrl
    }
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

export const REMOVE_SHIFT_INTEREST_REQUEST = gql`
  mutation ShiftInterestRequest($id: String) {
    removeShiftInterestRequest(id: $id)
  }
`;

export const SHIFT_INTEREST_REQUEST = gql`
  mutation ShiftInterestRequest($shiftInterestRequest: UpsertShiftInterestRequest) {
    shiftInterestRequest(shiftInterestRequest: $shiftInterestRequest) {
      id
    }
  }
`;

export const REVOKE_SHIFT_INTEREST_REQUEST = SHIFT_INTEREST_REQUEST;
export const UPSERT_SHIFT_INTEREST_REQUEST = SHIFT_INTEREST_REQUEST;

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

export const GET_SHIFT_TABS = gql`
  query GetShiftTabs($id: String!) {
    shiftTabs(id: $id) {
      orgId
      templateName
      data
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
        customId
        refNumber
        userId
        locked
        callSign
        event {
          id
          referenceId
          name
          attachments
          status
          scheduledInterestList
          scheduledCloseInterestList
          scheduledFirstComeFirstServe
          lotteryNumber
          thumbnailUrl
          startTime
          endTime
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
          reportingLocation
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
        }
        otherShiftSlots {
          id
          customId
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
        lotteryRequest {
          id
          shiftGroupId
        }
        event {
          id
          referenceId
          name
          attachments
          thumbnailUrl
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
            thumbnailUrl
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
        customId
        refNumber
        userId
        locked
        callSign
        shiftCheckInOut {
          checkInTime
          checkOutTime
        }
        docusignEvent {
          id
          status
          documentUrl
        }
        org {
          settings {
            userRelinquishShift {
              enabled
              numberOfHoursBeforeShift
            }
          }
        }
        event {
          id
          referenceId
          name
          attachments
          thumbnailUrl
          startTime
          endTime
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
          callSign
          bwNeeded
          reportingLocation
          requiredEquipment {
            id
            name
            requiresEquipmentTime
            requiresVehicleInformation
          }
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
          customId
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
      }
      total
    }
  }
`;

export const SHIFTS_FOR_EVENT_DASHBOARD = gql`
  query GetAllShifts($input: ShiftSearchInput!) {
    shifts(input: $input) {
      items {
        id
        startTime
        endTime
        status
        customId
        refNumber
        userId
        locked
        callSign
        shiftCheckInOut {
          checkInTime
          checkOutTime
          checkInNote
          checkOutNote
          adminNotes
          noShow
          equipmentDetails {
            checkInTime
            checkOutTime
            vehicleCategory {
              id
              name
            }
          }
          checkInCoords {
            accuracy
            altitude
            altitudeAccuracy
            heading
            latitude
            longitude
            speed
          }
          checkOutCoords {
            accuracy
            altitude
            altitudeAccuracy
            heading
            latitude
            longitude
            speed
          }
        }
        event {
          id
          name
        }
        user {
          name
          member {
            divisionId
            pNumber
            rank {
              id
              name
            }
            contactInfo {
              primaryPhone {
                number
              }
            }
          }
        }
        docusignEvent {
          id
          status
          documentUrl
          signerDetails {
            roleName
            status
          }
        }
        assignment {
          id
          name
          requiredEquipment {
            id
            name
            requiresEquipmentTime
            requiresVehicleInformation
          }
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
        customId
        refNumber
        shiftCheckInOut {
          checkInTime
          adminNotes
        }
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
          ocn
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
          requiredEquipment {
            id
            name
          }
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
        customId
        refNumber
        startTime
        endTime
        status
        callSign
        shiftCheckInOut {
          checkInTime
          checkOutTime
          equipmentDetails {
            checkInTime
            checkOutTime
          }
          checkInCoords {
            accuracy
            altitude
            altitudeAccuracy
            heading
            latitude
            longitude
            speed
          }
          checkOutCoords {
            accuracy
            altitude
            altitudeAccuracy
            heading
            latitude
            longitude
            speed
          }
        }
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

export const SHIFT_INTEREST_REQUESTS = gql`
  query GetShiftInterestRequests($input: ShiftInterestRequestsSearchInput!, $shiftStart: String, $timezoneOffset: Int, $ignoreShiftId: String) {
    shiftInterestRequests(input: $input) {
      items {
        id
        shiftGroupId
        eventId
        assignmentId
        status
        createdAt

        assignedShift {
          id
          status
        }

        user(shiftStart: $shiftStart, timezoneOffset: $timezoneOffset, ignoreShiftId: $ignoreShiftId) {
          id
          name
          numberOfHoursThisMonth
          member {
            tenor
            tier
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
      customId
      refNumber
      customId
      shiftId
      startTime
      endTime
      status
      locked
      userId
      callSign

      shiftCheckInOut {
        checkInTime
        checkOutTime
        checkInNote
        checkOutNote
        equipmentDetails {
          checkInTime
          checkOutTime
          vehicleCategory {
            id
            name
          }
        }
        adminNotes
        checkInCoords {
          accuracy
          altitude
          altitudeAccuracy
          heading
          latitude
          longitude
          speed
        }
        checkOutCoords {
          accuracy
          altitude
          altitudeAccuracy
          heading
          latitude
          longitude
          speed
        }
      }

      assignment {
        id
        name
        removedAt
        isSigningAuthority
        requiredEquipment {
          id
          requiresEquipmentTime
          requiresVehicleInformation
        }
      }

      event {
        id
        name
        status
        removedAt
        endTime

        requestDetails {
          startTime
          endTime
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
    }
  }
`;

export const GET_SHIFT_DETAILS = gql`
query GetShiftDetails($id: String!) {
  shift(id: $id) {
    id
    startTime
    endTime
    customId
    refNumber
    userId
    locked
    callSign
    event {
      id
      referenceId
      name
      attachments
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
      customId
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
  }
}
`;

export const GET_SHIFT_DETAILS_SLIM = gql`
  query GetAllShifts($input: ShiftSearchInput!) {
    shifts(input: $input) {
      items {
        id
        startTime
        endTime
        status
      }
      total
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
        org {
          settings {
            userRelinquishShift {
              enabled
              numberOfHoursBeforeShift
            }
          }
        }
        shift {
          id
          startTime
          endTime
          event {
            id
            referenceId
            name
            attachments
            startTime
            endTime
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
            customId
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
            maxShifts
          }
        }
      }
      total
    }
  }
`;

export const GET_ALL_FINANCE_SHIFTS = gql`
  query GetAllFinanceShifts($eventId: ObjectId!) {
    financeShifts(eventId: $eventId) {
      startTime
      endTime
      totalOvertimeHours
      totalStraightHours
      totalVehicleMilage
      user {
        id
        name
        member {
          hourlyRate
          incidentHourlyRate
        }
      }
      docusignEvent {
        id
        status
        documentUrls
      }
      rank {
        id
        name
        hourlyRate
        incidentHourlyRate
      }
      division {
        id
        name
      }
      unit {
        id
        name
      }
      vehicleCategory {
        id
        name
        milageRate
      }
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
  mutation UpsertShifts($input: [UpsertShift]!, $removeSlots: Boolean) {
    shifts(shifts: $input, removeSlots: $removeSlots) {
      id
      assignmentId
      eventId
    }
  }
`;

export const UPDATE_SHIFTS = gql`
  mutation UpdateShifts($shiftId: String!, $updates: ShiftUpdates!) {
    partialShiftUpdate(shiftId: $shiftId, updates: $updates)
  }
`;

export const UPDATE_SHIFTS_CALL_SIGN = gql`
  mutation UpdateShifts($shiftId: String!, $callSign: String!) {
    shiftsCallSign(shiftGroupId: $shiftId, callSign: $callSign)
  }
`;

export interface ShiftData {
  shifts: {
    items: Shift[];
    total: number;
  };
};
