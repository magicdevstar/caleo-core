import { gql } from "@apollo/client";

export const ME = gql`
  query Query {
    me {
      id
      firstName
      lastName
      superAdmin
      cognitoId,
      member {
        orgId
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
          skill {
            id
            name
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

export type UserTableFilterValue = string | string[];

export type UserTableFilters = {
  name: string;
  pNumber: String;
  rankIds: string[];
  statuses: string[];
  skillIds: string[];
  tiers: string[];
};
