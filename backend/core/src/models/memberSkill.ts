import { Db } from 'mongodb';
import uniq from 'lodash.uniq';
import { DocType, MemberSkill, MemberStatus, SkillStatus, UpsertMemberSkill, User } from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import { UserModel } from './user';
import { GraphQLError } from 'graphql';
import logger from '../utils/logger';

interface InputDocModel extends UpsertMemberSkill {
  id?: string;
  orgId: string;
}

export class MemberSkillModel extends BaseModel<MemberSkill> {
  users: UserModel;

  constructor(db: Db) {
    super(db, DocType.MemberSkill);
    this.users = new UserModel(db);
  }

  async upsertDoc(item: InputDocModel): Promise<MemberSkill> {
    const user = await this.users.get(item.userId);
    if (!user) {
      throw new GraphQLError('User not found');
    }

    if (!item.id) {
      item.status = SkillStatus.Pending;
    }

    const res = await super.upsert(item) as MemberSkill;

    await this.users.update({
      ...user,
      member: {
        ...user.member,
        memberSkillIds: uniq([
          ...user.member?.memberSkillIds || [],
          res.id,
        ]),
      },
    } as any);

    return res;
  }

  async removeDoc(id: string): Promise<void> {
    const memberSkill = await this.get(id);
    if (!memberSkill) {
      throw new GraphQLError('MemberSkill not found');
    }

    const user = await this.users.get(memberSkill.userId);
    if (!user) {
      throw new GraphQLError('User not found');
    }

    logger.info('User Before', { user });
    await this.users.update({
      ...user,
      member: {
        ...user.member,
        memberSkillIds: (user.member?.memberSkillIds || [])
          .filter((id) => id !== memberSkill.id),
      },
    } as any,{
      skipMerge: true,
    });

    await super.remove(id);
  }
}