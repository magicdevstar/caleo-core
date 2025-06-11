import { gql } from "@apollo/client";

export const REMOVE_OUTSIDE_USER = gql`
  mutation RemoveOutsideUser($id: String!) {
    removeOutsideUser(id: $id)
  }
`;

export const GET_OUTSIDE_USERS = gql`
  query GetOutsideUsers($input: SearchInput!) {
    outsideUsers(input: $input) {
      items {
        id
        name
        email
      }
      total
    }
  }
`;

export const CREATE_OUTSIDE_USERS = gql`
  mutation CreateOutsideUsers($users: [CreateOutsideUser!]!) {
    outsideUsers(users: $users) {
      id
    }
  }
`;

export type OutsideUserTableFilters = {
  name: string;
  email: string;
};

export type OutsideUserTableFilterValue = string | string[];
