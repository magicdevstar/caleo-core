import ExcelJS from 'exceljs';
import dayjs from 'dayjs';
import { Event, Shift } from 'src/__generated__/resolvers-types';
import { FrontendUser } from 'src/api/user';
import { convertDate, convertStartAndEndDate } from 'src/hooks/use-datejs';
import { getCellSumByColumnFormula, getColSumRangeFormula } from './excel-formulas';

export function modifyReportHeader(event: Event, worksheet: ExcelJS.Worksheet, user: FrontendUser) {
  const eventDate = event.startTime
    ? convertDate({ date: event.startTime, user }).format('MMMM DD, YYYY')
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
  user: FrontendUser,
  miniDateFormat: string,
  timeFormat: string
) {
  // initialize template props
  const headerRows = 2;
  const defaultNumberOfRows = 123;

  // add or remove rows from template
  const rowDiff = Math.abs(shifts.length - defaultNumberOfRows);
  if (shifts?.length > defaultNumberOfRows) {
    worksheet.duplicateRow(headerRows + defaultNumberOfRows, rowDiff, true);
  } else if (shifts?.length < defaultNumberOfRows) {
    // remove all excess rows (start from 2nd row to avoid deleting original)
    worksheet.spliceRows(headerRows + shifts.length + 1, rowDiff);
  }

  // remove original table and recreate it since Exceljs does not preserve table data upon importing
  const originalTable = worksheet.getTable('Table_1');
  const tableProps = (originalTable as any).table;
  const tableConfig: ExcelJS.TableProperties = {
    name: 'PayAndLeaveTable',
    ref: tableProps.tableRef.split(':')[0],
    headerRow: true,
    totalsRow: false,
    style: {
      theme: 'TableStyleMedium9',
      showRowStripes: true
    },
    columns: tableProps.columns.map((col: any, i: number) => ({
      name: col.name,
      filterButton: true,
    })),
    rows: [],
  };
  worksheet.removeTable('Table_1');
  const table = worksheet.addTable(tableConfig);

  let totalOvertimeHoursWorked = 0;
  let totalTravelTime = 0;
  let totalEquipmentTime = 0;
  const totalAdminTime = 0;
  let totalTime = 0;

  // sort shifts alphabetically
  shifts.sort((shiftA, shiftB) => {
    const nameA = shiftA.user?.lastName || '';
    const nameB = shiftB.user?.lastName || '';
    return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
  });

  // create table rows
  shifts.forEach((shift, index) => {
    const rowIdx = headerRows + index + 1;

    // NOTE: Not sure if I actually have to calculate the result of formulas as it works without, but docs recommend it.
    // Some reports say it is because if opened in protected view, it will not calculate and only show the result.
    const convertedStartAndEnd = convertStartAndEndDate({
      startDate: shift.shiftCheckInOut?.checkInTime || shift.startTime,
      endDate: shift.shiftCheckInOut?.checkOutTime || shift.endTime,
      user,
    });
    const hoursWorked = convertedStartAndEnd.formattedDiff || 0;
    const equipmentTime = shift.calculatedShiftDetails?.totalEquipmentTime || 0;
    const travelTime = (equipmentTime || !shift.assignment.includeDriveTime) ? 0 : 1;
    const totalRowTime = hoursWorked + equipmentTime;

    // add to total sums
    totalOvertimeHoursWorked += hoursWorked;
    totalTravelTime += (equipmentTime || !shift.assignment.includeDriveTime) ? 0 : 1;
    totalEquipmentTime += equipmentTime;
    totalTime += totalRowTime;

    // add table row
    table.addRow([
      // number
      index + 1,
      // Name
      shift.user ? `${shift.user?.lastName || ''}, ${shift.user?.firstName || ''}` : '',
      // Employee Number
      shift.user?.member?.pNumber || '',
      // Rank
      shift.user?.member?.rank?.name || '',
      // Call Sign
      shift.docusignEvent?.signerDetails?.[0]?.data?.callSign || '',
      // Date
      shift.startTime
        ? convertDate({ date: shift.startTime, user }).format(miniDateFormat)
        : '',
      // Check-in Time
      convertedStartAndEnd.startDate ? dayjs(convertedStartAndEnd.startDate).format(timeFormat) : '',
      // Check-out Time
      convertedStartAndEnd.endDate ? dayjs(convertedStartAndEnd.endDate).format(timeFormat) : '',
      // Overtime Hours Worked
      hoursWorked,
      // Travel Time (Default is 1)
      travelTime,
      // Equipment Time
      equipmentTime,
      // Administrative Time
      0,
      // Total Overtime Hours
      { formula: `SUM(I${rowIdx}:L${rowIdx})`, result: totalRowTime }
    ])
  });

  // commit changes for all added rows
  table.commit();

  const lastRowIdx = headerRows + shifts.length + 1;
  const lastRow = worksheet.getRow(lastRowIdx);

  // Total Overtime Hours Worked
  lastRow.getCell(9).value = {
    formula: `SUBTOTAL(109,'Pay and Leave'!$I$3:$I$${lastRowIdx - 1})`,
    result: totalOvertimeHoursWorked,
  };
  // Total Travel Time
  lastRow.getCell(10).value = {
    formula: `SUBTOTAL(109,'Pay and Leave'!$J$3:$J$${lastRowIdx - 1})`,
    result: totalTravelTime,
  };
  // Total Equipment Time
  lastRow.getCell(11).value = {
    formula: `SUBTOTAL(109,'Pay and Leave'!$K$3:$K$${lastRowIdx - 1})`,
    result: totalEquipmentTime,
  }
  // Total Admin Time
  lastRow.getCell(12).value = {
    formula: `SUBTOTAL(109,'Pay and Leave'!$L$3:$L$${lastRowIdx - 1})`,
    result: totalAdminTime,
  }
  // Total Overtime Hours
  lastRow.getCell(13).value = {
    formula: `SUBTOTAL(109,'Pay and Leave'!$M$3:$M$${lastRowIdx - 1})`,
    result: totalTime,
  };
}

export function generateContractLawWorksheet(
  shiftsByRank: Record<string, Shift[]>,
  worksheet: ExcelJS.Worksheet,
  user: FrontendUser,
  miniDateFormat: string,
  timeFormat: string
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

  // sort shift ranks alphabetically
  const sortedShiftsByRankEntries = Object.entries(shiftsByRank).sort(([rankIdA, shiftsA], [rankIdB, shiftsB]) => {
    const rankA = shiftsA[0]?.user?.member?.rank?.name || '';
    const rankB = shiftsB[0]?.user?.member?.rank?.name || '';
    return rankA.toLowerCase().localeCompare(rankB.toLowerCase());
  });

  sortedShiftsByRankEntries.forEach(([rankId, shifts], idx) => {
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

    // sort shifts alphabetically
    shifts.sort((shiftA, shiftB) => {
      const nameA = shiftA.user?.lastName || '';
      const nameB = shiftB.user?.lastName || '';
      return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
    });

    shifts.forEach((shift, shiftIdx) => {
      const convertedStartAndEnd = convertStartAndEndDate({
        startDate: shift.shiftCheckInOut?.checkInTime || shift.startTime,
        endDate: shift.shiftCheckInOut?.checkOutTime || shift.endTime,
        user,
      });
      const shiftRow = worksheet.getRow(rowIdx);
      // Name
      shiftRow.getCell(1).value = shift.user ? `${shift.user?.lastName || ''}, ${shift.user?.firstName || ''}` : '';
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
      // Check-in Time
      const checkInTime = convertedStartAndEnd.startDate ? dayjs(convertedStartAndEnd.startDate).format(timeFormat) : '';
      shiftRow.getCell(6).value = checkInTime;
      // Check-out Time
      const checkOutTime = convertedStartAndEnd.endDate ? dayjs(convertedStartAndEnd.endDate).format(timeFormat) : '';
      shiftRow.getCell(7).value = checkOutTime;
      // Overtime Hours Worked
      shiftRow.getCell(8).value = convertedStartAndEnd.formattedDiff || 0;
      // Travel Time (Default is 1)
      shiftRow.getCell(9).value = (shift.calculatedShiftDetails?.totalEquipmentTime || !shift.assignment.includeDriveTime) ? 0 : 1;
      // Equipment Time
      shiftRow.getCell(10).value = shift.calculatedShiftDetails?.totalEquipmentTime || 0;

      // Total Overtime Hours
      shiftRow.getCell(12).value =
        (shiftRow.getCell(8).value as number) +
        (shiftRow.getCell(9).value as number) +
        (shiftRow.getCell(10).value as number);

      // Add to per rank totals
      perRankTotals.overtime += shiftRow.getCell(8).value as number;
      perRankTotals.travelTime += shiftRow.getCell(9).value as number;
      perRankTotals.equipment += shiftRow.getCell(10).value as number;
      perRankTotals.grandTotal += shiftRow.getCell(12).value as number;

      // jump to next row
      rowIdx += 1;
    });

    // fill out per rank totals
    const perRankTotalRow = worksheet.getRow(rowIdx);
    const rankTitle = shifts[0].user?.member?.rank?.name || '';
    const rankTitleLabel = perRankTotalRow.getCell(7).value as string;
    // Rank Title Header
    perRankTotalRow.getCell(7).value = rankTitleLabel.replace('[rank]', rankTitle);

    const rangeMin = rowIdx - shifts.length;
    const rangeMax = rowIdx - 1;
    // Total Rank Overtime Hours
    perRankTotalRow.getCell(8).value = {
      formula: getColSumRangeFormula(rangeMin, rangeMax, 'H'),
      result: perRankTotals.overtime,
    };
    // Total Rank Travel Time
    perRankTotalRow.getCell(9).value = {
      formula: getColSumRangeFormula(rangeMin, rangeMax, 'I'),
      result: perRankTotals.travelTime,
    };
    // Total Rank Equipment Time
    perRankTotalRow.getCell(10).value = {
      formula: getColSumRangeFormula(rangeMin, rangeMax, 'J'),
      result: perRankTotals.equipment,
    };
    // Total Rank Administrative Time (This is skipped, but should still leave formula)
    perRankTotalRow.getCell(11).value = {
      formula: getColSumRangeFormula(rangeMin, rangeMax, 'K'),
      result: 0,
    };
    // Grand Total Rank Time
    perRankTotalRow.getCell(12).value = {
      formula: getColSumRangeFormula(rangeMin, rangeMax, 'L'),
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
  if (!lastRow.getCell(1).isMerged) {
    try {
      worksheet.mergeCells(`A${rowIdx}:G${rowIdx}`);
    } catch(error) {
      console.warn('Error merging cells for complete total row:', error);
    }
  }

  // Complete Total Overtime Hours
  lastRow.getCell(8).value = {
    formula: getCellSumByColumnFormula(completeTotal.rows, 'H'),
    result: completeTotal.overtime,
  };
  // Complete Total Travel Time
  lastRow.getCell(9).value = {
    formula: getCellSumByColumnFormula(completeTotal.rows, 'I'),
    result: completeTotal.travelTime,
  };
  // Complete Total Equipment Time
  lastRow.getCell(10).value = {
    formula: getCellSumByColumnFormula(completeTotal.rows, 'J'),
    result: completeTotal.equipment,
  };
  // Complete Total Administrative Time (This is skipped, but should still leave formula)
  lastRow.getCell(11).value = {
    formula: getCellSumByColumnFormula(completeTotal.rows, 'K'),
    result: 0,
  };
  // Complete Grand Total Overtime Hours
  lastRow.getCell(12).value = {
    formula: getCellSumByColumnFormula(completeTotal.rows, 'L'),
    result: completeTotal.grandTotal,
  };
}

export function generateContractLawVehicleWorksheet(
  shiftsByVehicle: Record<string, Shift[]>,
  worksheet: ExcelJS.Worksheet
) {
  // initialize template totals and props
  const headerRows = 2;
  const grandTotal = {
    total: 0,
    rows: [] as number[],
  };
  let rowIdx = 1 + headerRows;

  // get initial empty template row values that will be cloned during iteration
  const emptyRow = worksheet.getRow(rowIdx).values as ExcelJS.CellValue[];
  const headerRow = worksheet.getRow(rowIdx + 1).values as ExcelJS.CellValue[];

  // sort shift ranks alphabetically
  const sortedShiftsByVehicleEntries = Object.entries(shiftsByVehicle).sort(
    ([categoryA, shiftsA], [categoryB, shiftsB]) =>
      categoryA.toLowerCase().localeCompare(categoryB.toLowerCase())
  );

  sortedShiftsByVehicleEntries.forEach(([vehicleId, shifts], idx) => {
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

    // sort shifts alphabetically
    shifts.sort((shiftA, shiftB) => {
      const nameA = shiftA.user?.lastName || '';
      const nameB = shiftB.user?.lastName || '';
      return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
    });

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
      shiftRow.getCell(5).value =
        shift.docusignEvent?.signerDetails?.[0]?.data?.vehicleNumber || '';
      // Make
      shiftRow.getCell(6).value = shift.docusignEvent?.signerDetails?.[0]?.data?.vehicleMake || '';
      // Model
      shiftRow.getCell(7).value = shift.docusignEvent?.signerDetails?.[0]?.data?.vehicleModel || '';
      // Category
      shiftRow.getCell(8).value =
        shift.shiftCheckInOut?.equipmentDetails?.vehicleCategory?.name || '';
      // Start Miles
      shiftRow.getCell(9).value = parseInt(
        shift.docusignEvent?.signerDetails?.[0]?.data?.startingMilage || '0',
        10
      );
      // End Miles
      shiftRow.getCell(10).value = parseInt(
        shift.docusignEvent?.signerDetails?.[0]?.data?.endingMilage || '0',
        10
      );

      // Event Miles
      // NOTE: Not sure if I actually have to calculate the result of formulas as it works without, but docs recommend it.
      // Some reports say it is because if opened in protected view, it will not calculate and only show the result.
      shiftRow.getCell(11).value = {
        formula: `SUM(J${rowIdx}-I${rowIdx})`,
        result: (shiftRow.getCell(10).value as number) - (shiftRow.getCell(9).value as number),
      };
      perVehicleTotal += shiftRow.getCell(11).result as number;

      // jump to next row
      rowIdx += 1;
    });

    // get per vehicle total row
    const perVehicleTotalRow = worksheet.getRow(rowIdx);

    // Re-merge last row cells due to bug where moving merged cells causes them to become unmerged
    if (!perVehicleTotalRow.getCell(1).isMerged) {
      try {
        worksheet.mergeCells(`A${rowIdx}:J${rowIdx}`);
      } catch(error) {
        console.warn('Error merging cells for complete total row:', error);
      }
    }

    // fill out per rank totals
    const vehicleCategory =
      shifts[0].shiftCheckInOut?.equipmentDetails?.vehicleCategory?.name || '';
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
  if (!lastRow.getCell(1).isMerged) {
    try {
      worksheet.mergeCells(`A${rowIdx}:J${rowIdx}`);
    } catch(error) {
      console.warn('Error merging cells for complete total row:', error);
    }
  }

  // Complete Total Overtime Hours
  lastRow.getCell(11).value = {
    formula: getCellSumByColumnFormula(grandTotal.rows, 'K'),
    result: grandTotal.total,
  };
}
