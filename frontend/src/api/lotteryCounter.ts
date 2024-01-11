import { gql } from "@apollo/client";

export const GET_LOTTERY_DATES = gql`
  query GetLotteryDates($input: SearchInput!) {
    lotteryCounters(input: $input) {
      items {
        id
        counter
        start
        end
      }
      total
    }
  }
`;

export const GET_SITE_LOCK = gql`
  query GetSiteLock {
    siteLock {
      id
      locked
      message
    }
  }
`;
