import { gql } from "@apollo/client";

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
