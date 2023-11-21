import { GraphQLError } from "graphql";
import { Context } from "../../utils/createContext";
import {
  MemberSkill,
  SkillSearchInput,
  Skill,
  SkillStatus,
  UpsertMemberSkill,
  UpsertSkill,
  MemberSkillAttachmentUpload,
  MemberSkillSearchInput,
} from "../../__generated__/resolvers-types";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { adminOnly, adminOrOwnerOnly } from "../../utils/access";
import logger from "../../utils/logger";

export const skill = {
  Query: {
    skill: async (
      _parent: unknown,
      { id }: { id: string },
      { skills }: Context,
    ): Promise<Skill | null> => skills.get(id),
    skills: async (
      _parent: unknown,
      { input: { rankOnlyIds, ...input } }: { input: SkillSearchInput },
      { skills, user }: Context
    ): Promise<SearchResults<Skill>> => skills.search({
      orgId: user?.member.orgId!,
      queryField: 'name',
      ...input,
      ...(rankOnlyIds ? {
        $or: [
          { rankOnlyIds: [] },
          { rankOnlyIds: { $in: rankOnlyIds } },
        ]
      } : {}),
    }),
    memberSkills: async (
      _parent: unknown,
      { input }: { input: MemberSkillSearchInput },
      { memberSkills, user }: Context
    ): Promise<SearchResults<MemberSkill>> => memberSkills.search({
      orgId: user?.member.orgId!,
      ...input,
    })
  },
  Mutation: {
    removeSkill: async (
      _parent: unknown,
      { id }: { id: string },
      { assignments, skills, user }: Context
    ): Promise<string> => {
      adminOnly(user);

      await skills.remove(id, {
        modifiedById: user!.id,
      });

      await assignments.collection.updateMany({
        requiredSkillIds: id,
      }, {
        $set: {
          modifiedById: user!.id,
        },
        $pull: {
          requiredSkillIds: id,
        },
      } as any);

      return id;
    },
    removeUserSkill: async (
      _parent: unknown,
      { id }: { id: string },
      { memberSkills, users, user }: Context
    ): Promise<string> => {
      adminOrOwnerOnly(id, user);
      const memberSkill = await memberSkills.get(id);
      if (!memberSkill) {
        throw new GraphQLError('Could not find member skill');
      }
      await memberSkills.removeDoc(id, user!.id);
      const skillUser = await users.get(memberSkill.userId);

      if (skillUser) {
        skillUser.member.memberSkillIds = skillUser.member.memberSkillIds?.filter((s) => s !== id);
        await users.update({
          ...skillUser,
          modifiedById: user!.id,
        } as any, {
          skipMerge: true,
        });
      }

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
        modifiedById: user?.id!,
      } as any);
    },
    userSkill: async (
      _parent: unknown,
      { userSkill }: { userSkill: UpsertMemberSkill },
      { memberSkills, user, organization }: Context
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
        modifiedById: user?.id!,
      } as any, organization!);
    },
    userSkillAttachmentUploadUrl: async (
      _parent: unknown,
      _args: unknown,
      { memberSkills, user }: Context
    ): Promise<MemberSkillAttachmentUpload> => {
      return memberSkills.getUploadUrl({
        orgId: user?.member.orgId!,
      });
    }
  },
  fields: {
    Skill: {
      ...commonResolvers,
      org: (skill: Skill, _, { organizations }: Context) => organizations.loader.load(skill.orgId),
      ranksOnly: (skill: Skill, _, { ranks }: Context) => skill.rankOnlyIds && skill.rankOnlyIds.length > 0 ? ranks.loader.loadMany((skill.rankOnlyIds || []) as any) : [],
    },
    MemberSkill: {
      ...commonResolvers,
      skill: (memberSkill: MemberSkill, _, { skills }: Context) => skills.loader.load(memberSkill.skillId),
      user: (memberSkill: MemberSkill, _, { users }: Context) => users.loader.load(memberSkill.userId),
      image: (memberSkill: MemberSkill, _, { memberSkills }: Context) => memberSkill.imagePath ? memberSkills.getDownloadUrl(memberSkill.imagePath!) : null,
    },
  },
};
