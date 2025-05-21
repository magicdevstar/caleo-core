import {
  jest,
} from '@jest/globals';
// Mock for @aws-lambda-powertools/logger
import { LogLevel as BaseLogLevel } from '@aws-lambda-powertools/logger/types';

// Create a mock logger class with all methods from the original package
class MockLogger {
  // Store configuration
  private config: any;
  private persistentAttributes: Record<string, any> = {};

  constructor(options: any = {}) {
    this.config = {
      logLevel: LogLevel.INFO,
      serviceName: 'mock-service',
      sampleRateValue: 1,
      ...options,
    };
  }

  // Mock logging methods
  public info = jest.fn();
  public warn = jest.fn();
  public error = jest.fn();
  public debug = jest.fn();
  public critical = jest.fn();

  // Mock attribute methods
  public addPersistentLogAttributes = jest.fn((attributes: Record<string, any>) => {
    this.persistentAttributes = { ...this.persistentAttributes, ...attributes };
    return this;
  });

  public removePersistentLogAttributes = jest.fn((attributes: string[]) => {
    if (Array.isArray(attributes)) {
      attributes.forEach(attr => {
        delete this.persistentAttributes[attr];
      });
    }
    return this;
  });

  public getPersistentLogAttributes = jest.fn(() => this.persistentAttributes);

  // Utility methods
  public appendKeys = jest.fn(() => this);
  public appendRequestId = jest.fn(() => this);
  public clearState = jest.fn(() => this);
  public setLogLevel = jest.fn((level: BaseLogLevel) => {
    this.config.logLevel = level;
    return this;
  });
  public getLogLevel = jest.fn(() => this.config.logLevel);
}

// Export the constructor as the default export
export const Logger = jest.fn().mockImplementation((options) => new MockLogger(options));

// Export additional types or constants if needed
export const LogLevel = {
  TRACE: 'TRACE',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
  SILENT: 'SILENT',
} as const;
