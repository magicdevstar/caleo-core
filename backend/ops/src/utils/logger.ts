import { Logger } from '@aws-lambda-powertools/logger';
import { ConstructorOptions } from '@aws-lambda-powertools/logger/lib/types';

const getLoggerConfig = ({
  serviceName,
  stage
}): ConstructorOptions => ({
  serviceName,
  logLevel: process.env.LOG_LEVEL! as any,
  sampleRateValue: parseFloat(process.env.LOG_SAMPLE_RATE!),
});

export const persistentAttributes = [
  'cold_start',
  'function_request_id',
];

const logger = new Logger(getLoggerConfig({
  serviceName: 'ops',
  stage: process.env.STAGE,
}));

export const loggerMiddleware = async () => {
  return async () => logger.removePersistentLogAttributes(persistentAttributes)
};

export default logger;
