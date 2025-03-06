import { gql } from '@apollo/client';
import { User } from 'src/__generated__/resolvers-types';

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
    org {
      id
      timezone
      weekBegins
      features {
        lottery
        venueContractDates
        eventCheckIn
        interestLists
        monthlyMaxHours
        lasdUserFields
      }
      settings {
        shiftsPerWeek
        hoursPerMonth
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
    role
    status
    tier
    tierUntil
    tierResetOnNextLottery
    adminNote
    maxShifts
  }
`;

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
  mutation REMOVE_USER($id: String!) {
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
          contactInfo {
            primaryEmail {
              address
            }
          }
          rank {
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
          tier
          status
        }
      }
      total
    }
  }
`;

export const IMPERSONATE_USER = gql`
  mutation ImpersonateUser($userId: String!) {
    impersonateUser(userId: $userId)
  }
`;

export const RESET_IMPERSONATION = gql`
  mutation ResetImpersonation {
    resetImpersonation
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUser!) {
    user(user: $input) {
      id
    }
  }
`;

export interface FrontendUser extends User {
  displayName: string;
  email: string;
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
