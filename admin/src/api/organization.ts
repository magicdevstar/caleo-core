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
      features {
        lottery
        venueContractDates
        eventCheckIn
        interestLists
        monthlyMaxHours
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
      }
    }
  }
`;
