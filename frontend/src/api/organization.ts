import { gql } from "@apollo/client";

export const ORGANIZATION = gql`
query ORGANIZATION {
  organization {
    id
    name
    address
    city
    zip
    contact {
      email
      phone
    }
    state
    timezone
    weekBegins
    features {
      lottery
      venueContractDates
      eventCheckIn
      interestLists
    }
    settings {
      shiftsPerWeek
      interestList {
        defaultHoursBeforeShift
        defaultNotificationTime
      }
      checkInOut {
        minutesBeforeShiftStart
        minutesAfterShiftEnd
      }
      lottery {
        open {
          time
          dayOfWeek
        }
        notifyUsersBeforeClose
        fcfsShiftsDelay
        enabled
        close {
          dayOfWeek
          time
        }
      }
      shiftBuffer {
        minuteShiftBuffer
        enabled
        adminOverrideShiftBuffer
      }
      userRelinquishShift {
        afterShiftRemove {
          days
          tier
        }
        enabled
        numberOfHoursBeforeShift
        requireNoteWhenRelinquishing
      }
      shiftReminder {
        enabled
        time
        unit
      }
    }
  }
}
`;

export const UPDATE_ORGANIZATION = gql`
  mutation UPDATE_ORGANIZATION($organization: UpsertOrganization!) {
    organization(organization: $organization) {
      id
    }
  }
`;
