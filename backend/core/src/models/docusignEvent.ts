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
  public loadByEnvelopeId = new DataLoader(async (keys: readonly string[]) => {
    const res = await this.collection.find<IDocusignEvent>({
      envelopeId: { $in: keys },
    }).toArray();
    return keys.map((key) => res.find((item) => item.envelopeId === key));
  });

  public loadByShiftId = new DataLoader(async (keys: readonly string[]) => {
    const ids = keys.map((key) => new ObjectId(key));
    const res = await this.collection.find<IDocusignEvent>({
      shiftId: { $in: ids },
      status: { $nin: ['voided', 'declined'] },
    }, {
      sort: { _id: -1 },
    }).toArray();
    return keys.map((key) => res.find((item) => item.shiftId?.toString() === key));
  });

  public loadAllByShiftId = new DataLoader(async (keys: readonly string[]) => {
    const ids = keys.map((key) => new ObjectId(key));
    const res = await this.collection.find<IDocusignEvent>({
      shiftId: { $in: ids },
    }).toArray();
    const shiftsMap = res.reduce((acc, item) => {
      if (!item.shiftId) return acc;
      const shiftId = item.shiftId.toString();
      if (!acc[shiftId]) {
        acc[shiftId] = [];
      }
      acc[shiftId].push(item);
      return acc;
    }, {} as Record<string, IDocusignEvent[]>);
    return keys.map((key) => shiftsMap[key] || []);
  });

  public loadByEventId = new DataLoader(async (keys: readonly string[]) => {
    const ids = keys.map((key) => new ObjectId(key));
    const res = await this.collection.find<IDocusignEvent>({
      eventId: { $in: ids },
      status: { $nin: ['voided', 'declined'] },
    }).toArray();
    return keys.map((key) => res.find((item) => item.eventId.toString() === key));
  });

  public loadByUserAndEventId = new DataLoader(async (keys: readonly { userId: ObjectId, eventId: ObjectId }[]) => {
    const userIds = keys.map((key) => key.userId);
    const eventIds = keys.map((key) => key.eventId);
    const res = await this.collection.find<IDocusignEvent>({
      userId: { $in: userIds },
      eventId: { $in: eventIds },
      status: { $nin: ['voided', 'declined'] },
    }).toArray();
    return keys.map((key) => res.find((item) => item.userId.toString() === key.userId.toString() && item.eventId.toString() === key.eventId.toString()));
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
    }, {
      sort: { _id: -1 },
    });
  }

  async markCompletedEventAsVoid(_id: ObjectId) {
    return this.collection.updateOne(
      {
        _id,
      },
      {
        $set: {
          status: 'voided',
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      }
    );
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