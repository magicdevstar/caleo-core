import { Context } from "../..";
import {
  Member,
  NewUser,
  UserSearchInput,
  UpdateUser,
  User,
  ProfilePhotoAttachmentUpload,
} from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { GraphQLError } from "graphql";

export const user = {
  Query: {
    me: async (
      _parent: unknown,
      _args: unknown,
      { users, user }: Context
    ): Promise<User | null> => users.get(user!.id),
    user: async (
      _parent: unknown,
      { id }: { id: string },
      { users, user }: Context
    ): Promise<User | null> => {
      adminOnly(user);
      return users.get(id);
    },
    users: async (
      _parent: unknown,
      { input }: { input: UserSearchInput },
      { users, user }: Context
    ): Promise<SearchResults<User>> => users.search({
      limit: input.limit,
      skip: input.skip,
      queryField: 'name',
      query: input.query,
      ...(input.pNumber ? {'member.pNumber': input.pNumber} : {}),
      ...(input.phone ? {'member.contactInfo.primaryPhone.number': input.phone} : {}),
      ...(input.email ? {'member.contactInfo.primaryEmail.address': input.email} : {}),
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
      availability: {
        monday: {
          available: false,
          times: [],
        },
        tuesday: {
          available: false,
          times: [],
        },
        wednesday: {
          available: false,
          times: [],
        },
        thursday: {
          available: false,
          times: [],
        },
        friday: {
          available: false,
          times: [],
        },
        saturday: {
          available: false,
          times: [],
        },
        sunday: {
          available: false,
          times: [],
        },
      },
    } as any),
    user: async (
      _parent: unknown,
      { user }: { user: UpdateUser },
      { organizations, users }: Context
    ): Promise<User> => {
      const existingUser = await users.get(user.id);

      if (!existingUser) {
        throw new GraphQLError('User not found');
      }

      const updateUser = {
        ...existingUser,
        ...user,
        name: `${user.firstName} ${user.lastName}`,
        member: {
          ...existingUser.member,
          ...user.member,
          contactInfo: user.member?.contactInfo || existingUser.member?.contactInfo,
          memberSkillIds: user.member?.memberSkillIds || existingUser.member?.memberSkillIds,
          availability: user.member?.availability || existingUser.member?.availability,
        }
      };

      return users.update(updateUser as any, { skipMerge: true });
    },
    profilePhotoUploadUrl: async (
      _parent: unknown,
      _args: unknown,
      { users, user }: Context
    ): Promise<ProfilePhotoAttachmentUpload> => {
      return users.getUploadUrl({
        orgId: user?.member.orgId!,
      });
    }
  },
  fields: {
    User: {
      ...commonResolvers,
      image: (user: User, _, { users }: Context) => user.imagePath ? users.getDownloadUrl(user.imagePath!) : null,
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
    },
  },
};
