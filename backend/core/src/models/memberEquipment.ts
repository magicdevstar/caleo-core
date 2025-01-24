import { Db, ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import {
  DocType,
  EquipmentStatus,
  MemberEquipment,
  MemberEquipmentAttachmentUpload,
} from '../__generated__/resolvers-types';
import { UserModel } from './user';
import { GraphQLError } from 'graphql';
import { DocumentModel } from './document';
import { Action, MailerEvent, MailerEvents } from '../types/mailer';
import { BaseMongo } from './base.v2';
import { IOrganization } from './organization';
import { EquipmentModel } from './equipment';

const lambda = new LambdaClient({});

export interface IMemberEquipment extends Omit<
  MemberEquipment,
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
  'equipmentId' |
  'equipment' |
  '__typename'
> {
  _id?: ObjectId;
  id?: string;
  orgId: ObjectId;
  userId: ObjectId;
  equipmentId: ObjectId;
  modifiedById: ObjectId;

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
}

export class MemberEquipmentModel extends BaseMongo<IMemberEquipment> {
  documentBasePath: string = 'memberEquipments';
  constructor(db: Db, private users: UserModel, private document: DocumentModel, private equipments: EquipmentModel) {
    super(db, DocType.MemberSkill, 'memberEquipments');
  }

  async upsertDoc(item: IMemberEquipment, organization: IOrganization): Promise<IMemberEquipment> {
    const user = await this.users.get(item.userId);
    if (!user) {
      throw new GraphQLError('User not found');
    }

    const equipment = await this.equipments.get(item.equipmentId);
    if (!equipment) {
      throw new GraphQLError('Equipment not found');
    }

    if (!item.id && equipment.requiresAdminApproval) {
      item.status = EquipmentStatus.Pending;
    } else if (!item.id && !equipment.requiresAdminApproval) {
      item.status = EquipmentStatus.Approved;
    }

    const res = await super.upsert(item) as IMemberEquipment;

    if (res._id) {
      await this.users.collection.updateOne({
        _id: user._id,
      }, {
        $set: {
          modifiedById: new ObjectId(item.modifiedById),
        },
        $push: {
          'member.memberEquipmentIds': res._id,
        }
      });
    }

    if (
      item.status === EquipmentStatus.Approved ||
      item.status === EquipmentStatus.Denied
    ) {
      const template = item.status === EquipmentStatus.Approved ?
        MailerEvents.OfficerAdminApprovedEquipment :
        MailerEvents.OfficerAdminDeniedEquipment;
      await lambda.send(new InvokeCommand({
        FunctionName: process.env.MAILER_LAMBDA!,
        InvocationType: 'Event',
        Payload: JSON.stringify({
          action: Action.Email,
          template,
          data: {
            user,
            equipment,
            memberEquipment: res,
            organization,
          }
        } as MailerEvent),
      }));
    }

    return res;
  }

  async removeDoc(id: string, modifiedById: ObjectId): Promise<void> {
    const memberEquipment = await this.get(id);
    if (!memberEquipment) {
      throw new GraphQLError('MemberEquipment not found');
    }

    const user = await this.users.get(memberEquipment.userId);
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
        'member.memberEquipmentIds': memberEquipment._id,
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
  }): Promise<MemberEquipmentAttachmentUpload> {
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