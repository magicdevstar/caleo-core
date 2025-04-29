import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test
} from '@jest/globals';
import { OrganizationService } from './organization.service';
import { OrganizationRepo } from './organization.repository';
import { SchedulerModel } from '../scheduler';

const config = {
  timezone: 'America/Los_Angeles',
  settings: {
    lottery: {
      enabled: true,
      open: {
        // Date set with jest current time - 2024-07-25
        // time: "1970-01-01T02:00:00.000Z",
        time: "1970-01-02T18:00:00.000Z",
        dayOfWeek: "WEDNESDAY"
      },
      close: {
        // Date set with jest current time - 2024-07-28
        // time: '1970-01-01T13:00:00.000Z',
        time: "1970-01-02T06:00:00.000Z",
        dayOfWeek: "SUNDAY"
      }
    }
  }
};

describe('organization service', () => {
  const model = new OrganizationService(
    {} as unknown as OrganizationRepo,
    {} as unknown as SchedulerModel,
  );

  describe('activeLottery - Close day before open day', () => {
    describe('Start of year', () => {
      let testConfig;
      beforeEach(() => {
        testConfig = JSON.parse(JSON.stringify(config));
        testConfig.settings.lottery.open.time = '1970-01-01T02:00:00.000Z';
        testConfig.settings.lottery.open.dayOfWeek = 'FRIDAY';
        testConfig.settings.lottery.close.dayOfWeek = 'MONDAY';
        testConfig.settings.lottery.close.time = '1970-01-01T13:00:00.000Z';
        jest.useFakeTimers();
      });
  
      afterEach(() => {
        jest.setSystemTime(jest.getRealSystemTime());
        jest.useRealTimers();
      });
      
      test('should return false if we are before the open time', () => {
        const fixedDate = new Date('2024-01-13T01:30:00.000Z');
        jest.setSystemTime(fixedDate);
        expect(model.activeLottery(testConfig)).toBe(false);
      });
      test('should return true if we are at the open time', () => {
        const fixedDate = new Date('2024-01-13T02:00:00.000Z');
        jest.setSystemTime(fixedDate);
        expect(model.activeLottery(testConfig)).toBe(true);
      });
      test('should return false if we are after the close time', () => {
        const fixedDate = new Date('2024-01-15T13:00:01.000Z');
        jest.setSystemTime(fixedDate);
        expect(model.activeLottery(testConfig)).toBe(false);
      });
    });
    
    describe('End of year', () => {
      let testConfig;
      beforeEach(() => {
        testConfig = JSON.parse(JSON.stringify(config));
        testConfig.settings.lottery.open.time = '1970-01-01T02:00:00.000Z';
        testConfig.settings.lottery.open.dayOfWeek = 'FRIDAY';
        testConfig.settings.lottery.close.dayOfWeek = 'MONDAY';
        testConfig.settings.lottery.close.time = '1970-01-01T13:00:00.000Z';
        jest.useFakeTimers();
      });
  
      afterEach(() => {
        jest.setSystemTime(jest.getRealSystemTime());
        jest.useRealTimers();
      });
      
      test('should return false if we are before the open time', () => {
        const fixedDate = new Date('2024-08-17T00:30:00.000Z');
        jest.setSystemTime(fixedDate);
        expect(model.activeLottery(testConfig)).toBe(false);
      });
      test('should return true if we are at the open time', () => {
        const fixedDate = new Date('2024-08-17T01:00:00.000Z');
        jest.setSystemTime(fixedDate);
        expect(model.activeLottery(testConfig)).toBe(true);
      });
      test('should return false if we are after the close time', () => {
        const fixedDate = new Date('2024-08-19T12:00:01.000Z');
        jest.setSystemTime(fixedDate);
        expect(model.activeLottery(testConfig)).toBe(false);
      });
    });

  });

  describe('activeLottery - Close day after open day', () => {
    describe('Start of year', () => {
      let testConfig;
      beforeEach(() => {
        testConfig = JSON.parse(JSON.stringify(config));
        testConfig.settings.lottery.open.time = '1970-01-01T02:00:00.000Z';
        testConfig.settings.lottery.open.dayOfWeek = 'MONDAY';
        testConfig.settings.lottery.close.dayOfWeek = 'WEDNESDAY';
        testConfig.settings.lottery.close.time = '1970-01-01T13:00:00.000Z';
        jest.useFakeTimers();
      });
  
      afterEach(() => {
        jest.setSystemTime(jest.getRealSystemTime());
        jest.useRealTimers();
      });
      
      test('should return false if we are before the open time', () => {
        const fixedDate = new Date('2024-01-16T01:30:00.000Z');
        jest.setSystemTime(fixedDate);
        expect(model.activeLottery(testConfig)).toBe(false);
      });
      test('should return true if we are at the open time', () => {
        const fixedDate = new Date('2024-01-16T02:00:00.000Z');
        jest.setSystemTime(fixedDate);
        expect(model.activeLottery(testConfig)).toBe(true);
      });
      test('should return false if we are after the close time', () => {
        const fixedDate = new Date('2024-01-17T13:00:01.000Z');
        jest.setSystemTime(fixedDate);
        expect(model.activeLottery(testConfig)).toBe(false);
      });
    });
    
    describe('End of year', () => {
      let testConfig;
      beforeEach(() => {
        testConfig = JSON.parse(JSON.stringify(config));
        testConfig.settings.lottery.open.time = '1970-01-01T02:00:00.000Z';
        testConfig.settings.lottery.open.dayOfWeek = 'MONDAY';
        testConfig.settings.lottery.close.dayOfWeek = 'WEDNESDAY';
        testConfig.settings.lottery.close.time = '1970-01-01T13:00:00.000Z';
        jest.useFakeTimers();
      });
  
      afterEach(() => {
        jest.setSystemTime(jest.getRealSystemTime());
        jest.useRealTimers();
      });
      
      test('should return false if we are before the open time', () => {
        const fixedDate = new Date('2024-08-06T00:30:00.000Z');
        jest.setSystemTime(fixedDate);
        expect(model.activeLottery(testConfig)).toBe(false);
      });
      test('should return true if we are at the open time', () => {
        const fixedDate = new Date('2024-08-06T01:00:00.000Z');
        jest.setSystemTime(fixedDate);
        expect(model.activeLottery(testConfig)).toBe(true);
      });
      test('should return false if we are after the close time', () => {
        const fixedDate = new Date('2024-08-07T12:00:01.000Z');
        jest.setSystemTime(fixedDate);
        expect(model.activeLottery(testConfig)).toBe(false);
      });
    });

  });
});
