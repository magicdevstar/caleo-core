import {
  jest,
  describe,
  expect,
  it
} from '@jest/globals';
import { docusignDates } from './date.helpers';
import { Timezone } from '../models/scheduler';

// Mock the logger
jest.mock('./logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('DocusignDates', () => {
  it('should round down start time to nearest 15 minutes', () => {
    const date = new Date('2023-10-01T12:34:56Z');
    const endDate = new Date('2023-10-01T13:34:56Z');
    const timezone = 'America/Los_Angeles' as Timezone;
    const result = docusignDates({ startTime: date, endTime: endDate, timezone, includeDriveTime: true });
    expect(result.startTime?.getMinutes()).toBe(30);
    expect(result.endTime?.getMinutes()).toBe(45);
    expect(result.formattedDiff).toBe(2.25); // 2 hours and 15 minutes
    expect(result.totalEquipmentTime).toBe(0); // No equipment time by default
  });

  it('should handle exact 15-minute boundaries', () => {
    const date = new Date('2023-10-01T12:15:00Z');
    const endDate = new Date('2023-10-01T13:30:00Z');
    const timezone = 'America/Los_Angeles' as Timezone;
    const result = docusignDates({ startTime: date, endTime: endDate, timezone, includeDriveTime: true });
    expect(result.startTime?.getMinutes()).toBe(15); // Should stay at 15
    expect(result.endTime?.getMinutes()).toBe(30); // Should stay at 30
    expect(result.formattedDiff).toBe(2.25); // 2 hours and 15 minutes
    expect(result.totalEquipmentTime).toBe(0); // No equipment time by default
  });

  it('should handle very short durations', () => {
    const date = new Date('2023-10-01T12:14:00Z');
    const endDate = new Date('2023-10-01T12:16:00Z');
    const timezone = 'America/Los_Angeles' as Timezone;
    const result = docusignDates({ startTime: date, endTime: endDate, timezone, includeDriveTime: true });
    expect(result.formattedDiff).toBe(1.5); // Should be minimum 1 hour and 15 minutes
    expect(result.totalEquipmentTime).toBe(0); // No equipment time by default
  });

  it('should handle dates close to day boundaries', () => {
    const date = new Date('2023-10-01T22:52:00Z');
    const endDate = new Date('2023-10-02T23:02:00Z');
    const timezone = 'America/Los_Angeles' as Timezone;
    const result = docusignDates({ startTime: date, endTime: endDate, timezone, includeDriveTime: true });
    // Check day transition is maintained properly
    expect(result.startTime?.getDate()).not.toBe(result.endTime?.getDate());
    expect(result.totalEquipmentTime).toBe(0); // No equipment time by default
  });

  it('should handle daylight savings time transitions', () => {
    // Use a date during DST transition for the timezone
    const date = new Date('2023-03-12T09:45:00Z'); // Day when DST starts in the US
    const endDate = new Date('2023-03-12T10:15:00Z');
    const timezone = 'America/Los_Angeles' as Timezone;
    const result = docusignDates({ startTime: date, endTime: endDate, timezone, includeDriveTime: true });
    // Mainly checks that the function doesn't throw errors and handles the transition
    expect(result.startTime).toBeDefined();
    expect(result.endTime).toBeDefined();
    expect(result.totalEquipmentTime).toBe(0); // No equipment time by default
  });

  it('should handle startEquipmentTime by subtracting hours from start time', () => {
    const date = new Date('2023-10-01T12:00:00Z');
    const endDate = new Date('2023-10-01T13:00:00Z');
    const startEquipmentTime = new Date('2023-10-01T10:00:00Z');
    const timezone = 'America/Los_Angeles' as Timezone;
    
    // With 2 hours of start equipment time
    const result = docusignDates({ 
      startTime: date, 
      endTime: endDate, 
      timezone,
      startEquipmentTime,
      includeDriveTime: true,
    });
    
    // Check that 2 hours were subtracted from start time
    // Original start time would be 5:00 AM Pacific (12:00 UTC), minus 2 hours = 3:00 AM
    expect(result.startTime?.getHours()).toBe(3);

    // Default 1 hour added to end time
    expect(result.endTime?.getHours()).toBe(7); // 13:00 UTC + 1 hour = 7:00 AM Pacific (14:00 UTC)
  });

  it('should handle endEquipmentTime by adding hours to end time', () => {
    const date = new Date('2023-10-01T12:00:00Z');
    const endDate = new Date('2023-10-01T13:00:00Z');
    const endEquipmentTime = new Date('2023-10-01T16:00:00Z');
    const timezone = 'America/Los_Angeles' as Timezone;
    
    // With 3 hours of end equipment time
    const result = docusignDates({ 
      startTime: date, 
      endTime: endDate, 
      timezone,
      endEquipmentTime,
      includeDriveTime: true,
    });
    
    // No start equipment time, so start is unmodified
    expect(result.startTime?.getHours()).toBe(5); // 12:00 UTC = 5:00 AM Pacific
    
    // End time should have 3 hours added instead of default 1
    expect(result.endTime?.getHours()).toBe(9); // 13:00 UTC + 3 hours = 9:00 AM Pacific (16:00 UTC)
  });

  it('should handle both startEquipmentTime and endEquipmentTime together', () => {
    const date = new Date('2023-10-01T12:00:00Z');
    const endDate = new Date('2023-10-01T13:00:00Z');
    const startEquipmentTime = new Date('2023-10-01T11:00:00Z');
    const endEquipmentTime = new Date('2023-10-01T15:00:00Z');
    const timezone = 'America/Los_Angeles' as Timezone;
    
    const result = docusignDates({ 
      startTime: date, 
      endTime: endDate, 
      timezone,
      startEquipmentTime,
      endEquipmentTime,
      includeDriveTime: true,
    });
    
    // Start time should be 1 hour earlier
    expect(result.startTime?.getHours()).toBe(4); // 12:00 UTC - 1 hour = 4:00 AM Pacific
    
    // End time should have 2 hours added
    expect(result.endTime?.getHours()).toBe(8); // 13:00 UTC + 2 hours = 8:00 AM Pacific
    
    // Difference should be 4 hours (original 1 hour + 1 hour start + 2 hours end)
    expect(result.formattedDiff).toBe(4);
  });

  it('should use default 1 hour for end time when endEquipmentTime is 0', () => {
    const date = new Date('2023-10-01T12:00:00Z');
    const endDate = new Date('2023-10-01T13:00:00Z');
    const timezone = 'America/Los_Angeles' as Timezone;
    
    const result = docusignDates({ 
      startTime: date, 
      endTime: endDate, 
      timezone,
      includeDriveTime: true,
    });
    
    // End time should still have default 1 hour added
    expect(result.endTime?.getHours()).toBe(7); // 13:00 UTC + 1 hour = 7:00 AM Pacific
  });

  it('Real world use case [CAL-429]', () => {
    const startTime = new Date('2025-09-21T13:00:33.647+00:00');
    const endTime = new Date('2025-09-22T01:03:03.078+00:00');
    const startEquipmentTime = new Date('2025-09-21T11:30:00.000+00:00');
    const endEquipmentTime = new Date('2025-09-22T02:30:00.000+00:00');
    const timezone = 'America/Los_Angeles' as Timezone;
    const includeDriveTime = false;
    
    const result = docusignDates({ 
      startTime, 
      endTime,
      startEquipmentTime,
      endEquipmentTime,
      timezone,
      includeDriveTime,
    });

    expect(result.formattedDiff).toBe(15);
    expect(result.totalEquipmentTime).toBe(2.75);
  });
});
