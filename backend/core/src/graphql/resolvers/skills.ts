import { GraphQLError } from "graphql";
import { Context } from "../..";
import {  MemberSkill, SearchInput, Skill, SkillStatus, UpsertMemberSkill, UpsertSkill } from "../../__generated__/resolvers-types";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { adminOnly, adminOrOwnerOnly } from "../../utils/access";

export const skill = {
  Query: {
    skill: async (
      _parent: unknown,
      { id }: { id: string },
      { skills }: Context,
    ): Promise<Skill | null> => skills.get(id),
    skills: async (
      _parent: unknown,
      { limit, skip }: SearchInput,
      { skills, user }: Context
    ): Promise<SearchResults<Skill>> => skills.search({
      orgId: user?.member.orgId!,
      limit,
      skip,
    })
  },
  Mutation: {
    removeSkill: async (
      _parent: unknown,
      { id }: { id: string },
      { skills, user }: Context
    ): Promise<string> => {
      adminOnly(user);

      await skills.remove(id)
      return id;
    },
    removeUserSkill: async (
      _parent: unknown,
      { id }: { id: string },
      { memberSkills, user }: Context
    ): Promise<string> => {
      adminOrOwnerOnly(id, user);
      await memberSkills.removeDoc(id);
      return id;
    },
    skill: async (
      _parent: unknown,
      { skill }: { skill: UpsertSkill },
      { skills, user }: Context
    ): Promise<Skill> => {
      adminOnly(user);
      if (Object.keys(skill).length === 0) {
        throw new GraphQLError("Skill is empty");
      }
      return skills.upsert({
        ...skill,
        orgId: user?.member.orgId!,
      } as any);
    },
    userSkill: async (
      _parent: unknown,
      { userSkill }: { userSkill: UpsertMemberSkill },
      { memberSkills, user }: Context
    ): Promise<MemberSkill> => {
      adminOrOwnerOnly(userSkill.userId, user);

      if (
        userSkill.id && userSkill.status !== SkillStatus.Pending
      ) {
        adminOnly(user);
      }
      
      return memberSkills.upsertDoc({
        ...userSkill,
        orgId: user?.member.orgId!,
      } as any);
    },
  },
  fields: {
    Skill: {
      ...commonResolvers,
      org: (skill: Skill, _, { organizations }: Context) => organizations.loader.load(skill.orgId),
    },
    MemberSkill: {
      skill: (memberSkill: MemberSkill, _, { skills }: Context) => skills.loader.load(memberSkill.skillId),
      user: (memberSkill: MemberSkill, _, { users }: Context) => users.loader.load(memberSkill.userId),
    },
  },
};
