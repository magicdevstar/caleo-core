import { gql } from "@apollo/client";

export const GET_LOTTERY_ANALYTICS = gql`
  query LottoAnalytics($userId: String) {
    lottoAnalytics(userId: $userId) {
      id
      total
      totalShifts
      approved
      rejected
      requests {
        id
        order
        status
        totalRequests
        event {
          id
          name
        }
        assignment {
          id
          name
        }
      }
    }
  }
`;