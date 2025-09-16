import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns/format";
import { IUser } from "../../types/common";
import { IIncidentFormDetails } from "../../types/incidentForm";
import { IEvent } from "../event";
import { InputIncidentForm } from "../incidentForm";
import { IOrganization } from "../organizations/organization.entity";
import { IOutsideUser } from "../outsideUsers/outsideUser.repository";
import { IRank } from "../rank";
import { IUnit } from "../unit";
import { TimekeepingType } from "../../__generated__/resolvers-types";

/**
 * outsideOrgCode - string
 * saved - checkbox
 * paid - checkbox
 * ordered - checkbox
 * voluntary - checkbox
 * incidentCommanderName - string
 * incidentCommanderEmployeeNumber - string
 * details - string
 * callSign - string (Call Sign: ____________)
 * lieutenantEmployeeNumber - string [Reserve only]
 */

export const requestToPDFForm = ({
  incidentForm,
  reviewer,
  user,
  event,
  supervisor,
  unit,
  org,
  rank,
  incidentCommander,
  details,
}: {
  details: string;
  incidentCommander: IUser | IOutsideUser;
  reviewer: IUser | IOutsideUser;
  supervisor: IUser | IOutsideUser;
  incidentForm: InputIncidentForm;
  event: IEvent;
  user: IUser;
  org: IOrganization;
  rank: IRank;
  unit: IUnit;
}): IIncidentFormDetails => {
  const officerName = `${user.lastName}, ${user.firstName}`;
  const alItems = incidentForm.activityLog.entries!.reduce((acc, entry, index) => ({
    ...acc,
    [`alTime${index}`]: entry!.time ? format(toZonedTime(entry!.time, org.timezone), 'HH:mm') : '',
    [`alMission${index}`]: entry!.missionNumber || '',
    [`alNote${index}`]: entry!.notes || '',
  }), {});
  return {
    headerText: incidentForm.isMutualAid ? 'Mutual Aid' : '',
    headerText2: incidentForm.isMutualAid ? 'Mutual Aid' : '',
    ocn: event.ocn || '',
    budgetActivityCode: event.budgetActivityCode || '',
    overtimeReasonCode: event.overtimeReasonCode || '',
    paid: incidentForm.timekeeping.type === TimekeepingType.Paid,
    saved: incidentForm.timekeeping.type === TimekeepingType.Saved,
    ordered: true,
    voluntary: false,
    incidentCommanderName: incidentCommander.name,
    incidentCommanderEmployeeNumber: (incidentCommander as IOutsideUser)?.pNumber || (incidentCommander as IUser)?.member?.pNumber,
    lieutenantEmployeeNumber: (reviewer as IOutsideUser)?.pNumber || (reviewer as IUser)?.member?.pNumber,
    details,
    outsideOrgCode: event.outsideOrgCode || '',
    unitCommanderName: supervisor.name || '',
    eventName: event.name,
    eventName2: event.name,
    today: format(toZonedTime(incidentForm.operationalPeriod.date, org.timezone), 'MM/dd/yyyy'),
    today2: format(toZonedTime(incidentForm.operationalPeriod.date, org.timezone), 'MM/dd/yyyy'),
    officerName,
    officerName2: officerName,
    officerName3: officerName,
    officerEmployeeNumber: user.member.pNumber,
    officerEmployeeNumber2: user.member.pNumber,
    officerEmployeeNumber3: user.member.pNumber,
    reviewerName: reviewer.name,
    reviewerEmployeeNumber: (reviewer as IOutsideUser)?.pNumber || (reviewer as IUser)?.member?.pNumber,
    reviewerName2: reviewer.name,
    reviewerEmployeeNumber2: (reviewer as IOutsideUser)?.pNumber || (reviewer as IUser)?.member?.pNumber,
    rdoNo: incidentForm.timekeeping.rdo === 'no',
    rdoYes: incidentForm.timekeeping.rdo === 'yes',
    straightTimeIn: incidentForm.timekeeping.rdo === 'no' && incidentForm.timekeeping.timeIn ? format(toZonedTime(incidentForm.timekeeping.timeIn, org.timezone), 'HH:mm') : '',
    straightTimeOut: incidentForm.timekeeping.rdo === 'no' && incidentForm.timekeeping.timeOut ? format(toZonedTime(incidentForm.timekeeping.timeOut, org.timezone), 'HH:mm') : '',
    straightTotalTime: incidentForm.timekeeping.rdo === 'no' && incidentForm.timekeeping.straightHours ? incidentForm.timekeeping.straightHours.toFixed(2) : '',
    timeIn: incidentForm.timekeeping.overtimeTimeIn ? format(toZonedTime(incidentForm.timekeeping.overtimeTimeIn, org.timezone), 'HH:mm') : '',
    timeOut: incidentForm.timekeeping.overtimeTimeOut ? format(toZonedTime(incidentForm.timekeeping.overtimeTimeOut, org.timezone), 'HH:mm') : '',
    totalTime: incidentForm.timekeeping.overtimeHours ? incidentForm.timekeeping.overtimeHours.toFixed(2) : '' ,
    enrouteToIncident: incidentForm.shiftDetails.enrouteToIncident ? format(toZonedTime(incidentForm.shiftDetails.enrouteToIncident, org.timezone), 'HH:mm') : '',
    staging1097: incidentForm.shiftDetails.staging1097 ? format(toZonedTime(incidentForm.shiftDetails.staging1097, org.timezone), 'HH:mm') : '',
    staging1098: incidentForm.shiftDetails.staging1098 ? format(toZonedTime(incidentForm.shiftDetails.staging1098, org.timezone), 'HH:mm') : '',
    arrivalAtUOA: incidentForm.shiftDetails.arrivalAtUOA ? format(toZonedTime(incidentForm.shiftDetails.arrivalAtUOA, org.timezone), 'HH:mm') : '',
    officerUnitOfAssignment: unit.overtimeCode || '',
    officerRank: rank.name,
    time18Hour: incidentForm.shiftDetails.time18Hour ? format(toZonedTime(incidentForm.shiftDetails.time18Hour, org.timezone), 'HH:mm') : '',
    ...(incidentForm.vehicleInformation.hasVehicle === 'yes' && {
      vehicleNumber: incidentForm.vehicleInformation.vehicleNumber || '',
      'Vehicle Model': incidentForm.vehicleInformation.vehicleModel || '',
      vehicleMake: incidentForm.vehicleInformation.vehicleMake || '',
      vehicleStartingMileage: `${incidentForm.vehicleInformation.startingMileage?.toLocaleString('en-US')}` || '',
      vehicleEndingMileage: `${incidentForm.vehicleInformation.endingMileage?.toLocaleString('en-US')}` || '',
      vehicleTotalMileage:
        `${((incidentForm.vehicleInformation.endingMileage || 0) -
        (incidentForm.vehicleInformation.startingMileage || 0)).toLocaleString('en-US')}` || '',
    }),
    callSignWithPrefix: `Call Sign: ${incidentForm.assignmentSummary.callSign || ''}`,
    callSign: incidentForm.assignmentSummary.callSign || '',
    squad: incidentForm.assignmentSummary.squad || '',
    supervisor: incidentForm.assignmentSummary.supervisor || '',
    escort: incidentForm.assignmentSummary.missionAssignments!.escort || false,
    evacuations: incidentForm.assignmentSummary.missionAssignments!.evacuations || false,
    hardClosure: incidentForm.assignmentSummary.missionAssignments!.hardClosure || false,
    incidentManagementTeam: incidentForm.assignmentSummary.missionAssignments!.incidentManagementTeam || false,
    logistics: incidentForm.assignmentSummary.missionAssignments!.logistics || false,
    rrf: incidentForm.assignmentSummary.missionAssignments!.rrf || false,
    rovingSecurity: incidentForm.assignmentSummary.missionAssignments!.rovingSecurity || false,
    searchRescue: false, // incidentForm.assignmentSummary.missionAssignments.searchRescue || false,
    scout: false, // incidentForm.assignmentSummary.missionAssignments.scout || false,
    securityPost: false, // incidentForm.assignmentSummary.missionAssignments.securityPost || false,
    softClosure: incidentForm.assignmentSummary.missionAssignments!.softClosure || false,
    welfareCheck: incidentForm.assignmentSummary.missionAssignments!.welfareCheck || false,
    other: incidentForm.assignmentSummary.missionAssignments!.other || false,
    otherExplanation: incidentForm.assignmentSummary.otherExplanation || '',
    continue: incidentForm.activityLog.entries!.length > 4,
    ...alItems,
  }
};
