import { MongoMemoryServer } from "mongodb-memory-server";
import { v4 as uuid } from "uuid";
import { MongoClient, ObjectId } from "mongodb";
import { InvokeCommand, LambdaClientResolvedConfig, ServiceInputTypes, ServiceOutputTypes } from '@aws-sdk/client-lambda';
import { Context, createContext, IServiceContext } from "../../utils/createContext";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { mockLambdaClient } = require('../../../__mocks__/@aws-sdk/client-lambda');
import {
  customizations,
  org as defaultOrg,
  features,
  settings,
} from '../../models/organizations/organization.defaults';
import { IRank } from "../../models/rank";
import { IUser } from "../../types/common";
import { Assignment, Division, DocType, EventStatus, MemberRole, Shift, ShiftInterestRequest, Unit, UpsertAssignment, UpsertShift, IIncidentForm } from "../../__generated__/resolvers-types";
import { defaultUserAvailability } from "../../models/user";
import { IOrganization } from "../../models/organizations/organization.entity";
import { IEvent } from "../../models/event";
import { server } from "../../handlers/api/graphql";
import { CREATE_ASSIGNMENT } from "./gql/assignments";
import { expect } from "@jest/globals";
import { ASSIGN_SHIFT, CREATE_SHIFTS, GET_AVAILABLE_SHIFTS, GET_SHIFT_DETAILS, REMOVE_SHIFT, SHIFT_INTEREST_REQUEST } from "./gql/shifts";
import { MailerEvents } from "../../types/mailer";
import { REMOVE_DIVISION, UPSERT_DIVISION } from "./gql/division";
import { GET_UNIT, UPSERT_UNIT } from "./gql/unit";
import { CREATE_INCIDENT_SUBMISSION, VOID_INCIDENT_FORM } from "./gql/incidentForm";
import { AwsStub } from "aws-sdk-client-mock";

export interface ITestingDefaults {
  org: IOrganization;
  rank: IRank;
  user: IUser;
}

export class TestingService {
  public mongod: MongoMemoryServer | null = null;
  public testingDefault: ITestingDefaults | null = null;
  public mongoClient: MongoClient | null = null;
  public requestContext: Context | null = null;
  public context: IServiceContext | null = null;
  private initialized = false;

  constructor() {}

  async init() {
    if (this.initialized) {
      return; // Already initialized
    }
    
    // Create the in-memory MongoDB server
    this.mongod = await MongoMemoryServer.create();
    const uri = this.mongod.getUri();
    process.env.MONGODB_URI = uri;
    
    // Initialize test data
    this.mongoClient = new MongoClient(process.env.MONGODB_URI!);
    this.context = await createContext(this.mongoClient);
    this.testingDefault = await this.initializeOrgWithUser();

    this.requestContext = {
      ...this.context,
      user: this.testingDefault.user,
      organization: this.testingDefault.org,
      lambdaContext: {} as any,
      lambdaEvent: {} as any,
    };
    
    this.initialized = true;
    
    return this; // Return the instance for method chaining
  }

  async afterAll() {
    if (!this.initialized) {
      console.warn('TestingService.afterAll called before initialization');
      return;
    }
    
    // Close the MongoDB connection
    if (this.mongoClient) {
      await this.mongoClient.close(true);
      this.mongoClient = null;
    }
    
    // Stop the in-memory MongoDB server
    if (this.mongod) {
      await this.mongod.stop();
      this.mongod = null;
    }
    
    this.testingDefault = null;
    this.requestContext = null;
    this.context = null;
    this.initialized = false;
  }

  async setFeature({
    orgId,
    feature,
    value,
  } : {
    orgId?: ObjectId,
    feature: string,
    value: boolean
  }) {
    if (!this.context || !this.testingDefault) {
      throw new Error('TestingService.context is not initialized');
    }

    const { organizations } = this.context;
    const _id = orgId || this.testingDefault.org._id!;

    await organizations.setFeature({ _id, feature, value });
  }

  async initializeOrgWithUser(): Promise<ITestingDefaults> {
    if (!this.context) {
      throw new Error('TestingService.context is not initialized');
    }
    
    const { organizations, ranks, users } = this.context;

    const mergedOrg = {
      ...defaultOrg,
      name: 'Test Organization',
      customizations,
      settings,
      features,
    };
    const org = await organizations.create(mergedOrg);

    const rank = await ranks.create({
      name: 'Officer',
      orgId: org.id,
    } as IRank);

    const inputUser: IUser = {
      name: 'Test User',
      cognitoId: 'test-cognito-id',
      firstName: 'Test',
      lastName: 'User',
      superAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      modifiedById: new ObjectId(),
      docType: DocType.User,
      member: {
        orgId: org._id!,
        pNumber: '123456789',
        role: MemberRole.Admin,
        memberSkillIds: [],
        memberEquipmentIds: [],
        rankId: rank._id!,
        availability: defaultUserAvailability,
      },
    };

    const user = await users.create(inputUser as any);

    return {
      org,
      user,
      rank,
    };
  }

  async submitIncidentForm(input: IIncidentForm) {
    if (!this.requestContext) {
      throw new Error('TestingService.requestContext is not initialized');
    }

    const res = await server.executeOperation(
      {
        query: CREATE_INCIDENT_SUBMISSION,
        variables: {
          input: input,
        }
      },
      {
          contextValue: this.requestContext,
      }
    );

    // Apollo Server v4 returns a Response object with a body property
    // The body.kind should be 'single' for a single GraphQL operation
    expect(res.body.kind).toEqual('single');
    if (res.body.kind === 'single') {
      // Extract the actual result data from the singleResult property 
      const { data, errors } = res.body.singleResult;
      
      // Verify there are no errors in the response
      expect(errors).toBeUndefined();
      
      // Verify the data has the expected structure
      expect(data).toBeDefined();
      return (data as any).incidentForm as string;
    }
    throw new Error('Unexpected response kind');
  }

  async voidIncidentForm(id: string, voidReason?: string) {
    if (!this.requestContext) {
      throw new Error('TestingService.requestContext is not initialized');
    }

    const res = await server.executeOperation(
      {
        query: VOID_INCIDENT_FORM,
        variables: {
          id,
          voidReason,
        }
      },
      {
          contextValue: this.requestContext,
      }
    );

    // Apollo Server v4 returns a Response object with a body property
    expect(res.body.kind).toEqual('single');
    if (res.body.kind === 'single') {
      const { data, errors } = res.body.singleResult;
      return { data, errors };
    }
    throw new Error('Unexpected response kind');
  }

  async initEvent({
    orgId,
    userId,
    status = EventStatus.Draft,
    autoAssignInterestList,
    scheduledInterestList,
    scheduledCloseInterestList,
    interestListAutoAssignCutoff,
    scheduledFirstComeFirstServe,
  }: {
    orgId: ObjectId;
    userId: ObjectId;
    status?: EventStatus;
    autoAssignInterestList?: boolean;
    scheduledInterestList?: Date;
    scheduledCloseInterestList?: Date;
    interestListAutoAssignCutoff?: Date;
    scheduledFirstComeFirstServe?: Date;
  }): Promise<IEvent> {
    if (!this.context) {
      throw new Error('TestingService.context is not initialized');
    }
    
    const { events } = this.context;

    const event: IEvent = {
      name: 'Test Event',
      referenceId: 1,
      searchAttribute: '1 Test Event',
      attachmentPaths: [],
      status,
      orgId,
      autoAssignInterestList,
      scheduledInterestList,
      scheduledCloseInterestList,
      interestListAutoAssignCutoff,
      scheduledFirstComeFirstServe,
      docType: DocType.Event,
      createdAt: new Date(),
      updatedAt: new Date(),
      modifiedById: userId,
    };

    const res = await events.create(event);

    return res;
  }

  async assignmentForEvent(inputAssignment: UpsertAssignment) {
    if (!this.requestContext) {
      throw new Error('TestingService.context is not initialized');
    }

    const res = await server.executeOperation(
      {
        query: CREATE_ASSIGNMENT,
        variables: {
          input: inputAssignment,
        }
      },
      {
          contextValue: this.requestContext,
      }
    );

    // Apollo Server v4 returns a Response object with a body property
    // The body.kind should be 'single' for a single GraphQL operation
    expect(res.body.kind).toEqual('single');
    if (res.body.kind === 'single') {
      // Extract the actual result data from the singleResult property 
      const { data, errors } = res.body.singleResult;
      
      // Verify there are no errors in the response
      expect(errors).toBeUndefined();
      
      // Verify the data has the expected structure
      expect(data).toBeDefined();
      expect(data?.assignment).toBeDefined();

      return data?.assignment as Assignment;
    }
    throw new Error('Unexpected response kind');
  }

  async initEventWithAssignment({
    eventStatus,
    autoAssignInterestList = false,
    scheduledInterestList,
    scheduledCloseInterestList,
    interestListAutoAssignCutoff,
  }: {
    eventStatus?: EventStatus;
    autoAssignInterestList?: boolean;
    scheduledInterestList?: Date;
    scheduledCloseInterestList?: Date;
    interestListAutoAssignCutoff?: Date;
  }) {
    if (!this.testingDefault) {
      throw new Error('TestingService.testingDefault is not initialized');
    }

    const orgId = this.testingDefault.org._id!;
    const userId = this.testingDefault.user._id!;
    const rankId = this.testingDefault.rank.id!;

    const event = await this.initEvent({
      orgId,
      userId,
      status: eventStatus,
      scheduledCloseInterestList,
      interestListAutoAssignCutoff,
      autoAssignInterestList,
      scheduledInterestList,
    });

    const assignment = await this.assignmentForEvent({
      name: 'Test Assignment',
      description: "Test Assignment Description",
      reportingLocation: '',
      requiredSkillIds: [],
      requiredEquipmentIds: [],
      eventId: event.id!,
      rankIds: [rankId],
      bwNeeded: false,
      shiftIds: [],
      notifyWhenFullyStaffed: false,
    });

    return {
      event,
      assignment,
    };
  }

  async submitInterestRequest({
    shiftGroupId,
    userId,
  }: {
    shiftGroupId: string;
    userId: string;
  }) {
    if (!this.requestContext) {
      throw new Error('TestingService.context is not initialized');
    }

    const res = await server.executeOperation(
      {
        query: SHIFT_INTEREST_REQUEST,
        variables: {
          shiftInterestRequest: {
            shiftGroupId,
            userId,
          },
        },
      },
      {
          contextValue: testingService.requestContext!,
      },
    );

    // Apollo Server v4 returns a Response object with a body property
    // The body.kind should be 'single' for a single GraphQL operation
    expect(res.body.kind).toEqual('single');
    
    // Properly parse the body based on its kind - Apollo server can return 'single' or 'batch' responses
    if (res.body.kind === 'single') {
      // Extract the actual result data from the singleResult property 
      const { data, errors } = res.body.singleResult;
      
      // Verify there are no errors in the response
      expect(errors).toBeUndefined();
      
      // Verify the data has the expected structure
      expect(data).toBeDefined();
      expect(data?.shiftInterestRequest).toBeDefined();

      return data?.shiftInterestRequest as ShiftInterestRequest;
    }
    throw new Error('Unexpected response kind');
  }

  async removeShift(id: string) {
    if (!this.requestContext) {
      throw new Error('TestingService.context is not initialized');
    }

    const res = await server.executeOperation(
      {
        query: REMOVE_SHIFT,
        variables: {
          id,
        }
      },
      {
          contextValue: testingService.requestContext!,
      }
    );

    // Apollo Server v4 returns a Response object with a body property
    // The body.kind should be 'single' for a single GraphQL operation
    expect(res.body.kind).toEqual('single');
    
    // Properly parse the body based on its kind - Apollo server can return 'single' or 'batch' responses
    if (res.body.kind === 'single') {
      // Extract the actual result data from the singleResult property 
      const { errors } = res.body.singleResult;
      
      // Verify there are no errors in the response
      expect(errors).toBeUndefined();

      // Return nothing on success
      return;
    }
    throw new Error('Unexpected response kind');
  }

  async upsertShifts(inputShifts: UpsertShift[]) {
    if (!this.requestContext) {
      throw new Error('TestingService.context is not initialized');
    }

    const res = await server.executeOperation(
      {
        query: CREATE_SHIFTS,
        variables: {
          input: inputShifts,
        }
      },
      {
          contextValue: testingService.requestContext!,
      }
    );

    // Apollo Server v4 returns a Response object with a body property
    // The body.kind should be 'single' for a single GraphQL operation
    expect(res.body.kind).toEqual('single');
    
    // Properly parse the body based on its kind - Apollo server can return 'single' or 'batch' responses
    if (res.body.kind === 'single') {
      // Extract the actual result data from the singleResult property 
      const { data, errors } = res.body.singleResult;
      
      // Verify there are no errors in the response
      expect(errors).toBeUndefined();
      
      // Verify the data has the expected structure
      expect(data).toBeDefined();
      expect(data?.shifts).toBeDefined();

      return data?.shifts as Shift[];
    }
    throw new Error('Unexpected response kind');
  }

  async findAvailableShifts() {
    if (!this.requestContext) {
      throw new Error('TestingService.context is not initialized');
    }

    const viewRes = await server.executeOperation({
      query: GET_AVAILABLE_SHIFTS,
      variables: { input: {} },
    }, {
      contextValue: this.requestContext,
    });

    // Apollo Server v4 returns a Response object with a body property
    // The body.kind should be 'single' for a single GraphQL operation
    expect(viewRes.body.kind).toEqual('single');
    
    // Properly parse the body based on its kind - Apollo server can return 'single' or 'batch' responses
    if (viewRes.body.kind === 'single') {
      // Extract the actual result data from the singleResult property 
      const { data, errors } = viewRes.body.singleResult;
      
      // Verify there are no errors in the response
      expect(errors).toBeUndefined();
      
      // Verify the data has the expected structure
      expect(data).toBeDefined();
      expect(data?.availableShifts).toBeDefined();
      expect((data?.availableShifts as {items: Shift[]})?.items).toBeDefined();

      const { items: shifts } = data?.availableShifts as {items: Shift[]};
      return shifts;
    }
    throw new Error('Unexpected response kind');
  }

  async assignShiftToUser(id: string, userId?: string) {
    if (!this.requestContext) {
      throw new Error('TestingService.context is not initialized');
    }

    const res = await server.executeOperation(
      {
        query: ASSIGN_SHIFT,
        variables: {
          id, userId,
        }
      },
      {
          contextValue: this.requestContext,
      }
    );

    // Apollo Server v4 returns a Response object with a body property
    // The body.kind should be 'single' for a single GraphQL operation
    expect(res.body.kind).toEqual('single');
    
    // Properly parse the body based on its kind - Apollo server can return 'single' or 'batch' responses
    if (res.body.kind === 'single') {
      // Extract the actual result data from the singleResult property 
      const { data, errors } = res.body.singleResult;
      
      // Verify there are no errors in the response
      expect(errors).toBeUndefined();
      
      // Verify the data has the expected structure
      expect(data).toBeDefined();
      expect(data?.shiftAssign).toBeDefined();

      const shift = data?.shiftAssign as Shift;

      if (userId) {
        expect(shift.user).toBeDefined();
        expect(shift.user?.id).toEqual(userId);
      }

      return shift;
    }
    throw new Error('Unexpected response kind');
  }

  async getSpecificShift(id: string) {
    if (!this.requestContext) {
      throw new Error('TestingService.context is not initialized');
    }

    const viewRes = await server.executeOperation({
      query: GET_SHIFT_DETAILS,
      variables: { id },
    }, {
      contextValue: this.requestContext,
    });

    // Apollo Server v4 returns a Response object with a body property
    // The body.kind should be 'single' for a single GraphQL operation
    expect(viewRes.body.kind).toEqual('single');
    
    // Properly parse the body based on its kind - Apollo server can return 'single' or 'batch' responses
    if (viewRes.body.kind === 'single') {
      // Extract the actual result data from the singleResult property 
      const { data, errors } = viewRes.body.singleResult;
      
      // Verify there are no errors in the response
      expect(errors).toBeUndefined();
      
      // Verify the data has the expected structure
      expect(data).toBeDefined();
      expect(data?.shift).toBeDefined();
      expect(data?.shift as Shift).toBeDefined();

      return data?.shift as Shift;
    }
    throw new Error('Unexpected response kind');
  }

  async createDivision() {
    if (!this.requestContext) {
      throw new Error('TestingService.context is not initialized');
    }

    const res = await server.executeOperation(
      {
        query: UPSERT_DIVISION,
        variables: {
          input: {
            name: uuid(),
            active: true,
          }
        }
      },
      {
          contextValue: this.requestContext,
      }
    );

    // Apollo Server v4 returns a Response object with a body property
    // The body.kind should be 'single' for a single GraphQL operation
    expect(res.body.kind).toEqual('single');

    if (res.body.kind === 'single') {
      // Extract the actual result data from the singleResult property 
      const { data, errors } = res.body.singleResult;
      
      // Verify there are no errors in the response
      expect(errors).toBeUndefined();
      
      // Verify the data has the expected structure
      expect(data).toBeDefined();
      expect(data?.division).toBeDefined();

      return data?.division as Division;
    }
    throw new Error('Unexpected response kind');
  }

  async removeDivision(id: string) {
    if (!this.requestContext) {
      throw new Error('TestingService.context is not initialized');
    }

    const res = await server.executeOperation(
      {
        query: REMOVE_DIVISION,
        variables: {
          id,
        }
      },
      {
          contextValue: this.requestContext,
      }
    );

    // Apollo Server v4 returns a Response object with a body property
    // The body.kind should be 'single' for a single GraphQL operation
    expect(res.body.kind).toEqual('single');
  }

  async getUnit(id: string) {
    if (!this.requestContext) {
      throw new Error('TestingService.context is not initialized');
    }

    const res = await server.executeOperation(
      {
        query: GET_UNIT,
        variables: {
          id,
        },
      }, {
        contextValue: this.requestContext,
      },
    );

    // Apollo Server v4 returns a Response object with a body property
    // The body.kind should be 'single' for a single GraphQL operation
    expect(res.body.kind).toEqual('single');

    if (res.body.kind === 'single') {
      // Extract the actual result data from the singleResult property 
      const { data, errors } = res.body.singleResult;
      
      // Verify there are no errors in the response
      expect(errors).toBeUndefined();
      
      // Verify the data has the expected structure
      expect(data).toBeDefined();
      expect(data?.unit).toBeDefined();

      return data?.unit as Unit;
    }
    throw new Error('Unexpected response kind');
  }

  async createUnit({
    divisionIds
  }: {
    divisionIds?: string[]
  }) {
    if (!this.requestContext) {
      throw new Error('TestingService.context is not initialized');
    }

    const res = await server.executeOperation(
      {
        query: UPSERT_UNIT,
        variables: {
          input: {
            name: uuid(),
            divisionIds,
            overtimeCode: uuid(),
            active: true,
          }
        }
      },
      {
          contextValue: this.requestContext,
      }
    );

    // Apollo Server v4 returns a Response object with a body property
    // The body.kind should be 'single' for a single GraphQL operation
    expect(res.body.kind).toEqual('single');

    if (res.body.kind === 'single') {
      // Extract the actual result data from the singleResult property 
      const { data, errors } = res.body.singleResult;
      
      // Verify there are no errors in the response
      expect(errors).toBeUndefined();
      
      // Verify the data has the expected structure
      expect(data).toBeDefined();
      expect(data?.unit).toBeDefined();

      return data?.unit as Unit;
    }
    throw new Error('Unexpected response kind');
  }

  notificationSchedulerValidation({
    payloadValidation,
  } : {
    payloadValidation?: (payload: any) => void
  }) {
    // Validate lambda invoke event
    const allCalls = (mockLambdaClient as AwsStub<ServiceInputTypes, ServiceOutputTypes, LambdaClientResolvedConfig>).commandCalls(InvokeCommand);
    expect(allCalls.length).toBeGreaterThan(0);

    // Get the most recent call
    const reminderCall = allCalls.find((call) => call.args[0].input.FunctionName === process.env.SHIFT_NOTIFICATION_SCHEDULER);
    expect(reminderCall).toBeDefined();
    const params = reminderCall!.args[0];

    expect(params.input.FunctionName).toEqual(process.env.SHIFT_NOTIFICATION_SCHEDULER);

    // Validate the payload content
    if (params.input.Payload) {
      const payload: any = JSON.parse(`${params.input.Payload}`);
      payloadValidation?.(payload);
    }
  }

  mailerValidation({
    expectedTemplate,
    payloadValidation
  }:{
    expectedTemplate: MailerEvents
    payloadValidation?: (payload: any) => void
  }) {
    // Validate lambda invoke event
    const interestLambdaCalls = (mockLambdaClient as AwsStub<ServiceInputTypes, ServiceOutputTypes, LambdaClientResolvedConfig>).commandCalls(InvokeCommand);
    expect(interestLambdaCalls.length).toBeGreaterThan(0);

    // Get the most recent call
    const mailerCall = interestLambdaCalls.find((call) => call.args[0].input.FunctionName === process.env.MAILER_LAMBDA);
    expect(mailerCall).toBeDefined();
    const interestParams = mailerCall!.args[0];

    expect(interestParams.input.FunctionName).toEqual(process.env.MAILER_LAMBDA);
    
    // Validate the payload content
    if (interestParams.input.Payload) {
      const payload: any = JSON.parse(`${interestParams.input.Payload}`);
      expect(payload.template).toEqual(expectedTemplate);
      payloadValidation?.(payload);
    }
  }
};

// Create a singleton instance
export const testingService = new TestingService();
