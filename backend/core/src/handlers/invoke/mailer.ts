import middy from "@middy/core";
import webPush from 'web-push';
import { ObjectId } from "mongodb";
import difference from 'lodash.difference';
import uniq from 'lodash.uniq';
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { AddressConfiguration, PinpointClient, SendMessagesCommand } from "@aws-sdk/client-pinpoint";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import logger from "../../utils/logger";
import chunk from 'lodash.chunk';
import { MailerEvent, MailerEvents } from "../../types/mailer";
import { createContext, IServiceContext } from "../../utils/createContext";
import { EventStatus, MemberStatus, ShiftStatus } from "../../__generated__/resolvers-types";
import { InAppTemplates } from "../../types/inAppTemplates";
import { IAssignment } from "../../models/assignment";
import { IOrganization } from "../../models/organizations/organization.entity";
import { IShift, IShiftExpanded } from "../../models/shift";
import { IInAppNotificationMeta } from "../../models/inAppNotifications";
import { IUser } from "../../types/common";
import { IEvent } from "../../models/event";
import { IIVenue } from "../../models/venue";
import { IAssignmentUpdates, IEventUpdates, IShiftUpdates } from "../../types/notifications";

const pinpoint = new PinpointClient({});

const convertDate = (unixDate: number | Date, organization: IOrganization) => {
  const zonedDate = toZonedTime(new Date(unixDate), organization?.timezone || 'America/Los_Angeles' as any);
  return {
    date: format(zonedDate, 'MM/dd/yyyy'),
    time: format(zonedDate, 'HH:mm'),
  };
};

const sendInChunks = async (input: any, Addresses: any, Version: string, fromEmail: string) => {
  if (Object.keys(Addresses).length > 100) {
    const chunks = chunk(Object.keys(Addresses), 100, undefined).map((chunk) => {
      const obj = {} as Record<string, AddressConfiguration>;
      chunk.forEach((key) => {
        obj[key] = Addresses[key];
      });
      return obj;
    });
    for(const chunk of chunks) {
      // Attaching to input so it will get logged with the error :)
      (input as any).pinpointInput = {
        ApplicationId: process.env.PINPOINT_ID,
        MessageRequest: {
          Addresses: chunk as any,
          MessageConfiguration: {
            EmailMessage: {
              FromAddress: fromEmail,
            },
          },
          TemplateConfiguration: {
            EmailTemplate: {
              Name: input.template,
              Version,
            },
          },
        }
      };
      const res = await pinpoint.send(new SendMessagesCommand((input as any).pinpointInput));
      console.log(JSON.stringify(res, null, 2));
      // logger.info('Pinpoint response', { res });
    }
  } else {
    // Attaching to input so it will get logged with the error :)
    (input as any).pinpointInput = {
      ApplicationId: process.env.PINPOINT_ID,
      MessageRequest: {
        Addresses: Addresses as any,
        MessageConfiguration: {
          EmailMessage: {
            FromAddress: fromEmail,
          },
        },
        TemplateConfiguration: {
          EmailTemplate: {
            Name: input.template,
            Version,
          },
        },
      }
    };
    const res = await pinpoint.send(new SendMessagesCommand((input as any).pinpointInput));
    // logger.info('Pinpoint response', { res });
    console.log(JSON.stringify(res, null, 2));
  }
};

const sendInAppNotification = async ({
  context,
  title,
  body,
  templateName,
  userId,
  orgId,
  meta,
} : {
  context: IServiceContext;
  title: string;
  templateName: string;
  body: string;
  userId: string;
  orgId: string;
  meta?: IInAppNotificationMeta;
}) => {
  try {
    if (!userId) {
      logger.warn('No user id provided', { title, body, templateName, userId, orgId });
      return;
    }
    // Create in app notification
    // TODO: Add in-app notification setting check
    await context.inAppNotifications.create({
      title,
      body,
      userId,
      templateName,
      orgId,
      meta,
    });

    webPush.setVapidDetails(
      process.env.APP_URL!,
      process.env.BROWSER_PUBLIC_KEY!,
      process.env.BROWSER_PRIVATE_KEY!,
    );
    const browserSubscriptions = await context.browserNotificationSubscriptions.getByUserId(userId);

    const removeSubscriptions: ObjectId[] = [];
    const promises = browserSubscriptions.map(async ({ id, subscription }) => {
      try {
        await webPush.sendNotification(subscription, JSON.stringify({title, body}), { TTL: 10 });
      } catch(error) {
        if (error.statusCode === 410) {
          removeSubscriptions.push(new ObjectId(id));
        } else {
          logger.error('Failed to send in-app notification', {
            error,
            event: {
              title,
              body,
              templateName,
              userId,
              orgId,
            }
          });
        }
      }
    });
    await Promise.allSettled(promises);
    if (removeSubscriptions.length > 0) {
      await context.browserNotificationSubscriptions.removeMany({ _id: {$in: removeSubscriptions} });
    }
  } catch(error) {
    logger.error('Failed to send in-app notification', { error });
  }
}

// TODO: Group events together when it makes sense.
const sendEmail = async (input: MailerEvent) => {
  try {
    const context = await createContext();
    let Addresses: Record<string, AddressConfiguration> = {};
    let templateVersion: string = '1';
    let fromEmail: string = process.env.FROM_EMAIL!;
    if (input.template === MailerEvents.OfficerEventRemoved) {
      const { event, organization, modifiedById } = input.data;
      fromEmail = organization.fromEmail;
      const allShifts = context.shifts.collection.aggregate<IShiftExpanded>([
        {
          $match: {
            eventId: new ObjectId(event.id),
            userId: {
              $exists: true,
            },
            removedAt: { $exists: false },
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
      ]);

      Addresses = {};
      let shift: IShiftExpanded | null;
      do {
        shift = await allShifts.next();
        if (shift && shift.user && shift.user.member.contactInfo?.primaryEmail.receiveEmails) {
          Addresses[shift.user!.member.contactInfo!.primaryEmail.address] = {
            ChannelType: 'EMAIL',
            Substitutions: {
              'user.first_name': [shift.user!.firstName],
              'shift.name': [shift?.assignment?.name || ''],
              'event.name': [event.name],
              'system.metro_name': [organization.name],
            },
          };
        }

        if (shift) {
          const { title, body } = InAppTemplates[input.template]({
            eventName: event.name,
            metroName: organization.name,
            shiftName: shift!.assignment?.name || '',
          });
          await sendInAppNotification({
            context,
            userId: shift!.userId?.toString() || '',
            templateName: input.template,
            orgId: organization.id,
            title,
            body,
            meta: {
              eventId: new ObjectId(event.id) as any,
            },
          });
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
      fromEmail = organization.fromEmail;

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

      const { title, body } = InAppTemplates[input.template]({
        metroName: organization.name,
        skillName: skill.name,
      });
      await sendInAppNotification({
        context,
        userId: user.id,
        templateName: input.template,
        orgId: organization.id,
        title,
        body,
        meta: {
          skillId: new ObjectId(skill.id) as any,
        },
      });

    } else if (
      input.template === MailerEvents.OfficerAdminApprovedEquipment ||
      input.template === MailerEvents.OfficerAdminDeniedEquipment
    ) {
      const { user, equipment, memberEquipment, organization } = input.data;
      fromEmail = organization.fromEmail;

      if (user.member.contactInfo?.primaryEmail.receiveEmails) {
        Addresses = {
          ...Addresses,
          [user.member.contactInfo!.primaryEmail.address]: {
            ChannelType: 'EMAIL',
            Substitutions: {
              'user.first_name': [user.firstName],
              'equipment.name': [equipment.name],
              'system.metro_name': [organization.name],
              ...(input.template === MailerEvents.OfficerAdminDeniedEquipment && { 'equipment.denial_reason': [memberEquipment.statusReason || ''] }),
            },
          },
        };
      }

      const { title, body } = InAppTemplates[input.template]({
        metroName: organization.name,
        equipmentName: equipment.name,
      });
      await sendInAppNotification({
        context,
        userId: user.id,
        templateName: input.template,
        orgId: organization.id,
        title,
        body,
        meta: {
          equipmentId: new ObjectId(equipment.id) as any,
        },
      });

    } else if (input.template === MailerEvents.AdminPendingShiftRequested) {
      const { shift, createdShiftBuffer, shiftBufferShift, user, organization } = input.data;
      fromEmail = organization.fromEmail;
      
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

      const bufferVenue = await context.venues.get(bufferEvent.venueId!);
      if (!bufferVenue) {
        logger.error('Buffer Venue not found', { input, bufferVenue });
        return;
      }
      const venue = await context.venues.get(event.venueId!);
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

      const allAdmins = await context.users.getAllAdmins({
        orgId: event.orgId,
      });

      const shiftStart = convertDate(shift.startTime, organization);
      const shiftEnd = convertDate(shift.endTime, organization);
      const bufferShiftStart = convertDate(shiftBufferShift.startTime, organization);
      const bufferShiftEnd = convertDate(shiftBufferShift.endTime, organization);

      const inAppPromises: Promise<any>[] = [];
      // TODO: Look up conflicting shift
      Addresses = (allAdmins || [])
        .filter((admin) => {
          const { title, body } = InAppTemplates[input.template]({
            name: user.name,
          });
          inAppPromises.push(sendInAppNotification({
            context,
            userId: admin?._id?.toString() || '',
            templateName: input.template,
            orgId: organization.id,
            title,
            body,
            meta: {
              eventId: new ObjectId(event.id),
              shiftId: shift.shiftId,
              venueId: new ObjectId(venue.id),
              assignmentId: new ObjectId(assignment.id),
              shiftBufferRequestId: new ObjectId(createdShiftBuffer.id),
            },
          }));
          return admin.member.contactInfo?.primaryEmail.receiveEmails
        })
        .reduce((obj, admin) => {
          const Substitutions: Record<string, string[]> = {
            "user.first_name": [user.firstName],
            "user.last_name":  [user.lastName],
            "admin.first_name": [admin.firstName],
            "event.reference_number_request": [`${event.referenceId}`],
            "event.name_request": [event.name],
            "shift.name_request": [assignment.name],
            "venue.name_request": [venue.name],
            "event.start_date_request": [shiftStart.date],
            "event.start_time_request": [shiftStart.time],
            "event.end_date_request": [shiftEnd.date],
            "event.end_time_request": [shiftEnd.time],
            "event.reference_number_conflict": [`${bufferEvent.referenceId}`],
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

      await Promise.all(inAppPromises);
    } else if (
      input.template === MailerEvents.OfficerPendingShiftApproved ||
      input.template === MailerEvents.OfficerPendingShiftDenied
    ) {
      const { shift, request, organization } = input.data;
      fromEmail = organization.fromEmail;

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

      const venue = await context.venues.get(event.venueId!);
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

      const inAppPromises: Promise<any>[] = [];

      if (input.template === MailerEvents.OfficerPendingShiftApproved) {
        const venue = await context.venues.get(event.venueId!);
        if (venue) {
          // Check if event is fully staffed
          if (event.notifyWhenFullyStaffed) {
            const totalUnassignedShifts = await context.shifts.collection.countDocuments({
              eventId: event._id,
              removedAt: { $exists: false },
              $or: [
                { userId: null },
                { userId: { $exists: false } },
              ],
            });
            if (totalUnassignedShifts === 0) {
              const allAdmins = await context.users.getAllAdmins({
                orgId: event.orgId,
              });
    
              const eventStart = convertDate(event.startTime!, organization);
              const eventEnd = convertDate(event.endTime!, organization);
              const EmailAddresses = (allAdmins || [])
                .filter((admin) => {
                  const { title, body } = InAppTemplates[MailerEvents.AdminEventFullyStaffed]({
                    eventRefNumber: event.referenceId,
                    eventName: event.name,
                    venueName: venue.name,
                  });
                  inAppPromises.push(sendInAppNotification({
                    context,
                    userId: admin._id!.toString()!,
                    templateName: MailerEvents.AdminEventFullyStaffed,
                    orgId: organization.id,
                    title,
                    body,
                    meta: {
                      eventId: new ObjectId(event.id),
                    }
                  }));
                  return admin.member.contactInfo!.primaryEmail.receiveEmails
                })
                .reduce((obj, admin) => {
                  const Substitutions: Record<string, string[]> = {
                    "event.name": [event.name],
                    "event.start_date": [eventStart.date],
                    "admin.first_name": [admin.firstName],
                    "event.reference_number": [`${event.referenceId}`],
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
              };
              if (Object.keys(finalAddresses).length > 0) {
                await sendInChunks({
                  ...input,
                  template: MailerEvents.AdminEventFullyStaffed,
                }, finalAddresses, templateVersion, fromEmail);
              }
            }
          }
    
          // Check if assignment is fully staffed
          if (assignment.notifyWhenFullyStaffed) {
            const totalUnassignedShifts = await context.shifts.collection.countDocuments({
              eventId: event._id,
              assignmentId: assignment._id,
              $or: [
                { userId: null },
                { userId: { $exists: false } },
              ],
              removedAt: { $exists: false },
            });
            if (totalUnassignedShifts === 0) {
              const allAdmins = await context.users.getAllAdmins({
                orgId: event.orgId,
              });
    
              const eventStart = convertDate(event.startTime!, organization);
              const eventEnd = convertDate(event.endTime!, organization);
              const EmailAddresses = (allAdmins || [])
                .filter((admin) => {
                  const { title, body } = InAppTemplates[MailerEvents.AdminEventShiftsFilled]({
                    shiftName: assignment.name,
                    eventName: event.name,
                    venueName: venue.name,
                  });
                  inAppPromises.push(sendInAppNotification({
                    context,
                    userId: admin._id!.toString()!,
                    templateName: MailerEvents.AdminEventShiftsFilled,
                    orgId: organization.id,
                    title,
                    body,
                    meta: {
                      eventId: new ObjectId(event.id),
                      assignmentId: new ObjectId(assignment.id),
                    }
                  }));
                  return admin.member.contactInfo!.primaryEmail.receiveEmails
                })
                .reduce((obj, admin) => {
                  const Substitutions: Record<string, string[]> = {
                    "shift.name": [assignment.name],
                    "event.name": [event.name],
                    "admin.first_name": [admin.firstName],
                    "event.reference_number": [`${event.referenceId}`],
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
              };
              if (Object.keys(finalAddresses).length > 0) {
                await sendInChunks({
                  ...input,
                  template: MailerEvents.AdminEventShiftsFilled,
                }, finalAddresses, templateVersion, fromEmail);
              }
            }
          }
        }
      }

      const { title, body } = InAppTemplates[input.template]({
        shiftName: assignment.name,
        eventName: event.name,
        venueName: venue?.name || '',
        reason: request.reason,
      });
      inAppPromises.push(sendInAppNotification({
        context,
        userId: user.id!,
        templateName: input.template,
        orgId: organization.id,
        title,
        body,
        meta: {
          eventId: new ObjectId(event.id),
          shiftId: shift.shiftId,
          assignmentId: new ObjectId(assignment.id),
          shiftBufferRequestId: new ObjectId(request.id),
        }
      }));

      if (user.member.contactInfo?.primaryEmail.receiveEmails) {
        Addresses = {
          ...Addresses,
          [user.member.contactInfo!.primaryEmail.address]: {
            ChannelType: 'EMAIL',
            Substitutions: {
              "shift.name": [assignment.name],
              "event.name": [event.name],
              "user.first_name": [user.firstName],
              "event.reference_number": [`${event.referenceId}`],
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

      await Promise.all(inAppPromises);
    } else if (input.template === MailerEvents.OfficerNewShiftAssignments) {
      input.template = MailerEvents.OfficerNewShiftAssigned;
      const { shiftAssignments, organization }: {
        organization: IOrganization;
        shiftAssignments: {
          updateOne: {
            filter: { _id: ObjectId };
            update: { $set: { userId: ObjectId, status: ShiftStatus.Assigned } };
          }
        }[];
      } = input.data;
      fromEmail = organization.fromEmail;

      if (shiftAssignments.length === 0) {
        return;
      }

      const shift = await context.shifts.get(shiftAssignments[0].updateOne.filter._id);
      if (!shift) {
        logger.error('Sample shift not found', { input, shift });
        return;
      }
      const event = await context.events.get(shift.eventId);
      if (!event) {
        logger.error('Event not found', { input, event });
        return;
      }
      const venue = await context.venues.get(event.venueId!);
      if (!venue) {
        logger.error('Venue not found', { input, venue });
        return;
      }
      const assignment = await context.assignments.get(shift.assignmentId);
      if (!assignment) {
        logger.error('Assignment not found', { input, assignment });
        return;
      }

      let url = process.env.LOGIN_URL || '';
      if ((organization as IOrganization).features.sso) {
        const domain = organization.sso?.uiSubDomains?.[0] || 'app';
        const urlBuilder = new URL(`${process.env.COGNITO_URL}/oauth2/authorize`);
        urlBuilder.searchParams.append('client_id', process.env.COGNITO_CLIENT_ID!);
        urlBuilder.searchParams.append('response_type', 'code');
        urlBuilder.searchParams.append('redirect_uri', `https://${domain}.caleopro.com`);
        urlBuilder.searchParams.append('identity_provider', domain);
        url = `${urlBuilder.toString()}&scope=phone+email+openid+phone`;
      }

      const eventStart = convertDate(shift.startTime as any, organization);
      const eventEnd = convertDate(shift.endTime as any, organization);

      const inAppPromises: Promise<any>[] = [];
      for (const shiftAssignment of shiftAssignments) {
        const user = await context.users.get(shiftAssignment.updateOne.update.$set.userId);
        if (!user) {
          logger.error('User not found', { input, user });
          continue;
        }

        const { title, body } = InAppTemplates[MailerEvents.OfficerNewShiftAssigned]({
          shiftName: assignment.name,
          eventName: event.name,
          venueName: venue.name,
        });
        inAppPromises.push(sendInAppNotification({
          context,
          userId: user!.id!,
          templateName: MailerEvents.OfficerNewShiftAssigned,
          orgId: organization.id,
          title,
          body,
          meta: {
            eventId: new ObjectId(event.id),
            shiftId: shift.shiftId,
            assignmentId: new ObjectId(assignment.id),
          }
        }));

        if (user.member.contactInfo?.primaryEmail.receiveEmails) {
          Addresses = {
            ...Addresses,
            [user.member.contactInfo!.primaryEmail.address]: {
              ChannelType: 'EMAIL',
              Substitutions: {
                "event.name": [event.name],
                "shift.name": [assignment.name],
                "shift.start_date": [eventStart.date],
                "shift.start_time": [eventStart.time],
                "shift.end_date": [eventEnd.date],
                "shift.end_time": [eventEnd.time],
                "system.metro_name": [organization.name],
                "user.first_name": [user.firstName],
                "event.reference_number": [`${event.referenceId}`],
                "system.login_url": [url],
              },
            },
          };
        }
      }

      await Promise.all(inAppPromises);
    } else if (input.template === MailerEvents.OfficerAdminAssignedShift) {
      const { adminAssignedShift, shift, organization } = input.data;
      fromEmail = organization.fromEmail;
      const event = await context.events.get(shift.eventId);
      if (!event) {
        logger.error('Event not found', { input, event });
        return;
      }
      const venue = await context.venues.get(event.venueId!);
      if (!venue) {
        logger.error('Venue not found', { input, venue });
        return;
      }
      const assignment = await context.assignments.get(shift.assignmentId);
      if (!assignment) {
        logger.error('Assignment not found', { input, assignment });
        return;
      }
      
      const user = await context.users.get(shift.userId);
      if (!user) {
        logger.error('User not found', { input, user });
        return;
      }

      if (adminAssignedShift) {
        const shiftStart = convertDate(new Date(shift.startTime), organization);
        const shiftEnd = convertDate(new Date(shift.endTime), organization);

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

        const {title, body} = InAppTemplates[input.template]({
          metroName: organization.name,
          shiftName: assignment.name,
          eventName: event.name,
          venueName: venue.name || '',
        });
        await sendInAppNotification({
          context,
          userId: user.id!,
          templateName: input.template,
          orgId: organization.id,
          title,
          body,
          meta: {
            eventId: new ObjectId(event.id),
            shiftId: shift.shiftId,
            assignmentId: new ObjectId(assignment.id),
          }
        });
      }

      const inAppPromises: Promise<any>[] = [];

      const { title, body } = InAppTemplates[MailerEvents.OfficerNewShiftAssigned]({
        shiftName: assignment.name,
        eventName: event.name,
        venueName: venue.name,
      });
      inAppPromises.push(sendInAppNotification({
        context,
        userId: user!.id!,
        templateName: MailerEvents.OfficerNewShiftAssigned,
        orgId: organization.id,
        title,
        body,
        meta: {
          eventId: new ObjectId(event.id),
          shiftId: shift.shiftId,
          assignmentId: new ObjectId(assignment.id),
        }
      }));

      // Check if event is fully staffed
      if (event.notifyWhenFullyStaffed) {
        const totalUnassignedShifts = await context.shifts.collection.countDocuments({
          eventId: event._id,
          removedAt: { $exists: false },
          $or: [
            { userId: null },
            { userId: { $exists: false } },
          ],
        });
        if (totalUnassignedShifts === 0) {
          const allAdmins = await context.users.getAllAdmins({
            orgId: event.orgId,
          });

          const eventStart = convertDate(event.startTime as any, organization);
          const eventEnd = convertDate(event.endTime as any, organization);
          const EmailAddresses = (allAdmins || [])
            .filter((admin) => {
              const { title, body } = InAppTemplates[MailerEvents.AdminEventFullyStaffed]({
                eventRefNumber: event.referenceId,
                eventName: event.name,
                venueName: venue.name,
              });
              inAppPromises.push(sendInAppNotification({
                context,
                userId: admin._id!.toString()!,
                templateName: MailerEvents.AdminEventFullyStaffed,
                orgId: organization.id,
                title,
                body,
                meta: {
                  eventId: new ObjectId(event.id),
                  shiftId: shift.shiftId,
                  assignmentId: new ObjectId(assignment.id),
                }
              }));
              return admin.member.contactInfo!.primaryEmail.receiveEmails
            })
            .reduce((obj, admin) => {
              const Substitutions: Record<string, string[]> = {
                "event.name": [event.name],
                "event.start_date": [eventStart.date],
                "admin.first_name": [admin.firstName],
                "event.reference_number": [`${event.referenceId}`],
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
          };
          if (Object.keys(finalAddresses).length > 0) {
            await sendInChunks({
              ...input,
              template: MailerEvents.AdminEventFullyStaffed,
            }, finalAddresses, templateVersion, fromEmail);
          }
        }
      }

      // Check if assignment is fully staffed
      if (assignment.notifyWhenFullyStaffed) {
        const totalUnassignedShifts = await context.shifts.collection.countDocuments({
          eventId: event._id,
          assignmentId: assignment._id,
          $or: [
            { userId: null },
            { userId: { $exists: false } },
          ],
          removedAt: { $exists: false },
        });
        if (totalUnassignedShifts === 0) {
          const allAdmins = await context.users.getAllAdmins({
            orgId: event.orgId,
          });

          const eventStart = convertDate(event.startTime as any, organization);
          const eventEnd = convertDate(event.endTime as any, organization);
          const EmailAddresses = (allAdmins || [])
            .filter((admin) => {
              const { title, body } = InAppTemplates[MailerEvents.AdminEventShiftsFilled]({
                shiftName: assignment.name,
                eventName: event.name,
                venueName: venue.name,
              });
              inAppPromises.push(sendInAppNotification({
                context,
                userId: admin._id!.toString()!,
                templateName: MailerEvents.AdminEventShiftsFilled,
                orgId: organization.id,
                title,
                body,
                meta: {
                  eventId: new ObjectId(event.id),
                  shiftId: shift.shiftId,
                  assignmentId: new ObjectId(assignment.id),
                }
              }));
              return admin.member.contactInfo!.primaryEmail.receiveEmails
            })
            .reduce((obj, admin) => {
              const Substitutions: Record<string, string[]> = {
                "shift.name": [assignment.name],
                "event.name": [event.name],
                "admin.first_name": [admin.firstName],
                "event.reference_number": [`${event.referenceId}`],
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
          };
          if (Object.keys(finalAddresses).length > 0) {
            await sendInChunks({
              ...input,
              template: MailerEvents.AdminEventShiftsFilled,
            }, finalAddresses, templateVersion, fromEmail);
          }
        }
      }

      await Promise.all(inAppPromises);
    } else if (input.template === MailerEvents.OfficerRemovedFromShift) {
      const { shift, removeUser, existingUserId, organization } = input.data;
      fromEmail = organization.fromEmail;

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

      const shiftStart = convertDate(new Date(shift.startTime), organization);
      const shiftEnd = convertDate(new Date(shift.endTime), organization);

      const inAppPromises: Promise<any>[] = [];

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
              "event.reference_number": [`${event.referenceId}`],
              "shift.start_time": [shiftStart.time],
              "shift.end_date": [shiftEnd.date],
              "shift.end_time": [shiftEnd.time],
              ...(shift.relinquishNote ? {"shift.relinquish_note": [shift.relinquishNote]}: {}),
              "system.metro_name": [organization.name],
            },
          },
        };
      }
      const { title, body } = InAppTemplates[input.template]({
        eventName: event.name,
        shiftName: assignment.name,
      });
      inAppPromises.push(sendInAppNotification({
        context,
        userId: user.id!,
        templateName: input.template,
        orgId: organization.id,
        title,
        body,
        meta: {
          eventId: new ObjectId(event.id),
          shiftId: shift.shiftId,
          assignmentId: new ObjectId(assignment.id),
        }
      }));

      const allAdmins = await context.users.getAllAdmins({
        orgId: event.orgId,
      });

      const EmailAddresses = (allAdmins || [])
        .filter((admin) => {
          const { title, body } = InAppTemplates[MailerEvents.AdminUnassignOfficerShift]({
            eventName: event.name,
            eventRefNumber: event.referenceId,
            shiftName: assignment.name,
            officerName: user.name,
            adminName: removeUser.name,
          });
          inAppPromises.push(sendInAppNotification({
            context,
            userId: admin._id!.toString()!,
            templateName: input.template,
            orgId: organization.id,
            title,
            body,
            meta: {
              eventId: new ObjectId(event.id),
              shiftId: shift.shiftId,
              assignmentId: new ObjectId(assignment.id),
            }
          }));
          return admin.member.contactInfo?.primaryEmail.receiveEmails
        })
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
            "event.reference_number": [`${event.referenceId}`],
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
          }, EmailAddresses, templateVersion, fromEmail);
        } catch(error) {
          logger.error('Failed to send admin notification', { error });
        }
      }

      await Promise.all(inAppPromises);
    } else if (input.template === MailerEvents.AdminShiftRelinquished) {
      const { existingUserId, shift, organization } = input.data;
      fromEmail = organization.fromEmail;

      const event = await context.events.get(shift.eventId);
      if (!event) {
        logger.error('Event not found', { input, event });
        return;
      }

      let venue: IIVenue | null = null;
      if (event.venueId) {
        venue = await context.venues.get(event.venueId);
      }

      // Ignore if the scratched if the current time is before interestListAutoAssignCutoff
      const zonedNow = toZonedTime(new Date(), organization?.timezone || 'America/Los_Angeles' as any).getTime();
      const autoAssignEndDate = toZonedTime(
        event.interestListAutoAssignCutoff || new Date(),
        organization?.timezone || 'America/Los_Angeles' as any
      ).getTime();
      if (event.status === EventStatus.InterestList && event.autoAssignInterestList && zonedNow <= autoAssignEndDate) {
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

      const shiftStart = convertDate(shift.startTime, organization);
      const shiftEnd = convertDate(shift.endTime, organization);

      const allAdmins = await context.users.getAllAdmins({
        orgId: event.orgId,
      });
      
      const inAppPromises: Promise<any>[] = [];

      Addresses = (allAdmins || [])
        .filter((admin) => {
          const { title, body } = InAppTemplates[input.template]({
            eventName: event.name,
            eventRefNumber: event.referenceId,
            shiftName: assignment.name,
            reason: shift.relinquishNote || 'N/A',
            officerName: user.name,
          });
          inAppPromises.push(sendInAppNotification({
            context,
            userId: admin._id!.toString()!,
            templateName: input.template,
            orgId: organization.id,
            title,
            body,
            meta: {
              eventId: new ObjectId(event.id),
              shiftId: shift.shiftId,
              assignmentId: new ObjectId(assignment.id),
            }
          }));
          return admin.member.contactInfo?.primaryEmail.receiveEmails
        })
        .reduce((obj, admin) => {
          const Substitutions: Record<string, string[]> = {
            "user.first_name": [user.firstName],
            "user.last_name": [user.lastName],
            "shift.name": [assignment.name],
            "event.name": [event.name],
            "admin.first_name": [admin.firstName],
            "event.reference_number": [`${event.referenceId}`],
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

      // Only for LASD for now :shrug:
      if (venue?.contact?.email && organization.name === 'Los Angeles Sheriff Department') {
        Addresses[venue.contact.email] = {
          ChannelType: 'EMAIL',
          Substitutions: {
            "user.first_name": [user.firstName],
            "user.last_name": [user.lastName],
            "shift.name": [assignment.name],
            "event.name": [event.name],
            "admin.first_name": [venue?.contact?.firstName || venue?.name || ''],
            "event.reference_number": [`${event.referenceId}`],
            "shift.start_date": [shiftStart.date],
            "shift.start_time": [shiftStart.time],
            "shift.end_date": [shiftEnd.date],
            "shift.end_time": [shiftEnd.time],
            "relinquish_reason": [shift.relinquishNote || ''],
            "system.metro_name": [organization.name],
            "shift.reference_number": [`${shift.refNumber}`],
          },
        } as AddressConfiguration
      }

      await Promise.all(inAppPromises);
    } else if (input.template === MailerEvents.OfficerAssignmentRemoved) {
      const { assignment, organization, modifiedById } = input.data;
      fromEmail = organization.fromEmail;

      const event = await context.events.get(assignment.eventId);
      if (!event) {
        logger.error('Event not found', { input, event });
        return;
      }

      const allShifts = await context.shifts.collection.aggregate<IShiftExpanded>([
        {
          $match: {
            eventId: event._id,
            assignmentId: new ObjectId(assignment.id),
            userId: {
              $exists: true,
            },
            removedAt: { $exists: false },
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
      ]);

      let shift: IShiftExpanded | null;
      do {
        shift = await allShifts.next();
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

        if (shift) {
          const { title, body } = InAppTemplates[input.template]({
            eventName: event.name,
            metroName: organization.name,
            shiftName: assignment.name,
          });
          await sendInAppNotification({
            context,
            userId: shift!.userId!.toString(),
            templateName: input.template,
            orgId: organization.id,
            title,
            body,
            meta: {
              eventId: new ObjectId(event.id),
              shiftId: shift.shiftId,
              assignmentId: new ObjectId(assignment.id),
            }
          });
        }
      } while(shift);

      // Remove shifts after notification is sent
      try {
        await context.shifts.removeAllByAssignmentId(organization.id, assignment.id, modifiedById);
      } catch(error) {
        logger.error('Failed to remove shifts by assignment', { error, input });
      }
    } else if (input.template === MailerEvents.OfficerShiftStartingNotification) {
      templateVersion = '2';
      const shiftId = input.data.shiftId;
      let { userId } = input.data;
      const shift = await context.shifts.get(shiftId);
      if (!shift || shift.userId !== userId) {
        if (!shift?.userId) {
          logger.warn('Shift is not assigned to this user', { input, shift });
          return;
        }
        userId = shift.userId;
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
      fromEmail = organization.fromEmail || fromEmail;

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
      const hoursTilShift = organization.settings?.shiftReminder.time;

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
              "hoursTilShift": [`${hoursTilShift}`],
            },
          },
        };
      }

      const { title, body } = InAppTemplates[input.template]({
        eventName: event.name,
        shiftName: assignment.name,
        hoursTilShift,
      });
      await sendInAppNotification({
        context,
        userId: user.id!,
        templateName: input.template,
        orgId: organization.id,
        title,
        body,
        meta: {
          eventId: new ObjectId(event.id),
          shiftId: shift.shiftId,
          assignmentId: new ObjectId(assignment.id),
        }
      });
    } else if (input.template === MailerEvents.LotteryWindowClosing) {
      const { orgId } = input.data;

      const organization = await context.organizations.get(orgId);
      if (!organization) {
        logger.error('Organization not found', { input, organization });
        return;
      }
      fromEmail = organization.fromEmail || fromEmail;

      const allUsers = await context.users.collection.find<IUser>({
        'member.orgId': new ObjectId(orgId),
        'member.status': MemberStatus.Active,
        removedAt: { $exists: false },
      });

      let user: IUser | null;
      do {
        user = await allUsers.next();
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
        if (user) {
          const { title, body } = InAppTemplates[input.template]({
            metroName: organization.name,
            num: organization.settings?.lottery.notifyUsersBeforeClose || 24,
          });
          await sendInAppNotification({
            context,
            userId: user._id!.toString()!,
            templateName: input.template,
            orgId: organization.id,
            title,
            body,
          });
        }
      } while(user);
    } else if (input.template === MailerEvents.OfficerAvailableOtPosted) {
      const { orgId } = input.data;

      const totalRes = await context.events.collection.aggregate<{total: number}>([
        {
          $match: {
            orgId: new ObjectId(orgId),
            status: EventStatus.FirstComeFirstServe,
            removedAt: { $exists: false },
          },
        },
        {
          $lookup: {
            from: "shifts",
            localField: "_id",
            foreignField: "eventId",
            as: "shifts",
          },
        },
        {
          $match: {
            'shifts.removedAt': {$exists: false},
            'shifts.status': {$ne: ShiftStatus.Locked},
            $or: [{'shifts.userId': null}, {'shifts.userId': {$exists: false}}],
          },
        },
        {
          $count: 'total',
        },
      ]).toArray();

      // const totalRes = await context.shifts.collection.aggregate<{total: number}>([
      //   {
      //     $match: {
      //       orgId: new ObjectId(orgId),
      //       status: {$ne: 'LOCKED'},
  		// 			$or: [{userId: null}, {userId: {$exists: false}}],
      //       removedAt: { $exists: false },
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: "events",
      //       localField: "eventId",
      //       foreignField: "_id",
      //       as: "event",
      //     },
      //   },
      //   {
      //     $addFields: {
      //       event: {
      //         $first: "$event",
      //       },
      //     },
      //   },
      //   {
      //     $match: {
      //       'event.status': EventStatus.FirstComeFirstServe,
      //       'event.removedAt': { $exists: false },
      //     }
      //   },
      //   {
      //     $count: 'total',
      //   },
      // ]).toArray();

      if (totalRes?.[0]?.total === 0) {
        logger.warn('No open shifts found', { input });
        return;
      }

      const organization = await context.organizations.get(orgId);
      if (!organization) {
        logger.error('Organization not found', { input, organization });
        return;
      }
      fromEmail = organization.fromEmail || fromEmail;

      const allUsers = await context.users.collection.find<IUser>({
        'member.orgId': new ObjectId(orgId),
        'member.status': MemberStatus.Active,
        removedAt: { $exists: false },
      });

      let user: IUser | null;
      do {
        user = await allUsers.next();
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
        if (user) {
          const { title, body } = InAppTemplates[input.template]({
            metroName: organization.name,
          });
          await sendInAppNotification({
            context,
            userId: user._id!.toString()!,
            templateName: input.template,
            orgId: organization.id,
            title,
            body,
          });
        }
      } while(user);
    } else if (input.template === MailerEvents.OfficerFcfsShiftAvailable) {
      const { shiftId, organization } = input.data;
      fromEmail = organization.fromEmail || fromEmail;

      const shift = await context.shifts.collection.findOne<IShift>({
        shiftId,
        removedAt: { $exists: false },
        $and: [
          {
            $or: [
              { userId: null },
              { userId: { $exists: false } },
            ],
          },
          {
            $or: [
              { locked: false },
              {
                locked: {
                  $exists: false,
                },
              },
            ],
          }
        ]
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

      const shiftStart = convertDate(shift.startTime, organization);
      const shiftEnd = convertDate(shift.endTime, organization);

      const allUsers = await context.users.collection.find<IUser>({
        'member.orgId': new ObjectId(organization._id),
        'member.status': MemberStatus.Active,
        'member.rankId': { $in: assignment.rankIds },
        removedAt: { $exists: false },
      });

      let user: IUser | null;
      do {
        user = await allUsers.next();
        if (user) {
          let skillIds: string[] | undefined = undefined;

          // Verify user has required skills
          if (assignment.requiredSkillIds && assignment.requiredSkillIds.length > 0) {
            if (!skillIds && (user?.member?.memberSkillIds || []).length > 0) {
              const mSkills = await context.memberSkills.findAll((user?.member?.memberSkillIds || []).map((id) => new ObjectId(id as any)));
              skillIds = mSkills.map(({ skillId }) => skillId.toString());
            }
            if (difference(assignment.requiredSkillIds.map(s => s.toString()), skillIds).length > 0) {
              continue;
            }
          }

          const { canSignUpForShift } = await context.shifts.canSignUpForShift({
            user: {
              ...user,
              id: user._id!.toString()!,
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
                "event.reference_number": [`${event.referenceId}`],
                "system.login_url": [`${process.env.APP_URL || ''}/dashboard/available/overtime`],
              },
            };
          }

          const { title, body } = InAppTemplates[input.template]({
            eventName: event.name,
            shiftName: assignment.name,
            metroName: organization.name,
          });
          await sendInAppNotification({
            context,
            userId: user!._id!.toString(),
            templateName: input.template,
            orgId: organization.id,
            title,
            body,
          });
        }
      } while(user);
      if (Object.keys(Addresses).length === 0) {
        logger.warn('No users found', { input });
        return;
      }
    } else if (input.template === MailerEvents.OfficerFcfsEventAvailable) {
      const { eventId, organization } = input.data;
      fromEmail = organization.fromEmail || fromEmail;

      const event = await context.events.get(eventId);
      if (!event) {
        logger.error('Event not found', { input, event });
        return;
      }

      const assignmentDetails = await context.assignments.collection.find({
        orgId: new ObjectId(organization.id),
        eventId: event._id,
        removedAt: { $exists: false },
      }).project<IAssignment>({ _id: 1, rankIds: 1, requiredSkillIds: 1 }).toArray();

      const shiftIds = await context.shifts.collection.find({
        orgId: new ObjectId(organization.id),
        eventId: new ObjectId(event.id),
        assignmentId: { $in: assignmentDetails.map((a) => a._id!) },
        removedAt: { $exists: false },
        $and: [
          {
            $or: [
              { userId: null },
              { userId: { $exists: false } },
            ],
          },
          {
            $or: [
              { locked: false },
              {
                locked: {
                  $exists: false,
                },
              },
            ],
          }
        ]
      }).project<IShift>({ shiftId: 1 }).toArray();
      const uniqShiftIds = uniq(shiftIds.map((s) => s.shiftId));
      const uniqRanksIds = uniq(assignmentDetails.map((a) => a.rankIds).flat());

      const eventStart = convertDate(event.startTime!, organization);
      const eventEnd = convertDate(event.endTime!, organization);

      const allUsers = await context.users.collection.find<IUser>({
        'member.orgId': new ObjectId(organization.id),
        'member.status': MemberStatus.Active,
        'member.rankId': { $in: uniqRanksIds },
        removedAt: { $exists: false },
      });

      let user: IUser | null;
      do {
        user = await allUsers.next();
        if (user) {
          let skillIds: ObjectId[] | undefined = undefined;
          let canSignUpForAShift = false;
          for(const shiftId of uniqShiftIds) {
            const shift = await context.shifts.collection.findOne<IShift>({
              shiftId,
              orgId: new ObjectId(organization.id),
              $or: [
                { userId: null },
                { userId: { $exists: false } },
              ],
            });
            if (!shift) {
              continue;
            }

            // Verify user has required skills
            const assignment = assignmentDetails.find((a) => a._id === shift.assignmentId);
            if (assignment && assignment.requiredSkillIds && assignment.requiredSkillIds.length > 0) {
              if (!skillIds && (user?.member?.memberSkillIds || []).length > 0) {
                const mSkills = await context.memberSkills.findAll((user?.member?.memberSkillIds || []).map((id) => new ObjectId(id)));
                skillIds = mSkills.map(({ skillId }) => skillId);
              }
              if (difference(assignment.requiredSkillIds, skillIds).length > 0) {
                continue;
              }
            }

            const { canSignUpForShift } = await context.shifts.canSignUpForShift({
              user: {
                ...user,
                id: user._id!.toString(),
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
                "event.reference_number": [`${event.referenceId}`],
                "system.login_url": [`${process.env.APP_URL || ''}/dashboard/available/overtime`],
              },
            };
          }
          const { title, body } = InAppTemplates[input.template]({
            eventName: event.name,
            metroName: organization.name,
          });
          await sendInAppNotification({
            context,
            userId: user!._id!.toString(),
            templateName: input.template,
            orgId: organization.id,
            title,
            body,
            meta: {
              eventId: new ObjectId(event.id),
            }
          });
        }
      } while(user);
      if (Object.keys(Addresses).length === 0) {
        logger.warn('No users found', { input });
        return;
      }
    } else if (input.template === MailerEvents.OfficerUserAccountInvitation) {
      const { inviteEmail, user, organization }: {
        inviteEmail: string;
        user: IUser;
        organization: IOrganization;
      } = input.data;
      fromEmail = organization.fromEmail || fromEmail;

      let url = `${process.env.REGISTER_URL || ''}?orgId=${organization.id}&email=${inviteEmail}`;

      if ((organization as IOrganization).features.sso) {
        input.template = MailerEvents.OfficerUserAccountInvitationSSO;
        const domain = organization.sso?.uiSubDomains?.[0] || 'app';
        const urlBuilder = new URL(`${process.env.COGNITO_URL}/oauth2/authorize`);
        urlBuilder.searchParams.append('client_id', process.env.COGNITO_CLIENT_ID!);
        urlBuilder.searchParams.append('response_type', 'code');
        urlBuilder.searchParams.append('redirect_uri', `https://${domain}.caleopro.com`);
        urlBuilder.searchParams.append('identity_provider', domain);
        url = `${urlBuilder.toString()}&scope=phone+email+openid+phone`;
      }

      Addresses = {
        ...Addresses,
        [inviteEmail]: {
          ChannelType: 'EMAIL',
          Substitutions: {
            "admin.first_name": [user.firstName],
            "admin.last_name": [user.lastName],
            "system.metro_name": [organization.name],
            "system.registration_url": [url],
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
     fromEmail = organization.fromEmail || fromEmail;

      const allAdmins = await context.users.getAllAdmins({
        orgId: new ObjectId(orgId),
      });

      const inAppPromises: Promise<any>[] = [];
      const EmailAddresses = (allAdmins || [])
        .filter((admin) => {
          const { title, body } = InAppTemplates[input.template]({
            metroName: organization.name,
            name: user.name,
          });
          inAppPromises.push(sendInAppNotification({
            context,
            userId: admin!._id!.toString(),
            templateName: input.template,
            orgId: organization.id,
            title,
            body,
          }));
          return admin.member.contactInfo?.primaryEmail.receiveEmails
        })
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

      Addresses = {
        ...EmailAddresses,
      };
      await Promise.all(inAppPromises);
    } else if (input.template === MailerEvents.OfficerUserAccountDeactivated) {
      const {
        user: inputUser,
        organization,
        inactivateUntil,
        inactivationNote,
      } = input.data;
      fromEmail = organization.fromEmail || fromEmail;

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

      const { title, body } = InAppTemplates[input.template]({
        metroName: organization.name,
      });
      await sendInAppNotification({
        context,
        userId: user.id!,
        templateName: input.template,
        orgId: organization.id,
        title,
        body,
      });
    } else if (input.template === MailerEvents.OfficerUserAccountReactivated) {
      const {
        user: inputUser,
        orgId,
      } = input.data;
      let organization: IOrganization | null = input.data.organization as IOrganization;
      fromEmail = organization.fromEmail || fromEmail;

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

      const { title, body } = InAppTemplates[input.template]();
      await sendInAppNotification({
        context,
        userId: user.id!,
        templateName: input.template,
        orgId: organization.id,
        title,
        body,
      });
    } else if (input.template === MailerEvents.OfficerShiftAutoCheckout) {
      const {
        shiftIds,
        organization,
      } = input.data;
      fromEmail = organization.fromEmail || fromEmail;

      const shifts = await context.shifts.collection.find<IShift>({
        _id: { $in: shiftIds.map((id: string) => new ObjectId(id)) },
      }).toArray();

      if (shifts.length === 0) {
        logger.warn('No shifts found', { input });
        return;
      }

      const assignments = await context.assignments.collection.find<IAssignment>({
        _id: { $in: uniq(shifts.map((s) => s.assignmentId)) },
      }).toArray();

      if (assignments.length === 0) {
        logger.warn('No assignments found', { input });
        return;
      }
      const assignmentMap = assignments.reduce((obj, assignment) => {
        return {
          ...obj,
          [assignment._id!.toString()]: assignment,
        };
      }, {} as Record<string, IAssignment>);

      const userIds = uniq(shifts.map((s) => s.userId)) as ObjectId[];
      const users = await context.users.collection.find<IUser>({
        _id: { $in: userIds },
      }).toArray();

      if (users.length === 0) {
        logger.warn('No users found', { input });
        return;
      }
      const userMap = users.reduce((obj, user) => {
        return {
          ...obj,
          [user._id!.toString()]: user,
        };
      }, {} as Record<string, IUser>);

      const inAppPromises: Promise<any>[] = [];
      for(const shift of shifts) {
        const { date, time } = convertDate(shift.endTime, organization);
        const user = userMap[shift.userId!.toString()];
        const assignment = assignmentMap[shift.assignmentId.toString()];
        if (!user) {
          logger.warn('User not found', { input, shift });
          continue;
        }
        if (!assignment) {
          logger.warn('Assignment not found', { input, shift });
          continue;
        }
        if (user.member.contactInfo?.primaryEmail.receiveEmails) {
          Addresses = {
            ...Addresses,
            [user.member.contactInfo!.primaryEmail.address]: {
              ChannelType: 'EMAIL',
              Substitutions: {
                "shift.name": [assignment.name],
                "system.metro_name": [organization.name],
                "user.first_name": [user.firstName],
                "shift.end_time": [`${date} ${time}`],
              },
            },
          };
        }

        const { title, body } = InAppTemplates[input.template]({
          shiftName: assignment.name,
          endTime: `${date} ${time}`,
        });
        inAppPromises.push(sendInAppNotification({
          context,
          userId: user._id!.toString(),
          templateName: input.template,
          orgId: organization.id,
          title,
          body,
          meta: {
            eventId: new ObjectId(shift.eventId),
            shiftId: shift.shiftId,
            assignmentId: new ObjectId(shift.assignmentId),
          }
        }));
      }
      await Promise.all(inAppPromises);
    } else if (input.template === MailerEvents.OfficerShiftCheckInOutEdited) {
      const {
        originalShift,
        shift,
        organization,
      }: {
        originalShift: IShift,
        shift: IShift,
        organization: IOrganization,
      } = input.data;
      fromEmail = organization.fromEmail || fromEmail;

      const user = await context.users.get(shift.userId!);
      if (!user) {
        logger.warn('User not found', { input });
        return;
      }

      const event = await context.events.get(shift.eventId);
      if (!event) {
        logger.error('Event not found', { input, shift });
        return;
      }

      const assignment = await context.assignments.get(shift.assignmentId);
      if (!assignment) {
        logger.error('Assignment not found', { input, shift });
        return;
      }

      let oldOutTime;
      let newOutTime;
      let oldInTime;
      let newInTime;

      if (originalShift.shiftCheckInOut && originalShift.shiftCheckInOut.checkOutTime !== shift.shiftCheckInOut?.checkOutTime) {
        oldOutTime = convertDate(originalShift.shiftCheckInOut!.checkOutTime!, organization);
        newOutTime = convertDate(shift.shiftCheckInOut!.checkOutTime!, organization);
      }

      if (originalShift.shiftCheckInOut && originalShift.shiftCheckInOut.checkInTime !== shift.shiftCheckInOut?.checkInTime) {
        oldInTime = convertDate(originalShift.shiftCheckInOut!.checkInTime!, organization);
        newInTime = convertDate(shift.shiftCheckInOut!.checkInTime!, organization);
      }
      const { title, body } = InAppTemplates[input.template]({
        eventName: event.name,
        shiftName: assignment.name,
        oldOutTime,
        newOutTime,
        oldInTime,
        newInTime,
        notes: shift.shiftCheckInOut?.adminNotes,
      });

      await sendInAppNotification({
        context,
        userId: user.id!,
        templateName: input.template,
        orgId: organization.id,
        title,
        body,
        meta: {
          eventId: new ObjectId(shift.eventId),
          shiftId: shift.shiftId,
          assignmentId: new ObjectId(shift.assignmentId),
        }
      });
    } else if (input.template === MailerEvents.OfficerInterestListClosing || input.template === MailerEvents.OfficerInterestListOpening) {
      const { eventId, organization } = input.data;
      fromEmail = organization.fromEmail || fromEmail;

      const event = await context.events.get(eventId);
      if (!event) {
        logger.error('Event not found', { input, event });
        return;
      }

      const assignmentDetails = await context.assignments.collection.find({
        orgId: new ObjectId(organization.id),
        eventId: new ObjectId(event.id),
        removedAt: { $exists: false },
      }).project<IAssignment>({ _id: 1, rankIds: 1, requiredSkillIds: 1 }).toArray();

      const shiftIds = await context.shifts.collection.find({
        orgId: new ObjectId(organization.id),
        eventId: new ObjectId(event.id),
        assignmentId: { $in: assignmentDetails.map((a) => a._id) },
        removedAt: { $exists: false },
        $and: [
          {
            $or: [
              { userId: null },
              { userId: { $exists: false } },
            ],
          },
          {
            $or: [
              { locked: false },
              {
                locked: {
                  $exists: false,
                },
              },
            ],
          }
        ]
      }).project<IShift>({ shiftId: 1 }).toArray();
      const uniqShiftIds = uniq(shiftIds.map((s) => s.shiftId)) as string[];
      const uniqRanksIds = uniq(assignmentDetails.map((a) => a.rankIds).flat()) as ObjectId[];

      const allUsers = await context.users.collection.find<IUser>({
        'member.orgId': new ObjectId(organization.id),
        'member.status': MemberStatus.Active,
        'member.rankId': { $in: uniqRanksIds },
        removedAt: { $exists: false },
      });

      let user: IUser | null;
      do {
        user = await allUsers.next();
        if (user) {
          let skillIds: ObjectId[] | undefined = undefined;
          let canSignUpForAShift = false;
          for(const shiftId of uniqShiftIds) {
            const shift = await context.shifts.collection.findOne<IShift>({
              shiftId,
              orgId: new ObjectId(organization.id),
              $or: [
                { userId: null },
                { userId: { $exists: false } },
              ],
            });
            if (!shift) {
              continue;
            }

            // Verify user has required skills
            const assignment = assignmentDetails.find((a) => a._id === shift.assignmentId);
            if (assignment && assignment.requiredSkillIds && assignment.requiredSkillIds.length > 0) {
              if (!skillIds && (user?.member?.memberSkillIds || []).length > 0) {
                const mSkills = await context.memberSkills.findAll((user?.member?.memberSkillIds || []));
                skillIds = mSkills.map(({ skillId }) => skillId);
              }
              if (difference(assignment.requiredSkillIds, skillIds).length > 0) {
                continue;
              }
            }

            const { canSignUpForShift } = await context.shifts.canSignUpForShift({
              user: {
                ...user,
                id: user!._id!.toString(),
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
          
          const { title, body } = InAppTemplates[input.template]({
            eventName: event.name,
          });
          await sendInAppNotification({
            context,
            userId: user!._id!.toString(),
            templateName: input.template,
            orgId: organization.id,
            title,
            body,
            meta: {
              eventId: new ObjectId(event.id),
            }
          });
        }
      } while(user);
    } else if (input.template === MailerEvents.AdminEventRequested) {
      const { event, venueId, orgId } = input.data;

      const organization = await context.organizations.get(orgId);
      if (!organization) {
        logger.error('Organization not found', { input, orgId });
        return;
      }
      fromEmail = organization.fromEmail || fromEmail;

      const venue = await context.venues.get(venueId);
      if (!venue) {
        logger.error('Venue not found', { input, venueId });
        return;
      }

      if (!(event as IEvent).requestDetails?.startTime || !(event as IEvent).requestDetails?.endTime) {
        logger.error('Requested event start/end time not found', { input, event });
        return;
      }

      const eventStart = convertDate(event.requestDetails.startTime, organization);
      const eventEnd = convertDate(event.requestDetails.endTime, organization);

      const allAdmins = await context.users.getAllAdmins({
        orgId: new ObjectId(orgId),
      });
      
      const inAppPromises: Promise<any>[] = [];

      Addresses = (allAdmins || [])
        .filter((admin) => {
          const { title, body } = InAppTemplates[input.template]({
            eventName: event.name,
            eventRefNumber: event.referenceId,
          });
          inAppPromises.push(sendInAppNotification({
            context,
            userId: admin!._id!.toString(),
            templateName: input.template,
            orgId: organization.id,
            title,
            body,
            meta: {
              eventId: new ObjectId(event.id),
            }
          }));
          return admin.member.contactInfo?.primaryEmail.receiveEmails
        })
        .reduce((obj, admin) => {
          const Substitutions: Record<string, string[]> = {
            "user.first_name": [admin.firstName],
            "event.name": [event.name],
            "event.reference_number": [event.referenceId],
            "venue.name": [venue.name],
            "event.start_date": [eventStart.date],
            "event.start_time": [eventStart.time],
            "event.end_date": [eventEnd.date],
            "event.end_time": [eventEnd.time],
            "system.metro_name": [organization.name],
            "system.login_url": [`${process.env.APP_URL || ''}/dashboard/admin/overtime/events`],
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

      await Promise.all(inAppPromises);
    } else if ([
      MailerEvents.EventRequestedConfirm,
      MailerEvents.EventRequestedApproved,
      MailerEvents.EventRequestedRejected
    ].includes(input.template as MailerEvents)) {
      const { event, orgId } = input.data;

      const organization = await context.organizations.get(orgId);
      if (!organization) {
        logger.error('Organization not found', { input, orgId });
        return;
      }
      fromEmail = organization.fromEmail || fromEmail;

      const venue = await context.venues.get(event.venueId);
      if (!venue) {
        logger.error('Venues not found', { input, event, organization });
        return;
      }

      if (!(event as IEvent).requestDetails?.requestorEmail) {
        logger.error('Requestor email not found', { input, event });
        return;
      }

      if (!(event as IEvent).requestDetails?.startTime || !(event as IEvent).requestDetails?.endTime) {
        logger.error('Requested event start/end time not found', { input, event });
        return;
      }

      const eventStart = convertDate(event.requestDetails.startTime, organization);
      const eventEnd = convertDate(event.requestDetails.endTime, organization);
      const includeRejectReason = input.template === MailerEvents.EventRequestedRejected && event.requestDetails.adminNote;

      Addresses = {
        ...Addresses,
        [event.requestDetails.requestorEmail]: {
          ChannelType: 'EMAIL',
          Substitutions: {
            "event.name": [event.name],
            "event.reference_number": [event.referenceId],
            "venue.name": [venue.name],
            "event.start_date": [eventStart.date],
            "event.start_time": [eventStart.time],
            "event.end_date": [eventEnd.date],
            "event.end_time": [eventEnd.time],
            "system.metro_name": [organization.name],
            ...(includeRejectReason ? {
              "reject_reason": [event.requestDetails.adminNote],
            } : {}),
          },
        },
      };
    } else if (
      input.template === MailerEvents.OfficerUserAccountApproved ||
      input.template === MailerEvents.OfficerUserAccountDenial
    ) {
      const { user, organization }: {
        user: IUser;
        organization: IOrganization;
      } = input.data;
      fromEmail = organization.fromEmail || fromEmail;

      const email = user.member.contactInfo?.primaryEmail.address;
      if (!email) {
        logger.error('User email not found', { input, user });
        return;
      }

      let url = process.env.LOGIN_URL || '';

      if ((organization as IOrganization).features.sso) {
        const domain = organization.sso?.uiSubDomains?.[0] || 'app';
        const urlBuilder = new URL(`${process.env.COGNITO_URL}/oauth2/authorize`);
        urlBuilder.searchParams.append('client_id', process.env.COGNITO_CLIENT_ID!);
        urlBuilder.searchParams.append('response_type', 'code');
        urlBuilder.searchParams.append('redirect_uri', `https://${domain}.caleopro.com`);
        urlBuilder.searchParams.append('identity_provider', domain);
        url = `${urlBuilder.toString()}&scope=phone+email+openid+phone`;
      }

      Addresses = {
        ...Addresses,
        [email]: {
          ChannelType: 'EMAIL',
          Substitutions: {
            "user.first_name": [user.firstName],
            "system.metro_name": [organization.name],
            ...(input.template === MailerEvents.OfficerUserAccountApproved && {
              "system.login_url": [url],
            }),
          },
        },
      };
    } else if (
      input.template === MailerEvents.MissingOCN
    ) {
      const { eventIds, orgId }: {
        eventIds: string[];
        orgId: string;
      } = input.data;

      const organization = await context.organizations.get(orgId);
      if (!organization) {
        logger.error('Organization not found', { input, orgId });
        return;
      }
      fromEmail = organization.fromEmail || fromEmail;

      const events = await context.events.collection.find({
        _id: { $in: eventIds.map((id) => new ObjectId(id)) },
      }).toArray();

      if (events.length === 0) {
        logger.warn('Events not found', { input, eventIds });
        return;
      }

      // Mark events as notified
      const ids = events.map((e) => e._id);
      await context.events.collection.updateMany({
        _id: { $in: ids },
      }, {
        $set: {
          lastDepartmentNotificationDate: new Date(),
        }
      });

      const eventNames = events.map((e) =>
        `<a href="${process.env.APP_URL || ''}/dashboard/admin/overtime/events/${e._id.toString()}" target="_blank">${e.name}</a>`
      ).join('<br/>- ');

      Addresses = {
        ...Addresses,
        [organization.contact!.email!]: {
          ChannelType: 'EMAIL',
          Substitutions: {
            "system.metro_name": [organization.name],
            "event_names": [`- ${eventNames}`],
          },
        },
      };
    } else if (input.template === MailerEvents.OfficerEventEdited) {
      const {
        eventId,
        orgId,
        updates,
      }: {
        eventId: string;
        orgId: string;
        updates: IEventUpdates;
      } = input.data;

      const event = await context.events.get(eventId);
      if (!event) {
        logger.error('Event not found', { input, eventId });
        return;
      }

      const organization = await context.organizations.get(orgId);
      if (!organization) {
        logger.error('Organization not found', { input, orgId });
        return;
      }

      if (!event.venueId) {
        logger.error('Event venueId not found', { input, event });
        return;
      }
      const newVenue = await context.venues.get(event.venueId!);
      if (!newVenue) {
        logger.error('Event new venue not found', { input, event });
        return;
      }
      let oldVenue: IIVenue | null = newVenue;
      if (updates.venueId?.oldValue) {
        oldVenue = await context.venues.get(updates.venueId?.oldValue as string);
        if (!oldVenue) {
          logger.error('Event old venue not found', { input, event });
        }
      }
      fromEmail = organization.fromEmail || fromEmail;
      let url = process.env.LOGIN_URL || '';
      if ((organization as IOrganization).features.sso) {
        const domain = organization.sso?.uiSubDomains?.[0] || 'app';
        const urlBuilder = new URL(`${process.env.COGNITO_URL}/oauth2/authorize`);
        urlBuilder.searchParams.append('client_id', process.env.COGNITO_CLIENT_ID!);
        urlBuilder.searchParams.append('response_type', 'code');
        urlBuilder.searchParams.append('redirect_uri', `https://${domain}.caleopro.com`);
        urlBuilder.searchParams.append('identity_provider', domain);
        url = `${urlBuilder.toString()}&scope=phone+email+openid+phone`;
      }

      const eventStart = convertDate(new Date(event.startTime!), organization);
      const eventEnd = convertDate(new Date(event.endTime!), organization);
      let oldEventStart = eventStart;
      let oldEventEnd = eventEnd;
      if (updates.startTime?.oldValue) {
        oldEventStart = convertDate(new Date(updates.startTime?.oldValue as string), organization);
      }
      if (updates.endTime?.oldValue) {
        oldEventEnd = convertDate(new Date(updates.endTime?.oldValue as string), organization);
      }

      const allUsersOnEvent = await context.shifts.collection.aggregate<IShiftExpanded>([
        {
          $match: {
            eventId: new ObjectId(event.id),
            removedAt: { $exists: false },
            status: ShiftStatus.Assigned,
          },
        },
        {
          $lookup:{
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: {
            path: "$user"
          }
        }
      ]).toArray();
      if (allUsersOnEvent.length === 0) {
        logger.warn('No users found on event', { input, event });
        return;
      }

      logger.info('Users', { allUsersOnEvent });

      const inAppPromises: Promise<any>[] = [];
      Addresses = (allUsersOnEvent || [])
        .filter(({ user }) => {
          const { title, body } = InAppTemplates[input.template]({
            eventName: event.name,
          });
          inAppPromises.push(sendInAppNotification({
            context,
            userId: user!._id!.toString(),
            templateName: input.template,
            orgId: organization.id,
            title,
            body,
            meta: {
              eventId: new ObjectId(event.id),
            }
          }));
          return user!.member.contactInfo?.primaryEmail.receiveEmails
        })
        .reduce((obj, shift) => {
          const Substitutions: Record<string, string[]> = {
            "event.name": [event.name],
            "user.first_name": [shift.user?.firstName || ''],
            "system.login_url": [url],
            "system.metro_name": [organization.name],

            "event.name_old": [`${updates.name?.oldValue || event.name}`],
            "event.name_updated": [`${updates.name?.newValue || event.name}`],

            "venue.name_old": [`${oldVenue!.name}`],
            "venue.name_updated": [`${newVenue!.name}`],
            "venue.street_address_old": [`${oldVenue!.address}`],
            "venue.street_address_updated": [`${newVenue!.address}`],

            "event.start_date_old": [`${oldEventStart.date}`],
            "event.start_time_old": [`${oldEventStart.time}`],
            "event.start_date_updated": [`${eventStart.date}`],
            "event.start_time_updated": [`${eventStart.time}`],

            "event.end_date_old": [`${oldEventEnd.date}`],
            "event.end_time_old": [`${oldEventEnd.time}`],
            "event.end_date_updated": [`${eventEnd.date}`],
            "event.end_time_updated": [`${eventEnd.time}`],

            "event.notes_old": [`${updates.notes?.oldValue || event.notes}`],
            "event.notes_updated": [`${updates.notes?.newValue || event.notes}`],
          };
          const email = shift.user!.member.contactInfo!.primaryEmail.address;
          if (!email) {
            return obj;
          }
          return {
            ...obj,
            [email]: {
              ChannelType: 'EMAIL',
              Substitutions,
            } as AddressConfiguration,
          };
        }, {} as Record<string, AddressConfiguration>);

      await Promise.all(inAppPromises);

    } else if (input.template === MailerEvents.OfficerAssignmentEdited) {
      const {
        assignmentId,
        orgId,
        updates,
      }: {
        assignmentId: string;
        orgId: string;
        updates: IAssignmentUpdates;
      } = input.data;

      const assignment = await context.assignments.get(assignmentId);
      if (!assignment) {
        logger.error('Assignment not found', { input, assignmentId });
        return;
      }

      const event = await context.events.get(assignment.eventId);
      if (!event) {
        logger.error('Event not found', { input, assignment });
        return;
      }

      const organization = await context.organizations.get(orgId);
      if (!organization) {
        logger.error('Organization not found', { input, orgId });
        return;
      }

      let skills: string[] = [];
      if (assignment.requiredSkillIds.length > 0) {
        const skillList = await context.skills.collection.find<{ _id: ObjectId; name: string; }>({
          _id: { $in: assignment.requiredSkillIds.map((id) => new ObjectId(id)) },
        }, {
          projection: {
            _id: 1,
            name: 1,
          },
        }).toArray();
        skills = skillList.map((skill) => skill.name);
      }

      let oldSkills: string[] = skills;
      if ((updates.requiredSkillIds?.oldValue as Array<any>)?.length > 0) {
        const skillList = await context.skills.collection.find<{ _id: ObjectId; name: string; }>({
          _id: { $in: (updates.requiredSkillIds?.oldValue as Array<any>).map((id) => new ObjectId(id)) },
        }, {
          projection: {
            _id: 1,
            name: 1,
          },
        }).toArray();
        oldSkills = skillList.map((skill) => skill.name);
      }

      fromEmail = organization.fromEmail || fromEmail;
      let url = process.env.LOGIN_URL || '';
      if ((organization as IOrganization).features.sso) {
        const domain = organization.sso?.uiSubDomains?.[0] || 'app';
        const urlBuilder = new URL(`${process.env.COGNITO_URL}/oauth2/authorize`);
        urlBuilder.searchParams.append('client_id', process.env.COGNITO_CLIENT_ID!);
        urlBuilder.searchParams.append('response_type', 'code');
        urlBuilder.searchParams.append('redirect_uri', `https://${domain}.caleopro.com`);
        urlBuilder.searchParams.append('identity_provider', domain);
        url = `${urlBuilder.toString()}&scope=phone+email+openid+phone`;
      }

      const eventStart = convertDate(new Date(event.startTime!), organization);
      const eventEnd = convertDate(new Date(event.endTime!), organization);

      const allUsersOnEvent = await context.shifts.collection.aggregate<IShiftExpanded>([
        {
          $match: {
            eventId: new ObjectId(event.id),
            removedAt: { $exists: false },
            status: ShiftStatus.Assigned,
            assignmentId: new ObjectId(assignment.id),
          },
        },
        {
          $lookup:{
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: {
            path: "$user"
          }
        }
      ]).toArray();
      if (allUsersOnEvent.length === 0) {
        logger.warn('No users found on event', { input, event });
        return;
      }

      logger.info('Users', { allUsersOnEvent });

      const inAppPromises: Promise<any>[] = [];
      Addresses = (allUsersOnEvent || [])
        .filter(({ user }) => {
          const { title, body } = InAppTemplates[input.template]({
            eventName: event.name,
            assignmentName: assignment.name,
          });
          inAppPromises.push(sendInAppNotification({
            context,
            userId: user!._id!.toString(),
            templateName: input.template,
            orgId: organization.id,
            title,
            body,
            meta: {
              eventId: new ObjectId(event.id),
            }
          }));
          return user!.member.contactInfo?.primaryEmail.receiveEmails
        })
        .reduce((obj, shift) => {
          const Substitutions: Record<string, string[]> = {
            "shift.name_updated": [`${updates.name?.newValue || assignment.name}`],
            "shift.name_old": [`${updates.name?.oldValue || assignment.name}`],

            "event.name": [event.name],
            "user.first_name": [shift.user?.firstName || ''],
            "system.login_url": [url],
            "system.metro_name": [organization.name],
            "event.start_date": [`${eventStart.date}`],
            "event.start_time": [`${eventStart.time}`],
            "event.end_date": [`${eventEnd.date}`],
            "event.end_time": [`${eventEnd.time}`],

            "num_personnel_old": [`${(updates.shiftIds?.oldValue as Array<any>)?.length || assignment.shiftIds.length || 0}`],
            "num_personnel_updated": [`${(updates.shiftIds?.newValue as Array<any>)?.length || assignment.shiftIds.length || 0}`],

            "skills_old": [`${oldSkills.join(', ') || '-'}`],
            "skills_updated": [`${skills.join(', ') || '-'}`],

            "shift.notes_old": [`${updates.notes?.oldValue || assignment.description || ''}`],
            "shift.notes_updated": [`${updates.notes?.newValue || assignment.description || ''}`],

            "bw_old": [`${updates.bwNeeded?.oldValue || assignment.bwNeeded}`],
            "bw_updated": [`${updates.bwNeeded?.newValue || assignment.bwNeeded}`],
          };
          const email = shift.user!.member.contactInfo!.primaryEmail.address;
          if (!email) {
            return obj;
          }
          return {
            ...obj,
            [email]: {
              ChannelType: 'EMAIL',
              Substitutions,
            } as AddressConfiguration,
          };
        }, {} as Record<string, AddressConfiguration>);

      await Promise.all(inAppPromises);

    } else if (input.template === MailerEvents.OfficerShiftEdited) {
      const {
        shiftId,
        orgId,
        updates,
      }: {
        shiftId: string;
        assignment: IAssignment;
        orgId: string;
        updates: IShiftUpdates;
      } = input.data;

      const organization = await context.organizations.get(orgId);
      if (!organization) {
        logger.error('Organization not found', { input, orgId });
        return;
      }
      fromEmail = organization.fromEmail || fromEmail;
      let url = process.env.LOGIN_URL || '';
      if ((organization as IOrganization).features.sso) {
        const domain = organization.sso?.uiSubDomains?.[0] || 'app';
        const urlBuilder = new URL(`${process.env.COGNITO_URL}/oauth2/authorize`);
        urlBuilder.searchParams.append('client_id', process.env.COGNITO_CLIENT_ID!);
        urlBuilder.searchParams.append('response_type', 'code');
        urlBuilder.searchParams.append('redirect_uri', `https://${domain}.caleopro.com`);
        urlBuilder.searchParams.append('identity_provider', domain);
        url = `${urlBuilder.toString()}&scope=phone+email+openid+phone`;
      }

      const allUsersOnEvent = await context.shifts.collection.aggregate<IShiftExpanded>([
        {
          $match: {
            shiftId: shiftId,
            removedAt: { $exists: false },
            status: ShiftStatus.Assigned,
          },
        },
        {
          $lookup:{
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: {
            path: "$user"
          }
        }
      ]).toArray();
      if (allUsersOnEvent.length === 0) {
        logger.warn('No users found on shiftId', { input, shiftId });
        return;
      }

      const assignment = await context.assignments.get(allUsersOnEvent[0].assignmentId);
      if (!assignment) {
        logger.error('Assignment not found', { input, shiftId });
        return;
      }

      const event = await context.events.get(assignment.eventId);
      if (!event) {
        logger.error('Event not found', { input, shiftId });
        return;
      }

      const shiftStart = convertDate(allUsersOnEvent[0].startTime, organization);
      const shiftEnd = convertDate(allUsersOnEvent[0].endTime, organization);
      let oldShiftStart = shiftStart;
      let oldShiftEnd = shiftEnd;
      if (updates.startTime?.oldValue) {
        oldShiftStart = convertDate(updates.startTime?.oldValue as Date, organization);
      }
      if (updates.endTime?.oldValue) {
        oldShiftEnd = convertDate(updates.endTime?.oldValue as Date, organization);
      }

      const inAppPromises: Promise<any>[] = [];
      Addresses = (allUsersOnEvent || [])
        .filter(({ user }) => {
          const { title, body } = InAppTemplates[input.template]({
            eventName: event.name,
            assignmentName: assignment.name,
          });
          inAppPromises.push(sendInAppNotification({
            context,
            userId: user!._id!.toString(),
            templateName: input.template,
            orgId: organization.id,
            title,
            body,
            meta: {
              eventId: new ObjectId(event.id),
            }
          }));
          return user!.member.contactInfo?.primaryEmail.receiveEmails
        })
        .reduce((obj, shift) => {
          const Substitutions: Record<string, string[]> = {
            "assignment.name": [assignment.name],
            "event.name": [event.name],
            "user.first_name": [shift.user?.firstName || ''],
            "system.metro_name": [organization.name],
            "system.login_url": [url],

            "shift.start_date_old": [`${oldShiftStart.date}`],
            "shift.start_time_old": [`${oldShiftStart.time}`],
            "shift.start_date_updated": [`${shiftStart.date}`],
            "shift.start_time_updated": [`${shiftStart.time}`],

            "shift.end_date_old": [`${oldShiftEnd.date}`],
            "shift.end_time_old": [`${oldShiftEnd.time}`],
            "shift.end_date_updated": [`${shiftEnd.date}`],
            "shift.end_time_updated": [`${shiftEnd.time}`],
          };
          const email = shift.user!.member.contactInfo!.primaryEmail.address;
          if (!email) {
            return obj;
          }
          return {
            ...obj,
            [email]: {
              ChannelType: 'EMAIL',
              Substitutions,
            } as AddressConfiguration,
          };
        }, {} as Record<string, AddressConfiguration>);

      await Promise.all(inAppPromises);
    }

    if (Object.keys(Addresses).length === 0) {
      logger.info('No addresses to send emails to', {
        input,
        Addresses,
      });
      return;
    }
    await sendInChunks(input, Addresses, templateVersion, fromEmail);
  } catch(error) {
    logger.error('Error sending email', { error, input });
    throw error;
  }
};

const mailer = async (event: MailerEvent) => {
  if (event.action === 'Email') {
    await sendEmail(event);
  }
};

export const handler = middy(mailer)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
