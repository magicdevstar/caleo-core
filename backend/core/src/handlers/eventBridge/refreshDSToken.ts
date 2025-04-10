import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import middy from '@middy/core';
import logger from '../../utils/logger';
import { createContext } from '../../utils/createContext';

const refreshDSToken = async () => {
  try {
    const { docusign } = await createContext();
    await docusign.updateAllDSOrgKeys();
  } catch(error) {
    logger.error('Failed to refresh docusign org tokens', { error });
    throw error;
  }
};

export const handler = middy(refreshDSToken)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));