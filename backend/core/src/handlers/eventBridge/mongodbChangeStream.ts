import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import middy from '@middy/core';
import { ChangeStreamCollection, IChangeStreamEvent } from '../../types/change.streams';
import logger from '../../utils/logger';
import { createContext } from '../../utils/createContext';

const mongodbChangeStream = async (event: IChangeStreamEvent) => {
  try {
    logger.info('Starting change stream event');
    const { changeStream } = await createContext();
    const collection = event.detail.ns.coll;

    switch(collection) {
      case ChangeStreamCollection.EVENTS:
        await changeStream.handleEvent(event);
        break;
      case ChangeStreamCollection.ASSIGNMENTS:
        await changeStream.handleAssignment(event);
        break;
      default:
        logger.warn('MongoDB collection not supported', { collection });
        return;
    }
  } catch(error) {
    logger.error('Failed to invoke mongo change stream', { error });
    throw error;
  }
};

export const handler = middy(mongodbChangeStream)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));