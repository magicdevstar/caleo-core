import { Db, ObjectId } from "mongodb";
import { BaseMongo } from "../base.v2";
import { IRankGroup } from "./rankGroup.entity";
import { DocType, UpsertRankGroup } from "../../__generated__/resolvers-types";
import { IUser } from "../../types/common";

export class RankGroupRepo extends BaseMongo<IRankGroup> {
  constructor(db: Db) {
    super(db, DocType.RankGroup, 'rankGroups');
  }

  async addRanks(id: string, rankIds: string[], user: IUser) {
    await this.collection.updateOne({
      _id: new ObjectId(id),
    }, {
      $addToSet: {
        rankIds: { $each: rankIds.map((rankId) => new ObjectId(rankId)) },
      },
      $set: {
        modifiedAt: new Date(),
        modifiedById: new ObjectId(user._id),
      },
    });
  }

  async removeRanks(id: string, rankIds: string[], user: IUser) {
    await this.collection.updateOne({
      _id: new ObjectId(id),
    }, {
      $pull: {
        rankIds: { $in: rankIds.map((rankId) => new ObjectId(rankId)) },
      },
      $set: {
        modifiedAt: new Date(),
        modifiedById: new ObjectId(user._id),
      },
    });

    const rankGroup = await this.collection.findOne({
      _id: new ObjectId(id),
    });
    if (rankGroup && rankGroup.rankIds.length === 0) {
      await this.collection.deleteOne({
        _id: new ObjectId(id),
      });
    }
  }

  convertToEntity(doc: UpsertRankGroup, user: IUser) {
    return {
      ...doc,
      rankIds: doc.rankIds?.map((id) => new ObjectId(id)) || [],
      orgId: new ObjectId(user.member.orgId),
      modifiedById: new ObjectId(user._id),
    } as IRankGroup;
  }
}
