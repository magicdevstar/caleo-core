import { Context } from "../..";
import {
  Member,
  NewUser,
  SearchInput,
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
      { limit, skip }: SearchInput,
      { users, user }: Context
    ): Promise<SearchResults<User>> => users.search({
      limit,
      skip,
      orgId: user?.member.orgId!,
    }),
  },
  Mutation: {
    newUser: async (
      _parent: unknown,
      { user }: { user: NewUser },
      { users }: Context
    ): Promise<User> => users.create(user as any),
    user: async (
      _parent: unknown,
      { user }: { user: UpdateUser },
      { users }: Context
    ): Promise<User> => users.update(user as any),
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
