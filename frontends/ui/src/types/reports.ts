import { OrganizationFeatures } from "src/__generated__/resolvers-types";

export enum ReportType {
  EVENTS_BY_DATE = 'EVENTS_BY_DATE',
  EVENTS_BY_VENUE = 'EVENTS_BY_VENUE',
  SHIFTS_BY_EVENT = 'SHIFTS_BY_EVENT',
  SHIFTS_BY_OFFICER = 'SHIFTS_BY_OFFICER',
  SHIFTS_BY_DATE = 'SHIFTS_BY_DATE',
  RANKED_SHIFTS_BY_OFFICER = 'RANKED_SHIFTS_BY_OFFICER',
  RELINQUISHED_SHIFTS_BY_OFFICER = 'RELINQUISHED_SHIFTS_BY_OFFICER',
  NO_SHOW_REPORT_BY_OFFICER = 'NO_SHOW_REPORT_BY_OFFICER',
}

export const reportTypes = (features: OrganizationFeatures) => {
  const options = [
    ReportType.EVENTS_BY_DATE,
    ReportType.EVENTS_BY_VENUE,
    ReportType.SHIFTS_BY_EVENT,
    ReportType.SHIFTS_BY_OFFICER,
    ReportType.SHIFTS_BY_DATE,
    ReportType.RELINQUISHED_SHIFTS_BY_OFFICER,
  ];

  if (features.lottery) {
    options.push(ReportType.RANKED_SHIFTS_BY_OFFICER);
  }

  if (features.noShowReport) {
    options.push(ReportType.NO_SHOW_REPORT_BY_OFFICER);
  }

  return options;
};

export const ReportTypeNames = {
  [ReportType.EVENTS_BY_DATE]: 'Events by Date',
  [ReportType.EVENTS_BY_VENUE]: 'Events by Venue',
  [ReportType.SHIFTS_BY_EVENT]: 'Shifts by Event',
  [ReportType.SHIFTS_BY_OFFICER]: 'Shifts by Officer',
  [ReportType.SHIFTS_BY_DATE]: 'Shifts by Date',
  [ReportType.RANKED_SHIFTS_BY_OFFICER]: 'Ranked Shifts by Officer',
  [ReportType.RELINQUISHED_SHIFTS_BY_OFFICER]: 'Scratched Shifts by Officer',
  [ReportType.NO_SHOW_REPORT_BY_OFFICER]: 'No Show by Officer',
};
