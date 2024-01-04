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