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
import { differenceInHours } from "date-fns/differenceInHours";

export const requestToPDFForm = ({
    incidentForm,
    reviewer,
    user,
    event,
    unit,
    org,
    rank,
  }: {
    reviewer: IOutsideUser;
    incidentForm: InputIncidentForm;
    event: IEvent;
    user: IUser;
    org: IOrganization;
    rank: IRank;
    unit: IUnit;
  }): IIncidentFormDetails => {
    const alItems = incidentForm.activityLog.entries!.reduce((acc, entry, index) => ({
      ...acc,
      [`alTime${index}`]: entry!.time ? format(toZonedTime(entry!.time, org.timezone), 'HH:mm') : '',
      [`alMission${index}`]: entry!.missionNumber || '',
      [`alNote${index}`]: entry!.notes || '',
    }), {});
    return {
      eventName: event.name,
      eventName2: event.name,
      today: format(toZonedTime(incidentForm.operationalPeriod.date, org.timezone), 'MM/dd/yyyy'),
      today2: format(toZonedTime(incidentForm.operationalPeriod.date, org.timezone), 'MM/dd/yyyy'),
      officerName: user.name,
      officerName2: user.name,
      officerName3: user.name,
      officerEmployeeNumber: user.member.pNumber,
      officerEmployeeNumber2: user.member.pNumber,
      officerEmployeeNumber3: user.member.pNumber,
      reviwerName: reviewer.name,
      reviwerEmployeeNumber: reviewer.pNumber,
      reviewerName2: reviewer.name,
      reviwerEmployeeNumber2: reviewer.pNumber,
      rdoNo: incidentForm.timekeeping.rdo === 'no',
      rdoYes: incidentForm.timekeeping.rdo === 'yes',
      ...(incidentForm.timekeeping.rdo === 'yes' ? {
        straightTimeIn: format(toZonedTime(incidentForm.timekeeping.timeIn, org.timezone), 'HH:mm'),
        straightTimeOut: format(toZonedTime(incidentForm.timekeeping.timeOut, org.timezone), 'HH:mm'),
        straightTotalTime: `${differenceInHours(
          toZonedTime(incidentForm.timekeeping.timeOut, org.timezone),
          toZonedTime(incidentForm.timekeeping.timeIn, org.timezone)
        ) || '1'}`,
      } : {
        timeIn: format(toZonedTime(incidentForm.timekeeping.timeIn, org.timezone), 'HH:mm'),
        timeOut: format(toZonedTime(incidentForm.timekeeping.timeOut, org.timezone), 'HH:mm'),
        totalTime: `${differenceInHours(incidentForm.timekeeping.timeOut, incidentForm.timekeeping.timeIn) || '1'}`,
      }),
      enrouteToIncident: incidentForm.shiftDetails.enrouteToIncident ? format(toZonedTime(incidentForm.shiftDetails.enrouteToIncident, org.timezone), 'HH:mm') : '',
      staging1097: incidentForm.shiftDetails.staging1097 ? format(toZonedTime(incidentForm.shiftDetails.staging1097, org.timezone), 'HH:mm') : '',
      staging1098: incidentForm.shiftDetails.staging1098 ? format(toZonedTime(incidentForm.shiftDetails.staging1098, org.timezone), 'HH:mm') : '',
      arrivalAtUOA: incidentForm.shiftDetails.arrivalAtUOA ? format(toZonedTime(incidentForm.shiftDetails.arrivalAtUOA, org.timezone), 'HH:mm') : '',
      officerUnitOfAssignment: unit.name,
      officerRank: rank.name,
      time18Hour: incidentForm.shiftDetails.time18Hour ? format(toZonedTime(incidentForm.shiftDetails.time18Hour, org.timezone), 'HH:mm') : '',
      ...(incidentForm.vehicleInformation.hasVehicle && {
        vehicleNumber: incidentForm.vehicleInformation.vehicleNumber || '',
        'Vehicle Model': incidentForm.vehicleInformation.vehicleModel || '',
        vehicleMake: incidentForm.vehicleInformation.vehicleMake || '',
        vehicleStartingMileage: `${incidentForm.vehicleInformation.startingMileage}` || '',
        vehicleEndingMileage: `${incidentForm.vehicleInformation.endingMileage}` || '',
        vehicleTotalMileage:
          `${(incidentForm.vehicleInformation.endingMileage || 0) -
          (incidentForm.vehicleInformation.startingMileage || 0)}` || '',
      }),
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
      continue: incidentForm.activityLog.entries!.length > 4,
      ...alItems,
    }
  }