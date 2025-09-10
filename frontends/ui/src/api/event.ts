import { gql } from "@apollo/client";

export const REMOVE_EVENT = gql`
  mutation RemoveEvent($id: String!) {
    removeEvent(id: $id)
  }
`;

export const GET_EVENT_NOTES = gql`
  query GetEventNotes($id: String!) {
    event(id: $id) {
      id
      notes
    }
  }
`;

export const GENERATE_INVOICE = gql`
  mutation GenerateInvoice($eventId: String!) {
    generateInvoice(eventId: $eventId)
  }
`;

export const GENERATE_DS_INVOICE = gql`
  mutation GenerateDSInvoice($eventId: String!) {
    generateDSInvoice(eventId: $eventId) {
      signingUrl
    }
  }
`;

export const CLONE_EVENT_BY_ID = gql`
  mutation CloneEvent($id: String!) {
    cloneEvent(id: $id) {
      id
    }
  }
`;

export const CREATE_TEMPLATE_FROM_EVENT_ID = gql`
  mutation CreateTemplateFromEventId($id: String!) {
    templateEvent(id: $id) {
      id
    }
  }
`;

export const EVENT_UPLOAD_URL = gql`
  mutation EventUploadUrl {
    eventAttachmentUploadUrl {
      attachmentPath
      uploadUrl
    }
  }
`;

export const RESET_EVENT_THUMBNAIL = gql`
  mutation ResetEventThumbnail($eventId: String!) {
    removeEventThumbnail(eventId: $eventId)
  }
`;

export const NOTIFY_OF_EVENT = gql`
  mutation NotifyOfEvent($eventId: String!) {
    notifyUsersOfEvent(eventId: $eventId)
  }
`;

export const GET_ALL_EVENTS_SLIM = gql`
  query GetAllEvents($input: EventSearchInput!) {
    events(input: $input) {
      items {
        id
        referenceId
        name
      }
      total
    }
  }
`;

export const GET_ALL_EVENT_SHIFTS = gql`
  query GetEventShifts($id: String!) {
    event(id: $id) {
      id
      assignments {
        id
        name
        shifts {
          id
          user {
            firstName
            lastName
          }
          shiftCheckInOut {
            checkInTime
            checkOutTime
          }
        }
      }
    }
  }
`;

export const GET_ALL_EVENTS = gql`
  query GetAllEvents($input: EventSearchInput!) {
    events(input: $input) {
      items {
        id
        referenceId
        name
        startTime
        endTime
        ocn
        notes
        # When the interest list will stop automatically assigning officers
        interestListAutoAssignCutoff
        # When the interest list will start automatically assigning officers
        scheduledCloseInterestList
        scheduledInterestList
        scheduledFirstComeFirstServe
        autoAssignInterestList
        status
        availableShifts
        totalShifts
        docusignEvent {
          id
          status
          documentUrl
        }
        createdBy {
          member {
            pNumber
          }
        }
        requiredSkills {
          id
          name
        }
        assignments {
          id
          shiftSlots {
            id
            slotCount
          }
        }
        venue {
          id
          name
          contract {
            expirationDate
          }
        }
        createdAt
      }
      total
    }
  }
`;

export const GET_LOTTERY_COUNTER = gql`
  query GetLotteryCounter {
    lotteryCounter {
      id
      counter
      start
      end
    }
  }
`;

export const GET_SELECTED_LOTTERY_COUNTER = gql`
  query GetSelectedLotteryCounter($counter: Int!) {
    lotteryCounter(counter: $counter) {
      id
      counter
      start
      end
    }
  }
`;

export const GET_EVENT_FOR_REPORT = gql`
query GetEvent($id: String!) {
  event(id: $id) {
    id
    referenceId
    name
    startTime
    endTime
    ocn
    createdBy {
      member {
        pNumber
      }
    }
    venue {
      id
      city
      name
    }
    assignments {
      id
      name
      callSign
      requiredEquipment {
        id
        name
      }
      shifts {
        id
        startTime
        endTime
        status
        customId
        refNumber
        docusignEvent {
          id
          status
          documentUrl
          signerDetails {
            roleName
            status
            data {
              callSign
              vehicleModel
              vehicleNumber
              vehicleMake
              endingMilage
              totalMilage
              startingMilage
            }
          }
        }
        user {
          id
          firstName
          lastName
          name
          member {
            pNumber
            rankId
            rank {
              name
            }
            contactInfo {
              primaryPhone {
                number
              }
            }
          }
        }
        shiftCheckInOut {
          checkInTime
          checkOutTime
          equipmentDetails {
            checkInTime
            checkOutTime
            vehicleCategory {
              id
              name
            }
          }
        }
      }
    }

  }
}
`;

export const GET_EVENT_FOR_SUMMARY = gql`
  query GetEvent($id: String!) {
    event(id: $id) {
      id
      referenceId
      name
      supervisorAssignment {
        id
        name
        shifts {
          id
          user {
            id
            name
          }
        }
      }
      startTime
      endTime
      ocn
      createdBy {
        member {
          pNumber
        }
      }
      venue {
        id
        city
        name
      }
      assignments {
        id
        name
        callSign
        supervisorAssignment {
          id
          shifts {
            id
            user {
              id
              name
            }
          }
        }
        reportingLocation
        requiredEquipment {
          id
          name
        }
        requiredSkills {
          id
          name
        }

        ranks {
          id
          name
        }
        shifts {
          id
          customId
          callSign
          startTime
          endTime
          status
          shiftCheckInOut {
            checkInTime
            checkOutTime
            checkInNote
            checkOutNote
            checkInCoords {
              latitude
              longitude
            }
            checkOutCoords {
              latitude
              longitude
            }
          }
          user {
            id
            firstName
            lastName
            member {
              pNumber
              rank {
                name
              }
              contactInfo {
                primaryPhone {
                  number
                }
                primaryEmail {
                  address
                }
              }
            }
          }
        }
      }

    }
  }
`;

export const GET_EVENT_SLIM = gql`
  query GetEventSlim($id: String!) {
    event(id: $id) {
      id
      name
      status
    }
  }
`;

export const GET_EVENT = gql`
  query GetEvent($id: String!) {
    event(id: $id) {
      id
      referenceId
      name
      attachments
      status
      venueId
      ocn
      outsideOrgCode
      overtimeReasonCode
      budgetActivityCode
      notes
      assignmentIds
      attachmentPaths
      lotteryNumber
      notifyWhenFullyStaffed
      scheduledInterestList
      scheduledCloseInterestList
      scheduledFirstComeFirstServe
      notifyOnFirstComeFirstServe
      interestListAutoAssignCutoff
      autoAssignInterestList
      startTime
      endTime
      createdById
      overtimeNarrative
      thumbnailUrl

      geoFence
      allowOfficerCheckIn

      reportingLocation {
        fullAddress
        location {
          latitude
          longitude
        }
      }

      uniform
      briefingTime
      briefingLocation

      requestDetails {
        startTime
        endTime
        newVenue
        numberOfOfficers
        estimatedAttendees
      }

      requiredSkills {
        id
        name
      }

      docusignEvent {
        id
        status
        documentUrl
      }

      supervisorAssignment {
        id
        name
      }

      lieutenantAssignment {
        id
        name
      }

      fieldSupervisorAssignment {
        id
        name
      }

      lotteryCounter {
        id
        counter
        start
        end
      }

      venue {
        id
        name
        address
        city
        state
        zip
        notes
        contract {
          expirationDate
        }
      }

      assignments {
        id
        name
        bwNeeded
        availableShifts
        totalShifts
        ranks {
          id
          name
        }

        requiredSkills {
          id
          name
        }

        shiftSlots {
          id
          slotCount
          slotDetails {
            index
            customId
            callSign
            locked
          }
        }

        shifts {
          id
          shiftId
          status
          startTime
          endTime
          userId
        }
      }

    }
  }
`;

export const REQUIRED_EVENT_FIELDS = gql`
  query GetEvent($id: String!) {
    event(id: $id) {
      id
      ocn
      outsideOrgCode
      overtimeReasonCode
      budgetActivityCode
      supervisorAssignment {
        id
        name
        shifts {
          id
          user {
            id
            name
          }
        }
      }

      lieutenantAssignment {
        id
        name
        shifts {
          id
          user {
            id
            name
          }
        }
      }

      fieldSupervisorAssignment {
        id
        name
        shifts {
          id
          user {
            id
            name
          }
        }
      }
      venue {
        id
        name
      }
    }
  }
`;

export const UPSERT_EVENT = gql`
  mutation UpsertEvent($input: UpsertEvent!) {
    event(event: $input) {
      id
    }
  }
`;

export const APPROVE_EVENT = gql`
  mutation ApproveEvent($id: String!) {
    approveEvent(id: $id) {
      id
    }
  }
`;

export const REJECT_EVENT = gql`
  mutation RejectEvent($id: String!, $reason: String) {
    rejectEvent(id: $id, reason: $reason) {
      id
    }
  }
`;

export type EventTableFilters = {
  name: string;
};

export type EventTableFilterValue = string | string[];
