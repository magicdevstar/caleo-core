import { ObjectId } from "mongodb";
import { GraphQLError } from "graphql";
import { adminOnly } from "../../../utils/access";
import { Context } from "../../../utils/createContext";
import { IDivision } from "../../../models/division";

export const Mutation = {
  removeDivision: async (
    _parent: unknown,
    { id }: { id: string },
    {
      unit,
      division,
      users,
      user,
    }: Context
  ): Promise<string> => {
    adminOnly(user);
    const existingUserWithRole = await users.collection.findOne({
      'member.divisionId': new ObjectId(id),
    });

    if (existingUserWithRole) {
      throw new GraphQLError("Cannot remove a division that is assigned to users");
    }

    await division.remove(id, {
      modifiedById: user!._id!,
    });

    const idAsObjectId = new ObjectId(id);
    await unit.collection.updateMany({
      divisionIds: idAsObjectId
    }, {
      $set: {
        modifiedById: user!._id!,
      },
      $pull: {
        divisionIds: idAsObjectId
      } as any,
    });

    return id;
  },
  division: async (
    _parent: unknown,
    { division: inputDivision }: { division: IDivision },
    { division, user }: Context
  ): Promise<IDivision> => {
    adminOnly(user);
    if (Object.keys(inputDivision).length === 0) {
      throw new GraphQLError("Division is empty");
    }
    return division.upsert({
      ...inputDivision,
      orgId: user.member.orgId,
      modifiedById: user!._id!,
    });
  },
};