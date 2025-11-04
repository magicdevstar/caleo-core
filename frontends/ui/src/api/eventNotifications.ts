import { gql } from "@apollo/client";

export const GET_EVENT_NOTIFICATIONS = gql`
  query GetEventNotifications($input: EventNotificationSearchInput!) {
    eventNotifications(input: $input) {
      items {
        title
        description
        attachments
        createdAt
      }
      total
    }
  }
`;

export const CREATE_EVENT_NOTIFICATION = gql`
  mutation CreateEventNotification($input: CreateEventNotification!) {
    eventNotification(input: $input) {
      id
    }
  }
`;

export const EVENT_NOTIFICATION_UPLOAD_URL = gql`
  mutation EventNotificationUploadUrl {
    eventNotificationAttachmentUploadUrl {
      attachmentPath
      uploadUrl
    }
  }
`;