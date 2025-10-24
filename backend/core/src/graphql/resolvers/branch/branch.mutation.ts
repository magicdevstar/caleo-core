import { GraphQLError } from "graphql";
import { adminOnly } from "../../../utils/access";
import { Context } from "../../../utils/createContext";
import { IBranch } from "../../../models/branch";

export const Mutation = {
  removeBranch: async (
    _parent: unknown,
    { id }: { id: string },
    {
      branches,
      user,
    }: Context
  ): Promise<string> => {
    adminOnly(user);
    await branches.remove(id, {
      modifiedById: user!._id!,
    });
    return id;
  },
  branch: async (
    _parent: unknown,
    { branch: input }: { branch: IBranch },
    { branches, user }: Context
  ): Promise<IBranch> => {
    adminOnly(user);
    if (Object.keys(input).length === 0) {
      throw new GraphQLError("Branch is empty");
    }
    return branches.upsert({
      ...input,
      orgId: user.member.orgId,
      modifiedById: user!._id!,
    });
  },
};