import { GraphQLError } from "graphql";
import { Context } from "../../utils/createContext";
import { UnitSearchInput } from "../../__generated__/resolvers-types";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { ObjectId } from "mongodb";
import { IUnit } from "../../models/unit";

export const unit = {
  Query: {
    unit: async (
      _parent: unknown,
      { id }: { id: string },
      { unit }: Context,
    ): Promise<IUnit | null> => unit.get(id),
    units: async (
      _parent: unknown,
      { input }: { input: UnitSearchInput },
      { unit, user }: Context
    ): Promise<SearchResults<IUnit>> => unit.search({
      orgId: user?.member.orgId!,
      queryField: 'name',
      ...input,
    }),
  },
  Mutation: {
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
        orgId: user?.member.orgId!,
        modifiedById: user!._id!,
      });
    },
  },
  fields: {
    Unit: {
      ...commonResolvers,
      org: (unit: IUnit, _, { organizations }: Context) => organizations.loader.load(unit.orgId.toString()),
      divisions: (unit: IUnit, _, { division }: Context) => {
        if (!unit.divisionIds) {
          return [];
        }
        return division.loader.loadMany(unit.divisionIds.map((id) => id.toString()));
      }
    },
  },
};
