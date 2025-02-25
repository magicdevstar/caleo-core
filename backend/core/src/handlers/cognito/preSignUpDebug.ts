import middy from "@middy/core";
import { injectLambdaContext } from "@aws-lambda-powertools/logger";
import { PreSignUpTriggerHandler } from "aws-lambda";
import logger from "../../utils/logger";
import { createContext } from "../../utils/createContext";

const preSignUpDebug: PreSignUpTriggerHandler = async (event) => {
  try {
    const services = await createContext();
    return event;
  } catch(error) {
    logger.error('Failed to debug sso user', { error });
    throw error;
  }
};

export const handler = middy(preSignUpDebug)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
