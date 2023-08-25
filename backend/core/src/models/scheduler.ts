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
import logger from "../utils/logger";

const scheduler = new SchedulerClient({});

export enum ScheduleEvent {
  LOTTO_START = 'lotto_start',
  LOTTO_END = 'lotto_end',
  LOTTO_NOTIFY = 'lotto_notify',
  SHIFT_REMINDER = 'shift_reminder',
}

export enum Timezone {
  PST = 'America/Los_Angeles',
  EST = 'America/New_York',
  CST = 'America/Chicago',
  MST = 'America/Denver',
}

export class SchedulerModel {
  constructor() {}

  async getSchedule({
    orgId,
    event,
  }: {
    orgId: string;
    event: ScheduleEvent;
  }) {
    const command = new GetScheduleCommand({
      Name: `${orgId}-${event}`,
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
  }: {
    event: ScheduleEvent;
    orgId: string;
  }) {
    const command = new DeleteScheduleCommand({
      Name: `${orgId}-${event}`,
    });

    await scheduler.send(command);
  }

  async updateScheduledEvent({
    event,
    orgId,
    eventTime,
    eventTimeZone,
    eventInput,
    enabled = ScheduleState.ENABLED,
  } : {
    event: ScheduleEvent;
    orgId: string;
    eventTime: string;
    eventTimeZone: Timezone;
    eventInput: any;
    enabled?: ScheduleState;
  }) {
    const foundSchedule = await this.getSchedule({
      orgId,
      event,
    });
    const input: CreateScheduleCommandInput | UpdateScheduleCommandInput = {
      Name: `${orgId}-${event}`,
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
