import { Context } from "../..";
import {
  Member,
  NewUser,
  UpdateUser,
  User
} from "../../__generated__/resolvers-types";

export const user = {
  Query: {},
  Mutation: {
    newUser: async (
      _parent: unknown,
      { user }: { user: NewUser },
      { users }: Context
    ): Promise<User> => users.create(user),
    user: async (
      _parent: unknown,
      { user }: { user: UpdateUser },
      { users }: Context
    ): Promise<User> => users.update(user),
  },
  fields: {
    User: {
      createdAt: (user) => new Date(user.createdAt).toISOString(),
      updatedAt: (user) => new Date(user.createdAt).toISOString(),
    },
    Member: {
      rank: () => ({}),
      memberSkills: () => [],
      org: (member: Member, _, { organizations }: Context) => organizations.get(member.orgId),
    }
  },
};
