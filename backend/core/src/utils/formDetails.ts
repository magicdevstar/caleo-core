import uniq from 'lodash.uniq';
import startCase from 'lodash/startCase';
import { InputIncidentForm } from '../models/incidentForm';

export const buildDescription = (eventName: string, incidentForm: InputIncidentForm): string => {
  let description = `Incident: ${eventName}`;

  const assignmentList = Object.keys(incidentForm.assignmentSummary.missionAssignments || {});
  if (assignmentList.length > 0) {
    const assignedTo = assignmentList
      .filter((key) => incidentForm.assignmentSummary.missionAssignments?.[key])
      .map((key) => {
        if (key.toLowerCase() === 'other') {
          return incidentForm.assignmentSummary.otherExplanation;
        }
        return startCase(key);
      })
      .join(', ');
    description += `\nAssigned To: ${assignedTo}`;
  }

  const missionNumbers = uniq((incidentForm.activityLog.entries || [])
    .map((entry) => entry?.missionNumber)
    .filter(Boolean)
  );
  if (missionNumbers.length > 0) {
    description += `\nMission Number: ${missionNumbers.join(', ')}`;
  }

  description += `\n${incidentForm.isMutualAid ? 'Mutual Aid deployment. ' : ''}See ICS-214 for additional details`;

  return description;
};