import { gql } from "@apollo/client";

export const ACTIVE_LOTTERY = gql`
  query ACTIVE_LOTTERY {
    activeLottery
  }
`;

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
    docusign {
      templateId
    }
    features {
      lottery
      venueContractDates
      eventCheckIn
      eventCheckOut
      officerCheckInOut
      interestLists
      monthlyMaxHours
      weeklyMaxShifts
      disabledTiers
      disabledTierUntil
      externalEventRequests
      sso
      equipment
      lasdEventFields
      lasdUserFields
      docusign
      kiosk
      eventTemplates
      noShowReport
      rankHourlyRate
      callSign
      eventInvoice
      rankGrouping
    }
    customizations {
      pNumber
      tiers {
        TIER_1 {
          label
          enabled
        }
        TIER_2 {
          label
          enabled
        }
        TIER_3 {
          label
          enabled
        }
        TIER_4 {
          label
          enabled
        }
      }
      dateFormats {
        dateTime
        date
        miniDate
        time
      }
    }
    settings {
      shiftsPerWeek
      hoursPerMonth
      eventSettings {
        allowThumbnail
        defaultThumbnail
      }
      interestList {
        defaultHoursBeforeShift
        defaultAutoHireCutoff
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
      secondaryShiftReminder {
        enabled
        time
        unit
      }
    }
  }
}
`;

export const CREATE_DEFAULT_EVENT_THUMBNAIL_UPLOAD_URL = gql`
  mutation CreateDefaultEventThumbnailUploadUrl {
    defaultEventThumbnailUploadUrl {
      imagePath
      uploadUrl
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
