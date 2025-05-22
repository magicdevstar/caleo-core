import { ObjectId } from "mongodb";
import { Context } from "../../../utils/createContext";
import {
  UserSearchInput,
  MemberRole,
  AllUsersSearchInput,
} from "../../../__generated__/resolvers-types";
import { adminOrOwnerOnly, superAdminOnly } from "../../../utils/access";
import { SearchResults } from "../../../utils/common.resolvers";
import { IUser, EnhancedUser } from "../../../types/common";

export const Query = {
  me: async (
    _parent: unknown,
    _args: unknown,
    { users, user }: Context
  ): Promise<IUser | null> => users.get(user!._id!),
  user: async (
    _parent: unknown,
    { id, shiftStart, timezoneOffset }: { id: string; shiftStart: string; timezoneOffset: number; },
    { users, user }: Context
  ): Promise<EnhancedUser | null> => {
    adminOrOwnerOnly(id, user);
    const usr = await users.get(id);

    return {
      ...(usr!),
      shiftStart,
      timezoneOffset,
    };
  },
  users: async (
    _parent: unknown,
    { input }: { input: UserSearchInput },
    { users, user }: Context
  ): Promise<SearchResults<IUser>> => users.search({
    limit: input.limit,
    skip: input.skip,
    queryField: input.queryField || 'name',
    order: input.order,
    orderBy: input.orderBy,
    query: input.query,
    ...(input.excludeIds && { _id: { $nin: input.excludeIds.map((id: any) => new ObjectId(id)) } }),
    ...(input.exactPNumber ? {'member.pNumber': input.exactPNumber} : {}),
    ...(input.pNumber ? {'member.pNumber': {
      $regex: input.pNumber,
      $options: 'i',
    }} : {}),
    ...(input.phone ? {'member.contactInfo.primaryPhone.number': {
      $regex: input.phone,
      $options: 'i',
    }} : {}),
    ...(input.email ? {'member.contactInfo.primaryEmail.address': {
      $regex: input.email,
      $options: 'i',
    }} : {}),
    ...(input.rankIds ? {'member.rankId': { $in: input.rankIds.map((r) => new ObjectId(r!)) }} : {}),
    ...(input.statuses ? {'member.status': { $in: input.statuses }} : {}),
    ...(input.tiers ? {'member.tier': { $in: input.tiers }} : {}),
    ...('admin' in input ? {'member.role': input.admin ? MemberRole.Admin : MemberRole.Member} : {}),
    'member.orgId': user?.member.orgId,
  }),
  allUsers: async (
    _parent: unknown,
    { input }: { input: AllUsersSearchInput },
    { users, user }: Context
  ): Promise<SearchResults<IUser>> => {
    superAdminOnly(user);

    return users.search({
      limit: input.limit,
      skip: input.skip,
      queryField: input.queryField || 'name',
      order: input.order,
      orderBy: input.orderBy,
      query: input.query,
      ...(input.excludeIds && { _id: { $nin: input.excludeIds.map((id: any) => new ObjectId(id)) } }),
      ...(input.pNumber ? {'member.pNumber': {
        $regex: input.pNumber,
        $options: 'i',
      }} : {}),
      ...(input.phone ? {'member.contactInfo.primaryPhone.number': {
        $regex: input.phone,
        $options: 'i',
      }} : {}),
      ...(input.email ? {'member.contactInfo.primaryEmail.address': {
        $regex: input.email,
        $options: 'i',
      }} : {}),
      ...(input.rankIds ? {'member.rankId': { $in: input.rankIds.map((r) => new ObjectId(r!)) }} : {}),
      ...(input.statuses ? {'member.status': { $in: input.statuses }} : {}),
      ...(input.tiers ? {'member.tier': { $in: input.tiers }} : {}),
      ...('admin' in input ? {'member.role': input.admin ? MemberRole.Admin : MemberRole.Member} : {}),
      ...(input.orgIds ? {'member.orgId': { $in: input.orgIds.map((o) => new ObjectId(o!)) }} : {}),
    });
  }
};
