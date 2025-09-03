import { gql } from "@apollo/client";
import { User } from "src/__generated__/resolvers-types";

const userDetailProperties = `
  id
  firstName
  lastName
  name
  superAdmin
  cognitoId,
  image
  browserNotificationSettings {
    id
    subscription {
      endpoint
    }
  }
  member {
    orgId
    inactivateUntil
    inactivationNote
    tenor
    hourlyRate
    incidentHourlyRate
    allowSelfCheckIn
    org {
      id
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
        vehicleCategories
        rankGrouping
        endOfShiftPDF
        docusignCheckout
        customizableShiftId
        incidentEvents
        outsideUserList
        signingAuthorityAssignment
        financeUnit
        showShiftsByEvent
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
        userRelinquishShift {
          enabled
          numberOfHoursBeforeShift
        }
        interestList {
          defaultHoursBeforeShift
          defaultHoursBeforeShift
        }
        checkInOut {
          minutesBeforeShiftStart
          minutesAfterShiftEnd
        }
        lottery {
          enabled
          fcfsShiftsDelay
          open {
            dayOfWeek
            time
          }
          close {
            dayOfWeek
            time
          }
        }
      }
    }
    contactInfo {
      primaryEmail {
        address
        receiveEmails
      }
      primaryPhone {
        number
        receiveTexts
      }
      secondaryEmail {
        address
        receiveEmails
      }
      secondaryPhone {
        number
        receiveTexts
      }
    }
    memberSkills {
      id
      status
      skillId
      image
      createdAt
      skill {
        id
        name
        requiresCert
      }
    }
    memberEquipments {
      id
      status
      equipmentId
      image
      createdAt
      equipment {
        id
        name
        requiresCert
      }
    }
    availability {
      monday {
        available
        times {
          startTime
          endTime
        }
      }
      tuesday {
        available
        times {
          startTime
          endTime
        }
      }
      wednesday {
        available
        times {
          startTime
          endTime
        }
      }
      thursday {
        available
        times {
          startTime
          endTime
        }
      }
      friday {
        available
        times {
          startTime
          endTime
        }
      }
      saturday {
        available
        times {
          startTime
          endTime
        }
      }
      sunday {
        available
        times {
          startTime
          endTime
        }
      }
    }
    pNumber
    rank {
      id
      name
    }
    unit {
      id
      name
      divisions {
        id
        name
      }
    }
    division {
      id
      name
    }
    role
    status
    tier
    tierUntil
    tierResetOnNextLottery
    adminNote
    maxShifts
  }
`

export const ME = gql`
  query Me {
    me {
      ${userDetailProperties}
    }
  }
`;

export const CREATE_BROWSER_NOTIFICATION_SUBSCRIPTION = gql`
  mutation CREATE_BROWSER_NOTIFICATION_SUBSCRIPTION($input: InputBrowserNotificationSubscription!) {
    browserNotificationSubscription(input: $input) {
      id
    }
  }
`;

export const REMOVE_USER = gql`
mutation REMOVE_USER ($id: String!) {
  removeUser(id: $id)
}
`;

export const CREATE_PROFILE_PHOTO_UPLOAD_URL = gql`
  mutation CreateProfilePhotoUploadUrl {
    profilePhotoUploadUrl {
      imagePath
      uploadUrl
    }
  }
`;

export const ADMIN_RESET_PASSWORD = gql`
  mutation AdminResetPassword($input: InputAdminResetPassword!) {
    adminEditPassword(input: $input)
  }
`;

export const GET_USER = gql`
  query GetUser($id: String!) {
    user(id: $id) {
      ${userDetailProperties}
    }
  }
`;

export const UPSERT_MEMBER_SKILL = gql`
  mutation UpsertMemberSkill($input: UpsertMemberSkill!) {
    userSkill(userSkill: $input) {
      id
    }
  }
`;

export const UPSERT_MEMBER_EQUIPMENT = gql`
  mutation UpsertMemberEquipment($input: UpsertMemberEquipment!) {
    userEquipment(userEquipment: $input) {
      id
    }
  }
`;

export const SEND_INVITATION = gql`
  mutation InviteUser($user: InviteUser!) {
    inviteUser(user: $user) {
      id
    }
  }
`;

export const REMOVE_MEMBER_SKILL = gql`
  mutation RemoveMemberSkill($id: String!) {
    removeUserSkill(id: $id)
  }
`;

export const REMOVE_MEMBER_EQUIPMENT = gql`
  mutation RemoveMemberEquipment($id: String!) {
    removeUserEquipment(id: $id)
  }
`;

export const GET_SHIFT_USERS = gql`
query GetShiftUsers($id: String!, $name: String) {
  shiftUsers(id: $id, name: $name) {
    items {
      id
      name
    }
  }
}
`;

export const GET_USERS_SLIM = gql`
query GetUsers($input: UserSearchInput!) {
    users(input: $input) {
    items {
      id
      name
      member {
        maxShifts
      }
    }
  }
}
`;

export const GET_USERS = gql`
  query GetUsers($input: UserSearchInput!) {
    users(input: $input) {
      items {
        id
        name
        firstName
        lastName
        cognitoId
        member {
          pNumber
          orgId
          inactivateUntil
          inactivationNote
          hourlyRate
          incidentHourlyRate
          contactInfo {
            primaryEmail {
              address
            }
            primaryPhone {
              number
            }
          }
          rank {
            id
            name
          }
          unit {
            id
            name
            divisions {
              id
              name
            }
          }
          division {
            id
            name
          }
          tier
          status
        }
        createdAt
      }
      total
    }
  }
`;

export const GET_ACCOUNT_REQUEST_USERS = gql`
  query GetUsers($input: UserSearchInput!) {
    users(input: $input) {
      items {
        id
        cognitoId
        name
        firstName
        lastName
        member {
          orgId
          pNumber
          role
          adminNote
          rankId
          unitId
          divisionId
          hourlyRate
          incidentHourlyRate
          contactInfo {
            primaryEmail {
              address
            }
            primaryPhone {
              number
            }
          }
          rank {
            id
            name
          }
          unit {
            id
            name
          }
          division {
            id
            name
          }
          tier
          status
        }
      }
      total
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUser!) {
    user(user: $input) {
      id
    }
  }
`;

export const GET_USER_SHIFT_ACTIVITY = gql`
  query GetUserActivity($input: EventUserActionSearchInput!) {
    eventUserActions(input: $input) {
      total
      items {
        id
        actionType
        updatedAt
        shiftGroupId
        incidentFormId

        actionId

        source        
        modifiedBy {
          id
          name
        }
        timestamp
        action
        notes
      }
    }
  }
`;

export interface FrontendUser extends User {
  displayName: string;
  email: string;
  family_name: string;
  photoURL: string;
  role: string;
}

export type UserTableFilterValue = string | string[];

export type UserTableFilters = {
  name: string;
  pNumber: String;
  rankIds: string[];
  statuses: string[];
  skillIds: string[];
  tiers: string[];
};
