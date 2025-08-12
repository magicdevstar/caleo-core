import { useMemo } from "react";
import BigNumber from "bignumber.js";
import { FinanceShift } from "src/__generated__/resolvers-types";
import { useShiftsByDate } from "./use-shifts-by-date";

export const useFinanceCalculations = (data: FinanceShift[]) => {
  const shiftsByDate = useShiftsByDate(data);
  const res = useMemo(() => {
    const totalCost = {
      title: "Total Cost",
      percent: 0, // You may want to calculate this based on some comparison metric
      total: 0,
      chart: {
        colors: [], // Will use default colors from theme
        series: [0], // You may want to provide meaningful chart data
        options: {}
      }
    };
  
    // Calculate total cost for all shifts
    let personnelCost = new BigNumber(0);
    let equipmentCost = new BigNumber(0);
  
    // Track overtime and straight costs separately for costByTimeType
    let totalOvertimeCost = new BigNumber(0);
    let totalStraightCost = new BigNumber(0);

    // Track costs by rank for costsByRank
    const rankCosts: { [key: string]: { overtime: BigNumber; straight: BigNumber } } = {};

    // Track shifts by rank for shiftsByRank
    const rankShifts: { [key: string]: number } = {};

    // Track shifts by division for shiftsByDivision
    const divisionShifts: { [key: string]: number } = {};

    data.forEach((shift) => {
      // Personnel Cost calculation
      const overtimeCost = new BigNumber(shift.totalOvertimeHours || 0).multipliedBy(shift.user?.member?.incidentHourlyRate || shift.rank?.incidentHourlyRate || 0).multipliedBy(1.5);
      const straightCost = new BigNumber(shift.totalStraightHours || 0).multipliedBy(shift.user?.member?.hourlyRate || shift.rank?.hourlyRate || 0);
      const shiftPersonnelCost = overtimeCost.plus(straightCost);
      
      // Equipment Cost calculation
      const vehicleMileageCost = new BigNumber(shift.totalVehicleMilage || 0).multipliedBy(shift.vehicleCategory?.milageRate || 0);

      personnelCost = personnelCost.plus(shiftPersonnelCost);
      
      // Track for costByTimeType
      totalOvertimeCost = totalOvertimeCost.plus(overtimeCost);
      totalStraightCost = totalStraightCost.plus(straightCost);

      // Track costs by rank
      const rankName = shift.rank?.name || 'Unassigned';
      if (!rankCosts[rankName]) {
        rankCosts[rankName] = { overtime: new BigNumber(0), straight: new BigNumber(0) };
      }
      rankCosts[rankName].overtime = rankCosts[rankName].overtime.plus(overtimeCost);
      rankCosts[rankName].straight = rankCosts[rankName].straight.plus(straightCost);

      // Track shifts by rank
      if (!rankShifts[rankName]) {
        rankShifts[rankName] = 0;
      }
      rankShifts[rankName] += 1;

      // Track shifts by division
      const divisionName = shift.division?.name || 'Unassigned';
      if (!divisionShifts[divisionName]) {
        divisionShifts[divisionName] = 0;
      }
      divisionShifts[divisionName] += 1;
  
      equipmentCost = equipmentCost.plus(vehicleMileageCost);
    });
  
    totalCost.total = personnelCost.plus(equipmentCost).toNumber();

    // Prepare costsByRank data for ChartColumnStacked
    const rankNames = Object.keys(rankCosts);
    const overtimeData = rankNames.map((rankName) => rankCosts[rankName].overtime.toNumber());
    const straightData = rankNames.map((rankName) => rankCosts[rankName].straight.toNumber());

    // Prepare totalShifts data for BookingTotalIncomes
    const totalShifts = {
      title: "Total Shifts",
      total: data.length,
      percent: 0, // Hardcoded to 0 as requested
      chart: {
        series: shiftsByDate.categories.map((category, index) => ({
          x: category,
          y: shiftsByDate.series[0]?.data[0]?.data[index] || 0, // Get shift count from first series
        })),
      },
    };

    // Prepare shiftsByRank data for AnalyticsCurrentVisits
    const shiftsByRank = {
      series: Object.keys(rankShifts).map((rankName) => ({
        label: rankName,
        value: rankShifts[rankName],
      })),
    };

    // Prepare shiftsByDivision data for AnalyticsCurrentVisits
    const shiftsByDivision = {
      series: Object.keys(divisionShifts).map((divisionName) => ({
        label: divisionName,
        value: divisionShifts[divisionName],
      })),
    };

    return {
      totalCost,
      personnelCost: {
        title: "Personnel Cost",
        total: personnelCost.toNumber(),
        icon: 'solar:user-rounded-bold',
        chart: {
          series: parseFloat(personnelCost.dividedBy(totalCost.total).multipliedBy(100).toFixed(2)),
        },
      },
      equipmentCost: {
        title: "Equipment Cost",
        total: equipmentCost.toNumber(),
        icon: 'solar:delivery-bold-duotone',
        color: 'info',
        chart: {
          series: parseFloat(equipmentCost.dividedBy(totalCost.total).multipliedBy(100).toFixed(2)),
        },
      },
      costByTimeType: {
        series: [
          {
            label: 'Overtime',
            value: totalOvertimeCost.toNumber(),
          },
          {
            label: 'Straight',
            value: totalStraightCost.toNumber(),
          }
        ],
      },
      costsByRank: {
        categories: rankNames,
        series: [
          {
            name: 'Overtime',
            data: overtimeData,
          },
          {
            name: 'Straight',
            data: straightData,
          }
        ],
      },
      totalShifts,
      shiftsByRank,
      shiftsByDivision,
      shiftsByDate
    };
  }, [data, shiftsByDate]);

  return res;
};
