import { gql } from "@apollo/client";
import { User } from "src/__generated__/resolvers-types";

const userDetailProperties = `
  id
  firstName
  lastName
  superAdmin
  cognitoId,
  image
  member {
    orgId
    org {
      id
      timezone
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
  }
`

export const ME = gql`
  query Me {
    me {
      ${userDetailProperties}
    }
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

export const GET_USERS = gql`
  query GetUsers($input: UserSearchInput!) {
    users(input: $input) {
      items {
        id
        name
        member {
          pNumber
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
