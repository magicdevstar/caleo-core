import { gql } from '@apollo/client';

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
        monthlyMaxHours
        sso
        equipment
        profileTenor
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
      }
      sso {
        uiSubDomains
        enablePasswordLogin
        metadataDocUrl
      }
      settings {
        shiftsPerWeek
        hoursPerMonth
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

export const ORGANIZATION_FEATURES = gql`
  query ORGANIZATION_FEATURES {
    organizationFeatures {
      label
      value
    }
  }
`;

export const ORGANIZATION_BY_ID = gql`
  query ORGANIZATION_BY_ID($orgId: String!) {
    organizationById(orgId: $orgId) {
      id
      name
      address
      city
      zip
      state
      timezone
      weekBegins
      flatFeatures
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
      }
      sso {
        uiSubDomains
        enablePasswordLogin
        metadataDocUrl
      }
    }
  }
`;

export const ORGANIZATIONS = gql`
  query ORGANIZATIONS($input: OrganizationSearchInput!) {
    organizations(input: $input) {
      total
      items {
        id
        name
        city
        state
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_ORGANIZATION = gql`
  mutation UPDATE_ORGANIZATION($organization: UpsertOrganization!) {
    organization(organization: $organization) {
      id
      name
      address
      city
      zip
      state
      timezone
      weekBegins
      features {
        lottery
        venueContractDates
        eventCheckIn
        interestLists
        monthlyMaxHours
        sso
        equipment
        profileTenor
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
      }
      sso {
        uiSubDomains
        enablePasswordLogin
        metadataDocUrl
      }
    }
  }
`;

export const CREATE_ORGANIZATION = gql`
  mutation CREATE_ORGANIZATION($organization: CreateOrganization!) {
    createOrganization(organization: $organization) {
      id
      name
      address
      city
      zip
      state
      timezone
      weekBegins
      features {
        lottery
        venueContractDates
        eventCheckIn
        interestLists
        monthlyMaxHours
        sso
        equipment
        profileTenor
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
      }
      sso {
        uiSubDomains
        enablePasswordLogin
        metadataDocUrl
      }
    }
  }
`;
