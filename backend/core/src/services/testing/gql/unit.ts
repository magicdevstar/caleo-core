import gql from "graphql-tag";

export const REMOVE_UNIT = gql`
  mutation RemoveUnit($id: String!) {
    removeUnit(id: $id)
  }
`;

export const GET_UNIT = gql`
  query GetUnit($id: String!) {
    unit(id: $id) {
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
  }
`;

export const UPSERT_UNIT = gql`
  mutation UpsertUnit($input: UpsertUnit!) {
    unit(unit: $input) {
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
  }
`;
