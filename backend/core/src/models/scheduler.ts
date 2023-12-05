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

const scheduler = new SchedulerClient({});
const sfn = new SFNClient({});

export enum ScheduleEvent {
  LOTTO_START = 'lotto_start',
  LOTTO_END = 'lotto_end',
  LOTTO_NOTIFY = 'lotto_notify',
  SHIFT_REMINDER = 'shift_reminder',
  EVENT_COMPLETE = 'event_complete',
  USER_TIER_RETURN = 'user_tier_return',
  USER_INACTIVE_RETURN = 'user_inactive_return',
}

export enum Timezone {
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
    orgId: string;
    event: ScheduleEvent;
    customEventName?: string;
  }) {
    const command = new GetScheduleCommand({
      Name: customEventName || `${orgId}-${event}`,
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
    orgId?: string;
    customEventName?: string;
    ignoreError?: boolean;
  }) {
    try {
      const command = new DeleteScheduleCommand({
        Name: customEventName || `${orgId}-${event}`,
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
    orgId: string;
    customEventName?: string;
    eventTime: string;
    eventTimeZone: Timezone;
    eventInput: any;
    enabled?: ScheduleState;
  }) {
    const foundSchedule = await this.getSchedule({
      orgId,
      event,
      customEventName,
    });
    const input: CreateScheduleCommandInput | UpdateScheduleCommandInput = {
      Name: customEventName || `${orgId}-${event}`,
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

    const command = foundSchedule ? new UpdateScheduleCommand(input) : new CreateScheduleCommand(input);
    const res = await scheduler.send(command);
    return res;
  }
}
