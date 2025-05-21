// Mock for @aws-lambda-powertools/logger/types
export enum LogLevel {
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
  SILENT = 'SILENT',
}

export interface ConstructorOptions {
  serviceName?: string;
  logLevel?: LogLevel | string;
  sampleRateValue?: number;
  customConfigService?: any;
  logFormatter?: any;
  environment?: string;
  persistentLogAttributes?: Record<string, any>;
  [key: string]: any;
}

export interface LogAttributes {
  [key: string]: any;
}

// Add additional types as needed
