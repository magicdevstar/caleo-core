import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  it
} from '@jest/globals';
import { ShiftModel } from './shift';

describe('shift service', () => {
  const model = new ShiftModel(
    { collection: jest.fn() } as any,
    {} as any
  );

  describe('createAvailability', () => {
    const timezone = 'America/Los_Angeles';

    const breakDownHours = (date: Date) => ({
      hours: date.getHours(),
      minutes: date.getMinutes(),
    });

    it('should return availability for a single day', () => {
      const fakeShift: any = {
        startTime: '2024-10-05T13:00:00.000+00:00',
        endTime: '2024-10-05T15:00:00.000+00:00'
      };
      const res = model.createAvailability(fakeShift, timezone);

      expect(res.sunday).toBe(null);
      expect(res.monday).toBe(null);
      expect(res.tuesday).toBe(null);
      expect(res.wednesday).toBe(null);
      expect(res.thursday).toBe(null);
      expect(res.friday).toBe(null);
      expect(breakDownHours(res.saturday?.startTime!)).toEqual({
        hours: 6,
        minutes: 0
      });
      expect(breakDownHours(res.saturday?.endTime!)).toEqual({
        hours: 8,
        minutes: 0
      });
    });

    it('should return availability for a saturday and sunday', () => {
      const fakeShift: any = {
        startTime: '2024-10-05T19:00:00.000+00:00',
        endTime: '2024-10-06T02:00:00.000+00:00'
      };
      const res = model.createAvailability(fakeShift, timezone);

      expect(res.sunday).toBe(null);
      expect(res.monday).toBe(null);
      expect(res.tuesday).toBe(null);
      expect(res.wednesday).toBe(null);
      expect(res.thursday).toBe(null);
      expect(res.friday).toBe(null);
      expect(breakDownHours(res.saturday?.startTime!)).toEqual({
        hours: 12,
        minutes: 0
      });
      expect(breakDownHours(res.saturday?.endTime!)).toEqual({
        hours: 19,
        minutes: 0
      });
    });
  });
});