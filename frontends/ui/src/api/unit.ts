import { gql } from "@apollo/client";

export const REMOVE_UNIT = gql`
  mutation RemoveUnit($id: String!) {
    removeUnit(id: $id)
  }
`;

export const GET_UNITS = gql`
  query GetUnits($input: UnitSearchInput!) {
    units(input: $input) {
      items {
        id
        name
        active
        divisions {
          id
          name
        }
        overtimeCode
        createdAt
      }
      total
    }
  }
`;

export const UPSERT_UNIT = gql`
  mutation UpsertUnit($input: UpsertUnit!) {
    unit(unit: $input) {
      id
    }
  }
`;

export type UnitTableFilters = {
  name: string;
  active: string[];
};

export type UnitTableFilterValue = string | string[];
