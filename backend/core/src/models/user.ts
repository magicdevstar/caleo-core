import { Db, ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';
import {
  DayAvailability,
  DocType,
  EventStatus,
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

export class UserModel extends BaseModel<User> {
  documentBasePath: string = 'profilePhotos';
  constructor(
    db: Db,
    private assignments: AssignmentModel,
    private shifts: ShiftModel,
    private events: EventModel,
    private shiftBufferRequests: ShiftBufferRequestModel,
    private document: DocumentModel,
  ) {
    super(db, DocType.User);
  }

  async findOpenShifts({
    user,
    // Specific shift to filter for
    shiftId,
    limit,
    skip,
    orgId,
    organization,
  }: {
    user: User;
    organization: Organization;
    shiftId?: string;
    limit: number;
    skip: number;
    orgId: string;
  }) {
    let skillIds: string[] = [];
    if ((user.member.memberSkillIds || []).length > 0) {
      const skillList = await this.collection.find({
        orgId,
        _id: {
          $in: (user.member.memberSkillIds || []).map((id) => new ObjectId(id as string)),
        },
        docType: DocType.MemberSkill,
      }).toArray();
      skillIds = skillList.map(({ skillId }) => skillId);
    }
    // Find first come first serve events
    const {
      items: eventList,
    } = await this.events.search({
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
    });
    const eventIds = eventList.map(({ id }) => id);

    // Find assignments that are attached to those events
    const assignmentSearch = {
      eventId: {
        $in: eventIds,
      },
      $or: [
        {
          rankIds: {
            $size: 0,
          }
        },
        {
          rankIds: {
            $in: [user.member.rankId],
          },
        },
      ],
    };
    logger.info('Assignment search', { assignmentSearch });
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
      userId: user.id,
      docType: DocType.Shift,
      endTime: {
        $gte: maxEndTime,
      }
    }).toArray() as any[]) as Shift[];
    const shiftRanges = myShifts.map(({ startTime, endTime }) => ({
      startTime,
      endTime,
    }));
    const shiftIds = myShifts.map(({ shiftId }) => shiftId);

    logger.info('My Shifts', { myShifts });

    // Filter shifts that I have submitted a request for
    const myShiftBufferRequests = await this.shiftBufferRequests.collection.find({
      userId: user.id,
      docType: DocType.ShiftBufferRequest,
      status: ShiftBufferRequestStatus.Pending,
      endTime: {
        $gte: maxEndTime,
      }
    }).toArray();
    shiftIds.push(...myShiftBufferRequests.map(({ shiftGroupId }) => shiftGroupId));

    logger.info('AssignmentIds', { assignmentIds });

    const availability = Object.keys(user.member.availability).reduce((acc, day) => {
      const { available, times } = user.member.availability[day] as DayAvailability;
      if (!available) {
        return {
          [`availability.${day}.startTime`]: {$exists: false},
        };
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
                {[`availability.${day}.startTime`]: {$gte: new Date(start)}},
              ],
            },
            {
              $or: [
                {[`availability.${day}.endTime`]: {$exists: false}},
                {[`availability.${day}.endTime`]: {$lte: new Date(end)}},
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

    logger.info('Availability', { availability });

    const $and: any[] = [];
    if (availability.length > 0) {
      $and.push(...availability);
    }
    if (shiftRanges.length > 0) {
      $and.push(...shiftRanges.map(({ startTime, endTime }) => ({
        $or: [
          { startTime: { $gt: endTime } },
          { endTime: { $lt: startTime } },
        ],
      })));
    }
    const pipeline = [
      // Select only shift docs that are attached to compatible open assignments and are unassigned
      {
        $match: {
          docType: DocType.Shift,
          endTime: { $gte: maxEndTime },
          ...(shiftId ? { _id: new ObjectId(shiftId) } : {}),
          shiftId: {
            $nin: shiftIds,
          },
          $or: [
            { userId: { $exists: false } },
            { userId: null },
          ],
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

      logger.info('shiftBufferShift', { shiftBufferShift });

      return {
        id: _id.toString(),
        ...shift,
        shiftBufferShift,
      };
    });

    return {
      total: totalRes?.[0]?.total || 0,
      items: firstShifts
    };
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
    if (assignment.rankIds && Array.isArray(assignment.rankIds) && assignment.rankIds.length > 0) {
      searchInput['member.rankId'] = {
        $in: assignment.rankIds,
      }
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

  async getDownloadUrl(attachmentPath: string) {
    return this.document.getDownloadUrl(attachmentPath);
  }
}