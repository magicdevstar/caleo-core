import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import middy from '@middy/core';

import logger from './../utils/logger';

const lottoEvent = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from lotto',
      input: event,
    }, null, 2),
  };
};

export const handler = middy(lottoEvent)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));