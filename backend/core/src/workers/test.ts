import { ObjectId } from "mongodb";
import difference from 'lodash.difference';
import uniq from 'lodash.uniq';
import { Assignment } from "../__generated__/resolvers-types";
import { createContext } from "../utils/createContext";

export const handler = async () => {
  try {
    const context = await createContext();

    const organization = await context.organizations.get('64cd5e262c436093a2b7e680');
    const event = await context.events.get('6596ee297098d91e7308e2ef');

    const assignmentDetails: Assignment[] = await context.assignments.collection.find({
      orgId: organization!.id,
      eventId: event!.id,
    }).project({ _id: 1, rankIds: 1, requiredSkillIds: 1 }).toArray() as unknown as Assignment[];

    const shiftIds = await context.shifts.collection.find({
      orgId: organization!.id,
      eventId: event!.id,
      assignmentId: { $in: assignmentDetails.map((a: any) => a._id.toString()) },
    }).project({ shiftId: 1 }).toArray();

    const uniqShiftIds = uniq(shiftIds.map((s: any) => s.shiftId));
    const uniqRanksIds = uniq(assignmentDetails.map((a: any) => a.rankIds).flat());

    const user = await context.users.collection.findOne({_id: new ObjectId('65810eb96b4100cdebc8b516')});

    let skillIds: string[] | undefined = undefined;
    let canSignUpForAShift = false;
    for(const shiftId of uniqShiftIds) {
      const shift = await context.shifts.findOne({
        shiftId,
        orgId: organization!.id,
        // $or: [
        //   { userId: null },
        //   { userId: { $exists: false } },
        // ],
      });
      if (!shift) {
        continue;
      }

      // Verify user has required skills
      // const assignment = assignmentDetails.find((a: any) => a._id.toString() === shift.assignmentId);
      // if (assignment && assignment.requiredSkillIds && assignment.requiredSkillIds.length > 0) {
      //   if (!skillIds && (user?.member?.memberSkillIds || []).length > 0) {
      //     const mSkills = await context.memberSkills.findAll((user?.member?.memberSkillIds || []).map((id) => new ObjectId(id as any)));
      //     skillIds = mSkills.map(({ skillId }) => skillId);
      //   }
      //   if (difference(assignment.requiredSkillIds, skillIds).length > 0) {
      //     continue;
      //   }
      // }

      // console.log(user);

      const { canSignUpForShift } = await context.shifts.canSignUpForShift({
        user: {
          ...(user! as any),
          id: (user as any)!._id.toString(),
        },
        shift,
        orgId: organization!.id,
      });

      if (!canSignUpForShift) {
        continue;
      }
      canSignUpForAShift = true;
      break;
    }
    console.log('canSignUpForAShift', canSignUpForAShift);
  } catch (error) {
    console.error(error);
  }
}
