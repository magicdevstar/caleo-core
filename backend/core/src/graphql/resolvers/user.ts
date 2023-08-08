import { Context } from "../..";
import {
  Member,
  NewUser,
  UserSearchInput,
  UpdateUser,
  User
} from "../../__generated__/resolvers-types";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";

export const user = {
  Query: {
    me: async (
      _parent: unknown,
      _args: unknown,
      { users, user }: Context
    ): Promise<User | null> => users.get(user!.id),
    users: async (
      _parent: unknown,
      { input }: { input: UserSearchInput },
      { users, user }: Context
    ): Promise<SearchResults<User>> => users.search({
      limit: input.limit,
      skip: input.skip,
      queryField: 'name',
      query: input.query,
      pNumber: input.pNumber,
      ...(input.rankIds ? {'member.rankId': { $in: input.rankIds }} : {}),
      ...(input.statuses ? {'member.status': { $in: input.statuses }} : {}),
      ...(input.tiers ? {'member.tier': { $in: input.tiers }} : {}),
      ...(input.admin ? {'member.admin': { $in: input.admin }} : {}),
      'member.orgId': user?.member.orgId!,
    }),
  },
  Mutation: {
    newUser: async (
      _parent: unknown,
      { user }: { user: NewUser },
      { users }: Context
    ): Promise<User> => users.create({
      ...user,
      name: `${user.firstName} ${user.lastName}`,
    } as any),
    user: async (
      _parent: unknown,
      { user }: { user: UpdateUser },
      { users }: Context
    ): Promise<User> => users.update({
      ...user,
      name: `${user.firstName} ${user.lastName}`,
    } as any),
  },
  fields: {
    User: {
      ...commonResolvers,
    },
    Member: {
      rank: (member: Member, _, { ranks }: Context) =>
        member.rankId ? ranks.loader.load(member.rankId) : null,
      memberSkills: (member: Member, _, { memberSkills }: Context) => {
        if (Array.isArray(member.memberSkillIds) && member.memberSkillIds.length > 0) {
          return memberSkills.loader.loadMany(member.memberSkillIds as string[]);
        }
        return [];
      },
      org: (member: Member, _, { organizations }: Context) => organizations.loader.load(member.orgId),
    }
  },
};
