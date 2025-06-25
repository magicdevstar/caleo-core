import { gql } from "@apollo/client";

export const GET_INCIDENT_SUBMISSIONS = gql`
  query IncidentForms($input: IncidentFormSearchInput!) {
    incidentForms(input: $input) {
      items {
        id
        step
        status
        operationalPeriod {
          date
        }
        reviewer
        timekeeping {
          rdo
          overtimeHours
          straightHours
          timeIn
          timeOut
          overtimeTimeIn
          overtimeTimeOut
          type
        }
        shiftDetails {
          enrouteToIncident
          staging1097
          staging1098
          arrivalAtUOA
          time18Hour
        }
        vehicleInformation {
          hasVehicle
          vehicleCategory
          vehicleMake
          vehicleModel
          vehicleNumber
          startingMileage
          endingMileage
        }
        assignmentSummary {
          callSign
          squad
          supervisor
          otherExplanation
          missionAssignments {
            escort
            evacuations
            hardClosure
            incidentManagementTeam
            logistics
            rrf
            rovingSecurity
            searchAndRescue
            softClosure
            welfareCheck
            other
          }
        }
        activityLog {
          entries {
            time
            missionNumber
            notes
          }
        }

        docusignEvent {
          id
          status
        }
      }
      total
    }
  }
`;

export const UPSERT_INCIDENT_SUBMISSION = gql`
  mutation IncidentForm($input: IIncidentForm!, $saveOnly: Boolean) {
    incidentForm(input: $input, saveOnly: $saveOnly) {
      signingUrl
      incidentForm {
        id
        step
        status
        operationalPeriod {
          date
        }
        reviewer
        timekeeping {
          rdo
          overtimeHours
          straightHours
          timeIn
          timeOut
          overtimeTimeIn
          overtimeTimeOut
          type
        }
        shiftDetails {
          enrouteToIncident
          staging1097
          staging1098
          arrivalAtUOA
          time18Hour
        }
        vehicleInformation {
          hasVehicle
          vehicleCategory
          vehicleMake
          vehicleModel
          vehicleNumber
          startingMileage
          endingMileage
        }
        assignmentSummary {
          callSign
          squad
          supervisor
          otherExplanation
          missionAssignments {
            escort
            evacuations
            hardClosure
            incidentManagementTeam
            logistics
            rrf
            rovingSecurity
            searchAndRescue
            softClosure
            welfareCheck
            other
          }
        }
        activityLog {
          entries {
            time
            missionNumber
            notes
          }
        }
      }
    }
  }
`;

export const REMOVE_INCIDENT_SUBMISSION = gql`
  mutation RemoveIncidentForm($id: String!) {
    removeIncidentForm(id: $id)
  }
`;
