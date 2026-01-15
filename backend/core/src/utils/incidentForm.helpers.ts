import { GraphQLError } from 'graphql'
import { startOfMinute } from 'date-fns/startOfMinute'
import { DocusignEvent } from '../__generated__/resolvers-types'
import { IIncidentForm } from '../models/incidentForm'

export interface TimeRange {
  startTime: Date
  endTime: Date
}

export interface OverlapResult {
  hasOverlap: boolean
  overlappingRange?: TimeRange
  newRange?: TimeRange
}

/**
 * Normalize a date to minute precision by removing seconds and milliseconds
 */
function normalizeToMinute(date: Date): Date {
  return startOfMinute(date)
}

/**
 * Extract and validate time range from timekeeping data
 * @throws GraphQLError if required fields are missing
 * @returns TimeRange with startTime and endTime normalized to minute precision
 */
export function extractTimeRange(
  timekeeping: {
    rdo?: string | null
    timeIn?: Date | null
    timeOut?: Date | null
    overtimeTimeIn?: Date | null
    overtimeTimeOut?: Date | null
  }
): TimeRange {
  const times: Date[] = []

  // When rdo === "no", timeIn and timeOut are required
  if (timekeeping.rdo === 'no') {
    if (!timekeeping.timeIn) {
      throw new GraphQLError("Missing required time field: Straight time in is required when rdo is 'no'")
    }
    if (!timekeeping.timeOut) {
      throw new GraphQLError("Missing required time field: Straight time out is required when rdo is 'no'")
    }
    times.push(timekeeping.timeIn, timekeeping.timeOut)

    // When rdo === "no", overtime fields are optional but if provided, include them
    if (timekeeping.overtimeTimeIn && timekeeping.overtimeTimeOut) {
      times.push(timekeeping.overtimeTimeIn, timekeeping.overtimeTimeOut)
    }
  }

  // When rdo === "yes", overtimeTimeIn and overtimeTimeOut are required
  // Straight time fields are ignored even if present
  if (timekeeping.rdo === 'yes') {
    if (!timekeeping.overtimeTimeIn) {
      throw new GraphQLError("Missing required time field: Overtime time in is required when rdo is 'yes'")
    }
    if (!timekeeping.overtimeTimeOut) {
      throw new GraphQLError("Missing required time field: Overtime time out is required when rdo is 'yes'")
    }
    times.push(timekeeping.overtimeTimeIn, timekeeping.overtimeTimeOut)
  }

  // Find the earliest and latest times
  const normalizedTimes = times.map(normalizeToMinute)
  const startTime = new Date(Math.min(...normalizedTimes.map(t => t.getTime())))
  const endTime = new Date(Math.max(...normalizedTimes.map(t => t.getTime())))

  return { startTime, endTime }
}

/**
 * Check if two time ranges overlap (minute precision)
 * Option A: Ranges that only touch at endpoints don't overlap
 * 
 * Two ranges overlap if: start1 < end2 AND start2 < end1
 * 
 * Examples:
 * - [08:00, 12:00] and [12:00, 16:00] = NO overlap (touching)
 * - [08:00, 14:00] and [12:00, 16:00] = OVERLAP
 * - [08:00, 16:00] and [10:00, 14:00] = OVERLAP (one contains other)
 */
export function doTimeRangesOverlap(range1: TimeRange, range2: TimeRange): boolean {
  const start1 = normalizeToMinute(range1.startTime)
  const end1 = normalizeToMinute(range1.endTime)
  const start2 = normalizeToMinute(range2.startTime)
  const end2 = normalizeToMinute(range2.endTime)

  return start1.getTime() < end2.getTime() && start2.getTime() < end1.getTime()
}

/**
 * Find if incoming form overlaps with any existing forms
 * @param existingForms Array of existing incident forms with docusignEvent
 * @param incomingTimekeeping Timekeeping data from incoming submission
 * @returns OverlapResult with details about any conflict found
 */
export function checkForTimeRangeOverlaps(
  existingForms: Array<IIncidentForm & { docusignEvent?: DocusignEvent }>,
  incomingTimekeeping: {
    rdo?: string | null
    timeIn?: Date | null
    timeOut?: Date | null
    overtimeTimeIn?: Date | null
    overtimeTimeOut?: Date | null
  }
): OverlapResult {
  // Extract and validate the incoming time range
  // This will throw GraphQLError if required fields are missing
  const newRange = extractTimeRange(incomingTimekeeping)

  // Check each existing form for overlap
  for (const existingForm of existingForms) {
    try {
      const existingRange = extractTimeRange(existingForm.timekeeping)
      
      if (doTimeRangesOverlap(existingRange, newRange)) {
        return {
          hasOverlap: true,
          overlappingRange: existingRange,
          newRange,
        }
      }
    } catch {
      // If we can't extract a valid range from an existing form, skip it
      // This handles edge cases where old data might be malformed
      continue
    }
  }

  return { hasOverlap: false }
}
