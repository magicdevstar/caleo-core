import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test
} from '@jest/globals';
import { OrganizationModel } from './organization';

const config = {
  timezone: "America/Chicago",
  features: {
    lottery: true
  },
  settings: {
    lottery: {
      enabled: true,
      open: {
        // Date set with jest current time - 2024-07-25
        time: "1970-01-02T18:00:00.000Z",
        dayOfWeek: "WEDNESDAY"
      },
      close: {
        // Date set with jest current time - 2024-07-28
        time: "1970-01-02T06:00:00.000Z",
        dayOfWeek: "SUNDAY"
      }
    }
  }
};

describe('organization service', () => {
  const model = new OrganizationModel(
    { collection: jest.fn() } as any,
    {} as any
  );
  describe('activeLottery - start day of week after close day of week', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.setSystemTime(jest.getRealSystemTime());
      jest.useRealTimers();
    });

    test('returns false if the current date is before the open date time', () => {
      // 1 minute before open
      const fixedDate = new Date('2024-07-24T17:59:00.000Z');
      jest.setSystemTime(fixedDate);
      const testConfig = JSON.parse(JSON.stringify(config));

      expect(model.activeLottery(testConfig)).toBe(false);
    });

    test('returns true if the current date is between the open and close date time', () => {
      // 1 minute before close
      const fixedDate = new Date('2024-07-27T23:59:00Z');
      jest.setSystemTime(fixedDate);
      const testConfig = JSON.parse(JSON.stringify(config));

      expect(model.activeLottery(testConfig)).toBe(true);
    });

    test('returns false if the current date is after the close date time', () => {
      // 1 minute after close
      const fixedDate = new Date('2024-07-28T06:01:00Z');
      jest.setSystemTime(fixedDate);
      const testConfig = JSON.parse(JSON.stringify(config));

      expect(model.activeLottery(testConfig)).toBe(false);
    });
  });

  describe('activeLottery - start day of week before close day of week', () => {
    let testConfig;
    beforeEach(() => {
      testConfig = JSON.parse(JSON.stringify(config));
      // 2024-07-28T18:00:00.000Z
      testConfig.settings.lottery.open.dayOfWeek = 'SUNDAY';
      // 2024-07-31T06:00:00.000Z
      testConfig.settings.lottery.close.dayOfWeek = 'WEDNESDAY';
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.setSystemTime(jest.getRealSystemTime());
      jest.useRealTimers();
    });

    test('returns false if the current date is before the open date time', () => {
      const fixedDate = new Date('2024-07-28T17:59:00Z');
      jest.setSystemTime(fixedDate);

      expect(model.activeLottery(testConfig)).toBe(false);
    });

    test('returns true if the current date is between the open and close date time', () => {
      const fixedDate = new Date('2024-07-31T05:59:00Z');
      jest.setSystemTime(fixedDate);

      expect(model.activeLottery(testConfig)).toBe(true);
    });

    test('returns false if the current date is after the close date time', () => {
      const fixedDate = new Date('2024-07-31T06:01:00Z');
      jest.setSystemTime(fixedDate);

      expect(model.activeLottery(testConfig)).toBe(false);
    });
  });

  describe('activeLottery - Beginning of the year', () => {
    let testConfig;
    beforeEach(() => {
      testConfig = JSON.parse(JSON.stringify(config));
      // 2024-01-01T18:00:00.000Z
      testConfig.settings.lottery.open.dayOfWeek = 'MONDAY';
      // 2024-01-03T06:00:00.000Z
      testConfig.settings.lottery.close.dayOfWeek = 'WEDNESDAY';
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.setSystemTime(jest.getRealSystemTime());
      jest.useRealTimers();
    });

    test('returns false if the current date is before the open date time', () => {
      const fixedDate = new Date('2024-01-01T17:59:00Z');
      jest.setSystemTime(fixedDate);

      expect(model.activeLottery(testConfig)).toBe(false);
    });

    test('returns true if the current date is between the open and close date time', () => {
      const fixedDate = new Date('2024-01-03T05:59:00Z');
      jest.setSystemTime(fixedDate);

      expect(model.activeLottery(testConfig)).toBe(true);
    });

    test('returns false if the current date is after the close date time', () => {
      const fixedDate = new Date('2024-01-03T06:01:00Z');
      jest.setSystemTime(fixedDate);

      expect(model.activeLottery(testConfig)).toBe(false);
    });
  });
});
