import { ObjectId } from "mongodb";
import { Member, User, UserSearchResult } from "../__generated__/resolvers-types";

export interface IShiftHoursPerMonthInput {
  id: string;
  orgId: string;
  beginningOfMonth: Date;
  endOfMonth: Date;
  ignoreShiftId?: string;
};

export interface EnhancedUser extends IUser {
  shiftStart?: string;
  timezoneOffset?: number;
  ignoreShiftId?: string;
}

export interface AuthorizerContext {
  user: IUser;
}

export interface IUserSearchResult extends Omit<
  UserSearchResult,
  'items' 
> {
  items: IUser[];
}

export interface IAssignmentShiftSlots {
  id: ObjectId;
  slotCount: number;
}

export interface IMember extends Omit<
  Member,
  'memberSkills' |
  'memberSkillIds' |
  'memberEquipmentIds' |
  'memberEquipment' |
  'orgId' |
  'org' |
  'rank' |
  'rankId' |
  'unit' |
  'unitId' |
  'division' |
  'divisionId' |
  'startDate' |
  'tierUntil' |
  'tenor' |
  '__typename'
> {
  memberSkillIds: ObjectId[];
  orgId: ObjectId;
  rankId: ObjectId;
  unitId?: ObjectId;
  divisionId?: ObjectId;
  memberEquipmentIds: ObjectId[];
  
  startDate?: Date;
  tierUntil?: Date;
  tenor?: Date;
}

export interface IUser extends Omit<
  User,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'modifiedById' |
  'modifiedBy' |
  'image' |
  'member' |
  'shiftsThisWeek' |
  '__typename'
> {
  _id?: ObjectId;
  id?: string;
  modifiedById: ObjectId;

  member: IMember;

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
}

export interface IUser extends Omit<
  User,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'modifiedById' |
  'modifiedBy' |
  'image' |
  'member' |
  'shiftsThisWeek' |
  '__typename'
> {
  _id?: ObjectId;
  id?: string;
  modifiedById: ObjectId;

  member: IMember;

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
}
