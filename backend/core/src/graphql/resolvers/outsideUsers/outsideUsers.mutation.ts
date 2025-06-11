import { CreateOutsideUser } from "../../../__generated__/resolvers-types";
import { ICreateOutsideUser } from "../../../models/outsideUsers/outsideUser.service";
import { adminOnly } from "../../../utils/access";
import { Context } from "../../../utils/createContext";

export const Mutation = {
  outsideUsers: (
    _parent: unknown,
    { users }: { users: CreateOutsideUser[] },
    context: Context,
  ): Promise<ICreateOutsideUser[]> => {
    adminOnly(context.user);
    return context.outsideUsers.bulkLoad(
      users,
      context.user,
    );
  },
  removeOutsideUser: async (
    _parent: unknown,
    { id }: { id: string },
    context: Context,
  ): Promise<string> => {
    adminOnly(context.user);
    await context.outsideUsers.remove(id, context.user);
    return id;
  },
};
