import { gql } from "@apollo/client";

export const REMOVE_EVENT = gql`
  mutation RemoveEvent($id: String!) {
    removeEvent(id: $id)
  }
`;

export const EVENT_UPLOAD_URL = gql`
  mutation EventUploadUrl {
    eventAttachmentUploadUrl {
      attachmentPath
      uploadUrl
    }
  }
`;

export const GET_ALL_EVENTS_SLIM = gql`
  query GetAllEvents($input: EventSearchInput!) {
    events(input: $input) {
      items {
        id
        referenceId
        name
      }
      total
    }
  }
`;

export const GET_ALL_EVENTS = gql`
  query GetAllEvents($input: EventSearchInput!) {
    events(input: $input) {
      items {
        id
        referenceId
        name
        startTime
        endTime
        availableShifts
        status
        createdBy {
          member {
            pNumber
          }
        }
        venue {
          id
          name
        }
        createdAt
      }
      total
    }
  }
`;

export const GET_LOTTERY_COUNTER = gql`
  query GetLotteryCounter {
    lotteryCounter {
      id
      counter
    }
  }
`;

export const GET_SELECTED_LOTTERY_COUNTER = gql`
  query GetSelectedLotteryCounter($counter: Int!) {
    lotteryCounter(counter: $counter) {
      id
      counter
      start
      end
    }
  }
`;

export const GET_EVENT_FOR_REPORT = gql`
query GetEvent($id: String!) {
  event(id: $id) {
    id
    referenceId
    name
    startTime
    endTime
    createdBy {
      member {
        pNumber
      }
    }
    venue {
      id
      name
    }
    assignments {
      id
      name
      shifts {
        id
        startTime
        endTime
        status
        user {
          id
          firstName
          lastName
          member {
            pNumber
            contactInfo {
              primaryPhone {
                number
              }
            }
          }
        }
      }
    }

  }
}
`;

export const GET_EVENT = gql`
  query GetEvent($id: String!) {
    event(id: $id) {
      id
      referenceId
      name
      attachments
      status
      venueId
      notes
      assignmentIds
      attachmentPaths
      lotteryNumber
      notifyWhenFullyStaffed
      scheduledFirstComeFirstServe
      startTime
      endTime
      createdById

      lotteryCounter {
        id
        counter
        start
        end
      }

      venue {
        id
        name
        address
        city
        state
        zip
        notes
      }

      assignments {
        id
        name
        ranks {
          id
          name
        }

        requiredSkills {
          id
          name
        }

        shifts {
          id
          shiftId
          status
          startTime
          endTime
          userId
        }
      }

    }
  }
`;

export const UPSERT_EVENT = gql`
  mutation UpsertEvent($input: UpsertEvent!) {
    event(event: $input) {
      id
    }
  }
`;

export type EventTableFilters = {
  name: string;
};

export type EventTableFilterValue = string | string[];
