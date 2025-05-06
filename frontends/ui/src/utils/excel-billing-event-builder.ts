import ExcelJS from 'exceljs';
import { Event, Shift } from 'src/__generated__/resolvers-types';
import { FrontendUser } from 'src/api/user';
import { convertDate, dateFormat, miniDateFormat } from 'src/hooks/use-datejs';
import { calculateHoursBetweenDateStrings } from './time-calc';
import { getCellSumByColumnFormula, getColSumRangeFormula } from './excel-formulas';

export function modifyReportHeader(event: Event, worksheet: ExcelJS.Worksheet, user: FrontendUser) {
  const eventDate = event.startTime
    ? convertDate({ date: event.startTime, user }).format(dateFormat)
    : '';
  worksheet.getCell('A1').value = worksheet
    .getCell('A1')
    .value?.toString()
    .replace('[event name]', event?.name)
    .replace('[city]', event.venue?.city || '')
    .replace('[ocn]', event.ocn || '')
    .replace('[date]', eventDate);
}

export function generatePayAndLeaveWorksheet(
  shifts: Shift[],
  worksheet: ExcelJS.Worksheet,
  user: FrontendUser
) {
  // initialize template props
  const headerRows = 2;
  const defaultNumberOfRows = 123;

  // add or remove rows from template
  const rowDiff = Math.abs(shifts.length - defaultNumberOfRows);
  if (shifts?.length > defaultNumberOfRows) {
    worksheet.duplicateRow(headerRows + defaultNumberOfRows, rowDiff, true);
  } else if (shifts?.length < defaultNumberOfRows) {
    worksheet.spliceRows(headerRows + shifts.length, rowDiff);
  }

  let totalTravelTime = 0;
  let totalTime = 0;
  shifts.forEach((shift, index) => {
    const rowIdx = headerRows + index + 1;
    const row = worksheet.getRow(rowIdx);
    // number
    row.getCell(1).value = index + 1;
    // Name
    row.getCell(2).value = shift.user?.name || '';
    // Employee Number
    row.getCell(3).value = shift.user?.member?.pNumber || '';
    // Rank
    row.getCell(4).value = shift.user?.member?.rank?.name || '';
    // Call Sign
    row.getCell(5).value = shift.docusignEvent?.signerDetails?.[0]?.data?.callSign || '';
    // Date
    row.getCell(6).value = shift.startTime
      ? convertDate({ date: shift.startTime, user }).format(miniDateFormat)
      : '';

    // Calculate Overtime Hours Worked
    let hoursWorked = 0;
    if (shift.shiftCheckInOut?.checkInTime && shift.shiftCheckInOut?.checkOutTime) {
      hoursWorked = calculateHoursBetweenDateStrings(
        shift.shiftCheckInOut.checkInTime,
        shift.shiftCheckInOut.checkOutTime
      );
    } else {
      hoursWorked = calculateHoursBetweenDateStrings(shift.startTime, shift.endTime);
    }
    // Overtime Hours Worked
    row.getCell(7).value = hoursWorked;

    // Travel Time & Equipment Time - Only change if equipment time is logged.
    const equipmentCheckInTime = shift.shiftCheckInOut?.equipmentDetails?.checkInTime;
    const equipmentCheckOutTime = shift.shiftCheckInOut?.equipmentDetails?.checkOutTime;
    if (equipmentCheckInTime && equipmentCheckOutTime) {
      // Travel Time (Default is 1)
      row.getCell(8).value = 0;

      // Calculate Equipment Time
      const equipmentHours = calculateHoursBetweenDateStrings(
        equipmentCheckInTime,
        equipmentCheckOutTime
      );
      // Equipment Time
      row.getCell(9).value = equipmentHours;
    }

    // NOTE: Not sure if I actually have to calculate the result of formulas as it works without, but docs recommend it.
    // Some reports say it is because if opened in protected view, it will not calculate and only show the result.
    const rowSumValue = row.getCell(11).value as ExcelJS.CellFormulaValue;
    row.getCell(11).value = {
      ...rowSumValue,
      result:
        (row.getCell(7).value as number) +
        (row.getCell(8).value as number) +
        (row.getCell(9).value as number),
    };
    totalTravelTime += row.getCell(8).value as number;
    totalTime += row.getCell(11).value as number;
  });

  const lastRowIdx = headerRows + shifts.length + 1;
  const lastRow = worksheet.getRow(lastRowIdx);

  const lastRowTravelTimeFormula = lastRow.getCell(8).formula;
  lastRow.getCell(8).value = {
    formula: lastRowTravelTimeFormula.replace('H$125', `H$${lastRowIdx - 1}`),
    result: totalTravelTime,
  };
  const lastRowTotalTimeFormula = lastRow.getCell(11).formula;
  lastRow.getCell(11).value = {
    formula: lastRowTotalTimeFormula.replace('K$125', `K$${lastRowIdx - 1}`),
    result: totalTime,
  };
}

export function generateContractLawWorksheet(
  shiftsByRank: Record<string, Shift[]>,
  worksheet: ExcelJS.Worksheet,
  user: FrontendUser
) {
  // initialize template totals and props
  const headerRows = 2;
  const completeTotal = {
    overtime: 0,
    travelTime: 0,
    equipment: 0,
    grandTotal: 0,
    rows: [] as number[],
  };
  let rowIdx = 1 + headerRows;

  // get initial empty template row values that will be cloned during iteration
  const emptyRow = worksheet.getRow(rowIdx).values as ExcelJS.CellValue[];
  const headerRow = worksheet.getRow(rowIdx + 1).values as ExcelJS.CellValue[];

  Object.entries(shiftsByRank).forEach(([rankId, shifts], idx) => {
    // return if no shifts
    if (!shifts?.length) {
      return;
    }

    // only create blank rows if not on 1st iteration since template already has initial rows
    if (idx !== 0) {
      worksheet.insertRows(rowIdx, [headerRow], 'i+');
      worksheet.insertRows(rowIdx, [emptyRow], 'n');
      worksheet.getRow(rowIdx).eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.fill = worksheet.getRow(rowIdx - 2).getCell(colNum).fill;
        cell.style = worksheet.getRow(rowIdx - 2).getCell(colNum).style;
        cell.border = worksheet.getRow(rowIdx - 2).getCell(colNum).border;
        cell.font = worksheet.getRow(rowIdx - 2).getCell(colNum).font;
      });
    }
    // add more rows if more than 1 shift exists
    if (shifts.length > 1) {
      worksheet.duplicateRow(rowIdx, shifts.length - 1, true);
    }

    const perRankTotals = {
      overtime: 0,
      travelTime: 0,
      equipment: 0,
      grandTotal: 0,
    };

    shifts.forEach((shift, shiftIdx) => {
      const shiftRow = worksheet.getRow(rowIdx);
      // Name
      shiftRow.getCell(1).value = shift.user?.name || '';
      // Employee Number
      shiftRow.getCell(2).value = shift.user?.member?.pNumber || '';
      // Rank
      shiftRow.getCell(3).value = shift.user?.member?.rank?.name || '';
      // Call Sign
      shiftRow.getCell(4).value = shift.docusignEvent?.signerDetails?.[0]?.data?.callSign || '';
      // Date
      shiftRow.getCell(5).value = shift.startTime
        ? convertDate({ date: shift.startTime, user }).format(miniDateFormat)
        : '';

      // Calculate Overtime Hours Worked
      let hoursWorked = 0;
      if (shift.shiftCheckInOut?.checkInTime && shift.shiftCheckInOut?.checkOutTime) {
        hoursWorked = calculateHoursBetweenDateStrings(
          shift.shiftCheckInOut.checkInTime,
          shift.shiftCheckInOut.checkOutTime
        );
      } else {
        hoursWorked = calculateHoursBetweenDateStrings(shift.startTime, shift.endTime);
      }
      // Overtime Hours Worked
      shiftRow.getCell(6).value = hoursWorked;

      // Travel Time & Equipment Time - Only change if equipment time is logged.
      const equipmentCheckInTime = shift.shiftCheckInOut?.equipmentDetails?.checkInTime;
      const equipmentCheckOutTime = shift.shiftCheckInOut?.equipmentDetails?.checkOutTime;
      if (equipmentCheckInTime && equipmentCheckOutTime) {
        // Travel Time (Default is 1)
        shiftRow.getCell(7).value = 0;

        // Calculate Equipment Time
        const equipmentHours = calculateHoursBetweenDateStrings(
          equipmentCheckInTime,
          equipmentCheckOutTime
        );
        // Equipment Time
        shiftRow.getCell(8).value = equipmentHours;
      }

      // Total Overtime Hours
      shiftRow.getCell(10).value =
        (shiftRow.getCell(7).value as number) +
        (shiftRow.getCell(8).value as number) +
        (shiftRow.getCell(9).value as number);

      // Add to per rank totals
      perRankTotals.overtime += shiftRow.getCell(6).value as number;
      perRankTotals.travelTime += shiftRow.getCell(7).value as number;
      perRankTotals.equipment += shiftRow.getCell(8).value as number;
      perRankTotals.grandTotal += shiftRow.getCell(10).value as number;

      // jump to next row
      rowIdx += 1;
    });

    // fill out per rank totals
    const perRankTotalRow = worksheet.getRow(rowIdx);
    const rankTitle = shifts[0].user?.member?.rank?.name || '';
    const rankTitleLabel = perRankTotalRow.getCell(5).value as string;
    // Rank Title Header
    perRankTotalRow.getCell(5).value = rankTitleLabel.replace('[rank]', rankTitle);

    const rangeMin = rowIdx - shifts.length;
    const rangeMax = rowIdx - 1;
    // Total Rank Overtime Hours
    perRankTotalRow.getCell(6).value = {
      formula: getColSumRangeFormula(rangeMin, rangeMax, 'F'),
      result: perRankTotals.overtime,
    };
    // Total Rank Travel Time
    perRankTotalRow.getCell(7).value = {
      formula: getColSumRangeFormula(rangeMin, rangeMax, 'G'),
      result: perRankTotals.travelTime,
    };
    // Total Rank Equipment Time
    perRankTotalRow.getCell(8).value = {
      formula: getColSumRangeFormula(rangeMin, rangeMax, 'H'),
      result: perRankTotals.equipment,
    };
    // Total Rank Administrative Time (This is skipped, but should still leave formula)
    perRankTotalRow.getCell(9).value = {
      formula: getColSumRangeFormula(rangeMin, rangeMax, 'I'),
      result: 0,
    };
    // Grand Total Rank Time
    perRankTotalRow.getCell(10).value = {
      formula: getColSumRangeFormula(rangeMin, rangeMax, 'J'),
      result: perRankTotals.grandTotal,
    };

    // Add per rank totals to Complete Total
    completeTotal.overtime += perRankTotals.overtime;
    completeTotal.travelTime += perRankTotals.travelTime;
    completeTotal.equipment += perRankTotals.equipment;
    completeTotal.grandTotal += perRankTotals.grandTotal;
    completeTotal.rows.push(rowIdx);

    // jump to next row
    rowIdx += 1;
  });

  // NOTE: Not sure if I actually have to calculate the result of formulas as it works without, but docs recommend it.
  // Some reports say it is because if opened in protected view, it will not calculate and only show the result.
  const lastRowIdx = rowIdx;
  const lastRow = worksheet.getRow(lastRowIdx);

  // Re-merge last row cells due to bug where moving merged cells causes them to become unmerged
  worksheet.mergeCells(`A${rowIdx}:E${rowIdx}`);

  // Complete Total Overtime Hours
  lastRow.getCell(6).value = {
    formula: getCellSumByColumnFormula(completeTotal.rows, 'F'),
    result: completeTotal.overtime,
  };
  // Complete Total Travel Time
  lastRow.getCell(7).value = {
    formula: getCellSumByColumnFormula(completeTotal.rows, 'G'),
    result: completeTotal.travelTime,
  };
  // Complete Total Equipment Time
  lastRow.getCell(8).value = {
    formula: getCellSumByColumnFormula(completeTotal.rows, 'H'),
    result: completeTotal.equipment,
  };
  // Complete Total Administrative Time (This is skipped, but should still leave formula)
  lastRow.getCell(9).value = {
    formula: getCellSumByColumnFormula(completeTotal.rows, 'I'),
    result: 0,
  };
  // Complete Grand Total Overtime Hours
  lastRow.getCell(10).value = {
    formula: getCellSumByColumnFormula(completeTotal.rows, 'J'),
    result: completeTotal.grandTotal,
  };
}

export function generateContractLawVehicleWorksheet(
  shiftsByVehicle: Record<string, Shift[]>,
  worksheet: ExcelJS.Worksheet,
) {
  // initialize template totals and props
  const headerRows = 2;
  const grandTotal = {
    total: 0,
    rows: [] as number[]
  };
  let rowIdx = 1 + headerRows;

  // get initial empty template row values that will be cloned during iteration
  const emptyRow = worksheet.getRow(rowIdx).values as ExcelJS.CellValue[];
  const headerRow = worksheet.getRow(rowIdx + 1).values as ExcelJS.CellValue[];

  Object.entries(shiftsByVehicle).forEach(([vehicleId, shifts], idx) => {
    // return if no shifts
    if (!shifts?.length) {
      return;
    }

    // only create blank rows if not on 1st iteration since template already has initial rows
    if (idx !== 0) {
      worksheet.insertRows(rowIdx, [headerRow], 'i+');
      worksheet.insertRows(rowIdx, [emptyRow], 'n');
      worksheet.getRow(rowIdx).eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.fill = worksheet.getRow(rowIdx - 2).getCell(colNum).fill;
        cell.style = worksheet.getRow(rowIdx - 2).getCell(colNum).style;
        cell.border = worksheet.getRow(rowIdx - 2).getCell(colNum).border;
        cell.font = worksheet.getRow(rowIdx - 2).getCell(colNum).font;
      });
    }
    // add more rows if more than 1 shift exists
    if (shifts.length > 1) {
      worksheet.duplicateRow(rowIdx, shifts.length - 1, true);
    }

    let perVehicleTotal = 0;

    shifts.forEach((shift) => {
      const shiftRow = worksheet.getRow(rowIdx);
      // Last Name
      shiftRow.getCell(1).value = shift.user?.lastName || '';
      // First Name
      shiftRow.getCell(2).value = shift.user?.firstName || '';
      // Employee Number
      shiftRow.getCell(3).value = shift.user?.member?.pNumber || '';
      // Call Sign
      shiftRow.getCell(4).value = shift.docusignEvent?.signerDetails?.[0]?.data?.callSign || '';
      // Vehicle ID
      shiftRow.getCell(5).value = shift.docusignEvent?.signerDetails?.[0]?.data?.vehicleNumber || '';
      // Make
      shiftRow.getCell(6).value = shift.docusignEvent?.signerDetails?.[0]?.data?.vehicleMake || '';
      // Model
      shiftRow.getCell(7).value = shift.docusignEvent?.signerDetails?.[0]?.data?.vehicleModel || '';
      // Category
      shiftRow.getCell(8).value = '';
      // Start Miles
      shiftRow.getCell(9).value = parseInt(shift.docusignEvent?.signerDetails?.[0]?.data?.startingMilage || '0', 10);
      // End Miles
      shiftRow.getCell(10).value = parseInt(shift.docusignEvent?.signerDetails?.[0]?.data?.endingMilage || '0', 10);

      // Event Miles
      // NOTE: Not sure if I actually have to calculate the result of formulas as it works without, but docs recommend it.
      // Some reports say it is because if opened in protected view, it will not calculate and only show the result.
      shiftRow.getCell(11).value = {
        formula: `SUM(J${rowIdx}-I${rowIdx})`,
        result: (shiftRow.getCell(10).value as number) - (shiftRow.getCell(9).value as number),
      };
      perVehicleTotal += (shiftRow.getCell(11).result as number);

      // jump to next row
      rowIdx += 1;
    });

    // Re-merge last row cells due to bug where moving merged cells causes them to become unmerged
    worksheet.mergeCells(`A${rowIdx}:J${rowIdx}`);

    // fill out per rank totals
    const perVehicleTotalRow = worksheet.getRow(rowIdx);
    const vehicleCategory = '';
    const rankTitleLabel = perVehicleTotalRow.getCell(10).value as string;
    // Rank Title Header
    perVehicleTotalRow.getCell(10).value = rankTitleLabel.replace('[category]', vehicleCategory);

    const rangeMin = rowIdx - shifts.length;
    const rangeMax = rowIdx - 1;
    // Total Vehicle Miles
    perVehicleTotalRow.getCell(11).value = {
      formula: getColSumRangeFormula(rangeMin, rangeMax, 'K'),
      result: perVehicleTotal,
    };

    // Add per rank totals to Complete Total
    grandTotal.total += perVehicleTotal;
    grandTotal.rows.push(rowIdx);

    // jump to next row
    rowIdx += 1;
  });

  // NOTE: Not sure if I actually have to calculate the result of formulas as it works without, but docs recommend it.
  // Some reports say it is because if opened in protected view, it will not calculate and only show the result.
  const lastRowIdx = rowIdx;
  const lastRow = worksheet.getRow(lastRowIdx);

  // Re-merge last row cells due to bug where moving merged cells causes them to become unmerged
  worksheet.mergeCells(`A${rowIdx}:J${rowIdx}`);

  // Complete Total Overtime Hours
  lastRow.getCell(11).value = {
    formula: getCellSumByColumnFormula(grandTotal.rows, 'K'),
    result: grandTotal.total,
  };
}
