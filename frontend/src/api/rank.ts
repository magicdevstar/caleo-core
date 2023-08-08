import { gql } from "@apollo/client";

export const REMOVE_RANK = gql`
  mutation RemoveRank($id: String!) {
    removeRank(id: $id)
  }
`;

export const GET_RANKS = gql`
  query GetRanks($input: RankSearchInput!) {
    ranks(input: $input) {
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

export const UPSERT_RANK = gql`
  mutation UpsertRank($input: UpsertRank!) {
    rank(rank: $input) {
      id
    }
  }
`;

export type RankTableFilters = {
  name: string;
  active: string[];
};

export type RankTableFilterValue = string | string[];
