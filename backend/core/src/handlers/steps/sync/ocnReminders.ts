import middy from '@middy/core';
import { ObjectId } from 'mongodb';
import { subHours } from 'date-fns';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

import logger from '../../../utils/logger';
import { Action, MailerEvent, MailerEvents } from '../../../types/mailer';
import { createContext } from '../../../utils/createContext';
import { EventStatus } from '../../../__generated__/resolvers-types';

const lambda = new LambdaClient({});

const ocnReminders = async () => {
  const { events, organizations } = await createContext();

  const allOrganizations = await organizations.all();

  const reminders: { orgId: ObjectId; eventIds: ObjectId[] }[] = [];
  for(const org of allOrganizations) {
    if (org.features.lasdEventFields) {
      const missingOcnEvents = await events.collection.find({
        $and: [
          {
            orgId: org._id!,
          },
          {
            status: { $nin: [EventStatus.Complete, EventStatus.Requested, EventStatus.Removed] }
          },
          {
            removedAt: { $exists: false },
          },
          {
            $or: [
              { ocn: { $exists: false } },
              { ocn: { $eq: '' } },
            ]
          },
          {
            $or: [
              { lastDepartmentNotificationDate: { $exists: false } },
              { lastDepartmentNotificationDate: { $lte: subHours(new Date(), 72) } },
            ]
          },
        ],
      }).project({ _id: 1 }).toArray();
      if (missingOcnEvents.length > 0) {
        reminders.push({
          orgId: org._id!,
          eventIds: missingOcnEvents.map(e => e._id!),
        });
      }
    }
  }

  if (reminders.length > 0) {
    for (const reminder of reminders) {
      await lambda.send(new InvokeCommand({
        FunctionName: process.env.MAILER_LAMBDA,
        InvocationType: 'Event',
        Payload: JSON.stringify({
          action: Action.Email,
          template: MailerEvents.MissingOCN,
          data: {
            orgId: reminder.orgId,
            eventIds: reminder.eventIds,
          },
        } as MailerEvent),
      }));
    }
  }
};

export const handler = middy(ocnReminders)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
