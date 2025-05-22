import { IEquipment } from "../../../models/equipment";
import { IMemberEquipment } from "../../../models/memberEquipment";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
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
};