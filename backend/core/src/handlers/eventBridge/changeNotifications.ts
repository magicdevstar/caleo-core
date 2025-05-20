import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import middy from '@middy/core';
import logger from '../../utils/logger';
import { createContext } from '../../utils/createContext';

const changeNotifications = async () => {
  try {
    const { changeStream } = await createContext();
    await changeStream.sendDailyChangeNotifications();
  } catch(error) {
    logger.error('Failed to invoke change notifications', { error });
    throw error;
  }
};

export const handler = middy(changeNotifications)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));