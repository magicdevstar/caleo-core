import { ObjectId } from 'mongodb';
import DataLoader from 'dataloader';
import { IChangeStreamEvent } from '../../types/change.streams';
import { IncidentSubmissionModel } from '../incidentForm';
import { ShiftModel } from '../shift';
import { ShiftInterestRequestModel } from '../shiftInterestRequest';
import { ShiftLotteryRequestModel } from '../shiftLotteryRequest';
import { EventUserActionRepo } from './eventUserAction.repository';
import { EventUserActionLogAction, EventUserActionLogSource, EventUserActionType } from '../../__generated__/resolvers-types';

export class EventUserActionService {
  loadHasActionsForShifts = new DataLoader(async (keys: readonly { shiftId: string; userId: ObjectId; action?: EventUserActionLogAction }[]) => {
    const res = await this.eventUserAction.collection.find({
      $or: keys.map(key => ({
        shiftGroupId: key.shiftId,
        userId: key.userId,
        action: key.action,
      })),
    }).toArray();

    // Map results to keys and return true or false if record exists
    const map = new Map<string, boolean>();
    res.forEach((item) => {
      const key = `${item.shiftGroupId.toString()}_${item.userId.toString()}_${item.action}`;
      map.set(key, true);
    });

    return keys.map(key => {
      const mapKey = `${key.shiftId}_${key.userId.toString()}_${key.action}`;
      return map.get(mapKey) || false;
    });
  });

  constructor(
    private shifts: ShiftModel,
    private shiftInterestRequests: ShiftInterestRequestModel,
    private incidentForms: IncidentSubmissionModel,
    private shiftLotteryRequests: ShiftLotteryRequestModel,
    private eventUserAction: EventUserActionRepo
  ) {}

  async search(input) {
    return this.eventUserAction.search(input);
  }

  async bulk(items: any[]) {
    await this.eventUserAction.bulkWrite(items);
  }

  async createItem({
    userId,
    eventId,
    shiftGroupId,
    incidentFormId,
    source,
    actionId,
    modifiedById,
    modifiedBy,
    timestamp,
    action,
    notes,
  }: {
    userId: ObjectId;
    eventId: ObjectId;
    
    // Results in a actionType of SHIFT
    shiftGroupId?: string;
    // Results in a actionType of INCIDENT_SUBMISSION
    incidentFormId?: ObjectId;

    source: EventUserActionLogSource;
    modifiedById?: ObjectId;
    modifiedBy?: {id: string; name: string};
    timestamp?: Date;
    action: EventUserActionLogAction;
    notes?: string;
    actionId?: string;
  }) {
    await this.eventUserAction.create({
      userId,
      eventId,
      shiftGroupId,
      incidentFormId,
      actionType: shiftGroupId ? EventUserActionType.Shift : EventUserActionType.IncidentSubmission,
      source,
      modifiedById,
      modifiedBy,
      timestamp,
      action,
      notes,
      actionId,
    } as any);
  }

  async createFromShift(event: IChangeStreamEvent) {
    const id = event.detail.documentKey._id;
    const shift = await this.shifts.get(id, { removed: true });
    if (!shift || !shift.userId) {
      return;
    }
    return this.eventUserAction.upsertAction({
      userId: shift.userId!,
      eventId: shift.eventId,
      key: 'shiftGroupId',
      value: shift.shiftId,
    });
  }

  async createFromIncidentForm(event: IChangeStreamEvent) {
    const id = event.detail.documentKey._id;
    const incidentForm = await this.incidentForms.get(id, { removed: true });
    if (!incidentForm) {
      return;
    }
    return this.eventUserAction.upsertAction({
      userId: incidentForm.userId,
      eventId: incidentForm.eventId,
      key: 'incidentFormId',
      value: incidentForm._id!,
    });
  }

  async createFromShiftInterestRequest(event: IChangeStreamEvent) {
    const id = event.detail.documentKey._id;
    const shiftInterestRequests = await this.shiftInterestRequests.get(id, { removed: true });
    if (!shiftInterestRequests) {
      return;
    }
    return this.eventUserAction.upsertAction({
      userId: shiftInterestRequests.userId,
      eventId: shiftInterestRequests.eventId,
      key: 'shiftGroupId',
      value: shiftInterestRequests.shiftGroupId,
    });
  }

  async createFromShiftLotteryRequest(event: IChangeStreamEvent) {
    const id = event.detail.documentKey._id;
    const shiftLotteryRequest = await this.shiftLotteryRequests.get(id, { removed: true });
    if (!shiftLotteryRequest) {
      return;
    }
    return this.eventUserAction.upsertAction({
      userId: shiftLotteryRequest.userId,
      eventId: shiftLotteryRequest.eventId,
      key: 'shiftGroupId',
      value: shiftLotteryRequest.shiftGroupId,
    });
  }
};
