import { GraphQLError } from "graphql";
import { MemberRole, User } from "../__generated__/resolvers-types";

export const adminOnly = (user?: User) => {
  if (!user?.member?.role || user?.member?.role !== MemberRole.Admin) {
    throw new GraphQLError("Unauthorized");
  }
};

export const userIsAdmin = (user?: User) =>
  user?.member?.role && user?.member?.role === MemberRole.Admin;

export const superAdminOnly = (user?: User) => {
  if (!user?.superAdmin) {
    throw new GraphQLError("Unauthorized");
  }
};

export const isSuperAdmin = (user?: User) => user?.superAdmin;

export const adminOrOwnerOnly = (userId: string, user?: User) => {
  if (
    userId === user?.id ||
    user?.member?.role === MemberRole.Admin
  ) return true;
  throw new GraphQLError("Unauthorized");
}
