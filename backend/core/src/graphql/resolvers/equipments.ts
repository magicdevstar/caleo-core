import { GraphQLError } from "graphql";
import { Context } from "../../utils/createContext";
import {
  SkillSearchInput,
  MemberEquipmentSearchInput,
  UpsertEquipment,
  UpsertMemberEquipment,
  EquipmentStatus,
  MemberEquipmentAttachmentUpload,
} from "../../__generated__/resolvers-types";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { adminOnly, adminOrOwnerOnly } from "../../utils/access";
import { ObjectId } from "mongodb";
import { IEquipment } from "../../models/equipment";
import { IMemberEquipment } from "../../models/memberEquipment";

export const equipment = {
  Query: {
    equipment: async (
      _parent: unknown,
      { id }: { id: string },
      { equipments }: Context,
    ): Promise<IEquipment | null> => equipments.get(id),
    equipments: async (
      _parent: unknown,
      { input: { rankOnlyIds, ...input } }: { input: SkillSearchInput },
      { equipments, user }: Context
    ): Promise<SearchResults<IEquipment>> => equipments.search({
      orgId: user.member.orgId!,
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
    memberEquipments: async (
      _parent: unknown,
      { input }: { input: MemberEquipmentSearchInput },
      { memberEquipments, user }: Context
    ): Promise<SearchResults<IMemberEquipment>> => memberEquipments.search({
      orgId: user.member.orgId!,
      ...input,
    })
  },
  Mutation: {
    removeEquipment: async (
      _parent: unknown,
      { id }: { id: string },
      { assignments, equipments, user }: Context
    ): Promise<string> => {
      adminOnly(user);

      const userId = user!._id!;
      await equipments.remove(id, {
        modifiedById: userId,
      });

      const requiredEquipmentId = new ObjectId(id);
      await assignments.collection.updateMany({
        requiredSkillIds: requiredEquipmentId,
      }, {
        $set: {
          modifiedById: userId,
        },
        $pull: {
          requiredSkillIds: requiredEquipmentId,
        },
      } as any);

      return id;
    },
    removeUserEquipment: async (
      _parent: unknown,
      { id }: { id: string },
      { memberEquipments, users, user }: Context
    ): Promise<string> => {
      const memberEquipment = await memberEquipments.get(id);
      if (!memberEquipment) {
        throw new GraphQLError('Could not find member skill');
      }
      adminOrOwnerOnly(memberEquipment.userId.toString(), user);
      await memberEquipments.removeDoc(id, user!._id!);
      await users.collection.updateOne({
        _id: memberEquipment.userId,
      }, {
        $pull: {
          memberSkillIds: new ObjectId(id),
        },
      });

      return id;
    },
    equipment: async (
      _parent: unknown,
      { equipment }: { equipment: UpsertEquipment },
      { equipments, user }: Context
    ): Promise<IEquipment> => {
      adminOnly(user);
      if (Object.keys(equipment).length === 0) {
        throw new GraphQLError("Equipment is empty");
      }
      return equipments.upsert({
        ...equipment,
        ...(equipment.rankOnlyIds && {
          rankOnlyIds: equipment.rankOnlyIds.map((id) => new ObjectId(id!)),
        }),
        orgId: user.member.orgId!,
        modifiedById: user._id!,
      } as any);
    },
    userEquipment: async (
      _parent: unknown,
      { userEquipment }: { userEquipment: UpsertMemberEquipment },
      { memberEquipments, user, organization }: Context
    ): Promise<IMemberEquipment> => {
      adminOrOwnerOnly(userEquipment.userId, user);

      if (
        userEquipment.id && userEquipment.status !== EquipmentStatus.Pending
      ) {
        adminOnly(user);
      }
      
      return memberEquipments.upsertDoc({
        ...userEquipment,
        ...(userEquipment.equipmentId && { equipmentId: new ObjectId(userEquipment.equipmentId) }),
        ...(userEquipment.userId && { userId: new ObjectId(userEquipment.userId) }),
        orgId: user.member.orgId!,
        modifiedById: user._id!,
      } as any, organization!);
    },
    userEquipmentAttachmentUploadUrl: async (
      _parent: unknown,
      _args: unknown,
      { memberEquipments, user }: Context
    ): Promise<MemberEquipmentAttachmentUpload> => {
      return memberEquipments.getUploadUrl({
        orgId: user.member.orgId.toString()!,
      });
    }
  },
  fields: {
    Equipment: {
      ...commonResolvers,
      org: (equipment: IEquipment, _, { organizations }: Context) => organizations.loader.load(equipment.orgId.toString()),
      ranksOnly: (equipment: IEquipment, _, { ranks }: Context) => equipment.rankOnlyIds && equipment.rankOnlyIds.length > 0 ? ranks.loader.loadMany((equipment.rankOnlyIds || []).map((id) => id.toString())) : [],
      requiresEquipmentTime: (equipment: IEquipment) => !!equipment.requiresEquipmentTime,
      requiresVehicleInformation: (equipment: IEquipment) => !!equipment.requiresVehicleInformation,
    },
    MemberEquipment: {
      ...commonResolvers,
      equipment: (memberEquipment: IMemberEquipment, _, { equipments }: Context) => equipments.loader.load(memberEquipment.equipmentId.toString()),
      user: (memberEquipment: IMemberEquipment, _, { users }: Context) => users.loader.load(memberEquipment.userId.toString()),
      image: (memberEquipment: IMemberEquipment, _, { memberEquipments }: Context) => memberEquipment.imagePath ? memberEquipments.getDownloadUrl(memberEquipment.imagePath!) : null,
    },
  },
};
