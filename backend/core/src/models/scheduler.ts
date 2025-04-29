import {
  SchedulerClient,
  CreateScheduleCommand,
  UpdateScheduleCommand,
  GetScheduleCommand,
  CreateScheduleCommandInput,
  FlexibleTimeWindowMode,
  Target,
  ScheduleState,
  UpdateScheduleCommandInput,
  DeleteScheduleCommand,
  ActionAfterCompletion
} from "@aws-sdk/client-scheduler";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import logger from "../utils/logger";
import { ObjectId } from "mongodb";

const scheduler = new SchedulerClient({});
const sfn = new SFNClient({});

export enum ScheduleEvent {
  LOTTO_START = 'lotto_start',
  LOTTO_END = 'lotto_end',
  LOTTO_NOTIFY = 'lotto_notify',
  SHIFT_REMINDER = 'shift_reminder',
  EVENT_COMPLETE = 'event_complete',
  EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE = 'event_fcfs_live',
  EVENT_INTEREST_GO_LIVE = 'event_int_live',
  EVENT_INTEREST_CLOSE = 'event_int_close',
  EVENT_INTEREST_CLOSING = 'event_int_closing',
  EVENT_INTEREST_AUTO_ASSIGN_END = 'int_auto_end',
  USER_TIER_RETURN = 'user_tier_return',
  USER_INACTIVE_RETURN = 'user_inactive_return',
}

export enum Timezone {
  UTC = 'UTC',
  PST = 'America/Los_Angeles',
  EST = 'America/New_York',
  CST = 'America/Chicago',
  MST = 'America/Denver',
}

export class SchedulerModel {
  constructor() {}

  async asyncSchedule(input: any) {
    const command = new StartExecutionCommand({
      stateMachineArn: process.env.SCHEDULER_FUNCTION_ARN,
      input,
    });
    await sfn.send(command);
  }

  async getSchedule({
    orgId,
    event,
    customEventName,
  }: {
    orgId: ObjectId;
    event: ScheduleEvent;
    customEventName?: string;
  }) {
    const command = new GetScheduleCommand({
      Name: customEventName || `${orgId.toString()}-${event}`,
    });

    try {
      const res = await scheduler.send(command);
      return res;
    } catch(error) {
      logger.warn('No schedule found', { error });
      return null;
    }
  }

  async removeSchedule({
    event,
    orgId,
    customEventName,
    ignoreError = false,
  }: {
    event?: ScheduleEvent;
    orgId?: ObjectId;
    customEventName?: string;
    ignoreError?: boolean;
  }) {
    try {
      const command = new DeleteScheduleCommand({
        Name: customEventName || `${orgId?.toString()}-${event}`,
      });
  
      await scheduler.send(command);
    } catch(error) {
      if (!ignoreError) {
        throw error;
      }
    }
  }

  async updateScheduledEvent({
    event,
    orgId,
    eventTime,
    eventTimeZone,
    eventInput,
    customEventName,
    enabled = ScheduleState.ENABLED,
  } : {
    event: ScheduleEvent;
    orgId: ObjectId;
    customEventName?: string;
    eventTime: string;
    eventTimeZone: Timezone;
    eventInput: any;
    enabled?: ScheduleState;
  }) {
    try {
      const foundSchedule = await this.getSchedule({
        orgId,
        event,
        customEventName,
      });
      const input: CreateScheduleCommandInput | UpdateScheduleCommandInput = {
        Name: customEventName || `${orgId.toString()}-${event}`,
        ScheduleExpression: eventTime,
        FlexibleTimeWindow: {
          Mode: FlexibleTimeWindowMode.FLEXIBLE,
          MaximumWindowInMinutes: 1,
        },
        ActionAfterCompletion: ActionAfterCompletion.DELETE,
        ScheduleExpressionTimezone: eventTimeZone,
        Target: {
          Arn: process.env.SCHEDULED_LAMBDA_ARN,
          RoleArn: process.env.SCHEDULED_ROLE_ARN,
          Input: JSON.stringify(eventInput),
        } as Target,
        State: enabled,
      };
  
      logger.info('Updating schedule', { input });

      if (
        foundSchedule &&
        foundSchedule.ScheduleExpression === eventTime &&
        foundSchedule.Target?.Input === JSON.stringify(eventInput) &&
        foundSchedule.ScheduleExpressionTimezone === eventTimeZone
      ) {
        logger.info('No update needed for schedule', { event, orgId, customEventName });
        return foundSchedule;
      }
  
      const command = foundSchedule ? new UpdateScheduleCommand(input) : new CreateScheduleCommand(input);
      const res = await scheduler.send(command);
      return res;
    } catch(error) {
      logger.error('Failed to update schedule', { error });
    }
  }
}
