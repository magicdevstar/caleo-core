import {
  describe,
  afterEach,
  expect,
  jest,
  test,
} from '@jest/globals';
import { addSeconds, subSeconds } from 'date-fns';
import { InterestListService } from './interestList.service';
import { IEvent } from '../models/event';
import { IShift } from '../models/shift';

describe('InterestListService', () => {
  describe('shouldTriggerInterestListAssignment', () => {
    const defaultNow = new Date('2025-12-14T13:24:39.746Z');

    afterEach(() => {
      jest.useRealTimers();
    });

    const baseEvent = {
      scheduledCloseInterestList: subSeconds(defaultNow, 2),
      interestListAutoAssignCutoff: addSeconds(defaultNow, 2),
    } as IEvent;

    const baseShift = {
      locked: false,
    } as IShift;

    test.each([
      {
        name: 'should return true when within window and not locked',
        event: { ...baseEvent },
        shift: { ...baseShift },
        expected: true,
      },
      {
        name: 'should return false when interest list is not closed yet',
        event: { ...baseEvent, scheduledCloseInterestList: addSeconds(defaultNow, 1) },
        shift: { ...baseShift },
        expected: false,
      },
      {
        name: 'should return false when cutoff has passed',
        event: { ...baseEvent, interestListAutoAssignCutoff: subSeconds(defaultNow, 1) },
        shift: { ...baseShift },
        expected: false,
      },
      {
        name: 'should return false when shift is locked',
        event: { ...baseEvent },
        shift: { ...baseShift, locked: true },
        expected: false,
      },
      {
        name: 'should return false for user specific case (cutoff passed)',
        event: {
          scheduledCloseInterestList: new Date('2025-08-18T17:00:00.000Z'),
          interestListAutoAssignCutoff: new Date('2025-12-07T18:00:00.000Z'),
        },
        shift: { locked: false },
        expected: false,
        now: new Date('2025-12-14T13:24:39.746Z'),
      },
      {
        name: 'should return true if scheduledCloseInterestList is missing (defaults to past) and within cutoff',
        event: { ...baseEvent, scheduledCloseInterestList: undefined },
        shift: { ...baseShift },
        expected: true,
      },
      {
        name: 'should return true if interestListAutoAssignCutoff is missing (defaults to future)',
        event: { ...baseEvent, interestListAutoAssignCutoff: undefined },
        shift: { ...baseShift },
        expected: true,
      },
    ])('$name', ({ event, shift, expected, now }) => {
      jest.useFakeTimers().setSystemTime(now || defaultNow);
      const result = InterestListService.shouldTriggerInterestListAssignment(
        event as IEvent,
        shift as IShift
      );
      expect(result).toBe(expected);
    });
  });
});
