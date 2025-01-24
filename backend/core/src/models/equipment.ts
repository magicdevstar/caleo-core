import { Db, ObjectId } from 'mongodb';
import { DocType, Equipment } from '../__generated__/resolvers-types';
import { BaseMongo, Validations } from './base.v2';
import { GraphQLError } from 'graphql';
import { equipmentErrors } from '../utils/errors';

export interface IEquipment extends Omit<
  Equipment,
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

export class EquipmentModel extends BaseMongo<IEquipment> {
  constructor(db: Db) {
    super(db, DocType.Equipment, 'equipments');
    this.validator = {
      create: async (doc) => {
        const found = await this.collection.findOne({
          name: doc.name,
          orgId: doc.orgId,
          removedAt: { $exists: false },
        });
  
        if (found) {
          throw new GraphQLError('Equipment name must be unique', {
            extensions: {
              code: equipmentErrors.NAME_MUST_BE_UNIQUE,
              argumentName: 'name',
            },
          });
        }
      }
    } as Validations<IEquipment>;
  }
};
