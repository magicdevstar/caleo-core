import { ObjectId } from "mongodb";
import { MemberEquipmentSearchInput, SkillSearchInput } from "../../../__generated__/resolvers-types";
import { IEquipment } from "../../../models/equipment";
import { IMemberEquipment } from "../../../models/memberEquipment";
import { SearchResults } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const Query = {
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
};
