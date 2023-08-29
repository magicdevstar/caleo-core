import { Db, ObjectId } from 'mongodb';
import { DocType, EventStatus, Shift, User } from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import { AssignmentModel } from './assignment';
import { ShiftModel } from './shift';
import { GraphQLError } from 'graphql';
import logger from '../utils/logger';
import { EventModel } from './event';
import { MemberSkillModel } from './memberSkill';

export class UserModel extends BaseModel<User> {
  assignments: AssignmentModel;
  shifts: ShiftModel;
  events: EventModel;
  constructor(db: Db) {
    super(db, DocType.User);
    this.assignments = new AssignmentModel(db);
    this.shifts = new ShiftModel(db);
    this.events = new EventModel(db);
  }

  async findOpenShifts({
    user,
    limit,
    skip,
    orgId,
  }: {
    user: User;
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

    logger.info('AssignmentIds', { assignmentIds });

    const pipeline = [
      // Select only shift docs that are attached to compatible open assignments
      {
        $match: {
          docType: DocType.Shift,
          assignmentId: {
            $in: assignmentIds,
          },
        },
      },
      // Group by shiftId
      {
        $group: {
          _id: '$shiftId',
          shifts: { $push: '$$ROOT' },
          userIds: { $push: '$userId' }
        }
      },
      // Filter out shift groups we have already signed up for
      {
        $match: {
          userIds: {
            $nin: [user.id]
          }
        }
      },
      // Unwind so all shift documents are separate documents again
      { $unwind: { path: '$shifts' } },
      // Filter for only unassigned shifts
      { $match: { 'shifts.userId': null } },
      // Group by shiftId again
      {
        $group: {
          _id: '$_id',
          shifts: { $push: '$shifts' }
        }
      },
      // Skip results
      {
        $skip: skip,
      },
      // Limit results
      {
        $limit: limit,
      }
    ];

    logger.info('Pipeline', { pipeline });

    const res = await this.shifts.aggregate<{
      _id: ObjectId;
      shifts: Shift[];
    }>(pipeline);

    const totalRes = await this.shifts.aggregate<{
      total: number;
    }>([
      // Select only shift docs that are attached to open events
      {
        $match: {
          docType: DocType.Shift,
          eventId: {
            $in: eventIds,
          },
        },
      },
      // Group by shiftId
      {
        $group: {
          _id: '$shiftId',
          shifts: { $push: '$$ROOT' },
          userIds: { $push: '$userId' }
        }
      },
      // Filter out shift groups we have already signed up for
      {
        $match: {
          userIds: {
            $nin: [user.id]
          }
        }
      },
      // Unwind so all shift documents are separate documents again
      { $unwind: { path: '$shifts' } },
      // Filter for only unassigned shifts
      { $match: { 'shifts.userId': null } },
      // Group by shiftId again
      {
        $group: {
          _id: '$_id',
          shifts: { $push: '$shifts' }
        }
      },
      // Count results
      {
        $count: 'total',
      },
    ]);

    const firstShifts = res.map(({ shifts }) => {
      const {_id, ...shift} = shifts[0] as any;

      return {
        id: _id.toString(),
        ...shift,
      };
    });

    logger.info('Res', { totalRes, res });

    return {
      total: 0,
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