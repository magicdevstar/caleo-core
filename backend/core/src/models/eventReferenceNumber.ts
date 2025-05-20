import { Collection } from "mongodb";

export interface IEventReferenceNumber {
  _id: string;
  orgId: string;
  type: 'eventReferenceNumber';
  referenceNumber: number;
}

export class EventReferenceNumber {
  collection: Collection;

  constructor(db) {
    this.collection = db.collection('eventReferenceNumber');
  }

  async get(orgId: string): Promise<number> {
    const res = await this.collection.findOneAndUpdate({
      orgId,
    }, {
      $inc: { referenceNumber: 1 },
    }, {
      upsert: true,
      returnDocument: 'after',
    });

    return (res?.value as any)?.referenceNumber;
  }
}