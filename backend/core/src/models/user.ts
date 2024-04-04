import { Collection, Db, ObjectId } from 'mongodb';
import {
  CognitoIdentityProviderClient,
  AdminSetUserPasswordCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { v4 as uuid } from 'uuid';
import {
  DocType,
  EventStatus,
  InputAdminResetPassword,
  MemberRole,
  MemberStatus,
  MemberTier,
  Organization,
  ProfilePhotoAttachmentUpload,
  Shift,
  ShiftBufferRequest,
  ShiftBufferRequestStatus,
  ShiftStatus,
  User
} from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import { AssignmentModel } from './assignment';
import { IShift, ShiftModel } from './shift';
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
import { ShiftBufferRequestModel } from './shiftBufferRequest';
import { LotteryCounterModel } from './lotteryCounter';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { dayMap } from '../utils/dayMap';
import { ShiftInterestRequestModel } from './shiftInterestRequest';

const cognito = new CognitoIdentityProviderClient({});

export class UserModel extends BaseModel<User> {
  documentBasePath: string = 'profilePhotos';
  memberSkillsCollection: Collection;

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
  }

  async getAllAdmins({
    orgId,
  }) {
    return this.collection.find({
      'member.orgId': orgId,
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
    user: User;
    organization: Organization;
    upcoming?: boolean;
    eventTypes?: EventStatus[];
  }) {
    let query: any = {
      orgId: organization.id,
      status: {
        $in: eventTypes,
      },
      endTime: {
        $gte: Date.now(),
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
          scheduledFirstComeFirstServe: { $lte: Date.now() }
        },
        {
          status: EventStatus.InterestList,
          scheduledInterestList: { $lte: Date.now() },
          scheduledCloseInterestList: { $gte: Date.now() }
        },
      ],
    };
    if (eventTypes && eventTypes.length === 1 && eventTypes[0] === EventStatus.ReadyForLottery) {
      const lotteryCounterDoc = await this.lotteryCounter.get(organization.id);
      query = {
        orgId: organization.id,
        status: EventStatus.ReadyForLottery,
        lotteryNumber: lotteryCounterDoc.counter,
      };
    } else if (upcoming) {
      const lotteryCounterDoc = await this.lotteryCounter.get(organization.id);
      let key = '$gte';
      if ((lotteryCounterDoc.start as any) < Date.now()) {
        key = '$gt';
      }
      query = {
        orgId: organization.id,
        $or: [
          {
            status: EventStatus.FirstComeFirstServe,
            $or: [
              {
                scheduledFirstComeFirstServe: {
                  $gte: Date.now(),
                },
              },
            ]
          },
          {
            status: EventStatus.InterestList,
            $or: [
              {
                scheduledInterestList: {
                  $gte: Date.now(),
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

    logger.info('Events', { events, query });

    // Find all open shifts joined with their assignments
    const pipeline = [
      {
        $match: {
          eventId: {
            $in: events.items.map(({ id }) => id),
          },
          status: ShiftStatus.Available,
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
        $addFields: {
          assignmentId: {
            $toObjectId: "$assignmentId",
          },
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
    const shifts = await this.shifts.aggregate<Shift>(pipeline);
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
      const skillList = await this.memberSkillsCollection.find({
        orgId: organization.id,
        _id: {
          $in: (user.member.memberSkillIds || []).map((id) => new ObjectId(id as string)),
        },
        removedAt: { $exists: false },
      }).toArray();
      skillIds = skillList.map(({ skillId }) => skillId);
    }

    logger.info('Skills Ids', { skillIds });

    // Filter shifts that the user does not have a proper rank and skill for
    const filteredShifts = shifts.filter((shift) => {
      const { requiredSkillIds, rankIds } = shift.assignment;
      const hasQualifiedRank = (rankIds || []).includes(user.member.rankId!);
      let hasQualifiedSkills = !Array.isArray(requiredSkillIds) || requiredSkillIds.length === 0;
      if (!hasQualifiedSkills) {
        hasQualifiedSkills = (requiredSkillIds || [])?.reduce((hasAllSkills, skillId) => {
          if (!(skillIds.includes(skillId as string))) {
            return false;
          }
          return hasAllSkills;
        }, true);
      }
      return hasQualifiedRank && hasQualifiedSkills;
    });

    if (filteredShifts.length === 0) {
      return {
        total: 0,
        items: [],
      };
    }

    logger.info('Filtered Skills', { filteredShifts });

    const myShiftBuffers = await this.shiftBufferRequests.collection.find<ShiftBufferRequest>({
      userId: user.id,
      status: ShiftBufferRequestStatus.Pending,
    }).toArray();

    const rejectedInterestRequests = await this.shiftInterestRequests.collection.find({
      userId: new ObjectId(user.id),
      status: ShiftBufferRequestStatus.Rejected,
      shiftGroupId: {
        $in: filteredShifts.map(({ shiftId }) => shiftId),
      },
    }).project({ _id: 1, shiftGroupId: 1 }).toArray();
    
    const onlyAvailableShifts: Shift[] = [];
    const now = Date.now();
    for(const shift of filteredShifts) {
      const foundRejectedInterest = await rejectedInterestRequests.find(({ shiftGroupId }) => shiftGroupId === shift.shiftId);
      const foundShiftBufferRequest = myShiftBuffers.find(({ shiftGroupId }) => shiftGroupId === shift.shiftId);
      if (foundShiftBufferRequest || foundRejectedInterest) {
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
      }
    }

    const sorted = onlyAvailableShifts.sort((a: any, b: any) => a.startTime - b.startTime);
    logger.info('Only available', { onlyAvailableShifts, sorted });

    return {
      total: sorted.length,
      items: sorted.map(({ _id, assignmentId, ...rest }: any) => ({
        id: _id.toString(),
        assignmentId: assignmentId.toString(),
        ...rest,
      })),
    }
  }

  async hasMaxHours({
    user,
    shift,
    organization,
  }: {
    user: User;
    shift: Shift;
    organization: Organization
  }) {
    if (!organization?.settings?.hoursPerMonth) {
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
      shiftCheckInOut
    }) => {
      let milliseconds = endTime - startTime;
      if (shiftCheckInOut?.checkInTime && shiftCheckInOut?.checkOutTime) {
        milliseconds = shiftCheckInOut.checkOutTime.getTime() - shiftCheckInOut.checkInTime.getTime();
      }

      return total + milliseconds;
    }, 0);

    const totalHours = Math.floor(totalMilliseconds / 3600000);

    return totalHours >= (organization?.settings?.hoursPerMonth || 100);
  }

  async hasMaxShifts({
    user,
    shift,
    organization,
  }: {
    user: User;
    shift: Shift;
    organization: Organization
  }) {
    const weekStartsOn: any = dayMap[organization.weekBegins] - 1;
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
    orgId: string;
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
          'member.inactivateUntil': null,
          'member.inactivationNote': null,
        },
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
      const setTier1Res = await this.collection.updateMany({
        'member.orgId': orgId,
        'member.tier': MemberTier.Tier_2,
        'member.tierResetOnNextLottery': true,
      }, {
        $set: {
          'member.tier': MemberTier.Tier_1,
          'member.tierUntil': null,
          'member.tierResetOnNextLottery': false,
        },
      });
      logger.info('Set tier 1 res', { setTier1Res });
      if (tier1Assignments.length > 0) {
        const setTier2Res = await this.collection.updateMany({
          'member.tier': MemberTier.Tier_1,
          'member.orgId': orgId,
          _id: {
            $in: tier1Assignments.map((id) => new ObjectId(id)),
          },
          $or: [
            { 'member.tierUntil': null },
            { 'member.tierUntil': { $lte: Date.now() } },
          ]
        }, {
          $set: {
            'member.tier': MemberTier.Tier_2,
            'member.tierUntil': null,
            'member.tierResetOnNextLottery': true,
          },
        });
        logger.info('Set tier 2 res', { setTier2Res });
      }
    } catch(error) {
      logger.error('Failed to set tiers post lottery', { error });
    }
  };

  async getDownloadUrl(attachmentPath: string) {
    return this.document.getDownloadUrl(attachmentPath);
  }
}