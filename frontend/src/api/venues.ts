import { gql } from "@apollo/client";

export const REMOVE_VENUE = gql`
  mutation RemoveVenue($id: String!) {
    removeVenue(id: $id)
  }
`;

export const GET_ALL_VENUES = gql`
  query GetAllVenues($input: VenueSearchInput!) {
    venues(input: $input) {
      items {
        id
        name
        address
        contact {
          firstName
        }
        status
        createdAt
        updatedAt
      }
      total
    }
  }
`;

export const GET_VENUE = gql`
  query GetVenue($id: String!) {
    venue(id: $id) {
      id
      name
      address
      city
      state
      zip
      phone
      notes
      contact {
        firstName
        lastName
        email
        phone
      }
      status
    }
  }
`;

export const UPSERT_VENUE = gql`
  mutation UpsertVenue($input: UpsertVenue!) {
    venue(venue: $input) {
      id
    }
  }
`;

export type VenueTableFilters = {
  name: string;
  active: string[];
};

export type VenueTableFilterValue = string | string[];
