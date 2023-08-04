import { Logger } from '@aws-lambda-powertools/logger';
import { ConstructorOptions } from '@aws-lambda-powertools/logger/lib/types';

const getLoggerConfig = ({
  serviceName,
  stage
}): ConstructorOptions => ({
  serviceName,
  logLevel: stage === 'prod' ? 'info' : 'debug',
  sampleRateValue: stage === 'prod' ? 0.1 : 1,
});

export const persistentAttributes = [
  'cold_start',
  'function_request_id',
];

const logger = new Logger(getLoggerConfig({
  serviceName: 'my-service',
  stage: process.env.STAGE,
}));

export const loggerMiddleware = async () => {
  return async () => logger.removePersistentLogAttributes(persistentAttributes)
};

export default logger;
