import { Logger } from '@aws-lambda-powertools/logger';
import { ConstructorOptions, LogLevel } from '@aws-lambda-powertools/logger/lib/types';

const getLoggerConfig = ({
  serviceName,
}): ConstructorOptions => ({
  serviceName,
  logLevel: process.env.LOG_LEVEL! as unknown as LogLevel,
  sampleRateValue: parseFloat(process.env.LOG_SAMPLE_RATE!),
});

export const persistentAttributes = [
  'cold_start',
  'function_request_id',
];

const logger = new Logger(getLoggerConfig({
  serviceName: 'caleo-core',
}));

export const loggerMiddleware = async () => {
  return async () => logger.removePersistentLogAttributes(persistentAttributes)
};

export default logger;
