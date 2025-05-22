import { ObjectId, PullOperator } from "mongodb";
import { adminOnly, adminOrOwnerOnly } from "../../../utils/access";
import { Context } from "../../../utils/createContext";
import { GraphQLError } from "graphql";
import { EquipmentStatus, MemberEquipmentAttachmentUpload, UpsertEquipment, UpsertMemberEquipment } from "../../../__generated__/resolvers-types";
import { IEquipment } from "../../../models/equipment";
import { IMemberEquipment } from "../../../models/memberEquipment";

export const Mutation = {
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
      } as PullOperator<Document>,
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
};