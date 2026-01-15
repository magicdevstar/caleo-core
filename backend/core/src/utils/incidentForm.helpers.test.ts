import { describe, it, expect } from '@jest/globals'
import { extractTimeRange, doTimeRangesOverlap, checkForTimeRangeOverlaps } from './incidentForm.helpers'
import { GraphQLError } from 'graphql'

describe('incidentForm.helpers', () => {
  describe('extractTimeRange', () => {
    it('should extract time range when rdo=no with all fields', () => {
      const timekeeping = {
        rdo: 'no',
        timeIn: new Date('2025-06-12T08:00:00Z'),
        timeOut: new Date('2025-06-12T16:00:00Z'),
        overtimeTimeIn: new Date('2025-06-12T16:00:00Z'),
        overtimeTimeOut: new Date('2025-06-12T18:00:00Z'),
      }

      const result = extractTimeRange(timekeeping)

      // Should use earliest (timeIn: 08:00) and latest (overtimeTimeOut: 18:00)
      expect(result.startTime.toISOString()).toBe('2025-06-12T08:00:00.000Z')
      expect(result.endTime.toISOString()).toBe('2025-06-12T18:00:00.000Z')
    })

    it('should extract time range when rdo=yes with only overtime', () => {
      const timekeeping = {
        rdo: 'yes',
        overtimeTimeIn: new Date('2025-06-12T08:00:00Z'),
        overtimeTimeOut: new Date('2025-06-12T12:00:00Z'),
      }

      const result = extractTimeRange(timekeeping)

      expect(result.startTime.toISOString()).toBe('2025-06-12T08:00:00.000Z')
      expect(result.endTime.toISOString()).toBe('2025-06-12T12:00:00.000Z')
    })

    it('should throw error when rdo=no and timeIn is missing', () => {
      const timekeeping = {
        rdo: 'no',
        timeOut: new Date('2025-06-12T16:00:00Z'),
        overtimeTimeIn: new Date('2025-06-12T16:00:00Z'),
        overtimeTimeOut: new Date('2025-06-12T18:00:00Z'),
      }

      expect(() => extractTimeRange(timekeeping)).toThrow(GraphQLError)
      expect(() => extractTimeRange(timekeeping)).toThrow("Straight time in is required when rdo is 'no'")
    })

    it('should throw error when rdo=no and timeOut is missing', () => {
      const timekeeping = {
        rdo: 'no',
        timeIn: new Date('2025-06-12T08:00:00Z'),
        overtimeTimeIn: new Date('2025-06-12T16:00:00Z'),
        overtimeTimeOut: new Date('2025-06-12T18:00:00Z'),
      }

      expect(() => extractTimeRange(timekeeping)).toThrow(GraphQLError)
      expect(() => extractTimeRange(timekeeping)).toThrow("Straight time out is required when rdo is 'no'")
    })

    it('should throw error when rdo=yes and overtimeTimeIn is missing', () => {
      const timekeeping = {
        rdo: 'yes',
        overtimeTimeOut: new Date('2025-06-12T12:00:00Z'),
      }

      expect(() => extractTimeRange(timekeeping)).toThrow(GraphQLError)
      expect(() => extractTimeRange(timekeeping)).toThrow("Overtime time in is required when rdo is 'yes'")
    })

    it('should throw error when rdo=yes and overtimeTimeOut is missing', () => {
      const timekeeping = {
        rdo: 'yes',
        overtimeTimeIn: new Date('2025-06-12T08:00:00Z'),
      }

      expect(() => extractTimeRange(timekeeping)).toThrow(GraphQLError)
      expect(() => extractTimeRange(timekeeping)).toThrow("Overtime time out is required when rdo is 'yes'")
    })

    it('should normalize times to minute precision', () => {
      const timekeeping = {
        rdo: 'yes',
        overtimeTimeIn: new Date('2025-06-12T08:00:45.123Z'), // 45 seconds, 123ms
        overtimeTimeOut: new Date('2025-06-12T12:30:59.999Z'), // 59 seconds, 999ms
      }

      const result = extractTimeRange(timekeeping)

      // Should round down to the minute
      expect(result.startTime.toISOString()).toBe('2025-06-12T08:00:00.000Z')
      expect(result.endTime.toISOString()).toBe('2025-06-12T12:30:00.000Z')
    })

    it('should extract time range when rdo=no with only straight time', () => {
      const timekeeping = {
        rdo: 'no',
        timeIn: new Date('2025-06-12T08:00:00Z'),
        timeOut: new Date('2025-06-12T16:00:00Z'),
      }

      const result = extractTimeRange(timekeeping)

      expect(result.startTime.toISOString()).toBe('2025-06-12T08:00:00.000Z')
      expect(result.endTime.toISOString()).toBe('2025-06-12T16:00:00.000Z')
    })

    it('should extract time range when rdo=no with straight time and partial overtime', () => {
      const timekeeping = {
        rdo: 'no',
        timeIn: new Date('2025-06-12T08:00:00Z'),
        timeOut: new Date('2025-06-12T16:00:00Z'),
        overtimeTimeIn: new Date('2025-06-12T16:00:00Z'),
        // overtimeTimeOut is missing - this is OK when rdo=no
      }

      const result = extractTimeRange(timekeeping)

      // Should only use straight time since overtime is incomplete
      expect(result.startTime.toISOString()).toBe('2025-06-12T08:00:00.000Z')
      expect(result.endTime.toISOString()).toBe('2025-06-12T16:00:00.000Z')
    })

    it('should ignore straight time fields when rdo=yes', () => {
      const timekeeping = {
        rdo: 'yes',
        timeIn: new Date('2025-06-12T06:00:00Z'),  // Should be ignored
        timeOut: new Date('2025-06-12T07:00:00Z'),  // Should be ignored
        overtimeTimeIn: new Date('2025-06-12T08:00:00Z'),
        overtimeTimeOut: new Date('2025-06-12T12:00:00Z'),
      }

      const result = extractTimeRange(timekeeping)

      // Should only use overtime fields, not straight time
      expect(result.startTime.toISOString()).toBe('2025-06-12T08:00:00.000Z')
      expect(result.endTime.toISOString()).toBe('2025-06-12T12:00:00.000Z')
    })

    it('should include optional overtime when rdo=no and overtime is complete', () => {
      const timekeeping = {
        rdo: 'no',
        timeIn: new Date('2025-06-12T08:00:00Z'),
        timeOut: new Date('2025-06-12T16:00:00Z'),
        overtimeTimeIn: new Date('2025-06-12T16:00:00Z'),
        overtimeTimeOut: new Date('2025-06-12T20:00:00Z'),
      }

      const result = extractTimeRange(timekeeping)

      // Should use earliest (timeIn: 08:00) and latest (overtimeTimeOut: 20:00)
      expect(result.startTime.toISOString()).toBe('2025-06-12T08:00:00.000Z')
      expect(result.endTime.toISOString()).toBe('2025-06-12T20:00:00.000Z')
    })
  })

  describe('doTimeRangesOverlap', () => {
    it('should detect overlap when ranges partially overlap', () => {
      const range1 = {
        startTime: new Date('2025-06-12T08:00:00Z'),
        endTime: new Date('2025-06-12T14:00:00Z'),
      }
      const range2 = {
        startTime: new Date('2025-06-12T12:00:00Z'),
        endTime: new Date('2025-06-12T16:00:00Z'),
      }

      expect(doTimeRangesOverlap(range1, range2)).toBe(true)
    })

    it('should detect overlap when one range contains another', () => {
      const range1 = {
        startTime: new Date('2025-06-12T08:00:00Z'),
        endTime: new Date('2025-06-12T18:00:00Z'),
      }
      const range2 = {
        startTime: new Date('2025-06-12T10:00:00Z'),
        endTime: new Date('2025-06-12T14:00:00Z'),
      }

      expect(doTimeRangesOverlap(range1, range2)).toBe(true)
      expect(doTimeRangesOverlap(range2, range1)).toBe(true) // Order shouldn't matter
    })

    it('should NOT detect overlap when ranges only touch (Option A)', () => {
      const range1 = {
        startTime: new Date('2025-06-12T08:00:00Z'),
        endTime: new Date('2025-06-12T12:00:00Z'),
      }
      const range2 = {
        startTime: new Date('2025-06-12T12:00:00Z'),
        endTime: new Date('2025-06-12T16:00:00Z'),
      }

      expect(doTimeRangesOverlap(range1, range2)).toBe(false)
      expect(doTimeRangesOverlap(range2, range1)).toBe(false)
    })

    it('should NOT detect overlap when ranges are completely separate', () => {
      const range1 = {
        startTime: new Date('2025-06-12T08:00:00Z'),
        endTime: new Date('2025-06-12T10:00:00Z'),
      }
      const range2 = {
        startTime: new Date('2025-06-12T14:00:00Z'),
        endTime: new Date('2025-06-12T16:00:00Z'),
      }

      expect(doTimeRangesOverlap(range1, range2)).toBe(false)
      expect(doTimeRangesOverlap(range2, range1)).toBe(false)
    })

    it('should detect overlap when ranges are identical', () => {
      const range1 = {
        startTime: new Date('2025-06-12T08:00:00Z'),
        endTime: new Date('2025-06-12T12:00:00Z'),
      }
      const range2 = {
        startTime: new Date('2025-06-12T08:00:00Z'),
        endTime: new Date('2025-06-12T12:00:00Z'),
      }

      expect(doTimeRangesOverlap(range1, range2)).toBe(true)
    })
  })

  describe('checkForTimeRangeOverlaps', () => {
    it('should detect overlap with existing forms', () => {
      const existingForms = [
        {
          timekeeping: {
            rdo: 'yes',
            overtimeTimeIn: new Date('2025-06-12T08:00:00Z'),
            overtimeTimeOut: new Date('2025-06-12T14:00:00Z'),
          },
          docusignEvent: { status: 'sent' },
        },
      ] as any

      const incomingTimekeeping = {
        rdo: 'yes',
        overtimeTimeIn: new Date('2025-06-12T12:00:00Z'),
        overtimeTimeOut: new Date('2025-06-12T16:00:00Z'),
      }

      const result = checkForTimeRangeOverlaps(existingForms, incomingTimekeeping)

      expect(result.hasOverlap).toBe(true)
      expect(result.overlappingRange).toBeDefined()
      expect(result.newRange).toBeDefined()
      expect(result.overlappingRange!.startTime.toISOString()).toBe('2025-06-12T08:00:00.000Z')
      expect(result.overlappingRange!.endTime.toISOString()).toBe('2025-06-12T14:00:00.000Z')
      expect(result.newRange!.startTime.toISOString()).toBe('2025-06-12T12:00:00.000Z')
      expect(result.newRange!.endTime.toISOString()).toBe('2025-06-12T16:00:00.000Z')
    })

    it('should NOT detect overlap when ranges only touch', () => {
      const existingForms = [
        {
          timekeeping: {
            rdo: 'yes',
            overtimeTimeIn: new Date('2025-06-12T08:00:00Z'),
            overtimeTimeOut: new Date('2025-06-12T12:00:00Z'),
          },
          docusignEvent: { status: 'sent' },
        },
      ] as any

      const incomingTimekeeping = {
        rdo: 'yes',
        overtimeTimeIn: new Date('2025-06-12T12:00:00Z'),
        overtimeTimeOut: new Date('2025-06-12T16:00:00Z'),
      }

      const result = checkForTimeRangeOverlaps(existingForms, incomingTimekeeping)

      expect(result.hasOverlap).toBe(false)
    })

    it('should NOT detect overlap with no existing forms', () => {
      const existingForms = [] as any

      const incomingTimekeeping = {
        rdo: 'yes',
        overtimeTimeIn: new Date('2025-06-12T08:00:00Z'),
        overtimeTimeOut: new Date('2025-06-12T12:00:00Z'),
      }

      const result = checkForTimeRangeOverlaps(existingForms, incomingTimekeeping)

      expect(result.hasOverlap).toBe(false)
    })

    it('should skip existing forms with malformed data', () => {
      const existingForms = [
        {
          timekeeping: {
            rdo: 'yes',
            // Missing required overtimeTimeIn and overtimeTimeOut
          },
          docusignEvent: { status: 'sent' },
        },
        {
          timekeeping: {
            rdo: 'yes',
            overtimeTimeIn: new Date('2025-06-12T16:00:00Z'),
            overtimeTimeOut: new Date('2025-06-12T20:00:00Z'),
          },
          docusignEvent: { status: 'sent' },
        },
      ] as any

      const incomingTimekeeping = {
        rdo: 'yes',
        overtimeTimeIn: new Date('2025-06-12T08:00:00Z'),
        overtimeTimeOut: new Date('2025-06-12T12:00:00Z'),
      }

      const result = checkForTimeRangeOverlaps(existingForms, incomingTimekeeping)

      // Should skip the malformed first form and not detect overlap with second form
      expect(result.hasOverlap).toBe(false)
    })

    it('should throw error when incoming timekeeping is invalid', () => {
      const existingForms = [] as any

      const incomingTimekeeping = {
        rdo: 'yes',
        // Missing required overtimeTimeIn and overtimeTimeOut
      }

      expect(() => checkForTimeRangeOverlaps(existingForms, incomingTimekeeping)).toThrow(GraphQLError)
    })
  })
})
