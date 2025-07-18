import { IEvent } from "../../../models/event";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  Event: {
    ...commonResolvers,
    createdBy: (event: IEvent, _, { users }: Context) => event.createdById ? users.loader.load(event.createdById.toString()) : null,
    supervisor: (event: IEvent, _, { users }: Context) => event.supervisorId ? users.loader.load(event.supervisorId.toString()) : null,
    lieutenant: (event: IEvent, _, { users }: Context) => event.lieutenantId ? users.loader.load(event.lieutenantId.toString()) : null,
    supervisorAssignment: (event: IEvent, _, { assignments }: Context) => event.supervisorAssignmentId ? assignments.loader.load(event.supervisorAssignmentId.toString()) : null,
    lieutenantAssignment: (event: IEvent, _, { assignments }: Context) => event.lieutenantAssignmentId ? assignments.loader.load(event.lieutenantAssignmentId.toString()) : null,
    fieldSupervisorAssignment: (event: IEvent, _, { assignments }: Context) => event.fieldSupervisorAssignmentId ? assignments.loader.load(event.fieldSupervisorAssignmentId.toString()) : null,
    org: (event: IEvent, _, { organizations }: Context) => organizations.loader.load(event.orgId.toString()),
    venue: (event: IEvent, _, { venues }: Context) => event.venueId ? venues.loader.load(event.venueId.toString()) : null,
    assignments: (event: IEvent, _, { assignments }: Context) => assignments.loader.loadMany((event.assignmentIds || []).map((id) => id.toString())),
    startTime: (item: IEvent) => item.startTime ? new Date(item.startTime).toISOString() : null,
    endTime: (item: IEvent) => item.endTime ? new Date(item.endTime).toISOString() : null,
    scheduledFirstComeFirstServe: (item: IEvent) => item.scheduledFirstComeFirstServe ? new Date(item.scheduledFirstComeFirstServe).toISOString() : null,
    scheduledInterestList: (item: IEvent) => item.scheduledInterestList ? new Date(item.scheduledInterestList).toISOString() : null,
    interestListAutoAssignCutoff: (item: IEvent) => item.interestListAutoAssignCutoff ? new Date(item.interestListAutoAssignCutoff).toISOString() : null,
    scheduledCloseInterestList: (item: IEvent) => item.scheduledCloseInterestList ? new Date(item.scheduledCloseInterestList).toISOString() : null,
    lotteryCounter: (item: IEvent, _, { lotteryCounter }: Context) => typeof item.lotteryNumber === 'number' ? lotteryCounter.countLoader.load({lotteryNumber: item.lotteryNumber!, orgId: item.orgId.toString()}) : null,
    attachments: async (item: IEvent, _arg: unknown, { events }: Context) => {
      if (!item.attachmentPaths) {
        return [];
      }
      const results = await Promise.allSettled((item.attachmentPaths || []).map((path) => {
        return events.getDownloadUrl(path as string);
      }));

      return results.filter((result) => result.status === 'fulfilled').map((result: any) => result.value);
    },
    requiredSkills: (event: IEvent, _, { skills }: Context) => skills.loader.loadMany((event.requiredSkillIds || []).map((id) => id.toString())),
    availableShifts: async (item: IEvent, _arg: unknown, { shifts }: Context) => shifts.availableShiftsOnEvent.load(item.id!),
    totalShifts: async (item: IEvent, _arg: unknown, { shifts }: Context) => shifts.totalShiftsOnEvent.load(item.id!),
    docusignEvent: (item: IEvent, _, context: Context) => {
      if (!item.docusignEnvelopeId) return null;
      return context.docusign.loadEventsByEventId((item.id?.toString() || item._id?.toString())!);
    },
  },
};
