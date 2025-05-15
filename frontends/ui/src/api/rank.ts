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
        hourlyRate
        active
        createdAt
        rankGroup {
          id
          name
        }
      }
      total
    }
  }
`;

export const GET_RANK_GROUPS = gql`
  query GetRankGroups($input: RankGroupSearchInput!) {
    rankGroups(input: $input) {
      items {
        id
        name
        ranks {
          id
          name
        }
      }
      total
    }
  }
`;

export const CREATE_RANK_GROUP = gql`
  mutation CreateRankGroup($input: UpsertRankGroup!) {
    rankGroup(rankGroup: $input) {
      id
      name
    }
  }
`;

export const REMOVE_RANK_FROM_GROUP = gql`
  mutation RemoveRankFromGroup($rankIds: [String!]!, $rankGroupId: String!) {
    removeRanksFromGroup(rankIds: $rankIds, rankGroupId: $rankGroupId)
  }
`;

export const REMOVE_RANK_GROUP = gql`
  mutation RemoveRankGroup($id: String!) {
    removeRankGroup(id: $id)
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
