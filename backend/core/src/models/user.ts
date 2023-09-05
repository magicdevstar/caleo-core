import { Db, ObjectId } from 'mongodb';
import {
  DayAvailability,
  DocType,
  EventStatus,
  Shift,
  User
} from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import { AssignmentModel } from './assignment';
import { ShiftModel } from './shift';
import { GraphQLError } from 'graphql';
import logger from '../utils/logger';
import { EventModel } from './event';
import { OrganizationModel } from './organization';
import { getHours, getMinutes, setHours, setMilliseconds, setMinutes, setSeconds } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

export class UserModel extends BaseModel<User> {
  constructor(
    db: Db,
    private assignments: AssignmentModel,
    private shifts: ShiftModel,
    private events: EventModel,
    private organizations: OrganizationModel,
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
  }: {
    user: User;
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
      status: EventStatus.FirstComeFirstServe,
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

    const minimumStartTime = Date.now();
    const myShifts = await this.shifts.collection.find({
      userId: user.id,
      docType: DocType.Shift,
      startTime: {
        $gte: minimumStartTime,
      }
    }).toArray();
    const shiftRanges = myShifts.map(({ startTime, endTime }) => ({
      startTime,
      endTime,
    }));
    const shiftIds = myShifts.map(({ shiftId }) => shiftId);

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
                {[`availability.${day}.startTime`]: {$gte: new Date(startTime)}},
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
        {
          $or: overlap
        },
      ];
    }, [] as any);

    logger.info('Availability', { availability });

    /**
     * TODO: Include filter for overtime availability
     * 
     * I think I need to save the day of the week times on a shift so that I can filter shifts that do not
     * overlap the overtime availability set by the user.
     * 
     * For example if a shift is on 9/1/23 5:00am - 9/2/23 12:00pm
     *
     * Then I would save this object to the shift
     *
     * {
     *  overtime: {
     *   sunday: null,
     *   Monday: null,
     *   Tuesday: null,
     *   Wednesday: null,
     *   Thursday: null,
     *   Friday: {
     *       startTime: "1969-12-31T05:00:00.000Z”,
     *       endTime: "1969-12-31T23:59:59.000Z”,
     *   },
     *   Saturday: {
     *       startTime: “1969-12-31T00:00:00.000Z”,
     *       endTime: “1969-12-31T12:00:00.000Z”,
     *   },
     *   Sunday: null,
     *  }
     * }
     * 
     * Then in the $match here I could just add another $and clause that ensures
     * that the day of the week is either null or fits within one of the time ranges set by the user.
     */
    const $and: any[] = [];
    if (availability.length > 0) {
      $and.push(...availability);
    }
    if (shiftRanges.length > 0) {
      $and.push(shiftRanges.map(({ startTime, endTime }) => ({
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
          startTime: { $gte: minimumStartTime },
          ...(shiftId ? { _id: new ObjectId(shiftId) } : {}),
          shiftId: {
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

    const firstShifts = res.map(({ shifts }) => {
      const {_id, ...shift} = shifts[0] as any;

      return {
        id: _id.toString(),
        ...shift,
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
}