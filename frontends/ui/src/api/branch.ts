import { gql } from "@apollo/client";

export const REMOVE_BRANCH = gql`
  mutation RemoveBranch($id: String!) {
    removeBranch(id: $id)
  }
`;

export const GET_BRANCHES = gql`
  query GetBranches($input: BranchSearchInput!) {
    branches(input: $input) {
      items {
        id
        name
        active
        createdAt
      }
      total
    }
  }
`;

export const UPSERT_BRANCH = gql`
  mutation UpsertBranch($input: UpsertBranch!) {
    branch(branch: $input) {
      id
    }
  }
`;

export type BranchTableFilters = {
  name: string;
  active: string[];
};

export type BranchTableFilterValue = string | string[];
