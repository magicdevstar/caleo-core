import { ObjectId } from "mongodb";
import { Context } from "../../../utils/createContext";
import { GraphQLError } from "graphql/error";
import { IUnit } from "../../../models/unit";

export const Mutation = {
  removeUnit: async (
    _parent: unknown,
    { id }: { id: string },
    {
      unit,
      users,
      user,
    }: Context
  ): Promise<string> => {
    const existingUserWithRole = await users.collection.findOne({
      'member.unitId': new ObjectId(id),
    });

    if (existingUserWithRole) {
      throw new GraphQLError("Cannot remove a unit that is assigned to users");
    }

    await unit.remove(id, {
      modifiedById: user!._id!,
    });

    return id;
  },
  unit: async (
    _parent: unknown,
    { unit: inputUnit }: { unit: IUnit },
    { unit, user }: Context
  ): Promise<IUnit> => {
    if (Object.keys(inputUnit).length === 0) {
      throw new GraphQLError("Unit is empty");
    }
    return unit.upsert({
      ...inputUnit,
      ...(inputUnit.divisionIds && {
        divisionIds: inputUnit.divisionIds.map((id) => new ObjectId(id!)),
      }),
      orgId: user.member.orgId,
      modifiedById: user!._id!,
    });
  },
};
