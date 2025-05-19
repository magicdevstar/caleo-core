import { GraphQLError } from "graphql";
import { MemberRole } from "../__generated__/resolvers-types";
import { IUser } from "../types/common";

export const adminOnly = (user?: IUser) => {
  if (!user?.member?.role || user?.member?.role !== MemberRole.Admin) {
    throw new GraphQLError("Unauthorized");
  }
};

export const userIsAdmin = (user?: IUser) =>
  user?.member?.role && user?.member?.role === MemberRole.Admin;

export const superAdminOnly = (user?: IUser) => {
  if (!user?.superAdmin) {
    throw new GraphQLError("Unauthorized");
  }
};

export const isSuperAdmin = (user?: IUser) => user?.superAdmin;

export const adminOrOwnerOnly = (userId: string, user?: IUser) => {
  if (
    userId === user?.id ||
    user?.member?.role === MemberRole.Admin
  ) return true;
  throw new GraphQLError("Unauthorized");
}
