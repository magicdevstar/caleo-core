import { gql } from "@apollo/client";

export const REMOVE_NOTIFICATION = gql`
  mutation RemoveNotification($id: String!) {
    removeNotification(id: $id)
  }
`;

export const GET_ALL_NOTIFICATIONS = gql`
  query GetAllNotifications($input: NotificationSearchInput!) {
    notifications(input: $input) {
      items {
        id
        title
        createdBy {
          id
          name
        }
        active
        createdAt
        updatedAt
      }
      total
    }
  }
`;

export const GET_NOTIFICATION = gql`
  query GetNotification($id: String!) {
    notification(id: $id) {
      id
      title
      body
      frequency
      rankIds
      ranks {
        id
        name
      }
      active
      createdAt
      updatedAt
    }
  }
`;

export const UPSERT_NOTIFICATION = gql`
  mutation UpsertNotification($input: UpsertNotification!) {
    notification(notification: $input) {
      id
    }
  }
`;

export type NotificationTableFilters = {
  name: string;
  active: string[];
};

export type NotificationTableFilterValue = string | string[];
