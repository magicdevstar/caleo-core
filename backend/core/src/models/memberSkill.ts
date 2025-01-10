import { Db, ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import uniq from 'lodash.uniq';
import {
  DocType,
  MemberSkill,
  MemberSkillAttachmentUpload,
  Organization,
  SkillStatus,
} from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import { UserModel } from './user';
import { GraphQLError } from 'graphql';
import logger from '../utils/logger';
import { DocumentModel } from './document';
import { SkillModel } from './skill';
import { Action, MailerEvent, MailerEvents } from '../types/mailer';
import { BaseMongo } from './base.v2';
import { IUser } from '../types/common';
import { IOrganization } from './organization';

const lambda = new LambdaClient({});

export interface IMemberSkill extends Omit<
  MemberSkill,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'modifiedById' |
  'modifiedBy' |
  'orgId' |
  'org' |
  'userId' |
  'user' |
  'skillId' |
  'skill' |
  '__typename'
> {
  _id?: ObjectId;
  id?: string;
  orgId: ObjectId;
  userId: ObjectId;
  skillId: ObjectId;
  modifiedById: ObjectId;

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
}

export class MemberSkillModel extends BaseMongo<IMemberSkill> {
  documentBasePath: string = 'memberSkills';
  constructor(db: Db, private users: UserModel, private document: DocumentModel, private skills: SkillModel) {
    super(db, DocType.MemberSkill, 'memberSkills');
  }

  async upsertDoc(item: IMemberSkill, organization: IOrganization): Promise<IMemberSkill> {
    const user = await this.users.get(item.userId.toString());
    if (!user) {
      throw new GraphQLError('User not found');
    }

    const skill = await this.skills.get(item.skillId.toString());
    if (!skill) {
      throw new GraphQLError('Skill not found');
    }

    if (!item.id && skill.requiresAdminApproval) {
      item.status = SkillStatus.Pending;
    } else if (!item.id && !skill.requiresAdminApproval) {
      item.status = SkillStatus.Approved;
    }

    const res = await super.upsert(item) as IMemberSkill;

    await this.users.collection.updateOne({
      _id: user._id,
    }, {
      $set: {
        modifiedById: new ObjectId(item.modifiedById),
      },
      $push: {
        'member.memberSkillIds': res._id,
      }
    });

    if (
      item.status === SkillStatus.Approved ||
      item.status === SkillStatus.Denied
    ) {
      const template = item.status === SkillStatus.Approved ?
        MailerEvents.OfficerAdminApprovedSkill :
        MailerEvents.OfficerAdminDeniedSkill;
      await lambda.send(new InvokeCommand({
        FunctionName: process.env.MAILER_LAMBDA!,
        InvocationType: 'Event',
        Payload: JSON.stringify({
          action: Action.Email,
          template,
          data: {
            user,
            skill: res,
            organization,
          }
        } as MailerEvent),
      }));
    }

    return res;
  }

  async removeDoc(id: string, modifiedById: ObjectId): Promise<void> {
    const memberSkill = await this.get(id);
    if (!memberSkill) {
      throw new GraphQLError('MemberSkill not found');
    }

    const user = await this.users.get(memberSkill.userId.toString());
    if (!user) {
      throw new GraphQLError('User not found');
    }

    await this.users.collection.updateOne({
      _id: user._id,
    }, {
      $set: {
        modifiedById,
      },
      $pull: {
        'member.memberSkillIds': memberSkill._id,
      }
    });

    await super.remove(id, {
      modifiedById,
    });
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