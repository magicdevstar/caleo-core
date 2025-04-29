import { Collection, Db, ObjectId } from 'mongodb';
import {
  CognitoIdentityProviderClient,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { randomUUID as uuid } from 'crypto';
import difference from 'lodash.difference';
import {
  DocType,
  EventStatus,
  InputAdminResetPassword,
  MemberRole,
  MemberStatus,
  MemberTier,
  Organization,
  ProfilePhotoAttachmentUpload,
  ShiftBufferRequestStatus,
  ShiftStatus,
  User,
} from '../__generated__/resolvers-types';
import { AssignmentModel } from './assignment';
import { IShift, IShiftWithAssignment, ShiftModel } from './shift';
import { GraphQLError } from 'graphql';
import logger from '../utils/logger';
import { EventModel } from './event';
import {
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { DocumentModel } from './document';
import { IShiftBufferRequest, ShiftBufferRequestModel } from './shiftBufferRequest';
import { LotteryCounterModel } from './lotteryCounter';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { dayMap } from '../utils/dayMap';
import { IShiftInterestRequest, ShiftInterestRequestModel } from './shiftInterestRequest';
import { IOrganization } from './organizations/organization.entity';
import { BaseMongo } from './base.v2';
import { IMemberSkill } from './memberSkill';
import { IUser } from '../types/common';
import { IMemberEquipment } from './memberEquipment';

const cognito = new CognitoIdentityProviderClient({});

export const defaultUserAvailability = {
  monday: {
    available: true,
    times: [],
  },
  tuesday: {
    available: true,
    times: [],
  },
  wednesday: {
    available: true,
    times: [],
  },
  thursday: {
    available: true,
    times: [],
  },
  friday: {
    available: true,
    times: [],
  },
  saturday: {
    available: true,
    times: [],
  },
  sunday: {
    available: true,
    times: [],
  },
};

export class UserModel extends BaseMongo<IUser> {
  documentBasePath: string = 'profilePhotos';
  memberSkillsCollection: Collection;
  memberEquipmentCollection: Collection;

  constructor(
    db: Db,
    private assignments: AssignmentModel,
    private shifts: ShiftModel,
    private events: EventModel,
    private shiftBufferRequests: ShiftBufferRequestModel,
    private document: DocumentModel,
    private lotteryCounter: LotteryCounterModel,
    private shiftInterestRequests: ShiftInterestRequestModel,
  ) {
    super(db, DocType.User, 'users');
    this.memberSkillsCollection = this.db.collection('memberSkills');
    this.memberEquipmentCollection = this.db.collection('memberEquipments');
  }

  findByCognitoId(cognitoId: string) {
    return this.collection.findOne<IUser>({
      cognitoId,
    });
  }

  async resetImpersonation(user: IUser) {
    try {
      const Value = user.lastName;
      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: process.env.COGNITO_POOL_ID,
        Username: user.cognitoId!,
        UserAttributes: [
          {
            Name: "family_name",
            Value: Value,
          },
        ],
      });
      await cognito.send(command);
      return true;
    } catch(error) {
      const message = 'Failed to reset impersonation user.';
      logger.error(message, { error, user });
      throw new GraphQLError(message);
    }
  }

  async impersonateUser(user: IUser, userId: string) {
    try {
      if (!user.superAdmin) throw new GraphQLError('You are not authorized to impersonate users.');
      const foundUser = this.collection.findOne({ _id: new ObjectId(userId) });
      if (!foundUser) {
        throw new GraphQLError('Invalid user ID.');
      }
  
      const Value = `t:${userId}`;
      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: process.env.COGNITO_POOL_ID,
        Username: user.cognitoId!,
        UserAttributes: [
          {
            Name: "family_name",
            Value: Value,
          },
        ],
      });
      await cognito.send(command);
      return true;
    } catch(error) {
      const message = 'Failed to impersonate user.';
      logger.error(message, { error, userId, user });
      throw new GraphQLError(message);
    }
  }

  async getAllAdmins({
    orgId,
  }: {
    orgId: ObjectId;
  }): Promise<IUser[]> {
    return this.collection.find<IUser>({
      'member.orgId': new ObjectId(orgId),
      'member.role': MemberRole.Admin,
      removedAt: { $exists: false },
    }).toArray();
  }

  async resetPassword({
    userId,
    password,
  }: InputAdminResetPassword) {
    try {
      const user = await this.get(userId);
      if (!user || !user.cognitoId) {
        throw new GraphQLError('User not found');
      }
      const { cognitoId } = user;

      const command = new AdminSetUserPasswordCommand({
        Username: cognitoId,
        UserPoolId: process.env.COGNITO_POOL_ID,
        Password: password,
        Permanent: true
      });
      await cognito.send(command);
      return true;
    } catch(error) {
      logger.error('Failed to reset password', { error });
      throw new GraphQLError('Failed to reset password');
    }
  }

  async availableShifts({
    user,
    organization,
    upcoming,
    eventTypes = [EventStatus.FirstComeFirstServe],
  }: {
    user: IUser;
    organization: IOrganization;
    upcoming?: boolean;
    eventTypes?: EventStatus[];
  }) {
    let query: any = {
      orgId: new ObjectId(organization.id),
      status: {
        $in: eventTypes,
      },
      endTime: {
        $gte: new Date(),
      },
      $or: [
        {
          status: EventStatus.FirstComeFirstServe,
          scheduledFirstComeFirstServe: null
        },
        {
          status: EventStatus.FirstComeFirstServe,
          scheduledFirstComeFirstServe: { $exists: false }
        },
        {
          status: EventStatus.FirstComeFirstServe,
          scheduledFirstComeFirstServe: { $lte: new Date() }
        },
        {
          status: EventStatus.InterestList,
          scheduledInterestList: { $lte: new Date() },
        },
      ],
    };
    if (eventTypes && eventTypes.length === 1 && eventTypes[0] === EventStatus.ReadyForLottery) {
      const lotteryCounterDoc = await this.lotteryCounter.get(organization._id!);
      query = {
        orgId: new ObjectId(organization.id),
        status: EventStatus.ReadyForLottery,
        lotteryNumber: lotteryCounterDoc.counter,
      };
    } else if (upcoming) {
      const lotteryCounterDoc = await this.lotteryCounter.get(organization._id!);
      let key = '$gte';
      if ((lotteryCounterDoc.start as any) < Date.now()) {
        key = '$gt';
      }
      query = {
        orgId: new ObjectId(organization.id),
        $or: [
          {
            status: EventStatus.FirstComeFirstServe,
            $or: [
              {
                scheduledFirstComeFirstServe: {
                  $gte: new Date(),
                },
              },
            ]
          },
          {
            status: EventStatus.InterestList,
            $or: [
              {
                scheduledInterestList: {
                  $gte: new Date(),
                },
              },
            ]
          },
          {
            status: EventStatus.ReadyForLottery,
            lotteryNumber: {
              [key]: lotteryCounterDoc.counter
            },
          },
        ],
      };
    }

    // Find all open events
    const events = await this.events.search(query);

    if (events.total === 0) {
      return {
        total: 0,
        items: [],
      };
    }

    const eventStatusMap = events.items.reduce((obj, event) => {
      const eventId = event.id!;
      return {
        ...obj,
        [eventId]: event.status,
      }
    }, {} as Record<string, EventStatus>);

    logger.info('Events', { events, query });

    // Find all open shifts joined with their assignments
    const pipeline = [
      {
        $match: {
          eventId: {
            $in: events.items.map(({ _id }) => _id),
          },
          status: {$in: [ShiftStatus.Available, ShiftStatus.Locked]},
        },
      },
      {
        $group: {
          _id: '$shiftId',
          shift: { $push: "$$ROOT" }
        }
      },
      {
        $addFields: {
          shift: {
            $first: "$shift"
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$shift",
        },
      },
      {
        $lookup: {
          from: "assignments",
          localField: "assignmentId",
          foreignField: "_id",
          as: "assignment",
        },
      },
      {
        $addFields: {
          assignment: {
            $first: "$assignment",
          },
        },
      },
    ];
    const shifts = await this.shifts.collection.aggregate<IShiftWithAssignment>(pipeline).toArray();
    if (shifts.length === 0) {
      return {
        total: 0,
        items: [],
      };
    }

    logger.info('Available Shifts', { shifts, pipeline });

    // Fetch member skills
    let skillIds: string[] = [];
    if ((user.member.memberSkillIds || []).length > 0) {
      const skillList = await this.memberSkillsCollection.find<IMemberSkill>({
        orgId: new ObjectId(organization.id),
        _id: {
          $in: user.member.memberSkillIds || [],
        },
        removedAt: { $exists: false },
      }).toArray();
      skillIds = skillList.map(({ skillId }) => skillId.toString());
    }

    // Fetch member equipment
    let equipmentIds: string[] = [];
    if ((user.member.memberEquipmentIds || []).length > 0) {
      const equipmentList = await this.memberEquipmentCollection.find<IMemberEquipment>({
        orgId: new ObjectId(organization.id),
        _id: {
          $in: user.member.memberEquipmentIds || [],
        },
        removedAt: { $exists: false },
      }).toArray();
      equipmentIds = equipmentList.map(({ equipmentId }) => equipmentId.toString());
    }

    logger.info('Skills Ids', { skillIds });

    // Filter shifts that the user does not have a proper rank and skill for
    const rankAndSkillFilteredShifts = shifts.filter((shift) => {
      const {
        requiredSkillIds: rawRequiredSkillIds,
        rankIds: rawRankIds,
        requiredEquipmentIds: rawRequiredEquipmentIds,
      } = shift.assignment;

      const requiredSkillIds = rawRequiredSkillIds?.map((id) => id!.toString());
      let hasQualifiedSkills = !Array.isArray(requiredSkillIds) || requiredSkillIds.length === 0;
      if (!hasQualifiedSkills) {
        hasQualifiedSkills = difference(requiredSkillIds || [], skillIds).length === 0;
      }

      const requiredEquipmentIds = rawRequiredEquipmentIds?.map((id) => id!.toString());
      let hasQualifiedEquipment = !Array.isArray(requiredEquipmentIds) || requiredEquipmentIds.length === 0;
      if (!hasQualifiedEquipment) {
        hasQualifiedEquipment = difference(requiredEquipmentIds || [], equipmentIds).length === 0;
      }

      const rankIds = rawRankIds?.map((id) => id!.toString());
      const hasQualifiedRank = (rankIds || []).includes(user.member.rankId!.toString());

      return hasQualifiedRank && hasQualifiedSkills && hasQualifiedEquipment;
    });

    if (rankAndSkillFilteredShifts.length === 0) {
      logger.info('No shifts found after rank and skill filtering');
      return {
        total: 0,
        items: [],
      };
    }

    // Filter out shifts that have already been assigned to this user
    const existingAssignedShifts = await this.shifts.collection.find({
      userId: user.id,
      status: ShiftStatus.Assigned,
      shiftId: {
        $in: rankAndSkillFilteredShifts.map(({ shiftId }) => shiftId),
      },
    }).project({ shiftId: 1 }).toArray();
    const existingShiftIds: string[] = existingAssignedShifts.map(({ shiftId }) => shiftId);

    const filteredShifts = rankAndSkillFilteredShifts.filter((shift) => !existingShiftIds.includes(shift.shiftId));

    // Find all pending shift buffers
    const myShiftBuffers = await this.shiftBufferRequests.collection.find<IShiftBufferRequest>({
      userId: user._id,
      status: ShiftBufferRequestStatus.Pending,
    }).toArray();

    const rejectedInterestRequests = await this.shiftInterestRequests.collection.find<IShiftInterestRequest>({
      userId: user._id,
      status: ShiftBufferRequestStatus.Rejected,
      shiftGroupId: {
        $in: filteredShifts.map(({ shiftId }) => shiftId),
      },
    }).project({ _id: 1, shiftGroupId: 1 }).toArray();
    
    const onlyAvailableShifts: IShift[] = [];
    const now = Date.now();
    for(const shift of filteredShifts) {
      // Only show locked shifts for interest list events
      if (shift.locked && eventStatusMap[shift.eventId.toString()] !== EventStatus.InterestList) {
        continue;
      }
      const foundRejectedInterest = await rejectedInterestRequests.find(({ shiftGroupId }) => shiftGroupId === shift.shiftId);
      const foundShiftBufferRequest = myShiftBuffers.find(({ shiftGroupId }) => shiftGroupId === shift.shiftId);
      if (foundShiftBufferRequest || foundRejectedInterest) {
        logger.info('Skipping shift due to shift buffer or rejected interest request', { shift, foundShiftBufferRequest, foundRejectedInterest });
        continue;
      }
      const hasMaxHours = await this.hasMaxHours({
        user,
        shift,
        organization,
      });
      const hasMaxShifts = await this.hasMaxShifts({
        user,
        shift,
        organization,
      });
      if (hasMaxShifts || hasMaxHours) {
        logger.info('Skipping shift due to max hours or shifts', { shift, hasMaxHours, hasMaxShifts });
        continue;
      }
      const res = await this.shifts.canSignUpForShift({
        shift,
        user,
        orgId: organization.id,
        shiftBufferTime: organization?.settings?.shiftBuffer.enabled ? organization?.settings?.shiftBuffer.minuteShiftBuffer : 0,
      });
      shift.shiftBufferShift = res.shiftBuffer;
      if ((res.canSignUpForShift || res.requiresShiftBuffer) && (shift.endTime as any) >= now) {
        onlyAvailableShifts.push(shift);
      } else {
        logger.info('Skipping shift due to canSignUpForShift', { shift, res });
      }
    }

    const sorted = onlyAvailableShifts.sort((a: any, b: any) => a.startTime - b.startTime);
    logger.info('Only available', { onlyAvailableShifts, sorted });

    return {
      total: sorted.length,
      items: sorted.map(({ _id, ...rest }: any) => ({
        id: _id.toString(),
        ...rest,
      })),
    }
  }

  async hasMaxHours({
    user,
    shift,
    organization,
  }: {
    user: User | IUser;
    shift: IShift;
    organization: Organization | IOrganization
  }) {
    if (!organization?.features?.monthlyMaxHours) {
      return false;
    }
    const orgTimezone = organization.timezone || 'America/Los_Angeles' as any;
    const shiftStartTime = utcToZonedTime(new Date(shift.startTime), orgTimezone);
    const startOfShiftMonth = startOfMonth(shiftStartTime);
    const endOfShiftMonth = endOfMonth(shiftStartTime);
    const allShifts: IShift[] = await this.shifts.collection.find({
      userId: user.id,
      orgId: organization.id,
      status: ShiftStatus.Assigned,
      startTime: {
        $gte: zonedTimeToUtc(startOfShiftMonth, orgTimezone).valueOf(),
        $lte: zonedTimeToUtc(endOfShiftMonth, orgTimezone).valueOf(),
      }
    }).toArray() as any;

    const totalMilliseconds = allShifts.reduce((total, {
      startTime,
      endTime,
      shiftCheckInOut,
      ...shift
    }) => {
      let milliseconds = endTime.getTime() - startTime.getTime();
      try {
        if (shiftCheckInOut?.checkInTime && shiftCheckInOut?.checkOutTime) {
          milliseconds = new Date(shiftCheckInOut.checkOutTime).getTime() - new Date(shiftCheckInOut.checkInTime).getTime();
        }
  
        return total + milliseconds;
      } catch(error) {
        logger.error('Error calculating total hours', { error, shiftCheckInOut, shift });
      }
      return total;
    }, 0);

    const totalHours = Math.floor(totalMilliseconds / 3600000);

    return totalHours >= (organization?.settings?.hoursPerMonth || 100);
  }

  async hasMaxShifts({
    user,
    shift,
    organization,
  }: {
    user: User | IUser;
    shift: IShift;
    organization: Organization | IOrganization
  }) {
    if (!organization.features.weeklyMaxShifts) {
      return false;
    }
    const weekStartsOn: any = dayMap[organization.weekBegins!] - 1;
    const orgTimezone = organization.timezone || 'America/Los_Angeles' as any;
    const shiftStartTime = utcToZonedTime(new Date(shift.startTime), orgTimezone);
    const startOfShiftWeek = startOfWeek(shiftStartTime, { weekStartsOn });
    const endOfShiftWeek = endOfWeek(shiftStartTime, { weekStartsOn });
    const numOfShifts = await this.shifts.collection.countDocuments({
      userId: user.id,
      orgId: organization.id,
      status: ShiftStatus.Assigned,
      startTime: {
        $gte: zonedTimeToUtc(startOfShiftWeek, orgTimezone).valueOf(),
        $lte: zonedTimeToUtc(endOfShiftWeek, orgTimezone).valueOf(),
      }
    });

    return (
      numOfShifts >= (user.member?.maxShifts || Number.POSITIVE_INFINITY) ||
      numOfShifts >= (organization.settings?.shiftsPerWeek || Number.POSITIVE_INFINITY)
    );
  }

  async findCompatibleUsersForShift({
    id,
    orgId,
    filters = {},
  }: {
    id: string;
    filters: {
      limit?: number;
      skip?: number;
      name?: string;
    };
    orgId: ObjectId;
  }) {

    const shift = await this.shifts.get(id);
    if (!shift) {
      throw new GraphQLError("Shift not found");
    }

    const assignment = await this.assignments.get(shift.assignmentId);
    if (!assignment) {
      throw new GraphQLError("Shift assignment not found");
    }

    const shifts = await this.shifts.collection.find({
      shiftId: shift.shiftId,
      removedAt: { $exists: false },
    }).toArray();
    const userIds = shifts.filter(({ userId }) => !!userId).map(shift => new ObjectId(shift.userId));

    const searchInput: any = {
      limit: 10,
      skip: 0,
      'member.orgId': orgId,
      ...filters,
    };

    if (assignment.requiredSkillIds && Array.isArray(assignment.requiredSkillIds) && assignment.requiredSkillIds.length > 0) {
      searchInput['member.memberSkillIds'] = {
        $all: assignment.requiredSkillIds,
      };
    }
    searchInput['member.rankId'] = {
      $in: assignment.rankIds,
    }

    if (userIds.length > 0) {
      searchInput._id = {
        $nin: userIds,
      }
    }

    logger.info('Search input', { searchInput });

    return this.search(searchInput);
  }

  async getUploadUrl({
    orgId,
  }: {
    orgId: string;
  }): Promise<ProfilePhotoAttachmentUpload> {
    const imagePath = `${orgId}/${this.documentBasePath}/${uuid()}`;
    const uploadUrl = await this.document.getUploadUrl(imagePath);
    return {
      imagePath,
      uploadUrl,
    };
  };

  async resetUserTier({
    userId,
    tier,
  }: {
    userId: string;
    tier: MemberTier;
  }) {
    try {
      await this.collection.updateOne({
        _id: new ObjectId(userId),
      }, {
        $set: {
          'member.tier': tier,
          'member.tierUntil': null,
        },
      });
    } catch(error) {
      logger.error('Failed to reset user tier', { error });
    }
  }

  async setStatus({
    userId,
    status,
  }: {
    userId: string;
    status: MemberStatus;
  }) {
    try {
      await this.collection.updateOne({
        _id: new ObjectId(userId),
      }, {
        $set: {
          'member.status': status,
        },
        $unset: {
          'member.inactivateUntil': 1,
          'member.inactivationNote': 1,
        }
      });
    } catch(error) {
      logger.error('Failed to reset user tier', { error });
    }
  }

  async setTiersPostLottery({
    tier1Assignments,
    orgId,
  }: {
    tier1Assignments: string[];
    orgId: string;
  }) {
    try {
      await this.collection.updateMany({
        'member.orgId': new ObjectId(orgId),
        'member.tier': MemberTier.Tier_2,
        'member.tierResetOnNextLottery': true,
      }, {
        $set: {
          'member.tier': MemberTier.Tier_1,
          'member.tierResetOnNextLottery': false,
        },
        $unset: {
          'member.tierUntil': 1,
        }
      });
      if (tier1Assignments.length > 0) {
        await this.collection.updateMany({
          'member.tier': MemberTier.Tier_1,
          'member.orgId': new ObjectId(orgId),
          _id: {
            $in: tier1Assignments.map((id) => new ObjectId(id)),
          },
          $or: [
            { 'member.tierUntil': null },
            { 'member.tierUntil': { $exists: false } },
            { 'member.tierUntil': { $lte: new Date() } },
          ]
        }, {
          $set: {
            'member.tier': MemberTier.Tier_2,
            'member.tierResetOnNextLottery': true,
          },
          $unset: {
            'member.tierUntil': 1,
          }
        });
      }
    } catch(error) {
      logger.error('Failed to set tiers post lottery', { error });
    }
  };

  async getDownloadUrl(attachmentPath: string) {
    return this.document.getDownloadUrl(attachmentPath);
  }

  convertToModel(doc?: User): IUser | undefined {
    if (!doc) {
      return;
    }
    return {
      ...doc,
      _id: new ObjectId((doc as any)._id),
      id: (doc as any)._id.toString(),
      ...(doc.modifiedById && { modifiedById: new ObjectId(doc.modifiedById) }),
      ...(doc.removedAt && { removedAt: new Date(doc.removedAt) }),
      ...(doc.createdAt && { removedAt: new Date(doc.createdAt) }),
      member: {
        ...(doc.member!),
        orgId: new ObjectId(doc.member!.orgId),
        ...(doc.member!.rankId && { rankId: new ObjectId(doc.member!.rankId) }),
        ...(doc.member!.startDate && { startDate: new Date(doc.member!.startDate) }),         
        ...(doc.member!.tierUntil && { tierUntil: new Date(doc.member!.tierUntil) }),
        ...(doc.member!.inactivateUntil && { inactivateUntil: new Date(doc.member!.inactivateUntil) }),
        memberSkillIds: (doc.member!.memberSkillIds || []).map((id) => new ObjectId(id!)),
      } as any,
    } as unknown as IUser;
  }
}