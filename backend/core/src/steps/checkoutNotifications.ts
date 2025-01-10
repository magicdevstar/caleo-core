import middy from '@middy/core';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';

import logger from '../utils/logger';
import { createContext } from '../utils/createContext';
import { Action, MailerEvent, MailerEvents } from '../types/mailer';

const lambda = new LambdaClient({});

const checkoutNotifications = async () => {
  const { shifts, organizations } = await createContext();

  logger.setLogLevel('INFO');

  const orgs = await organizations.collection.find({
    'features.eventCheckIn': true,
  }).toArray();

  for(const org of orgs) {
    const now = new Date();
    const sixHoursAgo = now.getTime() - 6 * 60 * 60 * 1000;

    const findParams = {
      endTime: { $lte: sixHoursAgo },
      startTime: { $lte: sixHoursAgo },
      'shiftCheckInOut.checkOutTime': { $exists: false },
      'shiftCheckInOut.checkInTime': { $exists: true },
    };
    logger.info('Checking for shifts to notify', {
      findParams,
      now: Date.now(),
      timezone: org?.timezone || 'America/Los_Angeles',
    });

    const shiftsToNotify = await shifts.collection.find(findParams).toArray();

    if (shiftsToNotify.length > 0) {
      const res = await shifts.collection.updateMany({
        _id: { $in: shiftsToNotify.map(s => s._id) },
      }, {
        $set: {
          updatedAt: now.getTime(),
          'shiftCheckInOut.checkOutTime': now,
        },
      });
      logger.info('Shift updated', { res });

      await lambda.send(new InvokeCommand({
        FunctionName: process.env.MAILER_LAMBDA!,
        InvocationType: 'Event',
        Payload: JSON.stringify({
          action: Action.Email,
          template: MailerEvents.OfficerShiftAutoCheckout,
          data: {
            shiftIds: shiftsToNotify.map(s => s._id.toString()),
            organization: org,
          },
        } as MailerEvent),
      }));
    }
  }
};

export const handler = middy(checkoutNotifications)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
