import { beforeEach } from '@jest/globals';
import { mockClient } from 'aws-sdk-client-mock';
import { 
  LambdaClient, 
  InvokeCommand,
  InvokeCommandOutput,
  InvokeCommandInput 
} from '@aws-sdk/client-lambda';
import { Uint8ArrayBlobAdapter } from '@smithy/util-stream';

// Create the Lambda client mock that will be automatically used by Jest
const lambdaClientMock = mockClient(LambdaClient);

beforeEach(() => {
  lambdaClientMock.reset();
});

// Default mock implementation for InvokeCommand
lambdaClientMock.on(InvokeCommand).callsFake((params: InvokeCommandInput) => {
  // Default mock response
  const rawPayload = new TextEncoder().encode(JSON.stringify({ 
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  }));
  
  const response: InvokeCommandOutput = {
    StatusCode: 200,
    Payload: new Uint8ArrayBlobAdapter(rawPayload),
    $metadata: {
      httpStatusCode: 200,
      requestId: 'mock-request-id',
      attempts: 1,
      totalRetryDelay: 0,
    }
  };
  
  return response;
});

// Re-export original module members and add our mock
module.exports = {
  // Original exports
  LambdaClient,
  InvokeCommand,
  // Export our mock for direct use in tests
  mockLambdaClient: lambdaClientMock
};
