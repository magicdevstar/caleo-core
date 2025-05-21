import {
  describe,
  expect,
  it,
  beforeAll,
  afterAll,
} from '@jest/globals';
import { testingService } from '../../../services/testing/testing.service';
import { IEvent } from '../../../models/event';
import { UpsertAssignment } from '../../../__generated__/resolvers-types';

// Using it.only inside the describe block is more reliable than describe.only
describe('Assignments', () => {
  let event: IEvent;
  
  beforeAll(async () => {
    await testingService.init();

    if (testingService.testingDefault) {
      event = await testingService.initEvent({
        orgId: testingService.testingDefault.org._id!,
        userId: testingService.testingDefault.user._id!
      });
    } else {
      throw new Error('testingDefault not initialized');
    }
  });
  
  afterAll(async () => await testingService.afterAll());

  it('should create an assignment', async () => {
    if (!testingService.testingDefault) {
      throw new Error('testingDefault not initialized');
    }
    
    const inputAssignment: UpsertAssignment = {
      name: 'Test Assignment',
      description: "Test Assignment Description",
      reportingLocation: '',
      requiredSkillIds: [],
      requiredEquipmentIds: [],
      eventId: event.id!,
      rankIds: [testingService.testingDefault.rank.id!],
      bwNeeded: false,
      shiftIds: [],
      notifyWhenFullyStaffed: false,
    };

    const assignment = await testingService.assignmentForEvent(inputAssignment);

    // Use explicit casting to Assignment to get better type checking
    expect(assignment.id).toBeDefined();
    expect(assignment.name).toEqual(inputAssignment.name);
    expect(assignment.description).toEqual(inputAssignment.description);
    
    // Verify the assignment was properly linked to the event
    expect(assignment.event).toBeDefined();
    expect(assignment.event.id).toEqual(event.id);
    expect(assignment.event.assignmentIds).toContain(assignment.id);
  });
});
