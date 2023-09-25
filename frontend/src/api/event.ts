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

export const GET_ALL_EVENTS = gql`
  query GetAllEvents($input: EventSearchInput!) {
    events(input: $input) {
      items {
        id
        name
        startTime
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

export const GET_EVENT = gql`
  query GetEvent($id: String!) {
    event(id: $id) {
      id
      name
      attachments
      status
      venueId
      notes
      assignmentIds
      notifyWhenFullyStaffed
      scheduledFirstComeFirstServe
      startTime
      endTime

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
