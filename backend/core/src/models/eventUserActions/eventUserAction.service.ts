import { IncidentSubmissionModel } from '../incidentForm';
import { ShiftModel } from '../shift';
import { ShiftInterestRequestModel } from '../shiftInterestRequest';
import { ShiftLotteryRequestModel } from '../shiftLotteryRequest';
import { EventUserActionRepo } from './eventUserAction.repository';

export class EventUserActionService {
  constructor(
    private shifts: ShiftModel,
    private shiftInterestRequests: ShiftInterestRequestModel,
    private incidentForms: IncidentSubmissionModel,
    private shiftLotteryRequests: ShiftLotteryRequestModel,
    private eventUserAction: EventUserActionRepo
  ) {}

  async createFromShift(id: string) {
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

  async createFromIncidentForm(id: string) {
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

  async createFromShiftInterestRequest(id: string) {
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

  async createFromShiftLotteryRequest(id: string) {
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
