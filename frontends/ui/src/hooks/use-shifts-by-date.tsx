import { useMemo } from "react";
import BigNumber from "bignumber.js";
import { FinanceShift } from "src/__generated__/resolvers-types";
import { useAuthContext } from "src/auth/hooks";
import { convertDate } from "src/hooks/use-datejs";
import { FrontendUser } from "src/api/user";

export interface TimeBucket {
  label: string;
  start: Date;
  end: Date;
  count: number;
  totalCost: number;
}

export interface BucketingOptions {
  bucketType: 'day' | 'week' | 'month' | 'quarter' | 'year';
  bucketCount: number;
  startDate: Date;
  endDate: Date;
}

/**
 * Determines optimal bucket configuration based on time span
 */
export function calculateOptimalBuckets(oldestDate: Date, newestDate: Date): BucketingOptions {
  const timeSpan = newestDate.getTime() - oldestDate.getTime();
  const daySpan = timeSpan / (1000 * 60 * 60 * 24);

  let bucketType: 'day' | 'week' | 'month' | 'quarter' | 'year';
  let bucketCount: number;

  if (daySpan <= 14) {
    // Less than 2 weeks: daily buckets
    bucketType = 'day';
    bucketCount = Math.max(2, Math.ceil(daySpan));
  } else if (daySpan <= 90) {
    // Less than 3 months: weekly buckets
    bucketType = 'week';
    bucketCount = Math.max(2, Math.ceil(daySpan / 7));
  } else if (daySpan <= 730) {
    // Less than 2 years: monthly buckets
    bucketType = 'month';
    bucketCount = Math.max(2, Math.ceil(daySpan / 30));
  } else if (daySpan <= 1460) {
    // Less than 4 years: quarterly buckets
    bucketType = 'quarter';
    bucketCount = Math.max(2, Math.ceil(daySpan / 90));
  } else {
    // 4+ years: yearly buckets
    bucketType = 'year';
    bucketCount = Math.max(2, Math.ceil(daySpan / 365));
  }

  return {
    bucketType,
    bucketCount,
    startDate: oldestDate,
    endDate: newestDate,
  };
}

/**
 * Generates time buckets based on the provided options
 */
export function generateTimeBuckets(options: BucketingOptions, user: FrontendUser): TimeBucket[] {
  const { bucketType, bucketCount, startDate } = options;
  const buckets: TimeBucket[] = [];

  for (let i = 0; i < bucketCount; i+=1) {
    let bucketLabel: string;
    let bucketStart: Date;
    let bucketEnd: Date;

    switch (bucketType) {
      case 'day':
        bucketStart = convertDate({ date: new Date(startDate), user }).toDate();
        bucketStart.setDate(startDate.getDate() + i);
        bucketEnd = convertDate({ date: new Date(bucketStart), user }).toDate();
        bucketEnd.setDate(bucketStart.getDate() + 1);
        bucketLabel = bucketStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        break;
      case 'week':
        bucketStart = convertDate({ date: new Date(startDate), user }).toDate();
        bucketStart.setDate(startDate.getDate() + (i * 7));
        bucketEnd = convertDate({ date: new Date(bucketStart), user }).toDate();
        bucketEnd.setDate(bucketStart.getDate() + 7);
        bucketLabel = `Week ${i + 1}`;
        break;
      case 'month':
        bucketStart = convertDate({ date: new Date(startDate), user }).toDate();
        bucketStart.setMonth(startDate.getMonth() + i);
        bucketEnd = convertDate({ date: new Date(bucketStart), user }).toDate();
        bucketEnd.setMonth(bucketStart.getMonth() + 1);
        bucketLabel = bucketStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        break;
      case 'quarter':
        bucketStart = convertDate({ date: new Date(startDate), user }).toDate();
        bucketStart.setMonth(startDate.getMonth() + (i * 3));
        bucketEnd = convertDate({ date: new Date(bucketStart), user }).toDate();
        bucketEnd.setMonth(bucketStart.getMonth() + 3);
        bucketLabel = `Q${Math.floor(bucketStart.getMonth() / 3) + 1} ${bucketStart.getFullYear()}`;
        break;
      case 'year':
        bucketStart = convertDate({ date: new Date(startDate), user }).toDate();
        bucketStart.setFullYear(startDate.getFullYear() + i);
        bucketEnd = convertDate({ date: new Date(bucketStart), user }).toDate();
        bucketEnd.setFullYear(bucketStart.getFullYear() + 1);
        bucketLabel = bucketStart.getFullYear().toString();
        break;
      default:
        bucketStart = convertDate({ date: new Date(startDate), user }).toDate();
        bucketEnd = convertDate({ date: new Date(options.endDate), user }).toDate();
        bucketLabel = 'All Time';
    }

    buckets.push({
      label: bucketLabel,
      start: bucketStart,
      end: bucketEnd,
      count: 0,
      totalCost: 0,
    });
  }

  return buckets;
}

/**
 * Calculates shift cost for a single shift
 */
export function calculateShiftCost(shift: FinanceShift): number {
  const overtimeCost = new BigNumber(shift.totalOvertimeHours || 0).multipliedBy(shift.user?.member?.incidentHourlyRate || shift.rank?.incidentHourlyRate || 0).multipliedBy(1.5);
  const straightCost = new BigNumber(shift.totalStraightHours || 0).multipliedBy(shift.user?.member?.hourlyRate || shift.rank?.hourlyRate || 0);
  const shiftPersonnelCost = overtimeCost.plus(straightCost);
  const vehicleMileageCost = new BigNumber(shift.totalVehicleMilage || 0).multipliedBy(shift.vehicleCategory?.milageRate || 0);
  return shiftPersonnelCost.plus(vehicleMileageCost).toNumber();
}

/**
 * Groups shifts into time buckets
 */
export function groupShiftsIntoBuckets(shifts: FinanceShift[], buckets: TimeBucket[], user: FrontendUser): TimeBucket[] {
  const result = buckets.map(bucket => ({ ...bucket })); // Create a copy

  shifts.forEach((shift) => {
    if (shift.startTime) {
      const shiftDate = convertDate({ date: new Date(shift.startTime), user }).toDate();
      const shiftCost = calculateShiftCost(shift);

      // Find the appropriate bucket for this shift
      const bucketIndex = result.findIndex(bucket => 
        shiftDate >= bucket.start && shiftDate <= bucket.end
      );

      if (bucketIndex !== -1) {
        result[bucketIndex].count += 1;
        result[bucketIndex].totalCost += shiftCost;
      }
    }
  });

  return result;
}

export const useShiftsByDate = (data: FinanceShift[]) => {
  const { user } = useAuthContext();

  const res = useMemo(() => {
    if (data.length === 0) {
      return {
        categories: [],
        series: [],
      };
    }

    // Find the oldest and newest shift dates
    const allDates = data
      .filter(shift => shift.startTime)
      .map(shift => convertDate({ date: new Date(shift.startTime!), user }).toDate())
      .sort((a, b) => a.getTime() - b.getTime());

    if (allDates.length === 0) {
      return {
        categories: [],
        series: [],
      };
    }

    const oldestDate = allDates[0];
    const newestDate = allDates[allDates.length - 1];

    // Calculate optimal buckets
    const bucketingOptions = calculateOptimalBuckets(oldestDate, newestDate);
    
    // Generate time buckets
    const timeBuckets = generateTimeBuckets(bucketingOptions, user);
    
    // Group shifts into buckets
    const populatedBuckets = groupShiftsIntoBuckets(data, timeBuckets, user);

    // Create series data for LineChart
    const categories = populatedBuckets.map(bucket => bucket.label);
    const series = [{
      year: `${oldestDate.getFullYear()}-${newestDate.getFullYear()}`,
      data: [
        {
          name: 'Total Shifts',
          data: populatedBuckets.map(bucket => bucket.count),
        },
      ],
    }];

    return {
      categories,
      series,
    };
  }, [data, user]);

  return res;
};
