import { gql } from "@apollo/client";

export const REMOVE_EVENT = gql`
  mutation RemoveEvent($id: String!) {
    removeEvent(id: $id)
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
        scheduledInterestList
        scheduledFirstComeFirstServe
        autoAssignInterestList
        status
        availableShifts
        totalShifts
        createdBy {
          member {
            pNumber
          }
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
      name
    }
    assignments {
      id
      name
      requiredEquipment {
        id
        name
      }
      shifts {
        id
        startTime
        endTime
        status
        refNumber
        user {
          id
          firstName
          lastName
          member {
            pNumber
            contactInfo {
              primaryPhone {
                number
              }
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
        name
      }
      assignments {
        id
        name
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

      requestDetails {
        startTime
        endTime
        newVenue
        numberOfOfficers
        estimatedAttendees
      }

      supervisor {
        id
        name
      }

      lieutenant {
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
