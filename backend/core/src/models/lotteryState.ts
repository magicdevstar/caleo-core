import { Db, ObjectId } from 'mongodb';
import { DocType } from '../__generated__/resolvers-types';
import { BaseModel } from './base';

export interface LotteryState {
  _id: ObjectId;
  orgId: string;
  assignedUsers: string[];
  lotteryCounter: number;
}

// TODO: Add pinpoint integration :)
export class LotteryStateModel extends BaseModel<LotteryState> {
  constructor(db: Db) {
    super(db, DocType.LotteryState, 'lotteryState');
  }

  async initialize(orgId: string, lotteryCounter: number) {
    const foundState = await this.collection.findOne({
      orgId,
      lotteryCounter,
    });

    if (foundState) {
      await this.collection.updateOne(
        { _id: foundState._id },
        {
          $set: {
            assignedUsers: [],
          },
        }
      );
      return;
    }

    const initDoc = {
      orgId,
      assignedUsers: [],
      lotteryCounter,
    };

    await this.collection.insertOne(initDoc);
  }

  async getState(orgId: string, lotteryCounter: number) {
    const res = await this.collection.findOne({
      orgId,
      lotteryCounter,
    });

    return res as LotteryState;
  }

  async saveState(state: LotteryState) {
    await this.collection.replaceOne({
      _id: state._id,
    }, state);
  }
};
