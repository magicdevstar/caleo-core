import { Context } from "../../../utils/createContext";
import {
  EventSearchInput,
  EventStatus,
} from "../../../__generated__/resolvers-types";
import { SearchResults } from "../../../utils/common.resolvers";
import { IEvent } from "../../../models/event";
import { ObjectId } from "mongodb";

export const Query = {
  event: async (
    _parent: unknown,
    { id }: { id: string },
    { events }: Context,
  ): Promise<IEvent | null> => events.get(id, { removed: true }),
  events: async (
    _parent: unknown,
    { input: { range, endTime, createdById, status, referenceIds, venueIds, ...input } }: { input: EventSearchInput },
    { events, lotteryCounter, organization, user }: Context
  ): Promise<SearchResults<IEvent>> => {
    const timeFilters: any = {};
    const $or: any[] = [];

    if (referenceIds) {
      (input as any).referenceId = { $in: referenceIds };
    }
    if (venueIds) {
      (input as any).venueId = { $in: venueIds.map((id) => new ObjectId(id!)) };
    }

    const includeComplete = (status || []).includes(EventStatus.Complete);

    if (range) {
      const { startTime, endTime } = range;
      if (startTime && startTime.value) {
        timeFilters.startTime = new Date(startTime.value);
      } else if (startTime && (startTime.gte || startTime?.lte)) {
        timeFilters.startTime = {
          ...(startTime.gte ? { $gte: new Date(startTime.gte) } : {}),
          ...(startTime.lte ? { $lte: new Date(startTime.lte) } : {}),
        };
      }

      if (endTime && endTime.value) {
        timeFilters.endTime = new Date(endTime.value);
      } else if (endTime && (endTime.gte || endTime?.lte)) {
        timeFilters.endTime = {
          ...(endTime.gte ? { $gte: new Date(endTime.gte) } : {}),
          ...(endTime.lte ? { $lte: new Date(endTime.lte) } : {}),
        };
      }
    } else if (endTime && !includeComplete) {
      if (endTime.value) {
        timeFilters.endTime = new Date(endTime.value);
      } else if (endTime.gte || endTime?.lte) {
        $or.push({
          endTime: {
            ...(endTime.gte ? { $gte: new Date(endTime.gte) } : {}),
            ...(endTime.lte ? { $lte: new Date(endTime.lte) } : {}),
          }
        }, {
          endTime: { $exists: false },
        });
      }
    }
    if (createdById) {
      (input as any).createdById = { $in: createdById.map((id) => new ObjectId(id!)) };
    }
    // Kill me :) Maybe I should consider just calculating the status with event bridge instead of this mess
    if (status) {
      const includeLottery = status.includes(EventStatus.ReadyForLottery);
      const includePreLottery = status.includes(EventStatus.PreLottery);
      const includePreFCFS = status.includes(EventStatus.PreFirstComeFirstServe);
      const includeRemoved = status.includes(EventStatus.Removed);
      const filteredStatus = status.filter((s: any) => ![
        EventStatus.ReadyForLottery,
        EventStatus.PreLottery,
        EventStatus.PreFirstComeFirstServe,
      ].includes(s));

      if (includeLottery && includePreLottery) {
        filteredStatus.push(EventStatus.ReadyForLottery);
      } else if (includeLottery) {
        const { counter } = await lotteryCounter.get(organization!._id!);
        if (filteredStatus.length > 0 || includeComplete || includePreFCFS) {
          $or.push({
            lotteryNumber: counter,
          });
        } else {
          (input as any).lotteryNumber = counter;
        }
        filteredStatus.push(EventStatus.ReadyForLottery);
      } else if (includePreLottery) {
        const { counter } = await lotteryCounter.get(organization!._id!);
        if (filteredStatus.length > 0 || includeComplete || includePreFCFS) {
          $or.push({
            lotteryNumber: { $gt: counter },
          });
        } else {
          (input as any).lotteryNumber = { $gt: counter };
        }
        filteredStatus.push(EventStatus.ReadyForLottery);
      }
      if (includePreFCFS) {
        if (filteredStatus.length > 0 || includeComplete || includeLottery || includePreLottery) {
          $or.push({
            scheduledFirstComeFirstServe: { $gt: new Date() },
          });
        } else {
          (input as any).scheduledFirstComeFirstServe = { $gt: new Date() };
        }
        filteredStatus.push(EventStatus.FirstComeFirstServe);
      }
      if (includeRemoved) {
        (input as any).includeRemoved = true;
      } 
      if (filteredStatus.length > 0) {
        (input as any).status = { $in: filteredStatus };
      }
    }

    return await events.search({
      orgId: user.member.orgId,
      // Do not show complete events in the overtime search :)
      ...timeFilters,
      ...($or.length > 0 ? { $or } : {}),
      ...input,
      ...(!(input as any).status ? { status: { $ne: EventStatus.Template } } : {}),
      queryField: 'searchAttribute',
    });
  },
  fetchActiveIncidents: async (
    _parent: unknown,
    _args: unknown,
    { events, user }: Context,
  ): Promise<SearchResults<IEvent>> => {
    const now = new Date()

    return await events.search({
      orgId: user.member.orgId,
      status: EventStatus.Incident,
      incidentSubmissionCuttoff: { $gt: now },
      queryField: 'searchAttribute',
      orderBy: 'incidentSubmissionCuttoff',
      order: 'asc',
    })
  }
};