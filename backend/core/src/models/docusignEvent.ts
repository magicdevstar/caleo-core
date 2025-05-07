import DataLoader from "dataloader";
import { Db, ObjectId } from "mongodb";
import { BaseMongo } from "./base.v2";
import { DocType, DocusignEvent } from "../__generated__/resolvers-types";

export interface IDocusignEvent extends Omit<
  DocusignEvent,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'orgId' |
  'org' |
  'eventId' |
  'event' |
  'shift' |
  'shiftId' |
  'assignment' |
  'assignmentId' |
  'user' |
  'userId' |
  'supervisorId' |
  'lieutenantId' |
  'docType' |
  '__typename'
> {
  _id?: ObjectId;
  id?: string;
  userId: ObjectId;
  orgId: ObjectId;
  eventId: ObjectId;
  assignmentId?: ObjectId;
  shiftId?: ObjectId;
  lieutenantId?: ObjectId;
  supervisorId?: ObjectId;

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
}

export class DocusignEventModel extends BaseMongo<IDocusignEvent> {
  public loadByShiftId = new DataLoader(async (keys: readonly string[]) => {
    const ids = keys.map((key) => new ObjectId(key));
    const res = await this.collection.find<IDocusignEvent>({
      shiftId: { $in: ids },
      status: { $nin: ['voided', 'declined'] },
    }).toArray();
    return keys.map((key) => res.find((item) => item.shiftId?.toString() === key));
  });

  public loadByEventId = new DataLoader(async (keys: readonly string[]) => {
    const ids = keys.map((key) => new ObjectId(key));
    const res = await this.collection.find<IDocusignEvent>({
      eventId: { $in: ids },
      status: { $nin: ['voided', 'declined'] },
    }).toArray();
    return keys.map((key) => res.find((item) => item.eventId.toString() === key));
  });

  documentBasePath: string = 'docusign';
  constructor(db: Db) {
    super(db, DocType.DsEvents, 'dsEvents');
  }

  buildDocumentPath({
    envelopeId,
    orgId,
  }: {
    envelopeId: string;
    orgId: string;
  }) {
    return `${orgId}/${this.documentBasePath}/${envelopeId}.pdf`;
  }

  async findByUserId(userId: ObjectId) {
    const result = await this.collection.find<IDocusignEvent>({
      userId,
    }).sort({ _id: -1 }).limit(10).toArray();
    return result.map((item) => ({
      ...item,
      id: item._id!.toString(),
    }));
  }

  async findByShiftId(shiftId: ObjectId) {
    return this.collection.findOne<IDocusignEvent>({
      shiftId,
    });
  }

  async upsertEvent(item: Omit<IDocusignEvent, 'createdAt' | 'updatedAt'>) {
    return this.collection.updateOne(
      {
        envelopeId: item.envelopeId,
      },
      {
        $set: {
          ...item,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      }, {
        upsert: true,
        
      }
    );
  }
}