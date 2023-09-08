import { Db } from 'mongodb';
import { v4 as uuid } from 'uuid';
import uniq from 'lodash.uniq';
import {
  DocType,
  MemberSkill,
  MemberSkillAttachmentUpload,
  SkillStatus,
  UpsertMemberSkill,
} from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import { UserModel } from './user';
import { GraphQLError } from 'graphql';
import logger from '../utils/logger';
import { DocumentModel } from './document';
import { SkillModel } from './skill';

interface InputDocModel extends UpsertMemberSkill {
  id?: string;
  orgId: string;
}

export class MemberSkillModel extends BaseModel<MemberSkill> {
  documentBasePath: string = 'memberSkills';
  constructor(db: Db, private users: UserModel, private document: DocumentModel, private skills: SkillModel) {
    super(db, DocType.MemberSkill);
  }

  async upsertDoc(item: InputDocModel): Promise<MemberSkill> {
    const user = await this.users.get(item.userId);
    if (!user) {
      throw new GraphQLError('User not found');
    }

    const skill = await this.skills.get(item.skillId);
    if (!skill) {
      throw new GraphQLError('Skill not found');
    }

    if (!item.id && skill.requiresAdminApproval) {
      item.status = SkillStatus.Pending;
    } else if (!item.id && !skill.requiresAdminApproval) {
      item.status = SkillStatus.Approved;
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

  async getUploadUrl({
    orgId,
  }: {
    orgId: string;
  }): Promise<MemberSkillAttachmentUpload> {
    const imagePath = `${orgId}/${this.documentBasePath}/${uuid()}`;
    const uploadUrl = await this.document.getUploadUrl(imagePath);
    return {
      imagePath,
      uploadUrl,
    };
  };

  async getDownloadUrl(attachmentPath: string) {
    return this.document.getDownloadUrl(attachmentPath);
  }
}