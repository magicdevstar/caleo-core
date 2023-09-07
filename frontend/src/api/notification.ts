import { gql } from "@apollo/client";

export const REMOVE_NOTIFICATION = gql`
  mutation RemoveNotification($id: String!) {
    removeNotification(id: $id)
  }
`;

export const MARK_ALL_AS_SEEN = gql`
  mutation MarkAsSeen($ids: [String]!) {
    seenNotifications(notificationIds: $ids)
  }
`;

export const GET_ACTIVE_NOTIFICATIONS = gql`
  query GetActiveNotifications($input: SearchInput) {
    activeNotifications(input: $input) {
      items {
        id
        title
        body
        seen
        frequency
        updatedAt
      }
      total
    }
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
      expiration
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
