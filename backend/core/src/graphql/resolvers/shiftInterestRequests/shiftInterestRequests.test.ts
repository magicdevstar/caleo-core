import {
  describe,
  it,
  beforeAll,
  afterAll,
  expect,
} from '@jest/globals';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { mockLambdaClient } = require('../../../../__mocks__/@aws-sdk/client-lambda');
import { randomUUID as uuid } from 'crypto';
import { testingService } from '../../../services/testing/testing.service';
import { EventStatus, UpsertShift } from '../../../__generated__/resolvers-types';
import { truncateToMinute } from '../../../utils/date.helpers';
import { addHours } from 'date-fns/addHours';
import { subMinutes } from 'date-fns';
import { InvokeCommand } from '@aws-sdk/client-lambda';

describe('Shift Interest Requests', () => {
  beforeAll(async () => {
    await testingService.init();
  });
  
  afterAll(async () => await testingService.afterAll());

  it('should create interest request and run the assignment', async () => {
    if (!testingService.testingDefault) {
      throw new Error('testingDefault not initialized');
    }

    await testingService.setFeature({
      orgId: testingService.testingDefault.org._id!,
      feature: 'interestLists',
      value: true,
    });

    // Create shifts on assignment
    const {
      event,
      assignment,
    } = await testingService.initEventWithAssignment({
      eventStatus: EventStatus.InterestList,

      // Ensure auto assignment rules apply so we can check the assignment lambda
      autoAssignInterestList: true,
      scheduledInterestList: subMinutes(new Date(), 1),
      scheduledCloseInterestList: subMinutes(new Date(), 1),
      interestListAutoAssignCutoff: addHours(new Date(), 1),
    });

    const groupId = uuid();
    const startTime = truncateToMinute(addHours(new Date(), 1)).toISOString();
    const endTime = truncateToMinute(addHours(new Date(), 4)).toISOString();
    const inputShifts: UpsertShift[] = new Array(2).fill('i').map((_, index) => ({
      shiftId: groupId,
      refNumber: index,
      startTime,
      endTime,
      // Should show shifts even if one is locked
      locked: index === 0,
      eventId: event.id!,
      assignmentId: assignment.id!,
    }));
    await testingService.upsertShifts(inputShifts);

    // Create interest request
    await testingService.submitInterestRequest({
      shiftGroupId: inputShifts[0].shiftId,
      userId: testingService.testingDefault.user.id!,
    });

    // Validate lambda invoke event
    const interestLambdaCalls = mockLambdaClient.commandCalls(InvokeCommand);
    expect(interestLambdaCalls.length).toBeGreaterThan(0);

    // Get the most recent call
    const functionName = `caleo-core-${process.env.STAGE}-assignShiftGroup`;
    const assignmentCall = interestLambdaCalls.find((call) => call.args[0].input.FunctionName === functionName);
    expect(assignmentCall).toBeDefined();
    const params = assignmentCall.args[0];

    expect(params.input.FunctionName).toEqual(functionName);

    if (params.input.Payload) {
      const payload: any = JSON.parse(`${params.input.Payload}`);
      payload._id = groupId;
      payload.orgId = testingService.testingDefault.org.id;
    }
  });
});
