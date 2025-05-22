import { ObjectId } from "mongodb";
import { MemberSkillSearchInput, SkillSearchInput } from "../../../__generated__/resolvers-types";
import { ISkill } from "../../../models/skill";
import { SearchResults } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";
import { IMemberSkill } from "../../../models/memberSkill";

export const Query = {
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
};
