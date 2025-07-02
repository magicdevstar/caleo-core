import { gql } from "@apollo/client";

export const REMOVE_VEHICLE_CATEGORY = gql`
  mutation RemoveVehicleCategory($id: String!) {
    removeVehicleCategory(id: $id)
  }
`;

export const GET_VEHICLE_CATEGORIES = gql`
  query GetVehicleCategories($input: VehicleCategoriesSearchInput!) {
    vehicleCategories(input: $input) {
      items {
        id
        name
        milageRate
        active
        createdAt
      }
      total
    }
  }
`;

export const UPSERT_VEHICLE_CATEGORY = gql`
  mutation UpsertVehicleCategory($input: UpsertVehicleCategories!) {
    vehicleCategory(vehicleCategory: $input) {
      id
    }
  }
`;

export type VehicleCategoryTableFilters = {
  name: string;
  active: string[];
};

export type VehicleCategoryTableFilterValue = string | string[];
