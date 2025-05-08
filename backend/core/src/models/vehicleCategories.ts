import { Db, ObjectId } from 'mongodb';
import { DocType, VehicleCategories } from '../__generated__/resolvers-types';
import { Validations } from './base';
import { GraphQLError } from 'graphql';
import { vehicleCategories } from '../utils/errors';
import { BaseMongo } from './base.v2';

export interface IVehicleCategory extends Omit<
  VehicleCategories,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'modifiedById' |
  'modifiedBy' |
  'orgId' |
  'org' |
  '__typename'
> {
  _id?: ObjectId;
  id?: string;
  orgId: ObjectId;
  modifiedById: ObjectId;

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
}

export class VehicleCategoriesModel extends BaseMongo<IVehicleCategory> {
  constructor(db: Db) {
    super(db, DocType.VehicleCategories, 'vehicleCategories');
    this.validator = {
      create: async (doc) => {
        const found = await this.collection.findOne({
          name: doc.name,
          orgId: doc.orgId,
          removedAt: { $exists: false },
        });
  
        if (found) {
          throw new GraphQLError('Vehicle Category names must be unique', {
            extensions: {
              code: vehicleCategories.NAME_MUST_BE_UNIQUE,
              argumentName: 'name',
            },
          });
        }
      }
    } as Validations<IVehicleCategory>;
  }
};
