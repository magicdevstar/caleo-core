import { gql } from "@apollo/client";

export const GET_INCIDENT_SUBMISSIONS = gql`
  query IncidentForms($input: IncidentFormSearchInput!, $report: Boolean) {
    incidentForms(input: $input, report: $report) {
      items {
        id
        step
        status
        isMutualAid
        operationalPeriod {
          date
        }
        reviewer
        reviewerUser {
          id
          name
          pNumber
        }
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

export const GET_INCIDENT_SUBMISSION = gql`
  query IncidentForm($id: ObjectId!) {
    incidentForm(id: $id) {
      id
      step
      status
      isMutualAid
      operationalPeriod {
        date
      }
      reviewer
      reviewerUser {
        id
        name
        pNumber
      }
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
  }
`;

export const GET_SUBMITTED_INCIDENT_SUBMISSIONS = gql`
  query IncidentForms($input: IncidentFormSearchInput!, $report: Boolean) {
    incidentForms(input: $input, report: $report) {
      items {
        id
        step
        status
        userId
        isMutualAid
        operationalPeriod {
          date
        }
        docusignEvent {
          id
          status
          documentUrls
        }
        event {
          id
          referenceId
          name
          attachments
          thumbnailUrl
          startTime
          endTime
          status
          venue {
            id
            name
            address
            city
            state
            zip
            phone
            contact {
              firstName
              lastName
              email
              phone
            }
          }
        }
      }
      total
    }
  }
`;

export const UPSERT_INCIDENT_SUBMISSION = gql`
  mutation IncidentForm($input: IIncidentForm!, $saveOnly: Boolean, $resubmit: Boolean) {
    incidentForm(input: $input, saveOnly: $saveOnly, resubmit: $resubmit) {
      signingUrl
      incidentForm {
        id
        step
        status
        userId
        isMutualAid
        operationalPeriod {
          date
        }
        reviewer
        reviewerUser {
          id
          name
          pNumber
        }
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

export const GET_INCIDENT_SUBMISSIONS_FOR_REPORT = gql`
  query IncidentForms($input: IncidentFormSearchInput!, $report: Boolean) {
    incidentForms(input: $input, report: $report) {
      items {
        id
        step
        status
        submittedDate
        updatedAt
        isMutualAid
        operationalPeriod {
          date
        }
        reviewer
        reviewerUser {
          id
          name
          pNumber
        }
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
          vehicleCategoryRecord {
            id
            name
            milageRate
          }
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

        event {
          id
          name
          referenceId
          ocn
          budgetActivityCode
          outsideOrgCode
          overtimeReasonCode
        }

        user {
          id
          name
          member {
            pNumber
            division {
              id
              name
            }
          }
        }

        docusignEvent {
          id
          status
          envelopeId
        }
      }
      total
    }
  }
`;

export const GET_INCIDENT_SUBMISSIONS_DOC_DOWNLOAD = gql`
  query IncidentForms($input: IncidentFormSearchInput!, $report: Boolean) {
    incidentForms(input: $input, report: $report) {
      items {
        id
        operationalPeriod {
          date
        }
        user {
          id,
          lastName
        }
        docusignEvent {
          id
          status
          envelopeId
          documentUrls
        }
      }
      total
    }
  }
`;

export const REMOVE_INCIDENT_SUBMISSION = gql`
  mutation RemoveIncidentForm($id: String!) {
    removeIncidentForm(id: $id)
  }
`;
