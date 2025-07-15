import { gql } from "@apollo/client";

export const GET_DOCUSIGN_EVENTS = gql`
  query DocusignEvents($input: DocusignEventSearchInput!) {
    docusignEvents(input: $input) {
      items {
        id
        envelopeId
        documentUrl
        status
        event {
          id
          referenceId
          name
          startTime,
          endTime,
        }
        shift {
          id
          startTime
          endTime
          status
          refNumber
          shiftCheckInOut {
            checkInTime
            checkOutTime
          }
          event {
            id
            referenceId
            name
            venue {
              id
              name
              address
              city
              state
              zip
              phone
            }
          }
          assignment {
            id
            name
          }
        } 
      }
      total
    }
  }
`;
