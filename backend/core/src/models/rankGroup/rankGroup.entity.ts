import { ObjectId } from "mongodb";
import { RankGroup } from "../../__generated__/resolvers-types";

export interface IRankGroup extends Omit<
  RankGroup,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'modifiedById' |
  'modifiedBy' |
  'rankIds' |
  'ranks' |
  'orgId' |
  'org' |
  '__typename'
> {
  _id?: ObjectId;
  id: string;
  orgId: ObjectId;
  modifiedById: ObjectId;
  
  rankIds: ObjectId[];

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
};
