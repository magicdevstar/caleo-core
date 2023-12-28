import middy from "@middy/core";
import uniq from 'lodash.uniq';
import { injectLambdaContext } from "@aws-lambda-powertools/logger";
import { AddressConfiguration, MessageType, PinpointClient, SendMessagesCommand } from "@aws-sdk/client-pinpoint";
import { utcToZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import logger from "../utils/logger";
import chunk from 'lodash.chunk';
import { MailerEvent, MailerEvents } from "../types/mailer";
import { createContext } from "../utils/createContext";
import { EventStatus, MemberStatus, Organization, Shift, User } from "../__generated__/resolvers-types";

const pinpoint = new PinpointClient({});

const convertDate = (unixDate: number, organization: Organization) => {
  const zonedDate = utcToZonedTime(new Date(unixDate), organization?.timezone || 'America/Los_Angeles' as any);
  return {
    date: format(zonedDate, 'MM/dd/yyyy'),
    time: format(zonedDate, 'HH:mm'),
  };
};

const sendInChunks = async (input: any, Addresses: any) => {
  if (Object.keys(Addresses).length > 100) {
    const chunks = chunk(Object.keys(Addresses), 100).map((chunk) => {
      const obj = {} as Record<string, AddressConfiguration>;
      chunk.forEach((key) => {
        obj[key] = Addresses[key];
      });
      return obj;
    });
    for(const chunk of chunks) {
      const hasSMS = Object.keys(chunk).some((key) => chunk[key].ChannelType === 'SMS');
      // Attaching to input so it will get logged with the error :)
      (input as any).pinpointInput = {
        ApplicationId: process.env.PINPOINT_ID,
        MessageRequest: {
          Addresses: chunk as any,
          MessageConfiguration: {
            ...(hasSMS && {
              SMSMessage: {
                MessageType: MessageType.TRANSACTIONAL,
              }
            }),
            EmailMessage: {
              FromAddress: process.env.FROM_EMAIL,
            },
          },
          TemplateConfiguration: {
            ...(hasSMS && {
              SMSTemplate: {
                Name: input.template,
                Version: '1',
              },
            }),
            EmailTemplate: {
              Name: input.template,
              Version: '1',
            },
          },
        }
      };
      const res = await pinpoint.send(new SendMessagesCommand((input as any).pinpointInput));
      console.log(JSON.stringify(res, null, 2));
      // logger.info('Pinpoint response', { res });
    }
  } else {
    const hasSMS = Object.keys(Addresses).some((key) => Addresses[key].ChannelType === 'SMS');
    // Attaching to input so it will get logged with the error :)
    (input as any).pinpointInput = {
      ApplicationId: process.env.PINPOINT_ID,
      MessageRequest: {
        Addresses: Addresses as any,
        MessageConfiguration: {
          ...(hasSMS && {
            SMSMessage: {
              MessageType: MessageType.TRANSACTIONAL,
            }
          }),
          EmailMessage: {
            FromAddress: process.env.FROM_EMAIL,
          },
        },
        TemplateConfiguration: {
          ...(hasSMS && {
            SMSTemplate: {
              Name: input.template,
              Version: '1',
            },
          }),
          EmailTemplate: {
            Name: input.template,
            Version: '1',
          },
        },
      }
    };
    const res = await pinpoint.send(new SendMessagesCommand((input as any).pinpointInput));
    // logger.info('Pinpoint response', { res });
    console.log(JSON.stringify(res, null, 2));
  }
}

// TODO: Group events together when it makes sense.
const sendEmail = async (input: MailerEvent) => {
  try {
    const context = await createContext();
    let Addresses: Record<string, AddressConfiguration> = {};
    if (input.template === MailerEvents.OfficerEventRemoved) {
      const { event, organization, modifiedById } = input.data;

      const allShifts = await context.shifts.collection.aggregate(JSON.parse(JSON.stringify([
        {
          $match: {
            eventId: event.id,
            userId: {
              $exists: true,
            },
            removedAt: { $exists: false },
          },
        },
        {
          $addFields: {
              userId: {
                $toObjectId: "$userId",
              },
              assignmentId: { $toObjectId: '$assignmentId' },
            },
        },
        {
          $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
        },
        {
          $lookup: {
              from: "assignments",
              localField: "assignmentId",
              foreignField: "_id",
              as: "assignment",
            },
        },
        {
          $addFields: {
              user: {
                $first: "$user",
              },
              assignment: {
                $first: "$assignment",
              },
            },
        },
        {
          $match: {
            'assignment.removedAt': { $exists: false },
          }
        }
      ])));

      Addresses = {};
      let shift: Shift | null;
      do {
        shift = await allShifts.next() as any;
        if (shift && shift.user && shift.user.member.contactInfo?.primaryEmail.receiveEmails) {
          Addresses[shift.user!.member.contactInfo!.primaryEmail.address] = {
            ChannelType: 'EMAIL',
            Substitutions: {
              'user.first_name': [shift.user!.firstName],
              'shift.name': [shift.assignment.name],
              'event.name': [event.name],
              'system.metro_name': [organization.name],
            },
          };
        }
        if (shift && shift.user && shift.user.member.contactInfo?.primaryPhone.receiveTexts) {
          Addresses[shift.user!.member.contactInfo!.primaryPhone.number] = {
            ChannelType: 'SMS',
            Substitutions: {
              'shift.name': [shift.assignment.name],
              'event.name': [event.name],
              'system.metro_name': [organization.name],
            },
          };
        }
      } while(shift);

      try {
        await context.assignments.removeAllByEventId(organization.id, event.id, modifiedById);
        await context.shifts.removeAllByEventId(organization.id, event.id, modifiedById);
        await context.shiftBufferRequests.removeByEventId(event.id, modifiedById);
        await context.shiftLotteryRequests.removeByEventId(event.id, modifiedById);
      } catch(error) {
        logger.error('Failed to clean up event', { error, input });
      }
    } else if (
      input.template === MailerEvents.OfficerAdminApprovedSkill ||
      input.template === MailerEvents.OfficerAdminDeniedSkill
    ) {
      const { user, skill, organization } = input.data;

      if (user.member.contactInfo?.primaryEmail.receiveEmails) {
        Addresses = {
          ...Addresses,
          [user.member.contactInfo!.primaryEmail.address]: {
            ChannelType: 'EMAIL',
            Substitutions: {
              'user.first_name': [user.firstName],
              'skill.name': [skill.name],
              'system.metro_name': [organization.name],
              ...(input.template === MailerEvents.OfficerAdminDeniedSkill && { 'skill.denial_reason': [skill.statusReason || ''] }),
            },
          },
        };
      }

      if (user.member.contactInfo?.primaryPhone.receiveTexts) {
        Addresses = {
          ...Addresses,
          [user.member.contactInfo!.primaryPhone.receiveTexts]: {
            ChannelType: 'SMS',
            Substitutions: {
              "system.login_url": [process.env.LOGIN_URL || ''],
              'skill.name': [skill.name],
              'system.metro_name': [organization.name],
            },
          },
        };
      }
    } else if (input.template === MailerEvents.AdminPendingShiftRequested) {
      const { shift, createdShiftBuffer, shiftBufferShift, user, organization } = input.data;
      
      const event = await context.events.get(shift.eventId);
      if (!event) {
        logger.error('Event not found', { input, event });
        return;
      }
      const bufferEvent = await context.events.get(shiftBufferShift.eventId);
      if (!bufferEvent) {
        logger.error('Buffer event not found', { input, bufferEvent });
        return;
      }

      const bufferVenue = await context.venues.get(bufferEvent.venueId);
      if (!bufferVenue) {
        logger.error('Buffer Venue not found', { input, bufferVenue });
        return;
      }
      const venue = await context.venues.get(event.venueId);
      if (!venue) {
        logger.error('Venue not found', { input, venue });
        return;
      }

      const bufferAssignment = await context.assignments.get(shiftBufferShift.assignmentId);
      if (!bufferAssignment) {
        logger.error('Buffer assignment not found', { input, bufferAssignment });
        return;
      }
      const assignment = await context.assignments.get(shift.assignmentId);
      if (!assignment) {
        logger.error('Assignment not found', { input, assignment });
        return;
      }

      const allAdmins: User[] = await context.users.getAllAdmins({
        orgId: event.orgId,
      }) as any[];

      const shiftStart = convertDate(shift.startTime as any, organization);
      const shiftEnd = convertDate(shift.endTime as any, organization);
      const bufferShiftStart = convertDate(shiftBufferShift.startTime as any, organization);
      const bufferShiftEnd = convertDate(shiftBufferShift.endTime as any, organization);

      // TODO: Look up conflicting shift
      Addresses = (allAdmins || [])
        .filter((admin: User) => admin.member.contactInfo?.primaryEmail.receiveEmails)
        .reduce((obj, admin) => {
          const Substitutions: Record<string, string[]> = {
            "user.first_name": [user.firstName],
            "user.last_name":  [user.lastName],
            "admin.first_name": [admin.firstName],
            "event.reference_number_request": [event.referenceId],
            "event.name_request": [event.name],
            "shift.name_request": [assignment.name],
            "venue.name_request": [venue.name],
            "event.start_date_request": [shiftStart.date],
            "event.start_time_request": [shiftStart.time],
            "event.end_date_request": [shiftEnd.date],
            "event.end_time_request": [shiftEnd.time],
            "event.reference_number_conflict": [bufferEvent.referenceId],
            "event.name_conflict": [bufferEvent.name],
            "shift.name_conflict": [bufferAssignment.name],
            "venue.name_conflict": [bufferVenue.name],
            "event.start_date_conflict": [bufferShiftStart.date],
            "event.start_time_conflict": [bufferShiftStart.time],
            "event.end_date_conflict": [bufferShiftEnd.date],
            "event.end_time_conflict": [bufferShiftEnd.time],
            "shift.buffer_override_reason": [createdShiftBuffer.note || ''],
            "system.login_url": [`${process.env.APP_URL || ''}/dashboard/admin/users/request/buffer`],
            "system.metro_name": [organization.name],
          };
          const email = admin.member.contactInfo!.primaryEmail.address || '';

          return {
            ...obj,
            [email]: {
              ChannelType: 'EMAIL',
              Substitutions,
            } as AddressConfiguration,
          };
        }, {} as Record<string, AddressConfiguration>);
    } else if (
      input.template === MailerEvents.OfficerPendingShiftApproved ||
      input.template === MailerEvents.OfficerPendingShiftDenied
    ) {
      const { shift, request, organization } = input.data;

      const user = await context.users.get(request.userId);
      if (!user) {
        logger.error('User not found', { input, user });
        return;
      }

      const event = await context.events.get(shift.eventId);
      if (!event) {
        logger.error('Event not found', { input, event });
        return;
      }

      const venue = await context.venues.get(event.venueId);
      if (!venue) {
        logger.error('Venue not found', { input, venue });
      }

      const assignment = await context.assignments.get(shift.assignmentId);
      if (!assignment) {
        logger.error('Assignment not found', { input, assignment });
        return;
      }

      const shiftStart = convertDate(shift.startTime as any, organization);
      const shiftEnd = convertDate(shift.endTime as any, organization);

      if (input.template === MailerEvents.OfficerPendingShiftApproved) {
        const venue = await context.venues.get(event.venueId);
        if (venue) {
          // Check if event is fully staffed
          if (event.notifyWhenFullyStaffed) {
            const totalUnassignedShifts = await context.shifts.collection.countDocuments({
              eventId: event.id,
              removedAt: { $exists: false },
              $or: [
                { userId: null },
                { userId: { $exists: false } },
              ],
            });
            if (totalUnassignedShifts === 0) {
              const allAdmins = await context.users.getAllAdmins({
                orgId: event.orgId,
              }) as any[];
    
              const eventStart = convertDate(event.startTime as any, organization);
              const eventEnd = convertDate(event.endTime as any, organization);
              const SMSAddresses = {};
              const EmailAddresses = (allAdmins || [])
                .filter((admin: User) => admin.member.contactInfo!.primaryEmail.receiveEmails)
                .reduce((obj, admin) => {
                  const Substitutions: Record<string, string[]> = {
                    "event.name": [event.name],
                    "event.start_date": [eventStart.date],
                    "admin.first_name": [admin.firstName],
                    "event.reference_number": [event.referenceId],
                    "venue.name": [venue.name],
                    "event.start_time": [eventStart.time],
                    "event.end_date": [eventEnd.date],
                    "event.end_time": [eventEnd.time],
                    "system.metro_name": [organization.name],
                  };
                  const email = admin.member.contactInfo!.primaryEmail.address || '';
    
                  return {
                    ...obj,
                    [email]: {
                      ChannelType: 'EMAIL',
                      Substitutions,
                    } as AddressConfiguration,
                  };
                }, {} as Record<string, AddressConfiguration>);
    
              const finalAddresses = {
                ...EmailAddresses,
                ...SMSAddresses,
              } as any;
              if (Object.keys(finalAddresses).length > 0) {
                await sendInChunks({
                  ...input,
                  template: MailerEvents.AdminEventFullyStaffed,
                }, finalAddresses);
              }
            }
          }
    
          // Check if assignment is fully staffed
          if (assignment.notifyWhenFullyStaffed) {
            const totalUnassignedShifts = await context.shifts.collection.countDocuments({
              eventId: event.id,
              assignmentId: assignment.id,
              $or: [
                { userId: null },
                { userId: { $exists: false } },
              ],
              removedAt: { $exists: false },
            });
            if (totalUnassignedShifts === 0) {
              const allAdmins = await context.users.getAllAdmins({
                orgId: event.orgId,
              }) as any[];
    
              const eventStart = convertDate(event.startTime as any, organization);
              const eventEnd = convertDate(event.endTime as any, organization);
              const SMSAddresses = {};
              const EmailAddresses = (allAdmins || [])
                .filter((admin: User) => admin.member.contactInfo!.primaryEmail.receiveEmails)
                .reduce((obj, admin) => {
                  const Substitutions: Record<string, string[]> = {
                    "shift.name": [assignment.name],
                    "event.name": [event.name],
                    "admin.first_name": [admin.firstName],
                    "event.reference_number": [event.referenceId],
                    "venue.name": [venue.name],
                    "event.start_date": [eventStart.date],
                    "event.start_time": [eventStart.time],
                    "event.end_date": [eventEnd.date],
                    "event.end_time": [eventEnd.time],
                    "system.metro_name": [organization.name],
                  };
                  const email = admin.member.contactInfo!.primaryEmail.address || '';
    
                  return {
                    ...obj,
                    [email]: {
                      ChannelType: 'EMAIL',
                      Substitutions,
                    } as AddressConfiguration,
                  };
                }, {} as Record<string, AddressConfiguration>);
    
              const finalAddresses = {
                ...EmailAddresses,
                ...SMSAddresses,
              } as any;
              if (Object.keys(finalAddresses).length > 0) {
                await sendInChunks({
                  ...input,
                  template: MailerEvents.AdminEventShiftsFilled,
                }, finalAddresses);
              }
            }
          }
        }
      }

      if (user.member.contactInfo?.primaryEmail.receiveEmails) {
        Addresses = {
          ...Addresses,
          [user.member.contactInfo!.primaryEmail.address]: {
            ChannelType: 'EMAIL',
            Substitutions: {
              "shift.name": [assignment.name],
              "event.name": [event.name],
              "user.first_name": [user.firstName],
              "event.reference_number": [event.referenceId],
              "shift.start_date": [shiftStart.date],
              "shift.start_time": [shiftStart.time],
              "shift.end_date": [shiftEnd.date],
              "shift.end_time": [shiftEnd.time],
              "system.metro_name": [organization.name],
              ...(input.template === MailerEvents.OfficerPendingShiftDenied && request.reason ? {
                'request.reason': [request.reason],
              } : {}),
            },
          },
        };
      }
      if (user.member.contactInfo?.primaryPhone.receiveTexts) {
        Addresses = {
          ...Addresses,
          [user.member.contactInfo!.primaryPhone.number]: {
            ChannelType: 'SMS',
            Substitutions: {
              "shift.name": [assignment.name],
              "event.name": [event.name],
              "venue.name": [venue?.name || ''],
            },
          },
        };
      }
    } else if (input.template === MailerEvents.OfficerAdminAssignedShift) {
      const { adminAssignedShift, shift, organization } = input.data;
      const event = await context.events.get(shift.eventId);
      if (!event) {
        logger.error('Event not found', { input, event });
        return;
      }
      const venue = await context.venues.get(event.venueId);
      if (!venue) {
        logger.error('Venue not found', { input, venue });
        return;
      }
      const assignment = await context.assignments.get(shift.assignmentId);
      if (!assignment) {
        logger.error('Assignment not found', { input, assignment });
        return;
      }

      if (adminAssignedShift) {
        const user = await context.users.get(shift.userId);
        if (!user) {
          logger.error('User not found', { input, user });
          return;
        }

        const shiftStart = convertDate(shift.startTime as any, organization);
        const shiftEnd = convertDate(shift.endTime as any, organization);

        if (user.member.contactInfo?.primaryEmail.receiveEmails) {
          Addresses = {
            ...Addresses,
            [user.member.contactInfo!.primaryEmail.address]: {
              ChannelType: 'EMAIL',
              Substitutions: {
                "system.metro_name": [organization.name],
                "user.first_name": [user.firstName],
                "event.name": [event.name],
                "shift.name": [assignment.name],
                "shift.start_date": [shiftStart.date],
                "shift.start_time": [shiftStart.time],
                "shift.end_date": [shiftEnd.date],
                "shift.end_time": [shiftEnd.time],
                "system.login_url": [process.env.LOGIN_URL || ''],
              },
            },
          };
        }
        if (user.member.contactInfo?.primaryPhone.receiveTexts) {
          Addresses = {
            ...Addresses,
            [user.member.contactInfo!.primaryPhone.number]: {
              ChannelType: 'SMS',
              Substitutions: {
                "system.metro_name": [organization.name],
                "system.login_url": [process.env.LOGIN_URL || ''],
              },
            },
          };
        }
      }
    } else if (input.template === MailerEvents.OfficerRemovedFromShift) {
      const { shift, removeUser, existingUserId, organization } = input.data;

      const event = await context.events.get(shift.eventId);
      if (!event) {
        logger.error('Event not found', { input, event });
        return;
      }
      const assignment = await context.assignments.get(shift.assignmentId);
      if (!assignment) {
        logger.error('Assignment not found', { input, assignment });
        return;
      }
      const user = await context.users.get(existingUserId);
      if (!user) {
        logger.error('User not found', { input, user });
        return;
      }

      const shiftStart = convertDate(shift.startTime as any, organization);
      const shiftEnd = convertDate(shift.endTime as any, organization);

      if (user.member.contactInfo!.primaryEmail.receiveEmails) {
        Addresses = {
          ...Addresses,
          [user.member.contactInfo!.primaryEmail.address]: {
            ChannelType: 'EMAIL',
            Substitutions: {
              "shift.name": [assignment.name],
              "event.name": [event.name],
              "shift.start_date": [shiftStart.date],
              "user.first_name": [user.firstName],
              "event.reference_number": [event.referenceId],
              "shift.start_time": [shiftStart.time],
              "shift.end_date": [shiftEnd.date],
              "shift.end_time": [shiftEnd.time],
              ...(shift.relinquishNote ? {"shift.relinquish_note": [shift.relinquishNote]}: {}),
              "system.metro_name": [organization.name],
            },
          },
        };
      }

      const allAdmins = await context.users.getAllAdmins({
        orgId: event.orgId,
      }) as any[];

      const EmailAddresses = (allAdmins || [])
        .filter((admin: User) => admin.member.contactInfo?.primaryEmail.receiveEmails)
        .reduce((obj, admin) => {
          const Substitutions: Record<string, string[]> = {
            "shift.name": [assignment.name],
            "event.name": [event.name],
            "shift.start_date": [shiftStart.date],
            "user.first_name": [user.firstName],
            "user.last_name": [user.lastName],
            'admin.first_name': [removeUser.firstName],
            'admin.unassign.first_name': [removeUser.firstName],
            'admin.unassign.last_name': [removeUser.lastName],
            "event.reference_number": [event.referenceId],
            "shift.start_time": [shiftStart.time],
            "shift.end_date": [shiftEnd.date],
            "shift.end_time": [shiftEnd.time],
            "shift.reference_number": [`${shift.refNumber}`],
            "unassigned_reason": shift.relinquishNote ? [shift.relinquishNote] : ['N/A'],
            "system.metro_name": [organization.name],
          };
          const email = admin.member.contactInfo!.primaryEmail.address || '';

          return {
            ...obj,
            [email]: {
              ChannelType: 'EMAIL',
              Substitutions,
            } as AddressConfiguration,
          };
        }, {} as Record<string, AddressConfiguration>);
      
      if (Object.keys(EmailAddresses).length > 0) {
        try {
          await sendInChunks({
            ...input,
            template: MailerEvents.AdminUnassignOfficerShift,
          }, EmailAddresses);
        } catch(error) {
          logger.error('Failed to send admin notification', { error });
        }
      }

    } else if (input.template === MailerEvents.AdminShiftRelinquished) {
      const { existingUserId, shift, organization } = input.data;

      const event = await context.events.get(shift.eventId);
      if (!event) {
        logger.error('Event not found', { input, event });
        return;
      }
      const assignment = await context.assignments.get(shift.assignmentId);
      if (!assignment) {
        logger.error('Assignment not found', { input, assignment });
        return;
      }
      const user = await context.users.get(existingUserId);
      if (!user) {
        logger.error('User not found', { input, user });
        return;
      }

      const shiftStart = convertDate(shift.startTime as any, organization);
      const shiftEnd = convertDate(shift.endTime as any, organization);

      const allAdmins = await context.users.getAllAdmins({
        orgId: event.orgId,
      }) as any[];

      Addresses = (allAdmins || [])
        .filter((admin: User) => admin.member.contactInfo?.primaryEmail.receiveEmails)
        .reduce((obj, admin) => {
          const Substitutions: Record<string, string[]> = {
            "user.first_name": [user.firstName],
            "user.last_name": [user.lastName],
            "shift.name": [assignment.name],
            "event.name": [event.name],
            "admin.first_name": [admin.firstName],
            "event.reference_number": [event.referenceId],
            "shift.start_date": [shiftStart.date],
            "shift.start_time": [shiftStart.time],
            "shift.end_date": [shiftEnd.date],
            "shift.end_time": [shiftEnd.time],
            "relinquish_reason": [shift.relinquishNote || ''],
            "system.metro_name": [organization.name],
            "shift.reference_number": [`${shift.refNumber}`],
          };
          const email = admin.member.contactInfo!.primaryEmail.address || '';

          return {
            ...obj,
            [email]: {
              ChannelType: 'EMAIL',
              Substitutions,
            } as AddressConfiguration,
          };
        }, {} as Record<string, AddressConfiguration>);
    } else if (input.template === MailerEvents.OfficerAssignmentRemoved) {
      const { assignment, organization, modifiedById } = input.data;

      const event = await context.events.get(assignment.eventId);
      if (!event) {
        logger.error('Event not found', { input, event });
        return;
      }

      const allShifts = await context.shifts.collection.aggregate(JSON.parse(JSON.stringify([
        {
          $match: {
            eventId: event.id,
            assignmentId: assignment.id,
            userId: {
              $exists: true,
            },
            removedAt: { $exists: false },
          },
        },
        {
          $addFields: {
              userId: {
                $toObjectId: "$userId",
              },
            },
        },
        {
          $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
        },
        {
          $addFields: {
              user: {
                $first: "$user",
              },
            },
        },
        {
          $match: {
            'user.removedAt': { $exists: false },
          }
        }
      ])));

      let shift: Shift | null;
      do {
        shift = await allShifts.next() as any;
        if (shift && shift.user?.member.contactInfo?.primaryEmail.receiveEmails) {
          Addresses[shift.user!.member.contactInfo!.primaryEmail.address] = {
            ChannelType: 'EMAIL',
            Substitutions: {
              "shift.name": [assignment.name],
              "event.name": [event.name],
              "system.metro_name": [organization.name],
              "user.first_name": [shift.user!.firstName],
              "assignment.name": [assignment.name],
            },
          };
        }
        if (shift && shift.user?.member.contactInfo?.primaryPhone.receiveTexts) {
          Addresses[shift.user!.member.contactInfo!.primaryPhone.number] = {
            ChannelType: 'SMS',
            Substitutions: {
              "shift.name": [assignment.name],
              "event.name": [event.name],
              "system.metro_name": [organization.name],
            },
          };
        }
      } while(shift);

      // Remove shifts after notification is sent
      try {
        await context.shifts.removeAllByAssignmentId(organization.id, assignment.id, modifiedById);
      } catch(error) {
        logger.error('Failed to remove shifts by assignment', { error, input });
      }
    } else if (input.template === MailerEvents.OfficerShiftStartingNotification) {
      const { userId, shiftId } = input.data;
      const shift = await context.shifts.get(shiftId);
      if (!shift || shift.userId !== userId) {
        logger.warn('Shift is not assigned to this user', { input, shift });
        return;
      }
      const user = await context.users.get(userId);
      if (!user) {
        logger.error('User not found', { input, user });
        return;
      }
      const organization = await context.organizations.get(shift.orgId);
      if(!organization) {
        logger.error('Organization not found', { input, organization });
        return;
      }

      const event = await context.events.get(shift.eventId);
      if (!event) {
        logger.error('Event not found', { input, event });
        return;
      }

      const assignment = await context.assignments.get(shift.assignmentId);
      if (!assignment) {
        logger.error('Assignment not found', { input, assignment });
        return;
      }

      const shiftStart = convertDate(shift.startTime as any, organization);
      const shiftEnd = convertDate(shift.endTime as any, organization);

      if (user.member.contactInfo!.primaryEmail.receiveEmails) {
        Addresses = {
          ...Addresses,
          [user.member.contactInfo!.primaryEmail.address]: {
            ChannelType: 'EMAIL',
            Substitutions: {
              "shift.name": [assignment.name],
              "event.name": [event.name],
              "user.first_name": [user.firstName],
              "shift.start_time": [shiftStart.time],
              "shift.end_date": [shiftEnd.date],
              "shift.end_time": [shiftEnd.time],
              "system.metro_name": [organization.name],
              "system.login_url": [process.env.LOGIN_URL || ''],
              "shift.start_date": [shiftStart.date],
            },
          },
        };
      }
    } else if (input.template === MailerEvents.LotteryWindowClosing) {
      const { orgId } = input.data;

      const organization = await context.organizations.get(orgId);
      if (!organization) {
        logger.error('Organization not found', { input, organization });
        return;
      }

      const allUsers = await context.users.collection.find({
        'member.orgId': orgId,
        'member.status': MemberStatus.Active,
        removedAt: { $exists: false },
      });

      let user: User | null;
      do {
        user = await allUsers.next() as any;
        if (user && user.member.contactInfo?.primaryEmail.receiveEmails) {
          Addresses[user.member.contactInfo!.primaryEmail.address] = {
            ChannelType: 'EMAIL',
            Substitutions: {
              "user.first_name": [user.firstName],
              "num": [`${organization.settings?.lottery.notifyUsersBeforeClose || 24}`],
              "system.login_url": [process.env.LOGIN_URL || ''],
              "system.metro_name": [organization.name],
            },
          };
        }
        if (user && user.member.contactInfo?.primaryPhone.receiveTexts) {
          Addresses[user.member.contactInfo!.primaryPhone.number] = {
            ChannelType: 'SMS',
            Substitutions: {
              "num": [`${organization.settings?.lottery.notifyUsersBeforeClose || 24}`],
              "system.metro_name": [organization.name],
            },
          };
        }
      } while(user);
    } else if (input.template === MailerEvents.OfficerAvailableOtPosted) {
      const { orgId } = input.data;

      const totalRes = await context.shifts.collection.aggregate(JSON.parse(JSON.stringify([
        {
          $match: {
            orgId,
            userId: {
              $ne: null,
            },
            removedAt: { $exists: false },
          },
        },
        {
          $addFields: {
            eventId: {
              $toObjectId: "$eventId",
            },
          },
        },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        {
          $addFields: {
            event: {
              $first: "$event",
            },
          },
        },
        {
          $match: {
            'event.status': EventStatus.FirstComeFirstServe,
            'event.removedAt': { $exists: false },
          }
        },
        {
          $count: 'total',
        },
      ])));

      if (totalRes?.[0]?.total === 0) {
        logger.warn('No open shifts found', { input });
        return;
      }

      const organization = await context.organizations.get(orgId);
      if (!organization) {
        logger.error('Organization not found', { input, organization });
        return;
      }

      const allUsers = await context.users.collection.find({
        'member.orgId': orgId,
        'member.status': MemberStatus.Active,
        removedAt: { $exists: false },
      });

      let user: User | null;
      do {
        user = await allUsers.next() as any;
        if (user && user.member.contactInfo?.primaryEmail.receiveEmails) {
          Addresses[user.member.contactInfo!.primaryEmail.address] = {
            ChannelType: 'EMAIL',
            Substitutions: {
              "system.metro_name": [organization.name],
              "user.first_name": [user.firstName],
              "system.login_url": [process.env.LOGIN_URL || ''],
            },
          };
        }
        if (user && user.member.contactInfo?.primaryPhone.receiveTexts) {
          Addresses[user.member.contactInfo!.primaryPhone.number] = {
            ChannelType: 'SMS',
            Substitutions: {
              "system.metro_name": [organization.name],
              "system.login_url": [process.env.LOGIN_URL || ''],
            },
          };
        }
      } while(user);
    } else if (input.template === MailerEvents.OfficerFcfsShiftAvailable) {
      const { shiftId, organization } = input.data;

      const shift = await context.shifts.findOne({
        shiftId,
        removedAt: { $exists: false },
        $or: [
          { userId: null },
          { userId: { $exists: false } },
        ],
      });
      if (!shift) {
        logger.error('Shift not found', { input, shift });
        return;
      }

      const assignment = await context.assignments.get(shift.assignmentId);
      if (!assignment) {
        logger.error('Assignment not found', { input, assignment });
        return;
      }

      const event = await context.events.get(shift.eventId);
      if (!event) {
        logger.error('Event not found', { input, event });
        return;
      }

      const shiftStart = convertDate(shift.startTime as any, organization);
      const shiftEnd = convertDate(shift.endTime as any, organization);

      const allUsers = await context.users.collection.find({
        'member.orgId': organization.id,
        'member.status': MemberStatus.Active,
        'member.rankId': { $in: assignment.rankIds },
        removedAt: { $exists: false },
      });

      let user: User | null;
      do {
        user = await allUsers.next() as any;
        if (user) {
          const { canSignUpForShift } = await context.shifts.canSignUpForShift({
            user: {
              ...user,
              id: (user as any)._id.toString(),
            },
            shift,
            orgId: organization.id,
          });
          if (!canSignUpForShift) {
            continue;
          }
          if (user.member.contactInfo?.primaryEmail.receiveEmails) {
            Addresses[user.member.contactInfo!.primaryEmail.address] = {
              ChannelType: 'EMAIL',
              Substitutions: {
                "shift.name": [assignment.name],
                "event.name": [event.name],
                "user.first_name": [user.firstName],
                "system.metro_name": [organization.name],
                "shift.start_date": [shiftStart.date],
                "shift.start_time": [shiftStart.time],
                "shift.end_date": [shiftEnd.date],
                "shift.end_time": [shiftEnd.time],
                "event.reference_number": [event.referenceId],
                "system.login_url": [`${process.env.APP_URL || ''}/dashboard/available/overtime`],
              },
            };
          }
        }
      } while(user);
      if (Object.keys(Addresses).length === 0) {
        logger.warn('No users found', { input });
        return;
      }
    } else if (input.template === MailerEvents.OfficerFcfsEventAvailable) {
      const { eventId, organization } = input.data;

      const event = await context.events.get(eventId);
      if (!event) {
        logger.error('Event not found', { input, event });
        return;
      }

      const assignmentDetails = await context.assignments.collection.find({
        orgId: organization.id,
        eventId: event.id,
      }).project({ _id: 1, rankIds: 1 }).toArray();

      const shiftIds = await context.shifts.collection.find({
        orgId: organization.id,
        eventId: event.id,
        assignmentId: { $in: assignmentDetails.map((a: any) => a._id.toString()) },
        $or: [
          { userId: null },
          { userId: { $exists: false } },
        ],
      }).project({ shiftId: 1 }).toArray();
      const uniqShiftIds = uniq(shiftIds.map((s: any) => s.shiftId));
      const uniqRanksIds = uniq(assignmentDetails.map((a: any) => a.rankIds).flat());

      const eventStart = convertDate(event.startTime as any, organization);
      const eventEnd = convertDate(event.endTime as any, organization);

      const allUsers = await context.users.collection.find({
        'member.orgId': organization.id,
        'member.status': MemberStatus.Active,
        'member.rankId': { $in: uniqRanksIds },
        removedAt: { $exists: false },
      });

      let user: User | null;
      do {
        user = await allUsers.next() as any;
        if (user) {
          let canSignUpForAShift = false;
          for(const shiftId of uniqShiftIds) {
            const shift = await context.shifts.findOne({
              shiftId,
              orgId: organization.id,
              $or: [
                { userId: null },
                { userId: { $exists: false } },
              ],
            });
            if (!shift) {
              continue;
            }
            const { canSignUpForShift } = await context.shifts.canSignUpForShift({
              user: {
                ...user,
                id: (user as any)._id.toString(),
              },
              shift,
              orgId: organization.id,
            });
            if (!canSignUpForShift) {
              continue;
            }
            canSignUpForAShift = true;
            break;
          }
          if (!canSignUpForAShift) {
            continue;
          }
          if (user.member.contactInfo?.primaryEmail.receiveEmails) {
            Addresses[user.member.contactInfo!.primaryEmail.address] = {
              ChannelType: 'EMAIL',
              Substitutions: {
                "event.name": [event.name],
                "user.first_name": [user.firstName],
                "system.metro_name": [organization.name],
                "event.start_date": [eventStart.date],
                "event.end_date": [eventEnd.date],
                "event.reference_number": [event.referenceId],
                "system.login_url": [`${process.env.APP_URL || ''}/dashboard/available/overtime`],
              },
            };
          }
        }
      } while(user);
      if (Object.keys(Addresses).length === 0) {
        logger.warn('No users found', { input });
        return;
      }
    } else if (input.template === MailerEvents.OfficerUserAccountInvitation) {
      const { inviteEmail, user, organization } = input.data;

      Addresses = {
        ...Addresses,
        [inviteEmail]: {
          ChannelType: 'EMAIL',
          Substitutions: {
            "admin.first_name": [user.firstName],
            "admin.last_name": [user.lastName],
            "system.metro_name": [organization.name],
            "system.registration_url": [`${process.env.REGISTER_URL || ''}?orgId=${organization.id}&email=${inviteEmail}`],
          },
        },
      };
    } else if (input.template === MailerEvents.AdminUserAccountRequested) {
      const { user, orgId } = input.data;

     const organization = await context.organizations.get(orgId);

     if (!organization) {
        logger.error('Organization not found', { input, organization });
        return;
     }

      const allAdmins = await context.users.getAllAdmins({
        orgId,
      }) as any[];

      const EmailAddresses = (allAdmins || [])
        .filter((admin: User) => admin.member.contactInfo?.primaryEmail.receiveEmails)
        .reduce((obj, admin) => {
          const Substitutions: Record<string, string[]> = {
            "user.first_name": [user.firstName],
            "user.last_name": [user.lastName],
            "admin.first_name": [admin.firstName],
            "system.metro_name": [organization.name],
            "system.login_url": [`${process.env.APP_URL || ''}/dashboard/admin/users/request/account`],
          };
          const email = admin.member.contactInfo!.primaryEmail.address || '';

          return {
            ...obj,
            [email]: {
              ChannelType: 'EMAIL',
              Substitutions,
            } as AddressConfiguration,
          };
        }, {} as Record<string, AddressConfiguration>);

      const SMSAddresses = {};

      Addresses = {
        ...EmailAddresses,
        ...SMSAddresses,
      };
    } else if (input.template === MailerEvents.OfficerUserAccountDeactivated) {
      const {
        user: inputUser,
        organization,
        inactivateUntil,
        inactivationNote,
      } = input.data;

      const user = await context.users.get(inputUser.id);
      if (!user) {
        logger.warn('User not found', { input });
        return;
      }
      
      let inactiveDate = 'further notice';
      if (inactivateUntil) {
        try {
          inactiveDate = format(new Date(inactivateUntil), 'MM/dd/yyyy');
        } catch(error) {
          logger.error('Failed to format date', { error, inactivateUntil });
        }
      }
      if (user.member.contactInfo?.primaryEmail.receiveEmails) {
        Addresses = {
          ...Addresses,
          [user.member.contactInfo!.primaryEmail.address]: {
            ChannelType: 'EMAIL',
            Substitutions: {
              "deactivated_until": [inactiveDate],
              "deactivation_reason": [inactivationNote],
              "user.first_name": [user.firstName],
              "system.metro_name": [organization.name],
            },
          },
        };
      }
      if (user.member.contactInfo?.primaryPhone.receiveTexts) {
        Addresses = {
          ...Addresses,
          [user.member.contactInfo!.primaryPhone.number]: {
            ChannelType: 'SMS',
            Substitutions: {
              "system.metro_name": [organization.name],
            },
          },
        };
      }
    } else if (input.template === MailerEvents.OfficerUserAccountReactivated) {
      let {
        user: inputUser,
        organization,
        orgId,
      } = input.data;

      const user = await context.users.get(inputUser.id);
      if (!user) {
        logger.warn('User not found', { input });
        return;
      }

      if (!organization) {
        organization = await context.organizations.get(orgId);
        if (!organization) {
          logger.error('Organization not found', { input, organization });
          return;
        }
      }
      if (user.member.contactInfo?.primaryEmail.receiveEmails) {
        Addresses = {
          ...Addresses,
          [user.member.contactInfo!.primaryEmail.address]: {
            ChannelType: 'EMAIL',
            Substitutions: {
              "user.first_name": [user.firstName],
              "system.metro_name": [organization.name],
              "system.login_url": [process.env.LOGIN_URL || ''],
            },
          },
        };
      }
      if (user.member.contactInfo?.primaryPhone.receiveTexts) {
        Addresses = {
          ...Addresses,
          [user.member.contactInfo!.primaryPhone.number]: {
            ChannelType: 'SMS',
            Substitutions: {
              "system.metro_name": [organization.name],
              "system.login_url": [process.env.LOGIN_URL || ''],
            },
          },
        };
      }
    }

    if (Object.keys(Addresses).length === 0) {
      logger.info('No addresses to send emails to', {
        input,
        Addresses,
      });
      return;
    }
    await sendInChunks(input, Addresses);
  } catch(error) {
    logger.error('Error sending email', { error, input });
    throw error;
  }
};

const mailer = async (event: MailerEvent) => {
  if (event.action === 'SMS') {
  } else if (event.action === 'Email') {
    await sendEmail(event);
  }
};

export const handler = middy(mailer)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
