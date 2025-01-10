import { Db, ObjectId } from 'mongodb';
import { DocType, Skill } from '../__generated__/resolvers-types';
import { BaseMongo, Validations } from './base.v2';
import { GraphQLError } from 'graphql';
import { skillErrors } from '../utils/errors';

export interface ISkill extends Omit<
  Skill,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'modifiedById' |
  'modifiedBy' |
  'orgId' |
  'org' |
  '__typename' |
  'rankOnlyIds' |
  'ranksOnly'
> {
  _id?: ObjectId;
  id?: string;
  orgId: ObjectId;
  rankOnlyIds: ObjectId[];
  modifiedById: ObjectId;

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
}

export class SkillModel extends BaseMongo<ISkill> {
  constructor(db: Db) {
    super(db, DocType.Skill, 'skills');
    this.validator = {
      create: async (doc) => {
        const found = await this.collection.findOne({
          name: doc.name,
          orgId: doc.orgId,
          removedAt: { $exists: false },
        });
  
        if (found) {
          throw new GraphQLError('Skill name must be unique', {
            extensions: {
              code: skillErrors.NAME_MUST_BE_UNIQUE,
              argumentName: 'name',
            },
          });
        }
      }
    } as Validations<ISkill>;
  }
};
