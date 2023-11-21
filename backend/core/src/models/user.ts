import { Collection, Db, ObjectId } from 'mongodb';
import {
  CognitoIdentityProviderClient,
  AdminSetUserPasswordCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { v4 as uuid } from 'uuid';
import {
  DayAvailability,
  DocType,
  EventStatus,
  InputAdminResetPassword,
  MemberRole,
  MemberTier,
  Organization,
  ProfilePhotoAttachmentUpload,
  Shift,
  ShiftBufferRequestStatus,
  User
} from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import { AssignmentModel } from './assignment';
import { ShiftModel } from './shift';
import { GraphQLError } from 'graphql';
import logger from '../utils/logger';
import { EventModel } from './event';
import {
  getHours,
  getMinutes,
  setHours,
  setMilliseconds,
  setMinutes,
  setSeconds,
} from 'date-fns';
import { DocumentModel } from './document';
import { ShiftBufferRequestModel } from './shiftBufferRequest';
import { LotteryCounterModel } from './lotteryCounter';

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
      if (!user) {
        throw new GraphQLError('User not found');
      }
      const { cognitoId } = user;

      const command = new AdminSetUserPasswordCommand({
        Username: cognitoId,
        UserPoolId: process.env.COGNITO_POOL_ID,
        Password: password,
        Permanent: false
      });
      await cognito.send(command);
      return true;
    } catch(error) {
      logger.error('Failed to reset password', { error });
      throw new GraphQLError('Failed to reset password');
    }
  }

  async findOpenShifts({
    user,
    // Specific shift to filter for
    shiftId,
    // Specific group to filter for
    shiftGroupId,
    limit,
    skip,
    orgId,
    organization,
    defaultEventIds,
    eventType = EventStatus.FirstComeFirstServe,
  }: {
    user: User;
    organization: Organization;
    shiftId?: string;
    shiftGroupId?: string;
    limit: number;
    skip: number;
    orgId: string;
    eventType?: EventStatus;
    defaultEventIds?: string[];
  }) {
    let skillIds: string[] = [];
    if ((user.member.memberSkillIds || []).length > 0) {
      const skillList = await this.memberSkillsCollection.find({
        orgId,
        _id: {
          $in: (user.member.memberSkillIds || []).map((id) => new ObjectId(id as string)),
        },
        removedAt: { $exists: false },
      }).toArray();
      skillIds = skillList.map(({ skillId }) => skillId);
    }

    let eventQuery: any = {
      orgId,
      $or: [
        {
          $and: [
            { status: EventStatus.FirstComeFirstServe },
            { scheduledFirstComeFirstServe: { $exists: false }},
          ],
        },
        {
          $and: [
            { status: EventStatus.FirstComeFirstServe },
            { scheduledFirstComeFirstServe: { $lte: Date.now() }},
          ],
        }
      ]
    };
    if (eventType === EventStatus.ReadyForLottery) {
      const lotteryCounterDoc = await this.lotteryCounter.get(orgId);
      eventQuery = {
        orgId,
        status: EventStatus.ReadyForLottery,
        lotteryNumber: lotteryCounterDoc.counter,
      };
    }


    // Find first come first serve events
    const {
      items: eventList,
    } = await this.events.search(eventQuery);
    const eventIds = defaultEventIds || eventList.map(({ id }) => id);

    // Find assignments that are attached to those events
    const assignmentSearch = {
      eventId: {
        $in: eventIds,
      },
      rankIds: {
        $in: [user.member.rankId],
      },
    };
    const {items: assignmentList} = await this.assignments.search(assignmentSearch);

    // Filter assignments that are not compatible with the user
    const assignmentIds = assignmentList.filter(({ requiredSkillIds }) => {
      if (!Array.isArray(requiredSkillIds) || requiredSkillIds.length === 0) {
        return true;
      }
      const hasRequiredSkills = (requiredSkillIds || [])?.reduce((hasAllSkills, skillId) => {
        if (!(skillIds.includes(skillId as string))) {
          return false;
        }
        return hasAllSkills;
      }, true);
      return hasRequiredSkills;
    }).map(({ id }) => id);

    // Filter shifts already assigned to me
    const maxEndTime = Date.now();
    const myShifts = (await this.shifts.collection.find({
      orgId: organization.id,
      userId: user.id,
      endTime: {
        $gte: maxEndTime,
      },
      removedAt: { $exists: false },
    }).toArray() as any[]) as Shift[];
    const shiftRanges = myShifts.map(({ startTime, endTime }) => ({
      startTime,
      endTime,
    }));
    const shiftIds = myShifts.map(({ shiftId }) => shiftId);
    // Filter shifts that I have submitted a request for
    const myShiftBufferRequests = await this.shiftBufferRequests.collection.find({
      userId: user.id,
      status: ShiftBufferRequestStatus.Pending,
      endTime: {
        $gte: maxEndTime,
      },
      removedAt: { $exists: false },
    }).toArray();
    shiftIds.push(...myShiftBufferRequests.map(({ shiftGroupId }) => shiftGroupId));

    const availability = Object.keys(user.member.availability).reduce((acc, day) => {
      const { available, times } = user.member.availability[day] as DayAvailability;
      if (!available) {
        return [
          ...acc,
          {[`availability.${day}.startTime`]: {$exists: false}},
        ];
      }

      const overlap = (times || []).map(({ startTime, endTime }) => {
        const originalStartTime = new Date(startTime);
        const originalEndTime = new Date(endTime);

        const start = setSeconds(setMilliseconds(setMinutes(setHours(new Date(0), getHours(originalStartTime)), getMinutes(originalStartTime)), 0), 0);
        const end = setSeconds(setMilliseconds(setMinutes(setHours(new Date(0), getHours(originalEndTime)), getMinutes(originalEndTime)), 999), 59);

        return {
          $and: [
            {
              $or: [
                {[`availability.${day}.startTime`]: {$exists: false}},
                {[`availability.${day}.startTime`]: {$gte: start}},
              ],
            },
            {
              $or: [
                {[`availability.${day}.endTime`]: {$exists: false}},
                {[`availability.${day}.endTime`]: {$lte: end}},
              ],
            },
          ]
        };
      });

      return [
        ...acc,
        ...(overlap.length > 0 ? [{$or: overlap}] : []),
      ];
    }, [] as any);

    const $and: any[] = [];
    if (availability.length > 0) {
      $and.push(...availability);
    }
    if (shiftRanges.length > 0) {
      $and.push(...shiftRanges.map(({ startTime, endTime }) => ({
        $or: [
          { startTime: { $gte: endTime } },
          { endTime: { $lte: startTime } },
        ],
      })));
    }

    // Empty user or unlocked shifts
    $and.push(
      {
        $or: [
          { userId: null },
          { userId: { $exists: false } },
        ],
      },
      {
        $or: [
          { locked: false },
          { locked: { $exists: false } },
        ],
      }
    )

    const pipeline = [
      // Select only shift docs that are attached to compatible open assignments and are unassigned
      {
        $match: {
          endTime: { $gte: maxEndTime },
          ...(shiftId ? { _id: new ObjectId(shiftId) } : {}),
          shiftId: {
            ...(shiftGroupId ? { $in: [shiftGroupId] } : {}),
            $nin: shiftIds,
          },
          assignmentId: {
            $in: assignmentIds,
          },
          // Handles shift ranges and user availability
          ...($and.length > 0 ? { $and } : {}),
        },
      },
      // Group by shiftId
      {
        $group: {
          _id: '$shiftId',
          shifts: { $push: '$$ROOT' },
        }
      },
    ];

    logger.info('Pipeline', { pipeline });

    const res = await this.shifts.aggregate<{
      _id: ObjectId;
      shifts: Shift[];
    }>([
      ...pipeline,
      // Skip results
      {
        $skip: skip,
      },
      // Limit results
      {
        $limit: limit,
      }
    ]);

    const totalRes = await this.shifts.aggregate<{
      total: number;
    }>([
      ...pipeline,
      // Count results
      {
        $count: 'total',
      },
    ]);

    logger.info('Res', { totalRes, res });

    const enabledShiftBuffer = organization?.settings?.shiftBuffer?.enabled;
    const minuteBuffer = organization?.settings?.shiftBuffer?.minuteShiftBuffer;
    const firstShifts = res.map(({ shifts }) => {
      const {_id, ...shift} = shifts[0] as any;

      // Check if the shift should be a shiftBuffer
      let shiftBufferShift;
      if (enabledShiftBuffer && typeof minuteBuffer === 'number') {
        shiftBufferShift = myShifts.find((existingShift: Shift) => {
          const newStart = (existingShift.startTime as any) - (1000 * 60 * minuteBuffer);
          const newEnd = (existingShift.endTime as any) + (1000 * 60 * minuteBuffer);
          if (
            (shift.endTime >= newStart && shift.startTime <= newStart) ||
            (shift.endTime >= newEnd && shift.startTime <= newEnd)
          ) {
            return existingShift;
          }
        });
        if (shiftBufferShift) {
          shiftBufferShift.id = shiftBufferShift._id;
          delete shiftBufferShift._id;
        }
      }

      return {
        id: _id.toString(),
        ...shift,
        shiftBufferShift,
      };
    });

    return {
      total: totalRes?.[0]?.total || 0,
      items: firstShifts.sort((a, b) => a.startTime - b.startTime)
    };
  }

  async canSignUpForShift({
    user,
    // Specific shift to filter for
    shiftId,
    organization,
  }: {
    user: User;
    organization: Organization;
    shiftId: string;
  }) {
    const maxEndTime = Date.now();
    const myShifts = (await this.shifts.collection.find({
      userId: user.id,
      orgId: organization.id,
      endTime: {
        $gte: maxEndTime,
      },
      removedAt: { $exists: false },
    }).toArray() as any[]) as Shift[];
    const shiftRanges = myShifts.map(({ startTime, endTime }) => ({
      startTime,
      endTime,
    }));
    const $and: any[] = [];
    if (shiftRanges.length > 0) {
      $and.push(...shiftRanges.map(({ startTime, endTime }) => ({
        $or: [
          { startTime: { $gte: endTime } },
          { endTime: { $lte: startTime } },
        ],
      })));
    }
    const res = await this.shifts.collection.find({
      _id: new ObjectId(shiftId),
      endTime: { $gte: maxEndTime },
      removedAt: { $exists: false },
      // Handles shift ranges
      ...($and.length > 0 ? { $and } : {}),
    }).toArray();
    return {
      total: res.length,
      items: res,
    }
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

  async getDownloadUrl(attachmentPath: string) {
    return this.document.getDownloadUrl(attachmentPath);
  }
}