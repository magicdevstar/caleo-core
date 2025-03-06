import {
  describe,
  expect,
  it
} from '@jest/globals';
import { phoneNumberParser } from './phone';

describe('Phone', () => {
  describe('parseNumber', () => {
    it('should basic phone number format', () => {
      const parsed = phoneNumberParser('(323) 980-2067');
      expect(parsed).toBe('+13239802067');
    });

    it('should parse with dashes', () => {
      const parsed = phoneNumberParser('323-980-2067');
      expect(parsed).toBe('+13239802067');
    });

    it('should parse matching phone number', () => {
      const parsed = phoneNumberParser('+13239802067');
      expect(parsed).toBe('+13239802067');
    });

    it('should return undefined if blank', () => {
      const parsed = phoneNumberParser();
      expect(parsed).toBe(undefined);
    });

    it('should return undefined if phone number is malformed', () => {
      const parsed = phoneNumberParser('1234');
      expect(parsed).toBe(undefined);
    });

    it('should handle fucked formatting', () => {
      const parsed = phoneNumberParser('(765 --8198765');
      expect(parsed).toBe('+17658198765');
    });
  });
});
