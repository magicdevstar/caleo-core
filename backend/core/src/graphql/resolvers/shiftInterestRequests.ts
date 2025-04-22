import { GraphQLError } from "graphql";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { Context } from "../../utils/createContext";
import {
  ShiftLotteryRequest,
  ShiftLotteryRequestStatus,
  ShiftInterestRequestsSearchInput,
  UpsertShiftInterestRequest,
  ShiftInterestRequestStatus,
  ShiftStatus,
  Shift
} from "../../__generated__/resolvers-types";
import { adminOnly, adminOrOwnerOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { ObjectId } from "mongodb";
import { IShiftInterestRequest, IUpsertShiftInterestRequest } from "../../models/shiftInterestRequest";
import logger from "../../utils/logger";
import { Action, MailerEvent, MailerEvents } from "../../types/mailer";
import { IShift } from "../../models/shift";

const lambda = new LambdaClient();

export const shiftInterestRequests = {
  Query: {
    shiftInterestRequests: async (
      _parent: unknown,
      { input }: { input: ShiftInterestRequestsSearchInput },
      {
        shiftInterestRequests,
        user,
      }: Context
    ): Promise<SearchResults<IShiftInterestRequest>> => {
      adminOnly(user);
      const searchInput: any = {
        orgId: user?.member.orgId,
        shiftGroupId: input.shiftGroupId,
        status: {
          $in: [
            ShiftInterestRequestStatus.Pending,
            ShiftInterestRequestStatus.Approved,
            ShiftInterestRequestStatus.Rejected,
          ]
        },
        includeRemoved: true,
        queryField: 'shiftGroupId',
        order: 'asc',
        orderBy: 'createdAt',
      };
      return shiftInterestRequests.search(searchInput);
    },
  },
  Mutation: {
    removeShiftInterestRequest: async (
      _parent: unknown,
      { id }: { id: string },
      { shiftInterestRequests, user }: Context
    ): Promise<string> => {
      const foundRequest = await shiftInterestRequests.get(id);
      if (!foundRequest) {
        throw new GraphQLError('Shift Request not found. Please try again.');
      }
      adminOrOwnerOnly(foundRequest.userId.toString(), user);
      await shiftInterestRequests.remove(id, { modifiedById: user!._id!, status: ShiftLotteryRequestStatus.Removed });
      return id;
    },
    shiftInterestRequest: async (
      _parent: unknown,
      { shiftInterestRequest }: { shiftInterestRequest: UpsertShiftInterestRequest },
      {
        shiftInterestRequests,
        shifts,
        users,
        user,
        interestList,
        organization,
      }: Context
    ): Promise<IUpsertShiftInterestRequest> => {
      adminOrOwnerOnly(shiftInterestRequest.userId, user);

      const shift = await shifts.collection.findOne<IShift>({
        shiftId: shiftInterestRequest.shiftGroupId,
        removedAt: { $exists: false },
      });
      if (!shift) {
        throw new GraphQLError('Shift not found');
      }

      let notificationData: {
        template: MailerEvents;
        data: any;
      } | undefined;
      let assignedShiftId: ObjectId | undefined;
      if (shiftInterestRequest.id) {
        // If the status is approved then ensure we add the user to the shift group
        if (shiftInterestRequest.status === ShiftInterestRequestStatus.Approved) {
          try {
            adminOnly(user);
            const availableShifts = await shifts.findAllUnassignedShiftsByGroupId({
              shiftGroupId: shiftInterestRequest.shiftGroupId,
              includeLockedShifts: true,
            });
            let interestUser = user!;
            if (user!.id !== shiftInterestRequest.userId) {
              const foundUser = await users.get(shiftInterestRequest.userId);
              if (!foundUser) {
                throw new GraphQLError('User not found');
              }
              interestUser = foundUser;
            }
            if (availableShifts.length > 0) {
              const slot = availableShifts[0];

              const { canSignUpForShift } = await shifts.canSignUpForShift({
                user: interestUser,
                shift: slot,
                orgId: organization!.id,
                shiftBufferTime: organization?.settings?.shiftBuffer.enabled ? organization?.settings?.shiftBuffer.minuteShiftBuffer : 0,
              });
              const hasMaxHours = await users.hasMaxHours({ user: interestUser, shift: slot, organization: organization! });
              const hasMaxShifts = await users.hasMaxShifts({ user: interestUser, shift: slot, organization: organization! });
              if (!canSignUpForShift || hasMaxShifts || hasMaxHours) {
                throw new GraphQLError('User cannot sign up for this shift');
              }

              const updatedShift = {
                ...slot,
                userId: interestUser._id!,
                status: ShiftStatus.Assigned,
              };

              await shifts.update({
                ...updatedShift,
                id: updatedShift.id!,
              });
              assignedShiftId = updatedShift._id!;

              notificationData = {
                template: MailerEvents.OfficerAdminAssignedShift,
                data: {
                  adminAssignedShift: true,
                  shift: updatedShift,
                  organization,
                }
              };
            }
          } catch(error) {
            logger.error('Failed to assign user to shift', { error, shiftInterestRequest });
            throw new GraphQLError('Cannot assign user to this shift');
          }
        }

        // If the status is rejected then ensure we attempt to remove the user from the shift group
        if (shiftInterestRequest.status === ShiftInterestRequestStatus.Rejected) {
          try {
            adminOnly(user);
            let interestUser = user!;
            if (user!.id !== shiftInterestRequest.userId) {
              const foundUser = await users.get(shiftInterestRequest.userId);
              if (!foundUser) {
                throw new GraphQLError('User not found');
              }
              interestUser = foundUser;
            }

            const slot = await shifts.collection.findOne({
              userId: interestUser._id!,
              shiftId: shiftInterestRequest.shiftGroupId,
              status: ShiftStatus.Assigned,
            });
            if (!slot) {
              throw new GraphQLError('User is not assigned to this shift');
            }

            notificationData = {
              template: MailerEvents.OfficerRemovedFromShift,
              data: {
                shift: slot!,
                existingUserId: slot.userId,
                removeUser: user,
                organization,
              }
            }
            const {_id, ...createShift} = slot;
            await shifts.create<any>({
              ...createShift,
              status: ShiftStatus.Unassigned,
              modifiedById: user?._id!,
              removedAt: new Date(),
              userId: interestUser._id,
            });
            delete slot.userId;
            await shifts.update<any>({
              ...slot,
              id: _id.toString(),
              status: ShiftStatus.Available,
            }, { userId: '' });
          } catch(error) {
            logger.error('Failed to remove user from shift', { error, shiftInterestRequest });
            throw new GraphQLError('Cannot remove user from this shift');
          }
        }
      }

      const upsert: IUpsertShiftInterestRequest = {
        ...(shiftInterestRequest.id ? { id: shiftInterestRequest.id } : {}),
        shiftGroupId: shiftInterestRequest.shiftGroupId,
        ...(shiftInterestRequest.status && {status: shiftInterestRequest.status}),
        ...(shiftInterestRequest.id ? {} : { status: ShiftInterestRequestStatus.Pending }),
        orgId: user?.member.orgId!,
        eventId: new ObjectId(shift.eventId),
        ...(assignedShiftId && { assignedShiftId }),
        assignmentId: new ObjectId(shift.assignmentId),
        modifiedById: user?._id!,
        userId: new ObjectId(shiftInterestRequest.userId),
      }
      const res = await shiftInterestRequests.upsert(upsert);

      // TODO: Send notification to user if the status changed from pending to approved or rejected?
      if (notificationData) {
        await lambda.send(new InvokeCommand({
          FunctionName: process.env.MAILER_LAMBDA!,
          InvocationType: 'Event',
          Payload: JSON.stringify({
            action: Action.Email,
            template: notificationData.template,
            data: notificationData.data,
          } as MailerEvent),
        }));
      }

      await interestList.maybeTriggerNextAssignment({
        shift: {
          shiftId: upsert.shiftGroupId,
          eventId: upsert.eventId,
        } as any,
        organization: organization!,
      });

      return res;
    },
  },
  fields: {
    ShiftInterestRequest: {
      ...commonResolvers,
      org: (item: IShiftInterestRequest, _, { organizations }: Context) => organizations.loader.load(item.orgId.toString()),
      event: (item: IShiftInterestRequest, _, { events }: Context) => events.loader.load(item.eventId.toString()),
      assignment: (item: IShiftInterestRequest, _, { assignments }: Context) => assignments.loader.load(item.assignmentId.toString()),
      user: async (item: IShiftInterestRequest, {shiftStart, timezoneOffset}: {shiftStart: string; timezoneOffset: number;}, { users }: Context) => {
        const user = await users.loader.load(item.userId.toString());
        return {
          ...user,
          shiftStart,
          timezoneOffset,
        };
      },
      shift: (item: IShiftInterestRequest, _, { shifts }: Context) => shifts.loadOneShiftFromGroup.load(item.shiftGroupId),
      assignedShift: (item: IShiftInterestRequest, _, { shifts }: Context) => item.assignedShiftId ? shifts.loader.load(item.assignedShiftId.toString()) : null,
    },
  },
};