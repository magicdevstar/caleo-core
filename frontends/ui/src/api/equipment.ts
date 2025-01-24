import { gql } from "@apollo/client";

export const REMOVE_EQUIPMENT = gql`
  mutation RemoveEquipment($id: String!) {
    removeEquipment(id: $id)
  }
`;

export const CREATE_EQUIPMENT_UPLOAD_URL = gql`
  mutation CreateEquipmentUploadUrl {
    userEquipmentAttachmentUploadUrl {
      imagePath
      uploadUrl
    }
  }
`;

export const GET_BASE_EQUIPMENT = gql`
  query GetBaseEquipments($input: EquipmentSearchInput!) {
    equipments(input: $input) {
      items {
        id
        name
        requiresCert
      }
      total
    }
  }
`;

export const GET_EQUIPMENT_SLIM = gql`
  query GetEquipments($input: EquipmentSearchInput!) {
    equipments(input: $input) {
      items {
        id
        name
        active
      }
    }
  }
`;

export const GET_EQUIPMENTS = gql`
  query GetEquipments($input: EquipmentSearchInput!) {
    equipments(input: $input) {
      items {
        id
        name
        active
        requiresAdminApproval
        requiresCert
        createdAt
      }
      total
    }
  }
`;

export const GET_MEMBER_EQUIPMENTS = gql`
  query GetMemberEquipments($input: MemberEquipmentSearchInput!) {
    memberEquipments(input: $input) {
      items {
        id
        status
        image
        user {
          id
          name
        }
        equipment {
          id
          name
        }
        createdAt
        updatedAt
      }
      total
    }
  }
`;

export const UPSERT_EQUIPMENT = gql`
  mutation UpsertEquipment($input: UpsertEquipment!) {
    equipment(equipment: $input) {
      id
    }
  }
`;

export type EquipmentTableFilters = {
  name: string;
  cert: string[];
  admin: string[];
  active: string[];
};

export type EquipmentTableFilterValue = string | string[];

export type IEquipmentTableFilters = {
  name: string;
  cert: string[];
  admin: string[];
  active: string[];
};
