import { gql } from "@apollo/client";

export const REMOVE_SKILL = gql`
  mutation RemoveSkill($id: String!) {
    removeSkill(id: $id)
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
