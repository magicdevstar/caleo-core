import { GraphQLError } from "graphql";
import { Context } from "../../utils/createContext";
import {
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
import { ObjectId, PullOperator } from "mongodb";
import { ISkill } from "../../models/skill";
import { IMemberSkill } from "../../models/memberSkill";

export const skill = {
  Query: {
    skill: async (
      _parent: unknown,
      { id }: { id: string },
      { skills }: Context,
    ): Promise<ISkill | null> => skills.get(id),
    skills: async (
      _parent: unknown,
      { input: { rankOnlyIds, ...input } }: { input: SkillSearchInput },
      { skills, user }: Context
    ): Promise<SearchResults<ISkill>> => skills.search({
      orgId: user.member.orgId,
      queryField: 'name',
      ...input,
      orderBy: input.orderBy || 'name',
      order:  input.order || 'asc',
      ...(rankOnlyIds ? {
        $or: [
          { rankOnlyIds: [] },
          { rankOnlyIds: { $in: rankOnlyIds.map((id) => new ObjectId(id!)) } },
        ]
      } : {}),
    }),
    memberSkills: async (
      _parent: unknown,
      { input }: { input: MemberSkillSearchInput },
      { memberSkills, user }: Context
    ): Promise<SearchResults<IMemberSkill>> => memberSkills.search({
      orgId: user.member.orgId,
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

      const userId = user!._id!;
      await skills.remove(id, {
        modifiedById: userId,
      });

      const requiredSkillId = new ObjectId(id);
      await assignments.collection.updateMany({
        requiredSkillIds: requiredSkillId,
      }, {
        $set: {
          modifiedById: userId,
        },
        $pull: {
          requiredSkillIds: requiredSkillId,
        },
      } as any);

      return id;
    },
    removeUserSkill: async (
      _parent: unknown,
      { id }: { id: string },
      { memberSkills, users, user }: Context
    ): Promise<string> => {
      const memberSkill = await memberSkills.get(id);
      if (!memberSkill) {
        throw new GraphQLError('Could not find member skill');
      }
      adminOrOwnerOnly(memberSkill.userId.toString(), user);
      await memberSkills.removeDoc(id, user!._id!);
      await users.collection.updateOne({
        _id: memberSkill.userId,
      }, {
        $pull: {
          memberSkillIds: new ObjectId(id),
        } as PullOperator<Document>,
      });

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
        ...(skill.rankOnlyIds && {
          rankOnlyIds: skill.rankOnlyIds.map((id) => new ObjectId(id!)),
        }),
        orgId: user.member.orgId,
        modifiedById: user._id!,
      } as any);
    },
    userSkill: async (
      _parent: unknown,
      { userSkill }: { userSkill: UpsertMemberSkill },
      { memberSkills, user, organization }: Context
    ): Promise<IMemberSkill> => {
      adminOrOwnerOnly(userSkill.userId, user);

      if (
        userSkill.id && userSkill.status !== SkillStatus.Pending
      ) {
        adminOnly(user);
      }
      
      return memberSkills.upsertDoc({
        ...userSkill,
        ...(userSkill.skillId && { skillId: new ObjectId(userSkill.skillId) }),
        ...(userSkill.userId && { userId: new ObjectId(userSkill.userId) }),
        orgId: user.member.orgId,
        modifiedById: user._id!,
      } as any, organization!);
    },
    userSkillAttachmentUploadUrl: async (
      _parent: unknown,
      _args: unknown,
      { memberSkills, user }: Context
    ): Promise<MemberSkillAttachmentUpload> => {
      return memberSkills.getUploadUrl({
        orgId: user.member.orgId.toString(),
      });
    }
  },
  fields: {
    Skill: {
      ...commonResolvers,
      org: (skill: ISkill, _, { organizations }: Context) => organizations.loader.load(skill.orgId.toString()),
      ranksOnly: (skill: ISkill, _, { ranks }: Context) => skill.rankOnlyIds && skill.rankOnlyIds.length > 0 ? ranks.loader.loadMany((skill.rankOnlyIds || []).map((id) => id.toString())) : [],
    },
    MemberSkill: {
      ...commonResolvers,
      skill: (memberSkill: IMemberSkill, _, { skills }: Context) => skills.loader.load(memberSkill.skillId.toString()),
      user: (memberSkill: IMemberSkill, _, { users }: Context) => users.loader.load(memberSkill.userId.toString()),
      image: (memberSkill: IMemberSkill, _, { memberSkills }: Context) => memberSkill.imagePath ? memberSkills.getDownloadUrl(memberSkill.imagePath!) : null,
    },
  },
};
