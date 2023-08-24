import { gql } from "@apollo/client";

export const REMOVE_SKILL = gql`
  mutation RemoveSkill($id: String!) {
    removeSkill(id: $id)
  }
`;

export const CREATE_SKILL_UPLOAD_URL = gql`
  mutation CreateSkillUploadUrl {
    userSkillAttachmentUploadUrl {
      imagePath
      uploadUrl
    }
  }
`;

export const GET_BASE_SKILLS = gql`
  query GetBaseSkills($input: SkillSearchInput!) {
    skills(input: $input) {
      items {
        id
        name
      }
      total
    }
  }
`;

export const GET_SKILL_SLIM = gql`
  query GetSkills($input: SkillSearchInput!) {
    skills(input: $input) {
      items {
        id
        name
        active
      }
    }
  }
`;

export const GET_SKILLS = gql`
  query GetSkills($input: SkillSearchInput!) {
    skills(input: $input) {
      items {
        id
        name
        active
        requiresAdminApproval
        requiresCert
        rankOnlyIds
        ranksOnly {
          id
          name
        }
        createdAt
      }
      total
    }
  }
`;

export const UPSERT_SKILL = gql`
  mutation UpsertSkill($input: UpsertSkill!) {
    skill(skill: $input) {
      id
    }
  }
`;

export type SkillTableFilters = {
  name: string;
  cert: string[];
  admin: string[];
  active: string[];
};

export type SkillTableFilterValue = string | string[];

export type ISkillTableFilters = {
  name: string;
  cert: string[];
  admin: string[];
  active: string[];
};
