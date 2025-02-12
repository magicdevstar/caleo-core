import { GraphQLError } from "graphql";
import { Context } from "../../utils/createContext";
import { DivisionSearchInput } from "../../__generated__/resolvers-types";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { ObjectId } from "mongodb";
import { IDivision } from "../../models/division";

export const division = {
  Query: {
    division: async (
      _parent: unknown,
      { id }: { id: string },
      { division }: Context,
    ): Promise<IDivision | null> => division.get(id),
    divisions: async (
      _parent: unknown,
      { input }: { input: DivisionSearchInput },
      { division, user }: Context
    ): Promise<SearchResults<IDivision>> => division.search({
      orgId: user?.member.orgId!,
      queryField: 'name',
      ...input,
    }),
  },
  Mutation: {
    removeDivision: async (
      _parent: unknown,
      { id }: { id: string },
      {
        division,
        users,
        user,
      }: Context
    ): Promise<string> => {
      const existingUserWithRole = await users.collection.findOne({
        'member.divisionId': new ObjectId(id),
      });

      if (existingUserWithRole) {
        throw new GraphQLError("Cannot remove a division that is assigned to users");
      }

      await division.remove(id, {
        modifiedById: user!._id!,
      });

      return id;
    },
    division: async (
      _parent: unknown,
      { division: inputDivision }: { division: IDivision },
      { division, user }: Context
    ): Promise<IDivision> => {
      if (Object.keys(inputDivision).length === 0) {
        throw new GraphQLError("Division is empty");
      }
      return division.upsert({
        ...inputDivision,
        orgId: user?.member.orgId!,
        modifiedById: user!._id!,
      });
    },
  },
  fields: {
    Division: {
      ...commonResolvers,
      org: (division: IDivision, _, { organizations }: Context) => organizations.loader.load(division.orgId.toString()),
    },
  },
};
