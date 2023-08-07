import { Db } from 'mongodb';
import { DocType, Skill } from '../__generated__/resolvers-types';
import { BaseModel, Validations } from './base';
import { GraphQLError } from 'graphql';
import { skillErrors } from '../utils/errors';

export class SkillModel extends BaseModel<Skill> {
  constructor(db: Db) {
    super(db, DocType.Skill);
    this.validator = {
      create: async (doc) => {
        const found = await this.findOne({ name: doc.name });
  
        if (found) {
          throw new GraphQLError('Skill name must be unique', {
            extensions: {
              code: skillErrors.NAME_MUST_BE_UNIQUE,
              argumentName: 'name',
            },
          });
        }
      }
    } as Validations<Skill>;
  }
};
