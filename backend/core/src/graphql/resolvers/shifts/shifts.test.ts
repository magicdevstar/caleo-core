import {
  describe,
  expect,
  it,
  beforeAll,
  afterAll,
} from '@jest/globals';
import { randomUUID as uuid } from 'crypto';
import { addHours } from 'date-fns/addHours';
import { testingService } from '../../../services/testing/testing.service';
import { EventStatus, Shift, UpsertShift } from '../../../__generated__/resolvers-types';
import { truncateToMinute } from '../../../utils/date.helpers';
import { MailerEvents } from '../../../types/mailer';
import { NotificationType, ShiftNotificationAction } from '../../../types/notifications';

// Using it.only inside the describe block is more reliable than describe.only
describe('Shifts', () => {
  beforeAll(async () => {
    await testingService.init();
  });
  
  afterAll(async () => await testingService.afterAll());

  it('should validate first come first serve shifts', async () => {
    if (!testingService.testingDefault) {
      throw new Error('testingDefault not initialized');
    }
    
    // Create shifts on assignment
    const {
      event,
      assignment,
    } = await testingService.initEventWithAssignment({
      eventStatus: EventStatus.FirstComeFirstServe,
    });

    const groupId = uuid();
    const startTime = truncateToMinute(addHours(new Date(), 1)).toISOString();
    const endTime = truncateToMinute(addHours(new Date(), 4)).toISOString();
    const inputShifts: UpsertShift[] = new Array(2).fill('i').map((_, index) => ({
      shiftId: groupId,
      refNumber: index,
      startTime,
      endTime,
      // Should show shifts even if one is locked
      locked: index === 0,
      eventId: event.id!,
      assignmentId: assignment.id!,
    }));

    const shifts = await testingService.upsertShifts(inputShifts);

    for(const shift of shifts) {
      // Validate the shift details
      expect(shift.id).toBeDefined();
      expect(shift.startTime).toEqual(inputShifts[0].startTime);
      expect(shift.endTime).toEqual(inputShifts[0].endTime);
      expect(shift.shiftId).toEqual(inputShifts[0].shiftId);

      // Validate the event details
      expect(shift.event).toBeDefined();
      expect(shift.event.id).toEqual(event.id);
      expect(shift.event.assignmentIds).toContain(assignment.id);

      // Validate the assignment details
      expect(shift.assignment).toBeDefined();
      expect(shift.assignment.id).toEqual(assignment.id);
      expect(shift.assignment.shiftIds).toContain(shift.id);
    }

    const onlyShifts = (shifts: Shift[]) => shifts.filter((s) => s.shiftId === groupId);

    // Validate that the user can view the shifts
    const availableShifts = onlyShifts(await testingService.findAvailableShifts());

    for(const shift of availableShifts) {
      // Validate the shift details
      expect(shift.id).toBeDefined();
      expect(shift.startTime).toEqual(inputShifts[0].startTime);
      expect(shift.endTime).toEqual(inputShifts[0].endTime);
      expect(shift.shiftId).toEqual(inputShifts[0].shiftId);

      // Validate the event details
      expect(shift.event).toBeDefined();
      expect(shift.event.id).toEqual(event.id);
      expect(shift.event.assignmentIds).toContain(assignment.id);

      // Validate the assignment details
      expect(shift.assignment).toBeDefined();
      expect(shift.assignment.id).toEqual(assignment.id);
      expect(shift.assignment.shiftIds).toContain(shift.id);
    }

    // Should hide all shifts if all are locked
    const { event: e, assignment: a, ...shiftToLock } = shifts[1];
    shiftToLock.locked = true;
    shiftToLock.eventId = event.id!;
    shiftToLock.assignmentId = assignment.id!;
    const updatedShifts = await testingService.upsertShifts([shiftToLock]);
    const availableShiftsLocked = onlyShifts(await testingService.findAvailableShifts());
    expect(availableShiftsLocked.length).toEqual(0);

    // Show shift as available if one is unlocked
    const { event: e2, assignment: a2, ...shiftToUnLock } = updatedShifts[0];
    shiftToUnLock.locked = false;
    shiftToUnLock.eventId = event.id!;
    shiftToUnLock.assignmentId = assignment.id!;
    await testingService.upsertShifts([shiftToUnLock]);
    const availableShiftsUnlocked = onlyShifts(await testingService.findAvailableShifts());
    expect(availableShiftsUnlocked.length).toEqual(1);

    // Assign the shift to a user
    await testingService.assignShiftToUser(
      availableShiftsUnlocked[0].id,
      testingService.testingDefault.user.id!
    );
    
    testingService.mailerValidation({
      expectedTemplate: MailerEvents.OfficerAdminAssignedShift,
      payloadValidation: (payload) => {
        expect(payload.data.shift.id).toEqual(availableShiftsUnlocked[0].id);
      }
    });

    // Validate the notification was scheduled
    testingService.notificationSchedulerValidation({
      payloadValidation: (payload) => {
        expect(payload.type).toEqual(NotificationType.Shift);
        expect(payload.action).toEqual(ShiftNotificationAction.UpsertAllNotifications);
        expect(payload.shiftId).toEqual(availableShiftsUnlocked[0].shiftId);
      },
    });

    // Should not see in available shifts list
    const shiftWithAssignment = onlyShifts(await testingService.findAvailableShifts());
    expect(shiftWithAssignment.length).toEqual(0);
  });

  it('should validate interest list shifts', async () => {
    if (!testingService.testingDefault) {
      throw new Error('testingDefault not initialized');
    }
    
    // Create shifts on assignment
    const {
      event,
      assignment,
    } = await testingService.initEventWithAssignment({
      eventStatus: EventStatus.InterestList,
      autoAssignInterestList: false,
      // Available now
      scheduledInterestList: new Date(),
    });

    const groupId = uuid();
    const startTime = truncateToMinute(addHours(new Date(), 36)).toISOString();
    const endTime = truncateToMinute(addHours(new Date(), 40)).toISOString();
    const inputShifts: UpsertShift[] = new Array(2).fill('i').map((_, index) => ({
      shiftId: groupId,
      refNumber: index,
      startTime,
      endTime,
      // Should show shifts even if one is locked
      locked: index === 0,
      eventId: event.id!,
      assignmentId: assignment.id!,
    }));

    const shifts = await testingService.upsertShifts(inputShifts);

    for(const shift of shifts) {
      // Validate the shift details
      expect(shift.id).toBeDefined();
      expect(shift.startTime).toEqual(inputShifts[0].startTime);
      expect(shift.endTime).toEqual(inputShifts[0].endTime);
      expect(shift.shiftId).toEqual(inputShifts[0].shiftId);

      // Validate the event details
      expect(shift.event).toBeDefined();
      expect(shift.event.id).toEqual(event.id);
      expect(shift.event.assignmentIds).toContain(assignment.id);

      // Validate the assignment details
      expect(shift.assignment).toBeDefined();
      expect(shift.assignment.id).toEqual(assignment.id);
      expect(shift.assignment.shiftIds).toContain(shift.id);
    }

    const onlyShifts = (shifts: Shift[]) => shifts;

    // Validate that the user can view the shifts
    const availableShifts = onlyShifts(await testingService.findAvailableShifts());

    for(const shift of availableShifts) {
      // Validate the shift details
      expect(shift.id).toBeDefined();
      expect(shift.startTime).toEqual(inputShifts[0].startTime);
      expect(shift.endTime).toEqual(inputShifts[0].endTime);
      expect(shift.shiftId).toEqual(inputShifts[0].shiftId);

      // Validate the event details
      expect(shift.event).toBeDefined();
      expect(shift.event.id).toEqual(event.id);
      expect(shift.event.assignmentIds).toContain(assignment.id);

      // Validate the assignment details
      expect(shift.assignment).toBeDefined();
      expect(shift.assignment.id).toEqual(assignment.id);
      expect(shift.assignment.shiftIds).toContain(shift.id);
    }

    // Should **NOT** hide all shifts if all are locked/assigned
    const { event: e, assignment: a, ...shiftToLock } = shifts[1];
    shiftToLock.locked = true;
    shiftToLock.eventId = event.id!;
    shiftToLock.assignmentId = assignment.id!;
    const updatedShifts = await testingService.upsertShifts([shiftToLock]);
    const availableShiftsLocked = onlyShifts(await testingService.findAvailableShifts());
    expect(availableShiftsLocked.length).toEqual(1);

    // Show shift as available if one is unlocked
    const { event: e2, assignment: a2, ...shiftToUnLock } = updatedShifts[0];
    shiftToUnLock.locked = false;
    shiftToUnLock.eventId = event.id!;
    shiftToUnLock.assignmentId = assignment.id!;
    await testingService.upsertShifts([shiftToUnLock]);
    const availableShiftsUnlocked = onlyShifts(await testingService.findAvailableShifts());
    expect(availableShiftsUnlocked.length).toEqual(1);

    // Assign the shift to a user
    await testingService.assignShiftToUser(
      availableShiftsUnlocked[0].id,
      testingService.testingDefault.user.id!
    );
    
    // Validate the mailer event
    testingService.mailerValidation({
      expectedTemplate: MailerEvents.OfficerAdminAssignedShift,
      payloadValidation: (payload) => {
        expect(payload.data.shift.id).toEqual(availableShiftsUnlocked[0].id);
      },
    });

    // Validate the notification was scheduled
    testingService.notificationSchedulerValidation({
      payloadValidation: (payload) => {
        expect(payload.type).toEqual(NotificationType.Shift);
        expect(payload.action).toEqual(ShiftNotificationAction.UpsertAllNotifications);
        expect(payload.shiftId).toEqual(availableShiftsUnlocked[0].shiftId);
      },
    });

    // Validate the user no longer sees the shift
    const shiftWithAssignmentInterest = onlyShifts(await testingService.findAvailableShifts());
    expect(shiftWithAssignmentInterest.length).toEqual(0);
  });
});
